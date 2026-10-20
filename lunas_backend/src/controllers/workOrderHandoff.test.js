jest.mock('../models/WorkOrder', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn(), countDocuments: jest.fn().mockResolvedValue(0) }));
jest.mock('../models/Incident', () => ({ findOne: jest.fn(), findById: jest.fn(), findOneAndUpdate: jest.fn(), updateOne: jest.fn() }));
jest.mock('../models/User', () => ({ find: jest.fn(), findByIdAndUpdate: jest.fn() }));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(null),
  notificationTemplates: {}
}));
jest.mock('../services/evidenceService', () => ({ processAndUploadRepairEvidence: jest.fn(), cleanupEvidence: jest.fn() }));
jest.mock('../services/storageService', () => ({ getEvidenceUrl: jest.fn() }));

const WorkOrder = require('../models/WorkOrder');
const Incident = require('../models/Incident');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const {
  coordinateCityCorrection,
  reviewCompletedWork,
  getWorkOrderSLA
} = require('./workOrderController');

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

const workOrderFixture = (status, overrides = {}) => ({
  _id: '507f191e810c19729de860d1',
  orderNumber: 'WO-202608-000001',
  incident: '507f191e810c19729de860b1',
  responsibleOrganization: 'Dagupan Water District',
  responsibleRole: 'utility_provider',
  jurisdiction: { barangay: 'Poblacion Oeste', city: 'Dagupan City' },
  assignedTo: '507f191e810c19729de860a4',
  assignmentState: 'accepted',
  status,
  progressPercent: 100,
  progressStage: 'ready_for_completion',
  version: 2,
  history: [],
  assignments: [],
  reviews: [],
  sla: { startedAt: new Date('2026-10-01T00:00:00Z'), deadline: new Date('2026-10-04T00:00:00Z'), state: 'active' },
  actualCompletionTime: new Date('2026-10-02T00:00:00Z'),
  ...overrides
});

