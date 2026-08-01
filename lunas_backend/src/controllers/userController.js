const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin, Officials)
exports.getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, barangay, search, sortBy = 'createdAt' } = req.query;

  const filter = {};
  
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

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Admin only)
exports.updateUser = asyncHandler(async (req, res) => {
  const { role, isActive, isVerified, barangay, expertise } = req.body;

  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const updates = {};
  if (role) updates.role = role;
  if (typeof isActive !== 'undefined') updates.isActive = isActive;
  if (typeof isVerified !== 'undefined') updates.isVerified = isVerified;
  if (barangay) updates.barangay = barangay;
  if (expertise) updates.expertise = expertise;

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
    details: updates,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin only)
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  await user.deleteOne();

  await createAuditLog({
    action: 'user_deleted',
    performedBy: req.user._id,
    affectedUser: req.params.id,
    resourceType: 'User',
    resourceId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Get repair personnel by barangay/expertise
// @route   GET /api/v1/users/repair-personnel
// @access  Private (Officials)
exports.getRepairPersonnel = asyncHandler(async (req, res) => {
  const { barangay, expertise } = req.query;

  const filter = {
    role: 'repair_personnel',
    isActive: true
  };

  if (barangay) filter.barangay = barangay;
  if (expertise) filter.expertise = expertise;

  const personnel = await User.find(filter).select('-password');

  res.status(200).json({
    success: true,
    data: personnel,
    count: personnel.length
  });
});
