const express = require('express');
const router = express.Router();
const {
  createWorkOrder,
  getWorkOrders,
  getWorkOrder,
  acceptWorkOrder,
  updateProgress,
  completeWorkOrder,
  verifyCompletion,
  deleteWorkOrder
} = require('../controllers/workOrderController');
const { protect, authorize } = require('../middleware/auth');
const {
  createWorkOrderValidation,
  updateWorkOrderValidation,
  paginationValidation,
  mongoIdValidation,
  validate
} = require('../middleware/validation');

// CRUD operations
router.route('/')
  .get(protect, paginationValidation, validate, getWorkOrders)
  .post(protect, authorize('barangay_official', 'city_engineer', 'admin'), createWorkOrderValidation, validate, createWorkOrder);

router.route('/:id')
  .get(protect, mongoIdValidation, validate, getWorkOrder)
  .delete(protect, authorize('admin'), mongoIdValidation, validate, deleteWorkOrder);

// Work order actions
router.post('/:id/accept', protect, authorize('repair_personnel', 'utility_provider'), mongoIdValidation, validate, acceptWorkOrder);
router.post('/:id/progress', protect, authorize('repair_personnel', 'utility_provider'), mongoIdValidation, validate, updateProgress);
router.post('/:id/complete', protect, authorize('repair_personnel', 'utility_provider'), mongoIdValidation, validate, completeWorkOrder);
router.post('/:id/verify', protect, authorize('barangay_official', 'city_engineer', 'admin'), mongoIdValidation, validate, verifyCompletion);

module.exports = router;
