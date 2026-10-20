jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(null), notificationTemplates: {}
}));
jest.mock('../services/accountActivationService', () => ({
  createActivation: () => ({ tokenHash: 'test', expiresAt: new Date() }),
  deliverActivation: jest.fn().mockResolvedValue({ delivered: false })
}));
jest.mock('../services/evidenceService', () => ({
  getUploadedEvidenceFiles: jest.fn(() => []), processAndUploadEvidence: jest.fn()
}));
jest.mock('../services/storageService', () => ({
  getEvidenceUrl: jest.fn().mockResolvedValue('https://evidence.example.test/signed')
}));
const express = require('express');
const request = require('supertest');
const { Types: { ObjectId } } = require('mongoose');
const User = require('../models/User');
const Incident = require('../models/Incident');
const Inspection = require('../models/Inspection');
const WorkOrder = require('../models/WorkOrder');
const { createAccessToken } = require('../utils/authTokens');
const { canSignIn } = require('../utils/accountPolicy');
const { buildIncidentScope, canAccessIncident } = require('../services/jurisdictionService');

// Small query evaluator for these fixtures only, not a database substitute.
const get = (o, path) => path.split('.').reduce((v, k) => v?.[k], o);
const equal = (a, b) => a != null && b != null && String(a) === String(b);
const matches = (o, filter) => Object.entries(filter).every(([key, value]) => {
  if (key === '$and') return value.every(f => matches(o, f));
  if (key === '$or') return value.some(f => matches(o, f));
  const actual = get(o, key);
  if (value && typeof value === 'object' && !(value instanceof ObjectId)) {
    if ('$in' in value) return value.$in.some(v => equal(actual, v));
    if ('$exists' in value) return (actual !== undefined) === value.$exists;
    if ('$ne' in value) return !equal(actual, value.$ne);
    if ('$nin' in value) return !value.$nin.some(v => equal(actual, v));
  }
  return equal(actual, value);
});
const query = value => ({
  select() { return this; }, populate() { return this; }, sort() { return this; },
  limit() { return this; }, skip() { return this; }, lean() { return Promise.resolve(value); },
  then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); }
});
const document = fields => ({ ...fields, save: jest.fn(async function() { if (Number.isInteger(this.version)) this.version += 1; }),
  populate: jest.fn().mockResolvedValue(undefined), toObject() { return { ...this }; } });
let users, incidents, inspections, orders, tanod, worker, secretary, admin, incident, inspection, app;
const id = () => new ObjectId();
const account = (role, extra = {}) => ({ _id: id(), role, firstName: 'Test', lastName: 'Person',
  email: `${role}@example.test`, isActive: true, accountStatus: 'active', tokenVersion: 0, ...extra });
const auth = user => ({ Authorization: `Bearer ${createAccessToken(user)}` });

beforeAll(() => {
  process.env.JWT_SECRET = 'isolated-field-access-test-secret';
  app = express(); app.use(express.json());
  app.use('/incidents', require('../routes/incidentRoutes'));
  app.use('/work-orders', require('../routes/workOrderRoutes'));
  app.use('/users', require('../routes/userRoutes'));
  app.use((error, req, res, _next) => res.status(500).json({ message: error.message }));
});
beforeEach(() => {
  require('../services/evidenceService').getUploadedEvidenceFiles.mockReturnValue([]);
  require('../services/evidenceService').processAndUploadEvidence.mockReset();
  tanod = account('barangay_tanod', { barangay: 'Pantal' });
  worker = account('repair_personnel', { barangay: 'Pantal', repairOrganization: 'Test agency' });
  secretary = account('barangay_official', { barangay: 'Pantal' }); admin = account('admin');
  users = [tanod, worker, secretary, admin];
  inspection = document({ _id: id(), incident: null, tanod: tanod._id, secretary: secretary._id,
    barangay: 'Pantal', type: 'initial', status: 'assigned', version: 0, evidence: [] });
  incident = document({ _id: id(), reporter: id(), category: 'road', description: 'Infrastructure concern',
    reportNumber: 'TEST-1', status: 'tanod_assigned', jurisdiction: { barangay: 'Pantal' },
    location: { address: { barangay: 'Pantal' } }, images: [{ key: 'private' }],
    initialInspection: inspection._id, routing: { responsibleOrganization: 'Test agency' }, statusHistory: [] });
  inspection.incident = incident._id; incidents = [incident]; inspections = [inspection]; orders = [];
  jest.spyOn(User, 'findOne').mockImplementation(filter => query(users.find(user => matches(user, filter)) || null));
  jest.spyOn(User, 'findById').mockImplementation(i => query(users.find(u => equal(u._id, i)) || null));
  jest.spyOn(User, 'find').mockImplementation(f => query(users.filter(u => matches(u, f))));
  jest.spyOn(User, 'exists').mockResolvedValue(null);
  jest.spyOn(User, 'create').mockImplementation(async fields => new User(fields));
  jest.spyOn(Incident, 'find').mockImplementation(f => query(incidents.filter(i => matches(i, f))));
  jest.spyOn(Incident, 'findOne').mockImplementation(f => query(incidents.find(i => matches(i, f)) || null));
  jest.spyOn(Incident, 'findOneAndUpdate').mockImplementation(async (filter, update) => {
    const item = incidents.find(i => matches(i, filter));
    if (!item) return null;
    Object.assign(item, update.$set); return item;
  });
  jest.spyOn(Incident, 'updateOne').mockImplementation(async () => { delete incident.inspectionMutation; return { modifiedCount: 1 }; });
  jest.spyOn(Incident, 'countDocuments').mockImplementation(async f => incidents.filter(i => matches(i, f)).length);
  jest.spyOn(Inspection, 'create').mockImplementation(async fields => { const item = document({ _id: id(), version: 0, evidence: [], ...fields }); inspections.push(item); return item; });
  jest.spyOn(Inspection, 'find').mockImplementation(f => query(inspections.filter(i => matches(i, f))));
  jest.spyOn(Inspection, 'findOne').mockImplementation(f => query(inspections.find(i => matches(i, f)) || null));
  jest.spyOn(WorkOrder, 'find').mockImplementation(f => query(orders.filter(i => matches(i, f))));
});
afterEach(() => jest.restoreAllMocks());

