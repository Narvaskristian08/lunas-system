jest.mock('./fieldIncidentAccess', () => ({ buildReadableIncidentScope: jest.fn().mockResolvedValue({}) }));
const Incident = require('../models/Incident');
const { inspectionMutation } = require('./inspectionMutation');
let held, response, req;
beforeEach(() => {
  held = false;
  req = { params: { id: 'report' }, user: { _id: 'actor', role: 'barangay_official' }, path: '/review' };
  response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() });
  jest.spyOn(Incident, 'findOne').mockResolvedValue({ _id: 'report' });
  jest.spyOn(Incident, 'findOneAndUpdate').mockImplementation(async (filter, update) => {
    expect(filter['inspectionMutation.token']).toEqual({ $exists: false });
    if (held) return null;
    held = update.$set.inspectionMutation.token;
    return { _id: 'report' };
  });
  jest.spyOn(Incident, 'updateOne').mockImplementation(async filter => {
    expect(filter['inspectionMutation.token']).toBe(held);
    held = false;
  });
});
afterEach(() => jest.restoreAllMocks());
test('deterministic overlap admits exactly one mutation and releases its own claim', async () => {
  let finish, entered;
  const ready = new Promise(resolve => { entered = resolve; });
  const pending = new Promise(resolve => { finish = resolve; });
  const action = jest.fn(async () => { entered(); await pending; });
  const handler = inspectionMutation(action);
  const first = handler(req, response(), jest.fn());
  await ready;
  const secondResponse = response();
  await handler(req, secondResponse, jest.fn());
  expect(secondResponse.status).toHaveBeenCalledWith(409);
  expect(action).toHaveBeenCalledTimes(1);
  finish(); await first;
  expect(held).toBe(false);
});
test('partial-write exception retains claim and blocks all subsequent mutations', async () => {
  const fault = new Error('second document write failed');
  const next = jest.fn();
  await inspectionMutation(async () => { throw fault; })(req, response(), next);
  expect(next).toHaveBeenCalledWith(fault);
  expect(Incident.updateOne).not.toHaveBeenCalled();
  const action = jest.fn(), res = response();
  await inspectionMutation(action)(req, res, next);
  expect(res.status).toHaveBeenCalledWith(409);
  expect(action).not.toHaveBeenCalled();
});
test('unauthorized identity cannot acquire a claim', async () => {
  req.user.role = 'citizen';
  const res = response();
  await inspectionMutation(jest.fn())(req, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(403);
  expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
});
test('version conflict returns 409 and retains the claim for reconciliation', async () => {
  const res = response();
  await inspectionMutation(async () => { throw Object.assign(new Error('stale'), { name: 'VersionError' }); })(req, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(409);
  expect(Incident.updateOne).not.toHaveBeenCalled();
});
