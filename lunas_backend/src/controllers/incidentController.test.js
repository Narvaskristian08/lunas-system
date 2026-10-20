jest.mock('../models/WorkOrder', () => ({ create: jest.fn(), deleteOne: jest.fn() }));
jest.mock('../models/User', () => ({ findOne: jest.fn(), find: jest.fn() }));
jest.mock('../models/Incident', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../services/duplicateDetectionService', () => ({
  findPossibleDuplicateCandidates: jest.fn().mockResolvedValue([])
}));
jest.mock('../services/evidenceService', () => ({
  cleanupEvidence: jest.fn().mockResolvedValue(),
  getUploadedEvidenceFiles: jest.fn().mockReturnValue([]),
  processAndUploadEvidence: jest.fn()
}));
jest.mock('../services/storageService', () => ({ getEvidenceUrl: jest.fn() }));
jest.mock('../services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(null),
  notificationTemplates: {
    incidentSubmitted: jest.fn((reportNumber) => ({
      type: 'incident_submitted',
      title: 'Report Submitted',
      message: `Report ${reportNumber} submitted`
    }))
  }
}));

const Incident = require('../models/Incident');
const { createAuditLog } = require('../utils/auditLogger');
const { findPossibleDuplicateCandidates } = require('../services/duplicateDetectionService');
const evidenceService = require('../services/evidenceService');
const {
  createIncident,
  getBarangays,
  getIncident,
  getIncidentHistory,
  getMyIncidents,
  serializeIncidentForCitizen,
  serializeIncidentForOfficial,
  updateIncidentPriority,
  getIncidentSLA
} = require('./incidentController');

const createResponse = () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
};

test('historical evidence and recorded privacy fields remain readable without exposing private keys', async () => {
  const incident = { _id: 'historical', status: 'submitted', images: [
    { url: 'https://legacy.example/evidence.jpg', isPrivacyMasked: true,
      privacyProcessing: { status: 'applied', applied: true, acknowledgedByReporter: true } }
  ] };
  const result = await serializeIncidentForCitizen(incident);
  expect(result.images[0]).toMatchObject({ url: 'https://legacy.example/evidence.jpg',
    isPrivacyMasked: true, privacyProcessing: { status: 'applied', applied: true } });
  expect(result.images[0]).not.toHaveProperty('key');
});

