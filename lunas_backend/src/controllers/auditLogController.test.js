jest.mock('../models/AuditLog', () => ({
  find: jest.fn(),
  countDocuments: jest.fn()
}));

const AuditLog = require('../models/AuditLog');
const { getAuditLogs } = require('./auditLogController');

const createResponse = () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
};

describe('admin audit-log query', () => {
  test('returns newest records with actor summaries and pagination', async () => {
    const query = {
      populate: jest.fn(),
      sort: jest.fn(),
      skip: jest.fn(),
      limit: jest.fn(),
      lean: jest.fn()
    };
    query.populate.mockReturnValue(query);
    query.sort.mockReturnValue(query);
    query.skip.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.lean.mockResolvedValue([{
      _id: 'audit-1',
      action: 'user_archived',
      actorType: 'user',
      performedBy: {
        _id: '507f191e810c19729de860aa',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        role: 'admin'
      },
      source: 'web',
      status: 'success',
      details: { reason: 'Employment ended' },
      timestamp: new Date('2026-09-27T00:00:00Z')
    }]);
    AuditLog.find.mockReturnValue(query);
    AuditLog.countDocuments.mockResolvedValue(1);
    const res = createResponse();

    await getAuditLogs({
      query: { action: 'user_archived', page: '1', limit: '25' }
    }, res, jest.fn());

    expect(AuditLog.find).toHaveBeenCalledWith({ action: 'user_archived' });
    expect(query.sort).toHaveBeenCalledWith({ timestamp: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: [expect.objectContaining({
        action: 'user_archived',
        actor: expect.objectContaining({ name: 'Admin User', role: 'admin' })
      })],
      pagination: { page: 1, limit: 25, total: 1, pages: 1 }
    }));
  });
});
