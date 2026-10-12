const crypto = require('crypto');
const { canSignIn } = require('../utils/accountPolicy');
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const asyncHandler = require('../middleware/asyncHandler');
const {
  hashToken,
  isCurrentTokenVersion,
  issueTokenPair,
  verifyRefreshToken
} = require('../utils/authTokens');
const { deliverPasswordReset } = require('../services/passwordResetDeliveryService');
const {
  createRecoveryEmailChallenge,
  deliverRecoveryEmailCode,
  hashCode,
  maskEmail,
  safeEqual
} = require('../services/recoveryEmailService');
const { verifyLoginCaptcha } = require('../services/captchaService');
const {
  createRegistrationChallenge,
  deliverRegistrationCode,
  isRegistrationChallengeTokenValid,
  registrationChallengeResponse,
  verifyRegistrationChallenge
} = require('../services/registrationMfaService');

const MAX_REFRESH_TOKENS = Math.max(1, parseInt(process.env.MAX_REFRESH_TOKENS_PER_USER, 10) || 5);
const loginCaptchaBypassEnabled =
  process.env.NODE_ENV !== 'production' && process.env.LUNAS_DISABLE_LOGIN_CAPTCHA === 'true';

const requestSource = (platform) => {
  if (platform === 'web') return 'web';
  if (platform === 'android' || platform === 'ios') return 'mobile';
  return 'api';
};

const auditRequestContext = (req, source = 'api') => ({
  source,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});

const addRefreshToken = (user, tokenPair, req) => {
  const now = new Date();
  const unexpiredTokens = (user.refreshTokens || []).filter((token) => token.expiresAt > now);
  const retainedCount = MAX_REFRESH_TOKENS - 1;
  const activeTokens = retainedCount ? unexpiredTokens.slice(-retainedCount) : [];

  activeTokens.push({
    tokenHash: tokenPair.refreshTokenHash,
    expiresAt: tokenPair.refreshTokenExpiresAt,
    userAgent: req.headers['user-agent']
  });
  user.refreshTokens = activeTokens;
};

const tokenResponseData = (user, tokenPair) => ({
  user: user.toPublicJSON(),
  accessToken: tokenPair.accessToken,
  refreshToken: tokenPair.refreshToken,
  // Keep the original response contract working while clients migrate to
  // accessToken/refreshToken.
  token: tokenPair.accessToken,
  expiresIn: process.env.JWT_EXPIRE || '15m'
});

const unauthorized = (res, message = 'Invalid or expired authentication token') => res.status(401).json({
  success: false,
  message
});

const applyRegistrationChallenge = (user, challenge) => {
  user.registrationChallengeHash = challenge.challengeTokenHash;
  user.registrationMfaCodeHash = challenge.codeHash;
  user.registrationMfaExpires = challenge.expiresAt;
  user.registrationMfaAttempts = 0;
  user.registrationMfaSentAt = new Date();
};

const registrationMfaFields = [
  '+registrationChallengeHash',
  '+registrationMfaCodeHash',
  '+registrationMfaExpires',
  '+registrationMfaAttempts',
  '+registrationMfaSentAt',
  '+refreshTokens',
  '+tokenVersion'
].join(' ');

const recoveryEmailFields = [
  '+recoveryEmailPending',
  '+recoveryEmailVerificationCodeHash',
  '+recoveryEmailVerificationExpiresAt',
  '+recoveryEmailVerificationAttempts',
  '+recoveryEmailVerificationSentAt'
].join(' ');

const recoveryEmailMaxAttempts = Math.max(
  1,
  parseInt(process.env.RECOVERY_EMAIL_MAX_ATTEMPTS, 10) || 5
);

