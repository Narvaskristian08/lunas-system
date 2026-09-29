const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAnalytics,
  getValidationSummary
} = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');
const { VALIDATION_DECISION_ROLES } = require('../services/jurisdictionService');

// Aggregate operational data is not part of the citizen reporting workflow.
router.get('/dashboard', protect, authorize('barangay_official', 'city_engineer', 'utility_provider', 'repair_personnel'), getDashboardStats);
router.get('/validation-summary', protect, authorize(...VALIDATION_DECISION_ROLES), getValidationSummary);
router.get('/analytics', protect, authorize('city_engineer'), getAnalytics);

module.exports = router;
