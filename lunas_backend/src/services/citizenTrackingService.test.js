const { citizenTracking } = require('./citizenTrackingService');
test('unverified organization strings and deadlines do not establish routing or SLA', () => {
  const result = citizenTracking({ status: 'provider_assigned', routing: { responsibleOrganization: 'Unverified' }, sla: { deadline: '2030-01-01', state: 'active' } });
  expect(result.agencyAssignment).toEqual({ status: 'awaiting_agency_assignment' });
  expect(result.sla.state).toBe('not_started');
  expect(result.sla.deadline).toBeUndefined();
});
test('matched, confirmed routing displays organization without granting maintenance authority', () => {
  const result = citizenTracking({ status: 'provider_assigned', categoryConfirmedBy: 'officer', categoryConfirmedAt: '2026-01-01', routingReview: { outcome: 'matched' }, routing: { agencyId: 'agency', ruleId: 'rule', policyVersion: 1, routedAt: '2026-01-01', responsibleOrganization: 'Verified agency' } });
  expect(result.agencyAssignment.organization).toBe('Verified agency');
  expect(result.statusLabel).toContain('authorization pending');
});
test('valid persisted overdue clock is projected without mutating its original deadline', () => {
  const input = { sla: { startedAt: '2020-01-01', deadline: '2020-01-02', state: 'active' } };
  expect(citizenTracking(input).sla).toMatchObject({ state: 'overdue', isOverdue: true });
  expect(input.sla.deadline).toBe('2020-01-02');
});
test('historical breached outcome survives invalid legacy timing without invented deadline', () => {
  expect(citizenTracking({ sla: { state: 'breached' } }).sla).toMatchObject({ state: 'not_started', recordedOutcome: 'breached' });
});
test('external bidding completed remains authorization pending', () => {
  expect(citizenTracking({ status: 'provider_assigned', agencyStatus: 'bidding_completed' }).statusLabel).toContain('authorization pending');
});
