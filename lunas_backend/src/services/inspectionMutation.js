const { randomUUID } = require('crypto');
const Incident = require('../models/Incident');
const asyncHandler = require('../middleware/asyncHandler');
const { buildReadableIncidentScope } = require('./fieldIncidentAccess');

// Durable, non-expiring claim: a crashed/partially persisted action requires
// reconciliation, never an automatic takeover that could reuse stale evidence.
const withInspectionMutation = async (req, res, action, incidentId = req.params.id) => {
  if (!['barangay_official', 'barangay_tanod', 'utility_provider', 'citizen'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Inspection action not permitted' });
  }
  if (req.user.role === 'citizen' && !req.path?.endsWith('/clarification-response')) return res.status(403).json({ success: false, message: 'Inspection action not permitted' });
  const scope = await buildReadableIncidentScope(req.user);
  if (!await Incident.findOne({ _id: incidentId, $and: [scope] })) return res.status(404).json({ success: false, message: 'Report not found' });
  const token = randomUUID();
  const claimed = await Incident.findOneAndUpdate({
    _id: incidentId, $and: [scope],
    'inspectionMutation.token': { $exists: false }
  }, { $set: { inspectionMutation: { token, actor: req.user._id, action: req.path, startedAt: new Date() } } }, { new: true });
  if (!claimed) return res.status(409).json({ success: false, message: 'Report unavailable, changed, or awaiting workflow reconciliation' });
  // Deliberately no finally: an exception can follow a successful first write.
  // Retain the claim and historical records for explicit reconciliation.
  try {
    await action(req, res);
  } catch (error) {
    if (error.name === 'VersionError') return res.status(409).json({ success: false,
      code: 'WORKFLOW_RECONCILIATION_REQUIRED', message: 'Inspection changed during this action. Reconciliation is required before retrying.' });
    throw error;
  }
  await Incident.updateOne({ _id: incidentId, 'inspectionMutation.token': token }, { $unset: { inspectionMutation: 1 } });
};

exports.withInspectionMutation = withInspectionMutation;
exports.inspectionMutation = action => asyncHandler((req, res) => withInspectionMutation(req, res, action));