// @desc    Register a citizen account
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { firstName, middleName, suffix, lastName, email, phone, password, address } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail }).select(`${registrationMfaFields} +password`);
  if (existingUser && existingUser.role === 'citizen' && existingUser.isActive === false
    && existingUser.isVerified === false && !existingUser.isArchived && !existingUser.requiresActivation
    && await existingUser.comparePassword(password)) {
    const resendSeconds = Math.max(30, parseInt(process.env.REGISTRATION_MFA_RESEND_SECONDS, 10) || 60);
    const elapsed = Date.now() - new Date(existingUser.registrationMfaSentAt || 0).getTime();
    if (elapsed < resendSeconds * 1000) return res.status(429).json({ success: false, message: 'Wait before requesting another verification code.' });
    const challenge = createRegistrationChallenge(normalizedEmail);
    const delivery = await deliverRegistrationCode({ email: normalizedEmail, firstName: existingUser.firstName, code: challenge.code });
    if (!delivery.delivered) return res.status(503).json({ success: false, message: 'Registration verification is temporarily unavailable. Please try again later.' });
    existingUser.registrationChallengeHash = challenge.challengeTokenHash;
    existingUser.registrationMfaCodeHash = challenge.codeHash;
    existingUser.registrationMfaExpires = challenge.expiresAt;
    existingUser.registrationMfaAttempts = 0;
    existingUser.registrationMfaSentAt = new Date();
    await existingUser.save();
    return res.status(200).json({ success: true, message: 'Enter the verification code sent to your email to finish registration.', data: registrationChallengeResponse({ challenge, email: normalizedEmail }) });
  }

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists. Sign in or use Forgot Password.'
    });
  }

  const challenge = createRegistrationChallenge(normalizedEmail);
  const delivery = await deliverRegistrationCode({
    email: normalizedEmail,
    firstName,
    code: challenge.code
  });
  if (!delivery.delivered) {
    await createAuditLog({
      action: 'registration_mfa_delivery_failed',
      actorType: 'anonymous',
      resourceType: 'System',
      status: 'failure',
      details: { reason: delivery.configured ? 'provider_failed' : 'provider_not_configured' },
      ...auditRequestContext(req, 'mobile')
    });
    return res.status(503).json({
      success: false,
      message: 'Registration verification is temporarily unavailable. Please try again later.'
    });
  }

  // Public registration is deliberately citizen-only. No session is issued
  // until the email OTP challenge has been completed.
  let user;
  try {
    user = await User.create({
      firstName,
      middleName,
      suffix,
      lastName,
      email: normalizedEmail,
      phone,
      password,
      role: 'citizen',
      address,
      isActive: false,
      isVerified: false,
      registrationChallengeHash: challenge.challengeTokenHash,
      registrationMfaCodeHash: challenge.codeHash,
      registrationMfaExpires: challenge.expiresAt,
      registrationMfaAttempts: 0,
      registrationMfaSentAt: new Date()
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Sign in or use Forgot Password.'
      });
    }
    throw error;
  }

  await createAuditLog({
    action: 'registration_mfa_challenged',
    performedBy: user._id,
    resourceType: 'User',
    resourceId: user._id,
    details: { role: user.role, deliveryConfigured: delivery.configured },
    ...auditRequestContext(req, 'mobile')
  });

  res.status(201).json({
    success: true,
    message: 'Enter the verification code sent to your email to finish registration.',
    data: registrationChallengeResponse({ challenge, email: normalizedEmail })
  });
});

