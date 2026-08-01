const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const asyncHandler = require('../middleware/asyncHandler');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password, role, address, barangay, utilityCompany, expertise } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    role: role || 'citizen',
    address,
    barangay,
    utilityCompany,
    expertise
  });

  // Create audit log
  await createAuditLog({
    action: 'user_created',
    performedBy: user._id,
    resourceType: 'User',
    resourceId: user._id,
    details: { role: user.role, email: user.email },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toPublicJSON(),
      token
    }
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password, deviceToken, platform } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Find user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    // Log failed login attempt
    await createAuditLog({
      action: 'user_login',
      performedBy: user._id,
      status: 'failure',
      details: { reason: 'Invalid password' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated'
    });
  }

  // Update device token if provided
  if (deviceToken && platform) {
    const existingToken = user.deviceTokens.find(t => t.token === deviceToken);
    if (!existingToken) {
      user.deviceTokens.push({ token: deviceToken, platform });
    }
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  // Create audit log
  await createAuditLog({
    action: 'user_login',
    performedBy: user._id,
    status: 'success',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toPublicJSON(),
      token
    }
  });
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: user.toPublicJSON()
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    address: req.body.address,
    profileImage: req.body.profileImage
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
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
    details: fieldsToUpdate,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user.toPublicJSON()
  });
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current and new password'
    });
  }

  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
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
    message: 'Password changed successfully'
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  const { deviceToken } = req.body;

  // Remove device token if provided
  if (deviceToken) {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { deviceTokens: { token: deviceToken } }
    });
  }

  await createAuditLog({
    action: 'user_logout',
    performedBy: req.user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});
