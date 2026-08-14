const request = require('supertest');
const app = require('./server');

describe('API security baseline', () => {
  test('does not connect to MongoDB merely by importing the app for tests', async () => {
    await request(app)
      .get('/health')
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('OK');
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
