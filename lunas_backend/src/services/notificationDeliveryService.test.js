jest.mock('../models/Notification', () => ({ findOneAndUpdate: jest.fn(), updateOne: jest.fn() }));
jest.mock('../models/User', () => ({ findById: jest.fn(), updateOne: jest.fn() }));
jest.mock('./notificationAccessService', () => ({ notificationResource: jest.fn() }));
jest.mock('./notificationService', () => ({ sendPushNotification: jest.fn() }));
const Notification = require('../models/Notification');
const User = require('../models/User');
const { notificationResource } = require('./notificationAccessService');
const { sendPushNotification } = require('./notificationService');
const { deliverNotification } = require('./notificationDeliveryService');
const token = '12345678-1234-1234-1234-123456789abc';
const originalEnv = { ...process.env };
beforeEach(() => {
  jest.resetAllMocks(); process.env.ONESIGNAL_APP_ID = 'test'; process.env.ONESIGNAL_REST_API_KEY = 'test';
  Notification.findOneAndUpdate.mockResolvedValue({ _id: 'n', recipient: 'u', data: { incidentId: 'i' }, delivery: { attempts: 1 } });
  User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'u', isActive: true, deviceTokens: [{ token }] }) });
  notificationResource.mockResolvedValue({ incidentId: 'i' });
  sendPushNotification.mockResolvedValue({ state: 'provider_accepted' });
});
afterAll(() => { process.env = originalEnv; });
test('unclaimed event cannot trigger duplicate send', async () => {
  Notification.findOneAndUpdate.mockResolvedValue(null);
  expect(await deliverNotification('n')).toBeNull(); expect(sendPushNotification).not.toHaveBeenCalled();
});
test('revoked resource suppresses external send', async () => {
  notificationResource.mockResolvedValue(null);
  expect(await deliverNotification('n')).toBe('suppressed'); expect(sendPushNotification).not.toHaveBeenCalled();
});
test('accepted delivery sends only generic text and notification reference', async () => {
  expect(await deliverNotification('n')).toBe('provider_accepted');
  expect(sendPushNotification).toHaveBeenCalledWith([token], 'LUNAS update', expect.any(String), { notificationId: 'n' });
  expect(Notification.findOneAndUpdate.mock.calls[0][0]['delivery.attempts']).toEqual({ $lt: 3 });
});
test('transient failure schedules bounded persisted retry', async () => {
  sendPushNotification.mockRejectedValue(new Error('private provider payload'));
  const now = new Date('2026-10-20T00:00:00Z');
  expect(await deliverNotification('n', now)).toBe('retry');
  expect(Notification.updateOne.mock.calls[0][1].$set).toMatchObject({ 'delivery.nextAttemptAt': new Date(now.getTime() + 30000), 'delivery.failureCode': 'delivery_unavailable' });
});
test('third transient failure terminates retries', async () => {
  Notification.findOneAndUpdate.mockResolvedValue({ _id: 'n', recipient: 'u', delivery: { attempts: 3 } });
  sendPushNotification.mockResolvedValue({ state: 'retry' });
  expect(await deliverNotification('n')).toBe('permanent_failure');
});
test('provider invalid subscriptions are removed from current account', async () => {
  sendPushNotification.mockResolvedValue({ state: 'permanent_failure', invalidTokens: [token] });
  await deliverNotification('n'); expect(User.updateOne).toHaveBeenCalledWith({ _id: 'u' }, { $pull: { deviceTokens: { token: { $in: [token] } } } });
});
test('unconfigured transport is recorded without pretending delivery', async () => {
  delete process.env.ONESIGNAL_APP_ID;
  expect(await deliverNotification('n')).toBe('not_configured'); expect(sendPushNotification).not.toHaveBeenCalled();
});
