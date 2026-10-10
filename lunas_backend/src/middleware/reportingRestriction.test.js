jest.mock('../services/reportingRestrictionService', () => ({
  getReportingRestriction: jest.fn(),
  reportingBlockedResponse: jest.fn((res, restriction) => res.status(403).json({
    success: false,
    code: 'REPORTING_BLOCKED',
    data: { reportingRestriction: restriction }
  }))
}));

const { getReportingRestriction } = require('../services/reportingRestrictionService');
const { rejectBlockedReporting } = require('./reportingRestriction');

const response = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

test('rejects blocked reporting before multipart parsing can run', () => {
  const res = response();
  const next = jest.fn();
  getReportingRestriction.mockReturnValue({ status: 'blocked', confirmedFindings: 3, threshold: 3 });

  rejectBlockedReporting({ user: { _id: 'citizen' } }, res, next);

  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'REPORTING_BLOCKED' }));
  expect(next).not.toHaveBeenCalled();
});

test('allows clear reporters through to evidence parsing', () => {
  const res = response();
  const next = jest.fn();
  getReportingRestriction.mockReturnValue({ status: 'clear' });

  rejectBlockedReporting({ user: { _id: 'citizen' } }, res, next);

  expect(next).toHaveBeenCalledWith();
  expect(res.status).not.toHaveBeenCalled();
});
