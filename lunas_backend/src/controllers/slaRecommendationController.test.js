jest.mock('../models/Incident', () => ({ findOne: jest.fn() }));
jest.mock('../services/slaService', () => ({ getSLAHours: () => 336 }));
jest.mock('../services/slaRecommendationService', () => ({ recommendSla: jest.fn() }));
const Incident = require('../models/Incident');
const { recommendSla } = require('../services/slaRecommendationService');
const { getRecommendation } = require('./slaRecommendationController');
const user = { _id: 'agency-user', role: 'utility_provider', utilityCompany: 'Scoped Agency' };
const request = overrides => ({ user, params: { id: 'report' }, body: { priority: 'low' }, ...overrides });
const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), set: jest.fn() });
beforeEach(() => jest.clearAllMocks());
test.each(['citizen', 'utility_personnel', 'barangay_official', 'repair_personnel', 'admin'])('%s cannot request agency AI guidance', async role => {
  const response = res();await getRecommendation(request({ user: { ...user, role } }), response, jest.fn());
  expect(response.status).toHaveBeenCalledWith(403);expect(Incident.findOne).not.toHaveBeenCalled();expect(recommendSla).not.toHaveBeenCalled();
});
test('cross-organization request is scoped and returns 404 before any model call', async () => {
  Incident.findOne.mockResolvedValue(null);const response = res();await getRecommendation(request(), response, jest.fn());
  expect(Incident.findOne).toHaveBeenCalledWith({ _id: 'report', 'routing.responsibleOrganization': 'Scoped Agency' });
  expect(response.status).toHaveBeenCalledWith(404);expect(recommendSla).not.toHaveBeenCalled();
});
test.each(['work_in_progress', 'work_completed', 'correction_required'])('does not generate new planning advice at %s', async agencyStatus => {
  Incident.findOne.mockResolvedValue({ agencyStatus, status: 'provider_assigned' });const response = res();
  await getRecommendation(request(), response, jest.fn());expect(response.status).toHaveBeenCalledWith(409);expect(recommendSla).not.toHaveBeenCalled();
});
test('returns advisory output with no incident write and does not choose a priority', async () => {
  const incident = { agencyStatus: 'pending_procurement', status: 'provider_assigned', save: jest.fn() };
  Incident.findOne.mockResolvedValue(incident);recommendSla.mockResolvedValue({ advisoryOnly: true, durationHours: 72 });
  const response = res();await getRecommendation(request(), response, jest.fn());
  expect(recommendSla).toHaveBeenCalledWith(incident, 'low', 336);expect(incident.save).not.toHaveBeenCalled();expect(incident.priority).toBeUndefined();
  expect(response.set).toHaveBeenCalledWith('Cache-Control', 'no-store');expect(response.json).toHaveBeenCalledWith({ success: true, data: { advisoryOnly: true, durationHours: 72 } });
});
test('provider outage propagates a sanitized 503 without updating the record', async () => {
  const incident = { agencyStatus: 'ready_for_work', save: jest.fn() };Incident.findOne.mockResolvedValue(incident);
  recommendSla.mockRejectedValue(Object.assign(new Error('AI unavailable'), { statusCode: 503 }));const next = jest.fn();
  await getRecommendation(request(), res(), next);expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 503 }));expect(incident.save).not.toHaveBeenCalled();
});
