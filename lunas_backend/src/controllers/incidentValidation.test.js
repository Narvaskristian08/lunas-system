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
  confirmIncident,
  requestIncidentClarification,
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

const barangayOfficial = {
  _id: '507f191e810c19729de860a1',
  role: 'barangay_official',
  barangay: 'Poblacion Oeste'
};
const cityEngineer = { _id: '507f191e810c19729de860a2', role: 'city_engineer' };
const submitted = {
  _id: '507f191e810c19729de860b1',
  reporter: { _id: '507f191e810c19729de860c1', firstName: 'Ana', lastName: 'Citizen' },
  reportNumber: 'LUNAS-202608-000001',
  status: 'submitted',
  priority: undefined,
  category: 'road',
  description: 'A large pothole is causing a hazard for motorists.',
  location: { address: { barangay: 'Poblacion Oeste', city: 'Dagupan City' }, coordinates: [120.34, 16.04] },
  images: [],
  duplicateCandidates: [],
  duplicateDetection: { candidateCount: 0 },
  statusHistory: []
};

describe('sequential incident review workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.find.mockReturnValue(queryFor([]));
  });

  test('Barangay validation records the reviewer and forwards without assigning priority or SLA', async () => {
    const updated = {
      ...submitted,
      status: 'barangay_validated',
      validatedBy: barangayOfficial._id,
      validatedAt: new Date(),
      jurisdiction: {
        barangay: 'Poblacion Oeste',
        city: 'Dagupan City',
        confirmedBy: barangayOfficial._id,
        confirmedAt: new Date()
      },
      statusHistory: [{ status: 'barangay_validated', changedAt: new Date() }]
    };
    Incident.findOne
      .mockReturnValueOnce(queryFor(submitted))
      .mockReturnValueOnce(queryFor(submitted));
    Incident.findOneAndUpdate.mockReturnValue(queryFor(updated));
    const req = {
      params: { id: submitted._id },
      user: barangayOfficial,
      body: { notes: 'Evidence and location reviewed' },
      headers: {},
      ip: '127.0.0.1'
    };
    const res = response();

    await validateIncident(req, res, jest.fn());

    expect(Incident.findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        $set: expect.objectContaining({ status: 'barangay_validated', validatedBy: barangayOfficial._id }),
        $push: expect.objectContaining({ statusHistory: expect.objectContaining({ status: 'barangay_validated' }) })
      }),
      expect.objectContaining({ new: true })
    );
    const update = Incident.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set).not.toHaveProperty('priority');
    expect(update.$set).not.toHaveProperty('sla');
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'incident_barangay_validated' }));
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipient: submitted.reporter,
      type: 'incident_validated'
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('City Engineering can confirm only a barangay-validated incident', async () => {
    const barangayValidated = { ...submitted, status: 'barangay_validated' };
    const updated = { ...barangayValidated, status: 'city_confirmed' };
    Incident.findOne.mockReturnValueOnce(queryFor(barangayValidated));
    Incident.findOneAndUpdate.mockReturnValue(queryFor(updated));
    const res = response();

    await confirmIncident({
      params: { id: submitted._id },
      user: cityEngineer,
      body: {},
      headers: {},
      ip: '127.0.0.1'
    }, res, jest.fn());

    expect(Incident.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: submitted._id, status: 'barangay_validated' },
      expect.objectContaining({
        $set: expect.objectContaining({ status: 'city_confirmed', cityConfirmedBy: cityEngineer._id })
      }),
      expect.objectContaining({ new: true, runValidators: true })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('City Engineering cannot confirm an unrecognized legacy jurisdiction', async () => {
    const legacy = {
      ...submitted,
      status: 'barangay_validated',
      location: { ...submitted.location, address: { barangay: 'Poblacion West' } }
    };
    Incident.findOne.mockReturnValueOnce(queryFor(legacy));
    const res = response();

    await confirmIncident({
      params: { id: legacy._id },
      user: cityEngineer,
      body: {}
    }, res, jest.fn());

    expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('recognized Dagupan barangay')
    }));
  });

  test('City Engineering clarification requires a reason and returns the report to Barangay review', async () => {
    const req = {
      params: { id: submitted._id },
      user: cityEngineer,
      body: { reason: 'Please confirm the exact street location.' },
      headers: {},
      ip: '127.0.0.1'
    };
    const validated = { ...submitted, status: 'barangay_validated' };
    Incident.findOne.mockReturnValueOnce(queryFor(validated));
    Incident.findOneAndUpdate.mockReturnValue(queryFor({ ...validated, status: 'clarification_required' }));
    const res = response();

    await requestIncidentClarification(req, res, jest.fn());

    expect(Incident.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: submitted._id, status: 'barangay_validated' },
      expect.objectContaining({ $set: expect.objectContaining({ status: 'clarification_required' }) }),
      expect.objectContaining({ new: true })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('requires a real rejection reason before reading or changing the report', async () => {
    const req = { params: { id: submitted._id }, user: barangayOfficial, body: { reason: '   ' } };
    const res = response();
    await rejectIncident(req, res, jest.fn());
    expect(Incident.findOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('rejection cancels SLA monitoring without deleting audit dates', async () => {
    Incident.findOne.mockReturnValue(queryFor(submitted));
    Incident.findOneAndUpdate.mockReturnValue(queryFor({ ...submitted, status: 'rejected', sla: { state: 'cancelled' } }));
    const res = response();
    const next = jest.fn();
    await rejectIncident({ params: { id: submitted._id }, user: barangayOfficial,
      body: { reason: 'Outside report scope' }, headers: {} }, res, next);
    expect(next).not.toHaveBeenCalled();
    const fields = Incident.findOneAndUpdate.mock.calls[0][1].$set;
    expect(fields).toMatchObject({ 'sla.state': 'cancelled', 'sla.isOverdue': false });
    expect(fields).not.toHaveProperty('sla.deadline');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('marking a duplicate cancels SLA monitoring and retains the canonical relationship', async () => {
    const canonical = { _id: '507f191e810c19729de860b2', reportNumber: 'LUNAS-CANONICAL', status: 'submitted' };
    Incident.findOne.mockReturnValueOnce(queryFor(submitted))
      .mockReturnValueOnce(queryFor(canonical)).mockReturnValueOnce(queryFor(submitted));
    Incident.findOneAndUpdate.mockReturnValue(queryFor({ ...submitted, status: 'duplicate', sla: { state: 'cancelled' } }));
    const res = response();
    const next = jest.fn();
    await markDuplicateIncident({ params: { id: submitted._id }, user: barangayOfficial,
      body: { duplicateOf: canonical._id, reason: 'Same defect and location' }, headers: {} }, res, next);
    expect(next).not.toHaveBeenCalled();
    const fields = Incident.findOneAndUpdate.mock.calls[0][1].$set;
    expect(fields).toMatchObject({ duplicateOf: canonical._id, 'sla.state': 'cancelled', 'sla.isOverdue': false });
    expect(fields).not.toHaveProperty('sla.deadline');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('prevents a duplicate report from referencing itself', async () => {
    Incident.findOne.mockReturnValueOnce(queryFor(submitted));
    const req = {
      params: { id: submitted._id },
      user: barangayOfficial,
      body: { duplicateOf: submitted._id, reason: 'Same location and evidence' }
    };
    const res = response();
    await markDuplicateIncident(req, res, jest.fn());
    expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });


test('City Engineering can list confirmed and prioritized incidents awaiting routing', async () => {
  Incident.find.mockReturnValue(queryFor([]));
  Incident.countDocuments.mockResolvedValue(0);
  const res = response();
  const next = jest.fn();
  await getPendingValidation({ query: { stage: 'confirmed' }, user: { role: 'city_engineer' } }, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(Incident.find).toHaveBeenCalledWith(expect.objectContaining({
    status: { $in: ['city_confirmed', 'prioritized'] }
  }));
});

  test('returns submitted and clarification-required records only from the assigned barangay queue', async () => {
    Incident.find.mockReturnValue(queryFor([submitted]));
    Incident.countDocuments.mockResolvedValue(1);
    const res = response();
    await getPendingValidation({ query: {}, user: barangayOfficial }, res, jest.fn());
    expect(Incident.find).toHaveBeenCalledWith(expect.objectContaining({
      $and: expect.arrayContaining([expect.objectContaining({
        status: { $in: ['submitted', 'clarification_required'] }
      })])
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      pagination: expect.objectContaining({ total: 1 })
    }));
  });

  test('does not allow the generic update endpoint to bypass a controlled status transition', async () => {
    const req = {
      params: { id: submitted._id },
      user: cityEngineer,
      body: { status: 'barangay_validated', notes: 'Attempted bypass' }
    };
    const res = response();

    await updateIncident(req, res, jest.fn());

    expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