test.each(['not_verified', 'unable_to_verify'])('Tanod may record %s without approving it', async result => {
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/submit`)
    .set(auth(tanod)).send({ findings: 'Inspection observations', result }).expect(200);
  expect(inspection.result).toBe(result);
  expect(inspection.status).toBe('submitted');
  expect(incident.routing.responsibleOrganization).toBe('Test agency');
});
test('submission requires an explicit result and retains existing evidence', async () => {
  inspection.evidence = [{ key: 'historical-photo' }];
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/submit`)
    .set(auth(tanod)).send({ findings: 'Inspection observations' }).expect(400);
  expect(inspection.save).not.toHaveBeenCalled();
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/submit`)
    .set(auth(tanod)).send({ findings: 'Inspection observations', result: 'verified' }).expect(200);
  expect(inspection.evidence).toEqual([{ key: 'historical-photo' }]);
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/submit`)
    .set(auth(tanod)).send({ findings: 'Repeated findings', result: 'verified' }).expect(404);
  expect(inspection.save).toHaveBeenCalledTimes(1);
});
test('completion submission requires compatible current work as well as current pointer', async () => {
  inspection.type = 'completion'; incident.completionInspection = inspection._id;
  incident.agencyStatus = 'work_completed'; incident.workOrder = id();
  const order = { _id: incident.workOrder, incident: incident._id, responsibleOrganization: 'Test agency', status: 'rework_required' };
  jest.spyOn(WorkOrder, 'findOne').mockImplementation(filter => query(matches(order, filter) ? order : null));
  const path = `/incidents/${incident._id}/inspections/${inspection._id}/submit`;
  await request(app).post(path).set(auth(tanod)).send({ findings: 'Completed work checked', result: 'verified' }).expect(404);
  expect(inspection.save).not.toHaveBeenCalled();
  order.status = 'completed';
  await request(app).post(path).set(auth(tanod)).send({ findings: 'Completed work checked', result: 'verified' }).expect(200);
  expect(inspection.type).toBe('completion'); expect(inspection.status).toBe('submitted');
});
test('correction consumes current submitted completion and preserves evidence', async () => {
  inspection.type = 'completion'; inspection.status = 'submitted'; inspection.evidence = [{ key: 'original' }];
  incident.completionInspection = inspection._id; incident.agencyStatus = 'work_completed'; incident.status = 'tanod_verified';
  await request(app).post(`/incidents/${incident._id}/agency-correction`).set(auth(secretary))
    .send({ reason: 'Defect persists' }).expect(200);
  expect(inspection.status).toBe('rejected');
  expect(inspection.evidence).toEqual([{ key: 'original' }]);
  expect(incident.agencyStatus).toBe('correction_required');
  await request(app).post(`/incidents/${incident._id}/agency-correction`).set(auth(secretary))
    .send({ reason: 'Duplicate request' }).expect(409);
  expect(inspection.save).toHaveBeenCalledTimes(1);
});

