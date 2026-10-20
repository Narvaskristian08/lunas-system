// Informational agency deadline projection. Does not start, pause or revise SLA.
const dateValue = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

function getAgencySchedule(source, now = new Date()) {
  const deadline = dateValue(source.sla?.deadline);
  const history = source.statusHistory || [];
  const datesFor = statuses => history.filter(entry => statuses.includes(entry.status))
    .map(entry => dateValue(entry.changedAt)).filter(Boolean).sort((a, b) => a - b);
  const startedAt = datesFor(['work_in_progress'])[0]
    || (!source.agencyStatus ? dateValue(source.sla?.startedAt) : null);
  const completedDates = datesFor(['work_completed']);
  const completedAt = dateValue(source.agencyCompletionReportedAt) || completedDates[completedDates.length - 1];
  const resolved = ['closed', 'resolved'].includes(source.status);
  const inactive = ['rejected', 'duplicate'].includes(source.status);
  const awaiting = source.agencyStatus === 'work_completed' || source.status === 'agency_completed';
  const state = resolved ? 'resolved' : inactive ? 'inactive' : awaiting ? 'awaiting_verification'
    : !deadline ? 'awaiting_schedule' : startedAt ? 'active' : 'awaiting_start';
  const stoppedAt = resolved ? completedAt || dateValue(source.closedAt) || dateValue(source.resolvedAt)
    : awaiting ? completedAt : null;
  const duration = deadline && startedAt ? deadline - startedAt : null;
  return {
    state,
    asOf: now.toISOString(),
    deadline: deadline?.toISOString() || null,
    startedAt: startedAt?.toISOString() || null,
    stoppedAt: stoppedAt?.toISOString() || null,
    durationMilliseconds: duration > 0 ? duration : null,
    remainingMilliseconds: deadline && !inactive && (!(resolved || awaiting) || stoppedAt) ? deadline - (stoppedAt || now) : null
  };
}
module.exports = { getAgencySchedule };