describe('citizen incident reporting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blocks a reporter before duplicate detection or evidence processing', async () => {
    const req = {
      body: {
        category: 'road',
        description: 'A large pothole is causing a hazard for motorists.',
        location: {
          coordinates: ['120.3387', '16.0433'],
          address: { barangay: 'Pantal', city: 'Dagupan City' }
        }
      },
      files: {},
      user: {
        _id: '507f191e810c19729de860aa',
        role: 'citizen',
        reportingRestriction: {
          status: 'blocked',
          confirmedFindings: 3,
          threshold: 3,
          appealStatus: 'none'
        }
      },
      headers: {}
    };
    const response = createResponse();

    await createIncident(req, response, jest.fn());

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'REPORTING_BLOCKED',
      data: { reportingRestriction: expect.objectContaining({ confirmedFindings: 3, threshold: 3 }) }
    }));
    expect(findPossibleDuplicateCandidates).not.toHaveBeenCalled();
    expect(evidenceService.processAndUploadEvidence).not.toHaveBeenCalled();
    expect(Incident.create).not.toHaveBeenCalled();
  });

  test('creates a submitted, owned report and ignores citizen-provided priority', async () => {
    const possibleDuplicate = {
      incident: '507f191e810c19729de860eb',
      reportNumber: 'LUNAS-202608-000001',
      distanceMeters: 24,
      score: 91
    };
    findPossibleDuplicateCandidates.mockResolvedValue([possibleDuplicate]);

    let payload;
    Incident.create.mockImplementation(async (document) => {
      payload = document;
      return {
        ...document,
        _id: '507f191e810c19729de860ea',
        reportNumber: 'LUNAS-202608-000002',
        createdAt: new Date('2026-08-11T00:00:00Z'),
        updatedAt: new Date('2026-08-11T00:00:00Z'),
        sla: {},
        save: jest.fn().mockResolvedValue(),
        toObject() {
          return {
            ...document,
            _id: this._id,
            reportNumber: this.reportNumber,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
          };
        }
      };
    });

    const req = {
      body: {
        locationIntegrity: { confirmed: true, pinSource: 'manual' },
      category: 'road',
        subcategory: 'pothole',
        description: 'A large pothole is causing a hazard for motorists.',
        location: {
          type: 'Point',
          coordinates: ['120.3387', '16.0433'],
          address: { barangay: '  poblacion oeste ', city: 'dagupan city' }
        },
        priority: 'critical',
        privacyAcknowledged: true,
        images: []
      },
      files: {},
      user: { _id: '507f191e810c19729de860aa', role: 'citizen' },
      ip: '127.0.0.1',
      headers: {}
    };
    const res = createResponse();

    await createIncident(req, res, jest.fn());

    expect(payload.reporter).toBe(req.user._id);
    expect(payload.priority).toBeUndefined();
    expect(payload.status).toBe('submitted');
    expect(payload.location.address).toEqual(expect.objectContaining({
      barangay: 'Poblacion Oeste',
      city: 'Dagupan City'
    }));
    expect(payload.statusHistory).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'submitted', changedBy: req.user._id })
    ]));
    expect(payload.duplicateCandidates).toEqual([possibleDuplicate]);
    expect(payload.images).toEqual([]);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].data).toEqual(expect.objectContaining({
      status: 'submitted',
      possibleDuplicateCandidateCount: 1
    }));
    expect(res.json.mock.calls[0][0].data).not.toHaveProperty('duplicateCandidates');
  });

  test('returns the canonical barangay options used by incident validation', () => {
    const res = createResponse();
    getBarangays({}, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.data).toContain('Poblacion Oeste');
    expect(payload.data).toContain('Barangay I');
    expect(new Set(payload.data).size).toBe(payload.data.length);
  });

  test('does not let a citizen retrieve another citizen’s report', async () => {
    // The scoped MongoDB query returns no record instead of first fetching a
    // private report and relying on a client-side/after-the-fact check.
    const query = { populate: jest.fn() };
    query.populate.mockReturnValue(query);
    // The final populate resolves the scoped query as no match.
    query.populate.mockImplementationOnce(() => query)
      .mockImplementationOnce(() => query)
      .mockImplementationOnce(() => null);
    Incident.findOne.mockReturnValue(query);

    const req = {
      params: { id: '507f191e810c19729de860ea' },
      user: { _id: '507f191e810c19729de860aa', role: 'citizen' }
    };
    const res = createResponse();
    const next = jest.fn();

    await getIncident(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('stores advisory AI analysis and records its status without changing official decisions', async () => {
    evidenceService.getUploadedEvidenceFiles.mockReturnValue([{
      buffer: Buffer.from('prepared-image'),
      originalname: 'evidence.jpg',
      mimetype: 'image/jpeg'
    }]);
    evidenceService.processAndUploadEvidence.mockResolvedValue({
      images: [{ key: 'incidents/citizen/evidence.jpg', url: 'https://storage.example/evidence.jpg' }],
      aiAnalysis: {
        analysisStatus: 'completed',
        model: 'road_damage',
        detected: true,
        hazardType: 'pothole',
        confidence: 0.92,
        detections: { roadDamage: 1, cracks: 0 },
        findings: [{ label: 'pothole', confidence: 0.92, bbox: { x1: 0.1, y1: 0.2, x2: 0.7, y2: 0.8 } }],
        requiresManualReview: true,
        advisoryOnly: true,
        processedAt: new Date('2026-08-11T00:00:00Z')
      }
    });

    let payload;
    Incident.create.mockImplementation(async (document) => {
      payload = document;
      return {
        ...document,
        _id: '507f191e810c19729de860ea',
        reportNumber: 'LUNAS-202608-000003',
        createdAt: new Date('2026-08-11T00:00:00Z'),
        updatedAt: new Date('2026-08-11T00:00:00Z'),
        toObject() { return { ...document, _id: this._id, reportNumber: this.reportNumber }; }
      };
    });

    const req = {
      body: {
        locationIntegrity: { confirmed: true, pinSource: 'manual' },
      category: 'road',
        description: 'A large pothole is causing a hazard for motorists.',
        location: {
          type: 'Point',
          coordinates: ['120.3387', '16.0433'],
          address: { barangay: 'Poblacion Oeste', city: 'Dagupan City' }
        }
      },
      files: {},
      user: { _id: '507f191e810c19729de860aa', role: 'citizen' },
      ip: '127.0.0.1',
      headers: {}
    };

    await createIncident(req, createResponse(), jest.fn());

    expect(payload.aiAnalysis).toEqual(expect.objectContaining({
      analysisStatus: 'completed',
      requiresManualReview: true,
      advisoryOnly: true
    }));
    expect(payload.category).toBe('road');
    expect(payload.priority).toBeUndefined();
    expect(payload.status).toBe('submitted');
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'ai_analysis_completed',
      details: expect.objectContaining({
        analysisStatus: 'completed',
        requiresManualReview: true,
        advisoryOnly: true
      })
    }));
  });

  test('exposes safe AI assistance to citizens and enriched details to officials', async () => {
    const incident = {
      _id: '507f191e810c19729de860ea',
      reportNumber: 'LUNAS-202608-000004',
      locationIntegrity: { confirmed: true, pinSource: 'manual' },
      category: 'road',
      description: 'A large pothole is causing a hazard for motorists.',
      status: 'submitted',
      priority: 'medium',
      location: { coordinates: [120.3387, 16.0433], address: { barangay: 'Poblacion Oeste' } },
      images: [],
      aiAnalysis: {
        analysisStatus: 'completed',
        model: 'road_damage',
        detected: true,
        hazardType: 'pothole',
        confidence: 0.92,
        detections: { roadDamage: 1, cracks: 0 },
        requiresManualReview: false,
        advisoryOnly: false,
        processedAt: new Date('2026-08-11T00:00:00Z')
      }
    };

    const official = await serializeIncidentForOfficial(incident);
    const citizen = await serializeIncidentForCitizen(incident);

    expect(official.aiAnalysis).toEqual({
      analysisStatus: 'completed',
      category: undefined,
      model: 'road_damage',
      modelAvailable: true,
      detected: true,
      hazardType: 'pothole',
      confidence: 0.92,
      detections: { roadDamage: 1, cracks: 0 },
      findingsCount: 0,
      findings: [],
      requiresManualReview: true,
      advisoryOnly: true,
      processedAt: new Date('2026-08-11T00:00:00Z')
    });
    expect(citizen.aiAnalysis).toEqual({
      analysisStatus: 'completed',
      category: undefined,
      model: 'road_damage',
      modelAvailable: true,
      detected: true,
      hazardType: 'pothole',
      confidence: 0.92,
      findingsCount: 0,
      requiresManualReview: true,
      advisoryOnly: true,
      processedAt: new Date('2026-08-11T00:00:00Z')
    });
  });

  test('returns an ordered, valid empty My Reports response', async () => {
    const query = {
      populate: jest.fn(),
      sort: jest.fn(),
      limit: jest.fn(),
      skip: jest.fn().mockResolvedValue([])
    };
    query.populate.mockReturnValue(query);
    query.sort.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    Incident.find.mockReturnValue(query);
    Incident.countDocuments.mockResolvedValue(0);
    const res = createResponse();

    await getMyIncidents({
      query: {},
      user: { _id: '507f191e810c19729de860aa', role: 'citizen' }
    }, res, jest.fn());

    expect(query.sort).toHaveBeenCalledWith('-createdAt');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 }
    });
  });

  test('returns the report owner’s real status-history timeline without internal notes', async () => {
    const incident = {
      reporter: { _id: '507f191e810c19729de860aa' },
      location: { address: { barangay: 'Poblacion Oeste' } },
      statusHistory: [{
        status: 'submitted',
        changedAt: new Date('2026-08-11T00:00:00Z'),
        notes: 'Incident reported'
      }, {
        status: 'in_progress',
        changedAt: new Date('2026-08-12T00:00:00Z'),
        notes: 'Internal repair note that must not reach the citizen',
        metadata: { progressPercent: 25, stage: 'site_preparation' }
      }]
    };
    let populateCalls = 0;
    const query = {
      populate: jest.fn(() => {
        populateCalls += 1;
        return populateCalls === 3 ? incident : query;
      })
    };
    Incident.findOne.mockReturnValue(query);
    const res = createResponse();
    const next = jest.fn();

    await getIncidentHistory({
      params: { id: '507f191e810c19729de860ea' },
      user: { _id: '507f191e810c19729de860aa', role: 'citizen' }
    }, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{
        status: 'submitted',
        changedAt: new Date('2026-08-11T00:00:00Z')
      }, {
        status: 'in_progress',
        changedAt: new Date('2026-08-12T00:00:00Z'),
        progressPercent: 25,
        repairStage: 'site_preparation'
      }]
    });
  });
});


