jest.mock('../models/User', () => ({ findById: jest.fn() }));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../utils/authTokens', () => ({
  isCurrentTokenVersion: jest.fn(),
  verifyAccessToken: jest.fn()
}));

const { authorize } = require('./auth');
const { createAuditLog } = require('../utils/auditLogger');
const { VALIDATION_DECISION_ROLES } = require('../services/jurisdictionService');

const response = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('incident decision route authorization', () => {
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
    const allowedReq = { user: { _id: 'official-1', role: 'barangay_official' } };
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