// @desc    Verify the email OTP and finish citizen registration
// @route   POST /api/v1/auth/register/verify
// @access  Public
exports.verifyRegistrationMfa = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(registrationMfaFields);

  if (!user || user.role !== 'citizen' || user.isArchived || user.isVerified || Number(user.registrationMfaAttempts) >= 5) {
    await createAuditLog({
      action: 'registration_mfa_failed',
      ...(user ? { performedBy: user._id, resourceType: 'User', resourceId: user._id } : {
        actorType: 'anonymous', resourceType: 'System'
      }),
      status: 'failure',
      details: { reason: user ? 'challenge_unavailable_or_locked' : 'challenge_not_found' },
      ...auditRequestContext(req, 'mobile')
    });
    return res.status(400).json({
      success: false,
      message: 'The registration verification code is invalid or expired.'
    });
  }

  const verification = verifyRegistrationChallenge({
    user,
    challengeToken: req.body.challengeToken,
    code: req.body.code
  });
  if (!verification.valid) {
    user.registrationMfaAttempts = Number(user.registrationMfaAttempts || 0) + 1;
    await user.save({ validateBeforeSave: false });
    await createAuditLog({
      action: 'registration_mfa_failed',
      performedBy: user._id,
      resourceType: 'User',
      resourceId: user._id,
      details: { reason: verification.reason, attempts: user.registrationMfaAttempts },
      status: 'failure',
      ...auditRequestContext(req, 'mobile')
    });
    return res.status(400).json({
      success: false,
      message: 'The registration verification code is invalid or expired.'
    });
  }

  user.isVerified = true;
  user.isActive = true;
  user.registrationChallengeHash = undefined;
  user.registrationMfaCodeHash = undefined;
  user.registrationMfaExpires = undefined;
  user.registrationMfaAttempts = 0;
  user.registrationMfaSentAt = undefined;
  const tokenPair = issueTokenPair(user);
  addRefreshToken(user, tokenPair, req);
  await user.save();

  await createAuditLog({
    action: 'registration_mfa_verified',
    performedBy: user._id,
    resourceType: 'User',
    resourceId: user._id,
    ...auditRequestContext(req, 'mobile')
  });
  await createAuditLog({
    action: 'user_created',
    performedBy: user._id,
    resourceType: 'User',
    resourceId: user._id,
    details: { role: user.role, registrationMfaVerified: true },
    ...auditRequestContext(req, 'mobile')
  });

  return res.status(200).json({
    success: true,
    message: 'Registration verified successfully',
    data: tokenResponseData(user, tokenPair)
  });
});

