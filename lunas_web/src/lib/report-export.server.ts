import "server-only";
import { randomBytes } from "node:crypto";
import { backendRequest, responseData, BackendApiError } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";
import { readReportPeriod, reportAnchor, reportCategorySummary, reportRange, reportCsv, reportHtml, reportTitle, reportColumns, reportCells, reportSummary, reportDate, type ExportReport, type ReportDocument, type ReportKind, type ReportPeriod } from "@/lib/report-export";

export async function loadPeriodReports(period: ReportPeriod, range = reportRange(period)): Promise<ExportReport[]> {
  const accessToken = await requireAccessToken();
  const reports: ExportReport[] = [];
  const ids = new Set<string>();
  const limit = 100;
  let expectedTotal: number | undefined;
  for (let page = 1; page <= 100; page++) {
    const query = new URLSearchParams({ ...range, timezone: "Asia/Manila", limit: String(limit), page: String(page), sortBy: "-createdAt" });
    const response = await backendRequest<ExportReport[] | { incidents?: ExportReport[]; data?: ExportReport[]; pagination?: { total?: number } }>(`/incidents?${query}`, { accessToken, signal: AbortSignal.timeout(15000) });
    const payload = responseData(response);
    const rows = Array.isArray(payload) ? payload : payload.incidents ?? payload.data;
    if (!Array.isArray(rows)) throw new BackendApiError(502, "The report list could not be read. Please try again.");
    const metadata = (response as typeof response & { pagination?: { total?: number } }).pagination ?? (!Array.isArray(payload) ? payload.pagination : undefined);
    const total = metadata?.total;
    if (total !== undefined && (!Number.isSafeInteger(total) || total < 0)) throw new BackendApiError(502, "Invalid report count returned by the service.");
    if (page === 1) expectedTotal = total;
    if (total !== expectedTotal) throw new BackendApiError(409, "Reports changed while preparing the export. Please try again.");
    if (total !== undefined && total > 10000) throw new BackendApiError(413, "This period contains more than 10,000 reports. Choose a shorter period to export.");
    for (const report of rows) {
      const id = report.id ?? report._id ?? report.reportNumber;
      if (!id || ids.has(id)) throw new BackendApiError(409, "Reports changed while preparing the export. Please try again.");
      ids.add(id);
      reports.push(report);
    }
    if (expectedTotal !== undefined && reports.length >= expectedTotal) {
      if (reports.length !== expectedTotal) throw new BackendApiError(409, "Reports changed while preparing the export. Please try again.");
      return reports;
    }
    if (rows.length < limit) {
      if (expectedTotal !== undefined) throw new BackendApiError(409, "The report list was incomplete. Please try again.");
      return reports;
    }
  }
  throw new BackendApiError(413, "This export is too large. Choose a shorter reporting period.");
}

async function reportWorkbook(document: ReportDocument) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  workbook.creator = "LUNAS";
  workbook.created = new Date(document.generatedAt);
  const sheet = workbook.addWorksheet("Report register", {
    views: [{ state: "frozen", ySplit: 7 }],
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "7:7" },
    headerFooter: { oddFooter: "&LLUNAS · Authorized workspace export&RPage &P of &N" },
  });
  const columns = reportColumns(document.kind);
  const lastColumn = columns.length;
  ["LUNAS", reportTitle(document.kind), document.organization, `${document.from} to ${document.to} (inclusive Philippine dates)`, `Generated ${reportDate(document.generatedAt)} PHT · ${document.reports.length} reports`].forEach((line, index) => {
    const row = index + 1;
    sheet.mergeCells(row, 1, row, lastColumn);
    const cell = sheet.getCell(row, 1);
    cell.value = line;
    cell.font = { name: "Calibri", size: index === 0 ? 22 : index === 1 ? 16 : 11, bold: index < 3, color: { argb: "FF164E9E" } };
    cell.alignment = { vertical: "middle", wrapText: true };
    sheet.getRow(row).height = index < 2 ? 30 : 24;
  });
  const header = sheet.getRow(7);
  header.values = columns;
  header.height = 30;
  header.eachCell(cell => {
    cell.font = { name: "Calibri", bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF164E9E" } };
    cell.alignment = { wrapText: true, vertical: "middle" };
  });
  document.reports.forEach((report, index) => {
    const row = sheet.addRow(reportCells(report, document.kind));
    row.eachCell(cell => {
      // All user values remain text cells, never formulas or hyperlinks.
      cell.numFmt = "@";
      cell.font = { name: "Calibri", size: 11, color: { argb: "FF17263B" } };
      cell.alignment = { vertical: "top", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index % 2 ? "FFF0F4FA" : "FFFFFFFF" } };
      cell.border = { bottom: { style: "hair", color: { argb: "FFDCE4EF" } } };
    });
  });
  sheet.columns.forEach((column, index) => { column.width = index === lastColumn - 2 ? 65 : index === lastColumn - 3 ? 40 : index === 0 ? 36 : 25; });
  sheet.autoFilter = { from: { row: 7, column: 1 }, to: { row: Math.max(7, sheet.rowCount), column: lastColumn } };
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [{ width: 32 }, { width: 70 }];
  const counts = reportSummary(document.reports);
  [["LUNAS", reportTitle(document.kind)], ["Organization", document.organization], ["Period (Philippine dates)", `${document.from} to ${document.to}`], ["Generated (PHT)", reportDate(document.generatedAt)], ["Total reports", counts.total], ["Open reports", counts.open], ["Resolved / closed", counts.closed], ["Rejected / duplicate", counts.excluded], ["Scope", "Records available to the authenticated workspace at export time."], ["Category", "Total incidents"], ...reportCategorySummary(document.reports).map(row => [row.label, row.total])].forEach(values => {
    const row = summary.addRow(values);
    row.getCell(1).font = { bold: true, color: { argb: "FF164E9E" } };
    row.alignment = { wrapText: true, vertical: "top" };
    row.height = 28;
  });
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

export async function exportPeriodReport(request: Request, kind: ReportKind) {
  const viewer = await requirePermission(kind === "agency" ? "work_orders.view" : "reports.view");
  const params = new URL(request.url).searchParams;
  const period = readReportPeriod(params.get("period"));
  const format = params.get("format") || "csv";
  const headers: Record<string, string> = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (!["csv", "xlsx", "print"].includes(format)) return new Response("Unsupported export format.", { status: 400, headers });
  try {
    const generatedAt = new Date().toISOString();
    const range = reportRange(period, reportAnchor(params.get("date")) ?? new Date(generatedAt));
    const document: ReportDocument = { kind, period, organization: viewer.organization || (kind === "agency" ? "Authorized agency" : "Assigned barangay"), ...range, generatedAt, reports: await loadPeriodReports(period, range) };
    const filename = `lunas-${kind}-reports-${period}-${document.to}`;
    if (format === "print") {
      const nonce = randomBytes(18).toString("base64");
      return new Response(reportHtml(document, nonce), { headers: { ...headers, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`, "Referrer-Policy": "no-referrer" } });
    }
    if (format === "xlsx") return new Response(await reportWorkbook(document), { headers: { ...headers, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${filename}.xlsx"` } });
    return new Response(reportCsv(document), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}.csv"` } });
  } catch (error) {
    const status = error instanceof BackendApiError ? error.status : 503;
    return new Response(error instanceof BackendApiError ? error.message : "The export could not be generated. Please try again.", { status, headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
  }
}
