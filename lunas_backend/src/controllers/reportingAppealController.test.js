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
const { createAppeal, reviewAppeal } = require('./reportingAppealController');

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
