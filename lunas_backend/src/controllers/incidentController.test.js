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
  serializeIncidentForOfficial
} = require('./incidentController');

const createResponse = () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
};

describe('citizen incident reporting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
