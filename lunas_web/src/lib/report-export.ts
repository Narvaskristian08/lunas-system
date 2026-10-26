import { categoryLabel } from "@/lib/category-label";

export type ReportPeriod = "daily" | "weekly" | "monthly";
export type ReportKind = "barangay" | "agency";
export interface ExportReport {
  id?: string;
  _id?: string;
  reportNumber?: string;
  category?: string;
  status?: string;
  agencyStatus?: string;
  description?: string;
  createdAt?: string;
  sla?: { state?: string; isOverdue?: boolean; deadline?: string };
  location?: { address?: { street?: string; barangay?: string; city?: string } };
}
export interface ReportDocument {
  kind: ReportKind;
  period: ReportPeriod;
  organization: string;
  from: string;
  to: string;
  generatedAt: string;
  reports: ExportReport[];
}

export const reportLabel = (value?: string) => value ? value.replace(/[_-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()) : "Not recorded";
export const readReportPeriod = (value: unknown): ReportPeriod => value === "daily" || value === "weekly" ? value : "monthly";
export const reportTitle = (kind: ReportKind) => kind === "agency" ? "Agency Activity Report" : "Barangay Incident Report";

export function reportRange(period: ReportPeriod, now = new Date()) {
  // The existing API interprets from/to as inclusive UTC calendar dates.
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - (period === "daily" ? 0 : period === "weekly" ? 6 : 29));
  return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

export function reportDate(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
}

export function reportColumns(kind: ReportKind) {
  return ["Report reference", "Category", "Report status", ...(kind === "agency" ? ["Agency status"] : []), "Location", "Description", "Submitted (Philippine time)"];
}

export function reportCells(report: ExportReport, kind: ReportKind): string[] {
  const address = report.location?.address;
  return [report.reportNumber || report.id || report._id || "Not recorded", categoryLabel(report.category), reportLabel(report.status), ...(kind === "agency" ? [reportLabel(report.agencyStatus)] : []), [address?.street, address?.barangay, address?.city].filter(Boolean).join(", ") || "Not recorded", report.description || "Not recorded", reportDate(report.createdAt)];
}

export function reportSummary(reports: ExportReport[]) {
  const closed = reports.filter(report => report.status === "closed" || report.status === "resolved").length;
  const excluded = reports.filter(report => report.status === "rejected" || report.status === "duplicate").length;
  return { total: reports.length, open: reports.length - closed - excluded, closed, excluded };
}

const chartColors = ["#164e9e", "#0f766e", "#d97706", "#be123c", "#7c3aed", "#475569", "#0891b2", "#65a30d"];
const statusLabels: Record<string, string> = {
  submitted: "Pending validation",
  clarification_required: "Clarification required",
  barangay_validated: "Validated",
  city_confirmed: "City confirmed",
  prioritized: "Prioritized",
  provider_assigned: "Agency assigned",
  repair_assigned: "Repair assigned",
  in_progress: "In progress",
  repair_completed: "Under review",
  verified: "Verified",
  resolved: "Resolved",
  closed: "Resolved / closed",
  rejected: "Rejected",
  duplicate: "Duplicate",
};

type ChartDatum = { label: string; value: number; color?: string };

const chartHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
const chartNumber = (value: number) => new Intl.NumberFormat("en-PH").format(value);

function noChartData(title: string, message = "No data available for the selected report scope and period.") {
  return `<section class="chart-card" aria-label="${chartHtml(title)}"><h3>${chartHtml(title)}</h3><div class="chart-empty">${chartHtml(message)}</div></section>`;
}

function donutChart(title: string, data: ChartDatum[]) {
  const values = data.filter(item => item.value > 0);
  if (!values.length) return noChartData(title);
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = values.map((item, index) => {
    const length = circumference * item.value / total;
    const segment = `<circle cx="96" cy="96" r="${radius}" fill="none" stroke="${item.color || chartColors[index % chartColors.length]}" stroke-width="28" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}" />`;
    offset += length;
    return segment;
  }).join("");
  const legend = values.map((item, index) => `<li><span class="legend-dot" style="background:${item.color || chartColors[index % chartColors.length]}"></span><span>${chartHtml(item.label)}</span><strong>${chartNumber(item.value)}</strong></li>`).join("");
  return `<section class="chart-card" aria-label="${chartHtml(title)}"><h3>${chartHtml(title)}</h3><div class="donut-layout"><svg class="chart-svg donut-svg" viewBox="0 0 192 192" role="img" aria-label="${chartHtml(title)}">${segments}<circle cx="96" cy="96" r="45" fill="white" /><text x="96" y="92" text-anchor="middle" class="donut-total">${chartNumber(total)}</text><text x="96" y="111" text-anchor="middle" class="donut-caption">reports</text></svg><ul class="chart-legend">${legend}</ul></div></section>`;
}

function horizontalBarChart(title: string, data: ChartDatum[], wide = false) {
  const values = data.filter(item => item.value >= 0);
  if (!values.some(item => item.value > 0)) return noChartData(title);
  const rowHeight = wide ? 20 : 28;
  const height = Math.max(150, values.length * rowHeight + 42);
  const max = Math.max(...values.map(item => item.value), 1);
  const labelWidth = wide ? 180 : 155;
  const chartWidth = 600;
  const rows = values.map((item, index) => {
    const y = 24 + index * rowHeight;
    const width = item.value ? Math.max(2, (item.value / max) * chartWidth) : 0;
    return `<text x="0" y="${y + 14}" class="axis-label">${chartHtml(item.label)}</text><rect x="${labelWidth}" y="${y}" width="${width}" height="16" rx="3" fill="${item.color || chartColors[index % chartColors.length]}" /><text x="${labelWidth + width + 7}" y="${y + 13}" class="bar-value">${chartNumber(item.value)}</text>`;
  }).join("");
  return `<section class="chart-card${wide ? " chart-wide" : ""}" aria-label="${chartHtml(title)}"><h3>${chartHtml(title)}</h3><svg class="chart-svg bar-svg" viewBox="0 0 ${labelWidth + chartWidth + 50} ${height}" role="img" aria-label="${chartHtml(title)}"><line x1="${labelWidth}" y1="15" x2="${labelWidth}" y2="${height - 12}" class="axis-line" />${rows}</svg></section>`;
}

function trendChart(title: string, reports: ExportReport[], period: ReportPeriod) {
  const useWeeklyBuckets = period === "monthly";
  const buckets = new Map<string, number>();
  for (const report of reports) {
    if (!report.createdAt || !Number.isFinite(Date.parse(report.createdAt))) continue;
    const date = new Date(report.createdAt);
    let key: string;
    if (useWeeklyBuckets) {
      const day = date.getUTCDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + mondayOffset));
      key = monday.toISOString().slice(0, 10);
    } else {
      key = date.toISOString().slice(0, 10);
    }
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const values = [...buckets.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([label, value]) => ({ label, value }));
  if (!values.length) return noChartData(title);
  const width = 700;
  const height = 220;
  const left = 42;
  const top = 22;
  const bottom = 42;
  const chartHeight = height - top - bottom;
  const max = Math.max(...values.map(item => item.value), 1);
  const points = values.map((item, index) => {
    const x = values.length === 1 ? left + (width - left - 15) / 2 : left + index * ((width - left - 15) / (values.length - 1));
    const y = top + chartHeight - (item.value / max) * chartHeight;
    return { ...item, x, y };
  });
  const line = points.map(point => `${point.x},${point.y}`).join(" ");
  const labels = points.map((point, index) => index % Math.max(1, Math.ceil(points.length / 7)) === 0 || index === points.length - 1
    ? `<text x="${point.x}" y="${height - 12}" text-anchor="middle" class="axis-label">${chartHtml(useWeeklyBuckets ? `Week of ${point.label}` : point.label)}</text>`
    : "").join("");
  const dots = points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#164e9e"><title>${chartHtml(point.label)}: ${chartNumber(point.value)}</title></circle>`).join("");
  return `<section class="chart-card chart-wide" aria-label="${chartHtml(title)}"><h3>${chartHtml(title)}</h3><svg class="chart-svg trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${chartHtml(title)}"><line x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}" class="axis-line" /><line x1="${left}" y1="${height - bottom}" x2="${width - 15}" y2="${height - bottom}" class="axis-line" /><polyline points="${line}" fill="none" stroke="#164e9e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />${dots}${labels}</svg></section>`;
}

