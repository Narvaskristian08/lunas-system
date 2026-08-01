const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAnalytics
} = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboardStats);
router.get('/analytics', protect, authorize('barangay_official', 'city_engineer', 'admin'), getAnalytics);

module.exports = router;