test('dedicated active Tanod signs in by policy, unsupported identities do not', () => {
  expect(canSignIn(tanod)).toBe(true);
  expect(canSignIn({ ...tanod, role: 'invented' })).toBe(false);
  expect(buildIncidentScope(tanod)).toEqual({ _id: null });
  expect(buildIncidentScope(worker)).toEqual({ _id: null });
  expect(canAccessIncident(worker, incident)).toBe(false);
});
test.each(['', '/history', '/sla'])('assigned Tanod reads incident surface %s', async suffix => {
  await request(app).get(`/incidents/${incident._id}${suffix}`).set(auth(tanod)).expect(200);
});
test('assigned list and incident evidence use restricted serialization', async () => {
  const res = await request(app).get('/incidents').set(auth(tanod)).expect(200);
  expect(res.body.data).toHaveLength(1);
  expect(res.body.data[0].images[0].url).toContain('/signed');
  expect(res.body.data[0].initialInspection).toBeUndefined();
});
test('own inspection queue and findings submission remain available', async () => {
  const res = await request(app).get('/incidents/my-inspections').set(auth(tanod)).expect(200);
  expect(res.body.data[0].incident._id).toBe(String(incident._id));
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/start`)
    .set(auth(tanod)).expect(200);
  expect(inspection.status).toBe('in_progress');
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/submit`)
    .set(auth(tanod)).send({ findings: 'Physical inspection recorded', result: 'verified' }).expect(200);
  expect(inspection.status).toBe('submitted');
  expect(incident.routing.responsibleOrganization).toBe('Test agency');
});
test.each(['otherTanod', 'wrongBarangay', 'stalePointer', 'missingTask', 'finishedTask', 'closedIncident', 'completionDuringCorrection'])('denies inspection access: %s', async reason => {
  if (reason === 'otherTanod') inspection.tanod = id();
  if (reason === 'wrongBarangay') tanod.barangay = 'Bonuan Gueset';
  if (reason === 'stalePointer') incident.initialInspection = id();
  if (reason === 'missingTask') inspections = [];
  if (reason === 'finishedTask') inspection.status = 'approved';
  if (reason === 'closedIncident') incident.status = 'closed';
  if (reason === 'completionDuringCorrection') {
    inspection.type = 'completion'; incident.completionInspection = inspection._id;
    incident.agencyStatus = 'correction_required';
  }
  await request(app).get(`/incidents/${incident._id}`).set(auth(tanod)).expect(404);
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/start`).set(auth(tanod)).expect(404);
});
test('historical own findings do not populate live incident or evidence', async () => {
  inspection.status = 'approved';
  const res = await request(app).get('/incidents/my-inspections').set(auth(tanod)).expect(200);
  expect(res.body.data[0].incident).toBeNull();
  expect(res.body.data[0].status).toBe('approved');
});
test('repair incident reads require current work-order, organization and reverse link', async () => {
  await request(app).get(`/incidents/${incident._id}`).set(auth(worker)).expect(404);
  const order = { _id: id(), incident: incident._id, assignedTo: worker._id,
    responsibleOrganization: worker.repairOrganization, assignmentState: 'accepted', jurisdiction: { barangay: 'Pantal' } };
  orders.push(order); incident.workOrder = order._id;
  await request(app).get(`/incidents/${incident._id}`).set(auth(worker)).expect(200);
  order.assignedTo = id();
  await request(app).get(`/incidents/${incident._id}/history`).set(auth(worker)).expect(404);
  order.assignedTo = worker._id; order.responsibleOrganization = 'Another agency';
  await request(app).get(`/incidents/${incident._id}/sla`).set(auth(worker)).expect(404);
  order.responsibleOrganization = worker.repairOrganization; incident.workOrder = id();
  await request(app).get(`/incidents/${incident._id}`).set(auth(worker)).expect(404);
});
test('same-barangay worker cannot use list, nearby or inspection evidence as alternate access', async () => {
  const list = await request(app).get('/incidents').set(auth(worker)).expect(200);
  expect(list.body.data).toEqual([]);
  const nearby = await request(app).get('/incidents/nearby?longitude=120.34&latitude=16.04').set(auth(worker)).expect(200);
  expect(nearby.body.data).toEqual([]);
  await request(app).get('/incidents/my-inspections').set(auth(worker)).expect(403);
  await request(app).get(`/incidents/${incident._id}/duplicate-candidates`).set(auth(tanod)).expect(403);
  await request(app).get('/work-orders').set(auth(tanod)).expect(403);
});
test('revoked Tanod token is rejected after account version changes', async () => {
  const headers = auth(tanod); tanod.tokenVersion += 1;
  await request(app).get('/incidents/my-inspections').set(headers).expect(401);
});
test('provisioning rejects a Tanod without barangay or with repair-only organization', async () => {
  const body = { firstName: 'Field', lastName: 'Verifier', email: 'verifier@example.test', role: 'barangay_tanod',
    position: 'Tanod', organization: 'Barangay Pantal', approvalAuthority: 'Official', approvalReference: 'Approved' };
  await request(app).post('/users/authorized').set(auth(admin)).send(body).expect(400);
  await request(app).post('/users/authorized').set(auth(admin)).send({ ...body, barangay: 'Pantal', repairOrganization: 'Test agency' }).expect(400);
});
test.each(['barangay_tanod', 'repair_personnel'])('suspended %s cannot access resources', async role => {
  const user = users.find(u => u.role === role); user.accountStatus = 'suspended';
  await request(app).get(`/incidents/${incident._id}`).set(auth(user)).expect(401);
});
test.each(['repair_personnel', 'citizen'])('%s cannot submit Tanod verification', async role => {
  const user = role === 'citizen' ? account(role) : worker; if (role === 'citizen') users.push(user);
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/submit`).set(auth(user)).send({}).expect(403);
});
test('Tanod cannot invoke repair mutation or Secretary approval', async () => {
  await request(app).post(`/work-orders/${id()}/start`).set(auth(tanod)).send({}).expect(403);
  await request(app).post('/users/authorized').set(auth(tanod)).send({}).expect(403);
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/review`).set(auth(tanod)).send({ decision: 'approve', categoryConfirmed: true }).expect(403);
});
test('unauthenticated evidence and malformed/incorrect task references are denied', async () => {
  await request(app).get('/incidents/my-inspections').expect(401);
  await request(app).get(`/incidents/${incident._id}`).expect(401);
  await request(app).post(`/incidents/${id()}/inspections/${inspection._id}/start`).set(auth(tanod)).expect(404);
  await request(app).post(`/incidents/${incident._id}/inspections/invalid/start`).set(auth(tanod)).expect(400);
});
test('Secretary can read scoped findings; administrator provisions Tanod without converting repair identity', async () => {
  await request(app).get(`/incidents/${incident._id}`).set(auth(secretary)).expect(200);
  const directory = await request(app).get('/incidents/tanod-personnel').set(auth(secretary)).expect(200);
  expect(directory.body.data.map(u => u.role)).toEqual(['barangay_tanod']);
  const res = await request(app).post('/users/authorized').set(auth(admin)).send({
    firstName: 'Field', lastName: 'Verifier', email: 'verifier@example.test', role: 'barangay_tanod',
    barangay: 'Pantal', position: 'Tanod', organization: 'Barangay Pantal',
    approvalAuthority: 'Authorized official', approvalReference: 'Offline approval reference'
  }).expect(201);
  expect(res.body.data.account.role).toBe('barangay_tanod');
  expect(worker.role).toBe('repair_personnel');
  expect(worker.repairOrganization).toBe('Test agency');
});


test('initial assignment cannot replace an active task or repeat its history', async () => {
  incident.status = 'submitted'; delete incident.initialInspection;
  jest.spyOn(User, 'findOne').mockResolvedValue(tanod);
  const create = jest.spyOn(Inspection, 'create').mockResolvedValue(inspection);
  const path = `/incidents/${incident._id}/tanod-inspections`;
  await request(app).post(path).set(auth(secretary)).send({ tanodId: tanod._id }).expect(201);
  await request(app).post(path).set(auth(secretary)).send({ tanodId: tanod._id }).expect(409);
  expect(create).toHaveBeenCalledTimes(1); expect(incident.statusHistory).toHaveLength(1);
});

test('completion assignment requires completed current work and cannot replace an active pointer', async () => {
  incident.status = 'provider_review'; incident.agencyStatus = 'work_completed'; incident.workOrder = id();
  jest.spyOn(User, 'findOne').mockResolvedValue(tanod);
  const order = { _id: incident.workOrder, incident: incident._id, responsibleOrganization: 'Test agency', status: 'in_progress' };
  jest.spyOn(WorkOrder, 'findOne').mockImplementation(filter => query(matches(order, filter) ? order : null));
  const create = jest.spyOn(Inspection, 'create').mockResolvedValue(inspection);
  const path = `/incidents/${incident._id}/completion-inspections`;
  await request(app).post(path).set(auth(secretary)).send({ tanodId: tanod._id }).expect(409);
  expect(create).not.toHaveBeenCalled(); order.status = 'completed';
  await request(app).post(path).set(auth(secretary)).send({ tanodId: tanod._id }).expect(201);
  await request(app).post(path).set(auth(secretary)).send({ tanodId: tanod._id }).expect(409);
  expect(create).toHaveBeenCalledTimes(1);
});

test('inspection uploads use one rollback-aware batch and retain returned evidence', async () => {
  const evidence = require('../services/evidenceService');
  const files = [{ buffer: Buffer.from('fixture1') }, { buffer: Buffer.from('fixture2') }];
  evidence.getUploadedEvidenceFiles.mockReturnValue(files);
  evidence.processAndUploadEvidence.mockResolvedValue({ images: [{ key: 'one' }, { key: 'two' }] });
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/submit`)
    .set(auth(tanod)).send({ findings: 'Observations', result: 'verified', category: 'untrusted' }).expect(200);
  expect(evidence.processAndUploadEvidence).toHaveBeenCalledTimes(1);
  expect(evidence.processAndUploadEvidence).toHaveBeenCalledWith(files, expect.objectContaining({ category: incident.category }));
  expect(inspection.evidence).toEqual([{ key: 'one' }, { key: 'two' }]);
});

