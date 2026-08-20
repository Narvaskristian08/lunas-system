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
  getOverdueWorkOrders
} = require('../controllers/workOrderController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const {
  createWorkOrderValidation,
  updateWorkOrderValidation,
  assignWorkOrderValidation,
  reassignWorkOrderValidation,
  declineWorkOrderValidation,
  repairEvidenceValidation,
  workOrderQueryValidation,
  paginationValidation,
  mongoIdValidation,
  validate
} = require('../middleware/validation');

const officialRoles = ['barangay_official', 'city_engineer', 'utility_provider', 'admin'];
const workOrderRoles = [...officialRoles, 'repair_personnel'];

// Static paths must come before /:id.
router.get('/my', protect, authorize('repair_personnel'), paginationValidation, workOrderQueryValidation, validate, getMyWorkOrders);
router.get('/approaching-deadline', protect, authorize(...workOrderRoles), paginationValidation, workOrderQueryValidation, validate, getApproachingDeadlineWorkOrders);
router.get('/overdue', protect, authorize(...workOrderRoles), paginationValidation, workOrderQueryValidation, validate, getOverdueWorkOrders);

router.route('/')
  .get(protect, authorize(...workOrderRoles), paginationValidation, workOrderQueryValidation, validate, getWorkOrders)
  // Compatibility route. New clients should use POST /incidents/:id/work-orders.
  .post(protect, authorize(...officialRoles), createWorkOrderValidation, validate, createWorkOrder);

router.get('/:id/assignments', protect, authorize(...officialRoles), mongoIdValidation, validate, getAssignments);
router.get('/:id/eligible-personnel', protect, authorize(...officialRoles), mongoIdValidation, validate, getEligiblePersonnel);
router.post('/:id/assign', protect, authorize(...officialRoles), mongoIdValidation, assignWorkOrderValidation, validate, assignWorkOrder);
router.post('/:id/reassign', protect, authorize(...officialRoles), mongoIdValidation, reassignWorkOrderValidation, validate, reassignWorkOrder);
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
router.get('/:id/sla', protect, authorize(...workOrderRoles), mongoIdValidation, validate, getWorkOrderSLA);
router.get('/:id', protect, authorize(...workOrderRoles), mongoIdValidation, validate, getWorkOrder);

module.exports = router;
