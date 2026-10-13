jest.mock('./emailDeliveryService', () => ({
  deliverEmail: jest.fn(),
  escapeHtml: value => String(value)
}));

const { deliverEmail } = require('./emailDeliveryService');
const { deliverPasswordReset } = require('./passwordResetDeliveryService');

describe('password reset delivery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PASSWORD_RESET_APP_URL = 'https://app.example.test/reset-password';
    delete process.env.PASSWORD_RESET_MOBILE_URL;
    deliverEmail.mockResolvedValue({ configured: true, delivered: true });
  });

  afterEach(() => {
    delete process.env.PASSWORD_RESET_APP_URL;
    delete process.env.PASSWORD_RESET_MOBILE_URL;
  });

  test('sends only to the verified recovery email', async () => {
    await expect(deliverPasswordReset({
      user: {
        email: 'login-identifier@example.test',
        recoveryEmail: 'reachable@example.test',
        recoveryEmailVerifiedAt: new Date(),
        firstName: 'Test'
      },
      code: '123456'
    })).resolves.toEqual({ configured: true, delivered: true });

    expect(deliverEmail).toHaveBeenCalledWith(expect.objectContaining({
      recipient: { email: 'reachable@example.test', firstName: 'Test' }
    }));
  });

  test('fails closed when recovery email is missing or unverified', async () => {
    await expect(deliverPasswordReset({
      user: { email: 'login-identifier@example.test', recoveryEmail: 'unverified@example.test' },
      code: '123456'
    })).resolves.toEqual({ configured: false, delivered: false });

    expect(deliverEmail).not.toHaveBeenCalled();
  });

  test('uses the verified citizen registration email when no separate recovery email exists', async () => {
    await expect(deliverPasswordReset({
      user: {
        email: 'citizen@example.test',
        role: 'citizen',
        isVerified: true,
        firstName: 'Citizen'
      },
      code: '123456'
    })).resolves.toEqual({ configured: true, delivered: true });

    expect(deliverEmail).toHaveBeenCalledWith(expect.objectContaining({
      recipient: { email: 'citizen@example.test', firstName: 'Citizen' }
    }));
  });

  test('sends a one-time code without an app or web reset link', async () => {
    process.env.PASSWORD_RESET_MOBILE_URL = 'lunas://app/reset-password';

    await deliverPasswordReset({
      user: {
        email: 'citizen@example.test',
        role: 'citizen',
        isVerified: true,
        firstName: 'Citizen'
      },
      code: '123456'
    });

    expect(deliverEmail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining('123456'),
      text: expect.stringContaining('Verification code: 123456'),
      webhookPayload: expect.objectContaining({
        code: '123456', expiresInMinutes: 10
      })
    }));
    expect(deliverEmail.mock.calls[0][0].html).not.toContain('href=');
  });
});
