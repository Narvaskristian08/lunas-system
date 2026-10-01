jest.mock('../models/WorkOrder', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn() }));
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
  sla: { deadline, startedAt: new Date('2026-09-27T00:00:00.000Z'), state: 'active' },
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

describe('in-progress repair-personnel reassignment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createNotification.mockResolvedValue(null);
    User.findByIdAndUpdate.mockResolvedValue(null);
  });

  test('creates one pending handoff while preserving progress, evidence, timestamps, history, and SLA', async () => {
    const workOrder = inProgressOrder();
    const replacementAssignment = {
      _id: '507f191e810c19729de861a2',
      assignee: replacementWorker._id,
      assignedBy: provider._id,
      status: 'pending',
      active: true
    };
    const updated = inProgressOrder({
      assignedTo: replacementWorker._id,
      currentAssignment: replacementAssignment._id,
      assignmentState: 'pending',
      assignments: [
        { ...oldAssignment, active: false, status: 'reassigned', endedReason: 'Emergency coverage change' },
        replacementAssignment
      ],
      version: 9
    });
    WorkOrder.findOne.mockReturnValue(queryFor(workOrder));
    User.findById.mockResolvedValue(replacementWorker);
    WorkOrder.findOneAndUpdate.mockResolvedValue(updated);
    mockIncidentAt('in_progress');
    const res = response();

    await reassignWorkOrder(requestFor(provider, {
      assigneeId: replacementWorker._id,
      reason: 'Emergency coverage change'
    }), res, jest.fn());

    const [condition, update] = WorkOrder.findOneAndUpdate.mock.calls[0];
    expect(condition).toEqual(expect.objectContaining({
      version: 8,
      currentAssignment: oldAssignment._id,
      assignments: { $elemMatch: { _id: oldAssignment._id, active: true } }
    }));
    expect(update.$set).toEqual(expect.objectContaining({
      status: 'in_progress',
      assignmentState: 'pending',
      assignedTo: replacementWorker._id
    }));
    expect(update.$set.assignments.filter((entry) => entry.active)).toHaveLength(1);
    expect(update.$set.assignments[0]).toEqual(expect.objectContaining({
      assignee: previousWorker._id,
      active: false,
      status: 'reassigned',
      endedReason: 'Emergency coverage change'
    }));
    expect(update.$set).not.toHaveProperty('progressPercent');
    expect(update.$set).not.toHaveProperty('progressUpdates');
    expect(update.$set).not.toHaveProperty('repairEvidence');
    expect(update.$set).not.toHaveProperty('startedAt');
    expect(update.$set).not.toHaveProperty('sla');
    expect(update.$push.history.metadata).toEqual(expect.objectContaining({
      assigneeId: replacementWorker._id,
      previousAssigneeId: previousWorker._id,
      reason: 'Emergency coverage change'
    }));
    expect(updated.progressUpdates).toStrictEqual(workOrder.progressUpdates);
    expect(updated.repairEvidence).toStrictEqual(workOrder.repairEvidence);
    expect(updated.sla.deadline).toBe(deadline);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(replacementWorker._id, { availability: 'assigned' });
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(previousWorker._id, { availability: 'available' });
    expect(createNotification).toHaveBeenCalledTimes(2);
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipient: replacementWorker._id,
      type: 'work_order_assigned',
      data: expect.objectContaining({
        incidentId: workOrder.incident,
        workOrderId: workOrder._id
      })
    }));
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipient: previousWorker._id,
      type: 'work_order_reassigned'
    }));
    expect(res.status).toHaveBeenCalledWith(200);
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
    expect(update.$push.repairEvidence).toEqual({ $each: [] });
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
    const workOrder = inProgressOrder();
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

  test('allows an in-progress handoff decline and a later reasoned reassignment', async () => {
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

    expect(WorkOrder.findOneAndUpdate.mock.calls[1][0]).toEqual(expect.objectContaining({
      version: 9,
      currentAssignment: null,
      assignmentState: 'declined',
      assignments: { $not: { $elemMatch: { active: true } } }
    }));
    expect(WorkOrder.findOneAndUpdate.mock.calls[1][1].$set).toEqual(expect.objectContaining({
      status: 'in_progress',
      assignmentState: 'pending',
      assignedTo: nextWorker._id
    }));
    expect(WorkOrder.findOneAndUpdate.mock.calls[1][1].$push.history.metadata).toEqual(expect.objectContaining({
      previousAssignmentId: pendingAssignment._id,
      previousAssigneeId: replacementWorker._id,
      reason: 'Assign a crew with the required equipment'
    }));
    expect(assignRes.status).toHaveBeenCalledWith(200);
  });

  test('returns conflicts when reassignment or acceptance loses an optimistic-concurrency race', async () => {
    const workOrder = inProgressOrder();
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
    const workOrder = inProgressOrder();
    WorkOrder.findOne.mockReturnValue(queryFor(workOrder));
    User.findById.mockResolvedValue(replacementWorker);
    WorkOrder.findOneAndUpdate.mockResolvedValue(inProgressOrder({
      assignedTo: replacementWorker._id,
      assignmentState: 'pending',
      version: 9
    }));
    mockIncidentAt('in_progress');
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
