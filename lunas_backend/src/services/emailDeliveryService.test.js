jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));
jest.mock('../utils/logger', () => ({ warn: jest.fn(), error: jest.fn() }));

const axios = require('axios');
const nodemailer = require('nodemailer');
const { deliverEmail } = require('./emailDeliveryService');

describe('transactional email delivery', () => {
  const keys = [
    'EMAIL_PROVIDER',
    'RESEND_API_KEY',
    'RESEND_API_URL',
    'EMAIL_FROM',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_SECURE',
    'SMTP_USER',
    'SMTP_PASSWORD'
  ];
  const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));

  beforeEach(() => {
    jest.clearAllMocks();
    nodemailer.createTransport.mockReset();
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
    process.env.EMAIL_FROM = 'LUNAS <noreply@example.test>';
    axios.post.mockResolvedValue({ data: { id: 'email-id' } });

    await expect(deliverEmail({
      type: 'password_reset',
      recipient: { email: 'person@example.test' },
      subject: 'Reset your LUNAS password',
      text: 'private reset token text',
      html: '<p>private reset token html</p>',
      webhookPayload: { type: 'password_reset' }
    })).resolves.toEqual({ configured: true, delivered: true });

    expect(axios.post).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        from: 'LUNAS <noreply@example.test>',
        to: ['person@example.test'],
        subject: 'Reset your LUNAS password'
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

  test('delivers through Gmail-compatible SMTP without logging the email body', async () => {
    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'lunas.noreply@gmail.com';
    process.env.SMTP_PASSWORD = 'app-password';
    process.env.EMAIL_FROM = 'LUNAS <lunas.noreply@gmail.com>';
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'message-id' });
    nodemailer.createTransport.mockReturnValue({ sendMail });

    await expect(deliverEmail({
      type: 'registration_mfa',
      recipient: { email: 'citizen@example.test' },
      subject: 'Your LUNAS verification code',
      text: 'private verification code',
      html: '<p>private verification code</p>'
    })).resolves.toEqual({ configured: true, delivered: true });

    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: 'lunas.noreply@gmail.com', pass: 'app-password' }
    }));
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'LUNAS <lunas.noreply@gmail.com>',
      to: 'citizen@example.test',
      subject: 'Your LUNAS verification code'
    }));
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('fails closed when SMTP is incomplete', async () => {
    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_USER = 'lunas.noreply@gmail.com';

    await expect(deliverEmail({
      type: 'registration_mfa',
      recipient: { email: 'citizen@example.test' },
      subject: 'Verification code',
      text: 'code',
      html: '<p>code</p>'
    })).resolves.toEqual({ configured: false, delivered: false });

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });
});
