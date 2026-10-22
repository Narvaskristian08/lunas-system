jest.mock('../models/Incident', () => ({ findOne: jest.fn(), findById: jest.fn() }));
jest.mock('../models/Inspection', () => ({ findOne: jest.fn(), findById: jest.fn() }));
jest.mock('../models/User', () => ({ find: jest.fn() }));
jest.mock('../services/evidenceService', () => ({ getUploadedEvidenceFiles: jest.fn(() => []), processAndUploadEvidence: jest.fn() }));
jest.mock('../services/storageService', () => ({}));
jest.mock('../services/slaService', () => ({ initializeIncidentSLA: jest.fn(() => ({ targetResolutionTime: 72 })) }));
jest.mock('../services/notificationService', () => ({ createNotification: jest.fn() }));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn() }));
const Incident = require('../models/Incident');
const Inspection = require('../models/Inspection');
const { createNotification } = require('../services/notificationService');
const controller = require('./tanodWorkflowController');
const provider = { _id: 'provider', role: 'utility_provider', utilityCompany: 'Agency' };
const secretary = { _id: 'secretary', role: 'barangay_official', barangay: 'Pantal' };
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const call = async (name, user, body, incident) => {
  Incident.findOne.mockResolvedValue(incident);
  const res = response(); const next = jest.fn();
  await controller[name]({ user, body, params: { id: 'incident', inspectionId: 'inspection' } }, res, next);
  expect(next).not.toHaveBeenCalled(); return res;
};
beforeEach(() => jest.clearAllMocks());
const report = (values = {}) => ({ _id: 'incident', reporter: 'citizen', status: 'provider_assigned', agencyStatus: 'ready_for_work', priority: 'high', expectedTimeline: 'Complete within the agency deadline', sla: {}, statusHistory: [], save: jest.fn(), ...values });

test('agency can skip external procurement and records progress plus citizen notification', async () => {
  const incident = report();
  await call('updateAgencyStatus', provider, { status: 'work_in_progress', slaDeadline: '2026-12-01T08:00:00Z', progressPercent: 25, procurementRequired: false }, incident);
  expect(incident.agencyStatus).toBe('work_in_progress');
  expect(incident.agencyProgressPercent).toBe(25);
  expect(incident.sla.startedAt).toBeInstanceOf(Date);
  expect(incident.save).toHaveBeenCalled();
  expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ recipient: 'citizen', type: 'status_update' }));
});
test.each(['closed', 'resolved', 'rejected', 'duplicate'])('agency cannot modify terminal report %s', async status => {
  const incident = report({ status });
  const res = await call('updateAgencyStatus', provider, { status: 'ready_for_work' }, incident);
  expect(res.status).toHaveBeenCalledWith(409); expect(incident.save).not.toHaveBeenCalled();
});
test('organization mismatch does not reveal a report', async () => {
  const res = await call('updateAgencyStatus', provider, { status: 'work_in_progress' }, null);
  expect(res.status).toHaveBeenCalledWith(404);
  expect(Incident.findOne).toHaveBeenCalledWith({ _id: 'incident', 'routing.responsibleOrganization': 'Agency' });
});
test('priority change cannot erase a running deadline', async () => {
  const deadline = new Date('2026-12-01');
  const incident = report({ agencyStatus: 'work_in_progress', sla: { deadline } });
  const res = await call('updateAgencyStatus', provider, { status: 'work_in_progress', priority: 'critical' }, incident);
  expect(res.status).toHaveBeenCalledWith(409); expect(incident.sla.deadline).toBe(deadline);
});
test('physical progress cannot regress or reach 100 before completion', async () => {
  for (const progressPercent of [20, 100]) {
    const incident = report({ agencyStatus: 'work_in_progress', agencyProgressPercent: 50, sla: { deadline: new Date('2026-12-01') } });
    const res = await call('updateAgencyStatus', provider, { status: 'work_in_progress', progressPercent }, incident);
    expect(res.status).toHaveBeenCalledWith(progressPercent === 100 ? 400 : 409);
    expect(incident.save).not.toHaveBeenCalled();
  }
});
test('generic review cannot route a completion inspection or stale initial inspection', async () => {
  for (const type of ['completion', 'initial']) {
    Inspection.findById.mockResolvedValue({ _id: 'inspection', incident: 'incident', secretary: 'secretary', status: 'submitted', type });
    const res = await call('reviewInspection', secretary, { decision: 'approve' }, report({ status: 'tanod_verified', initialInspection: 'another-inspection' }));
    expect(res.status).toHaveBeenCalledWith(409);
  }
});
test('approval requires verified findings and photographs', async () => {
  Inspection.findById.mockResolvedValue({ _id: 'inspection', incident: 'incident', secretary: 'secretary', status: 'submitted', type: 'initial', result: 'unable_to_verify' });
  const res = await call('reviewInspection', secretary, { decision: 'approve' }, report({ status: 'tanod_verified', initialInspection: 'inspection' }));
  expect(res.status).toHaveBeenCalledWith(409);
});
test('Secretary completion persists SLA outcome without waiting for scheduler', async () => {
  Inspection.findOne.mockResolvedValue({ _id: 'inspection', incident: 'incident', type: 'completion', secretary: 'secretary', status: 'submitted', result: 'verified', evidence: [{}], save: jest.fn() });
  const incident = report({ agencyStatus: 'work_completed', completionInspection: 'inspection', sla: { deadline: new Date('2000-01-01') } });
  await call('completeIncident', secretary, { inspectionId: 'inspection' }, incident);
  expect(incident.status).toBe('closed'); expect(incident.sla.state).toBe('breached');
  expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ recipient: 'citizen', type: 'incident_completed' }));
});
