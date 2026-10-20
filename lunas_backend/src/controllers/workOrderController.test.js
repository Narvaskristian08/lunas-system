jest.mock('../models/WorkOrder', () => ({ aggregate: jest.fn(), create: jest.fn(), find: jest.fn(), findOne: jest.fn(), findOneAndUpdate: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../models/Incident', () => ({ collection: { name: 'incidents' }, findById: jest.fn(), find: jest.fn().mockImplementation(() => ({ select: jest.fn().mockResolvedValue([{ _id: 'matched-incident' }]) })) }));
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
  Incident.findById.mockResolvedValue({ status: 'in_progress' });
  const assignmentId = '507f191e810c19729de860a4';
  const workOrder = { _id: '507f191e810c19729de860a5', version: 3,
    status, assignmentState: 'accepted', responsibleOrganization: 'Water District',
    ...(status === 'rework_required' ? { startedAt: new Date() } : {}),
    currentAssignment: assignmentId, assignments: [{ _id: assignmentId, active: true }] };
  WorkOrder.findOne.mockReturnValue({ populate: jest.fn().mockReturnThis(), then: (resolve) => Promise.resolve(workOrder).then(resolve) });
  User.findById.mockResolvedValue({ _id: '507f191e810c19729de860a6', role: 'repair_personnel', isActive: true, availability: 'assigned', repairOrganization: 'Water District' });
  WorkOrder.findOneAndUpdate.mockResolvedValue(null);
  const next = jest.fn();
  const res = response();
  await require('./workOrderController').reassignWorkOrder({ params: { id: workOrder._id },
    user: { role: 'utility_provider', utilityCompany: 'Water District' },
    body: { assigneeId: '507f191e810c19729de860a6', reason: 'Change crew before start' } }, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(WorkOrder.findOneAndUpdate).toHaveBeenLastCalledWith(
    expect.objectContaining({ assignmentState: 'accepted', status, version: 3,  }),
    expect.objectContaining({ $set: expect.objectContaining({ assignmentState: 'pending', status: status === 'accepted' ? 'pending' : status }) }),
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

test('evidence upload appends a photo and preserves historical files on conflict', async () => {
  Incident.findById.mockResolvedValue({ status: 'in_progress' });
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
  expect(mutation.$set).toBeUndefined();
  expect(mutation.$push.repairEvidence.$each).toHaveLength(1);
  expect(mutation.$push.repairEvidence.$each[0].key).toBe('new-photo');
  expect(evidenceService.cleanupEvidence).toHaveBeenCalledWith([{ key: 'new-photo' }]);
  expect(evidenceService.cleanupEvidence).not.toHaveBeenCalledWith(workOrder.repairEvidence);
  expect(res.status).toHaveBeenCalledWith(409);
});

test.each(['pending', 'rework_required', 'in_progress'])('start cannot implicitly accept a pending %s assignment', async status => {
  const worker = '507f191e810c19729de860a3';
  WorkOrder.findOne.mockReturnValue({ populate: jest.fn().mockReturnThis(), then: resolve => Promise.resolve({ status, assignedTo: worker, assignmentState: 'pending' }).then(resolve) });
  WorkOrder.findOneAndUpdate.mockClear(); const res = response();
  await require('./workOrderController').startWorkOrder({ params: { id: 'order' }, body: {}, user: { _id: worker, role: 'repair_personnel' } }, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(409); expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
});

test.each([
  ['awaiting_acceptance', { status: { $ne: 'verified' }, assignmentState: 'pending' }],
  ['assigned', { status: { $in: ['pending', 'accepted'] }, assignmentState: { $in: ['pending', 'accepted'] } }],
  ['active', { status: 'in_progress', assignmentState: 'accepted' }],
  ['review', { status: { $in: ['completed', 'provider_accepted'] } }],
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


test.each(['approaching', 'overdue'])('SLA %s preserves combined provider filters', async (slaState) => {
  const query = {};
  for (const method of ['populate', 'sort', 'limit', 'skip']) query[method] = jest.fn().mockReturnValue(query);
  query.then = (resolve) => Promise.resolve([]).then(resolve);
  WorkOrder.find.mockReturnValue(query);
  WorkOrder.countDocuments.mockResolvedValue(0);
  const next = jest.fn();
  await getWorkOrders({ user: { role: 'utility_provider', organization: 'Water District' }, query: {
    status: 'completed', priority: 'high', assignmentStatus: 'accepted', search: 'WO-123', slaState, sortBy: 'deadline'
  } }, response(), next);
  expect(next).not.toHaveBeenCalled();
  const expected = expect.objectContaining({ status: 'completed', priority: 'high', assignmentState: 'accepted',
    $or: [{ orderNumber: { $regex: 'WO-123', $options: 'i' } }, { incident: { $in: ['matched-incident'] } }], $and: [expect.objectContaining({ status: expect.any(Object) })],
    'sla.deadline': expect.any(Object) });
  expect(WorkOrder.find).toHaveBeenLastCalledWith(expected);
  expect(WorkOrder.countDocuments).toHaveBeenLastCalledWith(expected);
  expect(query.sort).toHaveBeenCalledWith('sla.deadline');
});

test('provider Active Repairs count excludes correction', async () => {
  WorkOrder.countDocuments.mockClear();
  WorkOrder.countDocuments.mockResolvedValue(0);
  const next = jest.fn();
  await require('./workOrderController').getWorkOrderSummary({ user: { role: 'utility_provider', organization: 'Water District' } }, response(), next);
  expect(next).not.toHaveBeenCalled();
  expect(WorkOrder.countDocuments.mock.calls[3][0]).toEqual(expect.objectContaining({ status: 'in_progress' }));
});


test.each([
  [{ status: 'awaiting_review' }, { status: { $in: ['completed', 'provider_accepted'] } }],
  [{ status: 'needs_correction' }, { status: { $in: ['rework_required', 'city_correction_required'] } }],
  ...['critical', 'high', 'medium', 'low'].map(value => [{ priority: value }, { priority: value }]),
  ...['pending', 'accepted', 'in_progress', 'completed', 'rework_required', 'provider_accepted', 'city_correction_required', 'verified'].map(value => [{ status: value }, { status: value }]),
  ...['unassigned', 'accepted'].map(value => [{ assignmentStatus: value }, { assignmentState: value }]),
  [{ search: 'WO-123' }, { $or: [{ orderNumber: { $regex: 'WO-123', $options: 'i' } }, { incident: { $in: ['matched-incident'] } }] }]
])('provider filter %j applies to results and total', async (filters, expected) => {
  const query = {};
  for (const method of ['populate', 'sort', 'limit', 'skip']) query[method] = jest.fn().mockReturnValue(query);
  query.then = (resolve) => Promise.resolve([]).then(resolve);
  WorkOrder.find.mockReturnValue(query);
  WorkOrder.countDocuments.mockResolvedValue(0);
  const next = jest.fn();
  await getWorkOrders({ user: { role: 'utility_provider', organization: 'Water District' }, query: filters }, response(), next);
  expect(next).not.toHaveBeenCalled();
  expect(WorkOrder.find).toHaveBeenLastCalledWith(expect.objectContaining(expected));
  expect(WorkOrder.countDocuments).toHaveBeenLastCalledWith(expect.objectContaining(expected));
});


test('provider queue counts match pending and review list rules', async () => {
  WorkOrder.countDocuments.mockClear();
  WorkOrder.countDocuments.mockResolvedValue(0);
  await require('./workOrderController').getWorkOrderSummary({ user: { role: 'utility_provider', organization: 'Water District' } }, response(), jest.fn());
  expect(WorkOrder.countDocuments.mock.calls[0][0]).toEqual(expect.objectContaining({ status: 'pending', assignmentState: 'unassigned' }));
  expect(WorkOrder.countDocuments.mock.calls[4][0]).not.toHaveProperty('progressPercent');
});


test.each([
  ['in_progress', { status: 'in_progress', assignmentState: 'accepted' }],
  ['needs_correction', { status: { $in: ['rework_required', 'city_correction_required'] }, assignmentState: { $in: ['pending', 'accepted'] } }],
])('web repair filter %s matches mobile results and pagination', async (status, expected) => {
  const query = {};
  for (const method of ['populate', 'sort', 'limit', 'skip']) query[method] = jest.fn().mockReturnValue(query);
  query.then = resolve => Promise.resolve([]).then(resolve);
  WorkOrder.find.mockReturnValue(query);
  WorkOrder.countDocuments.mockResolvedValue(0);
  const next = jest.fn();
  await getWorkOrders({ user: { role: 'repair_personnel', repairOrganization: 'Water District', _id: 'worker' }, query: { status } }, response(), next);
  expect(next).not.toHaveBeenCalled();
  const filter = expect.objectContaining({ ...expected, assignedTo: 'worker', responsibleOrganization: 'Water District' });
  expect(WorkOrder.find).toHaveBeenLastCalledWith(filter);
  expect(WorkOrder.countDocuments).toHaveBeenLastCalledWith(filter);
});


test('dashboard pending acceptance and assigned repairs use destination queue rules', async () => {
  WorkOrder.countDocuments.mockClear(); WorkOrder.countDocuments.mockResolvedValue(0);
  await require('./workOrderController').getWorkOrderSummary({ user: { role: 'repair_personnel', repairOrganization: 'Water District', _id: 'worker' } }, response(), jest.fn());
  expect(WorkOrder.countDocuments.mock.calls[1][0]).toMatchObject({ assignmentState: 'pending', status: { $ne: 'verified' } });
  expect(WorkOrder.countDocuments.mock.calls[11][0]).toMatchObject({ assignedTo: 'worker', assignmentState: { $in: ['pending', 'accepted'] }, status: { $in: ['pending', 'accepted'] } });
});


test('pending acceptance list uses the same nonverified grouping as its summary', async () => {
  const query = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(), skip: jest.fn().mockResolvedValue([]) };
  WorkOrder.find.mockReturnValue(query);
  WorkOrder.countDocuments.mockResolvedValue(0);
  const res = response();
  await getWorkOrders({ user: { _id: 'worker', role: 'repair_personnel', repairOrganization: 'Water District' },
    query: { repairView: 'awaiting_acceptance' } }, res, jest.fn());
  expect(WorkOrder.countDocuments).toHaveBeenLastCalledWith(expect.objectContaining({
    assignedTo: 'worker', responsibleOrganization: 'Water District',
    assignmentState: 'pending', status: { $ne: 'verified' }
  }));
});

test.each([{}, { slaState: 'overdue' }, { personnel: 'worker' }])('combined queue paginates in MongoDB and keeps organization scope: %j', async (refinements) => {
  WorkOrder.aggregate.mockResolvedValue([{ rows: [], totals: [{ total: 37 }] }]);
  const res = response();
  const next = jest.fn();
  await require('./workOrderController').getAwaitingAssignmentQueue({
    user: { role: 'utility_provider', utilityCompany: 'Water District' },
    query: { assignmentStatus: 'unassigned', page: '2', limit: '10', ...refinements }
  }, res, next);
  expect(next).not.toHaveBeenCalled();
  const pipeline = WorkOrder.aggregate.mock.calls.at(-1)[0];
  expect(pipeline[0].$match).toEqual(expect.objectContaining({ responsibleOrganization: 'Water District' }));
  const union = pipeline.find(stage => stage.$unionWith);
  if (Object.keys(refinements).length) expect(union).toBeUndefined();
  else expect(union.$unionWith.pipeline[0].$match).toEqual(expect.objectContaining({
    'routing.responsibleOrganization': 'Water District', status: 'provider_assigned', workOrder: null
  }));
  expect(pipeline.at(-1).$facet.rows).toEqual(expect.arrayContaining([{ $skip: 10 }, { $limit: 10 }]));
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ pagination: { page: 2, limit: 10, total: 37, pages: 4 } }));
});


test('combined queue preserves ordering and distinguishes intake links from work-order links', async () => {
  WorkOrder.aggregate.mockResolvedValue([{ rows: [
    { _id: 'report', source: 'incident', updatedAt: new Date() },
    { _id: 'order', source: 'order' }
  ], totals: [{ total: 2 }] }]);
  const orders = { populate: jest.fn().mockReturnThis(), then: resolve => Promise.resolve([
    { _id: 'order', orderNumber: 'WO-1', status: 'pending', assignmentState: 'unassigned' }
  ]).then(resolve) };
  WorkOrder.find.mockReturnValue(orders);
  Incident.find.mockReturnValue({ select: jest.fn().mockResolvedValue([
    { _id: 'report', reportNumber: 'REPORT-1', category: 'road', images: [], createdAt: new Date() }
  ]) });
  const res = response();
  const next = jest.fn();
  await require('./workOrderController').getAwaitingAssignmentQueue({
    user: { role: 'utility_provider', utilityCompany: 'Water District' },
    query: { assignmentStatus: 'unassigned' }
  }, res, next);
  expect(next).not.toHaveBeenCalled();
  const { data } = res.json.mock.calls[0][0];
  expect(data.map(row => row.id)).toEqual(['report', 'order']);
  expect(data[0]).toEqual(expect.objectContaining({ intakeIncidentId: 'report', reference: 'REPORT-1' }));
  expect(data[1]).not.toHaveProperty('intakeIncidentId');
});

test('replacement worker cannot attach evidence to a former worker progress event', async () => {
  const worker = '507f191e810c19729de860a3'; const event = '507f191e810c19729de860b4';
  const order = { _id: 'work', incident: 'incident', assignedTo: worker, status: 'in_progress', assignmentState: 'accepted', version: 2,
    progressUpdates: [{ _id: event, updatedBy: 'another-worker' }] };
  Incident.findById.mockResolvedValue({ status: 'in_progress' });
  WorkOrder.findOne.mockReturnValue({ populate: jest.fn().mockReturnThis(), then: resolve => Promise.resolve(order).then(resolve) });
  const service = require('../services/evidenceService'); service.processAndUploadRepairEvidence.mockClear();
  const res = response();
  await require('./workOrderController').uploadRepairEvidence({ params: { id: 'work' }, user: { _id: worker }, files: [{}], body: { version: 2, progressUpdateId: event } }, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(403); expect(service.processAndUploadRepairEvidence).not.toHaveBeenCalled();
});

test('ambiguous evidence write failure retains new objects for reconciliation', async () => {
  const worker = '507f191e810c19729de860a3';
  const order = { _id: 'work', incident: 'incident', assignedTo: worker, status: 'in_progress', assignmentState: 'accepted', version: 2, repairEvidence: [{ key: 'historical' }] };
  Incident.findById.mockResolvedValue({ status: 'in_progress' });
  WorkOrder.findOne.mockReturnValue({ populate: jest.fn().mockReturnThis(), then: resolve => Promise.resolve(order).then(resolve) });
  WorkOrder.findOneAndUpdate.mockRejectedValueOnce(new Error('Unknown write outcome'));
  const service = require('../services/evidenceService'); service.processAndUploadRepairEvidence.mockResolvedValue([{ key: 'new-object' }]); service.cleanupEvidence.mockClear();
  const next = jest.fn();
  await require('./workOrderController').uploadRepairEvidence({ params: { id: 'work' }, user: { _id: worker }, files: [{}], body: { version: 2 } }, response(), next);
  expect(next).toHaveBeenCalled(); expect(service.cleanupEvidence).not.toHaveBeenCalled();
});
