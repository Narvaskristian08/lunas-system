// Opt-in, owned loopback-only infrastructure. Never point this at application data.
jest.mock('axios', () => ({ post: jest.fn(async () => ({ data: { success: true } })) }));
const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const User = require('../models/User');
const Incident = require('../models/Incident');
const Inspection = require('../models/Inspection');
const WorkOrder = require('../models/WorkOrder');
const Notification = require('../models/Notification');
const Rule = require('../models/AgencyRoutingRule');
const { createAccessToken } = require('../utils/authTokens');
const { getOperationalReport } = require('../services/operationalReportService');
const { deliverNotification } = require('../services/notificationDeliveryService');
const { withInspectionMutation } = require('../services/inspectionMutation');
const integration = process.env.LUNAS_INTEGRATION_MONGODB_URI ? describe : describe.skip;
integration('disposable native MongoDB system integration', () => {
  const dbName = `lunas_system_test_${process.pid}_${Date.now()}`;
  let app; let actors; let tokens;
  const oldEnv = { ...process.env };
  beforeAll(async () => {
    const uri = process.env.LUNAS_INTEGRATION_MONGODB_URI;
    if (!/^mongodb:\/\/127\.0\.0\.1:\d+\/$/.test(uri)) throw new Error('Owned loopback-only database required');
    process.env.JWT_SECRET = 'isolated-system-access'; process.env.JWT_REFRESH_SECRET = 'isolated-system-refresh';
    process.env.PRIVACY_REDACTION_ENABLED = 'false'; process.env.SLA_AUTOMATION_ENABLED = 'false';
    delete process.env.ONESIGNAL_APP_ID; delete process.env.ONESIGNAL_REST_API_KEY;
    await mongoose.connect(uri, { dbName });
    await Promise.all([User, Incident, Inspection, WorkOrder, Notification, Rule].map(model => model.init()));
    app = express(); app.use(express.json()); app.use('/incidents', require('../routes/incidentRoutes')); app.use('/work-orders', require('../routes/workOrderRoutes'));
    app.use('/notifications', require('../routes/notificationRoutes')); app.use('/reports', require('../routes/operationalReportRoutes')); app.use(require('../middleware/errorHandler'));
  });
  beforeEach(async () => {
    for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({});
    actors = {}; tokens = {};
    for (const [name, role, extra] of [
      ['citizen', 'citizen', {}], ['other', 'citizen', {}], ['secretary', 'barangay_official', { barangay: 'Pantal' }],
      ['tanod', 'barangay_tanod', { barangay: 'Pantal' }], ['agency', 'utility_provider', { utilityCompany: 'Synthetic Agency A' }],
      ['foreign', 'utility_provider', { utilityCompany: 'Synthetic Agency B' }], ['repair', 'repair_personnel', { repairOrganization: 'Synthetic Agency A' }], ['admin', 'admin', {}]
    ]) {
      actors[name] = await User.create({ firstName: 'Synthetic', lastName: name, email: `${name}@integration.test`, phone: '09123456789', password: 'IntegrationOnly2026!', role, isActive: true, isVerified: true, ...extra });
      tokens[name] = createAccessToken(actors[name]);
    }
  });
  afterAll(async () => { if (mongoose.connection.db?.databaseName === dbName && dbName.startsWith('lunas_system_test_')) await mongoose.connection.dropDatabase(); await mongoose.disconnect(); process.env = oldEnv; });
  const call = (method, path, actor = 'secretary') => request(app)[method](path).set('Authorization', `Bearer ${tokens[actor]}`);
  const incident = extra => Incident.create({ reporter: actors.citizen._id, category: 'road', originalCategory: 'road', description: 'Synthetic integration-only incident', location: { type: 'Point', coordinates: [120.34, 16.04], address: { barangay: 'Pantal', city: 'Dagupan City' } }, jurisdiction: { barangay: 'Pantal', city: 'Dagupan City' }, ...extra });
  test('native unique indexes exist and concurrent duplicate references have exactly one winner', async () => {
    expect((await Incident.collection.indexes()).some(index => index.unique && index.key.reportNumber)).toBe(true);
    expect((await WorkOrder.collection.indexes()).some(index => index.unique && index.key.incident)).toBe(true);
    expect((await Notification.collection.indexes()).some(index => index.unique && index.key.idempotencyKey)).toBe(true);
    const outcomes = await Promise.allSettled([incident({ reportNumber: 'DUPLICATE-TEST' }), incident({ reportNumber: 'DUPLICATE-TEST' })]);
    expect(outcomes.filter(value => value.status === 'fulfilled')).toHaveLength(1);
    expect(await Incident.countDocuments()).toBe(1);
  });
  test('real JWT and database ownership prevent citizen, agency and admin data disclosure', async () => {
    const record = await incident();
    const own = await call('get', `/incidents/${record.id}`, 'citizen').expect(200); expect(own.body.data).not.toHaveProperty('reporter');
    await call('get', `/incidents/${record.id}`, 'other').expect(404);
    await call('get', `/incidents/${record.id}`, 'foreign').expect(404);
    await call('get', `/incidents/${record.id}`, 'admin').expect(404);
  });
  test('competing Tanod assignments persist one current inspection and one notification', async () => {
    const record = await incident();
    const results = await Promise.all([1, 2].map(() => call('post', `/incidents/${record.id}/tanod-inspections`).send({ tanodId: actors.tanod.id })));
    expect(results.map(response => response.status).sort()).toEqual([201, 409]);
    expect(await Inspection.countDocuments({ incident: record._id })).toBe(1);
    const saved = await Incident.findById(record.id); expect(saved.initialInspection).toBeTruthy(); expect(saved.inspectionMutation?.token).toBeUndefined();
    expect(await Notification.countDocuments({ recipient: actors.tanod._id })).toBe(1);
  });
  test('supported verification, synthetic routing and agency assessment persist without authorizing maintenance', async () => {
    const record = await incident({ routingAsset: { assetType: 'synthetic_road', ownerId: 'test_owner', verifiedBy: actors.secretary._id, verifiedAt: new Date(), verificationReference: 'TEST-ONLY' } });
    await Rule.create({ ruleId: 'TEST-ONLY', version: 1, agencyId: 'synthetic', organization: 'Synthetic Agency A', displayName: 'Synthetic agency', category: 'road', assetType: 'synthetic_road', ownerId: 'test_owner', barangays: ['Pantal'], city: 'Dagupan City', active: true, participating: true, approvedBy: actors.secretary._id, approvalReference: 'TEST-ONLY-NOT-INSTITUTIONAL', effectiveFrom: new Date('2020-01-01') });
    const assigned = await call('post', `/incidents/${record.id}/tanod-inspections`).send({ tanodId: actors.tanod.id }).expect(201);
    const inspectionId = assigned.body.data._id;
    await call('post', `/incidents/${record.id}/inspections/${inspectionId}/start`, 'tanod').send({}).expect(200);
    await call('post', `/incidents/${record.id}/inspections/${inspectionId}/submit`, 'tanod').send({ result: 'verified', findings: 'Synthetic contract findings; no physical field visit claimed.' }).expect(200);
    const findings = await Inspection.findById(inspectionId);
    await call('post', `/incidents/${record.id}/inspections/${inspectionId}/review`).send({ decision: 'approve', categoryConfirmed: true, expectedVersion: findings.version - 1 }).expect(409);
    await call('post', `/incidents/${record.id}/inspections/${inspectionId}/review`).send({ decision: 'approve', categoryConfirmed: true, expectedVersion: findings.version }).expect(200);
    const routed = await Incident.findById(record.id); expect(routed.routing.responsibleOrganization).toBe('Synthetic Agency A'); expect(routed.sla.startedAt).toBeUndefined(); expect(await WorkOrder.countDocuments()).toBe(0);
    await call('post', `/incidents/${record.id}/agency-preparation`, 'foreign').send({ operation: 'acknowledge', expectedVersion: 0 }).expect(404);
    await call('post', `/incidents/${record.id}/agency-preparation`, 'agency').send({ operation: 'acknowledge', expectedVersion: 0 }).expect(200);
    await call('post', `/incidents/${record.id}/agency-preparation`, 'agency').send({ operation: 'assess', expectedVersion: 1, outcome: 'external', processType: 'Synthetic funding', notes: 'Synthetic review', requirements: 'Materials', resources: 'Pending', approach: 'Review only' }).expect(200);
    await call('post', `/incidents/${record.id}/agency-preparation`, 'agency').send({ operation: 'ready', expectedVersion: 2 }).expect(409);
    expect(await WorkOrder.countDocuments()).toBe(0); expect((await Incident.findById(record.id)).agencyPreparation.history.length).toBe(2);
  });
  test('missing verified ownership remains routing-pending and exposes no guessed agency', async () => {
    const record = await incident({ status: 'tanod_verified', categoryConfirmedBy: actors.secretary._id, categoryConfirmedAt: new Date() });
    const { evaluateRouting } = require('../services/agencyRoutingService'); expect((await evaluateRouting(record)).reason).toBe('unknown_ownership');
    const result = await call('get', `/incidents/${record.id}`, 'citizen').expect(200); expect(result.body.data.agencyAssignment.status).toBe('awaiting_agency_assignment');
  });
  test('native delivery claims permit one attempt and preserve in-app history', async () => {
    const record = await Notification.create({ recipient: actors.citizen._id, type: 'system_announcement', title: 'Synthetic', message: 'Synthetic test only', sentVia: ['in_app'] });
    const states = await Promise.all([deliverNotification(record.id), deliverNotification(record.id)]);
    expect(states.filter(Boolean)).toEqual(['not_configured']);
    const saved = await Notification.findById(record.id); expect(saved.delivery.attempts).toBe(1); expect(saved.delivery.state).toBe('not_configured');
  });
  test('native SLA polling preserves dates, excludes missing starts and deduplicates alerts', async () => {
    const start = new Date('2026-01-01'); const deadline = new Date('2026-01-02'); const now = new Date('2026-01-03');
    const overdue = await incident({ sla: { startedAt: start, deadline, state: 'active' } });
    const missing = await incident({ sla: { deadline, state: 'not_started' } });
    const { runIncidentSlaCheck } = require('../services/slaService');
    await runIncidentSlaCheck(now); const count = await Notification.countDocuments(); await runIncidentSlaCheck(now);
    expect(count).toBeGreaterThan(0); expect(await Notification.countDocuments()).toBe(count);
    const saved = await Incident.findById(overdue.id); expect(saved.sla.state).toBe('overdue'); expect(saved.sla.startedAt.getTime()).toBe(start.getTime()); expect(saved.sla.deadline.getTime()).toBe(deadline.getTime());
    expect((await Incident.findById(missing.id)).sla.state).toBe('not_started');
  });
  test('real Nodemailer transport delivers only to a loopback SMTP capture', async () => {
    const net = require('net'); const messages = []; const sockets = new Set();
    const capture = net.createServer(socket => {
      sockets.add(socket); socket.on('close', () => sockets.delete(socket)); socket.write('220 localhost ESMTP integration\r\n');
      let buffer = ''; let data = false; let message = [];
      socket.on('data', chunk => {
        buffer += chunk.toString(); let boundary;
        while ((boundary = buffer.indexOf('\r\n')) >= 0) {
          const line = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
          if (data) { if (line === '.') { messages.push(message.join('\r\n')); message = []; data = false; socket.write('250 captured\r\n'); } else message.push(line); }
          else if (/^(EHLO|HELO)/.test(line)) socket.write('250-localhost\r\n250 AUTH PLAIN\r\n');
          else if (/^AUTH/.test(line)) socket.write('235 authenticated\r\n');
          else if (line === 'DATA') { data = true; socket.write('354 send data\r\n'); }
          else if (line === 'QUIT') socket.end('221 bye\r\n'); else socket.write('250 OK\r\n');
        }
      });
    });
    await new Promise(resolve => capture.listen(0, '127.0.0.1', resolve));
    try {
      Object.assign(process.env, { EMAIL_PROVIDER: 'smtp', SMTP_HOST: '127.0.0.1', SMTP_PORT: String(capture.address().port), SMTP_USER: 'synthetic@example.test', SMTP_PASSWORD: 'synthetic-only', SMTP_SECURE: 'false', EMAIL_FROM: 'synthetic@example.test' });
      let deliverEmail; jest.isolateModules(() => { deliverEmail = require('../services/emailDeliveryService').deliverEmail; });
      expect(await deliverEmail({ type: 'integration', recipient: { email: 'recipient@example.test' }, subject: 'Synthetic capture', text: 'Synthetic integration message only', timeoutMs: 3000 })).toEqual({ configured: true, delivered: true });
      expect(messages).toHaveLength(1); expect(messages[0]).toContain('Synthetic integration message only');
    } finally { for (const socket of sockets) socket.destroy(); await new Promise(resolve => capture.close(resolve)); process.env = { ...oldEnv, ...{ JWT_SECRET: 'isolated-system-access', JWT_REFRESH_SECRET: 'isolated-system-refresh', PRIVACY_REDACTION_ENABLED: 'false', SLA_AUTOMATION_ENABLED: 'false' } }; }
  });
  test('synthetic historical repair handoff preserves progress and revokes the previous worker', async () => {
    const record = await incident({ status: 'in_progress', routing: { responsibleRole: 'utility_provider', responsibleOrganization: 'Synthetic Agency A' } });
    const replacement = await User.create({ firstName: 'Synthetic', lastName: 'Replacement', email: 'replacement@integration.test', phone: '09123456789', password: 'IntegrationOnly2026!', role: 'repair_personnel', repairOrganization: 'Synthetic Agency A', isActive: true, isVerified: true, availability: 'available' });
    const assignmentId = new mongoose.Types.ObjectId(); const orderId = new mongoose.Types.ObjectId(); const start = new Date('2026-10-01'); const deadline = new Date('2026-10-30');
    // Deliberately historical fixture: a new Mongoose-validated order is protocol 9 and blocked.
    // This insert does not claim any real-world work authorization or new approved workflow.
    await WorkOrder.collection.insertOne({ _id: orderId, orderNumber: 'SYNTHETIC-HISTORICAL-ONLY', incident: record._id, responsibleRole: 'utility_provider', responsibleOrganization: 'Synthetic Agency A', jurisdiction: { barangay: 'Pantal' }, priority: 'high', createdBy: actors.agency._id,
      status: 'in_progress', assignmentState: 'accepted', assignedTo: actors.repair._id, currentAssignment: assignmentId, assignments: [{ _id: assignmentId, assignee: actors.repair._id, assignedBy: actors.agency._id, status: 'accepted', active: true, assignedAt: start }],
      progressPercent: 50, progressStage: 'main_repair', startedAt: start, actualStartTime: start, sla: { startedAt: start, deadline, state: 'active' }, history: [], progressUpdates: [], repairEvidence: [], version: 0, createdAt: start, updatedAt: start });
    await Incident.updateOne({ _id: record.id }, { $set: { workOrder: orderId } });
    await call('post', `/work-orders/${orderId}/reassign`, 'agency').send({ assigneeId: replacement.id, reason: 'Synthetic shift handoff', version: 0 }).expect(200);
    await call('post', `/work-orders/${orderId}/accept`, 'repair').send({ version: 1 }).expect(404);
    const replacementToken = createAccessToken(replacement);
    await request(app).post(`/work-orders/${orderId}/accept`).set('Authorization', `Bearer ${replacementToken}`).send({ version: 1 }).expect(200);
    const saved = await WorkOrder.findById(orderId); expect(saved.progressPercent).toBe(50); expect(saved.startedAt.getTime()).toBe(start.getTime()); expect(saved.sla.deadline.getTime()).toBe(deadline.getTime());
    expect(saved.assignments).toHaveLength(2); expect(saved.assignments[0].active).toBe(false);
  });
  test('interrupted multi-document workflow retains a durable reconciliation claim', async () => {
    const record = await incident(); const req = { user: actors.secretary, params: { id: record.id }, path: '/integration-failure' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await expect(withInspectionMutation(req, res, async () => { await Incident.updateOne({ _id: record.id }, { $set: { description: 'First committed write' } }); throw new Error('controlled failure'); })).rejects.toThrow('controlled failure');
    const saved = await Incident.findById(record.id); expect(saved.description).toBe('First committed write'); expect(saved.inspectionMutation.token).toBeTruthy();
    await withInspectionMutation(req, res, jest.fn()); expect(res.status).toHaveBeenCalledWith(409);
  });
  test('native replica-set transaction rollback is supported but not claimed by existing workflows', async () => {
    const session = await mongoose.startSession();
    await expect(session.withTransaction(async () => { await Incident.create([{ reporter: actors.citizen._id, category: 'road', description: 'Rollback fixture', location: { type: 'Point', coordinates: [120.34, 16.04], address: { barangay: 'Pantal' } } }], { session }); throw new Error('rollback'); })).rejects.toThrow('rollback');
    await session.endSession(); expect(await Incident.countDocuments()).toBe(0);
  });
  test('native reporting traverses >100 records and enforces default-denied export', async () => {
    await Incident.insertMany(Array.from({ length: 237 }, (_, i) => ({ reportNumber: `NATIVE-${i}`, reporter: actors.citizen._id, category: 'road', status: 'submitted', description: 'Synthetic reporting', location: { type: 'Point', coordinates: [120.34, 16.04], address: { barangay: 'Pantal' } }, jurisdiction: { barangay: 'Pantal' } })));
    const seen = [];
    for (let page = 1; page <= 3; page++) { const report = await getOperationalReport(actors.secretary, { page: String(page), limit: '100' }); expect(report.totals.incidents).toBe(237); seen.push(...report.rows.map(row => String(row._id))); }
    expect(new Set(seen).size).toBe(237);
    await call('get', '/reports/csv').expect(403); process.env.OPERATIONAL_REPORT_CSV_ROLES = 'barangay_official'; process.env.OPERATIONAL_REPORT_PDF_ROLES = 'barangay_official';
    const csv = await call('get', '/reports/csv').expect(200); expect(csv.text.match(/"Incident",/g)).toHaveLength(237);
    const pdf = await call('get', '/reports/pdf').expect(200); expect(Buffer.from(pdf.body).subarray(0, 5).toString()).toBe('%PDF-');
    const foreign = await getOperationalReport(actors.foreign, {}); expect(foreign.totals.incidents).toBe(0);
  });
});
