jest.mock('../models/User', () => ({
  findById: jest.fn(),
  findOne: jest.fn()
}));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../services/recoveryEmailService', () => ({
  createRecoveryEmailChallenge: jest.fn(),
  deliverRecoveryEmailCode: jest.fn(),
  hashCode: jest.fn(),
  maskEmail: jest.fn(email => `masked:${email}`),
  safeEqual: jest.fn()
}));
jest.mock('../services/passwordResetDeliveryService', () => ({ deliverPasswordReset: jest.fn() }));
jest.mock('../services/captchaService', () => ({ verifyLoginCaptcha: jest.fn() }));
jest.mock('../services/registrationMfaService', () => ({
  createRegistrationChallenge: jest.fn(),
  deliverRegistrationCode: jest.fn(),
  isRegistrationChallengeTokenValid: jest.fn(),
  registrationChallengeResponse: jest.fn(),
  verifyRegistrationChallenge: jest.fn()
}));

const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const {
  createRecoveryEmailChallenge,
  deliverRecoveryEmailCode,
  hashCode,
  safeEqual
} = require('../services/recoveryEmailService');
const {
  getRecoveryEmailStatus,
  requestRecoveryEmailVerification,
  verifyRecoveryEmail
} = require('./authController');

const createResponse = () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
};

const userFor = (overrides = {}) => ({
  _id: '507f191e810c19729de860aa',
  email: 'login@agency.example',
  firstName: 'Test',
  recoveryEmail: undefined,
  recoveryEmailVerifiedAt: undefined,
  recoveryEmailPending: undefined,
  recoveryEmailVerificationCodeHash: undefined,
  recoveryEmailVerificationExpiresAt: undefined,
  recoveryEmailVerificationAttempts: 0,
  recoveryEmailVerificationSentAt: undefined,
  save: jest.fn().mockResolvedValue(),
  ...overrides
});

const selectUser = (user) => ({ select: jest.fn().mockResolvedValue(user) });

describe('recovery email controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createRecoveryEmailChallenge.mockReturnValue({
      code: '123456',
      codeHash: 'hashed-code',
      expiresAt: new Date(Date.now() + 600000),
      expiresInSeconds: 600,
      resendAfterSeconds: 60
    });
    deliverRecoveryEmailCode.mockResolvedValue({ configured: true, delivered: true });
    hashCode.mockReturnValue('hashed-code');
    safeEqual.mockReturnValue(true);
  });

  test('returns status flags and a masked address only', async () => {
    const user = userFor({ recoveryEmail: 'person@example.com', recoveryEmailVerifiedAt: new Date() });
    User.findById.mockResolvedValue(user);
    const res = createResponse();

    await getRecoveryEmailStatus({ user: { _id: user._id } }, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { configured: true, verified: true, maskedEmail: 'masked:person@example.com' }
    });
  });

  test('sends a code without replacing the login email', async () => {
    const user = userFor();
    User.findById.mockReturnValue(selectUser(user));
    const res = createResponse();

    await requestRecoveryEmailVerification({
      user: { _id: user._id },
      body: { email: 'Recovery@Example.com' },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(deliverRecoveryEmailCode).toHaveBeenCalledWith(expect.objectContaining({ email: 'recovery@example.com' }));
    expect(user.recoveryEmailPending).toBe('recovery@example.com');
    expect(user.email).toBe('login@agency.example');
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('rejects the authorized login email as the recovery address', async () => {
    const user = userFor();
    User.findById.mockReturnValue(selectUser(user));
    const res = createResponse();

    await requestRecoveryEmailVerification({
      user: { _id: user._id },
      body: { email: user.email.toUpperCase() },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(deliverRecoveryEmailCode).not.toHaveBeenCalled();
  });

  test('verifies the code and activates the pending address', async () => {
    const user = userFor({
      recoveryEmailPending: 'recovery@example.com',
      recoveryEmailVerificationCodeHash: 'hashed-code',
      recoveryEmailVerificationExpiresAt: new Date(Date.now() + 600000)
    });
    User.findById.mockReturnValue(selectUser(user));
    const res = createResponse();

    await verifyRecoveryEmail({
      user: { _id: user._id },
      body: { code: '123456' },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(user.recoveryEmail).toBe('recovery@example.com');
    expect(user.recoveryEmailVerifiedAt).toBeInstanceOf(Date);
    expect(user.recoveryEmailPending).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'recovery_email_verified' }));
  });
});
