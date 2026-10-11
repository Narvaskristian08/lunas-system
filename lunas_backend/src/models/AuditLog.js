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
      'user_archived',
      'authorized_account_created',
      'account_activation_sent',
      'account_activation_completed',
      'account_suspended',
      'account_reactivated',
      'account_deactivated',
      'account_jurisdiction_changed',
      'registration_mfa_challenged',
      'registration_mfa_verified',
      'registration_mfa_failed',
      'registration_mfa_delivery_failed',
      'login_captcha_failed',
      'login_captcha_unavailable',
      'user_archive_failed',
      'incident_created',
      'incident_updated',
      'incident_deleted',
      'incident_validated',
      'incident_barangay_validated',
      'incident_city_confirmed',
      'incident_clarification_requested',
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
      'provider_correction_requested',
      'provider_completion_accepted',
      'provider_coordinated_city_correction',
      'city_engineering_returned_completion',
      'city_engineering_verified_and_closed',
      'sla_escalated',
      'sla_approaching',
      'sla_overdue',
      'file_uploaded',
      'file_deleted',
      'settings_changed',
      'role_changed',
      'permission_changed',
      'password_reset_requested',
      'password_reset_completed',
      'recovery_email_verification_requested',
      'recovery_email_verification_failed',
      'recovery_email_verified'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actorType: {
    type: String,
    enum: ['user', 'anonymous', 'system'],
    default: 'user',
    required: true
  },
  source: {
    type: String,
    enum: ['web', 'mobile', 'api', 'system'],
    default: 'api',
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
auditLogSchema.index({ actorType: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// Accountability records must survive account deactivation. Existing databases
// must run the remove-audit-ttl migration to remove the former TTL index.

module.exports = mongoose.model('AuditLog', auditLogSchema);
