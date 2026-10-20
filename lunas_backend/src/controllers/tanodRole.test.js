jest.mock('../models/Inspection', () => ({ findOne: jest.fn() }));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn() }));
jest.mock('../services/notificationService', () => ({ createNotification: jest.fn() }));
jest.mock('../services/evidenceService', () => ({ getUploadedEvidenceFiles: jest.fn(), processAndUploadEvidence: jest.fn() }));
jest.mock('../services/storageService', () => ({}));
const Inspection = require('../models/Inspection');
const controller = require('./tanodWorkflowController');
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

beforeEach(() => jest.clearAllMocks());

test.each(['repair_personnel', 'barangay_tanod', 'citizen', 'utility_provider'])(
  '%s cannot perform Utility Personnel inspection actions', async role => {
    for (const action of ['listMyInspections', 'startInspection', 'submitInspection']) {
      const res = response();
      const next = jest.fn();
      await controller[action]({ user: { _id: 'user', role, barangay: 'Pantal' }, params: {} }, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    }
    expect(Inspection.findOne).not.toHaveBeenCalled();
  }
);

test.each(['startInspection', 'submitInspection'])('%s requires assignment, incident and barangay match', async action => {
  Inspection.findOne.mockResolvedValue(null);
  const res = response();
  const next = jest.fn();
  await controller[action]({ user: { _id: 'tanod', role: 'utility_personnel', barangay: 'Pantal' },
    params: { id: 'incident', inspectionId: 'inspection' } }, res, next);
  expect(Inspection.findOne).toHaveBeenCalledWith(expect.objectContaining({
    _id: 'inspection', incident: 'incident', tanod: 'tanod', barangay: 'Pantal'
  }));
  expect(res.status).toHaveBeenCalledWith(404);
  expect(next).not.toHaveBeenCalled();
});
