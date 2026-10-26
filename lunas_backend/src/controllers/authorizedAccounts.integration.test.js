// Opt-in tests against an isolated local MongoDB database. Never use application data.
jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../utils/logger', () => ({ error: jest.fn(), warn: jest.fn(), info: jest.fn() }));
const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Incident = require('../models/Incident');
const WorkOrder = require('../models/WorkOrder');
const AuditLog = require('../models/AuditLog');
const { createAccessToken } = require('../utils/authTokens');
const { removeAuditTtl } = require('../../scripts/remove-audit-ttl');
const { sanitizeAuditValue } = require('../utils/auditLogger');
const { AUTHORIZED_ROLES } = require('../utils/accountPolicy');

const databaseUri = process.env.ACCOUNT_TEST_MONGODB_URI;
const integration = databaseUri ? describe : describe.skip;
const password = 'AccountTest2026!';
const approved = {
  firstName: 'Approved', lastName: 'Official', email: 'official@example.test', phone: '09123456789',
  role: 'barangay_official', barangay: 'Pantal', position: 'Officer', organization: 'Barangay Pantal',
  approvalAuthority: 'Responsible superior', approvalReference: 'Offline authorization REF-001'
};

integration('authorized personnel provisioning: real MongoDB and HTTP authorization', () => {
  let app, admin, adminToken;
  const databaseName = `lunas_accounts_test_${process.pid}_${Date.now()}`;
  const originalEnvironment = { ...process.env };
  beforeAll(async () => {
    if (!/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(databaseUri)) {
      throw new Error('ACCOUNT_TEST_MONGODB_URI must be a local server URI with no database or credentials');
    }
    process.env.JWT_SECRET = 'isolated-account-test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'isolated-account-test-refresh-secret';
    process.env.REGISTRATION_MFA_SECRET = 'isolated-account-test-mfa-secret';
    process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = '10000';
    process.env.REGISTRATION_MFA_DELIVERY_URL = 'https://email.example.test/deliver';
    process.env.ACCOUNT_ACTIVATION_DELIVERY_URL = 'https://email.example.test/deliver';
    process.env.ACCOUNT_ACTIVATION_APP_URL = 'https://app.example.test/activate-account';
    await mongoose.connect(databaseUri, { dbName: databaseName });
    await Promise.all([User.init(), AuditLog.init(), Incident.init(), WorkOrder.init()]);
    app = express();
    app.use(express.json());
    app.use('/auth', require('../routes/authRoutes'));
    app.use('/users', require('../routes/userRoutes'));
    app.use('/incidents', require('../routes/incidentRoutes'));
    app.use('/work-orders', require('../routes/workOrderRoutes'));
    app.use('/audit-logs', require('../routes/auditLogRoutes'));
    app.use(require('../middleware/errorHandler'));
  });
  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), AuditLog.deleteMany({}), Incident.deleteMany({}), WorkOrder.deleteMany({})]);
    axios.post.mockReset().mockResolvedValue({ data: { success: true } });
    admin = await User.create({ firstName: 'Admin', lastName: 'Tester', email: 'admin@example.test',
      phone: '09123456789', password, role: 'admin', isActive: true, isVerified: true });
    adminToken = createAccessToken(admin);
    process.env.AUTHORIZED_ADMIN_PROVISIONER_IDS = '';
  });
  afterAll(async () => {
    if (mongoose.connection.db?.databaseName === databaseName) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    process.env = originalEnvironment;
  });
  const call = (method, path, token = adminToken) => request(app)[method](path).set('Authorization', `Bearer ${token}`);
  const activationToken = () => {
    const payload = axios.post.mock.calls.filter(([, data]) => data.type === 'account_activation').at(-1)[1];
    return new URLSearchParams(new URL(payload.activationUrl).hash.slice(1)).get('token');
  };
  async function provision(overrides = {}) {
    const result = await call('post', '/users/authorized').send({ ...approved, ...overrides }).expect(201);
    return { account: result.body.data.account, token: activationToken(), body: result.body };
  }
  async function activate(token) {
    return request(app).post('/auth/activate-account').send({ token, password }).expect(200);
  }
  async function actor(role, overrides = {}) {
    const user = await User.create({ firstName: 'Test', lastName: 'Actor', email: `${role}-actor@example.test`,
      phone: '09123456789', password, role, isActive: true, isVerified: true,
      barangay: ['barangay_official', 'utility_personnel'].includes(role) ? 'Pantal' : undefined,
      repairOrganization: role === 'repair_personnel' ? 'Dagupan Water District' : undefined,
      utilityCompany: role === 'utility_provider' ? 'Utility A' : undefined, ...overrides });
    return { user, token: createAccessToken(user) };
  }
  function updatePayload(account, changes = {}) {
    const fields = { ...approved };
    delete fields.email;
    return { ...fields, version: account.version ?? account.__v ?? 0, ...changes };
  }

  test('1: citizen registration and existing email OTP still produce an active citizen', async () => {
    const result = await request(app).post('/auth/register').send({ firstName: 'Citizen', lastName: 'Tester',
      email: 'citizen@example.test', phone: approved.phone, password }).expect(201);
    expect(result.body.data).not.toHaveProperty('developmentCode');
    const code = axios.post.mock.calls.find(([, data]) => data.type === 'registration_mfa')[1].code;
    const verified = await request(app).post('/auth/register/verify').send({ email: 'citizen@example.test',
      challengeToken: result.body.data.challengeToken, code }).expect(200);
    expect(verified.body.data.user.role).toBe('citizen');
    await call('get', '/users/me', verified.body.data.accessToken).expect(200);
  });
  test.each(AUTHORIZED_ROLES)('2–4: public registration rejects privileged role %s', async role => {
    await request(app).post('/auth/register').send({ ...approved, password, role }).expect(400);
    expect(await User.countDocuments({ email: approved.email })).toBe(0);
  });
  test.each(['citizen', 'utility_personnel', 'repair_personnel', 'barangay_official', 'city_engineer', 'utility_provider'])('5: %s cannot create personnel or read admin directory', async role => {
    const { token } = await actor(role);
    await call('post', '/users/authorized', token).send(approved).expect(role === 'city_engineer' ? 401 : 403);
    await call('get', '/users/authorized', token).expect(role === 'city_engineer' ? 401 : 403);
    await call('put', `/users/${admin.id}`, token).send({ role: 'admin' }).expect(role === 'city_engineer' ? 401 : 403);
  });
  test.each(['citizen', 'utility_personnel', 'repair_personnel', 'barangay_official', 'city_engineer', 'utility_provider', 'admin'])('%s cannot use retired repair provisioning', async role => {
    const { token } = await actor(role);
    await call('post', '/users/repair-personnel', token).send({
      firstName: 'Repair', lastName: 'Worker', email: 'retired@example.test', phone: approved.phone
    }).expect(404);
    expect(await User.countDocuments({ email: 'retired@example.test' })).toBe(0);
  });
  test('admin provisions Utility Personnel; Infrastructure Committee directory stays barangay scoped', async () => {
    const payload = { ...approved, role: 'utility_personnel', email: 'tanod@example.test' };
    const result = await call('post', '/users/authorized').send(payload).expect(201);
    expect(result.body.data.account).toMatchObject({ role: 'utility_personnel', barangay: 'Pantal', accountStatus: 'pending_activation' });
    await call('post', '/users/authorized').send(payload).expect(409);
    await actor('utility_personnel', { email: 'pantal-tanod@example.test', barangay: 'Pantal' });
    await actor('utility_personnel', { email: 'lucao-tanod@example.test', barangay: 'Lucao' });
    const { token } = await actor('barangay_official', { barangay: 'Pantal' });
    const roster = await call('get', '/users/repair-personnel', token).expect(200);
    expect(roster.body.data).toHaveLength(1);
    expect(roster.body.data[0]).toMatchObject({ role: 'utility_personnel', barangay: 'Pantal', email: 'pantal-tanod@example.test' });
    const { token: providerToken } = await actor('utility_provider');
    await call('get', '/users/repair-personnel', providerToken).expect(403);
  });
  test('6–7,14–15: administrator provisions an approved inactive account with an audited assignment and safe response', async () => {
    const { account, token, body } = await provision();
    expect(account).toMatchObject({ accountStatus: 'pending_activation', isActive: false, role: 'barangay_official', barangay: 'Pantal' });
    const stored = await User.findById(account.id).select('+password +activationTokenHash');
    expect(stored.password).toBeUndefined();
    expect(stored.activationTokenHash).not.toBe(token);
    expect(JSON.stringify(body)).not.toMatch(/activationToken|password|refreshTokens/);
    expect(JSON.stringify(body)).not.toContain(token);
    const audit = await AuditLog.findOne({ action: 'authorized_account_created' });
    expect(String(audit.performedBy)).toBe(admin.id);
    expect(String(audit.affectedUser)).toBe(account.id);
    expect(audit.changes.after).toMatchObject({ role: approved.role, barangay: 'Pantal', approval: { authority: approved.approvalAuthority } });
    await call('get', '/users/me', createAccessToken(stored)).expect(401);
    await request(app).post('/auth/register').send({ ...approved, role: 'citizen', password }).expect(409);
    expect((await User.findById(account.id)).role).toBe('barangay_official');
  });
  test('8: activation hashes the chosen password and consumes the token atomically under concurrent requests', async () => {
    const { account, token } = await provision();
    const results = await Promise.all([1, 2].map(() => request(app).post('/auth/activate-account').send({ token, password })));
    expect(results.map(result => result.status).sort()).toEqual([200, 400]);
    const user = await User.findById(account.id).select('+password +activationTokenHash');
    expect(user.accountStatus).toBe('active');
    expect(user.activationTokenHash).toBeUndefined();
    expect(user.password).not.toBe(password);
    expect(await bcrypt.compare(password, user.password)).toBe(true);
    expect(await AuditLog.countDocuments({ action: 'account_activation_completed' })).toBe(1);
    const login = await request(app).post('/auth/login').send({ email: approved.email, password }).expect(200);
    await call('get', '/users/me', login.body.data.accessToken).expect(200);
  });
  test('8: expired, replayed, and revoked links cannot activate an account; resend replaces the old token', async () => {
    const { account, token } = await provision();
    await User.updateOne({ _id: account.id }, { activationExpiresAt: new Date(0), activationSentAt: new Date(0) });
    await request(app).post('/auth/activate-account').send({ token, password }).expect(400);
    await call('post', `/users/authorized/${account.id}/activation`).send({ version: account.version }).expect(200);
    const replacement = activationToken();
    expect(replacement).not.toBe(token);
    await request(app).post('/auth/activate-account').send({ token, password }).expect(400);
    await activate(replacement);
    await request(app).post('/auth/activate-account').send({ token: replacement, password }).expect(400);
  });
  test('9–10: activated Infrastructure Committee member stays jurisdiction-scoped and cannot use account administration', async () => {
    const { account, token } = await provision(); await activate(token);
    const user = await User.findById(account.id).select('+tokenVersion');
    const access = createAccessToken(user);
    const reports = await Incident.create(['Pantal', 'Lucao'].map((barangay, index) => ({ reportNumber: `TEST-${index}`,
      reporter: admin._id, category: 'road', description: 'Test infrastructure report', location: { type: 'Point', coordinates: [120.33, 16.04], address: { barangay } } })));
    await call('get', `/incidents/${reports[0].id}`, access).expect(200);
    await call('get', `/incidents/${reports[1].id}`, access).expect(404);
    await call('post', `/incidents/${reports[1].id}/validate`, access).send({ priority: 'high' }).expect(404);
    await call('post', '/users/authorized', access).send(approved).expect(403);
    await call('get', '/users/authorized', access).expect(403);
    const { user: outside } = await actor('barangay_official', { barangay: 'Lucao' });
    // General user-profile and directory reads are not exposed. Private
    // records remain unavailable without a scoped, purpose-specific route.
    await call('get', `/users/${outside.id}`, access).expect(404);
    await call('get', '/users?barangay=Lucao', access).expect(404);
  });
  test('11: crafted self-profile updates cannot change role, status, approval or jurisdiction', async () => {
    const { user, token } = await actor('repair_personnel');
    await call('patch', '/users/me', token).send({ firstName: 'Updated', role: 'admin', barangay: 'Lucao', accountStatus: 'active', isVerified: true }).expect(403);
    const persisted = await User.findById(user.id);
    expect(persisted.role).toBe('repair_personnel');
    expect(persisted.barangay).toBeUndefined();
    await call('put', `/users/authorized/${admin.id}`).send(updatePayload(admin)).expect(403);
  });
  test('12–14: suspension/deactivation revoke access and refresh; reactivation preserves records and never revives old sessions', async () => {
    const { account, token } = await provision(); await activate(token);
    const login = await request(app).post('/auth/login').send({ email: approved.email, password }).expect(200);
    const { accessToken, refreshToken } = login.body.data;
    const historical = await Incident.create({ reportNumber: 'HISTORY', reporter: admin._id, validatedBy: account.id,
      category: 'road', description: 'Historical validated action', location: { type: 'Point', coordinates: [120.33, 16.04], address: { barangay: 'Pantal' } } });
    let version = (await User.findById(account.id)).__v;
    for (const status of ['suspended', 'active', 'deactivated']) {
      const changed = await call('patch', `/users/authorized/${account.id}/status`).send({ status, version, reason: 'Offline personnel access decision' }).expect(200);
      version = changed.body.data.version;
      await call('get', '/users/me', accessToken).expect(401);
      await request(app).post('/auth/refresh').send({ refreshToken }).expect(401);
      if (status !== 'active') await request(app).post('/auth/login').send({ email: approved.email, password }).expect(403);
    }
    expect(await User.countDocuments({ _id: account.id })).toBe(1);
    const retained = await Incident.findById(historical.id).populate('validatedBy');
    expect(retained.validatedBy.firstName).toBe('Approved');
    const actions = (await AuditLog.find({ affectedUser: account.id })).map(log => log.action);
    expect(actions).toEqual(expect.arrayContaining(['authorized_account_created', 'account_suspended', 'account_reactivated', 'account_deactivated']));
    const logs = await call('get', '/audit-logs').expect(200);
    expect(logs.body.data.some(log => log.action === 'account_deactivated')).toBe(true);
  });
  test('administrator creation and elevation require deployment allowlist; legacy update/archive cannot bypass it', async () => {
    const adminFields = { role: 'admin', barangay: '', organization: 'LUNAS Operations' };
    await call('post', '/users/authorized').send({ ...approved, ...adminFields }).expect(403);
    const { account } = await provision();
    await call('put', `/users/${account.id}`).send(updatePayload(account, adminFields)).expect(403);
    const { user: secondAdmin } = await actor('admin', { email: 'second-admin@example.test' });
    await call('patch', `/users/${secondAdmin.id}/archive`).send({ reason: 'Unauthorized removal' }).expect(403);
    process.env.AUTHORIZED_ADMIN_PROVISIONER_IDS = admin.id;
    await call('put', `/users/authorized/${account.id}`).send(updatePayload(account, adminFields)).expect(200);
    await call('post', '/users/authorized').send({ ...approved, ...adminFields, email: 'new-admin@example.test' }).expect(201);
    expect(await AuditLog.countDocuments({ action: 'role_changed' })).toBe(1);
  });
  test.each([
    { role: 'unknown' }, { barangay: 'Invented barangay' }, { isActive: true }, { password },
    { activationTokenHash: 'crafted' }, { role: 'utility_provider', barangay: '', utilityCompany: '' },
    { role: 'repair_personnel', barangay: '', repairOrganization: '' }, { approvalAuthority: '' },
    { firstName: { $gt: '' } }
  ])('server rejects invalid assignments and mass assignment %j', async changes => {
    await call('post', '/users/authorized').send({ ...approved, ...changes }).expect(400);
  });
  test('stale admin updates return conflict and cannot overwrite a later approved jurisdiction', async () => {
    const { account } = await provision();
    await call('put', `/users/authorized/${account.id}`).send(updatePayload(account, { barangay: 'Lucao' })).expect(200);
    await call('put', `/users/authorized/${account.id}`).send(updatePayload(account, { barangay: 'Pantal' })).expect(409);
    expect((await User.findById(account.id)).barangay).toBe('Lucao');
    expect(await AuditLog.countDocuments({ action: 'account_jurisdiction_changed' })).toBe(1);
  });
  test('deactivating before activation cancels the link; reactivation still requires password setup', async () => {
    const { account, token } = await provision();
    const off = await call('patch', `/users/authorized/${account.id}/status`).send({ status: 'deactivated', reason: 'Approval withdrawn', version: account.version }).expect(200);
    await request(app).post('/auth/activate-account').send({ token, password }).expect(400);
    const restored = await call('patch', `/users/authorized/${account.id}/status`).send({ status: 'active', reason: 'Offline approval restored', version: off.body.data.version }).expect(200);
    expect(restored.body.data.accountStatus).toBe('pending_activation');
    expect(restored.body.data.isActive).toBe(false);
  });
  test('provider delivery failures leave a recoverable pending account without exposing the link', async () => {
    axios.post.mockRejectedValue(new Error('provider rejected'));
    const result = await call('post', '/users/authorized').send(approved).expect(201);
    expect(result.body.data.delivery.delivered).toBe(false);
    expect(result.body.data.account.accountStatus).toBe('pending_activation');
    expect(JSON.stringify(result.body)).not.toMatch(/token|password/i);
  });
  test('Utility Personnel transfer revokes old sessions and removes old barangay incident access', async () => {
    const { user, token } = await actor('utility_personnel', { barangay: 'Pantal' });
    const incident = await Incident.create({ reportNumber: 'TRANSFER', reporter: admin._id, category: 'road', description: 'Test Tanod transfer history', location: { type: 'Point', coordinates: [120.33, 16.04], address: { barangay: 'Pantal' } } });
    const { canAccessIncident } = require('../services/jurisdictionService');
    expect(canAccessIncident(user, incident)).toBe(true);
    const update = await call('put', `/users/authorized/${user.id}`).send(updatePayload({ version: user.__v }, { role: 'utility_personnel', barangay: 'Lucao' })).expect(200);
    expect(update.body.data.barangay).toBe('Lucao');
    await call('get', '/users/me', token).expect(401);
    const refreshed = await User.findById(user.id);
    expect(canAccessIncident(refreshed, incident)).toBe(false);
    expect(await Incident.countDocuments({ _id: incident.id })).toBe(1);
  });
  test('Committee Staff verification, agency progress and current final inspection preserve role and scope gates', async () => {
    const Inspection = require('../models/Inspection');
    const citizen = await actor('citizen');
    const secretary = await actor('barangay_official', { barangay: 'Pantal' });
    const tanod = await actor('utility_personnel', { barangay: 'Pantal' });
    const outside = await actor('utility_personnel', { email: 'outside-tanod@example.test', barangay: 'Lucao' });
    const provider = await actor('utility_provider', { utilityCompany: 'Dagupan City Engineering Office' });
    const otherProvider = await actor('utility_provider', { email: 'outside-provider@example.test', utilityCompany: 'Other Agency' });
    const report = await Incident.create({ reportNumber: 'QA-TANOD', reporter: citizen.user._id, category: 'road', description: 'Synthetic isolated inspection journey', location: { type: 'Point', coordinates: [120.33, 16.04], address: { barangay: 'Pantal' } } });
    const base = `/incidents/${report.id}`;
    await call('post', `${base}/tanod-inspections`, secretary.token).send({ tanodId: outside.user.id }).expect(400);
    const assigned = await call('post', `${base}/tanod-inspections`, secretary.token).send({ tanodId: tanod.user.id }).expect(201);
    const initialId = assigned.body.data._id;
    await call('post', `${base}/inspections/${initialId}/start`, outside.token).expect(404);
    await call('post', `${base}/inspections/${initialId}/start`, tanod.token).expect(200);
    await call('post', `${base}/inspections/${initialId}/submit`, tanod.token).send({ findings: 'Verified road damage at the assigned site', result: 'verified' }).expect(200);
    await call('post', `${base}/inspections/${initialId}/review`, tanod.token).send({ decision: 'approve' }).expect(403);
    await call('post', `${base}/inspections/${initialId}/review`, secretary.token).send({ decision: 'approve' }).expect(200);
    await call('patch', `${base}/agency-status`, otherProvider.token).send({ status: 'work_in_progress', priority: 'high' }).expect(404);
    await call('patch', `${base}/agency-status`, provider.token).send({ status: 'work_completed', priority: 'high' }).expect(409);
    await call('patch', `${base}/agency-status`, provider.token).send({ status: 'work_in_progress', priority: 'high', slaDeadline: new Date(Date.now() + 72 * 3600000).toISOString() }).expect(200);
    await call('patch', `${base}/agency-status`, provider.token).send({ status: 'work_completed' }).expect(200);
    const completion = await call('post', `${base}/completion-inspections`, secretary.token).send({ tanodId: tanod.user.id }).expect(201);
    const completionId = completion.body.data._id;
    await call('post', `${base}/inspections/${completionId}/submit`, tanod.token).send({ findings: 'Completion verified on site', result: 'verified' }).expect(200);
    // An unrelated URL or superseded inspection must never close the report.
    await call('post', `/incidents/${new mongoose.Types.ObjectId()}/complete`, secretary.token).send({ inspectionId: completionId }).expect(404);
    await Incident.updateOne({ _id: report.id }, { $unset: { completionInspection: '' } });
    await call('post', `${base}/complete`, secretary.token).send({ inspectionId: completionId }).expect(409);
    expect((await Inspection.findById(completionId)).status).toBe('submitted');
    await Incident.updateOne({ _id: report.id }, { $set: { completionInspection: completionId } });
    await call('post', `${base}/complete`, secretary.token).send({ inspectionId: completionId }).expect(200);
    expect((await Incident.findById(report.id)).status).toBe('closed');
    await call('post', `${base}/complete`, secretary.token).send({ inspectionId: completionId }).expect(404);
  });
  test('15: serializers, audit sanitizer, and retention migration preserve history without secret disclosure', async () => {
    const { account, token } = await provision();
    const directory = await call('get', '/users/authorized').expect(200);
    const detail = await call('get', `/users/authorized/${account.id}`).expect(200);
    for (const body of [directory.body, detail.body, await AuditLog.find({}).lean()]) {
      expect(JSON.stringify(body)).not.toContain(token);
      expect(JSON.stringify(body)).not.toContain(password);
      expect(JSON.stringify(body)).not.toMatch(/activationTokenHash|registrationMfaCodeHash|\$2[aby]\$/);
    }
    expect(sanitizeAuditValue({ passwordHash: 'hash', activationToken: 'token', nested: { otp: '123456', activationTokenHash: 'hash' } }))
      .toEqual({ passwordHash: '[REDACTED]', activationToken: '[REDACTED]', nested: { otp: '[REDACTED]', activationTokenHash: '[REDACTED]' } });
    await AuditLog.collection.createIndex({ timestamp: 1 }, { expireAfterSeconds: 31536000 });
    const count = await AuditLog.countDocuments({});
    expect(await removeAuditTtl(mongoose.connection.db)).toBe(1);
    expect(await removeAuditTtl(mongoose.connection.db)).toBe(0);
    expect(await AuditLog.countDocuments({})).toBe(count);
  });
});