function statusData(reports: ExportReport[]): ChartDatum[] {
  const counts = new Map<string, number>();
  reports.forEach(report => counts.set(report.status || "unknown", (counts.get(report.status || "unknown") || 0) + 1));
  return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([status, value]) => ({ label: statusLabels[status] || reportLabel(status), value }));
}

function categoryData(reports: ExportReport[]): ChartDatum[] {
  const counts = new Map<string, number>();
  reports.forEach(report => { const label = categoryLabel(report.category); counts.set(label, (counts.get(label) || 0) + 1); });
  return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([label, value]) => ({ label, value }));
}

function slaData(reports: ExportReport[]): ChartDatum[] {
  const counts = new Map<string, number>([["SLA met", 0], ["SLA breached", 0], ["Ongoing / not finalized", 0]]);
  for (const report of reports) {
    const state = report.sla?.state;
    if (state === "met") counts.set("SLA met", (counts.get("SLA met") || 0) + 1);
    else if (state === "breached" || state === "overdue" || report.sla?.isOverdue) counts.set("SLA breached", (counts.get("SLA breached") || 0) + 1);
    else if (["not_started", "active", "approaching"].includes(state || "")) counts.set("Ongoing / not finalized", (counts.get("Ongoing / not finalized") || 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value })).filter(item => item.value > 0);
}

