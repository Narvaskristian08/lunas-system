const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const asyncHandler = require('../middleware/asyncHandler');
const { requiresPrivilegedMfa } = require('../services/privilegedMfaService');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin, Officials)
exports.getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, barangay, search, sortBy = 'createdAt' } = req.query;

  const canViewArchived = req.user.role === 'admin' && req.query.includeArchived === 'true';
  const filter = canViewArchived
    ? {}
    : { isArchived: { $ne: true } };
  
  if (role) filter.role = role;
  if (barangay) filter.barangay = barangay;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(filter)
    .select('-password')
    .sort(sortBy)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await User.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (req.user.role === 'citizen' && user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access another user profile'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Admin only)
exports.updateUser = asyncHandler(async (req, res) => {
  const {
    role,
    isActive,
    isVerified,
    barangay,
    expertise,
    utilityCompany,
    repairOrganization,
    repairTeam,
    availability
  } = req.body;

  let user = await User.findById(req.params.id).select('+refreshTokens +tokenVersion');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isArchived && isActive === true) {
    return res.status(400).json({
      success: false,
      message: 'Archived accounts must be restored through an audited restore workflow'
    });
  }

  const normalizedUtilityCompany = typeof utilityCompany === 'string'
    ? utilityCompany.trim()
    : utilityCompany;
  if (typeof utilityCompany !== 'undefined'
    && (typeof normalizedUtilityCompany !== 'string'
      || !normalizedUtilityCompany
      || normalizedUtilityCompany.length > 160)) {
    return res.status(400).json({
      success: false,
      message: 'Utility company must be a non-empty value of at most 160 characters'
    });
  }

  const targetRole = role || user.role;
  const targetUtilityCompany = typeof utilityCompany === 'undefined'
    ? user.utilityCompany
    : normalizedUtilityCompany;
  if (targetRole === 'utility_provider' && !targetUtilityCompany) {
    return res.status(400).json({
      success: false,
      message: 'A utility-provider account must have a utility company before it can be activated'
    });
  }

  const updates = {};
  if (role) updates.role = role;
  if (typeof isActive !== 'undefined') updates.isActive = isActive;
  if (typeof isVerified !== 'undefined') updates.isVerified = isVerified;
  if (barangay) updates.barangay = barangay;
  if (expertise) updates.expertise = expertise;
  if (typeof utilityCompany !== 'undefined') updates.utilityCompany = normalizedUtilityCompany;
  if (typeof repairOrganization !== 'undefined') updates.repairOrganization = repairOrganization;
  if (typeof repairTeam !== 'undefined') updates.repairTeam = repairTeam;
  if (typeof availability !== 'undefined') {
    if (!['available', 'assigned', 'unavailable', 'off_duty'].includes(availability)) {
      return res.status(400).json({ success: false, message: 'Invalid personnel availability state' });
    }
    updates.availability = availability;
  }

  const enteringPrivilegedRole = role
    && requiresPrivilegedMfa(role)
    && !requiresPrivilegedMfa(user.role);
  if (enteringPrivilegedRole) {
    updates.tokenVersion = Number(user.tokenVersion || 0) + 1;
    updates.refreshTokens = [];
  }

  user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  }).select('-password');

  await createAuditLog({
    action: 'user_updated',
    performedBy: req.user._id,
    affectedUser: user._id,
    resourceType: 'User',
    resourceId: user._id,
    details: {
      ...updates,
      ...(enteringPrivilegedRole ? { sessionsRevokedForPrivilegedMfa: true } : {})
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

// @desc    Archive user and revoke all active sessions
// @route   PATCH /api/v1/users/:id/archive (DELETE /:id is a compatibility alias)
// @access  Private (Admin only)
exports.archiveUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    await createAuditLog({
      action: 'user_archive_failed',
      performedBy: req.user._id,
      affectedUser: req.user._id,
      resourceType: 'User',
      resourceId: req.user._id,
      status: 'failure',
      details: { reason: 'self_archive_blocked' },
      source: 'web',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(400).json({
      success: false,
      message: 'Administrators cannot archive their own active account'
    });
  }

  const user = await User.findById(req.params.id).select('+refreshTokens +tokenVersion');

  if (!user) {
    await createAuditLog({
      action: 'user_archive_failed',
      performedBy: req.user._id,
      resourceType: 'User',
      resourceId: req.params.id,
      status: 'failure',
      details: { reason: 'target_not_found' },
      source: 'web',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isArchived) {
    await createAuditLog({
      action: 'user_archived',
      performedBy: req.user._id,
      affectedUser: user._id,
      resourceType: 'User',
      resourceId: user._id,
      status: 'warning',
      details: { reason: 'already_archived', noChange: true },
      source: 'web',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(200).json({
      success: true,
      message: 'User account is already archived',
      data: user.toPublicJSON()
    });
  }

  const archiveBefore = {
    isActive: user.isActive,
    isArchived: user.isArchived,
    tokenVersion: Number(user.tokenVersion || 0)
  };
  user.isArchived = true;
  user.isActive = false;
  user.archivedAt = new Date();
  user.archivedBy = req.user._id;
  user.archiveReason = req.body.reason.trim();
  user.refreshTokens = [];
  user.deviceTokens = [];
  user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  await user.save({ validateBeforeSave: false });

  await createAuditLog({
    action: 'user_archived',
    performedBy: req.user._id,
    affectedUser: req.params.id,
    resourceType: 'User',
    resourceId: req.params.id,
    details: { reason: user.archiveReason },
    changes: {
      before: archiveBefore,
      after: {
        isActive: false,
        isArchived: true,
        tokenVersion: user.tokenVersion,
        sessionsRevoked: true
      }
    },
    source: 'web',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'User account archived successfully',
    data: user.toPublicJSON()
  });
});

// Compatibility export for callers that still import the old controller
// symbol. The DELETE route is now a recoverable archive operation.
exports.deleteUser = exports.archiveUser;

// @desc    Get repair personnel by barangay/expertise
// @route   GET /api/v1/users/repair-personnel
// @access  Private (Officials)
exports.getRepairPersonnel = asyncHandler(async (req, res) => {
  const { barangay, expertise } = req.query;

  const filter = {
    role: 'repair_personnel',
    isActive: true,
    isArchived: { $ne: true }
  };

  if (barangay) filter.barangay = barangay;
  if (expertise) filter.expertise = expertise;

  const personnel = await User.find(filter).select(
    'firstName lastName role repairOrganization repairTeam availability barangay expertise isActive'
  );

  res.status(200).json({
    success: true,
    data: personnel,
    count: personnel.length
  });
});
