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
jest.mock('../services/dailyReportLimitService', () => ({
  DAILY_REPORT_LIMIT_CODE: 'DAILY_REPORT_LIMIT_REACHED',
  DAILY_REPORT_LIMIT_MESSAGE: 'You have reached the daily limit of 3 reports. You can submit another report tomorrow.',
  getDailyReportAllowance: jest.fn(),
  reserveDailyReportSlot: jest.fn().mockResolvedValue({
    allowed: true,
    reservation: { dayKey: '2026-08-11' },
    limit: 3,
    submitted: 1,
    remaining: 2,
    dayKey: '2026-08-11',
    resetsAt: new Date('2026-08-12T00:00:00Z')
  }),
  releaseDailyReportSlot: jest.fn().mockResolvedValue()
}));
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
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const { createNotification } = require('../services/notificationService');
const { findPossibleDuplicateCandidates } = require('../services/duplicateDetectionService');
const evidenceService = require('../services/evidenceService');
const dailyReportLimitService = require('../services/dailyReportLimitService');
const {
  createIncident,
  getDailyReportLimit,
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
        locationIntegrity: { confirmed: true, pinSource: 'manual' },
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

  test('rejects a fourth report with the structured daily limit response', async () => {
    dailyReportLimitService.reserveDailyReportSlot.mockResolvedValueOnce({
      allowed: false,
      limit: 3,
      submitted: 3,
      remaining: 0,
      dayKey: '2026-08-11',
      resetsAt: new Date('2026-08-12T00:00:00Z')
    });
    const response = createResponse();

    await createIncident({
      body: {
        locationIntegrity: { confirmed: true, pinSource: 'manual' },
        category: 'road',
        description: 'A large pothole is causing a hazard for motorists.',
        location: {
          coordinates: ['120.3387', '16.0433'],
          address: { barangay: 'Pantal', city: 'Dagupan City' }
        }
      },
      files: {},
      user: { _id: '507f191e810c19729de860aa', role: 'citizen' },
      headers: {}
    }, response, jest.fn());

    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      code: 'DAILY_REPORT_LIMIT_REACHED',
      data: { dailyReportLimit: expect.objectContaining({ remaining: 0 }) }
    }));
    expect(Incident.create).not.toHaveBeenCalled();
    expect(findPossibleDuplicateCandidates).not.toHaveBeenCalled();
  });

  test('releases a reserved slot when incident creation fails', async () => {
    dailyReportLimitService.reserveDailyReportSlot.mockResolvedValueOnce({
      allowed: true,
      reservation: { dayKey: '2026-08-11' }
    });
    Incident.create.mockRejectedValueOnce(new Error('write failed'));
    const next = jest.fn();

    await createIncident({
      body: {
        locationIntegrity: { confirmed: true, pinSource: 'manual' },
        category: 'road',
        description: 'A large pothole is causing a hazard for motorists.',
        location: {
          coordinates: ['120.3387', '16.0433'],
          address: { barangay: 'Pantal', city: 'Dagupan City' }
        }
      },
      files: {},
      user: { _id: '507f191e810c19729de860aa', role: 'citizen' },
      headers: {}
    }, createResponse(), next);

    expect(dailyReportLimitService.releaseDailyReportSlot).toHaveBeenCalledWith({
      reporterId: '507f191e810c19729de860aa',
      dayKey: '2026-08-11'
    });
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('returns only the authenticated citizen daily allowance', async () => {
    const allowance = {
      limit: 3,
      submitted: 2,
      remaining: 1,
      dayKey: '2026-08-11',
      resetsAt: new Date('2026-08-12T00:00:00Z')
    };
    dailyReportLimitService.getDailyReportAllowance.mockResolvedValueOnce(allowance);
    const response = createResponse();

    await getDailyReportLimit({ user: { _id: 'citizen-a', role: 'citizen' } }, response);

    expect(dailyReportLimitService.getDailyReportAllowance).toHaveBeenCalledWith({ reporterId: 'citizen-a' });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ success: true, data: { dailyReportLimit: allowance } });
  });

  test('creates a submitted, owned report and ignores citizen-provided priority', async () => {
    const possibleDuplicate = {
      incident: '507f191e810c19729de860eb',
      reportNumber: 'LUNAS-202608-000001',
      distanceMeters: 24,
      score: 91
    };
    findPossibleDuplicateCandidates.mockResolvedValue([possibleDuplicate]);
    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: '507f191e810c19729de860ec' }])
    });

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
        images: [{
          url: 'https://storage.example/legacy-evidence.jpg',
          key: 'incidents/another-citizen/private-evidence.jpg'
        }]
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
    expect(payload.images[0].key).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].data).toEqual(expect.objectContaining({
      status: 'submitted',
      possibleDuplicateCandidateCount: 1
    }));
    expect(res.json.mock.calls[0][0].data).not.toHaveProperty('duplicateCandidates');
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipient: '507f191e810c19729de860ec',
      type: 'incident_submitted',
      data: expect.objectContaining({ incidentId: '507f191e810c19729de860ea', link: '/validation-routing/507f191e810c19729de860ea' })
    }));
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
  'Barangay prioritization prepares the %s SLA without starting the timer (%i hours)', async (priority, hours) => {
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
    const sla = Incident.findOneAndUpdate.mock.calls[0][1].$set.sla;
    expect(sla.startedAt).toBeUndefined();
    expect(sla.deadline).toBeUndefined();
    expect(sla.state).toBe('not_started');
    expect(sla.targetResolutionTime).toBe(hours);
    expect(res.status).toHaveBeenCalledWith(200);
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


test.each(['success', 'conflict', 'failure'])('routing creates an unassigned work order and handles %s', async (outcome) => {
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
  expect(WorkOrder.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', assignmentState: 'unassigned', priority: 'high', sla: expect.objectContaining({ state: 'active', startedAt: expect.any(Date), deadline: expect.any(Date) }) }));
  expect(Incident.findOneAndUpdate.mock.calls[0][1].$set.workOrder).toBe('507f191e810c19729de860a3');
  if (outcome !== 'success') expect(WorkOrder.deleteOne).toHaveBeenCalledWith({ _id: '507f191e810c19729de860a3' });
  if (outcome === 'failure') expect(next).toHaveBeenCalledWith(expect.any(Error));
  else expect(res.status).toHaveBeenCalledWith(outcome === 'conflict' ? 409 : 200);
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

test('citizen and official schedules expose the same safe deadline data without SLA internals', async () => {
  const source = { _id: 'schedule-report', status: 'provider_assigned', agencyStatus: 'work_in_progress',
    sla: { deadline: new Date('2026-10-23T08:00:00Z'), escalationLevel: 7, internalNote: 'private' },
    statusHistory: [{ status: 'work_in_progress', changedAt: new Date('2026-10-20T08:00:00Z'), notes: 'private', changedBy: 'private-actor' }], images: [] };
  const citizen = await serializeIncidentForCitizen(source);
  const official = await serializeIncidentForOfficial(source);
  expect(citizen.agencySchedule.deadline).toBe(official.agencySchedule.deadline);
  expect(citizen.agencySchedule.startedAt).toBe(official.agencySchedule.startedAt);
  expect(citizen.agencySchedule.durationMilliseconds).toBe(259200000);
  expect(Object.keys(citizen.agencySchedule).sort()).toEqual(['state', 'asOf', 'deadline', 'startedAt', 'stoppedAt', 'durationMilliseconds', 'remainingMilliseconds'].sort());
  expect(citizen).not.toHaveProperty('sla');
});
