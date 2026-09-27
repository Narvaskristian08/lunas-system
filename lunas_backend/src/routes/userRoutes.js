const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  archiveUser,
  getRepairPersonnel
} = require('../controllers/userController');
const { getMe, updateProfile } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const {
  paginationValidation,
  archiveUserValidation,
  mongoIdValidation,
  updateProfileValidation,
  validate
} = require('../middleware/validation');

router.get('/repair-personnel', protect, authorize('barangay_official', 'city_engineer', 'admin'), getRepairPersonnel);

// Keep an explicit self-service profile endpoint so clients do not need to
// know an ObjectId or use administrative user routes.
router.route('/me')
  .get(protect, getMe)
  .patch(protect, updateProfileValidation, validate, updateProfile)
  .put(protect, updateProfileValidation, validate, updateProfile);

router.route('/')
  .get(protect, authorize('barangay_official', 'city_engineer', 'admin'), paginationValidation, validate, getUsers);

router.patch(
  '/:id/archive',
  protect,
  authorize('admin'),
  mongoIdValidation,
  archiveUserValidation,
  validate,
  archiveUser
);

router.route('/:id')
  .get(protect, mongoIdValidation, validate, getUser)
  .put(protect, authorize('admin'), mongoIdValidation, validate, updateUser)
  // Backward-compatible alias. Despite the HTTP verb, this never deletes a
  // database record; new clients should use PATCH /:id/archive.
  .delete(protect, authorize('admin'), mongoIdValidation, archiveUserValidation, validate, archiveUser);

module.exports = router;
