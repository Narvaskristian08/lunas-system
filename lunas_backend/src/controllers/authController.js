const crypto = require('crypto');
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

const MAX_REFRESH_TOKENS = Math.max(1, parseInt(process.env.MAX_REFRESH_TOKENS_PER_USER, 10) || 5);

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

// @desc    Register a citizen account
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password, address } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Public registration is deliberately citizen-only. Official accounts must
  // be provisioned through the protected administration workflow.
  const user = await User.create({
    firstName,
    lastName,
    email: normalizedEmail,
    phone,
    password,
    role: 'citizen',
    address
  });

  const tokenPair = issueTokenPair(user);
  addRefreshToken(user, tokenPair, req);
  await user.save();

  await createAuditLog({
    action: 'user_created',
    performedBy: user._id,
    resourceType: 'User',
    resourceId: user._id,
    details: { role: user.role },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    message: 'Citizen account registered successfully',
    data: tokenResponseData(user, tokenPair)
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password, deviceToken, platform } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({ email: normalizedEmail })
    .select('+password +refreshTokens +tokenVersion');

  if (!user || !(await user.comparePassword(password))) {
    if (user) {
      await createAuditLog({
        action: 'user_login',
        performedBy: user._id,
        status: 'failure',
        details: { reason: 'Invalid credentials' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  if (!user.isActive) {
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
    status: 'success',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
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
  if (!user || !user.isActive || !isCurrentTokenVersion(decoded, user)) {
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

// @desc    Update own user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'profileImage'];
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
    .select('+passwordResetToken +passwordResetExpires');

  if (!user || !user.isActive) {
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
