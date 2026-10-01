jest.mock('../models/Incident', () => ({ countDocuments: jest.fn(), aggregate: jest.fn(), find: jest.fn() }));
jest.mock('../models/WorkOrder', () => ({ countDocuments: jest.fn() }));
const Incident = require('../models/Incident');
const { getDashboardStats } = require('./statsController');

test('dashboard overdue counts use the current deadline and exclude terminal incidents within citizen scope', async () => {
  const now = new Date('2026-10-02T00:00:00Z');
  jest.useFakeTimers().setSystemTime(now);
  Incident.countDocuments.mockResolvedValue(0);
  Incident.aggregate.mockResolvedValue([]);
  const query = { sort: jest.fn(), limit: jest.fn(), populate: jest.fn(), select: jest.fn().mockResolvedValue([]) };
  for (const key of ['sort', 'limit', 'populate']) query[key].mockReturnValue(query);
  Incident.find.mockReturnValue(query);
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  const next = jest.fn();
  await getDashboardStats({ user: { _id: 'citizen', role: 'citizen' } }, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(Incident.countDocuments).toHaveBeenCalledWith({ reporter: 'citizen',
    'sla.deadline': { $lt: now }, status: { $nin: ['verified', 'resolved', 'closed', 'rejected', 'duplicate'] } });
  jest.useRealTimers();
});
