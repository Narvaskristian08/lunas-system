const mongoose = require('mongoose');
const { OUTCOMES, MILESTONES } = require('../services/agencyPreparationService');
const actor = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };
const schema = new mongoose.Schema({
  protocol: { type: Number, enum: [9] }, revision: { type: Number, min: 0 }, organization: String,
  acknowledgedBy: actor, acknowledgedAt: Date,
  outcome: { type: String, enum: OUTCOMES }, assessmentRevision: Number,
  assessments: [{ revision: Number, organization: String, actor, at: Date, category: String,
    outcome: { type: String, enum: OUTCOMES }, notes: { type: String, maxlength: 4000 }, requirements: String,
    resources: String, approach: String, reference: String, processType: String }],
  milestone: { type: String, enum: MILESTONES },
  externalHistory: [{ assessmentRevision: Number, previous: String, milestone: { type: String, enum: MILESTONES },
    organization: String, actor, at: Date, remarks: String, reference: String, followUpAt: Date }],
  // Reserved data shape, never populated by a status update or unsupported actor.
  authorization: { assessmentRevision: Number, organization: String, authorizedBy: actor, authorizedAt: Date,
    type: String, reference: String, basis: String, policyReference: String },
  history: [{ operation: String, actor, organization: String, at: Date, previousStatus: String, status: String, remarks: String, reference: String }]
}, { _id: false });
module.exports = schema;
