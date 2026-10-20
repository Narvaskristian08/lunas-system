const express = require('express');
const router = express.Router();
const { createAuthLimiters, normalizeAuthEmail } = require('../middleware/securityRateLimiter');
const { authMutationIpLimiter, publicSensitiveIpLimiter, publicAccountLimiter, refreshIpLimiter, securityAccountLimiter } = createAuthLimiters();
router.use(authMutationIpLimiter, normalizeAuthEmail);
const publicSecurity = [publicSensitiveIpLimiter, publicAccountLimiter];
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

router.post('/register', ...publicSecurity, registerValidation, validate, register);
router.post('/activate-account', ...publicSecurity, activateAccountValidation, validate, activateAuthorizedAccount);
router.post('/register/verify', ...publicSecurity, registrationMfaValidation, validate, verifyRegistrationMfa);
router.post('/register/resend', ...publicSecurity, registrationMfaResendValidation, validate, resendRegistrationMfa);
router.post('/login', loginIpLimiter, loginAccountLimiter, loginValidation, validate, login);
router.post('/refresh', refreshIpLimiter, refreshValidation, validate, refresh);
router.post('/forgot-password', ...publicSecurity, forgotPasswordValidation, validate, forgotPassword);
router.post('/forgot-password/verify', ...publicSecurity, passwordResetCodeValidation, validate, verifyPasswordResetCode);
router.post('/reset-password', ...publicSecurity, resetPasswordValidation, validate, resetPassword);
router.get('/me', protect, getMe);
router.get('/recovery-email/status', protect, getRecoveryEmailStatus);
router.post('/recovery-email/request', protect, securityAccountLimiter, recoveryEmailRequestValidation, validate, requestRecoveryEmailVerification);
router.post('/recovery-email/verify', protect, securityAccountLimiter, recoveryEmailVerifyValidation, validate, verifyRecoveryEmail);
router.put('/profile', protect, securityAccountLimiter, updateProfileValidation, validate, updateProfile);
router.patch('/profile', protect, securityAccountLimiter, updateProfileValidation, validate, updateProfile);
router.put('/change-password', protect, securityAccountLimiter, changePasswordValidation, validate, changePassword);
router.post('/logout', protect, securityAccountLimiter, logout);

module.exports = router;
