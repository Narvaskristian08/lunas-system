const express = require('express');
const router = express.Router();
const {
  archiveUser,
  getUtilityProviderOrganizations
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
const accounts = require('../controllers/authorizedAccountController');
const accountRules = require('../middleware/accountValidation');
const tanodWorkflow = require('../controllers/tanodWorkflowController');

router.route('/authorized')
  .get(protect, authorize('admin'), paginationValidation, accountRules.accountQueryValidation, validate, accounts.getAuthorizedAccounts)
  .post(protect, authorize('admin'), accountRules.createAccountValidation, validate, accounts.createAuthorizedAccount);
router.route('/authorized/:id')
  .get(protect, authorize('admin'), mongoIdValidation, validate, accounts.getAuthorizedAccount)
  .put(protect, authorize('admin'), mongoIdValidation, accountRules.updateAccountValidation, validate, accounts.updateAuthorizedAccount);
router.patch('/authorized/:id/status', protect, authorize('admin'), mongoIdValidation,
  accountRules.accountStatusValidation, validate, accounts.changeAccountStatus);
router.post('/authorized/:id/activation', protect, authorize('admin'), mongoIdValidation,
  accountRules.resendActivationValidation, validate, accounts.resendAccountActivation);

// Dedicated Tanod compatibility read stays separate from agency repair staffing.
router.get('/repair-personnel', protect, authorize('barangay_official', 'utility_provider'), (req, res, next) => req.user.role === 'barangay_official'
  ? tanodWorkflow.listTanodPersonnel(req, res, next) : require('../controllers/userController').getRepairPersonnel(req, res, next));
router.post('/repair-personnel', protect, authorize('utility_provider'), accountRules.createRepairPersonnelValidation, validate, accounts.createRepairPersonnel);
router.put('/repair-personnel/:id', protect, authorize('utility_provider'), mongoIdValidation, accountRules.updateRepairPersonnelValidation, validate, accounts.updateRepairPersonnel);
router.patch('/repair-personnel/:id/status', protect, authorize('utility_provider'), mongoIdValidation, accountRules.accountStatusValidation, validate, accounts.changeAccountStatus);
router.post('/repair-personnel/:id/activation', protect, authorize('utility_provider'), mongoIdValidation, accountRules.resendActivationValidation, validate, accounts.resendAccountActivation);
router.get('/utility-providers', protect, authorize('barangay_official', 'utility_provider'), getUtilityProviderOrganizations);

// Keep an explicit self-service profile endpoint so clients do not need to
// know an ObjectId or use administrative user routes.
router.route('/me')
  .get(protect, getMe)
  .patch(protect, updateProfileValidation, validate, updateProfile)
  .put(protect, updateProfileValidation, validate, updateProfile);

// General user directory reads are intentionally absent. Admin uses the
// approval-aware authorized-account API; providers use the scoped personnel list.

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
  // Compatibility route now uses the same approved-field and role policy.
  .put(protect, authorize('admin'), mongoIdValidation, accountRules.updateAccountValidation, validate, accounts.updateAuthorizedAccount)
  // Backward-compatible alias. Despite the HTTP verb, this never deletes a
  // database record; new clients should use PATCH /:id/archive.
  .delete(protect, authorize('admin'), mongoIdValidation, archiveUserValidation, validate, archiveUser);

module.exports = router;
