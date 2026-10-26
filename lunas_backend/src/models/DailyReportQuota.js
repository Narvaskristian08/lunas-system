const mongoose = require('mongoose');

const dailyReportQuotaSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayKey: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  count: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// The unique key serializes first-use initialization for each citizen/day.
dailyReportQuotaSchema.index({ reporter: 1, dayKey: 1 }, { unique: true });
// Quota bookkeeping is not incident history and may be removed after the day.
dailyReportQuotaSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 172800 });

module.exports = mongoose.model('DailyReportQuota', dailyReportQuotaSchema);
