const mongoose = require('mongoose');
const { INCIDENT_CATEGORY_CODES } = require('../utils/incidentCategories');

// No seeded jurisdiction or public write endpoint. Approved institutional data
// must be supplied through a separately authorized configuration procedure.
const schema = new mongoose.Schema({
  ruleId: { type: String, required: true },
  version: { type: Number, required: true, min: 1 },
  agencyId: { type: String, required: true },
  organization: { type: String, required: true, maxlength: 160 },
  displayName: { type: String, required: true },
  category: { type: String, required: true, enum: INCIDENT_CATEGORY_CODES },
  assetType: { type: String, required: true },
  ownerId: { type: String, required: true },
  barangays: [{ type: String }],
  city: { type: String, required: true },
  active: { type: Boolean, default: false },
  participating: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvalReference: { type: String, required: true },
  effectiveFrom: { type: Date, required: true },
  effectiveUntil: Date
}, { timestamps: true, optimisticConcurrency: true });
schema.index({ ruleId: 1, version: 1 }, { unique: true });
module.exports = mongoose.model('AgencyRoutingRule', schema);
