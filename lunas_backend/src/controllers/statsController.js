const Incident = require('../models/Incident');
const WorkOrder = require('../models/WorkOrder');
const asyncHandler = require('../middleware/asyncHandler');
const { buildIncidentScope, combineIncidentFilters } = require('../services/jurisdictionService');

// @desc    Get dashboard statistics
// @route   GET /api/v1/stats/dashboard
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const filter = buildIncidentScope(req.user);

  // Get incident statistics
  const totalIncidents = await Incident.countDocuments(filter);
  const pendingStatus = req.user.role === 'city_engineer' ? 'barangay_validated' : 'submitted';
  const pendingIncidents = await Incident.countDocuments({ ...filter, status: pendingStatus });
  const inProgressIncidents = await Incident.countDocuments({ ...filter, status: 'in_progress' });
  const completedIncidents = await Incident.countDocuments({ ...filter, status: 'closed' });

  // Get incidents by priority
  const incidentsByPriority = await Incident.aggregate([
    { $match: filter },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  // Get incidents by category
  const incidentsByCategory = await Incident.aggregate([
    { $match: filter },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  // Do not leak citywide work-order counts to barangay or provider accounts.
  // Their dashboard summaries use their own server-scoped work-order queries.
  const canReadCitywideWorkOrderStats = req.user.role === 'city_engineer';
  const [totalWorkOrders, activeWorkOrders, completedWorkOrders] = canReadCitywideWorkOrderStats
    ? await Promise.all([
      WorkOrder.countDocuments(),
      WorkOrder.countDocuments({ status: { $in: ['pending', 'accepted', 'in_progress'] } }),
      WorkOrder.countDocuments({ status: 'verified' })
    ])
    : [0, 0, 0];

  // Get SLA statistics
  const overdueIncidents = await Incident.countDocuments({ ...filter, 'sla.deadline': { $lt: new Date() },
    status: { $nin: ['verified', 'resolved', 'closed', 'rejected', 'duplicate'] } });

  // Recent incidents
  const recentIncidents = await Incident.find(filter)
    .sort('-createdAt')
    .limit(5)
    .populate('reporter', 'firstName lastName')
    .select('reportNumber category status priority createdAt');

  res.status(200).json({
    success: true,
    data: {
      incidents: {
        total: totalIncidents,
        pending: pendingIncidents,
        inProgress: inProgressIncidents,
        completed: completedIncidents,
        overdue: overdueIncidents,
        byPriority: incidentsByPriority,
        byCategory: incidentsByCategory
      },
      workOrders: {
        total: totalWorkOrders,
        active: activeWorkOrders,
        completed: completedWorkOrders
      },
      recentIncidents
    }
  });
});

// @desc    Get analytics
// @route   GET /api/v1/stats/analytics
// @access  Private (City Engineer)
exports.getAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, barangay } = req.query;

  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const locationFilter = {};
  if (barangay) {
    locationFilter['location.address.barangay'] = barangay;
  }

  const filter = combineIncidentFilters(buildIncidentScope(req.user), { ...dateFilter, ...locationFilter });

  // Incidents over time
  const incidentsOverTime = await Incident.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  // Resolution time statistics
  const completedWorkOrders = await WorkOrder.find({
    status: { $in: ['completed', 'verified'] },
    actualCompletionTime: { $exists: true }
  });

  const avgResolutionTime = completedWorkOrders.reduce((acc, wo) => {
    const time = (new Date(wo.actualCompletionTime) - new Date(wo.assignedAt)) / (1000 * 60 * 60); // hours
    return acc + time;
  }, 0) / completedWorkOrders.length || 0;

  // Top barangays by incidents
  const topBarangays = await Incident.aggregate([
    { $match: filter },
    { $group: { _id: '$location.address.barangay', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      incidentsOverTime,
      avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
      topBarangays
    }
  });
});

