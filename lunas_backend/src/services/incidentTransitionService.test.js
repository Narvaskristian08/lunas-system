const {
  SUBMITTED_DECISIONS,
  buildSubmittedTransition,
  isSubmittedDecision,
  transitionConflict
} = require('./incidentTransitionService');

describe('incident transition state machine', () => {
  test('only permits the three 50% decisions from submitted', () => {
    expect(SUBMITTED_DECISIONS).toEqual(['validated', 'rejected', 'duplicate']);
    expect(isSubmittedDecision('validated')).toBe(true);
    expect(isSubmittedDecision('rejected')).toBe(true);
    expect(isSubmittedDecision('duplicate')).toBe(true);
    expect(isSubmittedDecision('assigned')).toBe(false);
    expect(isSubmittedDecision('closed')).toBe(false);
  });

  test('builds a conditional update with history and actor metadata', () => {
    const now = new Date('2026-08-11T00:00:00.000Z');
    const transition = buildSubmittedTransition({
      nextStatus: 'validated',
      actor: 'official-1',
      actorRole: 'city_engineer',
      fields: { priority: 'high' },
      notes: 'Evidence and location confirmed',
      metadata: { priority: 'high' },
      now
    });

    expect(transition.filter).toEqual({ status: 'submitted' });
    expect(transition.update.$set).toEqual({ status: 'validated', priority: 'high' });
    expect(transition.update.$push.statusHistory).toEqual(expect.objectContaining({
      status: 'validated',
      changedBy: 'official-1',
      actorRole: 'city_engineer',
      changedAt: now
    }));
  });

  test('rejects later-milestone transitions and exposes a conflict response', () => {
    expect(() => buildSubmittedTransition({ nextStatus: 'in_progress' })).toThrow('Unsupported submitted incident transition');
    expect(transitionConflict()).toEqual(expect.objectContaining({ status: 409 }));
  });
});
