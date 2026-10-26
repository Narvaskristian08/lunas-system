const Incident = require('../models/Incident');
const asyncHandler = require('../middleware/asyncHandler');
const { buildIncidentScope, combineIncidentFilters } = require('../services/jurisdictionService');
const { refreshReporterRestriction, countConfirmedFindings } = require('../services/reportingRestrictionService');
const allowed = (user) => ['barangay_official', 'city_engineer', 'admin'].includes(user?.role);
const incidentReviewScope = (req) => req.user?.role === 'admin' ? {} : buildIncidentScope(req.user);
const scope = (req, extra = {}) => combineIncidentFilters({ _id: req.params.id }, incidentReviewScope(req), extra);
const notFound = (res) => res.status(404).json({ success: false, message: 'Incident not found' });
exports.getReview = asyncHandler(async (req, res) => {
  if (!allowed(req.user)) return res.status(403).json({ success: false, message: 'Review access denied' });
  const incident = await Incident.findOne(scope(req));
  if (!incident) return notFound(res);
  // Counts include only active, explicitly documented findings in caller scope.
  const count = await Incident.countDocuments(combineIncidentFilters(incidentReviewScope(req), {
    reporter: incident.reporter, 'falseReportReview.finding': 'confirmed_fabrication'
  }));
  const total = await countConfirmedFindings(incident.reporter);
  res.json({ success: true, data: { review: incident.falseReportReview || null, confirmedFindingsInScope: count, confirmedFindingsTotal: total } });
});
exports.saveReview = asyncHandler(async (req, res) => {
  if (!allowed(req.user)) return res.status(403).json({ success: false, message: 'Review access denied' });
  const { finding, reason, evidenceReference, expectedVersion } = req.body;
  if (!['confirmed_fabrication', 'corrected'].includes(finding)
      || typeof reason !== 'string' || reason.trim().length < 20 || reason.length > 2000
      || typeof evidenceReference !== 'string' || !evidenceReference.trim() || evidenceReference.length > 500
      || !Number.isInteger(expectedVersion) || expectedVersion < 0) {
    return res.status(400).json({ success: false, message: 'Provide a documented review reason (20-2000 characters), evidence reference, and current version' });
  }
  const incident = await Incident.findOne(scope(req));
  if (!incident) return notFound(res);
  if (finding === 'confirmed_fabrication' && req.user.role !== 'barangay_official') {
    return res.status(403).json({ success: false, message: 'Only the assigned Infrastructure Committee member can record an initial finding' });
  }
  if (finding === 'corrected' && !['city_engineer', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Only City Engineering or Admin can correct a finding' });
  }
  if (finding === 'confirmed_fabrication' && incident.status !== 'rejected') {
    return res.status(409).json({ success: false, message: 'A fabrication finding requires a separately rejected report' });
  }
  if (finding === 'corrected' && incident.falseReportReview?.finding !== 'confirmed_fabrication') {
    return res.status(409).json({ success: false, message: 'There is no active finding to correct' });
  }
  const entry = { finding, reason: reason.trim(), evidenceReference: evidenceReference.trim(),
    reviewedBy: req.user._id, reviewedAt: new Date() };
  // Atomic revision check and append preserve corrections even if audit logging fails.
  const versionFilter = expectedVersion === 0
    ? { $or: [{ 'falseReportReview.version': { $exists: false } }, { 'falseReportReview.version': 0 }] }
    : { 'falseReportReview.version': expectedVersion };
  const updated = await Incident.findOneAndUpdate(scope(req, {
    ...versionFilter, status: incident.status
  }), {
    $set: { 'falseReportReview.finding': finding },
    $inc: { 'falseReportReview.version': 1 },
    $push: { 'falseReportReview.history': entry }
  }, { new: true, runValidators: true });
  if (!updated) return res.status(409).json({ success: false, message: 'Review changed; reload before saving' });
  await refreshReporterRestriction({
    reporterId: incident.reporter,
    assignedBarangay: incident.jurisdiction?.barangay || incident.location?.address?.barangay
  });
  res.json({ success: true, data: { review: updated.falseReportReview } });
});
