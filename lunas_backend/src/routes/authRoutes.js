const express = require('express');
const router = express.Router();
const {
  register,
  verifyRegistrationMfa,
  resendRegistrationMfa,
  login,
  refresh,
  forgotPassword,
  verifyPasswordResetCode,
  resetPassword,
  getMe,
  getRecoveryEmailStatus,
  requestRecoveryEmailVerification,
  verifyRecoveryEmail,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { activateAuthorizedAccount } = require('../controllers/authorizedAccountController');
const { activateAccountValidation } = require('../middleware/accountValidation');
const { loginAccountLimiter, loginIpLimiter } = require('../middleware/loginRateLimiter');
const {
  changePasswordValidation,
  forgotPasswordValidation,
  loginValidation,
  registrationMfaResendValidation,
  registrationMfaValidation,
  refreshValidation,
  registerValidation,
  resetPasswordValidation,
  passwordResetCodeValidation,
  recoveryEmailRequestValidation,
  recoveryEmailVerifyValidation,
  updateProfileValidation,
  validate
} = require('../middleware/validation');

router.post('/register', registerValidation, validate, register);
router.post('/activate-account', activateAccountValidation, validate, activateAuthorizedAccount);
router.post('/register/verify', registrationMfaValidation, validate, verifyRegistrationMfa);
router.post('/register/resend', registrationMfaResendValidation, validate, resendRegistrationMfa);
router.post('/login', loginIpLimiter, loginAccountLimiter, loginValidation, validate, login);
router.post('/refresh', refreshValidation, validate, refresh);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/forgot-password/verify', passwordResetCodeValidation, validate, verifyPasswordResetCode);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);
router.get('/me', protect, getMe);
router.get('/recovery-email/status', protect, getRecoveryEmailStatus);
router.post('/recovery-email/request', protect, recoveryEmailRequestValidation, validate, requestRecoveryEmailVerification);
router.post('/recovery-email/verify', protect, recoveryEmailVerifyValidation, validate, verifyRecoveryEmail);
router.put('/profile', protect, updateProfileValidation, validate, updateProfile);
router.patch('/profile', protect, updateProfileValidation, validate, updateProfile);
router.put('/change-password', protect, changePasswordValidation, validate, changePassword);
router.post('/logout', protect, logout);

module.exports = router;
