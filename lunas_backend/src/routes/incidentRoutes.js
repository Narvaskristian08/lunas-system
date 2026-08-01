const express = require('express');
const router = express.Router();
const {
  createIncident,
  getIncidents,
  getIncident,
  updateIncident,
  validateIncident,
  rejectIncident,
  getNearbyIncidents,
  deleteIncident
} = require('../controllers/incidentController');
const { protect, authorize } = require('../middleware/auth');
const {
  createIncidentValidation,
  updateIncidentValidation,
  paginationValidation,
  mongoIdValidation,
  validate
} = require('../middleware/validation');

// Public/general routes
router.get('/nearby', protect, getNearbyIncidents);

// CRUD operations
router.route('/')
  .get(protect, paginationValidation, validate, getIncidents)
  .post(protect, authorize('citizen', 'admin'), createIncidentValidation, validate, createIncident);

router.route('/:id')
  .get(protect, mongoIdValidation, validate, getIncident)
  .put(protect, authorize('barangay_official', 'city_engineer', 'admin'), mongoIdValidation, updateIncidentValidation, validate, updateIncident)
  .delete(protect, authorize('admin'), mongoIdValidation, validate, deleteIncident);

// Validation actions
router.post('/:id/validate', protect, authorize('barangay_official', 'city_engineer', 'admin'), mongoIdValidation, validate, validateIncident);
router.post('/:id/reject', protect, authorize('barangay_official', 'city_engineer', 'admin'), mongoIdValidation, validate, rejectIncident);

module.exports = router;
