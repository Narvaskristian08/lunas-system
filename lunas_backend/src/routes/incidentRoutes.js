const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const {
  createIncident,
  getIncidents,
  getMyIncidents,
  getIncident,
  getIncidentHistory,
  getPendingValidation,
  getDuplicateCandidates,
  getIncidentSLA,
  updateIncident,
  validateIncident,
  confirmIncident,
  requestIncidentClarification,
  rejectIncident,
  markDuplicateIncident,
  updateIncidentPriority,
  updateIncidentJurisdiction,
  routeIncident,
  getNearbyIncidents,
  getBarangays,
} = require('../controllers/incidentController');
const { createWorkOrder } = require('../controllers/workOrderController');
const { protect, authorize } = require('../middleware/auth');
const { uploadIncidentEvidence } = require('../middleware/upload');
const { parseIncidentPayload } = require('../middleware/parseIncidentPayload');
const {
  createIncidentValidation,
  nearbyCoordinatesValidation,
  updateIncidentValidation,
  validateIncidentDecisionValidation,
  rejectIncidentDecisionValidation,
  markDuplicateValidation,
  updatePriorityValidation,
  updateJurisdictionValidation,
  routeIncidentValidation,
  clarificationValidation,
  createWorkOrderValidation,
  pendingValidationQuery,
  paginationValidation,
  mongoIdValidation,
  validate
} = require('../middleware/validation');
const { OFFICIAL_VALIDATION_ROLES, VALIDATION_DECISION_ROLES } = require('../services/jurisdictionService');
const { rejectBlockedReporting } = require('../middleware/reportingRestriction');

const officialValidationRoles = OFFICIAL_VALIDATION_ROLES;
const validationDecisionRoles = VALIDATION_DECISION_ROLES;

// These routes must precede /:id so Express does not treat "my" or "nearby"
// as an ObjectId.
router.get(
  '/nearby',
  protect,
  authorize('city_engineer', 'utility_provider', 'repair_personnel'),
  nearbyCoordinatesValidation,
  validate,
  getNearbyIncidents
);
router.get('/my', protect, authorize('citizen'), paginationValidation, query('reportView').optional().isIn(['all', 'active', 'resolved', 'in_progress']), query('search').optional().isString().bail().trim().isLength({ max: 100 }), validate, getMyIncidents);
router.get('/barangays', protect, getBarangays);
router.get('/location-policy', protect, (req, res) => res.json({
  success: true, data: require('../services/locationIntegrityService').getLocationPolicy()
}));
router.get('/:id/false-report-review', protect, authorize('barangay_official', 'city_engineer', 'admin'), mongoIdValidation, validate,
  require('../controllers/falseReportReviewController').getReview);
router.post('/:id/false-report-review', protect, authorize('barangay_official', 'city_engineer', 'admin'), mongoIdValidation, validate,
  require('../controllers/falseReportReviewController').saveReview);
router.get(
  '/pending-validation',
  protect,
  authorize(...validationDecisionRoles),
  paginationValidation,
  pendingValidationQuery,
  validate,
  getPendingValidation
);

router.route('/')
  .get(protect, paginationValidation, validate, getIncidents)
  .post(
    protect,
    authorize('citizen'),
    rejectBlockedReporting,
    uploadIncidentEvidence,
    parseIncidentPayload,
    createIncidentValidation,
    validate,
    createIncident
);

// A Utility Provider creates a work order after City Engineering routes the incident. Keep this nested
// route next to incident operations while the detailed maintenance API stays
// under /work-orders.
router.post(
  '/:id/work-orders',
  protect,
  authorize('utility_provider'),
  mongoIdValidation,
  createWorkOrderValidation,
  validate,
  createWorkOrder
);

router.route('/:id')
  .get(protect, mongoIdValidation, validate, getIncident)
  .put(protect, authorize('barangay_official', 'city_engineer', 'utility_provider'), mongoIdValidation, updateIncidentValidation, validate, updateIncident);

router.get('/:id/history', protect, mongoIdValidation, validate, getIncidentHistory);
router.get(
  '/:id/duplicate-candidates',
  protect,
  authorize(...officialValidationRoles),
  mongoIdValidation,
  validate,
  getDuplicateCandidates
);
router.get('/:id/sla', protect, mongoIdValidation, validate, getIncidentSLA);

router.post(
  '/:id/validate',
  protect,
  authorize('barangay_official'),
  mongoIdValidation,
  validateIncidentDecisionValidation,
  validate,
  validateIncident
);
router.post(
  '/:id/confirm',
  protect,
  authorize('city_engineer'),
  mongoIdValidation,
  validateIncidentDecisionValidation,
  validate,
  confirmIncident
);
router.post(
  '/:id/clarification',
  protect,
  authorize('city_engineer'),
  mongoIdValidation,
  clarificationValidation,
  validate,
  requestIncidentClarification
);
router.post(
  '/:id/reject',
  protect,
  authorize('barangay_official'),
  mongoIdValidation,
  rejectIncidentDecisionValidation,
  validate,
  rejectIncident
);
router.post(
  '/:id/mark-duplicate',
  protect,
  authorize('barangay_official'),
  mongoIdValidation,
  markDuplicateValidation,
  validate,
  markDuplicateIncident
);
router.patch(
  '/:id/priority',
  protect,
  authorize('city_engineer'),
  mongoIdValidation,
  updatePriorityValidation,
  validate,
  updateIncidentPriority
);
router.patch(
  '/:id/jurisdiction',
  protect,
  authorize('city_engineer'),
  mongoIdValidation,
  updateJurisdictionValidation,
  validate,
  updateIncidentJurisdiction
);
router.post(
  '/:id/route',
  protect,
  authorize('city_engineer'),
  mongoIdValidation,
  routeIncidentValidation,
  validate,
  routeIncident
);

// Deletion is intentionally not exposed. Rejection, duplicate decisions and
// closure preserve auditable incident history.

module.exports = router;
