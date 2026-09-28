jest.mock('../models/User', () => ({
  findById: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../utils/auditLogger', () => ({
  createAuditLog: jest.fn().mockResolvedValue(null)
}));

const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const { archiveUser, getUsers } = require('./userController');

const createResponse = () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
};

describe('user account archiving', () => {
  beforeEach(() => jest.clearAllMocks());

  test('archives and revokes a user without deleting the document', async () => {
    const user = {
      _id: '507f191e810c19729de860bb',
      isActive: true,
      isArchived: false,
      tokenVersion: 4,
      refreshTokens: [{ tokenHash: 'active' }],
      deviceTokens: [{ token: 'device' }],
      save: jest.fn().mockResolvedValue(),
      deleteOne: jest.fn(),
      toPublicJSON: jest.fn(() => ({
        id: '507f191e810c19729de860bb',
        isActive: false,
        isArchived: true
      }))
    };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const res = createResponse();

    await archiveUser({
      params: { id: '507f191e810c19729de860bb' },
      body: { reason: 'Employment ended' },
      user: { _id: { toString: () => '507f191e810c19729de860aa' } },
      ip: '127.0.0.1',
      headers: {}
    }, res, jest.fn());

    expect(user.deleteOne).not.toHaveBeenCalled();
    expect(user.isArchived).toBe(true);
    expect(user.isActive).toBe(false);
    expect(user.refreshTokens).toEqual([]);
    expect(user.deviceTokens).toEqual([]);
    expect(user.tokenVersion).toBe(5);
    expect(user.archiveReason).toBe('Employment ended');
    expect(user.save).toHaveBeenCalledWith({ validateBeforeSave: false });
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'user_archived',
      details: { reason: 'Employment ended' }
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'User account archived successfully'
    }));
  });

  test('does not allow an administrator to archive their own account', async () => {
    const res = createResponse();

    await archiveUser({
      params: { id: '507f191e810c19729de860aa' },
      body: { reason: 'Self removal' },
      user: { _id: { toString: () => '507f191e810c19729de860aa' } },
      headers: {}
    }, res, jest.fn());

    expect(User.findById).not.toHaveBeenCalled();
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'user_archive_failed',
      status: 'failure',
      details: { reason: 'self_archive_blocked' }
    }));
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('archived user visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const query = {
      select: jest.fn(),
      sort: jest.fn(),
      limit: jest.fn(),
      skip: jest.fn().mockResolvedValue([])
    };
    query.select.mockReturnValue(query);
    query.sort.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    User.find.mockReturnValue(query);
    User.countDocuments.mockResolvedValue(0);
  });

  test('allows only admins to include archived accounts', async () => {
    const officialResponse = createResponse();
    await getUsers({
      query: { includeArchived: 'true' },
      user: { role: 'barangay_official' }
    }, officialResponse, jest.fn());
    expect(User.find).toHaveBeenLastCalledWith({ isArchived: { $ne: true }, barangay: '__unassigned__' });

    const adminResponse = createResponse();
    await getUsers({
      query: { includeArchived: 'true' },
      user: { role: 'admin' }
    }, adminResponse, jest.fn());
    expect(User.find).toHaveBeenLastCalledWith({});
  });
});
