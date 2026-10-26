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
  getDailyReportLimit,
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
const tanodWorkflow = require('../controllers/tanodWorkflowController');
const { body } = require('express-validator');
const { uploadMultiple } = require('../middleware/upload');

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
router.get('/daily-limit', protect, authorize('citizen'), getDailyReportLimit);
router.get('/barangays', protect, getBarangays);
router.get('/location-policy', protect, (req, res) => res.json({
  success: true, data: require('../services/locationIntegrityService').getLocationPolicy()
}));
router.get('/tanod-personnel', protect, authorize('barangay_official'), tanodWorkflow.listTanodPersonnel);
router.get('/agency-exceptions', protect, authorize('barangay_official'), tanodWorkflow.listAgencyExceptions);
router.get('/my-inspections', protect, authorize('utility_personnel'), tanodWorkflow.listMyInspections);
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

router.post('/:id/tanod-inspections', protect, authorize('barangay_official'), mongoIdValidation,
  body('tanodId').isMongoId(), validate, tanodWorkflow.assignInitialInspection);
router.post('/:id/completion-inspections', protect, authorize('barangay_official'), mongoIdValidation,
  body('tanodId').isMongoId(), validate, tanodWorkflow.assignCompletionInspection);
router.patch('/:id/agency-status', protect, authorize('utility_provider'), mongoIdValidation,
  body('status').isIn(['ready_for_work', 'pending_procurement', 'work_in_progress', 'work_completed']),
  body('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
  body('note').optional().isString().isLength({ max: 2000 }), validate, tanodWorkflow.updateAgencyStatus);
router.post('/:id/agency-correction', protect, authorize('barangay_official'), mongoIdValidation,
  body('reason').isString().trim().isLength({ min: 2, max: 2000 }), validate, tanodWorkflow.requestAgencyCorrection);
router.post('/:id/complete', protect, authorize('barangay_official'), mongoIdValidation,
  body('inspectionId').isMongoId(), body('notes').optional().isString().isLength({ max: 2000 }), validate,
  tanodWorkflow.completeIncident);
router.post('/:id/inspections/:inspectionId/start', protect, authorize('utility_personnel'), mongoIdValidation,
  tanodWorkflow.startInspection);
router.post('/:id/inspections/:inspectionId/submit', protect, authorize('utility_personnel'), mongoIdValidation,
  uploadMultiple('evidence', 5), body('findings').isString().isLength({ min: 2, max: 4000 }),
  body('result').optional().isIn(['verified', 'not_verified', 'unable_to_verify']), validate,
  tanodWorkflow.submitInspection);
router.post('/:id/inspections/:inspectionId/review', protect, authorize('barangay_official'), mongoIdValidation,
  body('decision').isIn(['approve', 'reject', 'clarification']), body('notes').optional().isString().isLength({ max: 2000 }), validate,
  tanodWorkflow.reviewInspection);

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
  authorize('barangay_official'),
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
  authorize('barangay_official'),
  mongoIdValidation,
  routeIncidentValidation,
  validate,
  routeIncident
);

// Deletion is intentionally not exposed. Rejection, duplicate decisions and
// closure preserve auditable incident history.

module.exports = router;