const slaQuery = (value) => {
  const query = { populate: jest.fn(), select: jest.fn() };
  query.populate.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.then = (resolve, reject) => Promise.resolve(value).then(resolve, reject);
  return query;
};

test.each([['critical', 48], ['high', 72], ['medium', 168], ['low', 336]])(
  'legacy prioritization cannot change %s SLA (%i hours) before policy approval', async (priority, _hours) => {
    jest.clearAllMocks();
    const time = new Date('2026-10-02T00:00:00Z');
    jest.useFakeTimers().setSystemTime(time);
    const record = { _id: '507f191e810c19729de860b1', status: 'city_confirmed',
      createdAt: new Date('2026-09-01T00:00:00Z'), reportNumber: 'SLA-001', sla: {} };
    Incident.findOne.mockReturnValue(slaQuery(record));
    Incident.findOneAndUpdate.mockReturnValue(slaQuery({ ...record, status: 'prioritized' }));
    const res = createResponse();
    const next = jest.fn();
    await updateIncidentPriority({ params: { id: record._id }, body: { priority },
      user: { _id: '507f191e810c19729de860a1', role: 'barangay_official', barangay: 'Poblacion Oeste' }, headers: {} }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    jest.useRealTimers();
  }
);

test('incident SLA API projects an overdue deadline during City verification even before polling', async () => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date('2026-10-02T00:00:00Z'));
  Incident.findOne.mockReturnValue(slaQuery({ _id: 'incident', status: 'city_verification',
    sla: { deadline: new Date('2026-10-01T00:00:00Z'), state: 'active', isOverdue: false } }));
  const res = createResponse();
  const next = jest.fn();
  await getIncidentSLA({ params: { id: 'incident' }, user: { role: 'barangay_official', barangay: 'Poblacion Oeste' } }, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(res.json.mock.calls[0][0].data).toMatchObject({ state: 'overdue', isOverdue: true });
  jest.useRealTimers();
});


