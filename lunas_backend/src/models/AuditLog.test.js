const AuditLog = require('./AuditLog');

describe('workflow audit event vocabulary', () => {
  test.each([
    'tanod_inspection_assigned',
    'tanod_inspection_started',
    'tanod_inspection_submitted',
    'tanod_verification_approved',
    'tanod_verification_rejected',
    'tanod_verification_clarification',
    'agency_status_updated',
    'agency_correction_requested',
    'incident_completed_by_secretary',
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