test('upload failure advances neither inspection nor incident and retains reconciliation claim', async () => {
  const evidence = require('../services/evidenceService');
  evidence.getUploadedEvidenceFiles.mockReturnValue([{ buffer: Buffer.from('fixture') }]);
  evidence.processAndUploadEvidence.mockRejectedValue(new Error('Storage unavailable'));
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/submit`)
    .set(auth(tanod)).send({ findings: 'Observations', result: 'verified' }).expect(500);
  expect(inspection.save).not.toHaveBeenCalled(); expect(incident.save).not.toHaveBeenCalled();
  expect(incident.inspectionMutation.token).toBeTruthy(); expect(incident.statusHistory).toHaveLength(0);
});
test('failure after inspection persistence never reports a completed transition or permits replay', async () => {
  incident.save.mockRejectedValue(new Error('Incident write failed after inspection save'));
  const path = `/incidents/${incident._id}/inspections/${inspection._id}/submit`;
  await request(app).post(path).set(auth(tanod)).send({ findings: 'Observations', result: 'verified' }).expect(500);
  expect(inspection.save).toHaveBeenCalledTimes(1);
  expect(incident.inspectionMutation.token).toBeTruthy();
  await request(app).post(path).set(auth(tanod)).send({ findings: 'Retry', result: 'verified' }).expect(409);
  expect(inspection.save).toHaveBeenCalledTimes(1);
});


test('explicit acknowledgment records receipt once without starting or approving inspection', async () => {
  const path = `/incidents/${incident._id}/inspections/${inspection._id}/acknowledge`;
  await request(app).post(path).set(auth(tanod)).send({ expectedVersion: 0 }).expect(200);
  expect(inspection.acknowledgedBy).toEqual(tanod._id); expect(inspection.acknowledgedAt).toBeInstanceOf(Date);
  expect(inspection.status).toBe('assigned'); expect(incident.status).toBe('tanod_assigned');
  await request(app).post(path).set(auth(tanod)).send({ expectedVersion: 0 }).expect(409);
  expect(inspection.save).toHaveBeenCalledTimes(1);
});

test('reassignment preserves original findings/evidence and revokes former assignee actions', async () => {
  const replacement = account('barangay_tanod', { barangay: 'Pantal' }); users.push(replacement);
  inspection.findings = 'Earlier draft'; inspection.evidence = [{ key: 'old-photo' }];
  jest.spyOn(User, 'findOne').mockImplementation(filter => query(users.find(user => matches(user, filter)) || null));
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/reassign`).set(auth(secretary))
    .send({ expectedVersion: 0, tanodId: replacement._id, reason: 'Original assignee unavailable' }).expect(201);
  expect(inspection.status).toBe('replaced'); expect(inspection.findings).toBe('Earlier draft'); expect(inspection.evidence).toEqual([{ key: 'old-photo' }]);
  expect(String(incident.initialInspection)).not.toBe(String(inspection._id));
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/start`).set(auth(tanod)).expect(404);
  await request(app).get(`/incidents/${incident._id}`).set(auth(tanod)).expect(404);
  await request(app).get(`/incidents/${incident._id}`).set(auth(replacement)).expect(200);
  const history = await request(app).get(`/incidents/${incident._id}/inspections`).set(auth(secretary)).expect(200);
  expect(history.body.data).toHaveLength(2); expect(history.body.data[0].evidence[0].key).toBeUndefined();
});

test.each(['wrongVersion', 'sameAssignee', 'suspended', 'wrongBarangay', 'repairRole'])('unsafe reassignment %s is rejected without replacing current pointer', async scenario => {
  const replacement = account('barangay_tanod', { barangay: 'Pantal' });
  if (scenario === 'suspended') replacement.accountStatus = 'suspended';
  if (scenario === 'wrongBarangay') replacement.barangay = 'Lucao';
  if (scenario === 'repairRole') replacement.role = 'repair_personnel';
  users.push(replacement);
  jest.spyOn(User, 'findOne').mockImplementation(filter => query(users.find(user => matches(user, filter)) || null));
  const response = await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/reassign`).set(auth(secretary))
    .send({ expectedVersion: scenario === 'wrongVersion' ? 99 : 0, tanodId: scenario === 'sameAssignee' ? tanod._id : replacement._id, reason: 'Documented reassignment' });
  expect([400, 409]).toContain(response.status); expect(incident.initialInspection).toEqual(inspection._id); expect(Inspection.create).not.toHaveBeenCalled();
});

test('category correction preserves original selection and invalidates a stale approval version', async () => {
  inspection.status = 'submitted'; inspection.result = 'verified'; incident.status = 'tanod_verified'; delete incident.routing;
  await request(app).patch(`/incidents/${incident._id}/inspections/${inspection._id}/category`).set(auth(secretary))
    .send({ expectedVersion: 0, category: 'drainage', reason: 'Field findings identify drainage damage' }).expect(200);
  expect(incident.originalCategory).toBe('road'); expect(incident.category).toBe('drainage');
  expect(incident.categoryHistory[0]).toMatchObject({ previous: 'road', category: 'drainage', changedBy: secretary._id });
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/review`).set(auth(secretary))
    .send({ expectedVersion: 0, decision: 'approve', categoryConfirmed: true }).expect(409);
  expect(inspection.status).toBe('submitted'); expect(incident.routing).toBeUndefined();
});

test('Tanod clarification creates an immutable follow-up task and a separate later Secretary decision', async () => {
  inspection.status = 'submitted'; inspection.result = 'verified'; inspection.findings = 'Original findings'; incident.status = 'tanod_verified';
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/review`).set(auth(secretary))
    .send({ expectedVersion: 0, decision: 'clarification', recipient: 'tanod', notes: 'Check the affected drain cover' }).expect(200);
  const followup = inspections.find(item => String(item._id) === String(incident.initialInspection));
  expect(inspection.status).toBe('clarification_required'); expect(inspection.findings).toBe('Original findings');
  expect(followup.parentInspection).toEqual(inspection._id); expect(incident.status).toBe('clarification_required');
  await request(app).post(`/incidents/${incident._id}/inspections/${followup._id}/start`).set(auth(tanod)).send({ expectedVersion: 0 }).expect(200);
  await request(app).post(`/incidents/${incident._id}/inspections/${followup._id}/submit`).set(auth(tanod))
    .send({ expectedVersion: 1, result: 'not_verified', findings: 'No defect could be confirmed' }).expect(200);
  expect(incident.status).toBe('tanod_verified'); expect(followup.status).toBe('submitted');
  await request(app).post(`/incidents/${incident._id}/inspections/${followup._id}/review`).set(auth(secretary))
    .send({ expectedVersion: 2, decision: 'approve', categoryConfirmed: true }).expect(409);
});

