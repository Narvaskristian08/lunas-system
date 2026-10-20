const asyncHandler = require('../middleware/asyncHandler');
const { getOperationalReport } = require('../services/operationalReportService');
const { csvReport, pdfReport } = require('../services/reportExportService');
exports.report = format => asyncHandler(async (req, res) => {
  const result = await getOperationalReport(req.user, req.query, format);
  res.set('Cache-Control', 'private, no-store');
  if (!format) return res.json({ success: true, data: result });
  const bytes = format === 'csv' ? csvReport(result) : await pdfReport(result);
  res.set('Content-Type', format === 'csv' ? 'text/csv; charset=utf-8' : 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="lunas-${result.metadata.period}-${result.metadata.basis}.${format}"`);
  res.set('X-Content-Type-Options', 'nosniff');
  return res.send(bytes);
});
