const Notification = require('../models/Notification');
const Incident = require('../models/Incident');
const asyncHandler = require('../middleware/asyncHandler');

const serializeNotifications = async (notifications) => {
  const values = notifications.map((notification) => (
    notification.toObject ? notification.toObject() : notification
  ));
  const incidentIds = [...new Set(values
    .map((notification) => notification.data?.incidentId?.toString())
    .filter(Boolean))];
  const legacyReportNumbers = [...new Set(values
    .filter((notification) => !notification.data?.incidentId)
    .map((notification) => notification.data?.reportNumber)
    .filter(Boolean))];
  if (!incidentIds.length && !legacyReportNumbers.length) return values;

  const incidents = await Incident.find({
    $or: [
      ...(incidentIds.length ? [{ _id: { $in: incidentIds } }] : []),
      ...(legacyReportNumbers.length ? [{ reportNumber: { $in: legacyReportNumbers } }] : [])
    ]
  })
    .select('_id reportNumber')
    .lean();
  const incidentsById = new Map(
    incidents.map((incident) => [incident._id.toString(), incident])
  );

  return values.map((notification) => {
    const incidentId = notification.data?.incidentId?.toString();
    const legacyReportNumber = notification.data?.reportNumber;
    const incident = incidentId
      ? incidentsById.get(incidentId)
      : incidents.find((value) => value.reportNumber === legacyReportNumber);
    if (!incident) return notification;
    return {
      ...notification,
      data: {
        ...notification.data,
        incidentId: incident._id,
        reportNumber: incident.reportNumber
      }
    };
  });
};

// @desc    Get user notifications
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isRead, kind, category, search, dateRange, sort } = req.query;
  const filter = { recipient: req.user._id };
  if (isRead !== undefined) filter.isRead = isRead === 'true';
  const alerts = ['sla_approaching', 'sla_overdue', 'sla_reminder', 'sla_escalation', 'incident_clarification_requested', 'incident_rejected', 'repair_rejected', 'agency_correction_requested', 'duplicate_detected', 'work_order_declined'];
  const activity = ['incident_submitted', 'incident_validated', 'incident_routed', 'verification_update', 'inspection_assigned', 'inspection_submitted', 'agency_report_routed', 'agency_work_completed', 'completion_inspection_assigned', 'incident_completed', 'work_order_assigned', 'work_order_reassigned', 'work_order_accepted', 'work_order_in_progress', 'work_order_progress', 'work_order_completed', 'repair_verified', 'status_update', 'system_announcement'];
  if (kind === 'alert') filter.type = { $in: alerts };
  if (kind === 'activity') filter.type = { $in: activity };
  if (kind === 'update') filter.type = { $nin: [...alerts, ...activity] };
  const categories = { Reports: /^incident_/, 'Work orders': /^work_order_/, SLA: /^sla_/, Repairs: /repair|correction/, Security: /^(account_)|permission/, System: /^(?!incident_|work_order_|sla_|account_)(?!.*(?:repair|correction|permission))/ };
  if (category && categories[category]) filter.$and = [{ type: categories[category] }];
  if (search?.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' };
    filter.$or = ['title', 'message', 'data.reportNumber'].map(field => ({ [field]: regex }));
  }
  if (['today', 'week', 'month'].includes(dateRange)) {
    const now = Date.now();
    const start = dateRange === 'today'
      ? Math.floor((now + 8 * 3600000) / 86400000) * 86400000 - 8 * 3600000
      : now - (dateRange === 'week' ? 7 : 30) * 86400000;
    filter.createdAt = { $gte: new Date(start), $lte: new Date(now) };
  }
  const notifications = sort === 'priority'
    ? await Notification.aggregate([
        { $match: { ...filter, recipient: req.user._id } },
        { $addFields: { priorityRank: { $indexOfArray: [['low', 'medium', 'high', 'urgent'], '$priority'] } } },
        { $sort: { priorityRank: -1, createdAt: -1, _id: -1 } },
        { $skip: (parseInt(page) - 1) * parseInt(limit) }, { $limit: parseInt(limit) },
        { $project: { priorityRank: 0 } }
      ])
    : await Notification.find(filter).sort(sort === 'oldest' ? { createdAt: 1, _id: 1 } : { createdAt: -1, _id: -1 })
        .limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
  const serializedNotifications = await serializeNotifications(notifications);

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ 
    recipient: req.user._id, 
    isRead: false 
  });

  res.status(200).json({
    success: true,
    data: serializedNotifications,
    unreadCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get one notification belonging to the signed-in account
// @route   GET /api/v1/notifications/:id
exports.getNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  const [serialized] = await serializeNotifications([notification]);
  return res.status(200).json({ success: true, data: serialized });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: Date.now() },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  const [serialized] = await serializeNotifications([notification]);
  res.status(200).json({
    success: true,
    data: serialized
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: Date.now() }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
});
