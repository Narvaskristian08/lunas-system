const mongoose = require('mongoose');

const slaConfigSchema = new mongoose.Schema({
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    required: true,
    unique: true
  },
  targetResolutionTime: {
    type: Number, // in hours
    required: true
  },
  escalationLevels: [{
    level: Number,
    triggerAfter: Number, // hours after deadline
    notifyRoles: [String],
    action: String
  }],
  reminderSchedule: [{
    sendBefore: Number, // hours before deadline
    message: String
  }],
  autoAssign: {
    enabled: { type: Boolean, default: false },
    criteria: {
      byBarangay: Boolean,
      byExpertise: Boolean,
      byWorkload: Boolean
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index
slaConfigSchema.index({ priority: 1 });

module.exports = mongoose.model('SLAConfig', slaConfigSchema);