test('only the citizen reporter can reply to a current addressed clarification', async () => {
  const owner = account('citizen'), stranger = account('citizen'); users.push(owner, stranger); incident.reporter = owner._id;
  inspection.status = 'submitted'; inspection.result = 'verified'; inspection.findings = 'Original physical findings'; inspection.evidence = [{ key: 'original-evidence' }]; incident.status = 'tanod_verified';
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/review`).set(auth(secretary))
    .send({ expectedVersion: 0, decision: 'clarification', recipient: 'citizen', notes: 'Which side of the street is affected?' }).expect(200);
  const path = `/incidents/${incident._id}/clarification-response`;
  await request(app).post(path).set(auth(stranger)).send({ expectedVersion: 1, response: 'Unauthorized context' }).expect(404);
  await request(app).post(path).set(auth(owner)).send({ expectedVersion: 1, response: 'The north side near the crossing', result: 'not_verified', category: 'gas' }).expect(200);
  const followup = inspections.find(item => String(item._id) === String(incident.initialInspection));
  expect(followup.findings).toBe('Original physical findings'); expect(followup.result).toBe('verified'); expect(followup.evidence).toEqual([{ key: 'original-evidence' }]);
  expect(incident.category).toBe('road'); expect(incident.status).toBe('tanod_verified'); expect(inspection.status).toBe('clarification_required');
  expect(incident.clarificationResponses[0].actor).toEqual(owner._id);
  await request(app).post(path).set(auth(owner)).send({ expectedVersion: 1, response: 'Duplicate response' }).expect(409);
});

test('concurrent reassignment attempts cannot both become current', async () => {
  const replacement = account('barangay_tanod', { barangay: 'Pantal' }); users.push(replacement);
  jest.spyOn(User, 'findOne').mockResolvedValue(replacement);
  let entered, release;
  const ready = new Promise(resolve => { entered = resolve; });
  const pending = new Promise(resolve => { release = resolve; });
  incident.save.mockImplementation(async () => { entered(); await pending; });
  const path = `/incidents/${incident._id}/inspections/${inspection._id}/reassign`;
  const first = request(app).post(path).set(auth(secretary)).send({ expectedVersion: 0, tanodId: replacement._id, reason: 'First reassignment' }).then(response => response);
  await ready;
  await request(app).post(path).set(auth(secretary)).send({ expectedVersion: 0, tanodId: replacement._id, reason: 'Stale competing reassignment' }).expect(409);
  release(); expect((await first).status).toBe(201);
  expect(Inspection.create).toHaveBeenCalledTimes(1); expect(incident.statusHistory).toHaveLength(1);
});
test('partial reassignment failure retains claim and never reports successful handoff', async () => {
  const replacement = account('barangay_tanod', { barangay: 'Pantal' }); users.push(replacement);
  jest.spyOn(User, 'findOne').mockResolvedValue(replacement);
  incident.save.mockRejectedValue(new Error('Pointer persistence failed'));
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/reassign`).set(auth(secretary))
    .send({ expectedVersion: 0, tanodId: replacement._id, reason: 'Authorized reassignment' }).expect(500);
  expect(incident.inspectionMutation.token).toBeTruthy(); expect(Inspection.create).toHaveBeenCalledTimes(1);
});
test.each(['reject', 'clarification'])('%s requires a clear reason without changing findings', async decision => {
  inspection.status = 'submitted'; inspection.result = 'verified'; incident.status = 'tanod_verified'; delete incident.routing;
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/review`).set(auth(secretary))
    .send({ decision, recipient: 'tanod', expectedVersion: 0 }).expect(400);
  expect(inspection.save).not.toHaveBeenCalled();
});
test('approval requires explicit category confirmation and remains independent from submission', async () => {
  inspection.status = 'submitted'; inspection.result = 'verified'; incident.status = 'tanod_verified'; delete incident.routing;
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/review`).set(auth(secretary)).send({ decision: 'approve', expectedVersion: 0 }).expect(400);
  expect(inspection.status).toBe('submitted'); expect(inspection.save).not.toHaveBeenCalled();
});
test('optional delivery failure does not undo a durable acknowledgment or strand its claim', async () => {
  require('../services/notificationService').createNotification.mockRejectedValueOnce(new Error('Delivery unavailable'));
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/acknowledge`).set(auth(tanod)).send({ expectedVersion: 0 }).expect(200);
  expect(inspection.acknowledgedAt).toBeInstanceOf(Date); expect(incident.inspectionMutation).toBeUndefined();
});

test('confirmed corrected category cannot establish ownership from category alone without authorizing work or restarting SLA', async () => {
  users.push(account('utility_provider', { utilityCompany: 'Dagupan City Water District / Pamana Water Dagupan' }));
  inspection.status = 'submitted'; inspection.result = 'verified'; incident.status = 'tanod_verified'; delete incident.routing;
  incident.sla = { deadline: new Date('2026-10-30T00:00:00Z'), startedAt: new Date('2026-10-20T00:00:00Z'), remindersSent: 2 };
  const sla = { ...incident.sla };
  await request(app).patch(`/incidents/${incident._id}/inspections/${inspection._id}/category`).set(auth(secretary))
    .send({ expectedVersion: 0, category: 'water', reason: 'Confirmed water infrastructure issue' }).expect(200);
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/review`).set(auth(secretary))
    .send({ expectedVersion: 1, decision: 'approve', categoryConfirmed: true }).expect(200);
  expect(incident.originalCategory).toBe('road'); expect(incident.routing.responsibleOrganization).toBeUndefined(); expect(incident.routingReview.reason).toBe('unknown_ownership');
  expect(incident.agencyStatus).toBe('not_routed'); expect(incident.sla).toEqual(sla); expect(incident.workOrder).toBeUndefined();
});

