jest.mock('../models/User', () => ({
  findOne: jest.fn(),
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

const User = require('../models/User');
const { issueTokenPair } = require('../utils/authTokens');
const { getMe, login, register } = require('./authController');

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
  });

  test('forces the citizen role even if the controller receives a privileged role', async () => {
    User.findOne.mockResolvedValue(null);
    const user = {
      _id: '507f191e810c19729de860aa',
      role: 'citizen',
      refreshTokens: [],
      toPublicJSON: jest.fn(() => ({ id: '507f191e810c19729de860aa', role: 'citizen' })),
      save: jest.fn().mockResolvedValue()
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
      role: 'citizen'
    }));
    expect(user.refreshTokens).toEqual(expect.arrayContaining([
      expect.objectContaining({ tokenHash: 'refresh-token-hash' })
    ]));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ accessToken: 'access-token', refreshToken: 'refresh-token' })
    }));
  });

  test('returns a conflict when an email is already registered', async () => {
    User.findOne.mockResolvedValue({ _id: '507f191e810c19729de860aa' });
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
      body: { email: 'juan@example.com', password: 'SecurePass123' },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(user.comparePassword).toHaveBeenCalledWith('SecurePass123');
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ accessToken: 'access-token', refreshToken: 'refresh-token' })
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
