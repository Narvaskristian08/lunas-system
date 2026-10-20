const { prepareAgencyTransition: transition, maintenanceReady } = require('./agencyPreparationService');
const actor = { _id: 'test-officer' };
const assessment = { operation: 'assess', expectedVersion: 1, outcome: 'routine', notes: 'Observed damage', requirements: 'Repair surface', resources: 'Crew available', approach: 'Routine repair' };
const base = () => ({ category: 'road', routing: { responsibleOrganization: 'Test agency' }, agencyStatus: 'not_routed', sla: { deadline: new Date('2026-11-01') } });
const acknowledged = () => {
  const incident = base(); const result = transition(incident, { operation: 'acknowledge', expectedVersion: 0 }, actor);
  return { ...incident, agencyStatus: result.status, agencyPreparation: result.preparation };
};
test('receipt is explicit, versioned and retains actor/time without authorizing work', () => {
  const incident = base(); const before = JSON.stringify(incident);
  const result = transition(incident, { operation: 'acknowledge', expectedVersion: 0 }, actor);
  expect(result).toMatchObject({ status: 'acknowledged', preparation: { revision: 1, acknowledgedBy: actor._id, acknowledgedAt: expect.any(Date) } });
  expect(JSON.stringify(incident)).toBe(before); expect(maintenanceReady(result.preparation)).toBe(false);
});
test('repeated receipt and stale assessment do not append events', () => {
  const incident = acknowledged();
  expect(transition(incident, { operation: 'acknowledge', expectedVersion: 1 }, actor).status).toBe(409);
  expect(transition(incident, { ...assessment, expectedVersion: 0 }, actor).status).toBe(409);
  expect(incident.agencyPreparation.history).toHaveLength(1);
});
test.each(['notes', 'requirements', 'resources', 'approach', 'outcome'])('assessment requires valid %s', field => {
  expect(transition(acknowledged(), { ...assessment, [field]: '' }, actor).status).toBe(400);
});
test('assessment cannot precede receipt', () => {
  expect(transition(base(), { ...assessment, expectedVersion: 0 }, actor).status).toBe(409);
});
test.each(['routine', 'external', 'responsibility_review', 'clarification'])('assessment outcome %s stays distinct and preserves source', outcome => {
  const incident = acknowledged(); const before = JSON.stringify(incident);
  const result = transition(incident, { ...assessment, outcome, processType: 'Test outside approval' }, actor);
  expect(result.preparation.outcome).toBe(outcome); expect(result.preparation.assessments[0]).toMatchObject({ actor: actor._id, category: 'road' });
  expect(JSON.stringify(incident)).toBe(before); expect(maintenanceReady(result)).toBe(false);
});
test('external path can omit bidding; bidding completion never means work authorization', () => {
  let incident = acknowledged();
  let result = transition(incident, { ...assessment, outcome: 'external', processType: 'Outside authorization' }, actor);
  incident = { ...incident, agencyPreparation: result.preparation, agencyStatus: result.status };
  const direct = transition(incident, { operation: 'external', expectedVersion: 2, milestone: 'awaiting_work_authorization', remarks: 'Outside process completed', reference: 'TEST-1' }, actor);
  expect(direct.status).toBe('awaiting_work_authorization'); expect(direct.preparation.authorization).toBeUndefined();
  for (const [index, milestone] of ['for_bidding', 'bidding_completed', 'awaiting_work_authorization'].entries()) {
    result = transition(incident, { operation: 'external', expectedVersion: index + 2, milestone, remarks: 'Recorded outside LUNAS' }, actor);
    expect(result.error).toBeUndefined(); incident = { ...incident, agencyPreparation: result.preparation, agencyStatus: result.status };
    expect(maintenanceReady(incident)).toBe(false); expect(incident.agencyPreparation.authorization).toBeUndefined();
  }
  expect(incident.agencyPreparation.externalHistory).toHaveLength(3);
});
test.each(['ready_for_work', 'work_in_progress', 'closed', 'work_authorized', 'bidding_completed'])('invalid early milestone %s cannot skip prerequisites', milestone => {
  const incident = acknowledged(); const result = transition(incident, { ...assessment, outcome: 'external', processType: 'Outside funding' }, actor);
  expect(transition({ ...incident, agencyPreparation: result.preparation }, { operation: 'external', expectedVersion: 2, milestone, remarks: 'Attempted skip' }, actor).status).toBe(409);
});
test.each(['authorize', 'ready'])('%s stays blocked even with fabricated reference/authorization', operation => {
  const incident = acknowledged(); incident.agencyPreparation.authorization = { authorizedBy: actor._id, policyReference: 'unapproved' };
  expect(transition(incident, { operation, expectedVersion: 1, reference: 'fake' }, actor).status).toBe(409);
  expect(maintenanceReady(incident)).toBe(false);
});
test('routine assessment cannot update external milestones and changed organization conflicts', () => {
  const incident = acknowledged();
  expect(transition(incident, { operation: 'external', expectedVersion: 1, milestone: 'pending_funding', remarks: 'Not assessed' }, actor).status).toBe(409);
  incident.routing.responsibleOrganization = 'Different agency';
  expect(transition(incident, assessment, actor).status).toBe(409);
});
