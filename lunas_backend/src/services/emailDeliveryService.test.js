jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../utils/logger', () => ({ warn: jest.fn(), error: jest.fn() }));

const axios = require('axios');
const { deliverEmail } = require('./emailDeliveryService');

describe('transactional email delivery', () => {
  const keys = [
    'EMAIL_PROVIDER',
    'RESEND_API_KEY',
    'RESEND_API_URL',
    'EMAIL_FROM'
  ];
  const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));

  beforeEach(() => {
    jest.clearAllMocks();
    keys.forEach(key => delete process.env[key]);
  });

  afterAll(() => {
    keys.forEach((key) => {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    });
  });

  test('delivers through Resend without logging the email body', async () => {
    process.env.EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = 'resend-test-key';
    process.env.EMAIL_FROM = 'Luna <noreply@example.test>';
    axios.post.mockResolvedValue({ data: { id: 'email-id' } });

    await expect(deliverEmail({
      type: 'password_reset',
      recipient: { email: 'person@example.test' },
      subject: 'Reset your Luna password',
      text: 'private reset token text',
      html: '<p>private reset token html</p>',
      webhookPayload: { type: 'password_reset' }
    })).resolves.toEqual({ configured: true, delivered: true });

    expect(axios.post).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        from: 'Luna <noreply@example.test>',
        to: ['person@example.test'],
        subject: 'Reset your Luna password'
      }),
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer resend-test-key' })
      })
    );
  });

  test('keeps the existing webhook delivery contract as the fallback', async () => {
    process.env.EMAIL_PROVIDER = 'webhook';
    axios.post.mockResolvedValue({ data: { accepted: true } });

    await expect(deliverEmail({
      type: 'registration_mfa',
      recipient: { email: 'person@example.test' },
      subject: 'Verification code',
      text: 'code',
      html: '<p>code</p>',
      webhookPayload: { type: 'registration_mfa', code: '123456' },
      deliveryUrl: 'https://mailer.example.test/send',
      deliveryToken: 'webhook-token'
    })).resolves.toEqual({ configured: true, delivered: true });

    expect(axios.post).toHaveBeenCalledWith(
      'https://mailer.example.test/send',
      { type: 'registration_mfa', code: '123456' },
      expect.objectContaining({
        headers: { authorization: 'Bearer webhook-token' }
      })
    );
  });

  test('fails closed when the selected provider is incomplete', async () => {
    process.env.EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = 'resend-test-key';

    await expect(deliverEmail({
      type: 'account_activation',
      recipient: { email: 'person@example.test' },
      subject: 'Activate',
      text: 'activation',
      html: '<p>activation</p>'
    })).resolves.toEqual({ configured: false, delivered: false });

    expect(axios.post).not.toHaveBeenCalled();
  });
});
