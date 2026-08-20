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

const Incident = require('../models/Incident');
const { findPossibleDuplicateCandidates } = require('../services/duplicateDetectionService');
const { createIncident, getIncident, getIncidentHistory, getMyIncidents } = require('./incidentController');

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
          address: { barangay: 'Poblacion Oeste', city: 'Dagupan City' }
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
    expect(payload.priority).toBe('medium');
    expect(payload.status).toBe('submitted');
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
