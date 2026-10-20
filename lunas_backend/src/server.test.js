const request = require('supertest');
const app = require('./server');

describe('API security baseline', () => {
  test('actual server mounts the global budget across API paths and excludes health', async () => {
    const previousLimit = process.env.RATE_LIMIT_MAX_REQUESTS;
    const previousProxy = process.env.TRUST_PROXY;
    try {
      process.env.RATE_LIMIT_MAX_REQUESTS = '2'; process.env.TRUST_PROXY = '0';
      let limitedApp;
      jest.isolateModules(() => { limitedApp = require('./server'); });
      await request(limitedApp).get('/api/v1').expect(200);
      await request(limitedApp).get('/api/unknown').expect(404);
      const res = await request(limitedApp).get('/api/v1/incidents/my').expect(429);
      expect(res.body.code).toBe('RATE_LIMITED');
      await request(limitedApp).get('/health').expect(200);
      await request(limitedApp).get('/health/ready').expect(503);
    } finally {
      if (previousLimit === undefined) delete process.env.RATE_LIMIT_MAX_REQUESTS;
      else process.env.RATE_LIMIT_MAX_REQUESTS = previousLimit;
      if (previousProxy === undefined) delete process.env.TRUST_PROXY;
      else process.env.TRUST_PROXY = previousProxy;
    }
  });
  test('does not connect to MongoDB merely by importing the app for tests', async () => {
    await request(app)
      .get('/health')
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('OK');
      });
  });

  test('reports not ready until the required MongoDB dependency is connected', async () => {
    await request(app)
      .get('/health/ready')
      .expect(503)
      .expect((response) => {
        expect(response.body).toEqual({
          status: 'not_ready',
          dependencies: { mongodb: 'disconnected' }
        });
      });
  });

  test('protects citizen report routes when no access token is supplied', async () => {
    await request(app)
      .get('/api/v1/incidents/my')
      .expect(401)
      .expect((response) => {
        expect(response.body).toEqual(expect.objectContaining({ success: false }));
      });
  });
});
