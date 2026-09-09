const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'user_login',
      'user_logout',
      'auth_token_refreshed',
      'user_created',
      'user_updated',
      'user_deleted',
      'incident_created',
      'incident_updated',
      'incident_validated',
      'ai_analysis_completed',
      'ai_analysis_unavailable',
      'ai_analysis_failed',
      'incident_rejected',
      'incident_marked_duplicate',
      'incident_priority_assigned',
      'incident_jurisdiction_updated',
      'incident_routed',
      'incident_assigned',
      'incident_closed',
      'work_order_created',
      'work_order_assigned',
      'work_order_reassigned',
      'work_order_accepted',
      'work_order_declined',
      'work_order_started',
      'work_order_updated',
      'work_order_progress_updated',
      'repair_evidence_uploaded',
      'work_order_completed',
      'work_order_verified',
      'repair_approved',
      'repair_rejected',
      'sla_escalated',
      'sla_approaching',
      'sla_overdue',
      'file_uploaded',
      'file_deleted',
      'settings_changed',
      'role_changed',
      'permission_changed',
      'password_reset_requested',
      'password_reset_completed'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  affectedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resourceType: {
    type: String,
    enum: ['User', 'Incident', 'WorkOrder', 'Notification', 'System']
  },
  resourceId: mongoose.Schema.Types.ObjectId,
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success'
  },
  errorMessage: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

// TTL index - auto-delete logs older than 1 year
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
