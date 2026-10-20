jest.mock('../models/User', () => ({ findById: jest.fn() }));
jest.mock('../models/Incident', () => ({ aggregate: jest.fn() }));
jest.mock('../utils/authTokens', () => ({ verifyAccessToken: jest.fn(() => ({ id: 'user', tokenType: 'access' })), isCurrentTokenVersion: jest.fn(() => true) }));
const express = require('express');
const request = require('supertest');
const { aggregate } = require('mingo');
const User = require('../models/User');
const Incident = require('../models/Incident');
const app = express(); app.use('/reports', require('./operationalReportRoutes')); app.use(require('../middleware/errorHandler'));
let user;
const originalEnv = { ...process.env };
beforeEach(() => {
  user = { _id: 'u', role: 'barangay_official', barangay: 'Pantal', isActive: true };
  User.findById.mockImplementation(() => ({ select: async () => user }));
  Incident.aggregate.mockImplementation(pipeline => ({ option: async () => aggregate([{ _id: 'incident', reportNumber: 'SAFE-REFERENCE', category: 'road', status: 'submitted', jurisdiction: { barangay: 'Pantal' }, createdAt: new Date() }], pipeline, { collectionResolver: () => [] }) }));
  process.env.OPERATIONAL_REPORT_CSV_ROLES = 'barangay_official'; process.env.OPERATIONAL_REPORT_PDF_ROLES = 'barangay_official';
});
afterAll(() => { process.env = originalEnv; });
test.each(['', '/csv', '/pdf'])('unauthenticated %s requests are denied', async path => { await request(app).get(`/reports${path}`).expect(401); });
test.each(['', '/csv', '/pdf'])('suspended account cannot access %s', async path => { user.accountStatus = 'suspended'; await request(app).get(`/reports${path}`).set('Authorization', 'Bearer fixture').expect(401); });
test.each(['/csv', '/pdf'])('direct %s enforces independent export policy', async path => {
  process.env.OPERATIONAL_REPORT_CSV_ROLES = ''; process.env.OPERATIONAL_REPORT_PDF_ROLES = '';
  await request(app).get('/reports').set('Authorization', 'Bearer fixture').expect(200);
  await request(app).get(`/reports${path}`).set('Authorization', 'Bearer fixture').expect(403);
});
test('authorized CSV has safe headers and full selected output bytes', async () => {
  const response = await request(app).get('/reports/csv').set('Authorization', 'Bearer fixture').expect(200);
  expect(response.headers['content-type']).toContain('text/csv'); expect(response.headers['content-disposition']).toMatch(/^attachment; filename="lunas-monthly-submitted.csv"$/); expect(response.headers['cache-control']).toContain('no-store'); expect(response.text).toContain('SAFE-REFERENCE');
});
test('authorized PDF is a genuine private download', async () => {
  const response = await request(app).get('/reports/pdf').set('Authorization', 'Bearer fixture').expect(200);
  expect(response.headers['content-type']).toContain('application/pdf'); expect(Buffer.from(response.body).subarray(0, 5).toString()).toBe('%PDF-'); expect(response.headers['content-disposition']).toContain('.pdf');
});
test('query structures and unsafe filename period values are rejected', async () => {
  await request(app).get('/reports?category[$ne]=road').set('Authorization', 'Bearer fixture').expect(400);
  await request(app).get('/reports/csv?period=monthly%0d%0ax-injected:yes').set('Authorization', 'Bearer fixture').expect(400);
});
test('administrator cannot obtain operational exports even when accidentally listed in configuration', async () => {
  user.role = 'admin'; process.env.OPERATIONAL_REPORT_CSV_ROLES = 'admin';
  await request(app).get('/reports/csv').set('Authorization', 'Bearer fixture').expect(403);
});
