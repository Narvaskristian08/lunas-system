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

test('barangay report counts include all 31 barangays and canonicalize grouped names', async () => {
  const { getBarangayReportCounts } = require('./statsController');
  Incident.aggregate.mockResolvedValue([{ _id: 'Pantal', reports: 2, unresolved: 1 }, { _id: ' pantal ', reports: 1, unresolved: 1 }]);
  const res = { json: jest.fn() };
  const next = jest.fn();
  await getBarangayReportCounts({ user: { role: 'city_engineer' } }, res, next);
  expect(next).not.toHaveBeenCalled();
  const rows = res.json.mock.calls[0][0].data;
  expect(rows).toHaveLength(31);
  expect(rows.find(row => row.barangay === 'Pantal').reports).toBe(3);
  expect(rows.find(row => row.barangay === 'Pantal').unresolved).toBe(2);
  expect(rows.find(row => row.barangay === 'Lucao').reports).toBe(0);
});

test('barangay report register scopes and paginates a read-only overdue queue', async () => {
  const { getBarangayReports } = require('./statsController');
  const query = {};
  for (const method of ['select', 'sort', 'skip', 'limit']) query[method] = jest.fn().mockReturnValue(query);
  query.lean = jest.fn().mockResolvedValue([]);
  Incident.find.mockReturnValue(query);
  Incident.countDocuments.mockResolvedValue(0);
  const res = { json: jest.fn() };
  const next = jest.fn();
  await getBarangayReports({ user: { role: 'utility_provider', utilityCompany: 'City Engineering' }, query: { barangay: 'Pantal', state: 'overdue', page: '2', search: 'TEST.' } }, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(query.skip).toHaveBeenCalledWith(20);
  const filter = Incident.find.mock.calls.at(-1)[0];
  expect(filter.$and[0].$and[1].$or[0]).toEqual({ 'jurisdiction.barangay': 'Pantal' });
  expect(filter.$and[1]['sla.deadline'].$lt).toBeInstanceOf(Date);
  expect(new RegExp(filter.$and[2].reportNumber.$regex).test('TESTx')).toBe(false);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ barangay: 'Pantal' }) }));
});
