const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
  incident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true, index: true },
  type: { type: String, enum: ['initial', 'completion'], required: true },
  barangay: { type: String, required: true, trim: true, maxlength: 100, index: true },
  secretary: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tanod: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['assigned', 'in_progress', 'submitted', 'approved', 'rejected', 'clarification_required', 'replaced'], default: 'assigned' },
  categoryRevision: { type: Number, default: 0 },
  instructions: { type: String, maxlength: 2000 },
  parentInspection: { type: mongoose.Schema.Types.ObjectId, ref: 'Inspection' },
  replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Inspection' },
  replacedAt: Date,
  replacementReason: { type: String, maxlength: 2000 },
  acknowledgedAt: Date,
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  findings: { type: String, maxlength: 4000 },
  result: { type: String, enum: ['verified', 'not_verified', 'unable_to_verify'] },
  evidence: [{
    url: String,
    key: String,
    uploadedAt: { type: Date, default: Date.now },
    mimeType: String,
    size: Number,
    checksum: String,
    isPrivacyMasked: { type: Boolean, default: false }
  }],
  assignedAt: { type: Date, default: Date.now },
  startedAt: Date,
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String, maxlength: 2000 },
  version: { type: Number, default: 0 }
}, { timestamps: true, optimisticConcurrency: true, versionKey: 'version' });

inspectionSchema.index({ incident: 1, type: 1, createdAt: -1 });
inspectionSchema.index({ tanod: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Inspection', inspectionSchema);
