jest.mock('../models/WorkOrder', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn(), countDocuments: jest.fn().mockResolvedValue(0) }));
jest.mock('../models/Incident', () => ({ findById: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../models/User', () => ({ findById: jest.fn(), findByIdAndUpdate: jest.fn() }));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../utils/logger', () => ({ warn: jest.fn(), error: jest.fn(), info: jest.fn() }));
jest.mock('../services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(null),
  notificationTemplates: {
    workOrderAssigned: jest.fn(() => ({ type: 'work_order_assigned' })),
    workOrderReassigned: jest.fn(() => ({ type: 'work_order_reassigned' })),
    workOrderAccepted: jest.fn(() => ({ type: 'work_order_accepted' })),
    workOrderDeclined: jest.fn(() => ({ type: 'work_order_declined' })),
    workOrderProgress: jest.fn(() => ({ type: 'work_order_progress' }))
  }
}));
jest.mock('../services/evidenceService', () => ({
  processAndUploadRepairEvidence: jest.fn().mockResolvedValue([]),
  cleanupEvidence: jest.fn().mockResolvedValue(null)
}));
jest.mock('../services/storageService', () => ({ getEvidenceUrl: jest.fn() }));

const WorkOrder = require('../models/WorkOrder');
const Incident = require('../models/Incident');
const User = require('../models/User');
const logger = require('../utils/logger');
const { createNotification } = require('../services/notificationService');
const {
  acceptWorkOrder,
  declineWorkOrder,
  reassignWorkOrder,
  updateProgress
} = require('./workOrderController');

const provider = {
  _id: '507f191e810c19729de860a1',
  role: 'utility_provider',
  utilityCompany: 'Dagupan Water District'
};
const previousWorker = {
  _id: '507f191e810c19729de860a2',
  role: 'repair_personnel',
  repairOrganization: 'Dagupan Water District',
  barangay: 'Poblacion Oeste'
};
const replacementWorker = {
  _id: '507f191e810c19729de860a3',
  role: 'repair_personnel',
  isActive: true,
  availability: 'available',
  repairOrganization: 'Dagupan Water District',
  barangay: 'Poblacion Oeste'
};
const oldAssignment = {
  _id: '507f191e810c19729de861a1',
  assignee: previousWorker._id,
  assignedBy: provider._id,
  assignedAt: new Date('2026-09-28T01:00:00.000Z'),
  acceptedAt: new Date('2026-09-28T01:15:00.000Z'),
  status: 'accepted',
  active: true
};
const deadline = new Date('2026-10-03T12:00:00.000Z');

const inProgressOrder = (overrides = {}) => ({
  _id: '507f191e810c19729de862a1',
  orderNumber: 'WO-202610-000001',
  incident: '507f191e810c19729de863a1',
  responsibleOrganization: 'Dagupan Water District',
  responsibleRole: 'utility_provider',
  jurisdiction: { barangay: 'Poblacion Oeste', city: 'Dagupan City' },
  priority: 'high',
  status: 'in_progress',
  assignmentState: 'accepted',
  assignedTo: previousWorker._id,
  assignedBy: provider._id,
  currentAssignment: oldAssignment._id,
  assignments: [oldAssignment],
  progressPercent: 50,
  progressStage: 'main_repair',
  progressUpdates: [{
    _id: '507f191e810c19729de864a1',
    previousPercent: 25,
    progressPercent: 50,
    stage: 'main_repair',
    notes: 'Existing progress',
    evidence: ['507f191e810c19729de865a1']
  }],
  repairEvidence: [{
    _id: '507f191e810c19729de865a1',
    key: 'existing-evidence.jpg',
    mimeType: 'image/jpeg',
    size: 100,
    checksum: 'checksum',
    uploadedBy: previousWorker._id
  }],
  history: [],
  startedAt: new Date('2026-09-28T02:00:00.000Z'),
  sla: { deadline, startedAt: new Date('2026-09-27T00:00:00.000Z'), state: 'overdue', isOverdue: true, approachingNotifiedAt: new Date('2026-10-02T12:00:00Z'), overdueNotifiedAt: new Date('2026-10-03T13:00:00Z') },
  version: 8,
  ...overrides
});