describe('Responsible-provider completion handoffs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.find.mockReturnValue(queryFor([]));
  });

  test('Utility Provider correction request returns completed work to Repair Personnel with a reason', async () => {
    const workOrder = workOrderFixture('completed');
    WorkOrder.findOne.mockReturnValue(queryFor(workOrder));
    WorkOrder.findOneAndUpdate.mockResolvedValue(workOrderFixture('rework_required'));
    Incident.findOne.mockResolvedValue({ status: 'provider_review' });
    Incident.updateOne.mockResolvedValue({ modifiedCount: 1 });
    Incident.findById.mockReturnValue(queryFor({ status: 'provider_review' }));
    Incident.findOneAndUpdate.mockResolvedValue({ _id: workOrder.incident, status: 'rework_required' });
    const res = response();

    await reviewCompletedWork({
      params: { id: workOrder._id },
      user: { _id: 'provider-1', role: 'utility_provider', utilityCompany: 'Dagupan Water District' },
      body: { decision: 'request_correction', reason: 'The leak is still visible after the repair.' },
      headers: {},
      ip: '127.0.0.1'
    }, res, jest.fn());

    expect(WorkOrder.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' }),
      expect.objectContaining({ $set: expect.objectContaining({ status: 'rework_required' }) }),
      { new: true }
    );
    expect(Incident.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'provider_review' }),
      expect.objectContaining({ $set: expect.objectContaining({ status: 'rework_required' }) }),
      expect.objectContaining({ new: true })
    );
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipient: workOrder.assignedTo,
      title: 'Corrective work requested',
      data: expect.objectContaining({
        incidentId: workOrder.incident,
        workOrderId: workOrder._id
      })
    }));
    expect(WorkOrder.findOneAndUpdate.mock.calls[0][1].$set).not.toHaveProperty('sla');
    expect(WorkOrder.findOneAndUpdate.mock.calls[0][1].$set).not.toHaveProperty('sla.deadline');
    expect(WorkOrder.findOneAndUpdate.mock.calls[0][1].$set).not.toHaveProperty('sla.state');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Utility Provider coordinates a City correction to the current Repair Personnel', async () => {
    const workOrder = workOrderFixture('city_correction_required');
    const updated = workOrderFixture('rework_required');
    WorkOrder.findOne.mockReturnValue(queryFor(workOrder));
    WorkOrder.findOneAndUpdate.mockResolvedValue(updated);
    Incident.findById.mockReturnValue(queryFor({ status: 'city_correction_required' }));
    Incident.findOneAndUpdate.mockResolvedValue({
      _id: workOrder.incident,
      status: 'rework_required'
    });
    User.findByIdAndUpdate.mockResolvedValue(null);
    const res = response();

    await coordinateCityCorrection({
      params: { id: workOrder._id },
      user: {
        _id: 'provider-1',
        role: 'utility_provider',
        utilityCompany: 'Dagupan Water District'
      },
      body: { instructions: 'Replace the failed seal and upload new evidence.' },
      headers: {},
      ip: '127.0.0.1'
    }, res, jest.fn());

    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipient: workOrder.assignedTo,
      title: 'City Engineering requested corrective work',
      data: expect.objectContaining({
        incidentId: workOrder.incident,
        workOrderId: workOrder._id
      })
    }));
    expect(WorkOrder.findOneAndUpdate.mock.calls[0][1].$set).not.toHaveProperty('sla');
    expect(WorkOrder.findOneAndUpdate.mock.calls[0][1].$set).not.toHaveProperty('sla.deadline');
    expect(WorkOrder.findOneAndUpdate.mock.calls[0][1].$set).not.toHaveProperty('sla.state');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Utility Provider approval cannot exercise unresolved closure authority', async () => {
    const workOrder = workOrderFixture('completed');
    WorkOrder.findOne.mockReturnValue(queryFor(workOrder));
    WorkOrder.findOneAndUpdate.mockResolvedValue(workOrderFixture('verified'));
    Incident.findOne.mockResolvedValue({ status: 'provider_review' });
    Incident.updateOne.mockResolvedValue({ modifiedCount: 1 });
    Incident.findById.mockReturnValue(queryFor({ status: 'provider_review' }));
    Incident.findOneAndUpdate.mockResolvedValue({
      _id: workOrder.incident,
      status: 'closed',
      reporter: 'citizen-1',
      assignedUtility: 'provider-1'
    });
    const res = response();

    await reviewCompletedWork({
      params: { id: workOrder._id },
      user: { _id: 'provider-1', role: 'utility_provider', utilityCompany: 'Dagupan Water District' },
      body: { decision: 'accepted' },
      headers: {},
      ip: '127.0.0.1'
    }, res, jest.fn());

    expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test.each([['2026-10-03T00:00:00Z', 'met'], ['2026-10-05T00:00:00Z', 'breached']])('Provider closure at %s leaves the historical %s SLA outcome untouched', async (time, _outcome) => {
    jest.useFakeTimers().setSystemTime(new Date(time));
    const workOrder = workOrderFixture('completed', {
      incident: { _id: '507f191e810c19729de860b1', reportNumber: 'LUNAS-202608-000001' }
    });
    WorkOrder.findOne.mockReturnValue(queryFor(workOrder));
    WorkOrder.findOneAndUpdate.mockResolvedValue(workOrderFixture('verified', { incident: workOrder.incident }));
    Incident.findOne.mockResolvedValue({ status: 'provider_review' });
    Incident.updateOne.mockResolvedValue({ modifiedCount: 1 });
    Incident.findById.mockReturnValue(queryFor({ status: 'provider_review' }));
    Incident.findOneAndUpdate.mockResolvedValue({
      _id: '507f191e810c19729de860b1',
      status: 'closed',
      reportNumber: 'LUNAS-202608-000001',
      reporter: 'citizen-1'
    });
    const res = response();

    await reviewCompletedWork({
      params: { id: workOrder._id },
      user: { _id: 'provider-1', role: 'utility_provider', utilityCompany: 'Dagupan Water District' },
      body: { decision: 'accepted' },
      headers: {},
      ip: '127.0.0.1'
    }, res, jest.fn());

    expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
    expect(workOrder.actualCompletionTime).toEqual(new Date('2026-10-02T00:00:00Z'));
    expect(res.status).toHaveBeenCalledWith(409);
    jest.useRealTimers();
  });
});


test('work-order SLA API preserves a breached terminal outcome instead of forcing met', async () => {
  const workOrder = workOrderFixture('verified', {
    sla: { deadline: new Date('2026-10-01T00:00:00Z'), closedAt: new Date('2026-10-02T00:00:00Z'), state: 'breached' }
  });
  WorkOrder.findOne.mockReturnValue(queryFor(workOrder));
  const res = response();
  const next = jest.fn();
  await getWorkOrderSLA({ params: { id: workOrder._id }, user: { role: 'utility_provider', utilityCompany: 'Dagupan Water District' } }, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(res.json.mock.calls[0][0].data).toMatchObject({ state: 'breached', isOverdue: false, isApproaching: false });
});


test('a different provider cannot verify another organization repair', async () => {
  jest.clearAllMocks();
  WorkOrder.findOne.mockReturnValue(queryFor(workOrderFixture('completed')));
  const res = response();
  await reviewCompletedWork({ params: { id: 'work-order' },
    user: { role: 'utility_provider', utilityCompany: 'Different organization' },
    body: { decision: 'accepted' } }, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(404);
  expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
});
