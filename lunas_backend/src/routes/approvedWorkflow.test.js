jest.mock('../middleware/auth', () => ({
  protect: (req, _res, next) => { req.user = { _id: 'test-user', role: req.headers['x-test-role'], barangay: 'Pantal' }; next(); },
  authorize: (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ success: false })
}));
const express = require('express');
const request = require('supertest');
const app = express(); app.use(express.json());
app.use('/incidents', require('./incidentRoutes'));
app.use('/work-orders', require('./workOrderRoutes'));
const id = '507f191e810c19729de860a1';

test('Secretary legacy validation cannot bypass field verification', async () => {
  const res = await request(app).post(`/incidents/${id}/validate`).set('x-test-role', 'barangay_official').send({ jurisdiction: { barangay: 'Pantal', city: 'Dagupan City' } });
  expect(res.status).toBe(409);
});
test('Secretary legacy priority API cannot override agency authority', async () => {
  const res = await request(app).patch(`/incidents/${id}/priority`).set('x-test-role', 'barangay_official').send({ priority: 'high' });
  expect(res.status).toBe(409);
});
test('provider legacy acceptance cannot bypass Secretary final acceptance', async () => {
  const res = await request(app).post(`/work-orders/${id}/provider-review`).set('x-test-role', 'utility_provider').send({ decision: 'accepted' });
  expect(res.status).toBe(409);
});
test.each(['citizen', 'utility_personnel', 'admin'])('%s cannot update agency status through the API', async role => {
  const res = await request(app).patch(`/incidents/${id}/agency-status`).set('x-test-role', role).send({ status: 'work_completed' });
  expect(res.status).toBe(403);
});
