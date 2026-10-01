const crypto = require('crypto');
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'reassigned'],
    default: 'pending'
  },
  acceptedAt: Date,
  declinedAt: Date,
  declineReason: { type: String, trim: true, maxlength: 500 },
  declineNotes: { type: String, trim: true, maxlength: 2000 },
  endedAt: Date,
  endedReason: { type: String, trim: true, maxlength: 500 },
  active: { type: Boolean, default: true }
}, { _id: true });

const historySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'created', 'assigned', 'reassigned', 'accepted', 'declined', 'started',
      'progress', 'evidence_uploaded', 'ready_for_completion', 'repair_completed',
      'provider_accepted', 'provider_correction_requested', 'city_returned',
      'city_verified', 'correction_started', 'sla_approaching', 'sla_overdue'
    ],
    required: true
  },
  status: { type: String, trim: true, maxlength: 40 },
  progressPercent: { type: Number, min: 0, max: 100 },
  stage: { type: String, trim: true, maxlength: 80 },
  notes: { type: String, trim: true, maxlength: 2000 },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole: { type: String, trim: true, maxlength: 50 },
  assignment: { type: mongoose.Schema.Types.ObjectId },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const evidenceSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  url: String,
  mimeType: { type: String, required: true },
  size: { type: Number, required: true, min: 0 },
  checksum: { type: String, required: true },
  width: Number,
  height: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  progressUpdate: { type: mongoose.Schema.Types.ObjectId },
  caption: { type: String, trim: true, maxlength: 500 }
}, { _id: true });

const progressSchema = new mongoose.Schema({
  previousPercent: { type: Number, required: true, min: 0, max: 100 },
  progressPercent: { type: Number, required: true, min: 0, max: 100 },
  stage: { type: String, required: true, trim: true, maxlength: 80 },
  notes: { type: String, trim: true, maxlength: 2000 },
  evidence: [{ type: mongoose.Schema.Types.ObjectId }],
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: (coordinates) => !coordinates || (
          coordinates.length === 2
          && coordinates[0] >= -180 && coordinates[0] <= 180
          && coordinates[1] >= -90 && coordinates[1] <= 90
        ),
        message: 'Repair location must contain valid longitude and latitude'
      }
    }
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedAt: { type: Date, default: Date.now }
}, { _id: true });

const reviewSchema = new mongoose.Schema({
  stage: { type: String, enum: ['utility_provider', 'city_engineer'], required: true },
  decision: { type: String, enum: ['accepted', 'correction_required', 'verified'], required: true },
  reason: { type: String, trim: true, maxlength: 2000 },
  instructions: { type: String, trim: true, maxlength: 4000 },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const workOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  // One durable primary maintenance task represents a validated incident in
  // current workflow. Its assignment and progress records are append-only
  // subdocuments, not fields that overwrite operational history.
  incident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    required: true,
    unique: true
  },
  responsibleOrganization: { type: String, required: true, trim: true, maxlength: 160 },
  responsibleRole: {
    type: String,
    enum: ['utility_provider'],
    required: true
  },
  jurisdiction: {
    barangay: { type: String, trim: true, maxlength: 100 },
    city: { type: String, trim: true, maxlength: 100, default: 'Dagupan City' }
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending', 'accepted', 'in_progress', 'completed', 'rework_required',
      'provider_accepted', 'city_correction_required', 'verified'
    ],
    default: 'pending'
  },
  assignmentState: {
    type: String,
    enum: ['unassigned', 'pending', 'accepted', 'declined'],
    default: 'unassigned'
  },
  currentAssignment: { type: mongoose.Schema.Types.ObjectId },
  assignments: { type: [assignmentSchema], default: [] },
  // These denormalized values make secure assignee-scoped queries efficient.
  // Assignment history remains the source of truth.
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acceptedAt: Date,
  startedAt: Date,
  readyForCompletionAt: Date,
  // Older records may use these field names; new completion and verification
  // decisions use the controlled status/history fields below.
  actualStartTime: Date,
  actualCompletionTime: Date,
  instructions: { type: String, trim: true, maxlength: 4000 },
  progressPercent: {
    type: Number,
    default: 0,
    enum: [0, 25, 50, 75, 100]
  },
  progressStage: {
    type: String,
    enum: ['assigned', 'site_preparation', 'main_repair', 'finishing', 'ready_for_completion'],
    default: 'assigned'
  },
  progressUpdates: { type: [progressSchema], default: [] },
  repairEvidence: { type: [evidenceSchema], default: [] },
  reviews: { type: [reviewSchema], default: [] },
  history: { type: [historySchema], default: [] },
  sla: {
    targetResolutionTime: Number,
    startedAt: Date,
    deadline: Date,
    state: {
      type: String,
      enum: ['not_started', 'active', 'approaching', 'overdue', 'met', 'breached', 'cancelled'],
      default: 'not_started'
    },
    isOverdue: { type: Boolean, default: false },
    closedAt: Date,
    approachingNotifiedAt: Date,
    overdueNotifiedAt: Date
  },
  // Optimistic concurrency is used by every controlled mutation.
  version: { type: Number, default: 0 }
}, {
  timestamps: true,
  optimisticConcurrency: true
});

workOrderSchema.index({ assignedTo: 1, status: 1, updatedAt: -1 });
workOrderSchema.index({ responsibleOrganization: 1, status: 1, updatedAt: -1 });
workOrderSchema.index({ 'jurisdiction.barangay': 1, status: 1, updatedAt: -1 });
workOrderSchema.index({ priority: 1, 'sla.deadline': 1 });
workOrderSchema.index({ 'sla.deadline': 1, status: 1 });
workOrderSchema.index({ 'assignments.assignee': 1, 'assignments.active': 1 });

// Generate a human-readable, collision-resistant reference before validation.
// Counting existing documents is not safe when two officials create work
// orders at the same time. The unique index remains the database backstop.
workOrderSchema.pre('validate', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const suffix = crypto.randomBytes(6).toString('hex').toUpperCase();
    this.orderNumber = `WO-${year}${month}-${suffix}`;
  }
  next();
});

module.exports = mongoose.model('WorkOrder', workOrderSchema);
