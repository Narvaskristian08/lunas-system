const User = require('../models/User');
const { USER_ROLES, AUTHORIZED_ROLES, canSignIn } = require('./accountPolicy');
const { buildIncidentScope, canAccessIncident } = require('../services/jurisdictionService');
const { buildWorkOrderScope } = require('../services/workOrderService');

test('Utility Personnel have a distinct validated barangay role without repair defaults', async () => {
  const user = new User({ firstName: 'Test', lastName: 'Tanod', email: 'tanod@example.test',
    password: 'LocalTest2026!', role: 'utility_personnel', phone: '09980000001', barangay: 'Pantal' });
  await expect(user.validate()).resolves.toBeUndefined();
  expect(USER_ROLES).toContain('utility_personnel');
  expect(AUTHORIZED_ROLES).toContain('utility_personnel');
  expect(AUTHORIZED_ROLES).not.toContain('repair_personnel');
  expect(user.repairAccountType).toBeUndefined();
  expect(user.toPublicJSON().phone).toBe('09980000001');
  expect(canSignIn(user)).toBe(true);
  user.barangay = undefined;
  await expect(user.validate()).rejects.toThrow();
});

test('Utility Personnel stay in their barangay and cannot acquire repair work-order scope', () => {
  const user = { _id: 'tanod', role: 'utility_personnel', barangay: 'Pantal' };
  expect(buildIncidentScope(user)).not.toEqual({ _id: null });
  expect(canAccessIncident(user, { location: { address: { barangay: 'Pantal' } } })).toBe(false);
  expect(canAccessIncident(user, { initialVerifier: 'tanod', location: { address: { barangay: 'Pantal' } } })).toBe(true);
  expect(canAccessIncident(user, { location: { address: { barangay: 'Lucao' } } })).toBe(false);
  expect(buildIncidentScope({ ...user, barangay: '' })).toEqual({ _id: null });
  expect(buildWorkOrderScope(user)).toEqual({ _id: null });
});
