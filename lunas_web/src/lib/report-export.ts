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

// Quoting alone does not prevent spreadsheet formula interpretation.
function csvCell(value: string) {
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function reportCsv(document: ReportDocument) {
  return "\uFEFF" + [reportColumns(document.kind), ...document.reports.map(report => reportCells(report, document.kind))].map(row => row.map(csvCell).join(",")).join("\r\n");
}

const html = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

export function reportHtml(document: ReportDocument, nonce: string) {
  const summary = reportSummary(document.reports);
  const title = reportTitle(document.kind);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>LUNAS · ${html(title)}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#eef2f7;color:#17263b;font:14px/1.5 Arial,sans-serif}.toolbar{max-width:1200px;margin:20px auto;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 20px}.toolbar p{margin:0;color:#526279}.toolbar button{border:0;border-radius:8px;background:#164e9e;color:white;padding:12px 18px;font:600 14px Arial;cursor:pointer}.document{max-width:1200px;margin:20px auto 40px;background:white;padding:40px;border:1px solid #dbe3ee;border-radius:12px}.brand{font-size:24px;letter-spacing:4px;font-weight:800;color:#164e9e}.subtitle{color:#526279;font-size:12px}.heading{border-bottom:3px solid #164e9e;padding-bottom:22px;margin-bottom:24px}h1{margin:18px 0 6px;font-size:28px;line-height:1.2}.organization{font-size:16px;font-weight:600}.metadata{display:flex;flex-wrap:wrap;gap:8px 28px;margin-top:16px;font-size:12px;color:#526279}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}.metric{border:1px solid #dbe3ee;border-left:3px solid #164e9e;padding:12px}.metric span{display:block;color:#526279;font-size:11px;text-transform:uppercase;letter-spacing:.6px}.metric strong{font-size:24px}table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:11px}th{background:#eaf0f9;text-align:left;color:#153d75;font-size:10px;text-transform:uppercase;letter-spacing:.3px}th,td{padding:10px 8px;border-bottom:1px solid #dbe3ee;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}tbody tr:nth-child(even){background:#f7f9fc}th:first-child{width:17%}th:nth-last-child(2){width:24%}th:last-child{width:15%}.empty{text-align:center;padding:32px;color:#526279}.footer{margin-top:24px;border-top:1px solid #dbe3ee;padding-top:12px;color:#526279;font-size:11px}.table-wrap{overflow-x:auto} @media(max-width:650px){.document{padding:20px;margin:12px}.summary{grid-template-columns:repeat(2,1fr)}table{min-width:800px}.toolbar{flex-wrap:wrap}h1{font-size:24px}}
  @page{size:A4 landscape;margin:14mm} @media print{body{background:white;font-size:11px}.toolbar{display:none}.document{max-width:none;margin:0;padding:0;border:0;border-radius:0}.table-wrap{overflow:visible}table{min-width:0;font-size:9px}th,td{padding:7px 5px}thead{display:table-header-group}tr,.summary,.heading{break-inside:avoid}h1{font-size:23px}.metric strong{font-size:20px}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style></head><body><div class="toolbar"><p>Print this report or choose “Save as PDF” in your browser.</p><button id="print-report" type="button">Print / Save as PDF</button></div><main class="document"><header class="heading"><div class="brand">LUNAS</div><div class="subtitle">Infrastructure Maintenance &amp; Monitoring · Dagupan City</div><h1>${html(title)}</h1><div class="organization">${html(document.organization)}</div><div class="metadata"><span>${html(reportLabel(document.period))} · ${html(document.from)} to ${html(document.to)} (inclusive UTC dates)</span><span>Generated ${html(reportDate(document.generatedAt))} PHT</span></div></header><section class="summary" aria-label="Report summary">${[["Total reports", summary.total], ["Open reports", summary.open], ["Resolved / closed", summary.closed], ["Rejected / duplicate", summary.excluded]].map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join("")}</section><div class="table-wrap"><table><caption style="text-align:left;font-weight:bold;margin-bottom:10px">Report register</caption><thead><tr>${reportColumns(document.kind).map(column => `<th scope="col">${html(column)}</th>`).join("")}</tr></thead><tbody>${document.reports.length ? document.reports.map(report => `<tr>${reportCells(report, document.kind).map(cell => `<td>${html(cell)}</td>`).join("")}</tr>`).join("") : `<tr><td class="empty" colspan="${reportColumns(document.kind).length}">No reports matched this reporting period.</td></tr>`}</tbody></table></div><footer class="footer">Generated from records available to your authorized LUNAS workspace. Summary describes the exported records; agency work completion does not establish official report closure. Submission times use Philippine time (UTC+8).</footer></main><script nonce="${nonce}">document.getElementById('print-report').addEventListener('click',function(){window.print()});</script></body></html>`;
}
