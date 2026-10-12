jest.mock('../models/User', () => ({ findById: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../services/accountActivationService', () => ({ createActivation: jest.fn(), deliverActivation: jest.fn() }));
const User = require('../models/User');
const controller = require('./authorizedAccountController');
const { createActivation, deliverActivation } = require('../services/accountActivationService');
const { validationResult } = require('express-validator');
const rules = require('../middleware/accountValidation');
const target = (changes = {}) => ({ _id: 'worker', role: 'repair_personnel', repairOrganization: 'Utility A', __v: 2,
  requiresActivation: true, accountStatus: 'pending_activation', toPublicJSON: () => ({}), ...changes });
const req = (body = {}) => ({ user: { _id: 'provider', role: 'utility_provider', utilityCompany: 'Utility A' },
  params: { id: 'worker' }, body: { version: 2, ...body }, headers: {} });
const response = () => { const res = { status: jest.fn(), json: jest.fn() }; res.status.mockReturnValue(res); return res; };
const invoke = async (handler, request, res) => {
  await new Promise((resolve, reject) => { res.json.mockImplementation(resolve); handler(request, res, reject); });
};
beforeEach(() => jest.clearAllMocks());
test.each(['updateRepairPersonnel', 'resendAccountActivation', 'changeAccountStatus'])('%s rejects another organization', async name => {
  User.findById.mockResolvedValue(target({ repairOrganization: 'Utility B' }));
  const res = response(); await invoke(controller[name], req(), res);
  expect(res.status).toHaveBeenCalledWith(403); expect(User.findOneAndUpdate).not.toHaveBeenCalled();
});
test('editing writes assigned fields with revision checks', async () => {
  User.findById.mockResolvedValue(target()); User.findOneAndUpdate.mockResolvedValue(target({ __v: 3 }));
  await invoke(controller.updateRepairPersonnel, req({ firstName: 'New', middleName: 'Middle', suffix: 'Jr.', lastName: 'Leader',
    phone: '09123456789', repairAccountType: 'team', repairTeam: 'Crew A', organization: 'Injected' }), response());
  expect(User.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: 'worker', __v: 2 });
  expect(User.findOneAndUpdate.mock.calls[0][1].$set).not.toHaveProperty('organization');
});
test('stale edits are rejected', async () => {
  User.findById.mockResolvedValue(target()); const res = response(); await invoke(controller.updateRepairPersonnel, req({ version: 1 }), res);
  expect(res.status).toHaveBeenCalledWith(409); expect(User.findOneAndUpdate).not.toHaveBeenCalled();
});
test('provider can resend a pending invitation with cooldown', async () => {
  User.findById.mockResolvedValue(target()); User.findOneAndUpdate.mockResolvedValue(target());
  createActivation.mockReturnValue({ tokenHash: 'hash', expiresAt: new Date() }); deliverActivation.mockResolvedValue({ delivered: true });
  await invoke(controller.resendAccountActivation, req(), response());
  expect(deliverActivation).toHaveBeenCalled(); expect(User.findOneAndUpdate.mock.calls[0][0]).toHaveProperty('$or');
});
test('deactivation revokes sessions and retains account', async () => {
  User.findById.mockResolvedValue(target({ accountStatus: 'active' })); User.findOneAndUpdate.mockResolvedValue(target({ accountStatus: 'deactivated' }));
  await invoke(controller.changeAccountStatus, req({ status: 'deactivated', reason: 'Left team' }), response());
  expect(User.findOneAndUpdate.mock.calls[0][1].$set).toMatchObject({ accountStatus: 'deactivated', isActive: false, refreshTokens: [], deviceTokens: [] });
});
test('creation accepts optional names and rejects organization overrides', async () => {
  const body = { firstName: 'Worker', middleName: 'Middle', suffix: 'Jr.', lastName: 'One', email: 'worker@example.com', phone: '09123456789', repairAccountType: 'individual', repairTeam: '' };
  const valid = { body: { ...body } }; for (const rule of rules.createRepairPersonnelValidation) await rule.run(valid);
  expect(validationResult(valid).isEmpty()).toBe(true);
  const injected = { body: { ...body, repairOrganization: 'Other' } }; for (const rule of rules.createRepairPersonnelValidation) await rule.run(injected);
  expect(validationResult(injected).isEmpty()).toBe(false);
});
