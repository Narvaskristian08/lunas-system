const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const User = require('../models/User');

const REPORTING_VIOLATION_THRESHOLD = 3;

const emptyRestriction = () => ({
  status: 'clear',
  confirmedFindings: 0,
  threshold: REPORTING_VIOLATION_THRESHOLD,
  assignedBarangay: undefined,
  blockedAt: undefined,
  blockedAtFindings: undefined,
  appealStatus: 'none',
  appealId: undefined
});

const getReportingRestriction = (user) => {
  const source = user?.reportingRestriction || {};
  return {
    ...emptyRestriction(),
    ...source,
    confirmedFindings: Number.isFinite(Number(source.confirmedFindings))
      ? Math.max(0, Math.round(Number(source.confirmedFindings)))
      : 0,
    threshold: REPORTING_VIOLATION_THRESHOLD,
    status: source.status === 'blocked' ? 'blocked' : 'clear',
    appealStatus: ['none', 'pending', 'approved', 'rejected'].includes(source.appealStatus)
      ? source.appealStatus
      : 'none'
  };
};

const countConfirmedFindings = (reporterId) => Incident.countDocuments({
  reporter: reporterId,
  'falseReportReview.finding': 'confirmed_fabrication'
});

const refreshReporterRestriction = async ({ reporterId, assignedBarangay } = {}) => {
  // Controller unit tests run without a MongoDB connection. Production requests
  // always arrive after the server has connected, so avoid buffering in tests.
  if (!reporterId || mongoose.connection.readyState !== 1) return null;
  const confirmedFindings = await countConfirmedFindings(reporterId);
  const user = await User.findById(reporterId);
  if (!user) return null;

  const current = getReportingRestriction(user);
  const update = {
    'reportingRestriction.confirmedFindings': confirmedFindings,
    'reportingRestriction.threshold': REPORTING_VIOLATION_THRESHOLD
  };
  if (assignedBarangay) update['reportingRestriction.assignedBarangay'] = assignedBarangay;

  const shouldBlockAgain = confirmedFindings >= REPORTING_VIOLATION_THRESHOLD
    && current.status !== 'blocked'
    && (current.blockedAtFindings === undefined || confirmedFindings > current.blockedAtFindings);
  if (shouldBlockAgain) {
    update['reportingRestriction.status'] = 'blocked';
    update['reportingRestriction.blockedAt'] = new Date();
    update['reportingRestriction.blockedAtFindings'] = confirmedFindings;
    update['reportingRestriction.appealStatus'] = 'none';
    update['reportingRestriction.appealId'] = undefined;
  }

  return User.findByIdAndUpdate(reporterId, { $set: update }, { new: true });
};

const reportingBlockedResponse = (res, restriction) => res.status(403).json({
  success: false,
  code: 'REPORTING_BLOCKED',
  message: 'New report submission is paused while your reporting appeal is reviewed.',
  data: {
    reportingRestriction: {
      status: restriction.status,
      confirmedFindings: restriction.confirmedFindings,
      threshold: REPORTING_VIOLATION_THRESHOLD,
      assignedBarangay: restriction.assignedBarangay,
      appealStatus: restriction.appealStatus,
      appealId: restriction.appealId
    }
  }
});

module.exports = {
  REPORTING_VIOLATION_THRESHOLD,
  getReportingRestriction,
  countConfirmedFindings,
  refreshReporterRestriction,
  reportingBlockedResponse
};