test('complete isolated assignment, acknowledgment, submission and separate Secretary approval flow', async () => {
  users.push(account('utility_provider', { utilityCompany: 'Dagupan City Engineering Office' }));
  inspections = []; incident.status = 'submitted'; delete incident.initialInspection; delete incident.routing;
  const notifications = require('../services/notificationService').createNotification; notifications.mockClear();
  await request(app).post(`/incidents/${incident._id}/tanod-inspections`).set(auth(secretary))
    .send({ tanodId: tanod._id, instructions: 'Verify the reported road damage' }).expect(201);
  const active = inspections[0];
  const prefix = `/incidents/${incident._id}/inspections/${active._id}`;
  await request(app).post(`${prefix}/acknowledge`).set(auth(tanod)).send({ expectedVersion: 0 }).expect(200);
  expect(incident.status).toBe('tanod_assigned');
  await request(app).post(`${prefix}/start`).set(auth(tanod)).send({ expectedVersion: 1 }).expect(200);
  await request(app).post(`${prefix}/submit`).set(auth(tanod)).send({ expectedVersion: 2, result: 'verified', findings: 'Physical road damage documented' }).expect(200);
  expect(active.status).toBe('submitted'); expect(incident.status).toBe('tanod_verified'); expect(incident.routing).toBeUndefined();
  await request(app).post(`${prefix}/review`).set(auth(secretary)).send({ expectedVersion: 3, decision: 'approve', categoryConfirmed: true }).expect(200);
  expect(active.status).toBe('approved'); expect(incident.status).toBe('tanod_verified'); expect(incident.agencyStatus).toBe('not_routed');
  const count = notifications.mock.calls.length;
  await request(app).post(`${prefix}/review`).set(auth(secretary)).send({ expectedVersion: 3, decision: 'approve', categoryConfirmed: true }).expect(409);
  expect(notifications.mock.calls).toHaveLength(count); expect(incident.workOrder).toBeUndefined();
});

test('approval without an eligible mapped agency stays approved and awaits routing review', async () => {
  inspection.status = 'submitted'; inspection.result = 'verified'; incident.status = 'tanod_verified'; delete incident.routing;
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/review`).set(auth(secretary))
    .send({ expectedVersion: 0, decision: 'approve', categoryConfirmed: true }).expect(200);
  expect(inspection.status).toBe('approved'); expect(incident.status).toBe('tanod_verified');
  expect(incident.agencyStatus).toBe('not_routed'); expect(incident.routing.responsibleOrganization).toBeUndefined();
});


test('approved configured routing persists provenance and notifies only receiving organization', async () => {
  const provider = account('utility_provider', { utilityCompany: 'Configured test organization' }); users.push(provider);
  const rule = { ruleId: 'test-rule', version: 2, agencyId: 'test-agency', organization: provider.utilityCompany, category: 'road', assetType: 'test-road', ownerId: 'test-owner', barangays: ['Pantal'], city: 'Dagupan City', active: true, participating: true, approvedBy: secretary._id, approvalReference: 'test-only', effectiveFrom: new Date('2020-01-01') };
  jest.spyOn(require('../models/AgencyRoutingRule'), 'find').mockReturnValue(query([rule]));
  incident.jurisdiction = { barangay: 'Pantal', city: 'Dagupan City' };
  incident.routingAsset = { assetType: 'test-road', ownerId: 'test-owner', verifiedBy: secretary._id, verifiedAt: new Date(), verificationReference: 'test-only' };
  inspection.status = 'submitted'; inspection.result = 'verified'; incident.status = 'tanod_verified'; delete incident.routing;
  const notifications = require('../services/notificationService').createNotification; notifications.mockClear();
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/review`).set(auth(secretary)).send({ expectedVersion: 0, decision: 'approve', categoryConfirmed: true }).expect(200);
  expect(incident.routing).toMatchObject({ responsibleOrganization: provider.utilityCompany, agencyId: 'test-agency', ruleId: 'test-rule', policyVersion: 2 });
  expect(incident.routing.history.at(-1)).toMatchObject({ agencyId: 'test-agency', policyVersion: 2 });
  expect(inspection.status).toBe('approved'); expect(incident.status).toBe('provider_assigned'); expect(incident.workOrder).toBeUndefined();
  expect(notifications.mock.calls.some(([event]) => String(event.recipient) === String(provider._id) && event.type === 'agency_report_routed')).toBe(true);
});


test.each(['citizen', 'barangay_tanod', 'repair_personnel', 'utility_provider', 'admin'])('routing exception queue denies %s', async role => {
  const user = account(role, { barangay: 'Pantal' }); users.push(user);
  await request(app).get('/incidents/agency-exceptions').set(auth(user)).expect(403);
});
test('exception queue exposes approved same-barangay records through a safe projection', async () => {
  delete incident.routing; incident.status = 'tanod_verified'; incident.agencyStatus = 'not_routed';
  incident.initialInspection = { ...inspection, status: 'approved', reviewedAt: new Date(), evidence: [{ key: 'secret-key' }] };
  incident.routingReview = { reason: 'unknown_ownership', candidates: [] };
  const response = await request(app).get('/incidents/agency-exceptions').set(auth(secretary)).expect(200);
  expect(response.body.data.incidents).toHaveLength(1);
  expect(response.body.data.incidents[0]).toMatchObject({ reason: 'unknown_ownership', decisionAuthority: 'policy_pending' });
  expect(JSON.stringify(response.body)).not.toContain('secret-key'); expect(response.body.data.agencies).toBeUndefined();
  incident.initialInspection.status = 'submitted';
  const unapproved = await request(app).get('/incidents/agency-exceptions').set(auth(secretary)).expect(200);
  expect(unapproved.body.data.incidents).toHaveLength(0);
});
test('approval cannot silently transfer an existing agency assignment', async () => {
  inspection.status = 'submitted'; inspection.result = 'verified'; incident.status = 'tanod_verified';
  await request(app).post(`/incidents/${incident._id}/inspections/${inspection._id}/review`).set(auth(secretary)).send({ expectedVersion: 0, decision: 'approve', categoryConfirmed: true }).expect(409);
  expect(incident.routing.responsibleOrganization).toBe('Test agency'); expect(inspection.save).not.toHaveBeenCalled();
});


