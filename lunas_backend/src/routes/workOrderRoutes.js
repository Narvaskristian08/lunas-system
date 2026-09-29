const express = require('express');
const router = express.Router();
const {
  createWorkOrder,
  getWorkOrders,
  getMyWorkOrders,
  getWorkOrder,
  getAssignments,
  getEligiblePersonnel,
  assignWorkOrder,
  reassignWorkOrder,
  acceptWorkOrder,
  declineWorkOrder,
  startWorkOrder,
  updateProgress,
  uploadRepairEvidence,
  getProgress,
  getWorkOrderSLA,
  getApproachingDeadlineWorkOrders,
  getOverdueWorkOrders,
  reviewCompletedWork,
  coordinateCityCorrection,
  finalReviewWorkOrder
} = require('../controllers/workOrderController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const {
  createWorkOrderValidation,
  updateWorkOrderValidation,
  assignWorkOrderValidation,
  reassignWorkOrderValidation,
  declineWorkOrderValidation,
  providerWorkOrderReviewValidation,
  providerCorrectionValidation,
  cityFinalReviewValidation,
  repairEvidenceValidation,
  workOrderQueryValidation,
  paginationValidation,
  mongoIdValidation,
  validate
} = require('../middleware/validation');

const providerRole = ['utility_provider'];
const workOrderRoles = ['city_engineer', 'utility_provider', 'repair_personnel'];

// Static paths must come before /:id.
router.get('/my', protect, authorize('repair_personnel'), paginationValidation, workOrderQueryValidation, validate, getMyWorkOrders);
router.get('/approaching-deadline', protect, authorize(...workOrderRoles), paginationValidation, workOrderQueryValidation, validate, getApproachingDeadlineWorkOrders);
router.get('/overdue', protect, authorize(...workOrderRoles), paginationValidation, workOrderQueryValidation, validate, getOverdueWorkOrders);

router.route('/')
  .get(protect, authorize(...workOrderRoles), paginationValidation, workOrderQueryValidation, validate, getWorkOrders)
  // Compatibility route. New clients should use POST /incidents/:id/work-orders.
  .post(protect, authorize(...providerRole), createWorkOrderValidation, validate, createWorkOrder);

router.get('/:id/assignments', protect, authorize(...providerRole), mongoIdValidation, validate, getAssignments);
router.get('/:id/eligible-personnel', protect, authorize(...providerRole), mongoIdValidation, validate, getEligiblePersonnel);
router.post('/:id/assign', protect, authorize(...providerRole), mongoIdValidation, assignWorkOrderValidation, validate, assignWorkOrder);
router.post('/:id/reassign', protect, authorize(...providerRole), mongoIdValidation, reassignWorkOrderValidation, validate, reassignWorkOrder);
router.post('/:id/accept', protect, authorize('repair_personnel'), mongoIdValidation, validate, acceptWorkOrder);
router.post('/:id/decline', protect, authorize('repair_personnel'), mongoIdValidation, declineWorkOrderValidation, validate, declineWorkOrder);
router.post('/:id/start', protect, authorize('repair_personnel'), mongoIdValidation, validate, startWorkOrder);
router.post(
  '/:id/progress',
  protect,
  authorize('repair_personnel'),
  mongoIdValidation,
  uploadMultiple('evidence', 5),
  updateWorkOrderValidation,
  validate,
  updateProgress
);
router.get('/:id/progress', protect, authorize(...workOrderRoles), mongoIdValidation, validate, getProgress);
router.post(
  '/:id/evidence',
  protect,
  authorize('repair_personnel'),
  mongoIdValidation,
  uploadMultiple('evidence', 5),
  repairEvidenceValidation,
  validate,
  uploadRepairEvidence
);
router.post('/:id/provider-review', protect, authorize('utility_provider'), mongoIdValidation,
  providerWorkOrderReviewValidation, validate, reviewCompletedWork);
router.post('/:id/coordinate-correction', protect, authorize('utility_provider'), mongoIdValidation,
  providerCorrectionValidation, validate, coordinateCityCorrection);
router.post('/:id/final-review', protect, authorize('city_engineer'), mongoIdValidation,
  cityFinalReviewValidation, validate, finalReviewWorkOrder);
router.get('/:id/sla', protect, authorize(...workOrderRoles), mongoIdValidation, validate, getWorkOrderSLA);
router.get('/:id', protect, authorize(...workOrderRoles), mongoIdValidation, validate, getWorkOrder);

module.exports = router;
