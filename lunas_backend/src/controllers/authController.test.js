jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn()
}));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../utils/authTokens', () => ({
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
  changePassword,
  getMe,
  login,
  register,
  forgotPassword,
  verifyPasswordResetCode,
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
    process.env.JWT_SECRET = 'test-password-reset-secret';
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
        middleName: 'Santos',
        suffix: 'Jr.',
        lastName: 'Dela Cruz',
        email: 'JUAN@EXAMPLE.COM',
        phone: '09123456789',
        password: 'SecurePass123!',
        role: 'admin'
      },
      ip: '127.0.0.1',
      headers: {}
    };
    const res = createResponse();

    await register(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'juan@example.com',
      middleName: 'Santos',
      suffix: 'Jr.',
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
        phone: '09123456789', password: 'SecurePass123!'
      },
      headers: {}
    }, res, jest.fn());

    expect(User.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('returns a conflict when an email belongs to a pending unverified citizen', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: '507f191e810c19729de860aa',
        role: 'citizen',
        isActive: false,
        isVerified: false,
        isArchived: false,
        comparePassword: jest.fn().mockResolvedValue(false)
      })
    });
    const res = createResponse();

    await register({
      body: {
        firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan@example.com',
        phone: '09123456789', password: 'SecurePass123!'
      },
      headers: {}
    }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(deliverRegistrationCode).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
  });

  test('resumes a pending registration only after verifying its password', async () => {
    const user = { _id: '507f191e810c19729de860aa', firstName: 'Juan', role: 'citizen', isActive: false, isVerified: false, comparePassword: jest.fn().mockResolvedValue(true), save: jest.fn().mockResolvedValue() };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const res = createResponse();
    await register({ body: { firstName: 'Juan', lastName: 'Cruz', email: 'juan@example.com', password: 'SecurePass123!' }, headers: {} }, res, jest.fn());
    expect(user.comparePassword).toHaveBeenCalledWith('SecurePass123!');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(user.save).toHaveBeenCalled();
    expect(user.registrationMfaAttempts).toBe(0);
    expect(User.create).not.toHaveBeenCalled();
  });

  test.each(['citizen', 'barangay_tanod', 'repair_personnel'])('issues a rotated session pair after valid credentials for %s', async (role) => {
    const user = {
      _id: '507f191e810c19729de860aa',
      role,
      isActive: true,
      tokenVersion: 0,
      deviceTokens: [],
      refreshTokens: [],
      comparePassword: jest.fn().mockResolvedValue(true),
      toPublicJSON: jest.fn(() => ({ id: '507f191e810c19729de860aa', role })),
      save: jest.fn().mockResolvedValue()
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const res = createResponse();

    await login({
      body: {
        email: 'juan@example.com',
        password: 'SecurePass123!',
        platform: 'web',
        captchaToken: 'turnstile-token'
      },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(user.comparePassword).toHaveBeenCalledWith('SecurePass123!');
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
        password: 'SecurePass123!',
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

  test.each(['barangay_official', 'utility_provider', 'admin'].flatMap(role =>
    [undefined, 'android', 'ios'].map(platform => [role, platform])))('stored %s role cannot bypass CAPTCHA using platform %s', async (role, platform) => {
    const user = { _id: '507f191e810c19729de860aa', role, isActive: true,
      isVerified: true, comparePassword: jest.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const res = createResponse();
    await login({ body: { email: 'person@example.test', password: 'Password123!', platform }, headers: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(issueTokenPair).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Complete the CAPTCHA challenge.' });
  });

  test.each(['citizen', 'barangay_tanod', 'repair_personnel'])('native %s login retains a CAPTCHA-free contract', async role => {
    const user = { _id: '507f191e810c19729de860aa', role, isActive: true, isVerified: true,
      deviceTokens: [], refreshTokens: [], comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn(), toPublicJSON: () => ({ role }) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const res = createResponse();
    await login({ body: { email: 'person@example.test', password: 'Password123!' }, headers: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(verifyLoginCaptcha).not.toHaveBeenCalled();
  });

  test.each([true, false])('privileged native-spoofed request checks supplied challenge (valid=%s)', async valid => {
    const user = { _id: '507f191e810c19729de860aa', role: 'admin', isActive: true, isVerified: true,
      deviceTokens: [], refreshTokens: [], comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn(), toPublicJSON: () => ({ role: 'admin' }) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    verifyLoginCaptcha.mockResolvedValue({ success: valid, unavailable: false });
    const res = createResponse();
    await login({ body: { email: 'person@example.test', password: 'Password123!', platform: 'android', captchaToken: 'token' }, headers: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(valid ? 200 : 400);
    if (!valid) expect(issueTokenPair).not.toHaveBeenCalled();
  });

  test.each([null, 'admin', 'citizen'])('invalid native credentials do not advertise account/role (%s)', async role => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(role
      ? { role, comparePassword: jest.fn().mockResolvedValue(false) } : null) });
    const res = createResponse();
    await login({ body: { email: 'person@example.test', password: 'wrong', platform: 'android' }, headers: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid credentials' });
    expect(verifyLoginCaptcha).not.toHaveBeenCalled();
  });

  test('production ignores the development CAPTCHA bypass flag', async () => {
    const oldNode = process.env.NODE_ENV, oldBypass = process.env.LUNAS_DISABLE_LOGIN_CAPTCHA;
    try {
      process.env.NODE_ENV = 'production'; process.env.LUNAS_DISABLE_LOGIN_CAPTCHA = 'true';
      let controller, users;
      jest.isolateModules(() => {
        controller = require('./authController'); users = require('../models/User');
      });
      users.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({
        _id: '507f191e810c19729de860aa', role: 'admin', isActive: true, isVerified: true,
        comparePassword: jest.fn().mockResolvedValue(true)
      }) });
      const res = createResponse();
      await controller.login({ body: { email: 'person@example.test', password: 'Password123!', platform: 'ios' }, headers: {} }, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    } finally {
      if (oldNode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldNode;
      if (oldBypass === undefined) delete process.env.LUNAS_DISABLE_LOGIN_CAPTCHA; else process.env.LUNAS_DISABLE_LOGIN_CAPTCHA = oldBypass;
    }
  });

  test('keeps an authenticated session when the current password is incorrect', async () => {
    const user = {
      _id: '507f191e810c19729de860aa',
      comparePassword: jest.fn().mockResolvedValue(false),
      save: jest.fn().mockResolvedValue()
    };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const res = createResponse();

    await changePassword({
      user: { _id: user._id },
      body: { currentPassword: 'wrong-password', newPassword: 'NewSecure123!' },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(user.comparePassword).toHaveBeenCalledWith('wrong-password');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Current password is incorrect'
    });
    expect(user.save).not.toHaveBeenCalled();
    expect(issueTokenPair).not.toHaveBeenCalled();
  });

  test('audits registration MFA delivery failures without creating an account', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    deliverRegistrationCode.mockResolvedValue({ configured: true, delivered: false });
    const res = createResponse();

    await register({
      body: {
        firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan@example.com',
        phone: '09123456789', password: 'SecurePass123!'
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
    expect(user.recoveryEmail).toBeUndefined();
    expect(user.recoveryEmailVerifiedAt).toBeUndefined();
    expect(user.refreshTokens).toEqual(expect.arrayContaining([
      expect.objectContaining({ tokenHash: 'refresh-token-hash' })
    ]));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ accessToken: 'access-token' })
    }));
  });

  test('uses a separately verified recovery email for password reset delivery', async () => {
    const user = {
      _id: '507f191e810c19729de860aa',
      email: 'juan@example.com',
      role: 'citizen',
      isActive: true,
      isVerified: true,
      firstName: 'Juan',
      recoveryEmail: 'recovery@example.com',
      recoveryEmailVerifiedAt: new Date(),
      createPasswordResetToken: jest.fn().mockReturnValue('reset-token'),
      save: jest.fn().mockResolvedValue()
    };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(user)
    });
    const { deliverPasswordReset } = require('../services/passwordResetDeliveryService');
    deliverPasswordReset.mockResolvedValue({ configured: true, delivered: true });
    const res = createResponse();

    await forgotPassword({
      body: { email: 'JUAN@EXAMPLE.COM' },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(deliverPasswordReset).toHaveBeenCalledWith(expect.objectContaining({
      user,
      code: expect.stringMatching(/^\d{6}$/)
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('consumes a valid reset code atomically and returns a password-change token', async () => {
    process.env.JWT_SECRET = 'test-password-reset-secret';
    User.findOneAndUpdate.mockResolvedValue({ _id: 'user-id' });
    const res = createResponse();
    await verifyPasswordResetCode({ body: { email: 'juan@example.com', code: '123456' }, headers: {}, ip: '127.0.0.1' }, res, jest.fn());
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(expect.objectContaining({
      email: 'juan@example.com', passwordResetCodeAttempts: { $lt: 5 },
      passwordResetCodeExpires: { $gt: expect.any(Date) }
    }), expect.objectContaining({ $unset: { passwordResetCodeHash: 1, passwordResetCodeExpires: 1 } }), { new: true });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { resetToken: expect.stringMatching(/^[a-f0-9]{64}$/) } }));
  });

  test('invalid, expired, reused or locked reset codes return no password-change token', async () => {
    process.env.JWT_SECRET = 'test-password-reset-secret';
    User.findOneAndUpdate.mockResolvedValue(null);
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });
    const res = createResponse();
    await verifyPasswordResetCode({ body: { email: 'juan@example.com', code: '000000' }, headers: {}, ip: '127.0.0.1' }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.updateOne).toHaveBeenCalledWith(expect.objectContaining({ passwordResetCodeAttempts: { $lt: 5 } }), { $inc: { passwordResetCodeAttempts: 1 } });
    expect(res.json.mock.calls[0][0].data).toBeUndefined();
  });

  test('does not send a reset code to personnel without a verified recovery email', async () => {
    const user = { _id: '507f191e810c19729de860aa', role: 'utility_provider', isActive: true, isVerified: true };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const res = createResponse();
    await forgotPassword({ body: { email: 'juan@example.com' }, ip: '127.0.0.1', headers: {} }, res, jest.fn());
    expect(require('../services/passwordResetDeliveryService').deliverPasswordReset).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.objectContaining({ reason: 'recovery_email_unavailable' })
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
      body: { email: 'juan@example.com', password: 'SecurePass123!' },
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


test.each(['repair_personnel', 'utility_provider', 'barangay_official', 'city_engineer', 'admin'])('%s cannot change managed profile details', async role => {
  const { updateProfile } = require('./authController');
  const res = createResponse();
  await new Promise((resolve, reject) => {
    res.json.mockImplementation(resolve);
    updateProfile({ user: { role }, body: { firstName: 'Changed' } }, res, reject);
  });
  expect(res.status).toHaveBeenCalledWith(403);
});
