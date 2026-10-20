jest.mock('../models/User', () => ({ exists: jest.fn(), updateOne: jest.fn() }));
jest.mock('../models/PushEnrollment', () => ({ findOneAndUpdate: jest.fn(), deleteOne: jest.fn() }));
const User = require('../models/User');
const Enrollment = require('../models/PushEnrollment');
const controller = require('./pushEnrollmentController');
const token = '12345678-1234-1234-1234-123456789abc';
let res; let next;
beforeEach(() => {
  jest.clearAllMocks(); User.exists.mockResolvedValue(false); User.updateOne.mockResolvedValue({ matchedCount: 1 });
  Enrollment.findOneAndUpdate.mockResolvedValue({});
  res = { status: jest.fn().mockReturnThis(), json: jest.fn() }; next = jest.fn();
});
const request = body => ({ user: { _id: 'current-account' }, body });
test('authenticated enrollment scopes unique claim and atomic device refresh to current user', async () => {
  await controller.enroll(request({ token, platform: 'android' }), res, next);
  expect(next).not.toHaveBeenCalled();
  expect(Enrollment.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: expect.stringMatching(/^[a-f0-9]{64}$/), account: 'current-account' });
  expect(User.updateOne.mock.calls[0][0]._id).toBe('current-account');
  expect(Array.isArray(User.updateOne.mock.calls[0][1])).toBe(true);
  expect(res.json).toHaveBeenCalledWith({ success: true, data: { enrolled: true } });
});
test.each([{ token, platform: 'android', account: 'other' }, { token: 'arbitrary', platform: 'ios' }, { token, platform: 'web' }])('invalid or identity-bearing enrollment is rejected', async body => {
  await controller.enroll(request(body), res, next); expect(res.status).toHaveBeenCalledWith(400); expect(Enrollment.findOneAndUpdate).not.toHaveBeenCalled();
});
test('legacy token owned by another account cannot be stolen', async () => {
  User.exists.mockResolvedValue(true);
  await controller.enroll(request({ token, platform: 'ios' }), res, next);
  expect(res.status).toHaveBeenCalledWith(409); expect(User.updateOne).not.toHaveBeenCalled();
});
test('concurrent unique-claim conflict fails closed', async () => {
  Enrollment.findOneAndUpdate.mockRejectedValue({ code: 11000 });
  await controller.enroll(request({ token, platform: 'ios' }), res, next);
  expect(res.status).toHaveBeenCalledWith(409); expect(User.updateOne).not.toHaveBeenCalled();
});
test('device cap failure never reports enrollment success', async () => {
  User.updateOne.mockResolvedValue({ matchedCount: 0 });
  await controller.enroll(request({ token, platform: 'ios' }), res, next);
  expect(res.status).toHaveBeenCalledWith(409);
});
test('unenrollment removes only current account association and claim', async () => {
  await controller.unenroll(request({ token }), res, next);
  expect(User.updateOne).toHaveBeenCalledWith({ _id: 'current-account' }, { $pull: { deviceTokens: { token } } });
  expect(Enrollment.deleteOne.mock.calls[0][0].account).toBe('current-account');
});
