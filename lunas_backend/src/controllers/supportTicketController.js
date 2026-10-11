const crypto = require('crypto');
const SupportTicket = require('../models/SupportTicket');
const { createAuditLog } = require('../utils/auditLogger');
const asyncHandler = require('../middleware/asyncHandler');

const ticketNumber = () => `LUNAS-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const serializeTicket = (ticket) => {
  const value = ticket.toObject ? ticket.toObject() : ticket;
  const requester = value.requester && typeof value.requester === 'object' && (
    value.requester.firstName !== undefined || value.requester.lastName !== undefined || value.requester.email !== undefined
  )
    ? {
        id: value.requester._id,
        name: [value.requester.firstName, value.requester.lastName].filter(Boolean).join(' '),
        email: value.requester.email,
        role: value.requester.role
      }
    : undefined;
  return {
    id: value._id,
    ticketNumber: value.ticketNumber,
    requester,
    category: value.category,
    subject: value.subject,
    description: value.description,
    priority: value.priority,
    status: value.status,
    adminResponse: value.adminResponse,
    assignedTo: value.assignedTo,
    resolvedAt: value.resolvedAt,
    closedAt: value.closedAt,
    lastRespondedAt: value.lastRespondedAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
};

const pagination = (req) => ({
  page: Math.max(1, parseInt(req.query.page, 10) || 1),
  limit: Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
});

const auditContext = (req) => ({
  source: 'web',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});

// @desc    Create a support ticket
// @route   POST /api/v1/support-tickets
// @access  Private (support.create)
exports.createSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.create({
    ticketNumber: ticketNumber(),
    requester: req.user._id,
    category: req.body.category,
    subject: req.body.subject.trim(),
    description: req.body.description.trim(),
    priority: req.body.priority || 'medium'
  });

  await createAuditLog({
    action: 'support_ticket_created',
    performedBy: req.user._id,
    resourceType: 'SupportTicket',
    resourceId: ticket._id,
    details: { ticketNumber: ticket.ticketNumber, category: ticket.category, priority: ticket.priority },
    ...auditContext(req)
  });

  return res.status(201).json({
    success: true,
    message: 'Support ticket submitted successfully.',
    data: serializeTicket(ticket)
  });
});

// @desc    List the signed-in user's support tickets
// @route   GET /api/v1/support-tickets/mine
// @access  Private (support.create)
exports.getMySupportTickets = asyncHandler(async (req, res) => {
  const { page, limit } = pagination(req);
  const filter = { requester: req.user._id };
  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter).sort('-createdAt').limit(limit).skip((page - 1) * limit),
    SupportTicket.countDocuments(filter)
  ]);

  return res.status(200).json({
    success: true,
    data: tickets.map(serializeTicket),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// @desc    List all support tickets
// @route   GET /api/v1/support-tickets
// @access  Private (support.manage)
exports.getSupportTickets = asyncHandler(async (req, res) => {
  const { page, limit } = pagination(req);
  const filter = {};
  if (['open', 'in_progress', 'resolved', 'closed'].includes(req.query.status)) filter.status = req.query.status;
  if (['bug', 'account_access', 'data_issue', 'feature_request', 'other'].includes(req.query.category)) filter.category = req.query.category;

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('requester', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit),
    SupportTicket.countDocuments(filter)
  ]);

  return res.status(200).json({
    success: true,
    data: tickets.map(serializeTicket),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// @desc    Read one support ticket owned by the user or any ticket as admin
// @route   GET /api/v1/support-tickets/:id
// @access  Private
exports.getSupportTicket = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin'
    ? { _id: req.params.id }
    : { _id: req.params.id, requester: req.user._id };
  const ticket = await SupportTicket.findOne(filter).populate('requester', 'firstName lastName email role');

  if (!ticket) return res.status(404).json({ success: false, message: 'Support ticket not found' });
  return res.status(200).json({ success: true, data: serializeTicket(ticket) });
});

// @desc    Update support ticket status, priority, or admin response
// @route   PATCH /api/v1/support-tickets/:id
// @access  Private (support.manage)
exports.updateSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Support ticket not found' });

  const previous = { status: ticket.status, priority: ticket.priority, adminResponse: ticket.adminResponse };
  if (req.body.status !== undefined) ticket.status = req.body.status;
  if (req.body.priority !== undefined) ticket.priority = req.body.priority;
  if (req.body.adminResponse !== undefined) {
    ticket.adminResponse = req.body.adminResponse.trim() || undefined;
    ticket.lastRespondedAt = new Date();
  }
  ticket.assignedTo = req.user._id;
  if (ticket.status === 'resolved' || ticket.status === 'closed') ticket.resolvedAt ||= new Date();
  else ticket.resolvedAt = undefined;
  if (ticket.status === 'closed') ticket.closedAt ||= new Date();
  else ticket.closedAt = undefined;
  await ticket.save();

  await createAuditLog({
    action: 'support_ticket_updated',
    performedBy: req.user._id,
    resourceType: 'SupportTicket',
    resourceId: ticket._id,
    details: { ticketNumber: ticket.ticketNumber },
    changes: { before: previous, after: { status: ticket.status, priority: ticket.priority, adminResponse: ticket.adminResponse } },
    ...auditContext(req)
  });

  return res.status(200).json({
    success: true,
    message: 'Support ticket updated successfully.',
    data: serializeTicket(ticket)
  });
});
