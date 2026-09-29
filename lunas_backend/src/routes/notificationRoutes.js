const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { paginationValidation, mongoIdValidation, validate } = require('../middleware/validation');

router.get('/', protect, paginationValidation, validate, getNotifications);
router.get('/:id', protect, mongoIdValidation, validate, getNotification);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, mongoIdValidation, validate, markAsRead);
router.delete('/:id', protect, mongoIdValidation, validate, deleteNotification);

module.exports = router;
