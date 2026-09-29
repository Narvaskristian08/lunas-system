const { getSLAHours, initializeIncidentSLA, isSlaAutomationEnabled } = require('./slaService');

describe('SLA foundation', () => {
  const originalHigh = process.env.SLA_HIGH;
  const originalAutomation = process.env.SLA_AUTOMATION_ENABLED;

  afterEach(() => {
    if (originalHigh === undefined) delete process.env.SLA_HIGH;
    else process.env.SLA_HIGH = originalHigh;
    if (originalAutomation === undefined) delete process.env.SLA_AUTOMATION_ENABLED;
    else process.env.SLA_AUTOMATION_ENABLED = originalAutomation;
  });

  test('uses centralized proposal defaults', () => {
    delete process.env.SLA_HIGH;
    expect(getSLAHours('critical')).toBe(48);
    expect(getSLAHours('high')).toBe(72);
    expect(getSLAHours('medium')).toBe(168);
    expect(getSLAHours('low')).toBe(336);
  });

  test('allows deployment configuration and creates an active deadline', () => {
    process.env.SLA_HIGH = '96';
    const startedAt = new Date('2026-08-11T00:00:00.000Z');
    const sla = initializeIncidentSLA('high', startedAt);
    expect(sla).toEqual(expect.objectContaining({
      targetResolutionTime: 96,
      startedAt,
      state: 'active',
      isOverdue: false
    }));
    expect(sla.deadline.toISOString()).toBe('2026-08-15T00:00:00.000Z');
  });

  test('keeps the later reminder and escalation scheduler opt-in', () => {
    delete process.env.SLA_AUTOMATION_ENABLED;
    expect(isSlaAutomationEnabled()).toBe(false);
    process.env.SLA_AUTOMATION_ENABLED = 'true';
    expect(isSlaAutomationEnabled()).toBe(true);
  });
});
