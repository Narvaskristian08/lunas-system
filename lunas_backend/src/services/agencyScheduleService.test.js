const { getAgencySchedule } = require('./agencyScheduleService');
const start = new Date('2026-10-20T08:00:00Z');
const deadline = new Date('2026-10-23T08:00:00Z');
const source = { status: 'provider_assigned', agencyStatus: 'work_in_progress', sla: { deadline }, statusHistory: [{ status: 'work_in_progress', changedAt: start, notes: 'PRIVATE' }] };
test('remaining time decreases over a three-day agency window', () => {
  const first = getAgencySchedule(source, start);
  const later = getAgencySchedule(source, new Date('2026-10-21T08:00:00Z'));
  expect(first.durationMilliseconds).toBe(3 * 86400000);
  expect(first.remainingMilliseconds).toBe(first.durationMilliseconds);
  expect(later.remainingMilliseconds / later.durationMilliseconds).toBeCloseTo(2 / 3);
  expect(later).not.toHaveProperty('notes');
});
test('missing/invalid schedule and missing work start never invent a window', () => {
  expect(getAgencySchedule({ sla: { deadline: 'bad' } }, start)).toMatchObject({ state: 'awaiting_schedule', deadline: null, durationMilliseconds: null });
  expect(getAgencySchedule({ ...source, statusHistory: [] }, start)).toMatchObject({ state: 'awaiting_start', durationMilliseconds: null });
  expect(getAgencySchedule({ ...source, sla: { deadline: start } }, start).durationMilliseconds).toBeNull();
});
test('deadline can pass without automatically resolving or changing the source', () => {
  const result = getAgencySchedule(source, new Date('2026-10-24T08:00:00Z'));
  expect(result.remainingMilliseconds).toBe(-86400000);
  expect(result.state).toBe('active');
  expect(source.status).toBe('provider_assigned');
});
test.each(['awaiting_verification', 'resolved'])('completion freezes time in %s state', state => {
  const record = { ...source, status: state === 'resolved' ? 'closed' : source.status, agencyStatus: 'work_completed', agencyCompletionReportedAt: '2026-10-22T08:00:00Z' };
  const a = getAgencySchedule(record, deadline);
  const b = getAgencySchedule(record, new Date('2026-10-25T08:00:00Z'));
  expect(a.state).toBe(state);
  expect(a.remainingMilliseconds).toBe(b.remainingMilliseconds);
});
test('correction does not reset the original work window; rejected reports are inactive', () => {
  expect(getAgencySchedule({ ...source, agencyStatus: 'correction_required', statusHistory: [...source.statusHistory, { status: 'work_in_progress', changedAt: deadline }] }, deadline).startedAt).toBe(start.toISOString());
  expect(getAgencySchedule({ ...source, status: 'rejected' }, deadline).state).toBe('inactive');
});
test('terminal legacy reports without completion timestamps do not invent a frozen percentage', () => {
  expect(getAgencySchedule({ ...source, agencyStatus: 'work_completed' }, deadline).remainingMilliseconds).toBeNull();
});
