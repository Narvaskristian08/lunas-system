jest.mock('../models/WorkOrder', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));
jest.mock('../models/Incident', () => ({
  findById: jest.fn(),
  findOneAndUpdate: jest.fn()
}));
jest.mock('../models/User', () => ({ findByIdAndUpdate: jest.fn() }));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(null),
  notificationTemplates: {}
}));
jest.mock('../services/evidenceService', () => ({
  processAndUploadRepairEvidence: jest.fn(),
  cleanupEvidence: jest.fn()
}));
jest.mock('../services/storageService', () => ({ getEvidenceUrl: jest.fn() }));

const WorkOrder = require('../models/WorkOrder');
const Incident = require('../models/Incident');
const { createAuditLog } = require('../utils/auditLogger');
const { createWorkOrder } = require('./workOrderController');

const response = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('75% work-order creation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates an unassigned 0% primary work order from a validated routed incident', async () => {
    const incident = {
      _id: '507f191e810c19729de860b1',
      status: 'validated',
      priority: 'high',
      routing: {
        responsibleOrganization: 'City Engineering',
        responsibleRole: 'city_engineering'
      },
      jurisdiction: { barangay: 'Poblacion Oeste', city: 'Dagupan City' },
      sla: {
        targetResolutionTime: 72,
        startedAt: new Date('2026-08-19T00:00:00.000Z'),
        deadline: new Date('2026-08-22T00:00:00.000Z')
      }
    };
    const workOrder = {
      _id: '507f191e810c19729de860d1',
      orderNumber: 'WO-202608-000001',
      incident: incident._id,
      responsibleOrganization: 'City Engineering',
      responsibleRole: 'city_engineering',
      jurisdiction: incident.jurisdiction,
      priority: 'high',
      createdBy: '507f191e810c19729de860a1',
      status: 'pending',
      assignmentState: 'unassigned',
      progressPercent: 0,
      progressStage: 'assigned',
      assignments: [],
      history: [],
      sla: { deadline: incident.sla.deadline }
    };
    Incident.findById.mockResolvedValue(incident);
    WorkOrder.findOne.mockResolvedValue(null);
    WorkOrder.create.mockResolvedValue(workOrder);
    Incident.findOneAndUpdate.mockResolvedValue({ ...incident, workOrder: workOrder._id });
    const req = {
      params: { id: incident._id },
      body: { instructions: 'Repair pothole safely.' },
      user: { _id: '507f191e810c19729de860a1', role: 'city_engineer' },
      headers: {},
      ip: '127.0.0.1'
    };
    const res = response();

    await createWorkOrder(req, res, jest.fn());

    expect(WorkOrder.create).toHaveBeenCalledWith(expect.objectContaining({
      incident: incident._id,
      status: 'pending',
      assignmentState: 'unassigned',
      progressPercent: 0,
      progressStage: 'assigned',
      responsibleOrganization: 'City Engineering'
    }));
    expect(Incident.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: incident._id, status: 'validated' }),
      expect.objectContaining({ $set: expect.objectContaining({ workOrder: workOrder._id }) }),
      { new: true }
    );
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'work_order_created' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('does not create a work order if a primary work order already exists', async () => {
    const incident = {
      _id: '507f191e810c19729de860b1',
      status: 'validated',
      routing: { responsibleOrganization: 'City Engineering', responsibleRole: 'city_engineering' },
      jurisdiction: { barangay: 'Poblacion Oeste' }
    };
    Incident.findById.mockResolvedValue(incident);
    WorkOrder.findOne.mockResolvedValue({ _id: '507f191e810c19729de860d1' });
    const req = {
      params: { id: incident._id },
      body: {},
      user: { _id: '507f191e810c19729de860a1', role: 'city_engineer' }
    };
    const res = response();

    await createWorkOrder(req, res, jest.fn());

    expect(WorkOrder.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });
});