function barangayData(reports: ExportReport[]): ChartDatum[] {
  const counts = new Map<string, number>();
  reports.forEach(report => { const barangay = report.location?.address?.barangay?.trim(); if (barangay) counts.set(barangay, (counts.get(barangay) || 0) + 1); });
  return [...counts.entries()].sort(([leftLabel, leftValue], [rightLabel, rightValue]) => rightValue - leftValue || leftLabel.localeCompare(rightLabel)).map(([label, value]) => ({ label, value }));
}

export function reportCharts(document: ReportDocument) {
  return `<section class="analysis" aria-labelledby="graphical-analysis-title"><h2 id="graphical-analysis-title">Graphical Analysis</h2><p class="analysis-note">Charts use the same ${document.reports.length} authorized records, date range and scope as this report register.</p><div class="analysis-grid">${donutChart("Incident Status Distribution", statusData(document.reports))}${horizontalBarChart("Incident Reports by Category", categoryData(document.reports))}${trendChart(`Incident Submission Trends (${document.period === "monthly" ? "weekly buckets" : "daily buckets"})`, document.reports, document.period)}${donutChart("SLA Compliance", slaData(document.reports))}${horizontalBarChart("Incident Reports by Barangay", barangayData(document.reports), true)}</div></section>`;
}

// Quoting alone does not prevent spreadsheet formula interpretation.
function csvCell(value: string) {
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function reportCsv(document: ReportDocument) {
  return "\uFEFF" + [reportColumns(document.kind), ...document.reports.map(report => reportCells(report, document.kind))].map(row => row.map(csvCell).join(",")).join("\r\n");
}

const html = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

function reportHtmlBase(document: ReportDocument, nonce: string) {
  const summary = reportSummary(document.reports);
  const title = reportTitle(document.kind);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>LUNAS · ${html(title)}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#eef2f7;color:#17263b;font:14px/1.5 Arial,sans-serif}.toolbar{max-width:1200px;margin:20px auto;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 20px}.toolbar p{margin:0;color:#526279}.toolbar button{border:0;border-radius:8px;background:#164e9e;color:white;padding:12px 18px;font:600 14px Arial;cursor:pointer}.document{max-width:1200px;margin:20px auto 40px;background:white;padding:40px;border:1px solid #dbe3ee;border-radius:12px}.brand{font-size:24px;letter-spacing:4px;font-weight:800;color:#164e9e}.subtitle{color:#526279;font-size:12px}.heading{border-bottom:3px solid #164e9e;padding-bottom:22px;margin-bottom:24px}h1{margin:18px 0 6px;font-size:28px;line-height:1.2}.organization{font-size:16px;font-weight:600}.metadata{display:flex;flex-wrap:wrap;gap:8px 28px;margin-top:16px;font-size:12px;color:#526279}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}.metric{border:1px solid #dbe3ee;border-left:3px solid #164e9e;padding:12px}.metric span{display:block;color:#526279;font-size:11px;text-transform:uppercase;letter-spacing:.6px}.metric strong{font-size:24px}.analysis{margin:30px 0}.analysis h2{margin:0 0 4px;font-size:21px;color:#153d75}.analysis-note{margin:0 0 16px;color:#526279;font-size:12px}.analysis-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.chart-card{border:1px solid #dbe3ee;border-radius:8px;padding:14px;break-inside:avoid;min-width:0}.chart-card h3{margin:0 0 10px;color:#153d75;font-size:14px}.chart-wide{grid-column:1/-1}.chart-svg{display:block;width:100%;height:auto}.donut-layout{display:flex;align-items:center;gap:12px;min-height:192px}.donut-svg{width:45%;min-width:150px}.donut-svg circle{transform:rotate(-90deg);transform-origin:96px 96px}.donut-total{font-size:22px;font-weight:bold;fill:#17263b}.donut-caption{font-size:10px;fill:#526279}.chart-legend{list-style:none;padding:0;margin:0;flex:1;font-size:11px}.chart-legend li{display:grid;grid-template-columns:10px 1fr auto;align-items:center;gap:6px;margin:5px 0}.legend-dot{width:9px;height:9px;border-radius:50%}.bar-svg,.trend-svg{min-height:160px}.axis-line{stroke:#b8c5d6;stroke-width:1}.axis-label{fill:#526279;font-size:11px}.bar-value{fill:#17263b;font-size:11px;font-weight:bold}.chart-empty{min-height:150px;display:grid;place-items:center;text-align:center;color:#526279;font-size:12px;background:#f7f9fc;border-radius:6px}table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:11px}th{background:#eaf0f9;text-align:left;color:#153d75;font-size:10px;text-transform:uppercase;letter-spacing:.3px}th,td{padding:10px 8px;border-bottom:1px solid #dbe3ee;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}tbody tr:nth-child(even){background:#f7f9fc}th:first-child{width:17%}th:nth-last-child(2){width:24%}th:last-child{width:15%}.empty{text-align:center;padding:32px;color:#526279}.footer{margin-top:24px;border-top:1px solid #dbe3ee;padding-top:12px;color:#526279;font-size:11px}.table-wrap{overflow-x:auto} @media(max-width:650px){.document{padding:20px;margin:12px}.summary{grid-template-columns:repeat(2,1fr)}.analysis-grid{grid-template-columns:1fr}.chart-wide{grid-column:auto}table{min-width:800px}.toolbar{flex-wrap:wrap}h1{font-size:24px}}
  @page{size:A4 landscape;margin:14mm} @media print{body{background:white;font-size:11px}.toolbar{display:none}.document{max-width:none;margin:0;padding:0;border:0;border-radius:0}.analysis{break-before:page}.analysis-grid{gap:10px}.chart-card{border-color:#cbd5e1}.table-wrap{overflow:visible}table{min-width:0;font-size:9px}th,td{padding:7px 5px}thead{display:table-header-group}tr,.summary,.heading{break-inside:avoid}h1{font-size:23px}.metric strong{font-size:20px}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style></head><body><div class="toolbar"><p>Print this report or choose “Save as PDF” in your browser.</p><button id="print-report" type="button">Print / Save as PDF</button></div><main class="document"><header class="heading"><div class="brand">LUNAS</div><div class="subtitle">Infrastructure Maintenance &amp; Monitoring · Dagupan City</div><h1>${html(title)}</h1><div class="organization">${html(document.organization)}</div><div class="metadata"><span>${html(reportLabel(document.period))} · ${html(document.from)} to ${html(document.to)} (inclusive UTC dates)</span><span>Generated ${html(reportDate(document.generatedAt))} PHT</span></div></header><section class="summary" aria-label="Report summary">${[["Total reports", summary.total], ["Open reports", summary.open], ["Resolved / closed", summary.closed], ["Rejected / duplicate", summary.excluded]].map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join("")}</section><div class="table-wrap"><table><caption style="text-align:left;font-weight:bold;margin-bottom:10px">Report register</caption><thead><tr>${reportColumns(document.kind).map(column => `<th scope="col">${html(column)}</th>`).join("")}</tr></thead><tbody>${document.reports.length ? document.reports.map(report => `<tr>${reportCells(report, document.kind).map(cell => `<td>${html(cell)}</td>`).join("")}</tr>`).join("") : `<tr><td class="empty" colspan="${reportColumns(document.kind).length}">No reports matched this reporting period.</td></tr>`}</tbody></table></div><footer class="footer">Generated from records available to your authorized LUNAS workspace. Summary describes the exported records; agency work completion does not establish official report closure. Submission times use Philippine time (UTC+8).</footer></main><script nonce="${nonce}">document.getElementById('print-report').addEventListener('click',function(){window.print()});</script></body></html>`;
}

export function reportHtml(document: ReportDocument, nonce: string) {
  return reportHtmlBase(document, nonce).replace(
    '</section><div class="table-wrap">',
    `</section>${reportCharts(document)}<div class="table-wrap">`
  );
}
