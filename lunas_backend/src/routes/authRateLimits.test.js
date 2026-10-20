jest.mock('../controllers/authController', () => Object.fromEntries([
  'register', 'verifyRegistrationMfa', 'resendRegistrationMfa', 'login', 'refresh',
  'forgotPassword', 'verifyPasswordResetCode', 'resetPassword', 'getMe',
  'getRecoveryEmailStatus', 'requestRecoveryEmailVerification', 'verifyRecoveryEmail',
  'updateProfile', 'changePassword', 'logout'
].map(name => [name, (_req, res) => res.status(200).json({ success: true })])));
jest.mock('../controllers/authorizedAccountController', () => ({
  activateAuthorizedAccount: (_req, res) => res.status(200).json({ success: true })
}));
jest.mock('../middleware/auth', () => ({ protect: (req, res, next) => {
  if (!req.headers.authorization) return res.sendStatus(401);
  req.user = { _id: 'authenticated-test-user' }; next();
} }));
const express = require('express');
const request = require('supertest');
const originalEnv = { ...process.env };
const validRefresh = 'isolated-refresh-token-with-minimum-contract-length';
let app;
beforeEach(() => {
  Object.assign(process.env, { AUTH_RATE_LIMIT_MAX_REQUESTS: '100', AUTH_SENSITIVE_IP_MAX_REQUESTS: '2',
    AUTH_ACCOUNT_MAX_REQUESTS: '2', REFRESH_RATE_LIMIT_MAX_REQUESTS: '2', SECURITY_ACCOUNT_MAX_REQUESTS: '2',
    LOGIN_RATE_LIMIT_MAX_REQUESTS: '2', LOGIN_IP_RATE_LIMIT_MAX_REQUESTS: '10' });
  app = express(); app.use(express.json());
  jest.isolateModules(() => app.use('/auth', require('./authRoutes')));
});
afterAll(() => { process.env = originalEnv; });
test.each(['/register', '/activate-account', '/register/verify', '/register/resend', '/forgot-password', '/forgot-password/verify', '/reset-password', '/refresh'])('%s is limited before invalid payloads can reach controllers', async path => {
  await request(app).post(`/auth${path}`).send({}).expect(400);
  await request(app).post(`/auth${path}`).send({}).expect(400);
  const res = await request(app).post(`/auth${path}`).send({}).expect(429);
  expect(res.body.code).toBe('RATE_LIMITED'); expect(res.headers['retry-after']).toBeDefined();
});
test('registration/recovery/OTP share the sensitive budget across routes', async () => {
  await request(app).post('/auth/register').send({}).expect(400);
  await request(app).post('/auth/forgot-password').send({}).expect(400);
  await request(app).post('/auth/register/resend').send({}).expect(429);
});
test('legitimate registration payload reaches the existing controller below limits', async () => {
  await request(app).post('/auth/register').send({ firstName: 'Test', lastName: 'Citizen',
    email: 'citizen@example.test', password: 'Password123!', phone: '09123456789' }).expect(200);
});
test('valid OTP, refresh and recovery payloads reach their existing handlers', async () => {
  await request(app).post('/auth/register/verify').send({ email: 'citizen@example.test', challengeToken: 'a'.repeat(64), code: '123456' }).expect(200);
  await request(app).post('/auth/forgot-password').send({ email: 'citizen@example.test' }).expect(200);
  await request(app).post('/auth/refresh').send({ refreshToken: validRefresh }).expect(200);
});
test('login-specific failed-attempt limiter remains wired independently', async () => {
  await request(app).post('/auth/login').send({ email: 'invalid' }).expect(400);
  await request(app).post('/auth/login').send({ email: 'invalid' }).expect(400);
  await request(app).post('/auth/login').send({ email: 'invalid' }).expect(429);
  await request(app).post('/auth/refresh').send({ refreshToken: validRefresh }).expect(200);
  await request(app).post('/auth/login').send({ email: 'invalid' }).expect(429);
});
test('security mutation account budget spans password/profile/logout while protect still runs', async () => {
  await request(app).post('/auth/logout').expect(401);
  await request(app).post('/auth/logout').set('Authorization', 'Bearer A').expect(200);
  await request(app).patch('/auth/profile').set('Authorization', 'Bearer B').send({ firstName: 'New' }).expect(200);
  await request(app).post('/auth/logout').set('Authorization', 'Bearer C').expect(429);
});
