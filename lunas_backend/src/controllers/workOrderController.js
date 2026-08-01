const WorkOrder = require('../models/WorkOrder');
const Incident = require('../models/Incident');
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create work order
// @route   POST /api/v1/work-orders
// @access  Private (Officials only)
exports.createWorkOrder = asyncHandler(async (req, res) => {
  const { incident, assignedTo, priority, instructions, estimatedCompletionTime } = req.body;

  // Check if incident exists
  const incidentDoc = await Incident.findById(incident);
  if (!incidentDoc) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found'
    });
  }

  // Check if incident already has a work order
  if (incidentDoc.workOrder) {
    return res.status(400).json({
      success: false,
      message: 'Work order already exists for this incident'
    });
  }

  // Check if assigned user exists and has appropriate role
  const assignedUser = await User.findById(assignedTo);
  if (!assignedUser) {
    return res.status(404).json({
      success: false,
      message: 'Assigned user not found'
    });
  }

  if (!['repair_personnel', 'utility_provider'].includes(assignedUser.role)) {
    return res.status(400).json({
      success: false,
      message: 'Can only assign to repair personnel or utility providers'
    });
  }

  // Create work order
  const workOrder = await WorkOrder.create({
    incident,
    assignedTo,
    assignedBy: req.user._id,
    priority: priority || incidentDoc.priority,
    instructions,
    estimatedCompletionTime,
    sla: {
      deadline: incidentDoc.sla.deadline
    }
  });

  // Update incident
  incidentDoc.workOrder = workOrder._id;
  incidentDoc.assignedTo = assignedTo;
  incidentDoc.status = 'assigned';
  incidentDoc.statusHistory.push({
    status: 'assigned',
    changedBy: req.user._id,
    notes: `Work order ${workOrder.orderNumber} created`
  });
  await incidentDoc.save();

  await createAuditLog({
    action: 'work_order_created',
    performedBy: req.user._id,
    resourceType: 'WorkOrder',
    resourceId: workOrder._id,
    details: { orderNumber: workOrder.orderNumber, assignedTo },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    message: 'Work order created successfully',
    data: workOrder
  });
});

// @desc    Get all work orders
// @route   GET /api/v1/work-orders
// @access  Private
exports.getWorkOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, sortBy = '-createdAt' } = req.query;

  const filter = {};

  // Role-based filtering
  if (req.user.role === 'repair_personnel' || req.user.role === 'utility_provider') {
    filter.assignedTo = req.user._id;
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const workOrders = await WorkOrder.find(filter)
    .populate('incident')
    .populate('assignedTo', 'firstName lastName role phone')
    .populate('assignedBy', 'firstName lastName')
    .sort(sortBy)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await WorkOrder.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: workOrders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single work order
// @route   GET /api/v1/work-orders/:id
// @access  Private
exports.getWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await WorkOrder.findById(req.params.id)
    .populate('incident')
    .populate('assignedTo', 'firstName lastName role phone email')
    .populate('assignedBy', 'firstName lastName role');

  if (!workOrder) {
    return res.status(404).json({
      success: false,
      message: 'Work order not found'
    });
  }

  // Check authorization
  if (
    req.user.role === 'repair_personnel' &&
    workOrder.assignedTo._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this work order'
    });
  }

  res.status(200).json({
    success: true,
    data: workOrder
  });
});

// @desc    Accept work order
// @route   POST /api/v1/work-orders/:id/accept
// @access  Private (Repair Personnel)
exports.acceptWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await WorkOrder.findById(req.params.id);

  if (!workOrder) {
    return res.status(404).json({
      success: false,
      message: 'Work order not found'
    });
  }

  if (workOrder.assignedTo.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  if (workOrder.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Work order has already been processed'
    });
  }

  workOrder.status = 'accepted';
  workOrder.actualStartTime = Date.now();
  await workOrder.save();

  await createAuditLog({
    action: 'work_order_accepted',
    performedBy: req.user._id,
    resourceType: 'WorkOrder',
    resourceId: workOrder._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Work order accepted',
    data: workOrder
  });
});

