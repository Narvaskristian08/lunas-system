jest.mock('../models/ReportingAppeal', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  findOneAndUpdate: jest.fn()
}));
jest.mock('../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));

const ReportingAppeal = require('../models/ReportingAppeal');
const User = require('../models/User');
const { createAppeal, listAppeals, getAppealForReporter, reviewAppeal } = require('./reportingAppealController');

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

const blockedUser = () => ({
  _id: '507f191e810c19729de860aa',
  role: 'citizen',
  address: { barangay: 'Pantal' },
  reportingRestriction: {
    status: 'blocked', confirmedFindings: 3, threshold: 3,
    assignedBarangay: 'Pantal', appealStatus: 'none'
  }
});

beforeEach(() => jest.clearAllMocks());

test('citizen can submit one text/reference appeal while reporting is blocked', async () => {
  const user = blockedUser();
  const appeal = {
    _id: '507f191e810c19729de860ab',
    reporter: user._id,
    assignedBarangay: 'Pantal',
    explanation: 'The report was based on a real issue observed at the location.',
    evidenceReference: 'Incident log BL-1',
    status: 'pending',
    version: 0
  };
  User.findById.mockResolvedValue(user);
  ReportingAppeal.findOne.mockReturnValue(query(null));
  ReportingAppeal.create.mockResolvedValue(appeal);

  const res = response();
  await createAppeal({ user, body: { explanation: appeal.explanation, evidenceReference: appeal.evidenceReference }, ip: '127.0.0.1', headers: {} }, res, jest.fn());

  expect(ReportingAppeal.create).toHaveBeenCalledWith(expect.objectContaining({
    reporter: user._id,
    assignedBarangay: 'Pantal',
    source: 'online',
    status: 'pending'
  }));
  expect(User.findByIdAndUpdate).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(201);
});

test('Barangay Official approval clears the reporting block', async () => {
  const appeal = {
    _id: '507f191e810c19729de860ab',
    reporter: '507f191e810c19729de860aa',
    assignedBarangay: 'Pantal',
    status: 'pending',
    version: 0
  };
  const updated = { ...appeal, status: 'approved', version: 1, reviewedBy: 'official' };
  ReportingAppeal.findOne.mockReturnValue(query(appeal));
  ReportingAppeal.findOneAndUpdate.mockReturnValue(query(updated));
  User.findByIdAndUpdate.mockResolvedValue({});

  const res = response();
  await reviewAppeal({
    user: { _id: 'official', role: 'barangay_official', barangay: 'Pantal' },
    params: { id: appeal._id },
    body: { decision: 'approved', expectedVersion: 0, notes: 'Evidence reviewed.' },
    ip: '127.0.0.1', headers: {}
  }, res, jest.fn());

  expect(User.findByIdAndUpdate).toHaveBeenCalledWith(appeal.reporter, { $set: expect.objectContaining({
    'reportingRestriction.status': 'clear',
    'reportingRestriction.appealStatus': 'approved'
  }) });
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('restored') }));
});

test('completed appeal history returns approved and rejected appeals within the Barangay scope', async () => {
  const completed = {
    _id: '507f191e810c19729de860ac',
    reporter: { _id: '507f191e810c19729de860aa', firstName: 'Demo', lastName: 'Citizen', email: 'demo.citizen@lunas.test' },
    assignedBarangay: 'Pantal',
    explanation: 'The issue was observed at the reported location.',
    evidenceReference: 'Local incident log P-1',
    status: 'rejected',
    version: 1,
    reviewedAt: new Date('2026-10-10T08:00:00.000Z'),
    reviewNotes: 'The submitted reference did not verify the report.'
  };
  ReportingAppeal.find.mockReturnValue(query([completed]));
  ReportingAppeal.countDocuments.mockResolvedValue(1);

  const res = response();
  await listAppeals({
    user: { role: 'barangay_official', barangay: 'Pantal' },
    query: { status: 'completed', page: '1', limit: '5' }
  }, res, jest.fn());

  const expectedFilter = {
    assignedBarangay: 'Pantal',
    status: { $in: ['approved', 'rejected'] }
  };
  expect(ReportingAppeal.find).toHaveBeenCalledWith(expectedFilter);
  expect(ReportingAppeal.countDocuments).toHaveBeenCalledWith(expectedFilter);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
    data: [expect.objectContaining({ status: 'rejected', reviewNotes: completed.reviewNotes })],
    pagination: { page: 1, limit: 5, total: 1, pages: 1 }
  }));
});

test.each(['city_engineer', 'admin', 'repair_personnel'])('%s cannot list reporting appeals', async (role) => {
  const res = response();

  await listAppeals({ user: { role }, query: {} }, res, jest.fn());

  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
    code: 'REPORTING_APPEALS_BARANGAY_ONLY'
  }));
  expect(ReportingAppeal.find).not.toHaveBeenCalled();
});

test('non-Barangay staff cannot load an appeal for a reporter', async () => {
  const res = response();

  await getAppealForReporter({
    user: { role: 'city_engineer' },
    params: { reporterId: '507f191e810c19729de860aa' }
  }, res, jest.fn());

  expect(res.status).toHaveBeenCalledWith(403);
  expect(ReportingAppeal.findOne).not.toHaveBeenCalled();
});

test.each(['city_engineer', 'admin', 'repair_personnel'])('%s cannot decide a reporting appeal', async (role) => {
  const res = response();

  await reviewAppeal({
    user: { _id: 'staff', role },
    params: { id: '507f191e810c19729de860ab' },
    body: { decision: 'approved', expectedVersion: 0 }
  }, res, jest.fn());

  expect(res.status).toHaveBeenCalledWith(403);
  expect(ReportingAppeal.findOne).not.toHaveBeenCalled();
});
