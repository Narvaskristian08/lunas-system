const {
  INCIDENT_TRANSITIONS,
  SUBMITTED_DECISIONS,
  buildSubmittedTransition,
  canTransitionIncident,
  isSubmittedDecision,
  transitionConflict
} = require('./incidentTransitionService');

describe('incident transition state machine', () => {
  test('only permits Barangay decisions from submitted', () => {
    expect(SUBMITTED_DECISIONS).toEqual(['barangay_validated', 'rejected', 'duplicate']);
    expect(isSubmittedDecision('barangay_validated')).toBe(true);
    expect(isSubmittedDecision('rejected')).toBe(true);
    expect(isSubmittedDecision('duplicate')).toBe(true);
    expect(isSubmittedDecision('prioritized')).toBe(false);
    expect(isSubmittedDecision('closed')).toBe(false);
  });

  test('requires every operational handoff in sequence', () => {
    expect(INCIDENT_TRANSITIONS.submitted).toEqual(['barangay_validated', 'rejected', 'duplicate']);
    expect(canTransitionIncident('barangay_validated', 'prioritized')).toBe(true);
    expect(canTransitionIncident('barangay_validated', 'city_confirmed')).toBe(false);
    expect(canTransitionIncident('provider_review', 'verified')).toBe(true);
    expect(canTransitionIncident('city_confirmed', 'prioritized')).toBe(true);
    expect(canTransitionIncident('prioritized', 'provider_assigned')).toBe(true);
    expect(canTransitionIncident('provider_assigned', 'repair_assigned')).toBe(true);
    expect(canTransitionIncident('repair_completed', 'provider_review')).toBe(true);
    expect(canTransitionIncident('provider_review', 'provider_accepted')).toBe(true);
    expect(canTransitionIncident('provider_accepted', 'city_verification')).toBe(true);
    expect(canTransitionIncident('city_verification', 'verified')).toBe(true);
    expect(canTransitionIncident('verified', 'resolved')).toBe(true);
    expect(canTransitionIncident('resolved', 'closed')).toBe(true);
    expect(canTransitionIncident('submitted', 'city_confirmed')).toBe(false);
    expect(canTransitionIncident('provider_assigned', 'in_progress')).toBe(false);
    expect(canTransitionIncident('repair_completed', 'verified')).toBe(false);
    expect(canTransitionIncident('provider_accepted', 'closed')).toBe(false);
  });

  test('builds a conditional update with history and actor metadata', () => {
    const now = new Date('2026-08-11T00:00:00.000Z');
    const transition = buildSubmittedTransition({
      nextStatus: 'barangay_validated',
      actor: 'official-1',
      actorRole: 'barangay_official',
      fields: { validatedBy: 'official-1' },
      notes: 'Evidence and location reviewed',
      metadata: { barangay: 'Poblacion Oeste' },
      now
    });

    expect(transition.filter).toEqual({ status: 'submitted' });
    expect(transition.update.$set).toEqual({ status: 'barangay_validated', validatedBy: 'official-1' });
    expect(transition.update.$push.statusHistory).toEqual(expect.objectContaining({
      status: 'barangay_validated',
      changedBy: 'official-1',
      actorRole: 'barangay_official',
      changedAt: now
    }));
  });

  test('rejects unrelated transitions and exposes a conflict response', () => {
    expect(() => buildSubmittedTransition({ nextStatus: 'in_progress' })).toThrow('Unsupported submitted incident transition');
    expect(transitionConflict()).toEqual(expect.objectContaining({ status: 409 }));
  });
});
