const mongoose = require('mongoose');
const { INCIDENT_CATEGORY_CODES } = require('../utils/incidentCategories');
const { INCIDENT_STATES } = require('../services/incidentTransitionService');

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
    enum: INCIDENT_CATEGORY_CODES,
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
  locationIntegrity: {
    pinSource: { type: String, enum: ['gps', 'map_pin', 'manual'] },
    comparison: { type: String, enum: ['consistent', 'discrepancy', 'unavailable', 'inconclusive'] },
    unavailableReason: String,
    distanceMeters: { type: Number, min: 0 },
    accuracyMeters: { type: Number, min: 0 },
    thresholdMeters: { type: Number, min: 0 },
    significantDiscrepancy: Boolean,
    explanation: { reason: String, text: { type: String, maxlength: 500 } },
    confirmedAt: Date,
    jurisdictionStatus: { type: String, enum: ['unverified_geographically'] }
  },
  // Separate from lifecycle decisions; no historical backfill or account score.
  falseReportReview: {
    version: Number,
    finding: { type: String, enum: ['confirmed_fabrication', 'corrected'] },
    history: [{
      finding: { type: String, enum: ['confirmed_fabrication', 'corrected'] },
      reason: { type: String, maxlength: 2000 },
      evidenceReference: { type: String, maxlength: 500 },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date
    }]
  },
  images: [{
    // New uploads use a private storage key. `url` remains optional only for
    // pre-existing records that were stored in a public bucket.
    url: String,
    key: String,
    uploadedAt: { type: Date, default: Date.now },
    isPrivacyMasked: { type: Boolean, default: false },
    mimeType: String,
    size: Number,
    checksum: String,
    width: Number,
    height: Number,
    quality: {
      status: { type: String, default: 'unchecked' },
      issues: [String]
    },
    privacyProcessing: {
      status: { type: String, default: 'not_available' },
      applied: { type: Boolean, default: false },
      acknowledgedByReporter: { type: Boolean, default: false },
      detectedRegions: { type: Number, default: 0 },
      processedAt: Date
    },
    aiFindings: [{
      label: { type: String, maxlength: 100 },
      confidence: { type: Number, min: 0, max: 1 },
      bbox: {
        x1: { type: Number, min: 0, max: 1 },
        y1: { type: Number, min: 0, max: 1 },
        x2: { type: Number, min: 0, max: 1 },
        y2: { type: Number, min: 0, max: 1 }
      }
    }]
  }],
  aiAnalysis: {
    analysisStatus: {
      type: String,
      enum: ['completed', 'unavailable', 'failed']
    },
    category: String,
    model: { type: String, maxlength: 80 },
    modelAvailable: { type: Boolean, default: false },
    detected: { type: Boolean, default: false },
    hazardType: String,
    confidence: Number,
    detections: {
      roadDamage: { type: Number, default: 0 },
      cracks: { type: Number, default: 0 }
    },
    findingsCount: { type: Number, default: 0 },
    needsPrivacyMasking: { type: Boolean, default: false },
    requiresManualReview: { type: Boolean, default: true },
    advisoryOnly: { type: Boolean, default: true },
    processedAt: Date
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: undefined
  },
  priorityAssignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priorityAssignedAt: Date,
  status: {
    type: String,
    enum: INCIDENT_STATES,
    default: 'submitted'
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
  cityConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cityConfirmedAt: Date,
  providerAssignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  providerAssignedAt: Date,
  repairCompletedAt: Date,
  providerAcceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  providerAcceptedAt: Date,
  finalVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  finalVerifiedAt: Date,
  closedAt: Date,
  clarificationReason: { type: String, maxlength: 2000 },
  clarificationRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clarificationRequestedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionNotes: {
    type: String,
    maxlength: 2000
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  },
  duplicateReason: {
    type: String,
    maxlength: 500
  },
  duplicateNotes: {
    type: String,
    maxlength: 2000
  },
  duplicateMarkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  duplicateMarkedAt: Date,
  // The submitted location remains source evidence. Barangay review and city
  // confirmation are separate decisions; this stores the confirmed location.
  jurisdiction: {
    barangay: { type: String, trim: true, maxlength: 100 },
    city: { type: String, trim: true, maxlength: 100, default: 'Dagupan City' },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: Date
  },
  // Routing identifies the accountable organization only. It is deliberately
  // distinct from a work-order/repair-personnel assignment.
  routing: {
    responsibleOrganization: { type: String, trim: true, maxlength: 160 },
    responsibleRole: {
      type: String,
      enum: ['utility_provider']
    },
    reason: { type: String, trim: true, maxlength: 1000 },
    routedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    routedAt: Date,
    history: [{
      fromOrganization: { type: String, trim: true, maxlength: 160 },
      fromRole: { type: String, enum: ['utility_provider'] },
      toOrganization: { type: String, trim: true, maxlength: 160 },
      toRole: { type: String, enum: ['utility_provider'] },
      reason: { type: String, trim: true, maxlength: 1000 },
      routedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      routedAt: { type: Date, default: Date.now }
    }]
  },
  // Candidate matches are advisory only. They never change the incident's
  // status and are retained for the later official validation workflow.
  duplicateCandidates: [{
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true
    },
    reportNumber: String,
    distanceMeters: { type: Number, min: 0 },
    score: { type: Number, min: 0, max: 100 },
    detectedAt: { type: Date, default: Date.now }
  }],
  duplicateDetection: {
    checkedAt: Date,
    candidateCount: { type: Number, default: 0 }
  },
  sla: {
    targetResolutionTime: Number, // in hours
    startedAt: Date,
    deadline: Date,
    state: {
      type: String,
      enum: ['not_started', 'active', 'approaching', 'overdue', 'met', 'breached', 'cancelled'],
      default: 'not_started'
    },
    isOverdue: { type: Boolean, default: false },
    escalationLevel: { type: Number, default: 0 },
    lastEscalatedAt: Date,
    closedAt: Date,
    overdueNotifiedAt: Date,
    reminderThresholdsSent: [Number],
    remindersSent: { type: Number, default: 0 }
  },
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: String,
    changedAt: { type: Date, default: Date.now },
    notes: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  rejectionReason: String,
  notes: String
}, {
  timestamps: true
});

