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
  const { page = 1, limit = 20, isRead } = req.query;

  const filter = { recipient: req.user._id };
  if (typeof isRead !== 'undefined') {
    filter.isRead = isRead === 'true';
  }

  const notifications = await Notification.find(filter)
    .sort('-createdAt')
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
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
