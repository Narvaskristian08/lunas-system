const { resolveRouting, evaluateRouting } = require('./agencyRoutingService');
const Rule = require('../models/AgencyRoutingRule');
const User = require('../models/User');
const incident = { category: 'road', jurisdiction: { barangay: 'Pantal', city: 'Dagupan City' }, routingAsset: { assetType: 'local_road', ownerId: 'test-owner', verifiedBy: 'actor', verifiedAt: new Date(), verificationReference: 'test-only' } };
const rule = { ruleId: 'test-rule', version: 1, agencyId: 'test-agency', organization: 'Test organization', category: 'road', assetType: 'local_road', ownerId: 'test-owner', barangays: ['Pantal'], city: 'Dagupan City', active: true, participating: true, approvedBy: 'actor', approvalReference: 'test-only', effectiveFrom: new Date('2020-01-01') };
afterEach(() => jest.restoreAllMocks());
test('unique approved ownership and jurisdiction match returns stable provenance', () => {
  expect(resolveRouting(incident, [rule])).toMatchObject({ outcome: 'matched', rule: { agencyId: 'test-agency', version: 1 } });
});
test.each(['routingAsset', 'category', 'jurisdiction'])('missing %s fails closed', field => {
  expect(resolveRouting({ ...incident, [field]: undefined }, [rule]).outcome).toBe('review_required');
});
test.each(['ownerId', 'assetType', 'city', 'category'])('wrong configured %s cannot route', field => {
  expect(resolveRouting(incident, [{ ...rule, [field]: 'wrong' }]).reason).toBe('no_matching_configuration');
});
test.each([{ active: false }, { participating: false }, { approvedBy: null }, { effectiveFrom: 'invalid' }, { effectiveUntil: 'invalid' }, { effectiveUntil: '2020-01-01' }, { version: 0 }])('invalid/inactive configuration %j is rejected', change => {
  expect(resolveRouting(incident, [{ ...rule, ...change }]).reason).toBe('inactive_or_invalid_configuration');
});
test('conflicting rules never select an arbitrary agency', () => {
  expect(resolveRouting(incident, [rule, { ...rule, agencyId: 'another' }])).toMatchObject({ outcome: 'review_required', reason: 'conflicting_configuration', candidates: expect.any(Array) });
});
test('category and synthetic agency name alone never establish DPWH ownership', () => {
  expect(resolveRouting({ category: 'road' }, [{ ...rule, organization: 'DPWH' }]).reason).toBe('unknown_ownership');
});
test('configuration read failure remains a recoverable exception', async () => {
  jest.spyOn(Rule, 'find').mockImplementation(() => { throw new Error('offline'); });
  expect(await evaluateRouting(incident)).toMatchObject({ reason: 'configuration_unavailable', outcome: 'review_required' });
});
test('eligible account required after configuration match', async () => {
  jest.spyOn(Rule, 'find').mockReturnValue({ lean: async () => [rule] });
  jest.spyOn(User, 'find').mockReturnValue({ select: async () => [] });
  expect(await evaluateRouting(incident)).toMatchObject({ reason: 'no_active_participating_account' });
});
