const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { query } = require('express-validator');
const { protect } = require('../middleware/auth');
const { paginationValidation, mongoIdValidation, validate } = require('../middleware/validation');

router.get('/', protect, paginationValidation,
  query('kind').optional().isIn(['update', 'activity', 'alert']),
  query('category').optional().isIn(['Reports', 'Work orders', 'SLA', 'Repairs', 'Security', 'System']),
  query('search').optional().isString().bail().trim().isLength({ max: 200 }),
  query('isRead').optional().isIn(['true', 'false']),
  query('dateRange').optional().isIn(['today', 'week', 'month']),
  query('sort').optional().isIn(['newest', 'oldest', 'priority']),
  validate, getNotifications);
router.get('/:id', protect, mongoIdValidation, validate, getNotification);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, mongoIdValidation, validate, markAsRead);
router.delete('/:id', protect, mongoIdValidation, validate, deleteNotification);

module.exports = router;
