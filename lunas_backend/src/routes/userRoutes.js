const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getRepairPersonnel
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { paginationValidation, mongoIdValidation, validate } = require('../middleware/validation');

router.get('/repair-personnel', protect, authorize('barangay_official', 'city_engineer', 'admin'), getRepairPersonnel);

router.route('/')
  .get(protect, authorize('barangay_official', 'city_engineer', 'admin'), paginationValidation, validate, getUsers);

router.route('/:id')
  .get(protect, mongoIdValidation, validate, getUser)
  .put(protect, authorize('admin'), mongoIdValidation, validate, updateUser)
  .delete(protect, authorize('admin'), mongoIdValidation, validate, deleteUser);

module.exports = router;