// @desc    Rotate and resend a pending registration OTP
// @route   POST /api/v1/auth/register/resend
// @access  Public
exports.resendRegistrationMfa = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(registrationMfaFields);
  if (!user || user.role !== 'citizen' || user.isArchived || user.isVerified
    || !isRegistrationChallengeTokenValid(user, req.body.challengeToken)) {
    await createAuditLog({
      action: 'registration_mfa_failed',
      ...(user ? { performedBy: user._id, resourceType: 'User', resourceId: user._id } : {
        actorType: 'anonymous', resourceType: 'System'
      }),
      status: 'failure',
      details: { reason: 'invalid_resend_challenge' },
      ...auditRequestContext(req, 'mobile')
    });
    return res.status(400).json({
      success: false,
      message: 'The pending registration challenge is invalid or expired.'
    });
  }

  const resendSeconds = Math.max(30, parseInt(process.env.REGISTRATION_MFA_RESEND_SECONDS, 10) || 60);
  const elapsedMs = Date.now() - new Date(user.registrationMfaSentAt || 0).getTime();
  if (elapsedMs < resendSeconds * 1000) {
    await createAuditLog({
      action: 'registration_mfa_failed',
      performedBy: user._id,
      resourceType: 'User',
      resourceId: user._id,
      status: 'warning',
      details: { reason: 'resend_cooldown' },
      ...auditRequestContext(req, 'mobile')
    });
    return res.status(429).json({
      success: false,
      message: 'Wait before requesting another verification code.',
      data: { retryAfterSeconds: Math.ceil((resendSeconds * 1000 - elapsedMs) / 1000) }
    });
  }

  const challenge = createRegistrationChallenge(normalizedEmail);
  const delivery = await deliverRegistrationCode({
    email: normalizedEmail,
    firstName: user.firstName,
    middleName: user.middleName,
    suffix: user.suffix,
    code: challenge.code
  });
  if (!delivery.delivered) {
    await createAuditLog({
      action: 'registration_mfa_delivery_failed',
      performedBy: user._id,
      resourceType: 'User',
      resourceId: user._id,
      status: 'failure',
      details: { reason: delivery.configured ? 'provider_failed' : 'provider_not_configured', resend: true },
      ...auditRequestContext(req, 'mobile')
    });
    return res.status(503).json({
      success: false,
      message: 'Registration verification is temporarily unavailable. Please try again later.'
    });
  }

  applyRegistrationChallenge(user, challenge);
  await user.save({ validateBeforeSave: false });

  await createAuditLog({
    action: 'registration_mfa_challenged',
    performedBy: user._id,
    resourceType: 'User',
    resourceId: user._id,
    details: { resend: true, deliveryConfigured: delivery.configured },
    ...auditRequestContext(req, 'mobile')
  });

  return res.status(200).json({
    success: true,
    message: 'A new verification code was sent.',
    data: registrationChallengeResponse({ challenge, email: normalizedEmail })
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password, deviceToken, platform, captchaToken } = req.body;
  const normalizedEmail = email.toLowerCase();

  if (platform === 'web' && !loginCaptchaBypassEnabled) {
    if (!captchaToken) {
      await createAuditLog({
        action: 'login_captcha_failed',
        actorType: 'anonymous',
        resourceType: 'System',
        status: 'failure',
        details: { reason: 'missing_token' },
        ...auditRequestContext(req, 'web')
      });
      return res.status(400).json({ success: false, message: 'Complete the CAPTCHA challenge.' });
    }
    const captcha = await verifyLoginCaptcha({ token: captchaToken, remoteIp: req.ip });
    if (!captcha.success) {
      await createAuditLog({
        action: captcha.unavailable ? 'login_captcha_unavailable' : 'login_captcha_failed',
        actorType: 'anonymous',
        resourceType: 'System',
        status: captcha.unavailable ? 'warning' : 'failure',
        details: { reason: captcha.unavailable ? 'provider_unavailable' : 'challenge_rejected' },
        ...auditRequestContext(req, 'web')
      });
      return res.status(captcha.unavailable ? 503 : 400).json({
        success: false,
        message: captcha.unavailable
          ? 'CAPTCHA verification is temporarily unavailable.'
          : 'CAPTCHA verification failed. Please try again.'
      });
    }
  }

  const user = await User.findOne({ email: normalizedEmail })
    .select('+password +refreshTokens +tokenVersion');

  if (!user || !(await user.comparePassword(password))) {
    await createAuditLog({
      action: 'user_login',
      ...(user ? { performedBy: user._id, resourceType: 'User', resourceId: user._id } : {
        actorType: 'anonymous', resourceType: 'System'
      }),
      status: 'failure',
      details: { reason: 'invalid_credentials', accountMatched: Boolean(user) },
      ...auditRequestContext(req, requestSource(platform))
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  if (!user.isVerified && !user.isActive && !user.isArchived) {
    await createAuditLog({
      action: 'user_login',
      performedBy: user._id,
      resourceType: 'User',
      resourceId: user._id,
      status: 'failure',
      details: { reason: 'registration_verification_required' },
      ...auditRequestContext(req, requestSource(platform))
    });
    return res.status(403).json({
      success: false,
      message: 'Your account still needs verification'
    });
  }

  if (!canSignIn(user)) {
    await createAuditLog({
      action: 'user_login',
      performedBy: user._id,
      resourceType: 'User',
      resourceId: user._id,
      status: 'failure',
      details: { reason: user.isArchived ? 'account_archived' : 'account_inactive' },
      ...auditRequestContext(req, requestSource(platform))
    });
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated'
    });
  }

  if (deviceToken && platform) {
    const existingToken = user.deviceTokens.find((token) => token.token === deviceToken);
    if (!existingToken) {
      user.deviceTokens.push({ token: deviceToken, platform });
    }
  }

  user.lastLogin = new Date();
  const tokenPair = issueTokenPair(user);
  addRefreshToken(user, tokenPair, req);
  await user.save();

  await createAuditLog({
    action: 'user_login',
    performedBy: user._id,
    resourceType: 'User',
    resourceId: user._id,
    status: 'success',
    ...auditRequestContext(req, requestSource(platform))
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: tokenResponseData(user, tokenPair)
  });
});

