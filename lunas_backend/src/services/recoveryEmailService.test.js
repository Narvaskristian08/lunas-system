jest.mock('./emailDeliveryService', () => ({
  deliverEmail: jest.fn(),
  escapeHtml: value => String(value)
}));

const { deliverEmail } = require('./emailDeliveryService');
const {
  createRecoveryEmailChallenge,
  deliverRecoveryEmailCode,
  hashCode,
  maskEmail,
  safeEqual
} = require('./recoveryEmailService');

describe('recovery email service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-recovery-secret';
  });

  test('creates a six-digit challenge with a hashed code and expiry', () => {
    const challenge = createRecoveryEmailChallenge('Person@Example.com');

    expect(challenge.code).toMatch(/^\d{6}$/);
    expect(challenge.codeHash).not.toBe(challenge.code);
    expect(safeEqual(challenge.codeHash, hashCode({ email: 'person@example.com', code: challenge.code }))).toBe(true);
    expect(challenge.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  test('masks recovery addresses without exposing the mailbox', () => {
    expect(maskEmail('kristian@example.com')).toBe('k******n@example.com');
    expect(maskEmail('a@example.com')).toBe('a***@example.com');
  });

  test('delivers the verification code through the existing email boundary', async () => {
    deliverEmail.mockResolvedValue({ configured: true, delivered: true });

    await expect(deliverRecoveryEmailCode({
      email: 'person@example.com',
      firstName: 'Person',
      code: '123456'
    })).resolves.toEqual({ configured: true, delivered: true });

    expect(deliverEmail).toHaveBeenCalledWith(expect.objectContaining({
      type: 'recovery_email_verification',
      recipient: { email: 'person@example.com', firstName: 'Person' }
    }));
  });
});
