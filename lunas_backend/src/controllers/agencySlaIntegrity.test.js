jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn() }));
jest.mock('../services/notificationService', () => ({ createNotification: jest.fn() }));
const express = require('express');
const request = require('supertest');
const Incident = require('../models/Incident');
const WorkOrder = require('../models/WorkOrder');
const { updateAgencyStatus } = require('./tanodWorkflowController');
const id = '507f1f77bcf86cd799439011';
let incident, order, original, app, role;
beforeEach(() => {
  role = 'utility_provider';
  original = { targetResolutionTime: 72, startedAt: new Date('2026-10-01T00:00:00Z'),
    deadline: new Date('2026-10-04T00:00:00Z'), state: 'overdue', isOverdue: true,
    escalationLevel: 1, remindersSent: 2, reminderThresholdsSent: [24, 12],
    lastEscalatedAt: new Date('2026-10-04T01:00:00Z') };
  incident = { _id: id, workOrder: id, priority: 'high', status: 'in_progress', agencyStatus: 'pending_procurement',
    routing: { responsibleOrganization: 'Agency' }, sla: structuredClone(original), statusHistory: [], save: jest.fn() };
  order = { _id: id, incident: id, priority: 'high', responsibleOrganization: 'Agency', status: 'in_progress', sla: structuredClone(original) };
  jest.spyOn(Incident, 'findOne').mockResolvedValue(incident);
  jest.spyOn(Incident, 'findOneAndUpdate').mockResolvedValue(incident);
  jest.spyOn(Incident, 'updateOne').mockResolvedValue({ modifiedCount: 1 });
  jest.spyOn(WorkOrder, 'findOne').mockResolvedValue(order);
  app = express(); app.use(express.json());
  app.patch('/:id', (req, res, next) => { req.user = { _id: id, role, utilityCompany: 'Agency' }; next(); }, updateAgencyStatus);
  app.use((err, req, res, _next) => res.status(500).json({ message: err.message }));
});
afterEach(() => jest.restoreAllMocks());
test('priority change cannot erase an existing SLA or its monitoring history', async () => {
  await request(app).patch(`/${id}`).send({ status: 'work_in_progress', priority: 'critical' }).expect(409);
  expect(incident.save).not.toHaveBeenCalled();
  expect(incident.sla).toEqual(original);
});

test.each(['pending_procurement', 'correction_required'])('status update from %s preserves full SLA and warnings', async status => {
  incident.agencyStatus = status;
  await request(app).patch(`/${id}`).send({ status: 'work_in_progress', priority: 'high', slaDeadline: original.deadline.toISOString() }).expect(200);
  expect(incident.sla).toEqual(original); expect(order.sla).toEqual(original);
});
test.each(['2026-10-05T00:00:00Z', '2026-09-01T00:00:00Z'])('deadline amendment %s fails without mutation', async slaDeadline => {
  await request(app).patch(`/${id}`).send({ status: 'work_in_progress', slaDeadline }).expect(409);
  expect(incident.sla).toEqual(original); expect(incident.save).not.toHaveBeenCalled();
});
test.each(['', 'invalid', null, 123, false])('invalid deadline %s is rejected before writes', async slaDeadline => {
  await request(app).patch(`/${id}`).send({ status: 'work_in_progress', slaDeadline }).expect(400);
  expect(incident.sla).toEqual(original); expect(incident.save).not.toHaveBeenCalled();
});
test('equivalent timezone timestamp retains original elapsed-time deadline', async () => {
  await request(app).patch(`/${id}`).send({ status: 'work_in_progress', slaDeadline: '2026-10-04T08:00:00+08:00' }).expect(200);
  expect(incident.sla).toEqual(original);
});
test('missing SLA cannot create an unauthorized start', async () => {
  incident.sla = {}; order.sla = {};
  await request(app).patch(`/${id}`).send({ status: 'work_in_progress', slaDeadline: '2026-11-01T00:00:00Z' }).expect(409);
  expect(incident.sla).toEqual({}); expect(incident.save).not.toHaveBeenCalled();
});

test('legacy agency status cannot activate protocol-9 work even without preparation metadata', async () => {
  order.maintenanceProtocol = 9;
  await request(app).patch(`/${id}`).send({ status: 'work_in_progress' }).expect(409);
  expect(incident.status).toBe('in_progress');
  expect(incident.agencyStatus).toBe('pending_procurement');
  expect(incident.sla).toEqual(original);
  expect(order.sla).toEqual(original);
  expect(incident.save).not.toHaveBeenCalled();
});
test.each(['sla', 'startedAt', 'deadline', 'pause', 'extend'])('%s injection cannot amend SLA', async key => {
  await request(app).patch(`/${id}`).send({ status: 'work_in_progress', [key]: 'unauthorized' }).expect(400);
  expect(incident.sla).toEqual(original);
});
test.each(['pending_external_processing', 'for_bidding', 'bidding_completed', 'awaiting_work_authorization'])('unsupported status %s cannot change clocks or authorize work', async status => {
  await request(app).patch(`/${id}`).send({ status }).expect(403);
  expect(incident.sla).toEqual(original); expect(incident.save).not.toHaveBeenCalled();
});
test('conflicting linked deadline requires reconciliation, not silent synchronization', async () => {
  order.sla.deadline = new Date('2026-10-05T00:00:00Z');
  await request(app).patch(`/${id}`).send({ status: 'work_in_progress' }).expect(409);
  expect(incident.sla).toEqual(original); expect(incident.save).not.toHaveBeenCalled();
});
test('failed persistence leaves all SLA data untouched', async () => {
  incident.save.mockRejectedValue(new Error('write failed'));
  await request(app).patch(`/${id}`).send({ status: 'work_in_progress' }).expect(500);
  expect(incident.sla).toEqual(original); expect(order.sla).toEqual(original);
});
test('a competing incident claim blocks progress before any SLA write', async () => {
  Incident.findOneAndUpdate.mockResolvedValue(null);
  await request(app).patch(`/${id}`).send({ status: 'work_in_progress' }).expect(409);
  expect(incident.save).not.toHaveBeenCalled(); expect(incident.sla).toEqual(original);
});

test.each(['citizen', 'barangay_tanod', 'barangay_official', 'repair_personnel', 'admin'])('%s has no agency SLA mutation authority', async actorRole => {
  role = actorRole;
  await request(app).patch(`/${id}`).send({ status: 'work_in_progress', slaDeadline: '2026-10-05T00:00:00Z' }).expect(403);
  expect(incident.sla).toEqual(original); expect(incident.save).not.toHaveBeenCalled();
});
