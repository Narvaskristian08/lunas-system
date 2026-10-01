const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  idempotencyKey: String,
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'incident_submitted',
      'incident_validated',
      'incident_rejected',
      'incident_routed',
      'work_order_assigned',
      'work_order_reassigned',
      'work_order_accepted',
      'work_order_declined',
      'work_order_in_progress',
      'work_order_progress',
      'work_order_completed',
      'sla_approaching',
      'sla_overdue',
      'repair_verified',
      'repair_rejected',
      'sla_reminder',
      'sla_escalation',
      'status_update',
      'duplicate_detected',
      'system_announcement'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
    // Stable report link used by clients. incidentId is the database
    // reference; reportNumber is display-only and must never be used for the
    // incident detail endpoint.
    reportNumber: { type: String, trim: true },
    workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },
    link: String,
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  sentVia: [{
    type: String,
    enum: ['push', 'email', 'sms', 'in_app']
  }],
  sentAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ idempotencyKey: 1 }, {
  unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } }
});
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model('Notification', notificationSchema);
