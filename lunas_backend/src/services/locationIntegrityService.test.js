const { buildLocationIntegrity, safeLocationIntegrity, getLocationPolicy } = require('./locationIntegrityService');
const now = new Date('2026-10-02T00:00:00Z');
const pin = [120.3333, 16.0433];
const input = (gps, explanation) => ({ confirmed: true, pinSource: 'map_pin', gps, explanation });
const fix = (coordinates = pin, accuracyMeters = 10, ageSeconds = 0) => ({ coordinates,
  accuracyMeters, capturedAt: new Date(now.getTime() - ageSeconds * 1000).toISOString() });
const compare = (gps, explanation) => buildLocationIntegrity(input(gps, explanation), pin, now);

test('accurate matching GPS is consistent', () => expect(compare(fix())).toMatchObject({ comparison: 'consistent', distanceMeters: 0 }));
test.each(['photo_taken_earlier', 'reporting_elsewhere', 'gps_inaccurate'])('home and delayed reporting allowed with %s', (reason) => {
  const result = compare(fix([120.4, 16.1]), { reason });
  expect(result.comparison).toBe('discrepancy');
  expect(result.explanation.reason).toBe(reason);
  expect(result).not.toHaveProperty('gps');
});
test('large displacement requires an explanation', () => expect(() => compare(fix([120.4, 16.1]))).toThrow('Explain why'));
test('Other requires useful text', () => {
  expect(() => compare(fix([120.4, 16.1]), { reason: 'other', text: 'short' })).toThrow('Other requires');
  expect(compare(fix([120.4, 16.1]), { reason: 'other', text: 'Submitting this from my home.' }).comparison).toBe('discrepancy');
});
test('accuracy uncertainty is subtracted before threshold decision', () => {
  // About 556m north: 100m uncertainty means no significant difference.
  expect(compare(fix([pin[0], pin[1] + 0.005], 100)).comparison).toBe('consistent');
  expect(() => compare(fix([pin[0], pin[1] + 0.005], 1))).toThrow('Explain why');
});
test.each([[101, 0, 'poor_accuracy'], [10, 121, 'stale_fix'], [10, -6, 'future_fix']])('unusable fix %s/%s is inconclusive', (accuracy, age, reason) => {
  expect(compare(fix([120.4, 16.1], accuracy, age))).toMatchObject({ comparison: 'inconclusive', unavailableReason: reason, significantDiscrepancy: false });
});
test.each(['denied', 'unavailable', undefined])('missing GPS (%s) permits confirmed manual selection', (unavailableReason) => {
  expect(buildLocationIntegrity({ confirmed: true, pinSource: 'manual', unavailableReason }, pin, now)).toMatchObject({ comparison: 'unavailable', significantDiscrepancy: false });
});
test('confirmation is always required including manual reporting', () => {
  expect(() => buildLocationIntegrity(undefined, pin, now)).toThrow('confirmation');
  expect(() => buildLocationIntegrity({ confirmed: false, pinSource: 'manual' }, pin, now)).toThrow('actual damage');
});
test.each([fix([181, 0]), fix(pin, -1), { ...fix(), capturedAt: 'invalid' }, fix(['120', 16])])('invalid GPS is rejected without echoing coordinates', (gps) => {
  expect(() => compare(gps)).toThrow('Invalid GPS comparison data');
});
test('client derived flags, timestamp, threshold and jurisdiction are ignored', () => {
  const result = buildLocationIntegrity({ ...input(fix()), comparison: 'discrepancy', distanceMeters: 99999,
    confirmedAt: '2000-01-01', thresholdMeters: 0, jurisdictionStatus: 'verified' }, pin, now);
  expect(result).toMatchObject({ comparison: 'consistent', distanceMeters: 0, confirmedAt: now,
    thresholdMeters: 500, jurisdictionStatus: 'unverified_geographically' });
});
test('policy is configurable and invalid configuration falls back safely', () => {
  process.env.LOCATION_DISCREPANCY_METERS = '750';
  expect(getLocationPolicy().thresholdMeters).toBe(750);
  process.env.LOCATION_DISCREPANCY_METERS = '-1';
  expect(getLocationPolicy().thresholdMeters).toBe(500);
  delete process.env.LOCATION_DISCREPANCY_METERS;
});
test('safe projection drops injected raw GPS and arbitrary metadata', () => {
  expect(safeLocationIntegrity({ comparison: 'consistent', gps: fix(), currentPosition: pin })).not.toHaveProperty('gps');
});
