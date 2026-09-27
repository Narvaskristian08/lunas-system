const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  register,
  verifyRegistrationMfa,
  resendRegistrationMfa,
  login,
  verifyPrivilegedLoginMfa,
  resendPrivilegedLoginMfa,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  changePasswordValidation,
  forgotPasswordValidation,
  loginValidation,
  privilegedLoginMfaResendValidation,
  privilegedLoginMfaValidation,
  registrationMfaResendValidation,
  registrationMfaValidation,
  refreshValidation,
  registerValidation,
  resetPasswordValidation,
  updateProfileValidation,
  validate
} = require('../middleware/validation');

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  }
});

router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/register/verify', authLimiter, registrationMfaValidation, validate, verifyRegistrationMfa);
router.post('/register/resend', authLimiter, registrationMfaResendValidation, validate, resendRegistrationMfa);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/login/verify', authLimiter, privilegedLoginMfaValidation, validate, verifyPrivilegedLoginMfa);
router.post('/login/resend', authLimiter, privilegedLoginMfaResendValidation, validate, resendPrivilegedLoginMfa);
router.post('/refresh', authLimiter, refreshValidation, validate, refresh);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, validate, resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileValidation, validate, updateProfile);
router.patch('/profile', protect, updateProfileValidation, validate, updateProfile);
router.put('/change-password', protect, changePasswordValidation, validate, changePassword);
router.post('/logout', protect, logout);

module.exports = router;