// @desc    Update work order progress
// @route   POST /api/v1/work-orders/:id/progress
// @access  Private (Repair Personnel)
exports.updateProgress = asyncHandler(async (req, res) => {
  const { status, notes, images, location } = req.body;

  const workOrder = await WorkOrder.findById(req.params.id);

  if (!workOrder) {
    return res.status(404).json({
      success: false,
      message: 'Work order not found'
    });
  }

  if (workOrder.assignedTo.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  // Add progress update
  workOrder.progressUpdates.push({
    status: status || workOrder.status,
    notes,
    images,
    location,
    updatedBy: req.user._id
  });

  if (status) {
    workOrder.status = status;
  }

  await workOrder.save();

  // Update incident status
  const incident = await Incident.findById(workOrder.incident);
  if (incident && status) {
    incident.status = status === 'accepted' || status === 'in_progress' ? 'in_progress' : status;
    incident.statusHistory.push({
      status: incident.status,
      changedBy: req.user._id,
      notes: notes || 'Work order progress updated'
    });
    await incident.save();
  }

  await createAuditLog({
    action: 'work_order_updated',
    performedBy: req.user._id,
    resourceType: 'WorkOrder',
    resourceId: workOrder._id,
    details: { status, notes },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Progress updated',
    data: workOrder
  });
});

// @desc    Submit completion report
// @route   POST /api/v1/work-orders/:id/complete
// @access  Private (Repair Personnel)
exports.completeWorkOrder = asyncHandler(async (req, res) => {
  const { description, beforeImages, afterImages, workPerformed, materialsUsed, laborHours, totalCost } = req.body;

  const workOrder = await WorkOrder.findById(req.params.id);

  if (!workOrder) {
    return res.status(404).json({
      success: false,
      message: 'Work order not found'
    });
  }

  if (workOrder.assignedTo.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  if (!['accepted', 'in_progress'].includes(workOrder.status)) {
    return res.status(400).json({
      success: false,
      message: 'Work order must be accepted or in progress to be completed'
    });
  }

  workOrder.completionReport = {
    description,
    beforeImages,
    afterImages,
    workPerformed,
    materialsUsed,
    laborHours,
    totalCost,
    submittedAt: Date.now()
  };
  workOrder.status = 'completed';
  workOrder.actualCompletionTime = Date.now();

  await workOrder.save();

  // Update incident
  const incident = await Incident.findById(workOrder.incident);
  if (incident) {
    incident.status = 'completed';
    incident.statusHistory.push({
      status: 'completed',
      changedBy: req.user._id,
      notes: 'Work completed and report submitted'
    });
    await incident.save();
  }

  await createAuditLog({
    action: 'work_order_completed',
    performedBy: req.user._id,
    resourceType: 'WorkOrder',
    resourceId: workOrder._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Work order completed',
    data: workOrder
  });
});

// @desc    Verify completion
// @route   POST /api/v1/work-orders/:id/verify
// @access  Private (Officials only)
exports.verifyCompletion = asyncHandler(async (req, res) => {
  const { status, notes, aiScore, aiAnalysis } = req.body;

  if (!['approved', 'rejected', 'needs_revision'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification status'
    });
  }

  const workOrder = await WorkOrder.findById(req.params.id);

  if (!workOrder) {
    return res.status(404).json({
      success: false,
      message: 'Work order not found'
    });
  }

  if (workOrder.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Only completed work orders can be verified'
    });
  }

  workOrder.verification = {
    verifiedBy: req.user._id,
    verifiedAt: Date.now(),
    status,
    notes,
    aiScore,
    aiAnalysis
  };

  if (status === 'approved') {
    workOrder.status = 'verified';
  } else if (status === 'rejected') {
    workOrder.status = 'rejected';
    workOrder.rejectionReason = notes;
  }

  await workOrder.save();

  // Update incident
  const incident = await Incident.findById(workOrder.incident);
  if (incident && status === 'approved') {
    incident.status = 'verified';
    incident.statusHistory.push({
      status: 'verified',
      changedBy: req.user._id,
      notes: 'Repair verified and approved'
    });
    await incident.save();
  }

  await createAuditLog({
    action: status === 'approved' ? 'repair_approved' : 'repair_rejected',
    performedBy: req.user._id,
    resourceType: 'WorkOrder',
    resourceId: workOrder._id,
    details: { status, notes },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: `Work order ${status}`,
    data: workOrder
  });
});

// @desc    Delete work order
// @route   DELETE /api/v1/work-orders/:id
// @access  Private (Admin only)
exports.deleteWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await WorkOrder.findById(req.params.id);

  if (!workOrder) {
    return res.status(404).json({
      success: false,
      message: 'Work order not found'
    });
  }

  await workOrder.deleteOne();

  await createAuditLog({
    action: 'work_order_deleted',
    performedBy: req.user._id,
    resourceType: 'WorkOrder',
    resourceId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Work order deleted'
  });
});
