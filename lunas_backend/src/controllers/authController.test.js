jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn()
}));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../utils/authTokens', () => ({
  hasPrivilegedMfaProof: jest.fn(),
  hashToken: jest.fn(),
  isCurrentTokenVersion: jest.fn(),
  issueTokenPair: jest.fn(),
  verifyRefreshToken: jest.fn()
}));
jest.mock('../services/passwordResetDeliveryService', () => ({
  deliverPasswordReset: jest.fn()
}));
jest.mock('../services/captchaService', () => ({
  verifyLoginCaptcha: jest.fn()
}));
jest.mock('../services/registrationMfaService', () => ({
  createRegistrationChallenge: jest.fn(),
  deliverRegistrationCode: jest.fn(),
  isRegistrationChallengeTokenValid: jest.fn(),
  registrationChallengeResponse: jest.fn(),
  verifyRegistrationChallenge: jest.fn()
}));
jest.mock('../services/privilegedMfaService', () => ({
  createPrivilegedMfaChallenge: jest.fn(),
  deliverPrivilegedMfaCode: jest.fn(),
  isPrivilegedMfaChallengeTokenValid: jest.fn(),
  privilegedMfaChallengeResponse: jest.fn(),
  requiresPrivilegedMfa: jest.fn(),
  resendAfterSeconds: jest.fn(),
  verifyPrivilegedMfaChallenge: jest.fn()
}));

const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const { issueTokenPair } = require('../utils/authTokens');
const { verifyLoginCaptcha } = require('../services/captchaService');
const {
  createRegistrationChallenge,
  deliverRegistrationCode,
  registrationChallengeResponse,
  verifyRegistrationChallenge
} = require('../services/registrationMfaService');
const {
  createPrivilegedMfaChallenge,
  deliverPrivilegedMfaCode,
  isPrivilegedMfaChallengeTokenValid,
  privilegedMfaChallengeResponse,
  requiresPrivilegedMfa,
  verifyPrivilegedMfaChallenge
} = require('../services/privilegedMfaService');
const {
  getMe,
  login,
  register,
  resetPassword,
  verifyPrivilegedLoginMfa,
  verifyRegistrationMfa
} = require('./authController');

const createResponse = () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
};

