const PDFDocument = require('pdfkit');
const columns = ['reportNumber', 'category', 'originalCategory', 'barangay', 'agency', 'status', 'agencyStatus', 'maintenanceState', 'assignmentState', 'slaState', 'recordedBreach', 'createdAt'];
const text = value => value instanceof Date ? value.toISOString() : value == null ? '' : String(value);
function csvCell(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  let result = text(value);
  if (/^[\s\p{Cc}\p{Cf}]*[=+\-@]/u.test(result) || /^[\p{Cc}\p{Cf}]/u.test(result)) result = `'${result}`;
  return `"${result.replaceAll('"', '""')}"`;
}
function ensureBounded(report) {
  let characters = 0;
  for (const row of report.rows) for (const column of columns) {
    const length = text(row[column]).length; characters += length;
    if (length > 4096 || characters > 4 * 1024 * 1024) throw Object.assign(new Error('Report text exceeds export limits; narrow the report or reconcile the affected record'), { statusCode: 413 });
  }
}
function csvReport(report) {
  ensureBounded(report);
  const m = report.metadata;
  const lines = [['Record type', ...columns], ['Period', m.period, m.start, m.end, m.timezone, m.basis, m.scope], ['Filters', JSON.stringify(m.filters)], ['Generated', m.generatedAt], ['Semantics', m.semantics]];
  for (const [key, value] of Object.entries(report.totals)) if (key !== '_id') lines.push(['Summary', key, value]);
  for (const group of ['categories', 'barangays', 'agencies', 'statuses', 'agencyStatuses', 'maintenance', 'assignments', 'sla']) for (const item of report[group] || []) lines.push(['Distribution', group, item._id || 'Not recorded', item.count]);
  for (const row of report.rows) lines.push(['Incident', ...columns.map(column => row[column])]);
  return Buffer.from('\uFEFF' + lines.map(line => [...line, ...Array(Math.max(0, columns.length + 1 - line.length)).fill('')].map(csvCell).join(',')).join('\r\n') + '\r\n', 'utf8');
}
async function pdfReport(report) {
  ensureBounded(report);
  const font = process.env.OPERATIONAL_REPORT_FONT_PATH;
  if (!font && Array.from(JSON.stringify({ rows: report.rows, scope: report.metadata.scope, filters: report.metadata.filters })).some(character => character.codePointAt(0) > 255)) throw Object.assign(new Error('This PDF requires a configured Unicode report font; CSV preserves Unicode'), { statusCode: 422 });
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: false, info: { Title: 'LUNAS Operational Report', Author: 'LUNAS' } });
    const chunks = []; let bytes = 0; let page = 0; let failed = false;
    const abort = error => { if (!failed) { failed = true; reject(error); doc.destroy(); } };
    doc.on('error', reject);
    doc.on('data', chunk => { bytes += chunk.length; if (bytes > 16 * 1024 * 1024) abort(Object.assign(new Error('PDF exceeds 16 MiB; narrow filters'), { statusCode: 413 })); else chunks.push(chunk); });
    doc.on('end', () => { if (!failed) resolve(Buffer.concat(chunks)); });
    try {
      if (font) doc.font(font);
      const heading = () => {
        page++;
        if (page > 250) throw Object.assign(new Error('PDF exceeds 250 pages; narrow filters'), { statusCode: 413 });
        doc.fontSize(15).fillColor('#123b58').text('LUNAS | Operational Report', 40, 35);
        doc.fontSize(8).fillColor('#334155').text(`Page ${page} | ${report.metadata.timezone} | ${report.metadata.scope}`, 40, 57);
        doc.moveTo(40, 77).lineTo(555, 77).strokeColor('#cbd5e1').stroke(); doc.y = 88;
      };
      let tableMode = false;
      const tableHeader = () => {
        const y = doc.y;
        doc.fontSize(8).fillColor('#123b58');
        ['Report / Category / Submitted', 'Barangay / Agency', 'Recorded states / SLA'].forEach((value, index) => doc.text(value, 40 + index * 172, y, { width: 165, lineBreak: false }));
        doc.moveTo(40, y + 15).lineTo(555, y + 15).strokeColor('#cbd5e1').stroke(); doc.y = y + 22;
      };
      const nextPage = () => { doc.addPage(); heading(); if (tableMode) tableHeader(); };
      const line = (value, size = 9) => {
        doc.fontSize(size).fillColor('#172b3a');
        const chunksOfText = text(value).match(/[^\r\n]{1,100}|[\r\n]/gu) || [''];
        for (const part of chunksOfText) {
          const height = Math.max(13, doc.heightOfString(part, { width: 515 }) + 3);
          if (doc.y + height > 790) nextPage();
          doc.text(part, 40, doc.y, { width: 515 }); doc.moveDown(0.25);
        }
      };
      heading(); const m = report.metadata;
      line(`${m.period} | ${m.basis} event selection`, 12);
      line(`Inclusive start: ${text(m.start)} | Exclusive end: ${text(m.end)}`);
      line(`Generated: ${text(m.generatedAt)} | Filters: ${JSON.stringify(m.filters)}`);
      line(m.semantics);
      line('Summary (entire filtered dataset)', 12);
      for (const [key, value] of Object.entries(report.totals)) if (key !== '_id') line(`${key}: ${value}`);
      for (const group of ['categories', 'barangays', 'agencies', 'statuses', 'agencyStatuses', 'maintenance', 'assignments', 'sla']) {
        line(`${group}: ${(report[group] || []).map(item => `${item._id || 'Not recorded'} = ${item.count}`).join('; ')}`);
      }
      line(`Incident detail | Complete export: ${report.rows.length} records`, 12);
      if (!report.rows.length) line('No matching incidents.');
      tableMode = true;
      if (doc.y > 700) nextPage(); else tableHeader();
      const wrap = value => {
        const lines = []; let current = '';
        for (const character of text(value)) {
          if (character === '\n' || character === '\r' || doc.widthOfString(current + character) > 158) { lines.push(current); current = ''; }
          if (character !== '\n' && character !== '\r') current += character;
        }
        lines.push(current); return lines;
      };
      for (const [index, row] of report.rows.entries()) {
        doc.fontSize(8).fillColor('#172b3a');
        const cells = [
          [`${index + 1}. ${text(row.reportNumber)}`, `Category: ${text(row.category)}`, `Original: ${text(row.originalCategory) || 'not recorded'}`, `Submitted: ${text(row.createdAt)}`],
          [`Barangay: ${text(row.barangay)}`, `Agency: ${text(row.agency) || 'not recorded'}`],
          [`Incident: ${text(row.status)}`, `Agency: ${text(row.agencyStatus) || 'not recorded'}`, `Maintenance: ${row.maintenanceState}`, `Assignment: ${row.assignmentState}`, `SLA: ${row.slaState}`, `Recorded breach: ${Boolean(row.recordedBreach)}`]
        ].map(cell => cell.flatMap(wrap));
        const height = Math.max(...cells.map(cell => cell.length)); let offset = 0;
        while (offset < height) {
          if (doc.y > 750) nextPage();
          const y = doc.y; const count = Math.min(height - offset, Math.floor((780 - y) / 11));
          doc.fontSize(8).fillColor('#172b3a');
          cells.forEach((cell, column) => cell.slice(offset, offset + count).forEach((value, lineIndex) => doc.text(value, 40 + column * 172, y + lineIndex * 11, { width: 165, lineBreak: false })));
          const end = y + count * 11 + 6;
          doc.moveTo(40, end).lineTo(555, end).strokeColor('#e2e8f0').stroke(); doc.y = end + 7; offset += count;
          if (offset < height) nextPage();
        }
      }
      doc.end();
    } catch (error) { abort(error); }
  });
}
module.exports = { csvCell, csvReport, pdfReport, columns };
