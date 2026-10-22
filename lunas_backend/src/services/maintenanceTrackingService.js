// Citizen-safe measurements of recorded agency work, independent of SLA time.
const validDate = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

exports.getMaintenanceTracking = (source, now = new Date()) => {
  const cycles = [];
  let current;
  for (const event of source.statusHistory || []) {
    const at = validDate(event.changedAt);
    if (!at) continue;
    if (event.status === 'work_in_progress' && !current) {
      current = { reference: `work-${at.toISOString()}`, startedAt: at.toISOString(), completedAt: null };
      cycles.push(current);
    }
    if (event.status === 'work_completed' && current && at >= new Date(current.startedAt)) {
      current.completedAt = at.toISOString();
      current = undefined;
    }
  }
  const terminal = ['closed', 'resolved', 'rejected', 'duplicate'].includes(source.status);
  const latest = cycles[cycles.length - 1];
  const asOf = now.toISOString();
  const measured = cycles.map(cycle => ({ ...cycle,
    elapsedMilliseconds: !cycle.completedAt && terminal ? null
      : Math.max(0, (cycle.completedAt ? new Date(cycle.completedAt) : now) - new Date(cycle.startedAt))
  }));
  const percent = Number(source.agencyProgressPercent);
  return {
    asOf,
    progressPercent: source.agencyStatus === 'work_completed' ? 100
      : source.agencyStatus === 'work_in_progress' && Number.isFinite(percent) ? Math.max(0, Math.min(99, percent)) : 0,
    startedAt: latest?.startedAt || null,
    completedAt: latest?.completedAt || null,
    acceptedAt: validDate(source.finalVerifiedAt || source.closedAt)?.toISOString() || null,
    elapsedMilliseconds: measured[measured.length - 1]?.elapsedMilliseconds ?? null,
    active: Boolean(current && !terminal && source.agencyStatus === 'work_in_progress'),
    cycles: measured
  };
};
