jest.mock('../models/WorkOrder', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../models/Incident', () => ({ findById: jest.fn(), findOneAndUpdate: jest.fn() }));
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
  finalReviewWorkOrder
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
  ...overrides
});

describe('Utility Provider and City Engineering completion handoffs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.find.mockReturnValue(queryFor([]));
  });

  test('Utility Provider correction request returns completed work to Repair Personnel with a reason', async () => {
    const workOrder = workOrderFixture('completed');
    WorkOrder.findOne.mockReturnValue(queryFor(workOrder));
    WorkOrder.findOneAndUpdate.mockResolvedValue(workOrderFixture('rework_required'));
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
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Utility Provider acceptance forwards work into City Engineering verification', async () => {
    const workOrder = workOrderFixture('completed');
    WorkOrder.findOne.mockReturnValue(queryFor(workOrder));
    WorkOrder.findOneAndUpdate.mockResolvedValue(workOrderFixture('provider_accepted'));
    Incident.findById.mockReturnValue(queryFor({ status: 'provider_review' }));
    Incident.findOneAndUpdate.mockResolvedValue({
      _id: workOrder.incident,
      status: 'city_verification',
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

    const incidentUpdate = Incident.findOneAndUpdate.mock.calls[0][1];
    expect(incidentUpdate.$push.statusHistory.$each.map((entry) => entry.status))
      .toEqual(['provider_accepted', 'city_verification']);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Completion accepted and forwarded to City Engineering'
    }));
  });

  test('City Engineer final approval records verification, resolution, and closure before notifying Citizen', async () => {
    const workOrder = workOrderFixture('provider_accepted', {
      incident: { _id: '507f191e810c19729de860b1', reportNumber: 'LUNAS-202608-000001' }
    });
    WorkOrder.findOne.mockReturnValue(queryFor(workOrder));
    WorkOrder.findOneAndUpdate.mockResolvedValue(workOrderFixture('verified', { incident: workOrder.incident }));
    Incident.findById.mockReturnValue(queryFor({ status: 'city_verification' }));
    Incident.findOneAndUpdate.mockResolvedValue({
      _id: '507f191e810c19729de860b1',
      status: 'closed',
      reportNumber: 'LUNAS-202608-000001',
      reporter: 'citizen-1'
    });
    const res = response();

    await finalReviewWorkOrder({
      params: { id: workOrder._id },
      user: { _id: 'engineer-1', role: 'city_engineer' },
      body: { decision: 'approved' },
      headers: {},
      ip: '127.0.0.1'
    }, res, jest.fn());

    const incidentUpdate = Incident.findOneAndUpdate.mock.calls[0][1];
    expect(incidentUpdate.$set).toEqual(expect.objectContaining({
      status: 'closed',
      finalVerifiedBy: 'engineer-1'
    }));
    expect(incidentUpdate.$push.statusHistory.$each.map((entry) => entry.status))
      .toEqual(['verified', 'resolved', 'closed']);
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipient: 'citizen-1',
      title: 'Your report has been resolved'
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
