jest.mock('../models/Incident', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../models/User', () => ({ find: jest.fn() }));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(null),
  notificationTemplates: {
    incidentValidated: jest.fn((reportNumber) => ({
      type: 'incident_validated',
      title: 'Report Validated',
      message: `${reportNumber} validated`
    })),
    incidentRejected: jest.fn((reportNumber, reason) => ({
      type: 'incident_rejected',
      title: 'Report Rejected',
      message: `${reportNumber}: ${reason}`
    })),
    incidentDuplicate: jest.fn((reportNumber, reason) => ({
      type: 'duplicate_detected',
      title: 'Report marked duplicate',
      message: `${reportNumber}: ${reason}`
    }))
  }
}));
jest.mock('../services/duplicateDetectionService', () => ({ findPossibleDuplicateCandidates: jest.fn() }));
jest.mock('../services/evidenceService', () => ({
  cleanupEvidence: jest.fn(),
  getUploadedEvidenceFiles: jest.fn(),
  processAndUploadEvidence: jest.fn()
}));
jest.mock('../services/storageService', () => ({ getEvidenceUrl: jest.fn() }));
jest.mock('../services/slaService', () => ({
  initializeIncidentSLA: jest.fn((priority, startedAt) => ({
    targetResolutionTime: priority === 'high' ? 72 : 168,
    startedAt,
    deadline: new Date(startedAt.getTime() + 72 * 60 * 60 * 1000),
    state: 'active',
    isOverdue: false
  }))
}));

const Incident = require('../models/Incident');
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const { createNotification } = require('../services/notificationService');
const {
  validateIncident,
  rejectIncident,
  markDuplicateIncident,
  getPendingValidation,
  updateIncident
} = require('./incidentController');

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
    sort: jest.fn(),
    limit: jest.fn(),
    skip: jest.fn()
  };
  Object.values(query).forEach((fn) => fn.mockReturnValue(query));
  query.then = (resolve, reject) => Promise.resolve(value).then(resolve, reject);
  return query;
};

const official = { _id: '507f191e810c19729de860a1', role: 'city_engineer' };
const submitted = {
  _id: '507f191e810c19729de860b1',
  reporter: { _id: '507f191e810c19729de860c1', firstName: 'Ana', lastName: 'Citizen' },
  reportNumber: 'LUNAS-202608-000001',
  status: 'submitted',
  priority: 'medium',
  category: 'road',
  description: 'A large pothole is causing a hazard for motorists.',
  location: { address: { barangay: 'Poblacion Oeste', city: 'Dagupan City' }, coordinates: [120.34, 16.04] },
  images: [],
  duplicateCandidates: [],
  duplicateDetection: { candidateCount: 0 },
  statusHistory: []
};

describe('50% official validation workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.find.mockReturnValue(queryFor([]));
  });

  test('validates a submitted report atomically with priority, route, SLA, audit, and notification', async () => {
    const updated = {
      ...submitted,
      status: 'validated',
      priority: 'high',
      validatedBy: official._id,
      validatedAt: new Date(),
      jurisdiction: { barangay: 'Poblacion Oeste', city: 'Dagupan City', responsibility: 'city_engineering' },
      routing: { responsibleOrganization: 'City Engineering', responsibleRole: 'city_engineering', history: [] },
      sla: { targetResolutionTime: 72, state: 'active', deadline: new Date() },
      statusHistory: [{ status: 'validated', changedAt: new Date() }]
    };
    Incident.findOne
      .mockReturnValueOnce(queryFor(submitted))
      .mockReturnValueOnce(queryFor(submitted));
    Incident.findOneAndUpdate.mockReturnValue(queryFor(updated));
    const req = {
      params: { id: submitted._id },
      user: official,
      body: {
        priority: 'high',
        jurisdiction: { barangay: 'Poblacion Oeste', responsibility: 'city_engineering' },
        routing: { responsibleOrganization: 'City Engineering', responsibleRole: 'city_engineering' }
      },
      headers: {},
      ip: '127.0.0.1'
    };
    const res = response();
    const next = jest.fn();

    await validateIncident(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(Incident.findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        $set: expect.objectContaining({ status: 'validated', priority: 'high' }),
        $push: expect.objectContaining({ statusHistory: expect.objectContaining({ status: 'validated' }) })
      }),
      expect.objectContaining({ new: true })
    );
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'incident_validated' }));
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipient: submitted.reporter,
      type: 'incident_validated'
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('requires a real rejection reason before reading or changing the report', async () => {
    const req = { params: { id: submitted._id }, user: official, body: { reason: '   ' } };
    const res = response();
    await rejectIncident(req, res, jest.fn());
    expect(Incident.findOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('prevents a duplicate report from referencing itself', async () => {
    Incident.findOne.mockReturnValueOnce(queryFor(submitted));
    const req = {
      params: { id: submitted._id },
      user: official,
      body: { duplicateOf: submitted._id, reason: 'Same location and evidence' }
    };
    const res = response();
    await markDuplicateIncident(req, res, jest.fn());
    expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns only submitted records from the server-side validation queue', async () => {
    const queue = queryFor([submitted]);
    Incident.find.mockReturnValue(queue);
    Incident.countDocuments.mockResolvedValue(1);
    const req = { query: {}, user: official };
    const res = response();
    await getPendingValidation(req, res, jest.fn());
    expect(Incident.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'submitted' }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      pagination: expect.objectContaining({ total: 1 })
    }));
  });

  test('returns a conflict when another official already made the submitted-state decision', async () => {
    Incident.findOne
      .mockReturnValueOnce(queryFor(submitted))
      .mockReturnValueOnce(queryFor(submitted));
    Incident.findOneAndUpdate.mockReturnValue(queryFor(null));
    const req = {
      params: { id: submitted._id },
      user: official,
      body: {
        priority: 'high',
        jurisdiction: { barangay: 'Poblacion Oeste', responsibility: 'city_engineering' },
        routing: { responsibleOrganization: 'City Engineering', responsibleRole: 'city_engineering' }
      },
      headers: {},
      ip: '127.0.0.1'
    };
    const res = response();

    await validateIncident(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(createAuditLog).not.toHaveBeenCalled();
  });

  test('does not allow the generic update endpoint to bypass a controlled status transition', async () => {
    const req = {
      params: { id: submitted._id },
      user: official,
      body: { status: 'validated', notes: 'Attempted bypass' }
    };
    const res = response();

    await updateIncident(req, res, jest.fn());

    expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