// @desc    Role-stage summary for the official review queues
// @route   GET /api/v1/stats/validation-summary
// @access  Private (Validation officials; query scope is enforced server-side)
exports.getValidationSummary = asyncHandler(async (req, res) => {
  const scope = buildIncidentScope(req.user);
  const count = (status) => Incident.countDocuments(combineIncidentFilters(scope, { status }));
  const pendingStates = req.user.role === 'city_engineer'
    ? ['barangay_validated']
    : ['submitted', 'clarification_required'];
  const pending = await Incident.countDocuments(combineIncidentFilters(scope, { status: { $in: pendingStates } }));
  const validatedState = req.user.role === 'barangay_official' ? 'barangay_validated' : { $in: ['city_confirmed', 'prioritized'] };
  const [validated, rejected, duplicate] = await Promise.all([
    count(validatedState),
    count('rejected'),
    count('duplicate')
  ]);

  res.status(200).json({
    success: true,
    data: {
      pending,
      validated,
      rejected,
      duplicate,
      total: pending + validated + rejected + duplicate
    }
  });
});

// All canonical barangays, including those with no reports in the official scope.
exports.getBarangayReportCounts = asyncHandler(async (req, res) => {
  const { DAGUPAN_BARANGAYS, canonicalizeBarangay } = require('../data/dagupanBarangays');
  const groups = await Incident.aggregate([
    { $match: buildIncidentScope(req.user) },
    { $group: { _id: { $ifNull: ['$jurisdiction.barangay', '$location.address.barangay'] }, reports: { $sum: 1 }, unresolved: { $sum: { $cond: [{ $in: ['$status', ['verified', 'resolved', 'closed', 'rejected', 'duplicate']] }, 0, 1] } } } }
  ]);
  const counts = new Map();
  for (const group of groups) {
    const barangay = canonicalizeBarangay(group._id);
    if (barangay) {
      const current = counts.get(barangay) || { reports: 0, unresolved: 0 };
      counts.set(barangay, { reports: current.reports + group.reports, unresolved: current.unresolved + (group.unresolved || 0) });
    }
  }
  res.json({ success: true, data: DAGUPAN_BARANGAYS.map(barangay => ({ barangay, ...(counts.get(barangay) || { reports: 0, unresolved: 0 }) })) });
});

exports.getBarangayReports = asyncHandler(async (req, res) => {
  const { canonicalizeBarangay } = require('../data/dagupanBarangays');
  const barangay = canonicalizeBarangay(req.query.barangay);
  if (!barangay) return res.status(400).json({ success: false, message: 'Select a valid barangay' });
  const terminal = ['verified', 'resolved', 'closed', 'rejected', 'duplicate'];
  const scope = combineIncidentFilters(buildIncidentScope(req.user), {
    $or: [
      { 'jurisdiction.barangay': barangay },
      { 'jurisdiction.barangay': { $in: [null, ''] }, 'location.address.barangay': barangay }
    ]
  });
  const states = {
    all: {}, ongoing: { status: { $nin: terminal } },
    overdue: { status: { $nin: terminal }, 'sla.deadline': { $lt: new Date() } },
    resolved: { status: { $in: ['verified', 'resolved', 'closed'] } }
  };
  const state = Object.hasOwn(states, req.query.state) ? req.query.state : 'all';
  const page = Math.max(1, Math.min(100000, parseInt(req.query.page, 10) || 1));
  const search = String(req.query.search || '').trim().slice(0, 100);
  const filter = combineIncidentFilters(scope, states[state], search ? {
    reportNumber: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  } : {});
  const [reports, total, counts] = await Promise.all([
    Incident.find(filter).select('reportNumber category description status priority location.address sla.deadline createdAt updatedAt').sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20).lean(),
    Incident.countDocuments(filter),
    Promise.all(Object.values(states).map(value => Incident.countDocuments(combineIncidentFilters(scope, value))))
  ]);
  return res.json({ success: true, data: { barangay, reports, counts: Object.fromEntries(Object.keys(states).map((key, index) => [key, counts[index]])), pagination: { page, limit: 20, total, pages: Math.max(1, Math.ceil(total / 20)) } } });
});