// @desc    Refresh an authenticated session using a one-time refresh token
// @route   POST /api/v1/auth/refresh
// @access  Public
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return unauthorized(res);
  }

  if (decoded.tokenType !== 'refresh') {
    return unauthorized(res);
  }

  const user = await User.findById(decoded.id).select('+refreshTokens +tokenVersion');
  if (!user || !canSignIn(user) || !isCurrentTokenVersion(decoded, user)) {
    return unauthorized(res);
  }

  const tokenHash = hashToken(refreshToken);
  const now = new Date();
  const matchingToken = (user.refreshTokens || []).find((token) => (
    token.tokenHash === tokenHash && token.expiresAt > now
  ));

  if (!matchingToken) {
    return unauthorized(res);
  }

  // Rotate the token: a refresh token can only be used once.
  user.refreshTokens = user.refreshTokens.filter((token) => token.tokenHash !== tokenHash);
  const tokenPair = issueTokenPair(user);
  addRefreshToken(user, tokenPair, req);
  await user.save();

  await createAuditLog({
    action: 'auth_token_refreshed',
    performedBy: user._id,
    resourceType: 'User',
    resourceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Session refreshed',
    data: tokenResponseData(user, tokenPair)
  });
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return unauthorized(res, 'User not found');
  }

  res.status(200).json({
    success: true,
    data: user.toPublicJSON()
  });
});

// @desc    Get the current user's recovery-email status
// @route   GET /api/v1/auth/recovery-email/status
// @access  Private
exports.getRecoveryEmailStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return unauthorized(res, 'User not found');
  }

  const verified = Boolean(user.recoveryEmail && user.recoveryEmailVerifiedAt);
  return res.status(200).json({
    success: true,
    data: {
      configured: Boolean(user.recoveryEmail),
      verified,
      maskedEmail: verified ? maskEmail(user.recoveryEmail) : null
    }
  });
});

// @desc    Send a one-time code to a new recovery email
// @route   POST /api/v1/auth/recovery-email/request
// @access  Private
exports.requestRecoveryEmailVerification = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email.toLowerCase();
  const user = await User.findById(req.user._id).select(recoveryEmailFields);

  if (!user) {
    return unauthorized(res, 'User not found');
  }

  if (normalizedEmail === user.email) {
    return res.status(400).json({
      success: false,
      message: 'Use a separate email address that you can access for account recovery.'
    });
  }

  const resendAfterSeconds = Math.max(
    30,
    parseInt(process.env.RECOVERY_EMAIL_RESEND_SECONDS, 10) || 60
  );
  const sentAt = user.recoveryEmailVerificationSentAt?.getTime?.() || 0;
  const retryAfterSeconds = resendAfterSeconds - Math.floor((Date.now() - sentAt) / 1000);
  if (sentAt && retryAfterSeconds > 0) {
    return res.status(429).json({
      success: false,
      message: 'Please wait before requesting another verification code.',
      retryAfterSeconds
    });
  }

  const challenge = createRecoveryEmailChallenge(normalizedEmail);
  const delivery = await deliverRecoveryEmailCode({
    email: normalizedEmail,
    firstName: user.firstName,
    middleName: user.middleName,
    suffix: user.suffix,
    code: challenge.code
  });

  if (!delivery.delivered) {
    await createAuditLog({
      action: 'recovery_email_verification_failed',
      performedBy: user._id,
      resourceType: 'User',
      resourceId: user._id,
      status: 'failure',
      details: {
        reason: delivery.configured ? 'provider_failed' : 'provider_not_configured'
      },
      ...auditRequestContext(req, 'web')
    });
    return res.status(503).json({
      success: false,
      message: 'Recovery email delivery is temporarily unavailable. Please try again later.'
    });
  }

  user.recoveryEmailPending = normalizedEmail;
  user.recoveryEmailVerificationCodeHash = challenge.codeHash;
  user.recoveryEmailVerificationExpiresAt = challenge.expiresAt;
  user.recoveryEmailVerificationAttempts = 0;
  user.recoveryEmailVerificationSentAt = new Date();
  await user.save({ validateBeforeSave: false });

  await createAuditLog({
    action: 'recovery_email_verification_requested',
    performedBy: user._id,
    resourceType: 'User',
    resourceId: user._id,
    details: {
      maskedEmail: maskEmail(normalizedEmail),
      deliveryConfigured: delivery.configured,
      delivered: delivery.delivered
    },
    ...auditRequestContext(req, 'web')
  });

  return res.status(200).json({
    success: true,
    message: 'A verification code was sent to your recovery email.',
    data: {
      maskedEmail: maskEmail(normalizedEmail),
      expiresInSeconds: challenge.expiresInSeconds,
      resendAfterSeconds: challenge.resendAfterSeconds
    }
  });
});