describe('public citizen registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    issueTokenPair.mockReturnValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshTokenHash: 'refresh-token-hash',
      refreshTokenExpiresAt: new Date('2026-09-10T00:00:00Z')
    });
    verifyLoginCaptcha.mockResolvedValue({ success: true, unavailable: false });
    createRegistrationChallenge.mockReturnValue({
      challengeToken: 'challenge-token',
      challengeTokenHash: 'challenge-hash',
      code: '123456',
      codeHash: 'code-hash',
      expiresAt: new Date('2026-09-10T00:10:00Z'),
      expiresInSeconds: 600
    });
    deliverRegistrationCode.mockResolvedValue({ configured: true, delivered: true });
    registrationChallengeResponse.mockReturnValue({
      challengeToken: 'challenge-token',
      email: 'juan@example.com',
      expiresInSeconds: 600,
      resendAfterSeconds: 60
    });
    requiresPrivilegedMfa.mockImplementation((role) => [
      'barangay_official', 'city_engineer', 'utility_provider', 'admin'
    ].includes(role));
    createPrivilegedMfaChallenge.mockReturnValue({
      challengeToken: 'p'.repeat(64),
      challengeTokenHash: 'privileged-challenge-hash',
      code: '654321',
      codeHash: 'privileged-code-hash',
      expiresAt: new Date('2026-09-10T00:10:00Z'),
      expiresInSeconds: 600
    });
    deliverPrivilegedMfaCode.mockResolvedValue({ configured: true, delivered: true });
    isPrivilegedMfaChallengeTokenValid.mockReturnValue(true);
    privilegedMfaChallengeResponse.mockReturnValue({
      mfaRequired: true,
      challengeToken: 'p'.repeat(64),
      email: 'official@example.com',
      expiresInSeconds: 600,
      resendAfterSeconds: 60
    });
  });

  test('forces the citizen role and requires MFA before issuing a session', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const user = {
      _id: '507f191e810c19729de860aa',
      role: 'citizen',
      toPublicJSON: jest.fn(() => ({ id: '507f191e810c19729de860aa', role: 'citizen' })),
    };
    User.create.mockResolvedValue(user);
    const req = {
      body: {
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        email: 'JUAN@EXAMPLE.COM',
        phone: '09123456789',
        password: 'SecurePass123',
        role: 'admin'
      },
      ip: '127.0.0.1',
      headers: {}
    };
    const res = createResponse();

    await register(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'juan@example.com',
      role: 'citizen',
      isActive: false,
      isVerified: false,
      registrationChallengeHash: 'challenge-hash',
      registrationMfaCodeHash: 'code-hash'
    }));
    expect(issueTokenPair).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ challengeToken: 'challenge-token', email: 'juan@example.com' })
    }));
  });

  test('returns a conflict when an email is already registered', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: '507f191e810c19729de860aa',
        isActive: true,
        isVerified: true
      })
    });
    const res = createResponse();

    await register({
      body: {
        firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan@example.com',
        phone: '09123456789', password: 'SecurePass123'
      },
      headers: {}
    }, res, jest.fn());

    expect(User.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('issues a rotated session pair after valid credentials', async () => {
    const user = {
      _id: '507f191e810c19729de860aa',
      role: 'citizen',
      isActive: true,
      tokenVersion: 0,
      deviceTokens: [],
      refreshTokens: [],
      comparePassword: jest.fn().mockResolvedValue(true),
      toPublicJSON: jest.fn(() => ({ id: '507f191e810c19729de860aa', role: 'citizen' })),
      save: jest.fn().mockResolvedValue()
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const res = createResponse();

    await login({
      body: {
        email: 'juan@example.com',
        password: 'SecurePass123',
        platform: 'web',
        captchaToken: 'turnstile-token'
      },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(user.comparePassword).toHaveBeenCalledWith('SecurePass123');
    expect(verifyLoginCaptcha).toHaveBeenCalledWith({
      token: 'turnstile-token',
      remoteIp: '127.0.0.1'
    });
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ accessToken: 'access-token', refreshToken: 'refresh-token' })
    }));
  });

  test('rejects a web login before checking credentials when CAPTCHA fails', async () => {
    verifyLoginCaptcha.mockResolvedValue({ success: false, unavailable: false });
    const res = createResponse();

    await login({
      body: {
        email: 'juan@example.com',
        password: 'SecurePass123',
        platform: 'web',
        captchaToken: 'invalid-token'
      },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(User.findOne).not.toHaveBeenCalled();
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'login_captcha_failed',
      actorType: 'anonymous',
      source: 'web',
      status: 'failure',
      details: { reason: 'challenge_rejected' }
    }));
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test.each(['barangay_official', 'city_engineer', 'utility_provider', 'admin'])(
    'requires OTP before issuing a session for %s',
    async (role) => {
      const user = {
        _id: '507f191e810c19729de860ac',
        firstName: 'Officer',
        email: 'official@example.com',
        role,
        isVerified: true,
        isActive: true,
        isArchived: false,
        deviceTokens: [],
        refreshTokens: [],
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue()
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
      const res = createResponse();

      await login({
        body: { email: 'official@example.com', password: 'SecurePass123', platform: 'android' },
        ip: '127.0.0.1',
        headers: {}
      }, res, jest.fn());

      expect(user.privilegedMfaChallengeHash).toBe('privileged-challenge-hash');
      expect(issueTokenPair).not.toHaveBeenCalled();
      expect(user.lastLogin).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ mfaRequired: true })
      }));
    }
  );

  test('issues a privileged session only after a valid OTP', async () => {
    const user = {
      _id: '507f191e810c19729de860ac',
      email: 'official@example.com',
      role: 'admin',
      isActive: true,
      isArchived: false,
      privilegedMfaAttempts: 0,
      deviceTokens: [],
      refreshTokens: [],
      toPublicJSON: jest.fn(() => ({ id: '507f191e810c19729de860ac', role: 'admin' })),
      save: jest.fn().mockResolvedValue()
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    User.findOneAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    verifyPrivilegedMfaChallenge.mockReturnValue({ valid: true });
    const res = createResponse();

    await verifyPrivilegedLoginMfa({
      body: {
        email: 'official@example.com',
        challengeToken: 'p'.repeat(64),
        code: '654321',
        platform: 'web'
      },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(issueTokenPair).toHaveBeenCalledWith(user, { mfaVerified: true });
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: user._id }),
      expect.objectContaining({
        $unset: expect.objectContaining({ privilegedMfaCodeHash: '' }),
        $set: expect.objectContaining({ lastLogin: expect.any(Date) })
      }),
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('rejects email password reset for privileged accounts', async () => {
    const user = {
      _id: '507f191e810c19729de860ac',
      role: 'admin',
      tokenVersion: 2,
      refreshTokens: [{ tokenHash: 'existing-session' }],
      save: jest.fn().mockResolvedValue()
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const res = createResponse();

    await resetPassword({
      body: { token: 'reset-token', password: 'NewSecurePass123' },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(issueTokenPair).not.toHaveBeenCalled();
    expect(user.tokenVersion).toBe(2);
    expect(user.refreshTokens).toHaveLength(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('administrator assistance')
    }));
  });

  test('reserves a wrong-code attempt atomically for the matching challenge', async () => {
    const user = {
      _id: '507f191e810c19729de860ac',
      email: 'official@example.com',
      role: 'admin',
      isActive: true,
      isArchived: false,
      privilegedMfaAttempts: 0,
      privilegedMfaChallengeHash: 'challenge-hash',
      privilegedMfaCodeHash: 'code-hash',
      privilegedMfaExpires: new Date(Date.now() + 60000)
    };
    const attemptedUser = { ...user, privilegedMfaAttempts: 1 };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    User.findOneAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue(attemptedUser)
    });
    verifyPrivilegedMfaChallenge.mockReturnValue({ valid: false, reason: 'invalid' });
    const res = createResponse();

    await verifyPrivilegedLoginMfa({
      body: {
        email: 'official@example.com',
        challengeToken: 'p'.repeat(64),
        code: '000000',
        platform: 'web'
      },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: user._id,
        privilegedMfaAttempts: { $lt: 5 }
      }),
      { $inc: { privilegedMfaAttempts: 1 } },
      { new: true }
    );
    expect(issueTokenPair).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('audits registration MFA delivery failures without creating an account', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    deliverRegistrationCode.mockResolvedValue({ configured: true, delivered: false });
    const res = createResponse();

    await register({
      body: {
        firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan@example.com',
        phone: '09123456789', password: 'SecurePass123'
      },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(User.create).not.toHaveBeenCalled();
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'registration_mfa_delivery_failed',
      actorType: 'anonymous',
      source: 'mobile',
      status: 'failure'
    }));
    expect(res.status).toHaveBeenCalledWith(503);
  });

  test('issues a session only after a valid registration OTP', async () => {
    const user = {
      _id: '507f191e810c19729de860aa',
      email: 'juan@example.com',
      role: 'citizen',
      isActive: false,
      isVerified: false,
      isArchived: false,
      tokenVersion: 0,
      registrationMfaAttempts: 0,
      refreshTokens: [],
      toPublicJSON: jest.fn(() => ({
        id: '507f191e810c19729de860aa',
        role: 'citizen',
        isVerified: true
      })),
      save: jest.fn().mockResolvedValue()
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    verifyRegistrationChallenge.mockReturnValue({ valid: true });
    const res = createResponse();

    await verifyRegistrationMfa({
      body: {
        email: 'juan@example.com',
        challengeToken: 'challenge-token',
        code: '123456'
      },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(user.isVerified).toBe(true);
    expect(user.isActive).toBe(true);
    expect(user.refreshTokens).toEqual(expect.arrayContaining([
      expect.objectContaining({ tokenHash: 'refresh-token-hash' })
    ]));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ accessToken: 'access-token' })
    }));
  });

  test('rejects invalid credentials and inactive accounts without issuing tokens', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const invalidResponse = createResponse();

    await login({
      body: { email: 'juan@example.com', password: 'WrongPass123' },
      ip: '127.0.0.1', headers: {}
    }, invalidResponse, jest.fn());

    expect(invalidResponse.status).toHaveBeenCalledWith(401);

    const inactiveUser = {
      _id: '507f191e810c19729de860aa',
      isActive: false,
      comparePassword: jest.fn().mockResolvedValue(true)
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(inactiveUser) });
    const inactiveResponse = createResponse();

    await login({
      body: { email: 'juan@example.com', password: 'SecurePass123' },
      ip: '127.0.0.1', headers: {}
    }, inactiveResponse, jest.fn());

    expect(inactiveResponse.status).toHaveBeenCalledWith(403);
  });

  test('returns only the current user public profile', async () => {
    const user = {
      toPublicJSON: jest.fn(() => ({ id: '507f191e810c19729de860aa', role: 'citizen' }))
    };
    User.findById.mockResolvedValue(user);
    const res = createResponse();

    await getMe({ user: { _id: '507f191e810c19729de860aa' } }, res, jest.fn());

    expect(User.findById).toHaveBeenCalledWith('507f191e810c19729de860aa');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: '507f191e810c19729de860aa', role: 'citizen' }
    });
  });
});