const response = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const queryFor = (value) => {
  const query = {
    populate: jest.fn(),
    select: jest.fn(),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject)
  };
  query.populate.mockReturnValue(query);
  query.select.mockReturnValue(query);
  return query;
};

const requestFor = (user, body = {}) => ({
  params: { id: '507f191e810c19729de862a1' },
  body,
  user,
  headers: {},
  ip: '127.0.0.1'
});

const mockIncidentAt = (status) => {
  Incident.findById.mockReturnValue(queryFor({ status }));
  Incident.findOneAndUpdate.mockResolvedValue({ status });
};

describe('repair-personnel reassignment boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIncidentAt('in_progress');
    WorkOrder.findOne.mockReset();
    WorkOrder.findOneAndUpdate.mockReset();
    WorkOrder.countDocuments.mockResolvedValue(0);
    createNotification.mockResolvedValue(null);
    User.findByIdAndUpdate.mockResolvedValue(null);
  });

  test('reassigns in-progress work to a pending replacement without resetting progress or SLA', async () => {
    const workOrder = inProgressOrder();
    WorkOrder.findOne.mockReturnValue(queryFor(workOrder)); User.findById.mockResolvedValue(replacementWorker);
    WorkOrder.findOneAndUpdate.mockResolvedValue({ ...workOrder, assignedTo: replacementWorker._id, assignmentState: 'pending' });
    const res = response();
    await reassignWorkOrder(requestFor(provider, { assigneeId: replacementWorker._id, reason: 'Emergency coverage change', version: workOrder.version }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    const [filter, update] = WorkOrder.findOneAndUpdate.mock.calls[0];
    expect(filter).toMatchObject({ version: workOrder.version, currentAssignment: oldAssignment._id });
    expect(update.$set).toMatchObject({ assignmentState: 'pending', status: 'in_progress' });
    expect(update.$set.assignments[0]).toMatchObject({ active: false, status: 'reassigned' });
    expect(update.$set).not.toHaveProperty('progressPercent'); expect(update.$set).not.toHaveProperty('sla');
  });

  test('lets the replacement accept the pending handoff without restarting the repair', async () => {
    const pendingAssignment = {
      _id: '507f191e810c19729de861a2',
      assignee: replacementWorker._id,
      assignedBy: provider._id,
      status: 'pending',
      active: true
    };
    const pending = inProgressOrder({
      assignedTo: replacementWorker._id,
      currentAssignment: pendingAssignment._id,
      assignmentState: 'pending',
      assignments: [{ ...oldAssignment, active: false, status: 'reassigned' }, pendingAssignment]
    });
    WorkOrder.findOne.mockReturnValue(queryFor(pending));
    WorkOrder.findOneAndUpdate.mockResolvedValue(inProgressOrder({
      ...pending,
      assignmentState: 'accepted',
      assignments: [{ ...oldAssignment, active: false, status: 'reassigned' }, { ...pendingAssignment, status: 'accepted' }],
      version: 9
    }));
    const res = response();

    await acceptWorkOrder(requestFor(replacementWorker), res, jest.fn());

    const [condition, update] = WorkOrder.findOneAndUpdate.mock.calls[0];
    expect(condition).toEqual(expect.objectContaining({
      version: 8,
      assignedTo: replacementWorker._id,
      currentAssignment: pendingAssignment._id,
      status: 'in_progress',
      assignmentState: 'pending'
    }));
    expect(update.$set).toEqual(expect.objectContaining({
      status: 'in_progress',
      assignmentState: 'accepted'
    }));
    expect(update.$set).not.toHaveProperty('startedAt');
    expect(update.$set).not.toHaveProperty('progressPercent');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('continues progress from the preserved milestone after replacement acceptance', async () => {
    const acceptedAssignment = {
      _id: '507f191e810c19729de861a2',
      assignee: replacementWorker._id,
      assignedBy: provider._id,
      status: 'accepted',
      active: true
    };
    const workOrder = inProgressOrder({
      assignedTo: replacementWorker._id,
      currentAssignment: acceptedAssignment._id,
      assignments: [{ ...oldAssignment, active: false, status: 'reassigned' }, acceptedAssignment]
    });
    WorkOrder.findOne.mockReturnValue(queryFor(workOrder));
    WorkOrder.findOneAndUpdate.mockResolvedValue(inProgressOrder({
      ...workOrder,
      progressPercent: 75,
      progressStage: 'finishing',
      version: 9
    }));
    mockIncidentAt('in_progress');
    const res = response();

    await updateProgress(requestFor(replacementWorker, {
      progressPercent: 75,
      stage: 'finishing',
      notes: 'Replacement crew continued the existing repair.'
    }), res, jest.fn());

    const update = WorkOrder.findOneAndUpdate.mock.calls[0][1];
    expect(update.$push.progressUpdates).toEqual(expect.objectContaining({
      previousPercent: 50,
      progressPercent: 75,
      updatedBy: replacementWorker._id
    }));
    expect(update.$push).not.toHaveProperty('repairEvidence');
    expect(update.$set).not.toHaveProperty('repairEvidence');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('revokes the previous worker immediately during a pending handoff', async () => {
    WorkOrder.findOne.mockReturnValue(queryFor(null));
    const res = response();

    await updateProgress(requestFor(previousWorker, {
      progressPercent: 75,
      stage: 'finishing'
    }), res, jest.fn());

    expect(WorkOrder.findOne).toHaveBeenCalledWith(expect.objectContaining({
      assignedTo: previousWorker._id,
      assignmentState: { $in: ['pending', 'accepted'] }
    }));
    expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('denies cross-organization providers and ineligible replacement workers', async () => {
    const workOrder = inProgressOrder({ status: 'accepted', startedAt: null, progressPercent: 0, progressStage: 'assigned' });
    const otherProvider = { ...provider, _id: '507f191e810c19729de860b1', utilityCompany: 'Other Utility' };
    WorkOrder.findOne.mockReturnValueOnce(queryFor(null));
    const providerRes = response();
    await reassignWorkOrder(requestFor(otherProvider, {
      assigneeId: replacementWorker._id,
      reason: 'Unauthorized handoff'
    }), providerRes, jest.fn());
    expect(providerRes.status).toHaveBeenCalledWith(404);

    WorkOrder.findOne.mockReturnValueOnce(queryFor(workOrder));
    User.findById.mockResolvedValue({ ...replacementWorker, repairOrganization: 'Other Utility' });
    const workerRes = response();
    await reassignWorkOrder(requestFor(provider, {
      assigneeId: replacementWorker._id,
      reason: 'Invalid organization'
    }), workerRes, jest.fn());
    expect(workerRes.status).toHaveBeenCalledWith(400);
    expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('preserves in-progress handoff on decline and allows controlled reassignment', async () => {
    const pendingAssignment = {
      _id: '507f191e810c19729de861a2',
      assignee: replacementWorker._id,
      assignedBy: provider._id,
      status: 'pending',
      active: true
    };
    const pending = inProgressOrder({
      assignedTo: replacementWorker._id,
      currentAssignment: pendingAssignment._id,
      assignmentState: 'pending',
      assignments: [{ ...oldAssignment, active: false, status: 'reassigned' }, pendingAssignment]
    });
    const declined = inProgressOrder({
      assignedTo: null,
      assignedBy: null,
      currentAssignment: null,
      assignmentState: 'declined',
      assignments: [{ ...oldAssignment, active: false }, { ...pendingAssignment, active: false, status: 'declined' }],
      version: 9
    });
    WorkOrder.findOne.mockReturnValueOnce(queryFor(pending));
    WorkOrder.findOneAndUpdate.mockResolvedValueOnce(declined);
    mockIncidentAt('in_progress');
    const declineRes = response();

    await declineWorkOrder(requestFor(replacementWorker, { reason: 'Equipment unavailable' }), declineRes, jest.fn());

    expect(WorkOrder.findOneAndUpdate.mock.calls[0][0]).toEqual(expect.objectContaining({
      status: 'in_progress',
      assignmentState: 'pending'
    }));
    expect(Incident.findOneAndUpdate.mock.calls[0][1].$set.status).toBe('in_progress');
    expect(declineRes.status).toHaveBeenCalledWith(200);

    const nextWorker = { ...replacementWorker, _id: '507f191e810c19729de860a4' };
    WorkOrder.findOne.mockReturnValueOnce(queryFor(declined));
    User.findById.mockResolvedValue(nextWorker);
    WorkOrder.findOneAndUpdate.mockResolvedValueOnce(inProgressOrder({
      ...declined,
      assignedTo: nextWorker._id,
      assignmentState: 'pending',
      version: 10
    }));
    const assignRes = response();
    await reassignWorkOrder(requestFor(provider, {
      assigneeId: nextWorker._id,
      reason: 'Assign a crew with the required equipment'
    }), assignRes, jest.fn());

    expect(WorkOrder.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(assignRes.status).toHaveBeenCalledWith(200);
  });

  test('returns conflicts when reassignment or acceptance loses an optimistic-concurrency race', async () => {
    const workOrder = inProgressOrder({ status: 'accepted', startedAt: null, progressPercent: 0, progressStage: 'assigned' });
    WorkOrder.findOne.mockReturnValueOnce(queryFor(workOrder));
    User.findById.mockResolvedValue(replacementWorker);
    WorkOrder.findOneAndUpdate.mockResolvedValueOnce(null);
    const reassignRes = response();
    await reassignWorkOrder(requestFor(provider, {
      assigneeId: replacementWorker._id,
      reason: 'Concurrent handoff'
    }), reassignRes, jest.fn());
    expect(reassignRes.status).toHaveBeenCalledWith(409);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();

    const pendingAssignment = { ...oldAssignment, assignee: replacementWorker._id, status: 'pending' };
    WorkOrder.findOne.mockReturnValueOnce(queryFor(inProgressOrder({
      assignedTo: replacementWorker._id,
      assignmentState: 'pending',
      assignments: [pendingAssignment]
    })));
    WorkOrder.findOneAndUpdate.mockResolvedValueOnce(null);
    const acceptRes = response();
    await acceptWorkOrder(requestFor(replacementWorker), acceptRes, jest.fn());
    expect(acceptRes.status).toHaveBeenCalledWith(409);
  });

  test('does not report a committed reassignment as failed when notification persistence is unavailable', async () => {
    const workOrder = inProgressOrder({ status: 'accepted', startedAt: null, progressPercent: 0, progressStage: 'assigned' });
    WorkOrder.findOne.mockReturnValue(queryFor(workOrder));
    User.findById.mockResolvedValue(replacementWorker);
    WorkOrder.findOneAndUpdate.mockResolvedValue(inProgressOrder({
      ...workOrder,
      assignedTo: replacementWorker._id,
      assignmentState: 'accepted',
      version: 9
    }));
    mockIncidentAt('repair_assigned');
    createNotification.mockRejectedValue(new Error('notification store unavailable'));
    const res = response();

    await reassignWorkOrder(requestFor(provider, {
      assigneeId: replacementWorker._id,
      reason: 'Scheduled shift handoff'
    }), res, jest.fn());

    expect(logger.warn).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// Acceptance, progress and reassignment share the same original SLA, including
// warning acknowledgments. These real controller writes must leave it intact.
afterEach(() => {
  for (const [, update] of WorkOrder.findOneAndUpdate.mock.calls) {
    for (const fields of Object.values(update)) {
      for (const key of Object.keys(fields || {})) expect(key === 'sla' || key.startsWith('sla.')).toBe(false);
    }
  }
});


test.each(['suspended', 'deactivated', 'pending_activation'])('restricted worker %s cannot receive reassignment even with stale active flag', async accountStatus => {
  jest.clearAllMocks(); const order = inProgressOrder(); WorkOrder.findOne.mockReturnValue(queryFor(order));
  User.findById.mockResolvedValue({ ...replacementWorker, accountStatus }); const res = response();
  await reassignWorkOrder(requestFor(provider, { assigneeId: replacementWorker._id, reason: 'Staffing handoff', version: order.version }), res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(400); expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
});
test('stale reassignment and stale acceptance are rejected before writes', async () => {
  jest.clearAllMocks(); const order = inProgressOrder(); WorkOrder.findOne.mockReturnValue(queryFor(order)); const res = response();
  await reassignWorkOrder(requestFor(provider, { assigneeId: replacementWorker._id, reason: 'Staffing handoff', version: -1 }), res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(409); expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
  await acceptWorkOrder(requestFor(previousWorker, { version: -1 }), response(), jest.fn()); expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
});
test('a held incident claim blocks in-progress reassignment', async () => {
  jest.clearAllMocks(); const order = inProgressOrder(); WorkOrder.findOne.mockReturnValue(queryFor(order)); User.findById.mockResolvedValue(replacementWorker);
  Incident.findById.mockReturnValue(queryFor({ status: 'in_progress', inspectionMutation: { token: 'held-claim' } })); const res = response();
  await reassignWorkOrder(requestFor(provider, { assigneeId: replacementWorker._id, reason: 'Staffing handoff', version: order.version }), res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(409); expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
});
test('concurrent reassignments produce one current worker through work-order version CAS', async () => {
  jest.clearAllMocks(); let stored = inProgressOrder(); mockIncidentAt('in_progress');
  WorkOrder.findOne.mockImplementation(() => queryFor(structuredClone(stored))); User.findById.mockResolvedValue(replacementWorker);
  WorkOrder.findOneAndUpdate.mockImplementation(async (filter, update) => {
    if (stored.version !== filter.version || String(stored.currentAssignment) !== String(filter.currentAssignment)) return null;
    stored = { ...stored, ...update.$set, version: stored.version + 1, history: [...(stored.history || []), update.$push.history] }; return stored;
  });
  const body = { assigneeId: replacementWorker._id, reason: 'Emergency handoff', version: stored.version }; const first = response(); const second = response();
  await Promise.all([reassignWorkOrder(requestFor(provider, body), first, jest.fn()), reassignWorkOrder(requestFor(provider, body), second, jest.fn())]);
  expect([first.status.mock.calls.at(-1)[0], second.status.mock.calls.at(-1)[0]].sort()).toEqual([200, 409]);
  expect(stored.assignments.filter(item => item.active)).toHaveLength(1); expect(stored.progressPercent).toBe(50); expect(stored.sla.deadline).toEqual(deadline);
});
test('former worker cannot submit progress after replacement takes current assignment', async () => {
  jest.clearAllMocks(); const stored = inProgressOrder({ assignedTo: replacementWorker._id });
  WorkOrder.findOne.mockImplementation(filter => queryFor(String(filter.assignedTo) === String(stored.assignedTo) ? stored : null)); const res = response();
  await updateProgress(requestFor(previousWorker, { progressPercent: 75, stage: 'finishing', notes: 'Stale field update', version: stored.version }), res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(404); expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
});

test.each(['submitted', 'tanod_verified', 'clarification_required', 'closed'])('incident lifecycle %s cannot be activated through staffing', async status => {
  jest.clearAllMocks(); const order = inProgressOrder(); WorkOrder.findOne.mockReturnValue(queryFor(order)); User.findById.mockResolvedValue(replacementWorker);
  Incident.findById.mockReturnValue(queryFor({ status })); const res = response();
  await reassignWorkOrder(requestFor(provider, { assigneeId: replacementWorker._id, reason: 'Attempted handoff', version: order.version }), res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(409); expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
});
