jest.mock('../models/SupportTicket', () => ({
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn()
}));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));

const SupportTicket = require('../models/SupportTicket');
const { createAuditLog } = require('../utils/auditLogger');
const {
  createSupportTicket,
  getMySupportTickets,
  getSupportTickets,
  updateSupportTicket
} = require('./supportTicketController');

const response = () => {
  const result = {};
  result.status = jest.fn().mockReturnValue(result);
  result.json = jest.fn().mockReturnValue(result);
  return result;
};

const query = (value) => {
  const result = {
    sort: jest.fn(() => result),
    populate: jest.fn(() => result),
    skip: jest.fn(() => result),
    limit: jest.fn(() => result),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject)
  };
  return result;
};

const ticket = (overrides = {}) => ({
  _id: '507f191e810c19729de860aa',
  ticketNumber: 'LUNAS-20261012-ABC123',
  requester: '507f191e810c19729de860ab',
  category: 'bug',
  subject: 'The dashboard does not load',
  description: 'The dashboard shows an error after signing in.',
  priority: 'medium',
  status: 'open',
  toObject() { return { ...this }; },
  save: jest.fn().mockResolvedValue(this),
  ...overrides
});

beforeEach(() => jest.clearAllMocks());

test('creates a ticket for the authenticated requester and audits it', async () => {
  const created = ticket();
  SupportTicket.create.mockResolvedValue(created);
  const res = response();

  await createSupportTicket({
    user: { _id: '507f191e810c19729de860ab' },
    body: {
      requester: 'another-user',
      category: 'bug',
      subject: '  The dashboard does not load  ',
      description: '  The dashboard shows an error after signing in.  ',
      priority: 'high',
      status: 'closed'
    },
    ip: '127.0.0.1',
    headers: {}
  }, res, jest.fn());

  expect(SupportTicket.create).toHaveBeenCalledWith(expect.objectContaining({
    requester: '507f191e810c19729de860ab',
    subject: 'The dashboard does not load',
    description: 'The dashboard shows an error after signing in.',
    priority: 'high'
  }));
  expect(SupportTicket.create.mock.calls[0][0]).not.toHaveProperty('status');
  expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'support_ticket_created', resourceType: 'SupportTicket' }));
  expect(res.status).toHaveBeenCalledWith(201);
});

test('lists only the signed-in user tickets', async () => {
  const records = [ticket()];
  const findQuery = query(records);
  SupportTicket.find.mockReturnValue(findQuery);
  SupportTicket.countDocuments.mockResolvedValue(1);
  const res = response();

  await getMySupportTickets({ user: { _id: 'requester-id' }, query: { page: '2', limit: '10' } }, res, jest.fn());

  expect(SupportTicket.find).toHaveBeenCalledWith({ requester: 'requester-id' });
  expect(findQuery.skip).toHaveBeenCalledWith(10);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ pagination: { page: 2, limit: 10, total: 1, pages: 1 } }));
});

test('admin list supports status and category filters', async () => {
  const findQuery = query([]);
  SupportTicket.find.mockReturnValue(findQuery);
  SupportTicket.countDocuments.mockResolvedValue(0);
  const res = response();

  await getSupportTickets({ query: { status: 'open', category: 'bug', page: '1', limit: '10' } }, res, jest.fn());

  const expectedFilter = { status: 'open', category: 'bug' };
  expect(SupportTicket.find).toHaveBeenCalledWith(expectedFilter);
  expect(SupportTicket.countDocuments).toHaveBeenCalledWith(expectedFilter);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }));
});

test('admin can update a ticket and records the response without trusting the requester', async () => {
  const current = ticket({
    status: 'open',
    priority: 'medium',
    adminResponse: undefined,
    assignedTo: undefined,
    save: jest.fn().mockResolvedValue(undefined)
  });
  SupportTicket.findById.mockResolvedValue(current);
  const res = response();

  await updateSupportTicket({
    user: { _id: 'admin-id' },
    params: { id: current._id },
    body: { requester: 'spoofed-id', status: 'resolved', priority: 'high', adminResponse: 'Fixed and verified.' },
    ip: '127.0.0.1',
    headers: {}
  }, res, jest.fn());

  expect(current.requester).toBe('507f191e810c19729de860ab');
  expect(current.status).toBe('resolved');
  expect(current.assignedTo).toBe('admin-id');
  expect(current.save).toHaveBeenCalled();
  expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'support_ticket_updated', resourceId: current._id }));
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Support ticket updated successfully.' }));
});
