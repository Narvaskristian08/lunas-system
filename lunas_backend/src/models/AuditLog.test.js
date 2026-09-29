const AuditLog = require('./AuditLog');

describe('workflow audit event vocabulary', () => {
  test.each([
    'incident_deleted',
    'incident_barangay_validated',
    'incident_city_confirmed',
    'incident_clarification_requested',
    'provider_correction_requested',
    'provider_completion_accepted',
    'provider_coordinated_city_correction',
    'city_engineering_returned_completion',
    'city_engineering_verified_and_closed'
  ])('accepts %s as a durable audit action', (action) => {
    const audit = new AuditLog({ action, actorType: 'system', source: 'api' });
    expect(audit.validateSync()).toBeUndefined();
  });
});