test('citizen, official and operational map projections never disclose raw GPS or abuse review records', async () => {
  const incident = { _id: 'private', images: [], locationIntegrity: {
    pinSource: 'manual', comparison: 'unavailable', gps: { coordinates: [120.4, 16.1] }
  }, falseReportReview: { finding: 'confirmed_fabrication', history: [{ reason: 'sensitive review' }] } };
  const citizen = await serializeIncidentForCitizen(incident);
  const official = await serializeIncidentForOfficial(incident);
  const operational = await serializeIncidentForOfficial(incident, { includeLocationIntegrity: false });
  expect(citizen).not.toHaveProperty('locationIntegrity');
  for (const projection of [citizen, official, operational]) {
    expect(projection).not.toHaveProperty('falseReportReview');
    expect(JSON.stringify(projection)).not.toContain('120.4');
  }
  expect(official.locationIntegrity.comparison).toBe('unavailable');
  expect(operational.locationIntegrity).toBeUndefined();
});


test.each(['success', 'conflict', 'failure'])('legacy routing blocks premature maintenance (%s fixture)', async (outcome) => {
  jest.clearAllMocks();
  const record = { _id: '507f191e810c19729de860a1', status: 'prioritized', priority: 'high', images: [],
    jurisdiction: { barangay: 'Poblacion Oeste', city: 'Dagupan City' } };
  const chain = value => ({ populate: jest.fn().mockReturnThis(), then: resolve => Promise.resolve(value).then(resolve) });
  Incident.findOne.mockReturnValue(chain(record));
  require('../models/User').findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: '507f191e810c19729de860a2' }) });
  require('../models/User').find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
  const WorkOrder = require('../models/WorkOrder');
  WorkOrder.create.mockResolvedValue({ _id: '507f191e810c19729de860a3' });
  WorkOrder.deleteOne.mockResolvedValue({ deletedCount: 1 });
  Incident.findOneAndUpdate.mockReturnValue(outcome === 'failure' ? { populate: () => Promise.reject(new Error('write failed')) } : chain(outcome === 'conflict' ? null : { ...record, status: 'provider_assigned' }));
  const res = createResponse();
  const next = jest.fn();
  await require('./incidentController').routeIncident({ params: { id: record._id }, body: { responsibleOrganization: 'Water District', responsibleRole: 'utility_provider' }, user: { _id: '507f191e810c19729de860a4', role: 'barangay_official', barangay: 'Poblacion Oeste' }, headers: {} }, res, next);
  expect(WorkOrder.create).not.toHaveBeenCalled();
  expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
  expect(next).not.toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(409);
});


