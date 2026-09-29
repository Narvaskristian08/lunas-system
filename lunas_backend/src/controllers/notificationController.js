const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');

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

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ 
    recipient: req.user._id, 
    isRead: false 
  });

  res.status(200).json({
    success: true,
    data: notifications,
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
  return res.status(200).json({ success: true, data: notification });
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

  res.status(200).json({
    success: true,
    data: notification
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
