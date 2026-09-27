jest.mock('../models/User', () => ({ findById: jest.fn() }));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../utils/authTokens', () => ({
  hasPrivilegedMfaProof: jest.fn(),
  isCurrentTokenVersion: jest.fn(),
  verifyAccessToken: jest.fn()
}));

const { authorize, protect } = require('./auth');
const { createAuditLog } = require('../utils/auditLogger');
const User = require('../models/User');
const {
  hasPrivilegedMfaProof,
  isCurrentTokenVersion,
  verifyAccessToken
} = require('../utils/authTokens');
const { VALIDATION_DECISION_ROLES } = require('../services/jurisdictionService');

const response = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('50% validation route authorization', () => {
  beforeEach(() => jest.clearAllMocks());

  test('denies a citizen before any validation controller can run', () => {
    const req = {
      user: { _id: 'citizen-1', role: 'citizen' },
      path: '/incidents/507f191e810c19729de860a1/validate',
      headers: {},
      ip: '127.0.0.1'
    };
    const res = response();
    const next = jest.fn();

    authorize(...VALIDATION_DECISION_ROLES)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      status: 'failure',
      details: expect.objectContaining({ userRole: 'citizen' })
    }));
  });

  test('permits a configured validation official but not a provider decision', () => {
    const allowedReq = { user: { _id: 'official-1', role: 'city_engineer' } };
    const providerReq = {
      user: { _id: 'provider-1', role: 'utility_provider' },
      path: '/incidents/507f191e810c19729de860a1/validate',
      headers: {},
      ip: '127.0.0.1'
    };
    const allowedNext = jest.fn();
    const providerNext = jest.fn();
    const providerRes = response();
    const gate = authorize(...VALIDATION_DECISION_ROLES);

    gate(allowedReq, response(), allowedNext);
    gate(providerReq, providerRes, providerNext);

    expect(allowedNext).toHaveBeenCalledTimes(1);
    expect(providerNext).not.toHaveBeenCalled();
    expect(providerRes.status).toHaveBeenCalledWith(403);
  });
});

describe('privileged session MFA enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAccessToken.mockReturnValue({
      id: 'admin-1',
      tokenType: 'access',
      tokenVersion: 2
    });
    isCurrentTokenVersion.mockReturnValue(true);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'admin-1',
        role: 'admin',
        tokenVersion: 2,
        isActive: true,
        isArchived: false
      })
    });
  });

  test('rejects a privileged access token that predates MFA proof', async () => {
    hasPrivilegedMfaProof.mockReturnValue(false);
    const req = { headers: { authorization: 'Bearer legacy-token' } };
    const res = response();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('accepts a privileged access token carrying MFA proof', async () => {
    hasPrivilegedMfaProof.mockReturnValue(true);
    const req = { headers: { authorization: 'Bearer verified-token' } };
    const res = response();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.auth).toEqual(expect.objectContaining({ tokenType: 'access' }));
  });
});
