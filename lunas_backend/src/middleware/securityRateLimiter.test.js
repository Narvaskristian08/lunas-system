const express = require('express');
const request = require('supertest');
const { createApiLimiter, createAuthLimiters, normalizeAuthEmail, ipKey, trustedProxy } = require('./securityRateLimiter');

const appWithApi = (env = {}, proxy = false) => {
  const app = express(); app.set('trust proxy', proxy);
  app.use('/api', createApiLimiter({ RATE_LIMIT_MAX_REQUESTS: '2', ...env }));
  app.get('/health', (_req, res) => res.sendStatus(200));
  app.use((_req, res) => res.sendStatus(200));
  return app;
};
test('global API budget counts successes, reports retry headers and leaves health outside budget', async () => {
  const app = appWithApi();
  await request(app).get('/api/v1/incidents').expect(200);
  await request(app).get('/api/v2/unknown').expect(200);
  const res = await request(app).get('/api/v1/auth/login').expect(429);
  expect(res.headers['retry-after']).toMatch(/^\d+$/);
  expect(res.headers.ratelimit).toContain('remaining=0');
  expect(res.body).toEqual({ success: false, code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' });
  await request(app).get('/health').expect(200);
});
test('arbitrary forwarding headers cannot rotate direct-client identity', async () => {
  const app = appWithApi();
  for (const ip of ['203.0.113.1', '203.0.113.2']) await request(app).get('/api').set('X-Forwarded-For', ip).expect(200);
  await request(app).get('/api').set('X-Forwarded-For', '203.0.113.3').expect(429);
});
test('explicit trusted proxy uses nearest untrusted peer, not forged leftmost address', async () => {
  const app = appWithApi({}, trustedProxy('127.0.0.1/32,::1/128'));
  await request(app).get('/api').set('X-Forwarded-For', '198.51.100.1, 203.0.113.8').expect(200);
  await request(app).get('/api').set('X-Forwarded-For', '198.51.100.2, 203.0.113.8').expect(200);
  await request(app).get('/api').set('X-Forwarded-For', '198.51.100.3, 203.0.113.8').expect(429);
  await request(app).get('/api').set('X-Forwarded-For', '203.0.113.9').expect(200);
});
test('IPv6 spelling/address rotations within /56 share a key and IPv4 mapped addresses agree', () => {
  expect(ipKey({ ip: '2001:db8:abcd:1200::1' })).toBe(ipKey({ ip: '2001:0db8:abcd:12ff::ffff' }));
  expect(ipKey({ ip: '2001:db8:abcd:1300::1' })).not.toBe(ipKey({ ip: '2001:db8:abcd:1200::1' }));
  expect(ipKey({ ip: '::ffff:192.0.2.1' })).toBe(ipKey({ ip: '192.0.2.1' }));
  expect(ipKey({ ip: 'not-an-ip' })).toBe('ip:unknown');
});
test.each(['true', '1', '2', '-1', '0.0.0.0/0', '::/0', 'proxy.example', '127.0.0.1/33'])('unsafe proxy configuration %s is rejected', value => {
  expect(() => trustedProxy(value)).toThrow('TRUST_PROXY');
});
test('invalid limits cannot disable protection', () => {
  for (const value of ['0', '-1', 'NaN', '1.5']) expect(() => createApiLimiter({ RATE_LIMIT_MAX_REQUESTS: value })).toThrow();
});
test('public email budgets span recovery/registration/OTP aliases without merging different accounts behind NAT', async () => {
  const app = express(); app.use(express.json());
  const limits = createAuthLimiters({ AUTH_ACCOUNT_MAX_REQUESTS: '2' });
  app.use(normalizeAuthEmail, limits.publicAccountLimiter);
  app.post('*', (_req, res) => res.sendStatus(200));
  await request(app).post('/register').send({ email: 'Te.st+alias@gmail.com' }).expect(200);
  await request(app).post('/forgot-password').send({ email: 'test@gmail.com' }).expect(200);
  await request(app).post('/register/resend').send({ email: 'test@gmail.com' }).expect(429);
  await request(app).post('/register/resend').send({ email: 'another@gmail.com' }).expect(200);
});
test('authenticated account limits use verified identity, not IP/body/rotating tokens', async () => {
  const app = express(); app.use(express.json());
  const limits = createAuthLimiters({ SECURITY_ACCOUNT_MAX_REQUESTS: '2' });
  // Simulated protect result; real protect/revocation/RBAC is regression-tested separately.
  app.use((req, _res, next) => { req.user = { _id: req.headers['x-test-user'] || 'A' }; next(); });
  app.use(limits.securityAccountLimiter);
  app.post('*', (_req, res) => res.sendStatus(200));
  await request(app).post('/recovery').set('Authorization', 'Bearer token1').expect(200);
  await request(app).post('/password').set('Authorization', 'Bearer token2').expect(200);
  await request(app).post('/logout').send({ userId: 'B' }).expect(429);
  await request(app).post('/logout').set('x-test-user', 'B').expect(200);
});
test('aggregate mutation budget does not count read polling', async () => {
  const app = express(); app.use(createAuthLimiters({ AUTH_RATE_LIMIT_MAX_REQUESTS: '1' }).authMutationIpLimiter);
  app.use((_req, res) => res.sendStatus(200));
  await request(app).get('/me').expect(200); await request(app).get('/me').expect(200);
  await request(app).post('/login').expect(200); await request(app).post('/refresh').expect(429);
});
test('expired windows reset without waiting in real time', async () => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
  try {
    jest.setSystemTime(new Date('2026-10-20T00:00:00Z'));
    const app = appWithApi({ RATE_LIMIT_WINDOW_MS: '1000', RATE_LIMIT_MAX_REQUESTS: '1' });
    await request(app).get('/api').expect(200); await request(app).get('/api').expect(429);
    jest.setSystemTime(new Date('2026-10-20T00:00:02Z'));
    await request(app).get('/api').expect(200);
  } finally { jest.useRealTimers(); }
});
