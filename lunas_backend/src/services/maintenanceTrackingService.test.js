const { getMaintenanceTracking } = require('./maintenanceTrackingService');
const start = '2026-10-21T01:00:00Z';
const completed = '2026-10-21T03:00:00Z';
const source = { agencyStatus: 'work_in_progress', agencyProgressPercent: 35, statusHistory: [{ status: 'work_in_progress', changedAt: start }] };

test('measures actual work elapsed independently of SLA and omits operational notes', () => {
  const result = getMaintenanceTracking({ ...source, sla: { deadline: '2026-11-01' } }, new Date(completed));
  expect(result.progressPercent).toBe(35);
  expect(result.elapsedMilliseconds).toBe(7200000);
  expect(result.active).toBe(true);
  expect(result).not.toHaveProperty('sla');
});
test('repeated progress updates do not reset start; completion freezes elapsed', () => {
  const result = getMaintenanceTracking({ ...source, agencyStatus: 'work_completed', statusHistory: [...source.statusHistory,
    { status: 'work_in_progress', changedAt: '2026-10-21T02:00:00Z' }, { status: 'work_completed', changedAt: completed }] }, new Date('2026-10-22'));
  expect(result.cycles).toHaveLength(1);
  expect(result.elapsedMilliseconds).toBe(7200000);
  expect(result.progressPercent).toBe(100);
  expect(result.active).toBe(false);
});
test('correction preserves completed work and starts a distinct corrective cycle', () => {
  const result = getMaintenanceTracking({ ...source, statusHistory: [...source.statusHistory,
    { status: 'work_completed', changedAt: completed }, { status: 'correction_required', changedAt: '2026-10-21T04:00:00Z' },
    { status: 'work_in_progress', changedAt: '2026-10-21T05:00:00Z' }] }, new Date('2026-10-21T06:00:00Z'));
  expect(result.cycles).toHaveLength(2);
  expect(result.cycles[0].elapsedMilliseconds).toBe(7200000);
  expect(result.cycles[1].elapsedMilliseconds).toBe(3600000);
});
test('missing timestamps never fabricate completed dates or elapsed duration', () => {
  expect(getMaintenanceTracking({ status: 'closed', agencyStatus: 'work_completed', statusHistory: [{ status: 'work_completed', changedAt: 'bad' }] }).elapsedMilliseconds).toBeNull();
  expect(getMaintenanceTracking({}).cycles).toEqual([]);
});
