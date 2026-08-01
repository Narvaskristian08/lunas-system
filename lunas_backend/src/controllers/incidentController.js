const Incident = require('../models/Incident');
const WorkOrder = require('../models/WorkOrder');
const { createAuditLog } = require('../utils/auditLogger');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create new incident report
// @route   POST /api/v1/incidents
// @access  Private (Citizen)
exports.createIncident = asyncHandler(async (req, res) => {
  const { category, subcategory, description, location, images, aiAnalysis, priority } = req.body;

  // Create incident
  const incident = await Incident.create({
    reporter: req.user._id,
    category,
    subcategory,
    description,
    location,
    images: images || [],
    aiAnalysis,
    priority: priority || 'medium',
    statusHistory: [{
      status: 'submitted',
      changedBy: req.user._id,
      notes: 'Incident reported'
    }]
  });

  // Set SLA deadline based on priority
  const slaHours = {
    critical: parseInt(process.env.SLA_CRITICAL) || 48,
    high: parseInt(process.env.SLA_HIGH) || 72,
    medium: parseInt(process.env.SLA_MEDIUM) || 168,
    low: parseInt(process.env.SLA_LOW) || 336
  };

  incident.sla.targetResolutionTime = slaHours[incident.priority];
  incident.sla.deadline = new Date(Date.now() + slaHours[incident.priority] * 60 * 60 * 1000);
  await incident.save();

  await createAuditLog({
    action: 'incident_created',
    performedBy: req.user._id,
    resourceType: 'Incident',
    resourceId: incident._id,
    details: { reportNumber: incident.reportNumber, category, priority: incident.priority },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    message: 'Incident reported successfully',
    data: incident
  });
});

// @desc    Get all incidents
// @route   GET /api/v1/incidents
// @access  Private
exports.getIncidents = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    priority,
    category,
    barangay,
    search,
    sortBy = '-createdAt'
  } = req.query;

  // Build filter
  const filter = {};

  // Role-based filtering
  if (req.user.role === 'citizen') {
    filter.reporter = req.user._id;
  } else if (req.user.role === 'barangay_official') {
    filter['location.address.barangay'] = req.user.barangay;
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (barangay) filter['location.address.barangay'] = barangay;
  
  if (search) {
    filter.$or = [
      { reportNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Execute query
  const incidents = await Incident.find(filter)
    .populate('reporter', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName role')
    .populate('validatedBy', 'firstName lastName')
    .sort(sortBy)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Incident.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: incidents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single incident
// @route   GET /api/v1/incidents/:id
// @access  Private
exports.getIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id)
    .populate('reporter', 'firstName lastName email phone')
    .populate('assignedTo', 'firstName lastName role phone')
    .populate('validatedBy', 'firstName lastName')
    .populate('workOrder');

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found'
    });
  }

  // Check authorization
  if (req.user.role === 'citizen' && incident.reporter._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this incident'
    });
  }

  if (req.user.role === 'barangay_official' && incident.location.address.barangay !== req.user.barangay) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access incidents from other barangays'
    });
  }

  res.status(200).json({
    success: true,
    data: incident
  });
});

// @desc    Update incident
// @route   PUT /api/v1/incidents/:id
// @access  Private (Officials only)
exports.updateIncident = asyncHandler(async (req, res) => {
  let incident = await Incident.findById(req.params.id);

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found'
    });
  }

  const { status, priority, notes, rejectionReason } = req.body;

  // Add to status history
  if (status && status !== incident.status) {
    incident.statusHistory.push({
      status,
      changedBy: req.user._id,
      notes: notes || `Status changed to ${status}`
    });
  }

  // Update fields
  if (status) incident.status = status;
  if (priority) incident.priority = priority;
  if (notes) incident.notes = notes;
  if (rejectionReason) incident.rejectionReason = rejectionReason;

  await incident.save();

  await createAuditLog({
    action: 'incident_updated',
    performedBy: req.user._id,
    resourceType: 'Incident',
    resourceId: incident._id,
    details: { status, priority, notes },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Incident updated successfully',
    data: incident
  });
});

// @desc    Validate incident
// @route   POST /api/v1/incidents/:id/validate
// @access  Private (Barangay Official, City Engineer, Admin)
exports.validateIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found'
    });
  }

  if (incident.status !== 'submitted') {
    return res.status(400).json({
      success: false,
      message: 'Only submitted incidents can be validated'
    });
  }

  incident.status = 'validated';
  incident.validatedBy = req.user._id;
  incident.validatedAt = Date.now();
  incident.statusHistory.push({
    status: 'validated',
    changedBy: req.user._id,
    notes: 'Incident validated and approved'
  });

  await incident.save();

  await createAuditLog({
    action: 'incident_validated',
    performedBy: req.user._id,
    resourceType: 'Incident',
    resourceId: incident._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Incident validated successfully',
    data: incident
  });
});

// @desc    Reject incident
// @route   POST /api/v1/incidents/:id/reject
// @access  Private (Officials only)
exports.rejectIncident = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required'
    });
  }

  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found'
    });
  }

  incident.status = 'rejected';
  incident.rejectionReason = reason;
  incident.statusHistory.push({
    status: 'rejected',
    changedBy: req.user._id,
    notes: reason
  });

  await incident.save();

  await createAuditLog({
    action: 'incident_rejected',
    performedBy: req.user._id,
    resourceType: 'Incident',
    resourceId: incident._id,
    details: { reason },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Incident rejected',
    data: incident
  });
});

// @desc    Get nearby incidents
// @route   GET /api/v1/incidents/nearby
// @access  Private
exports.getNearbyIncidents = asyncHandler(async (req, res) => {
  const { longitude, latitude, maxDistance = 5000 } = req.query;

  if (!longitude || !latitude) {
    return res.status(400).json({
      success: false,
      message: 'Longitude and latitude are required'
    });
  }

  const incidents = await Incident.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: parseInt(maxDistance)
      }
    },
    status: { $nin: ['rejected', 'closed'] }
  }).limit(20);

  res.status(200).json({
    success: true,
    data: incidents,
    count: incidents.length
  });
});

// @desc    Delete incident
// @route   DELETE /api/v1/incidents/:id
// @access  Private (Admin only)
exports.deleteIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found'
    });
  }

  await incident.deleteOne();

  await createAuditLog({
    action: 'incident_deleted',
    performedBy: req.user._id,
    resourceType: 'Incident',
    resourceId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Incident deleted successfully'
  });
});
