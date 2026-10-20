const mockSend = jest.fn();
jest.mock('onesignal-node', () => ({ Client: jest.fn(() => ({ createNotification: mockSend })) }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
const { sendPushNotification } = require('./notificationService');
const oldEnv = { ...process.env };
beforeEach(() => { jest.clearAllMocks(); process.env.ONESIGNAL_APP_ID = 'test'; process.env.ONESIGNAL_REST_API_KEY = 'test'; });
afterAll(() => { process.env = oldEnv; });
test('provider acceptance is not described as device delivery', async () => {
  mockSend.mockResolvedValue({ body: { id: 'provider-reference', recipients: 1 } });
  expect(await sendPushNotification(['test'], 'title', 'body')).toEqual({ state: 'provider_accepted', invalidTokens: [] });
});
test.each([429, 503])('provider %s schedules retry without exposing payload', async statusCode => {
  mockSend.mockRejectedValue({ statusCode, body: { private: 'provider payload' } });
  expect(await sendPushNotification(['test'], 'title', 'body')).toEqual({ state: 'retry', failureCode: `provider_${statusCode}` });
});
test('provider rejection is permanent and preserves invalid subscription response', async () => {
  mockSend.mockResolvedValue({ body: { recipients: 0, errors: { invalid_player_ids: ['invalid'] } } });
  expect(await sendPushNotification(['test'], 'title', 'body')).toEqual({ state: 'permanent_failure', failureCode: 'provider_rejected', invalidTokens: ['invalid'] });
});
