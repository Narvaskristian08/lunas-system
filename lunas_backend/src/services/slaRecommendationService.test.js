jest.mock('axios', () => ({ post: jest.fn() }));
const axios = require('axios');
const { recommendSla } = require('./slaRecommendationService');
const env = { SLA_AI_ENABLED: 'true', SLA_AI_FREE_TIER_CONFIRMED: 'true', GEMINI_API_KEY: 'test-only-key' };
const incident = { category: 'road', reporter: { email: 'private@example.test' }, description: 'Private citizen description', location: { coordinates: [120, 16] }, aiAnalysis: { analysisStatus: 'completed', detected: true, hazardType: 'pothole', requiresManualReview: true }, sla: { deadline: '2027-01-01T00:00:00.000Z' } };
const output = { durationHours: 72, explanation: 'Inspect scope and crew availability before accepting this estimate.', assumptions: ['No measurements or crew capacity provided.', 'Procurement excluded.'] };
const response = value => ({ data: { modelVersion: 'gemini-3.5-flash-lite', candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }] } });
beforeEach(() => jest.clearAllMocks());

test('uses real provider output rather than the fixed target or deadline difference, with no SLA mutation', async () => {
  axios.post.mockResolvedValue(response(output));
  const before = JSON.stringify(incident);
  const result = await recommendSla(incident, 'low', 336, env, new Date('2026-10-28T00:00:00Z'));
  expect(result).toMatchObject({ source: 'ai_model', model: 'gemini-3.5-flash-lite', durationHours: 72, policyReferenceHours: 336, advisoryOnly: true, referenceDeadline: '2026-10-31T00:00:00.000Z' });
  expect(JSON.stringify(incident)).toBe(before);
  const [url, payload, config] = axios.post.mock.calls[0];
  expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
  expect(payload).toMatchObject({ generationConfig: { responseMimeType: 'application/json', responseJsonSchema: { type: 'object' } } });
  expect(config.headers['x-goog-api-key']).toBe('test-only-key');
  expect(JSON.stringify(payload)).not.toMatch(/private@example|Private citizen|coordinates|2027-01-01/);
  expect(config.maxRedirects).toBe(0);
});
test.each([{}, { ...env, SLA_AI_ENABLED: 'false' }, { SLA_AI_ENABLED: 'true' }])('unconfigured or disabled provider does not return fake AI guidance', async config => {
  await expect(recommendSla(incident, 'low', 336, config)).rejects.toMatchObject({ statusCode: 503 });
  expect(axios.post).not.toHaveBeenCalled();
});
test.each([0, -1, 1.5, 8761, '72', null])('rejects invalid model duration %p without a rule fallback', async hours => {
  axios.post.mockResolvedValue(response({ ...output, durationHours: hours }));
  await expect(recommendSla(incident, 'low', 336, env)).rejects.toMatchObject({ statusCode: 503 });
});
test.each([{ ...output, explanation: '' }, { ...output, assumptions: [] }, { ...output, assumptions: [null] }])('rejects incomplete model explanations', async value => {
  axios.post.mockResolvedValue(response(value));
  await expect(recommendSla(incident, 'low', 336, env)).rejects.toMatchObject({ statusCode: 503 });
});
test('refusal/incomplete output is unavailable, never an official deadline', async () => {
  axios.post.mockResolvedValue({ data: { status: 'incomplete', output: [] } });
  await expect(recommendSla(incident, 'low', 336, env)).rejects.toMatchObject({ statusCode: 503 });
});
test('network/provider errors never expose server credentials or provider response', async () => {
  axios.post.mockRejectedValue(new Error('secret-key provider error'));
  await expect(recommendSla(incident, 'low', 336, env)).rejects.toThrow('AI SLA recommendation is unavailable. Set the agency deadline manually.');
});
test('requires deployment confirmation of an unbilled free-tier project', async () => {
  await expect(recommendSla(incident, 'low', 336, { ...env, SLA_AI_FREE_TIER_CONFIRMED: 'false' })).rejects.toMatchObject({ statusCode: 503 });
  expect(axios.post).not.toHaveBeenCalled();
});
test('quota exhaustion never retries or falls back to a paid model', async () => {
  axios.post.mockRejectedValue({ response: { status: 429 } });
  await expect(recommendSla(incident, 'low', 336, env)).rejects.toMatchObject({ statusCode: 503 });
  expect(axios.post).toHaveBeenCalledTimes(1);
});
