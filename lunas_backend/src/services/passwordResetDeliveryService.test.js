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
    deliverEmail.mockResolvedValue({ configured: true, delivered: true });
  });

  afterEach(() => {
    delete process.env.PASSWORD_RESET_APP_URL;
  });

  test('sends only to the verified recovery email', async () => {
    await expect(deliverPasswordReset({
      user: {
        email: 'login-identifier@example.test',
        recoveryEmail: 'reachable@example.test',
        recoveryEmailVerifiedAt: new Date(),
        firstName: 'Test'
      },
      resetToken: 'reset-token'
    })).resolves.toEqual({ configured: true, delivered: true });

    expect(deliverEmail).toHaveBeenCalledWith(expect.objectContaining({
      recipient: { email: 'reachable@example.test', firstName: 'Test' }
    }));
  });

  test('fails closed when recovery email is missing or unverified', async () => {
    await expect(deliverPasswordReset({
      user: { email: 'login-identifier@example.test', recoveryEmail: 'unverified@example.test' },
      resetToken: 'reset-token'
    })).resolves.toEqual({ configured: false, delivered: false });

    expect(deliverEmail).not.toHaveBeenCalled();
  });
});
