const { getReportingRestriction, reportingBlockedResponse } = require('../services/reportingRestrictionService');

const rejectBlockedReporting = (req, res, next) => {
  const restriction = getReportingRestriction(req.user);
  if (restriction.status === 'blocked') return reportingBlockedResponse(res, restriction);
  return next();
};

module.exports = { rejectBlockedReporting };