const agencyFixture = () => {
  const provider = account('utility_provider', { utilityCompany: 'Test agency' }); users.push(provider);
  incident.status = 'provider_assigned'; incident.agencyStatus = 'not_routed';
  incident.routing = { responsibleOrganization: 'Test agency', agencyId: 'test-agency', ruleId: 'test-rule', policyVersion: 1, routedAt: new Date() };
  incident.routingReview = { outcome: 'matched' }; incident.categoryConfirmedBy = secretary._id; incident.categoryConfirmedAt = new Date();
  inspection.status = 'approved'; inspection.result = 'verified'; inspection.reviewedBy = secretary._id; inspection.reviewedAt = new Date();
  return provider;
};
const preparationRequest = (provider, body) => request(app).post(`/incidents/${incident._id}/agency-preparation`).set(auth(provider)).send(body);
const validAssessment = { operation: 'assess', expectedVersion: 1, outcome: 'routine', notes: 'Observed damage', requirements: 'Surface repair', resources: 'Available crew', approach: 'Routine patching' };
test('agency receives, acknowledges and assesses routine maintenance without work or SLA changes', async () => {
  const provider = agencyFixture(); incident.sla = { deadline: new Date('2026-11-01'), remindersSent: 2 }; const sla = { ...incident.sla };
  await preparationRequest(provider, { operation: 'acknowledge', expectedVersion: 0, sla: { deadline: null }, priority: 'critical' }).expect(200);
  expect(incident.agencyPreparation.acknowledgedBy).toEqual(provider._id); expect(incident.agencyPreparation.acknowledgedAt).toBeInstanceOf(Date);
  await preparationRequest(provider, validAssessment).expect(200);
  expect(incident.agencyStatus).toBe('routine_pending_authorization'); expect(incident.agencyPreparation.assessments).toHaveLength(1);
  expect(incident.sla).toEqual(sla); expect(incident.workOrder).toBeUndefined(); expect(inspection.status).toBe('approved'); expect(incident.category).toBe('road');
  await preparationRequest(provider, { operation: 'authorize', expectedVersion: 2, reference: 'FAKE' }).expect(409);
  await preparationRequest(provider, { operation: 'ready', expectedVersion: 2 }).expect(409);
  await request(app).patch(`/incidents/${incident._id}/agency-status`).set(auth(provider)).send({ status: 'work_in_progress' }).expect(409);
  await request(app).post(`/incidents/${incident._id}/work-orders`).set(auth(provider)).send({ title: 'Attempted repair', description: 'Attempted bypass', priority: 'high' }).expect(409);
  const own = await request(app).get(`/incidents/${incident._id}`).set(auth(provider)).expect(200);
  expect(own.body.data.agencyPreparation.revision).toBe(2);
  const official = await request(app).get(`/incidents/${incident._id}`).set(auth(secretary)).expect(200);
  expect(official.body.data.agencyPreparation).toBeUndefined();
});
test('external milestones preserve history, deadline and never authorize bidding completion', async () => {
  const provider = agencyFixture(); incident.sla = { deadline: new Date('2026-11-01') }; const deadline = incident.sla.deadline;
  await preparationRequest(provider, { operation: 'acknowledge', expectedVersion: 0 }).expect(200);
  await preparationRequest(provider, { ...validAssessment, outcome: 'external', processType: 'External funding review' }).expect(200);
  for (const [index, milestone] of ['pending_funding', 'for_bidding', 'bidding_completed', 'awaiting_work_authorization'].entries()) {
    await preparationRequest(provider, { operation: 'external', expectedVersion: index + 2, milestone, remarks: 'Outside process update', reference: 'TEST-REFERENCE' }).expect(200);
  }
  expect(incident.agencyPreparation.externalHistory).toHaveLength(4); expect(incident.agencyPreparation.authorization).toBeUndefined();
  expect(incident.workOrder).toBeUndefined(); expect(incident.sla.deadline).toEqual(deadline);
  await preparationRequest(provider, { operation: 'external', expectedVersion: 2, milestone: 'for_bidding', remarks: 'Stale update' }).expect(409);
});
test('responsibility dispute preserves organization and enters scoped review queue', async () => {
  const provider = agencyFixture();
  await preparationRequest(provider, { operation: 'acknowledge', expectedVersion: 0 }).expect(200);
  await preparationRequest(provider, { ...validAssessment, outcome: 'responsibility_review' }).expect(200);
  expect(incident.routing.responsibleOrganization).toBe('Test agency'); expect(incident.routingReview.reason).toBe('agency_responsibility_dispute');
  // Fixture population at the query boundary, not a real Mongo populate.
  incident.initialInspection = inspection;
  const response = await request(app).get('/incidents/agency-exceptions').set(auth(secretary)).expect(200);
  expect(response.body.data.incidents[0].responsibleOrganization).toBe('Test agency');
  await preparationRequest(provider, { operation: 'ready', expectedVersion: 2 }).expect(409);
});
test.each(['citizen', 'barangay_tanod', 'repair_personnel', 'barangay_official', 'admin'])('agency preparation denies %s', async role => {
  agencyFixture(); const user = account(role, { barangay: 'Pantal' }); users.push(user);
  await preparationRequest(user, { operation: 'acknowledge', expectedVersion: 0 }).expect(403);
});
test('wrong agency and suspended account cannot acknowledge', async () => {
  const provider = agencyFixture();
  const unrelated = account('utility_provider', { utilityCompany: 'Other agency' }); users.push(unrelated);
  await preparationRequest(unrelated, { operation: 'acknowledge', expectedVersion: 0 }).expect(404);
  provider.accountStatus = 'suspended'; provider.isActive = false;
  const result = await preparationRequest(provider, { operation: 'acknowledge', expectedVersion: 0 }); expect([401, 403]).toContain(result.status);
  expect(incident.agencyPreparation).toBeUndefined();
});
test.each(['approval', 'routing', 'clarification', 'work'])('missing prerequisite %s blocks preparation', async missing => {
  const provider = agencyFixture();
  if (missing === 'approval') inspection.status = 'submitted';
  if (missing === 'routing') incident.routingReview.outcome = 'review_required';
  if (missing === 'clarification') incident.verificationClarification = { requestedAt: new Date() };
  if (missing === 'work') incident.workOrder = id();
  await preparationRequest(provider, { operation: 'acknowledge', expectedVersion: 0 }).expect(409);
  expect(incident.agencyPreparation).toBeUndefined();
});
test('overlapping receipt requests append once and completed retry does not notify again', async () => {
  const provider = agencyFixture(); const notifications = require('../services/notificationService').createNotification; notifications.mockClear();
  const results = await Promise.all([preparationRequest(provider, { operation: 'acknowledge', expectedVersion: 0 }), preparationRequest(provider, { operation: 'acknowledge', expectedVersion: 0 })]);
  expect(results.map(item => item.status).sort()).toEqual([200, 409]); expect(incident.agencyPreparation.history).toHaveLength(1);
  const count = notifications.mock.calls.length;
  await preparationRequest(provider, { operation: 'acknowledge', expectedVersion: 0 }).expect(409); expect(notifications.mock.calls).toHaveLength(count);
});
test('preparation persistence failure holds claim for reconciliation', async () => {
  const provider = agencyFixture(); incident.save.mockRejectedValueOnce(new Error('Persistence unavailable'));
  await preparationRequest(provider, { operation: 'acknowledge', expectedVersion: 0 }).expect(500);
  expect(incident.inspectionMutation.token).toBeTruthy();
  await preparationRequest(provider, { operation: 'acknowledge', expectedVersion: 0 }).expect(409);
});


