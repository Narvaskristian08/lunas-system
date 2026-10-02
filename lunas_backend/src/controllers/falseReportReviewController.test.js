jest.mock('../models/Incident', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn(), countDocuments: jest.fn() }));
const Incident = require('../models/Incident');
const { getReview, saveReview } = require('./falseReportReviewController');
const req = (body = {}, role = 'barangay_official') => ({ params: { id: 'incident' },
  user: { _id: 'official', role, barangay: 'Pantal' }, body });
const res = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const body = { finding: 'confirmed_fabrication', reason: 'Site inspection and cited evidence confirm deliberate fabrication.', evidenceReference: 'Inspection record 123', expectedVersion: 0 };
beforeEach(() => { jest.clearAllMocks(); Incident.findOne.mockResolvedValue({ status: 'rejected', reporter: 'citizen' }); });
test.each(['citizen', 'utility_provider', 'repair_personnel', 'admin'])('%s cannot access or write sensitive review', async (role) => {
  const response = res(); await getReview(req({}, role), response, jest.fn());
  expect(response.status).toHaveBeenCalledWith(403);
  await saveReview(req(body, role), response, jest.fn());
  expect(Incident.findOne).not.toHaveBeenCalled();
});
test('review lookup and repeat count include canonical official jurisdiction', async () => {
  Incident.countDocuments.mockResolvedValue(2);
  const response = res(); await getReview(req(), response, jest.fn());
  expect(JSON.stringify(Incident.findOne.mock.calls[0][0])).toContain('Pantal');
  expect(JSON.stringify(Incident.countDocuments.mock.calls[0][0])).toContain('Pantal');
  expect(JSON.stringify(Incident.countDocuments.mock.calls[0][0])).toContain('confirmed_fabrication');
  expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ confirmedFindingsInScope: 2 }) }));
});
test('out of scope incident does not disclose a finding or count', async () => {
  Incident.findOne.mockResolvedValue(null);
  const response = res(); await getReview(req(), response, jest.fn());
  expect(response.status).toHaveBeenCalledWith(404); expect(Incident.countDocuments).not.toHaveBeenCalled();
});
test.each(['submitted', 'duplicate', 'closed'])('%s does not justify a false-report finding', async (status) => {
  Incident.findOne.mockResolvedValue({ status });
  const response = res(); await saveReview(req(body), response, jest.fn());
  expect(response.status).toHaveBeenCalledWith(409); expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
});
test('documented finding atomically appends actor and evidence without lifecycle or account mutation', async () => {
  Incident.findOneAndUpdate.mockResolvedValue({ falseReportReview: { version: 1 } });
  await saveReview(req(body), res(), jest.fn());
  const [filter, update] = Incident.findOneAndUpdate.mock.calls[0];
  expect(JSON.stringify(filter)).toContain('Pantal');
  expect(update.$push['falseReportReview.history']).toMatchObject({ reviewedBy: 'official', evidenceReference: body.evidenceReference });
  expect(Object.keys(update.$set)).toEqual(['falseReportReview.finding']);
  expect(update.$inc).toEqual({ 'falseReportReview.version': 1 });
});
test('correction keeps append-only history and removes active count eligibility', async () => {
  Incident.findOne.mockResolvedValue({ status: 'rejected', falseReportReview: { finding: 'confirmed_fabrication', version: 1 } });
  Incident.findOneAndUpdate.mockResolvedValue({ falseReportReview: { finding: 'corrected', version: 2 } });
  await saveReview(req({ ...body, finding: 'corrected', expectedVersion: 1 }), res(), jest.fn());
  expect(Incident.findOneAndUpdate.mock.calls[0][1].$set).toEqual({ 'falseReportReview.finding': 'corrected' });
  expect(Incident.findOneAndUpdate.mock.calls[0][1].$push['falseReportReview.history'].finding).toBe('corrected');
});
test('concurrent correction or finding requires reload', async () => {
  Incident.findOneAndUpdate.mockResolvedValue(null);
  const response = res(); await saveReview(req(body), response, jest.fn());
  expect(response.status).toHaveBeenCalledWith(409);
});
test.each([{ ...body, reason: 'short' }, { ...body, evidenceReference: '' }, { ...body, expectedVersion: -1 }])('undocumented findings are rejected', async (input) => {
  const response = res(); await saveReview(req(input), response, jest.fn());
  expect(response.status).toHaveBeenCalledWith(400); expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
});