test.each([
  ['active', { $nin: ['resolved', 'closed', 'rejected', 'duplicate'] }],
  ['resolved', { $in: ['resolved', 'closed'] }],
  ['in_progress', 'in_progress'],
])('citizen report filter %s applies before pagination and preserves ownership', async (reportView, status) => {
  const query = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), skip: jest.fn().mockResolvedValue([]) };
  Incident.find.mockReturnValue(query); Incident.countDocuments.mockResolvedValue(25);
  await getMyIncidents({ user: { role: 'citizen', _id: 'citizen-id' }, query: { reportView, page: '2', limit: '20', search: 'Water' } }, createResponse(), jest.fn());
  const filter = Incident.find.mock.calls.at(-1)[0];
  expect(JSON.stringify(filter)).toContain('citizen-id');
  expect(JSON.stringify(filter)).toContain(JSON.stringify(status));
  expect(Incident.countDocuments).toHaveBeenLastCalledWith(filter);
  expect(query.skip).toHaveBeenCalledWith(20);
});

test('remote evidence and forged storage ownership are denied before processing', async () => {
  jest.clearAllMocks();
  const res = createResponse();
  await createIncident({ body: { images: [{ url: 'https://external.example/image.jpg', key: 'another-owner' }] } }, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(400); expect(Incident.create).not.toHaveBeenCalled();
  expect(evidenceService.processAndUploadEvidence).not.toHaveBeenCalled();
});

test.each(['committed', 'rejected', 'uncertain'])('evidence recovery respects %s persistence outcome', async outcome => {
  jest.clearAllMocks();
  const images = [{ key: 'owned-private-photo' }];
  evidenceService.getUploadedEvidenceFiles.mockReturnValue([{ buffer: Buffer.from('synthetic') }]);
  evidenceService.processAndUploadEvidence.mockResolvedValue({ images });
  const record = { _id: 'saved-report', reportNumber: 'LUNAS-TEST', status: 'submitted' };
  if (outcome === 'committed') {
    Incident.create.mockResolvedValue(record);
    createAuditLog.mockRejectedValueOnce(new Error('post-commit fault'));
  } else Incident.create.mockRejectedValue(Object.assign(new Error('write failure'), outcome === 'rejected' ? { name: 'ValidationError' } : {}));
  const req = { body: { locationIntegrity: { confirmed: true, pinSource: 'manual' }, category: 'road', description: 'A documented infrastructure concern',
    location: { coordinates: [120.3, 16.1], address: { barangay: 'Pantal', city: 'Dagupan City' } } },
    user: { _id: 'owner', role: 'citizen' }, headers: {} };
  const res = createResponse(), next = jest.fn();
  await createIncident(req, res, next);
  expect(Incident.create).toHaveBeenCalledTimes(1);
  expect(evidenceService.processAndUploadEvidence).toHaveBeenCalledTimes(1);
  if (outcome === 'committed') { expect(res.status).toHaveBeenCalledWith(201); expect(next).not.toHaveBeenCalled(); }
  else expect(next).toHaveBeenCalled();
  if (outcome === 'rejected') expect(evidenceService.cleanupEvidence).toHaveBeenCalledWith(images);
  else expect(evidenceService.cleanupEvidence).not.toHaveBeenCalled();
  evidenceService.getUploadedEvidenceFiles.mockReturnValue([]);
});
