const mongoose = require('mongoose');
const ReportingAppeal = require('../models/ReportingAppeal');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { createAuditLog } = require('../utils/auditLogger');
const { canonicalizeBarangay } = require('../data/dagupanBarangays');
const { getReportingRestriction } = require('../services/reportingRestrictionService');

const normalize = (value) => typeof value === 'string' ? value.trim() : '';
const safeId = (value) => (value?._id || value)?.toString?.() || value;

const serializeAppeal = (appeal) => {
  if (!appeal) return null;
  const source = appeal.toObject ? appeal.toObject() : appeal;
  const reporter = source.reporter && typeof source.reporter === 'object'
    ? {
      id: safeId(source.reporter),
      firstName: source.reporter.firstName,
      lastName: source.reporter.lastName,
      email: source.reporter.email
    }
    : source.reporter ? { id: safeId(source.reporter) } : undefined;
  return {
    id: safeId(source._id || source.id),
    reporter,
    assignedBarangay: source.assignedBarangay,
    explanation: source.explanation,
    evidenceReference: source.evidenceReference,
    source: source.source,
    status: source.status,
    version: Number(source.version) || 0,
    reviewedBy: safeId(source.reviewedBy),
    reviewedAt: source.reviewedAt,
    reviewNotes: source.reviewNotes,
    decisionHistory: source.decisionHistory || [],
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };
};

const staffScope = (user) => {
  if (user?.role === 'barangay_official') {
    const barangay = canonicalizeBarangay(user.barangay);
    return barangay ? { assignedBarangay: barangay } : { _id: null };
  }
  return {};
};

const appealQuery = (req, extra = {}) => ({
  ...staffScope(req.user),
  ...extra
});

const currentUser = async (id) => User.findById(id);

const requireBarangayOfficial = (req, res) => {
  if (req.user?.role === 'barangay_official') return true;
  res.status(403).json({
    success: false,
    code: 'REPORTING_APPEALS_BARANGAY_ONLY',
    message: 'Reporting appeals are handled by the assigned Infrastructure Committee.'
  });
  return false;
};

exports.getMyAppeal = asyncHandler(async (req, res) => {
  const appeal = await ReportingAppeal.findOne({ reporter: req.user._id })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: serializeAppeal(appeal) });
});

exports.createAppeal = asyncHandler(async (req, res) => {
  const explanation = normalize(req.body.explanation);
  const evidenceReference = normalize(req.body.evidenceReference);
  if (explanation.length < 20 || explanation.length > 2000
      || !evidenceReference || evidenceReference.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Provide an appeal explanation (20-2000 characters) and supporting evidence or reference.'
    });
  }

  const user = await currentUser(req.user._id);
  const restriction = getReportingRestriction(user);
  if (restriction.status !== 'blocked') {
    return res.status(409).json({ success: false, message: 'A reporting appeal is only available while report submission is blocked.' });
  }
  const pending = await ReportingAppeal.findOne({ reporter: user._id, status: 'pending' });
  if (pending) {
    return res.status(409).json({ success: false, message: 'Your reporting appeal is already awaiting review.' });
  }
  const assignedBarangay = canonicalizeBarangay(restriction.assignedBarangay || user.address?.barangay);
  if (!assignedBarangay) {
    return res.status(409).json({ success: false, message: 'The assigned Barangay for this appeal is unavailable.' });
  }

  const appeal = await ReportingAppeal.create({
    reporter: user._id,
    assignedBarangay,
    explanation,
    evidenceReference,
    source: 'online',
    status: 'pending'
  });
  await User.findByIdAndUpdate(user._id, { $set: {
    'reportingRestriction.assignedBarangay': assignedBarangay,
    'reportingRestriction.appealStatus': 'pending',
    'reportingRestriction.appealId': appeal._id
  } });
  await createAuditLog({
    action: 'reporting_appeal_submitted',
    performedBy: user._id,
    resourceType: 'ReportingAppeal',
    resourceId: appeal._id,
    details: { assignedBarangay, source: 'online' },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  res.status(201).json({ success: true, message: 'Appeal submitted for Barangay review.', data: serializeAppeal(appeal) });
});

exports.listAppeals = asyncHandler(async (req, res) => {
  if (!requireBarangayOfficial(req, res)) return;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const filter = appealQuery(req, {});
  if (req.query.status === 'completed') {
    filter.status = { $in: ['approved', 'rejected'] };
  } else if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (req.query.reporterId && mongoose.isValidObjectId(req.query.reporterId)) filter.reporter = req.query.reporterId;

  const [appeals, total] = await Promise.all([
    ReportingAppeal.find(filter)
      .populate('reporter', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ReportingAppeal.countDocuments(filter)
  ]);
  res.json({ success: true, data: appeals.map(serializeAppeal), pagination: {
    page, limit, total, pages: Math.max(1, Math.ceil(total / limit))
  } });
});

exports.getAppealForReporter = asyncHandler(async (req, res) => {
  if (!requireBarangayOfficial(req, res)) return;
  if (!mongoose.isValidObjectId(req.params.reporterId)) return res.status(404).json({ success: false, message: 'Appeal not found' });
  const appeal = await ReportingAppeal.findOne(appealQuery(req, { reporter: req.params.reporterId }))
    .populate('reporter', 'firstName lastName email')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: serializeAppeal(appeal) });
});

exports.reviewAppeal = asyncHandler(async (req, res) => {
  if (!requireBarangayOfficial(req, res)) return;
  const decision = normalize(req.body.decision);
  const notes = normalize(req.body.notes);
  const expectedVersion = Number(req.body.expectedVersion);
  if (!['approved', 'rejected'].includes(decision) || !Number.isInteger(expectedVersion) || expectedVersion < 0
      || notes.length > 2000) {
    return res.status(400).json({ success: false, message: 'Provide a valid appeal decision, current version, and review notes.' });
  }

  const appeal = await ReportingAppeal.findOne(appealQuery(req, { _id: req.params.id }));
  if (!appeal) return res.status(404).json({ success: false, message: 'Appeal not found' });
  if (appeal.status !== 'pending') {
    return res.status(409).json({ success: false, message: 'This appeal has already been decided.' });
  }
  const versionFilter = expectedVersion === 0
    ? { $or: [{ version: { $exists: false } }, { version: 0 }] }
    : { version: expectedVersion };
  const updated = await ReportingAppeal.findOneAndUpdate(
    { _id: appeal._id, ...versionFilter },
    {
      $set: {
        status: decision,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNotes: notes || undefined
      },
      $inc: { version: 1 },
      $push: { decisionHistory: { decision, reviewedBy: req.user._id, reviewedAt: new Date(), notes: notes || undefined } }
    },
    { new: true, runValidators: true }
  ).populate('reporter', 'firstName lastName email');
  if (!updated) return res.status(409).json({ success: false, message: 'Appeal changed; reload before saving.' });

  await User.findByIdAndUpdate(appeal.reporter, { $set: {
    'reportingRestriction.status': decision === 'approved' ? 'clear' : 'blocked',
    'reportingRestriction.appealStatus': decision,
    'reportingRestriction.appealId': updated._id
  } });
  await createAuditLog({
    action: `reporting_appeal_${decision}`,
    performedBy: req.user._id,
    resourceType: 'ReportingAppeal',
    resourceId: updated._id,
    details: { reporter: appeal.reporter, assignedBarangay: appeal.assignedBarangay, notes },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  res.json({ success: true, message: decision === 'approved' ? 'Appeal approved and reporting access restored.' : 'Appeal rejected; reporting remains blocked.', data: serializeAppeal(updated) });
});
