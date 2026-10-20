const Incident = require('../models/Incident');
const { buildIncidentScope } = require('./jurisdictionService');
const { canonicalizeBarangay } = require('../data/dagupanBarangays');
const { INCIDENT_CATEGORY_CODES } = require('../utils/incidentCategories');
const { INCIDENT_STATES } = require('./incidentTransitionService');
const { getApproachingThresholdHours } = require('./workOrderService');
const { canSignIn } = require('../utils/accountPolicy');
const fail = (statusCode, message) => { throw Object.assign(new Error(message), { statusCode }); };
const ROLES = ['barangay_official', 'utility_provider'];
const MAX_EXPORT = 2000;
const enums = {
  category: INCIDENT_CATEGORY_CODES, status: INCIDENT_STATES,
  verification: ['confirmed', 'pending'],
  agencyStatus: ['not_routed', 'ready_for_work', 'pending_procurement', 'work_in_progress', 'work_completed', 'correction_required', 'acknowledged', 'routine_pending_authorization', 'pending_external_processing', 'pending_funding', 'for_bidding', 'bidding_completed', 'awaiting_work_authorization', 'responsibility_review', 'assessment_clarification'],
  external: ['pending_external_processing', 'pending_funding', 'for_bidding', 'bidding_completed', 'awaiting_work_authorization'],
  maintenance: ['none', 'pending', 'accepted', 'in_progress', 'completed', 'rework_required', 'verified', 'closed', 'cancelled'],
  assignment: ['unassigned', 'pending', 'accepted', 'declined', 'reassigned'],
  sla: ['not_started', 'active', 'approaching', 'overdue', 'met', 'breached', 'cancelled'],
  priority: ['critical', 'high', 'medium', 'low']
};
function canExport(user, format) {
  return ROLES.includes(user?.role) && (process.env[`OPERATIONAL_REPORT_${format.toUpperCase()}_ROLES`] || '').split(',').map(v => v.trim()).includes(user.role);
}
function localDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1970 || Number(value.slice(0, 4)) > 2100) fail(400, 'Use valid YYYY-MM-DD calendar dates');
  const instant = new Date(`${value}T00:00:00+08:00`);
  if (!Number.isFinite(instant.getTime()) || new Date(instant.getTime() + 28800000).toISOString().slice(0, 10) !== value) fail(400, 'Invalid calendar date');
  return instant;
}
function parseReportQuery(query = {}, now = new Date()) {
  const allowed = ['period', 'date', 'start', 'end', 'basis', 'page', 'limit', 'barangay', 'agency', ...Object.keys(enums)];
  for (const [key, value] of Object.entries(query)) if (!allowed.includes(key) || typeof value !== 'string' || value.length > 160 || /\p{Cc}/u.test(value)) fail(400, 'Invalid reporting parameter');
  const period = query.period || 'monthly'; const basis = query.basis || 'submitted';
  if (!['daily', 'weekly', 'monthly', 'custom'].includes(period) || !['submitted', 'verified', 'resolved'].includes(basis)) fail(400, 'Unsupported reporting period or event basis');
  const page = query.page || '1'; const limit = query.limit || '25';
  if (!/^[1-9]\d*$/.test(page) || !/^[1-9]\d*$/.test(limit) || Number(limit) > 100 || Number(page) * Number(limit) > 100000) fail(400, 'Page must be positive; size at most 100; accessible offset at most 100000');
  let start; let end;
  if (period === 'custom') {
    if (!query.start || !query.end || query.date) fail(400, 'Custom reports require inclusive start and end calendar dates');
    start = localDate(query.start); end = new Date(localDate(query.end).getTime() + 86400000);
  } else {
    if (query.start || query.end) fail(400, 'Use custom period for start/end dates');
    const day = query.date || new Date(now.getTime() + 28800000).toISOString().slice(0, 10);
    start = localDate(day);
    if (period === 'daily') end = new Date(start.getTime() + 86400000);
    if (period === 'weekly') {
      const local = new Date(start.getTime() + 28800000);
      start = new Date(start.getTime() - ((local.getUTCDay() + 6) % 7) * 86400000);
      end = new Date(start.getTime() + 7 * 86400000);
    }
    if (period === 'monthly') {
      const [year, month] = day.split('-').map(Number);
      start = new Date(Date.UTC(year, month - 1, 1) - 28800000);
      end = new Date(Date.UTC(year, month, 1) - 28800000);
    }
  }
  if (end <= start || end - start > 366 * 86400000) fail(400, 'Report range must be ordered and at most 366 days');
  const filters = {};
  for (const [key, values] of Object.entries(enums)) if (query[key]) {
    if (!values.includes(query[key])) fail(400, `Invalid ${key} filter`);
    filters[key] = query[key];
  }
  if (query.barangay) { filters.barangay = canonicalizeBarangay(query.barangay); if (!filters.barangay) fail(400, 'Invalid barangay'); }
  if (query.agency) { if (!query.agency.trim() || /[$<>]/.test(query.agency)) fail(400, 'Invalid agency'); filters.agency = query.agency.trim(); }
  return { period, basis, start, end, timezone: 'Asia/Manila', weekStarts: 'Monday', page: Number(page), limit: Number(limit), filters };
}
const dateType = field => ({ $eq: [{ $type: field }, 'date'] });
const present = field => ({ $ne: [{ $ifNull: [field, null] }, null] });
const confirmed = { $and: [present('$categoryConfirmedBy'), dateType('$categoryConfirmedAt')] };
const resolved = { $and: [{ $in: ['$status', ['resolved', 'closed']] }, present('$finalVerifiedBy'), dateType('$finalVerifiedAt')] };
function reportPipeline(user, options, now, exporting = false) {
  const f = options.filters;
  const match = [buildIncidentScope(user)];
  const timestamp = { submitted: 'createdAt', verified: 'categoryConfirmedAt', resolved: 'finalVerifiedAt' }[options.basis];
  match.push({ [timestamp]: { $gte: options.start, $lt: options.end } });
  if (options.basis === 'verified') match.push({ $expr: confirmed });
  if (options.basis === 'resolved') match.push({ $expr: resolved });
  for (const key of ['category', 'status', 'priority', 'agencyStatus']) if (f[key]) match.push({ [key]: f[key] });
  if (f.priority) match.push({ $expr: { $and: [present('$priorityAssignedBy'), dateType('$priorityAssignedAt')] } });
  if (f.external) match.push({ agencyStatus: f.external });
  if (f.agency) match.push({ 'routing.responsibleOrganization': f.agency });
  if (f.barangay) match.push({ $or: [{ 'jurisdiction.barangay': f.barangay }, { 'jurisdiction.barangay': { $exists: false }, 'location.address.barangay': f.barangay }] });
  const validClock = { $and: [dateType('$sla.startedAt'), dateType('$sla.deadline'), { $in: ['$sla.state', enums.sla.filter(state => state !== 'not_started')] }, { $lte: ['$sla.startedAt', now] }, { $gte: ['$sla.deadline', '$sla.startedAt'] }] };
  const terminalClock = { $and: [dateType('$sla.closedAt'), { $gte: ['$sla.closedAt', '$sla.startedAt'] }] };
  const pipeline = [{ $match: { $and: match } },
    { $lookup: { from: 'workorders', let: { order: '$workOrder', incident: '$_id', org: '$routing.responsibleOrganization' }, pipeline: [
      { $match: { $expr: { $and: [{ $eq: ['$_id', '$$order'] }, { $eq: ['$incident', '$$incident'] }, { $eq: ['$responsibleOrganization', '$$org'] }] } } },
      { $project: { status: 1, assignmentState: 1, maintenanceProtocol: 1 } }
    ], as: 'maintenanceRecord' } },
    { $set: { maintenanceState: { $ifNull: [{ $arrayElemAt: ['$maintenanceRecord.status', 0] }, 'none'] }, assignmentState: { $ifNull: [{ $arrayElemAt: ['$maintenanceRecord.assignmentState', 0] }, 'unassigned'] },
      verified: confirmed, recordedResolved: resolved,
      barangay: { $ifNull: ['$jurisdiction.barangay', '$location.address.barangay'] },
      recordedBreach: { $eq: ['$sla.state', 'breached'] },
      slaState: { $cond: [validClock, { $switch: { branches: [
        { case: { $and: [{ $in: ['$sla.state', ['breached', 'cancelled']] }, terminalClock] }, then: '$sla.state' },
        { case: terminalClock, then: { $cond: [{ $lt: ['$sla.deadline', '$sla.closedAt'] }, 'breached', 'met'] } },
        { case: { $in: ['$sla.state', ['met', 'breached', 'cancelled']] }, then: 'not_started' },
        { case: { $lt: ['$sla.deadline', now] }, then: 'overdue' },
        { case: { $lte: ['$sla.deadline', new Date(now.getTime() + getApproachingThresholdHours() * 3600000)] }, then: 'approaching' }
      ], default: 'active' } }, 'not_started'] } } },
    { $project: { _id: 1, reportNumber: 1, category: 1, originalCategory: 1, status: 1, agencyStatus: 1, createdAt: 1, categoryConfirmedAt: 1, finalVerifiedAt: 1,
      agency: '$routing.responsibleOrganization', barangay: 1, priority: 1, maintenanceState: 1, assignmentState: 1, verified: 1, recordedResolved: 1, recordedBreach: 1, slaState: 1,
      categoryCorrected: { $and: [present('$originalCategory'), { $ne: ['$originalCategory', '$category'] }] } } }
  ];
  const derived = {};
  if (f.verification) derived.verified = f.verification === 'confirmed';
  for (const [key, field] of [['maintenance', 'maintenanceState'], ['assignment', 'assignmentState'], ['sla', 'slaState']]) if (f[key]) derived[field] = f[key];
  if (Object.keys(derived).length) pipeline.push({ $match: derived });
  const groups = field => [{ $group: { _id: `$${field}`, count: { $sum: 1 } } }, { $sort: { _id: 1 } }];
  pipeline.push({ $facet: {
    totals: [{ $group: { _id: null, incidents: { $sum: 1 }, confirmed: { $sum: { $cond: ['$verified', 1, 0] } }, recordedResolved: { $sum: { $cond: ['$recordedResolved', 1, 0] } }, categoryCorrections: { $sum: { $cond: ['$categoryCorrected', 1, 0] } }, recordedBreaches: { $sum: { $cond: ['$recordedBreach', 1, 0] } } } }],
    categories: groups('category'), barangays: groups('barangay'), agencies: groups('agency'), statuses: groups('status'), agencyStatuses: groups('agencyStatus'), maintenance: groups('maintenanceState'), assignments: groups('assignmentState'), sla: groups('slaState'),
    rows: [{ $sort: { createdAt: -1, _id: -1 } }, ...(!exporting ? [{ $skip: (options.page - 1) * options.limit }] : []), { $limit: exporting ? MAX_EXPORT + 1 : options.limit }]
  } });
  return pipeline;
}
async function getOperationalReport(user, query, format, now = new Date()) {
  if (!user || !canSignIn(user)) fail(401, 'Active authentication required');
  if (!ROLES.includes(user.role) || buildIncidentScope(user)._id === null) fail(403, 'Operational reporting is restricted to assigned Secretaries and Agency Officers');
  if (format && !canExport(user, format)) fail(403, 'Export audience policy pending for this role and format');
  const options = parseReportQuery(query, now);
  if (user.role === 'barangay_official' && options.filters.barangay && options.filters.barangay !== canonicalizeBarangay(user.barangay)) fail(403, 'Barangay outside your reporting scope');
  if (user.role === 'utility_provider' && options.filters.agency && options.filters.agency !== user.utilityCompany?.trim()) fail(403, 'Agency outside your reporting scope');
  const [result] = await Incident.aggregate(reportPipeline(user, options, now, Boolean(format))).option({ maxTimeMS: 15000, allowDiskUse: false });
  const report = result || { rows: [], totals: [] };
  const total = report.totals[0]?.incidents || 0;
  if (format && (total > MAX_EXPORT || report.rows.length > MAX_EXPORT)) fail(413, 'Export exceeds 2000 incidents; narrow the reporting dates or filters');
  return { ...report, totals: report.totals[0] || { incidents: 0, confirmed: 0, recordedResolved: 0, categoryCorrections: 0, recordedBreaches: 0 },
    metadata: { ...options, generatedAt: now, scope: user.role === 'barangay_official' ? canonicalizeBarangay(user.barangay) : user.utilityCompany, semantics: 'Selected by event period; current recorded states as of generation. Recorded resolution requires final reviewer and timestamp; no maintenance authorization inferred.', exportPermissions: { csv: canExport(user, 'csv'), pdf: canExport(user, 'pdf') } },
    pagination: { page: options.page, limit: options.limit, total, pages: Math.ceil(total / options.limit) } };
}
module.exports = { parseReportQuery, reportPipeline, getOperationalReport, canExport, MAX_EXPORT, enums };