test('new-protocol work orders cannot bypass policy through assignment, acceptance or start', async () => {
  jest.spyOn(WorkOrder, 'findOne').mockImplementation(filter => query(orders.find(order => matches(order, filter)) || null));
  const provider = agencyFixture(); const order = document({ _id: id(), incident: incident._id, maintenanceProtocol: 9, responsibleOrganization: provider.utilityCompany,
    assignedTo: worker._id, assignmentState: 'accepted', status: 'accepted', jurisdiction: { barangay: 'Pantal' }, assignments: [] }); orders.push(order);
  await request(app).post(`/work-orders/${order._id}/assign`).set(auth(provider)).send({ assigneeId: worker._id, version: 0 }).expect(409);
  await request(app).post(`/work-orders/${order._id}/accept`).set(auth(worker)).send({ version: 0 }).expect(409);
  await request(app).post(`/work-orders/${order._id}/start`).set(auth(worker)).send({ version: 0 }).expect(409);
  await request(app).post('/work-orders').set(auth(provider)).send({ incident: incident._id }).expect(409);
  expect(order.save).not.toHaveBeenCalled(); expect(order.status).toBe('accepted');
});


test('citizen sees safe own agency status without private assessment remarks or staff records', async () => {
  const provider = agencyFixture(); const citizen = account('citizen', { _id: incident.reporter }); users.push(citizen);
  await preparationRequest(provider, { operation: 'acknowledge', expectedVersion: 0 }).expect(200);
  await preparationRequest(provider, { ...validAssessment, notes: 'PRIVATE INTERNAL ASSESSMENT' }).expect(200);
  const response = await request(app).get(`/incidents/${incident._id}`).set(auth(citizen)).expect(200);
  expect(response.body.data.agencyStatus).toBe('routine_pending_authorization');
  expect(response.body.data.agencyPreparation).toBeUndefined(); expect(JSON.stringify(response.body)).not.toContain('PRIVATE INTERNAL ASSESSMENT');
});
test('overlapping assessments cannot overwrite the winning version', async () => {
  const provider = agencyFixture(); await preparationRequest(provider, { operation: 'acknowledge', expectedVersion: 0 }).expect(200);
  const responses = await Promise.all([preparationRequest(provider, validAssessment), preparationRequest(provider, { ...validAssessment, outcome: 'clarification' })]);
  expect(responses.map(item => item.status).sort()).toEqual([200, 409]); expect(incident.agencyPreparation.assessments).toHaveLength(1);
  expect(incident.agencyPreparation.revision).toBe(2);
});


test('restored agency staffing list contains only own repair personnel and safe fields', async () => {
  const provider = account('utility_provider', { utilityCompany: 'Test agency' }); users.push(provider);
  users.push(account('repair_personnel', { repairOrganization: 'Other agency' }));
  const result = await request(app).get('/users/repair-personnel').set(auth(provider)).expect(200);
  expect(result.body.data.map(item => item.id)).toEqual([String(worker._id)]);
  expect(result.body.data[0]).not.toHaveProperty('activationTokenHash'); expect(result.body.data[0].role).toBe('repair_personnel');
});
test('restored provider staffing creation enforces activation and rejects organization overrides', async () => {
  const provider = account('utility_provider', { utilityCompany: 'Test agency' }); users.push(provider);
  const body = { firstName: 'Repair', lastName: 'Worker', email: 'new-repair@example.test', phone: '09123456789', repairAccountType: 'individual', repairTeam: '' };
  await request(app).post('/users/repair-personnel').set(auth(provider)).send({ ...body, repairOrganization: 'Other agency' }).expect(400);
  const result = await request(app).post('/users/repair-personnel').set(auth(provider)).send(body).expect(201);
  expect(result.body.data.account).toMatchObject({ role: 'repair_personnel', repairOrganization: 'Test agency', accountStatus: 'pending_activation', isActive: false });
  await request(app).post('/users/repair-personnel').set(auth(secretary)).send(body).expect(403);
});
test.each(['put', 'patch', 'post'])('restored staffing mutation %s cannot target another organization', async method => {
  const provider = account('utility_provider', { utilityCompany: 'Other agency' }); users.push(provider);
  const paths = { put: '', patch: '/status', post: '/activation' };
  const body = method === 'put' ? { firstName: 'Repair', lastName: 'Worker', phone: '09123456789', repairAccountType: 'individual', repairTeam: '', version: 0 } : method === 'patch' ? { version: 0, status: 'suspended', reason: 'Unapproved attempt' } : { version: 0 };
  await request(app)[method](`/users/repair-personnel/${worker._id}${paths[method]}`).set(auth(provider)).send(body).expect(404);
});
