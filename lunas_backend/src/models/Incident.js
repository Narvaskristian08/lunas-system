const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  reportNumber: {
    type: String,
    unique: true,
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['road', 'drainage', 'electrical', 'water', 'gas', 'streetlight', 'other'],
    required: [true, 'Category is required']
  },
  subcategory: {
    type: String,
    enum: ['pothole', 'crack', 'collapse', 'flooding', 'blockage', 'leak', 'outage', 'damage', 'missing', 'other']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      street: String,
      barangay: { type: String, required: true },
      city: { type: String, default: 'Dagupan City' },
      landmark: String
    }
  },
  images: [{
    url: { type: String, required: true },
    key: String,
    uploadedAt: { type: Date, default: Date.now },
    isPrivacyMasked: { type: Boolean, default: false }
  }],
  aiAnalysis: {
    detected: { type: Boolean, default: false },
    hazardType: String,
    confidence: Number,
    needsPrivacyMasking: { type: Boolean, default: false },
    processedAt: Date
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['submitted', 'validated', 'assigned', 'in_progress', 'completed', 'verified', 'rejected', 'duplicate', 'closed'],
    default: 'submitted'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedUtility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder'
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: Date,
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  },
  sla: {
    targetResolutionTime: Number, // in hours
    deadline: Date,
    isOverdue: { type: Boolean, default: false },
    escalationLevel: { type: Number, default: 0 },
    lastEscalatedAt: Date
  },
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    notes: String
  }],
  rejectionReason: String,
  notes: String,
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Geospatial index for location queries
incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ reportNumber: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ priority: 1 });
incidentSchema.index({ 'location.address.barangay': 1 });
incidentSchema.index({ reporter: 1 });
incidentSchema.index({ createdAt: -1 });

// Generate unique report number before saving
incidentSchema.pre('save', async function(next) {
  if (!this.reportNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Incident').countDocuments();
    this.reportNumber = `LUNAS-${year}${month}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Method to check if SLA is overdue
incidentSchema.methods.checkSLAStatus = function() {
  if (this.sla.deadline && new Date() > this.sla.deadline) {
    this.sla.isOverdue = true;
    return true;
  }
  return false;
};

module.exports = mongoose.model('Incident', incidentSchema);
