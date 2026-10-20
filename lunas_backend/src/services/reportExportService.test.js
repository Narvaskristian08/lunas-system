const zlib = require('zlib');
const { csvCell, csvReport, pdfReport } = require('./reportExportService');
const sample = (count = 1) => ({ metadata: { period: 'monthly', basis: 'submitted', start: new Date('2026-09-30T16:00Z'), end: new Date('2026-10-31T16:00Z'), generatedAt: new Date('2026-10-20'), timezone: 'Asia/Manila', scope: 'Pantal', filters: { category: 'road' }, semantics: 'Current recorded state; maintenance authorization not inferred.' }, totals: { incidents: count, confirmed: 0 }, categories: [{ _id: 'road', count }], rows: Array.from({ length: count }, (_, i) => ({ reportNumber: `REPORT-${i}`, category: 'road', barangay: 'Pantal', agency: 'Agency A', status: 'submitted', maintenanceState: 'none', assignmentState: 'unassigned', slaState: 'not_started', createdAt: new Date('2026-10-20') })) });
test.each(['=SUM(1,2)', '+cmd', '-cmd', '@SUM(A1)', '  =HYPERLINK("x")', '\t=1', '\r\n+1', '\u200b=1'])('untrusted formula text is neutralized in actual CSV bytes: %s', value => {
  const report = sample(); report.rows[0].agency = value;
  const bytes = csvReport(report).toString('utf8'); expect(bytes).toContain(csvCell(value)); expect(csvCell(value).startsWith('"\'')).toBe(true);
});
test('CSV preserves quotes, separators, Unicode, line breaks, empty fields and typed numbers', () => {
  expect(csvCell('Mabuhay, "niño"\nAgency')).toBe('"Mabuhay, ""niño""\nAgency"'); expect(csvCell(null)).toBe('""'); expect(csvCell(-7)).toBe('-7');
  const report = sample(237); report.rows[0].agency = 'Mabuhay, "niño"\nAgency';
  const csv = csvReport(report).toString('utf8'); expect(csv.charCodeAt(0)).toBe(0xfeff); expect(csv.match(/"Incident",/g)).toHaveLength(237); expect(csv).toContain('REPORT-236');
});
function pdfText(bytes) {
  const latin = bytes.toString('latin1'); const decoded = [];
  for (const match of latin.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    try {
      const stream = zlib.inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1');
      for (const array of stream.matchAll(/\[([^\]]*)\]\s*TJ/g)) decoded.push([...array[1].matchAll(/<([a-f\d]+)>/gi)].map(value => Buffer.from(value[1], 'hex').toString('latin1')).join(''));
    } catch (_) { /* Metadata streams may be uncompressed. */ }
  }
  return decoded.join('\n').replace(/[^\x20-\x7e\n]/g, '');
}
test('real multi-page PDF includes complete details, period, scope, summaries and page labels', async () => {
  const bytes = await pdfReport(sample(237)); const structure = bytes.toString('latin1');
  expect(structure.startsWith('%PDF-')).toBe(true); expect(structure.trimEnd().endsWith('%%EOF')).toBe(true);
  const xrefOffset = Number(structure.match(/startxref\s+(\d+)/)[1]); expect(bytes.subarray(xrefOffset, xrefOffset + 4).toString()).toBe('xref');
  expect((structure.match(/\/Type \/Page\b/g) || []).length).toBeGreaterThan(1);
  const content = pdfText(bytes); expect(content).toContain('REPORT-236'); expect(content).toContain('Asia/Manila'); expect(content).toContain('Pantal'); expect(content).toContain('incidents: 237'); expect(content).toContain('Page 2');
  expect(content).not.toContain('storageKey'); expect(content).not.toContain('Bearer');
});
test('empty PDF remains valid and explicit', async () => { expect(pdfText(await pdfReport(sample(0)))).toContain('No matching incidents.'); });
test('long fields wrap across pages without silently truncating record content', async () => {
  const report = sample(); report.rows[0].agency = 'Long agency name '.repeat(180) + 'END-OF-LONG-AGENCY';
  expect(pdfText(await pdfReport(report))).toContain('END-OF-LONG-AGENCY');
});
test('private source fields never enter CSV or PDF output', async () => {
  const report = sample(); Object.assign(report.rows[0], { reporter: 'PRIVATE-PERSON', images: [{ key: 'SECRET-KEY', url: 'https://secret.test' }], notes: 'PRIVATE-NOTES' });
  const output = csvReport(report).toString() + pdfText(await pdfReport(report)); expect(output).not.toMatch(/PRIVATE-PERSON|SECRET-KEY|PRIVATE-NOTES|secret\.test/);
});
test('unsupported font coverage fails explicitly instead of corrupting Unicode PDF text', async () => {
  const report = sample(); report.rows[0].agency = '道路';
  const oldFont = process.env.OPERATIONAL_REPORT_FONT_PATH; delete process.env.OPERATIONAL_REPORT_FONT_PATH;
  await expect(pdfReport(report)).rejects.toMatchObject({ statusCode: 422 });
  if (oldFont) process.env.OPERATIONAL_REPORT_FONT_PATH = oldFont;
});
test('oversized export text fails explicitly in both formats', async () => {
  const report = sample(); report.rows[0].agency = 'A'.repeat(4097);
  expect(() => csvReport(report)).toThrow('export limits');
  await expect(pdfReport(report)).rejects.toMatchObject({ statusCode: 413 });
});
