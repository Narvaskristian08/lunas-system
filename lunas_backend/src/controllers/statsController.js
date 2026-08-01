const Incident = require('../models/Incident');
const WorkOrder = require('../models/WorkOrder');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get dashboard statistics
// @route   GET /api/v1/stats/dashboard
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const filter = {};

  // Role-based filtering
  if (req.user.role === 'barangay_official') {
    filter['location.address.barangay'] = req.user.barangay;
  }

  // Get incident statistics
  const totalIncidents = await Incident.countDocuments(filter);
  const pendingIncidents = await Incident.countDocuments({ ...filter, status: 'submitted' });
  const inProgressIncidents = await Incident.countDocuments({ ...filter, status: 'in_progress' });
  const completedIncidents = await Incident.countDocuments({ ...filter, status: { $in: ['completed', 'verified', 'closed'] } });

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

  // Get work order statistics
  const totalWorkOrders = await WorkOrder.countDocuments();
  const activeWorkOrders = await WorkOrder.countDocuments({ status: { $in: ['pending', 'accepted', 'in_progress'] } });
  const completedWorkOrders = await WorkOrder.countDocuments({ status: { $in: ['completed', 'verified'] } });

  // Get SLA statistics
  const overdueIncidents = await Incident.countDocuments({ ...filter, 'sla.isOverdue': true });

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
// @access  Private (Officials, Admin)
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

  const filter = { ...dateFilter, ...locationFilter };

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