// @desc    Verify and activate a recovery email
// @route   POST /api/v1/auth/recovery-email/verify
// @access  Private
exports.verifyRecoveryEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(recoveryEmailFields);
  if (!user) return unauthorized(res, 'User not found');

  const failure = async (reason) => {
    await createAuditLog({
      action: 'recovery_email_verification_failed',
      performedBy: user._id,
      resourceType: 'User',
      resourceId: user._id,
      status: 'failure',
      details: { reason },
      ...auditRequestContext(req, 'web')
    });
    return res.status(400).json({
      success: false,
      message: 'The recovery email verification code is invalid or expired.'
    });
  };

  if (!user.recoveryEmailPending) return failure('challenge_not_found');
  if (Number(user.recoveryEmailVerificationAttempts || 0) >= recoveryEmailMaxAttempts) {
    return failure('attempt_limit');
  }
  if (!user.recoveryEmailVerificationExpiresAt || user.recoveryEmailVerificationExpiresAt <= new Date()) {
    return failure('expired');
  }

  const submittedHash = hashCode({ email: user.recoveryEmailPending, code: req.body.code });
  if (!safeEqual(user.recoveryEmailVerificationCodeHash, submittedHash)) {
    user.recoveryEmailVerificationAttempts = Number(user.recoveryEmailVerificationAttempts || 0) + 1;
    await user.save({ validateBeforeSave: false });
    return failure('invalid_code');
  }

  const verifiedEmail = user.recoveryEmailPending;
  user.recoveryEmail = verifiedEmail;
  user.recoveryEmailVerifiedAt = new Date();
  user.recoveryEmailPending = undefined;
  user.recoveryEmailVerificationCodeHash = undefined;
  user.recoveryEmailVerificationExpiresAt = undefined;
  user.recoveryEmailVerificationAttempts = 0;
  user.recoveryEmailVerificationSentAt = undefined;
  await user.save({ validateBeforeSave: false });

  await createAuditLog({
    action: 'recovery_email_verified',
    performedBy: user._id,
    resourceType: 'User',
    resourceId: user._id,
    details: { maskedEmail: maskEmail(verifiedEmail) },
    ...auditRequestContext(req, 'web')
  });

  return res.status(200).json({
    success: true,
    message: 'Recovery email verified successfully.',
    data: {
      configured: true,
      verified: true,
      maskedEmail: maskEmail(verifiedEmail)
    }
  });
});

