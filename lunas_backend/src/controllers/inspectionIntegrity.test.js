jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn() }));
jest.mock('../services/notificationService', () => ({ createNotification: jest.fn() }));
const express = require('express');
const request = require('supertest');
const Incident = require('../models/Incident');
const Inspection = require('../models/Inspection');
const User = require('../models/User');
const legacy = require('./incidentController');
const workOrders = require('./workOrderController');
const controller = require('./tanodWorkflowController');
const id = '507f1f77bcf86cd799439011';
const other = '507f1f77bcf86cd799439012';
let inspection, incident, app;
beforeEach(() => {
  inspection = { _id: other, incident: id, secretary: id, barangay: 'Pantal', type: 'completion', status: 'submitted', result: 'verified', version: 0, save: jest.fn() };
  incident = { _id: id, category: 'other', status: 'tanod_verified', agencyStatus: 'not_routed', jurisdiction: { barangay: 'Pantal' }, statusHistory: [], save: jest.fn() };
  jest.spyOn(Inspection, 'findById').mockResolvedValue(inspection);
  jest.spyOn(Inspection, 'findOne').mockResolvedValue(inspection);
  jest.spyOn(Incident, 'findOne').mockResolvedValue(incident);
  jest.spyOn(Incident, 'findOneAndUpdate').mockResolvedValue(incident);
  jest.spyOn(Incident, 'updateOne').mockResolvedValue({ modifiedCount: 1 });
  app = express(); app.use(express.json());
  app.use((req, res, next) => { req.user = { _id: id, role: 'barangay_official', barangay: 'Pantal' }; next(); });
  app.post('/:id/inspections/:inspectionId/review', controller.reviewInspection);
  app.post('/:id/complete', controller.completeIncident);
  app.post('/:id/legacy-validate', legacy.validateIncident);
  app.post('/:id/legacy-priority', legacy.updateIncidentPriority);
  app.post('/:id/legacy-route', legacy.routeIncident);
  app.post('/:id/legacy-create-order', workOrders.createWorkOrder);
  app.post('/:id/legacy-final-review', workOrders.finalReviewWorkOrder);
  app.use((err, req, res, _next) => res.status(500).json({ message: err.message }));
});
afterEach(() => jest.restoreAllMocks());
test('completion evidence cannot be approved through initial review', async () => {
  const result = await request(app).post(`/${id}/inspections/${other}/review`).send({ decision: 'approve', categoryConfirmed: true, expectedVersion: 0 });
  expect(result.status).toBeGreaterThanOrEqual(400);
  expect(inspection.save).not.toHaveBeenCalled();
  expect(incident.save).not.toHaveBeenCalled();
});
test('stale completion evidence cannot close a different URL incident', async () => {
  const result = await request(app).post(`/${other}/complete`).send({ inspectionId: other });
  expect(result.status).toBeGreaterThanOrEqual(400);
  expect(inspection.save).not.toHaveBeenCalled();
  expect(incident.save).not.toHaveBeenCalled();
});

test.each(['legacy-validate', 'legacy-priority', 'legacy-route', 'legacy-create-order', 'legacy-final-review'])('%s fails closed without document mutation', async endpoint => {
  await request(app).post(`/${id}/${endpoint}`).send({ decision: 'approved' }).expect(409);
  expect(inspection.save).not.toHaveBeenCalled(); expect(incident.save).not.toHaveBeenCalled();
});
test.each(['not_verified', 'unable_to_verify'])('initial result %s cannot authorize routing', async result => {
  inspection.type = 'initial'; inspection.result = result; incident.initialInspection = other;
  await request(app).post(`/${id}/inspections/${other}/review`).send({ decision: 'approve', categoryConfirmed: true, expectedVersion: 0 }).expect(409);
  expect(inspection.save).not.toHaveBeenCalled(); expect(incident.save).not.toHaveBeenCalled();
});
test.each(['closed', 'rejected', 'provider_assigned', 'tanod_assigned'])('initial review denies lifecycle %s', async status => {
  inspection.type = 'initial'; incident.initialInspection = other; incident.status = status;
  await request(app).post(`/${id}/inspections/${other}/review`).send({ decision: 'approve', categoryConfirmed: true, expectedVersion: 0 }).expect(409);
  expect(inspection.save).not.toHaveBeenCalled();
});
test('replaced initial reference cannot be reviewed', async () => {
  inspection.type = 'initial'; incident.initialInspection = id;
  await request(app).post(`/${id}/inspections/${other}/review`).send({ decision: 'approve', categoryConfirmed: true, expectedVersion: 0 }).expect(409);
  expect(inspection.save).not.toHaveBeenCalled();
});
test('verified current initial approval preserves routing history without authorizing maintenance', async () => {
  inspection.type = 'initial'; incident.initialInspection = other; incident.category = 'road';
  incident.routing = { history: [{ reason: 'Historical routing retained' }] };
  jest.spyOn(User, 'find').mockReturnValue({ select: async () => [] });
  await request(app).post(`/${id}/inspections/${other}/review`).send({ decision: 'approve', categoryConfirmed: true, expectedVersion: 0 }).expect(200);
  expect(inspection.status).toBe('approved'); expect(incident.agencyStatus).toBe('not_routed');
  expect(inspection.reviewedBy).toBe(id); expect(inspection.reviewedAt).toBeInstanceOf(Date);
  expect(incident.routing.history[0].reason).toBe('Historical routing retained');
  await request(app).post(`/${id}/inspections/${other}/review`).send({ decision: 'approve', categoryConfirmed: true, expectedVersion: 0 }).expect(409);
  expect(inspection.save).toHaveBeenCalledTimes(1); expect(incident.statusHistory).toHaveLength(1);
});
test.each(['reject', 'clarification'])('current initial %s preserves findings and evidence', async decision => {
  inspection.type = 'initial'; incident.initialInspection = other; inspection.evidence = [{ key: 'existing' }];
  await request(app).post(`/${id}/inspections/${other}/review`).send({ decision, notes: 'Documented review reason', recipient: 'citizen', expectedVersion: 0 }).expect(200);
  expect(incident.status).toBe(decision === 'reject' ? 'tanod_rejected' : 'clarification_required');
  expect(inspection.evidence).toEqual([{ key: 'existing' }]);
});
test.each(['correction_required', 'work_in_progress', 'work_completed'])('closure policy denies even completion state %s', async state => {
  incident.agencyStatus = state; incident.completionInspection = other;
  await request(app).post(`/${id}/complete`).send({ inspectionId: other }).expect(409);
  expect(inspection.save).not.toHaveBeenCalled(); expect(incident.save).not.toHaveBeenCalled();
});
test('concurrent closure requests cannot produce approval or closure history', async () => {
  incident.completionInspection = other;
  const responses = await Promise.all([1, 2].map(() => request(app).post(`/${id}/complete`).send({ inspectionId: other })));
  expect(responses.map(r => r.status)).toEqual([409, 409]);
  expect(inspection.save).not.toHaveBeenCalled(); expect(incident.statusHistory).toHaveLength(0);
});

test('initial review cannot overwrite an established maintenance cycle', async () => {
  inspection.type = 'initial'; incident.initialInspection = other; incident.workOrder = id;
  await request(app).post(`/${id}/inspections/${other}/review`).send({ decision: 'approve', categoryConfirmed: true, expectedVersion: 0 }).expect(409);
  expect(inspection.save).not.toHaveBeenCalled(); expect(incident.save).not.toHaveBeenCalled();
});
