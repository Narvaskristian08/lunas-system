const express = require('express');
const router = express.Router();
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
  rejectIncident,
  markDuplicateIncident,
  updateIncidentPriority,
  updateIncidentJurisdiction,
  routeIncident,
  getNearbyIncidents,
  deleteIncident
} = require('../controllers/incidentController');
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
  pendingValidationQuery,
  paginationValidation,
  mongoIdValidation,
  validate
} = require('../middleware/validation');
const { OFFICIAL_VALIDATION_ROLES, VALIDATION_DECISION_ROLES } = require('../services/jurisdictionService');

const officialValidationRoles = OFFICIAL_VALIDATION_ROLES;
const validationDecisionRoles = VALIDATION_DECISION_ROLES;

// These routes must precede /:id so Express does not treat "my" or "nearby"
// as an ObjectId.
router.get(
  '/nearby',
  protect,
  authorize('barangay_official', 'city_engineer', 'utility_provider', 'repair_personnel', 'admin'),
  nearbyCoordinatesValidation,
  validate,
  getNearbyIncidents
);
router.get('/my', protect, authorize('citizen'), paginationValidation, validate, getMyIncidents);
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
    authorize('citizen', 'admin'),
    uploadIncidentEvidence,
    parseIncidentPayload,
    createIncidentValidation,
    validate,
    createIncident
  );

router.route('/:id')
  .get(protect, mongoIdValidation, validate, getIncident)
  .put(protect, authorize(...officialValidationRoles), mongoIdValidation, updateIncidentValidation, validate, updateIncident)
  .delete(protect, authorize('admin'), mongoIdValidation, validate, deleteIncident);

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
  authorize(...validationDecisionRoles),
  mongoIdValidation,
  validateIncidentDecisionValidation,
  validate,
  validateIncident
);
router.post(
  '/:id/reject',
  protect,
  authorize(...validationDecisionRoles),
  mongoIdValidation,
  rejectIncidentDecisionValidation,
  validate,
  rejectIncident
);
router.post(
  '/:id/mark-duplicate',
  protect,
  authorize(...validationDecisionRoles),
  mongoIdValidation,
  markDuplicateValidation,
  validate,
  markDuplicateIncident
);
router.patch(
  '/:id/priority',
  protect,
  authorize(...validationDecisionRoles),
  mongoIdValidation,
  updatePriorityValidation,
  validate,
  updateIncidentPriority
);
router.patch(
  '/:id/jurisdiction',
  protect,
  authorize(...validationDecisionRoles),
  mongoIdValidation,
  updateJurisdictionValidation,
  validate,
  updateIncidentJurisdiction
);
router.post(
  '/:id/route',
  protect,
  authorize(...validationDecisionRoles),
  mongoIdValidation,
  routeIncidentValidation,
  validate,
  routeIncident
);

module.exports = router;
