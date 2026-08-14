const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: String,
  subcategories: [{
    name: String,
    code: String,
    description: String
  }],
  defaultPriority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  assignmentRules: {
    requiresUtilityProvider: { type: Boolean, default: false },
    requiresBarangayApproval: { type: Boolean, default: true },
    requiresCityApproval: { type: Boolean, default: false }
  },
  icon: String,
  color: String,
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Category', categorySchema);
