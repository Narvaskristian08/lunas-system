jest.mock('../models/WorkOrder', () => ({ create: jest.fn(), find: jest.fn(), findOne: jest.fn(), findOneAndUpdate: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../models/Incident', () => ({ findById: jest.fn() }));
jest.mock('../models/User', () => ({ findById: jest.fn() }));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn() }));
jest.mock('../services/evidenceService', () => ({ processAndUploadRepairEvidence: jest.fn(), cleanupEvidence: jest.fn() }));

const Incident = require('../models/Incident');
const User = require('../models/User');
const { createWorkOrder } = require('./workOrderController');

const response = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('future work-order boundary', () => {
  test('cannot bypass validation by creating a work order for a submitted incident', async () => {
    Incident.findById.mockResolvedValue({ status: 'submitted', workOrder: null });
    const req = {
      body: {
        incident: '507f191e810c19729de860a1',
        assignedTo: '507f191e810c19729de860a2'
      },
      user: { _id: '507f191e810c19729de860a3' }
    };
    const res = response();

    await createWorkOrder(req, res, jest.fn());

    expect(User.findById).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

const WorkOrder = require('../models/WorkOrder');
const { getWorkOrders } = require('./workOrderController');

test.each(['accepted', 'rework_required'])('assignment can be reassigned before starting or resuming (%s)', async (status) => {
  const assignmentId = '507f191e810c19729de860a4';
  const workOrder = { _id: '507f191e810c19729de860a5', version: 3,
    status, assignmentState: 'accepted', responsibleOrganization: 'Water District',
    ...(status === 'rework_required' ? { startedAt: new Date() } : {}),
    currentAssignment: assignmentId, assignments: [{ _id: assignmentId, active: true }] };
  WorkOrder.findOne.mockReturnValue({ populate: jest.fn().mockReturnThis(), then: (resolve) => Promise.resolve(workOrder).then(resolve) });
  User.findById.mockResolvedValue({ _id: '507f191e810c19729de860a6', role: 'repair_personnel', isActive: true, availability: 'available', repairOrganization: 'Water District' });
  WorkOrder.findOneAndUpdate.mockResolvedValue(null);
  const next = jest.fn();
  const res = response();
  await require('./workOrderController').reassignWorkOrder({ params: { id: workOrder._id },
    user: { role: 'utility_provider', utilityCompany: 'Water District' },
    body: { assigneeId: '507f191e810c19729de860a6', reason: 'Change crew before start' } }, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(WorkOrder.findOneAndUpdate).toHaveBeenLastCalledWith(
    expect.objectContaining({ assignmentState: 'accepted', status, version: 3, ...(status === 'accepted' ? { startedAt: null, actualStartTime: null } : {}) }),
    expect.objectContaining({ $set: expect.objectContaining({ assignmentState: 'accepted', status }) }),
    expect.any(Object)
  );
});

test.each([
  { status: 'in_progress', assignmentState: 'pending' },
  { status: 'rework_required', assignmentState: 'declined' },
  { status: 'pending', assignmentState: 'pending', startedAt: new Date() },
  { status: 'accepted', assignmentState: 'accepted', actualStartTime: new Date() }
])('reassignment rejects started work (%j)', async (state) => {
  const workOrder = { _id: '507f191e810c19729de860a5', responsibleOrganization: 'Water District', ...state };
  WorkOrder.findOne.mockReturnValue({ populate: jest.fn().mockReturnThis(), then: (resolve) => Promise.resolve(workOrder).then(resolve) });
  WorkOrder.findOneAndUpdate.mockClear();
  const res = response();
  await require('./workOrderController').reassignWorkOrder({ params: { id: workOrder._id },
    user: { role: 'utility_provider', utilityCompany: 'Water District' }, body: {} }, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(409);
  expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
});

test('provider cannot reassign a started accepted assignment', async () => {
  const workOrder = { _id: '507f191e810c19729de860a5', status: 'in_progress',
    assignmentState: 'accepted', responsibleOrganization: 'Water District' };
  WorkOrder.findOne.mockReturnValue({ populate: jest.fn().mockReturnThis(), then: (resolve) => Promise.resolve(workOrder).then(resolve) });
  WorkOrder.findOneAndUpdate.mockClear();
  const res = response();
  const next = jest.fn();
  await require('./workOrderController').reassignWorkOrder({ params: { id: workOrder._id },
    user: { role: 'utility_provider', utilityCompany: 'Water District' }, body: {} }, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(409);
  expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
});

test('replacement upload sets one photo and preserves the old file if the write conflicts', async () => {
  const evidenceService = require('../services/evidenceService');
  const assignee = '507f191e810c19729de860a3';
  const workOrder = { _id: '507f191e810c19729de860a5', assignedTo: assignee,
    status: 'in_progress', assignmentState: 'accepted', version: 2,
    repairEvidence: [{ key: 'old-photo' }] };
  WorkOrder.findOne.mockReturnValue({ populate: jest.fn().mockReturnThis(), then: (resolve) => Promise.resolve(workOrder).then(resolve) });
  WorkOrder.findOneAndUpdate.mockResolvedValue(null);
  evidenceService.processAndUploadRepairEvidence.mockResolvedValue([{ key: 'new-photo' }]);
  evidenceService.cleanupEvidence.mockClear();
  const res = response();
  await require('./workOrderController').uploadRepairEvidence({ params: { id: workOrder._id },
    user: { _id: assignee, role: 'repair_personnel', repairOrganization: 'Water District' },
    files: [{}], body: {} }, res, jest.fn());
  const mutation = WorkOrder.findOneAndUpdate.mock.calls.at(-1)[1];
  expect(mutation.$set.repairEvidence).toHaveLength(1);
  expect(mutation.$set.repairEvidence[0].key).toBe('new-photo');
  expect(mutation.$push.repairEvidence).toBeUndefined();
  expect(evidenceService.cleanupEvidence).toHaveBeenCalledWith([{ key: 'new-photo' }]);
  expect(evidenceService.cleanupEvidence).not.toHaveBeenCalledWith(workOrder.repairEvidence);
  expect(res.status).toHaveBeenCalledWith(409);
});

test.each(['pending', 'rework_required', 'in_progress'])('start directly authorizes a legacy pending %s assignment atomically', async (status) => {
  const assignee = '507f191e810c19729de860a3';
  const assignmentId = '507f191e810c19729de860a4';
  const workOrder = { _id: '507f191e810c19729de860a5', assignedTo: assignee,
    status, assignmentState: 'pending', version: 2, currentAssignment: assignmentId,
    assignments: [{ _id: assignmentId, active: true, assignee }] };
  const query = { populate: jest.fn().mockReturnThis(), then: (resolve) => Promise.resolve(workOrder).then(resolve) };
  WorkOrder.findOne.mockReturnValue(query);
  WorkOrder.findOneAndUpdate.mockResolvedValue(null);
  const res = response();
  const next = jest.fn();
  await require('./workOrderController').startWorkOrder({ params: { id: workOrder._id },
    user: { _id: assignee, role: 'repair_personnel', repairOrganization: 'Water District' } }, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(WorkOrder.findOneAndUpdate).toHaveBeenLastCalledWith(
    expect.objectContaining({ version: 2, assignmentState: 'pending', assignedTo: assignee, status }),
    expect.objectContaining({ $set: expect.objectContaining({ status: 'in_progress', assignmentState: 'accepted', 'assignments.$[active].status': 'accepted' }) }),
    expect.objectContaining({ arrayFilters: [{ 'active._id': assignmentId }] })
  );
  expect(res.status).toHaveBeenCalledWith(409);
});

test.each([
  ['awaiting_acceptance', { status: { $in: ['pending', 'in_progress', 'rework_required'] }, assignmentState: 'pending' }],
  ['assigned', { status: { $in: ['pending', 'accepted'] }, assignmentState: { $in: ['pending', 'accepted'] } }],
  ['active', { status: 'in_progress', assignmentState: 'accepted' }],
  ['review', { status: 'completed' }],
  ['correction', { status: { $in: ['rework_required', 'city_correction_required'] }, assignmentState: { $in: ['pending', 'accepted'] } }]
])('repair queue %s filters both results and pagination', async (repairView, expected) => {
  const query = {};
  for (const method of ['populate', 'sort', 'limit', 'skip']) query[method] = jest.fn().mockReturnValue(query);
  query.then = (resolve) => Promise.resolve([]).then(resolve);
  WorkOrder.find.mockReturnValue(query);
  WorkOrder.countDocuments.mockResolvedValue(0);
  const next = jest.fn();
  await getWorkOrders({ user: { role: 'repair_personnel', repairOrganization: 'Water District', _id: '507f191e810c19729de860a3' }, query: { repairView } }, response(), next);
  expect(next).not.toHaveBeenCalled();
  const filter = expect.objectContaining({ ...expected, assignedTo: '507f191e810c19729de860a3' });
  expect(WorkOrder.find).toHaveBeenLastCalledWith(filter);
  expect(WorkOrder.countDocuments).toHaveBeenLastCalledWith(filter);
});

test.each([undefined, 'verified'])(
  'provider work-order list excludes verified orders unless explicitly requested (%s)',
  async (status) => {
    const query = {};
    for (const method of ['populate', 'sort', 'limit', 'skip']) query[method] = jest.fn().mockReturnValue(query);
    query.then = (resolve) => Promise.resolve([]).then(resolve);
    WorkOrder.find.mockReturnValue(query);
    WorkOrder.countDocuments.mockResolvedValue(0);
    const next = jest.fn();
    await getWorkOrders({ user: { role: 'utility_provider', organization: 'Water District' }, query: { status } }, response(), next);
    expect(next).not.toHaveBeenCalled();
    expect(WorkOrder.find).toHaveBeenLastCalledWith(expect.objectContaining({
      status: status || { $ne: 'verified' }
    }));
    expect(WorkOrder.countDocuments).toHaveBeenLastCalledWith(expect.objectContaining({
      status: status || { $ne: 'verified' }
    }));
  }
);
