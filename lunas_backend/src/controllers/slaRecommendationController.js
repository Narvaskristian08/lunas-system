const Incident = require('../models/Incident');
const asyncHandler = require('../middleware/asyncHandler');
const { buildIncidentScope } = require('../services/jurisdictionService');
const { getSLAHours } = require('../services/slaService');
const { recommendSla } = require('../services/slaRecommendationService');

exports.getRecommendation = asyncHandler(async (req, res) => {
  if (req.user.role !== 'utility_provider') return res.status(403).json({ success: false, message: 'Only the responsible agency may request SLA guidance.' });
  const incident = await Incident.findOne({ _id: req.params.id, ...buildIncidentScope(req.user) });
  if (!incident) return res.status(404).json({ success: false, message: 'Report not found for your agency.' });
  if (!['ready_for_work', 'pending_procurement'].includes(incident.agencyStatus)
    || ['closed', 'resolved'].includes(incident.status)) return res.status(409).json({ success: false, message: 'AI planning guidance is available before work starts. The recorded deadline remains unchanged.' });
  const priority = req.body.priority || incident.priority;
  if (!['critical', 'high', 'medium', 'low'].includes(priority)) return res.status(400).json({ success: false, message: 'Select an agency priority before requesting guidance.' });
  const data = await recommendSla(incident, priority, getSLAHours(priority));
  res.set('Cache-Control', 'no-store');
  // Deliberately no incident.save(), workflow action or official SLA update.
  return res.json({ success: true, data });
});
