const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../middleware/asyncHandler');
const { sanitizeAuditValue } = require('../utils/auditLogger');

const actorSummary = (actor, actorType) => {
  if (!actor) return { type: actorType, label: actorType === 'anonymous' ? 'Anonymous request' : 'System' };
  return {
    type: 'user',
    id: actor._id,
    name: `${actor.firstName || ''} ${actor.lastName || ''}`.trim(),
    email: actor.email,
    role: actor.role
  };
};

// @desc    Read the server-generated audit trail
// @route   GET /api/v1/audit-logs
// @access  Private (Admin only)
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const filter = {};

  if (req.query.action) filter.action = req.query.action;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.actorType) filter.actorType = req.query.actorType;
  if (req.query.source) filter.source = req.query.source;
  if (req.query.resourceType) filter.resourceType = req.query.resourceType;
  if (req.query.from || req.query.to) {
    filter.timestamp = {};
    if (req.query.from) filter.timestamp.$gte = new Date(req.query.from);
    if (req.query.to) filter.timestamp.$lte = new Date(req.query.to);
  }

  const query = AuditLog.find(filter)
    .populate('performedBy', 'firstName lastName email role')
    .populate('affectedUser', 'firstName lastName email role')
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const [logs, total] = await Promise.all([query, AuditLog.countDocuments(filter)]);

  res.status(200).json({
    success: true,
    data: logs.map((log) => ({
      id: log._id,
      action: log.action,
      actor: actorSummary(log.performedBy, log.actorType),
      affectedUser: log.affectedUser ? actorSummary(log.affectedUser, 'user') : undefined,
      source: log.source,
      status: log.status,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      details: sanitizeAuditValue(log.details),
      changes: sanitizeAuditValue(log.changes),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.timestamp
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
