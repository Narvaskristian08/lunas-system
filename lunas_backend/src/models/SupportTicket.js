const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    immutable: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true
  },
  category: {
    type: String,
    enum: ['bug', 'account_access', 'data_issue', 'feature_request', 'other'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 4000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  adminResponse: {
    type: String,
    trim: true,
    maxlength: 4000
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  closedAt: Date,
  lastRespondedAt: Date
}, {
  timestamps: true
});

supportTicketSchema.index({ requester: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: -1, createdAt: -1 });
supportTicketSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