// @desc    Update own user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  if (req.user.role === 'repair_personnel' && ['firstName', 'middleName', 'suffix', 'lastName', 'phone', 'address']
    .some(field => req.body[field] !== undefined)) {
    return res.status(403).json({ success: false, message: 'Your account details are managed by your Utility Provider.' });
  }
  const allowedFields = ['firstName', 'middleName', 'suffix', 'lastName', 'address', 'profileImage',
    ...(['citizen', 'repair_personnel'].includes(req.user.role) ? ['phone'] : [])];
  const fieldsToUpdate = Object.fromEntries(
    allowedFields
      .filter((field) => req.body[field] !== undefined)
      .map((field) => [field, req.body[field]])
  );

  const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  await createAuditLog({
    action: 'user_updated',
    performedBy: req.user._id,
    resourceType: 'User',
    resourceId: req.user._id,
    details: { updatedFields: Object.keys(fieldsToUpdate) },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user.toPublicJSON()
  });
});

// @desc    Change password and revoke existing sessions
// @route   PUT /api/v1/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +refreshTokens +tokenVersion');

  if (!user || !(await user.comparePassword(currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  if (await user.comparePassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Choose a new password that is different from your current password.'
    });
  }

  user.password = newPassword;
  user.tokenVersion += 1;
  user.refreshTokens = [];
  const tokenPair = issueTokenPair(user);
  addRefreshToken(user, tokenPair, req);
  await user.save();

  await createAuditLog({
    action: 'user_updated',
    performedBy: req.user._id,
    resourceType: 'User',
    resourceId: req.user._id,
    details: { action: 'password_changed' },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    data: tokenResponseData(user, tokenPair)
  });
});

// @desc    Request a password reset without revealing whether an account exists
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const genericResponse = {
    success: true,
    message: 'If an active account matches that email, password reset instructions will be sent.'
  };
  const user = await User.findOne({ email: req.body.email.toLowerCase() })
    .select('+passwordResetToken +passwordResetExpires +recoveryEmail +recoveryEmailVerifiedAt');

  if (!canSignIn(user)) {
    return res.status(200).json(genericResponse);
  }

  if (!user.recoveryEmail || !user.recoveryEmailVerifiedAt) {
    await createAuditLog({
      action: 'password_reset_requested',
      performedBy: user._id,
      resourceType: 'User',
      resourceId: user._id,
      details: { deliveryConfigured: false, delivered: false, reason: 'recovery_email_unavailable' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(200).json(genericResponse);
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const delivery = await deliverPasswordReset({ user, resetToken });
  await createAuditLog({
    action: 'password_reset_requested',
    performedBy: user._id,
    resourceType: 'User',
    resourceId: user._id,
    details: { deliveryConfigured: delivery.configured, delivered: delivery.delivered },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return res.status(200).json(genericResponse);
});

// @desc    Complete a password reset
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash('sha256').update(req.body.token).digest('hex');
  const user = await User.findOne({
    isActive: true,
    isArchived: { $ne: true },
    requiresActivation: { $ne: true },
    $or: [{ accountStatus: 'active' }, { accountStatus: { $exists: false } }],
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() }
  }).select('+password +passwordResetToken +passwordResetExpires +refreshTokens +tokenVersion');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Password reset token is invalid or has expired'
    });
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion += 1;
  user.refreshTokens = [];
  const tokenPair = issueTokenPair(user);
  addRefreshToken(user, tokenPair, req);
  await user.save();

  await createAuditLog({
    action: 'password_reset_completed',
    performedBy: user._id,
    resourceType: 'User',
    resourceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
    data: tokenResponseData(user, tokenPair)
  });
});

// @desc    Logout and revoke all active sessions for the account
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  const { deviceToken } = req.body;
  const user = await User.findById(req.user._id).select('+refreshTokens +tokenVersion');

  if (user) {
    if (deviceToken) {
      user.deviceTokens = user.deviceTokens.filter((token) => token.token !== deviceToken);
    }
    user.refreshTokens = [];
    user.tokenVersion += 1;
    await user.save();
  }

  await createAuditLog({
    action: 'user_logout',
    performedBy: req.user._id,
    resourceType: 'User',
    resourceId: req.user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});