// Geospatial index for location queries
incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ status: 1 });
incidentSchema.index({ priority: 1 });
incidentSchema.index({ 'location.address.barangay': 1 });
incidentSchema.index({ reporter: 1 });
incidentSchema.index({ reporter: 1, 'falseReportReview.finding': 1 });
incidentSchema.index({ reporter: 1, createdAt: -1 });
incidentSchema.index({ category: 1, createdAt: -1 });
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ status: 1, 'jurisdiction.barangay': 1, createdAt: -1 });
incidentSchema.index({ status: 1, 'routing.responsibleOrganization': 1, createdAt: -1 });
incidentSchema.index({ status: 1, category: 1, createdAt: -1 });
incidentSchema.index({ duplicateOf: 1 });

// Generate the required report number before Mongoose validates the document.
// A pre-save hook runs after validation, which would reject a newly created
// incident before this value could be assigned.
incidentSchema.pre('validate', async function(next) {
  if (!this.reportNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Incident').countDocuments();
    this.reportNumber = `LUNAS-${year}${month}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Use the same live deadline calculation as APIs and scheduled monitoring.
incidentSchema.methods.checkSLAStatus = function(now = new Date()) {
  if (['closed', 'resolved', 'verified', 'rejected', 'duplicate'].includes(this.status)) return false;
  const projection = require('../services/workOrderService').getSlaProjection(this.sla, now);
  this.sla.state = projection.state;
  this.sla.isOverdue = projection.isOverdue;
  return projection.isOverdue;
};

module.exports = mongoose.model('Incident', incidentSchema);
