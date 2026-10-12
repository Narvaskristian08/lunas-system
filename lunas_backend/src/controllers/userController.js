const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const asyncHandler = require('../middleware/asyncHandler');
const { accountStatus, canManageAdministrators } = require('../utils/accountPolicy');

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
  if (req.user.role === 'barangay_official') filter.barangay = req.user.barangay || '__unassigned__';
  if (search) {
    filter.$or = [
      { firstName: { $regex: String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { lastName: { $regex: String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { email: { $regex: String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
    ];
  }

  const users = await User.find(filter)
    .select('-password')
    .sort(['createdAt', '-createdAt', 'firstName', '-firstName'].includes(sortBy) ? sortBy : 'createdAt')
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await User.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: users.map(user => user.toPublicJSON()),
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

  if (user._id.toString() !== req.user._id.toString()
    && !['admin', 'city_engineer'].includes(req.user.role)
    && !(req.user.role === 'barangay_official' && req.user.barangay && user.barangay === req.user.barangay)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access another user profile'
    });
  }

  res.status(200).json({
    success: true,
    data: user.toPublicJSON()
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

  if (user.role === 'admin' && !canManageAdministrators(req.user)) {
    return res.status(403).json({ success: false, message: 'Not authorized to manage administrator accounts' });
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
  user.accountStatus = 'deactivated';
  user.activationTokenHash = undefined;
  user.activationExpiresAt = undefined;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.__v = Number(user.__v || 0) + 1;
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

// @desc    Get repair personnel belonging to the caller's Utility Provider organization
// @route   GET /api/v1/users/repair-personnel
// @access  Private (Utility Provider)
exports.getRepairPersonnel = asyncHandler(async (req, res) => {
  if (req.user.role !== 'utility_provider') {
    return res.status(403).json({ success: false, message: 'Only Utility Providers may select Repair Personnel' });
  }
  const { barangay, expertise } = req.query;

  const filter = {
    role: 'repair_personnel',
    isArchived: { $ne: true },
    repairOrganization: req.user.utilityCompany || '__unassigned__'
  };
  if (barangay) filter.barangay = barangay;
  if (expertise) filter.expertise = expertise;

  const personnel = await User.find(filter).select(
    'firstName middleName suffix lastName email phone position personnelId role repairOrganization repairTeam repairAccountType availability barangay expertise isActive isArchived isVerified requiresActivation accountStatus createdAt __v'
  ).sort({ createdAt: -1, _id: -1 });

  res.status(200).json({
    success: true,
    data: personnel.map(person => ({
      id: person._id,
      version: person.__v || 0,
      firstName: person.firstName,
      middleName: person.middleName,
      suffix: person.suffix,
      lastName: person.lastName,
      email: person.email,
      phone: person.phone,
      position: person.position,
      personnelId: person.personnelId,
      role: person.role,
      organization: person.repairOrganization,
      repairOrganization: person.repairOrganization,
      repairTeam: person.repairTeam,
      repairAccountType: person.repairAccountType || 'individual',
      availability: person.availability,
      barangay: person.barangay,
      expertise: person.expertise,
      isActive: person.isActive,
      isArchived: person.isArchived,
      isVerified: person.isVerified,
      requiresActivation: person.requiresActivation,
      accountStatus: accountStatus(person),
      createdAt: person.createdAt
    })),
    count: personnel.length
  });
});

// @desc    Get selectable Utility Provider organizations with active provisioned accounts
// @route   GET /api/v1/users/utility-providers
// @access  Private (City Engineer)
exports.getUtilityProviderOrganizations = asyncHandler(async (req, res) => {
  if (req.user.role !== 'city_engineer') {
    return res.status(403).json({ success: false, message: 'Only City Engineering may select a responsible Utility Provider' });
  }
  const organizations = await User.distinct('utilityCompany', {
    role: 'utility_provider',
    isActive: true,
    isArchived: { $ne: true },
    utilityCompany: { $type: 'string', $ne: '' }
  });
  return res.status(200).json({
    success: true,
    data: organizations.map((organization) => String(organization).trim()).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    count: organizations.length
  });
});
