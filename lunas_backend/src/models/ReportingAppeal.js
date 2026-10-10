const mongoose = require('mongoose');

const decisionHistorySchema = new mongoose.Schema({
  decision: { type: String, enum: ['approved', 'rejected'], required: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedAt: { type: Date, default: Date.now },
  notes: { type: String, maxlength: 2000 }
}, { _id: false });

const reportingAppealSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedBarangay: { type: String, required: true, trim: true, maxlength: 100, index: true },
  explanation: { type: String, required: true, minlength: 20, maxlength: 2000, trim: true },
  evidenceReference: { type: String, required: true, maxlength: 500, trim: true },
  source: { type: String, enum: ['online', 'offline'], default: 'online' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  version: { type: Number, default: 0 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewNotes: { type: String, maxlength: 2000 },
  decisionHistory: { type: [decisionHistorySchema], default: [] }
}, { timestamps: true });

reportingAppealSchema.index({ reporter: 1, createdAt: -1 });
reportingAppealSchema.index({ assignedBarangay: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ReportingAppeal', reportingAppealSchema);
