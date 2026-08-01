const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'sla', 'notification', 'upload', 'ai', 'map', 'security'],
    default: 'general'
  },
  description: String,
  isEditable: {
    type: Boolean,
    default: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index
systemConfigSchema.index({ key: 1 });
systemConfigSchema.index({ category: 1 });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
