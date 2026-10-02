const { distanceInMeters } = require('../utils/geodesic');
const fail = (message) => { throw Object.assign(new Error(message), { statusCode: 400 }); };
const positive = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};
exports.getLocationPolicy = () => ({
  thresholdMeters: positive('LOCATION_DISCREPANCY_METERS', 500),
  maxAccuracyMeters: positive('LOCATION_MAX_ACCURACY_METERS', 100),
  maxAgeSeconds: positive('LOCATION_MAX_AGE_SECONDS', 120)
});
const coordinatesValid = (value) => Array.isArray(value) && value.length === 2
  && value.every((v) => typeof v === 'number' && Number.isFinite(v))
  && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90;
const reasons = ['photo_taken_earlier', 'gps_inaccurate', 'reporting_elsewhere', 'other'];
// All GPS inputs are untrusted. Derived values are recomputed; raw current
// coordinates are transient and never returned by this function.
exports.buildLocationIntegrity = (input, incidentCoordinates, now = new Date()) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Location confirmation is required');
  if (input.confirmed !== true) fail('Confirm that the pin represents the actual damage location');
  if (!['gps', 'map_pin', 'manual'].includes(input.pinSource)) fail('Choose a valid pin selection source');
  if (!coordinatesValid(incidentCoordinates)) fail('Valid incident coordinates are required');
  const policy = exports.getLocationPolicy();
  let comparison = 'unavailable';
  let unavailableReason = 'not_provided';
  let distanceMeters;
  let accuracyMeters;
  const gps = input.gps;
  if (gps != null) {
    if (!coordinatesValid(gps.coordinates) || typeof gps.accuracyMeters !== 'number'
        || !Number.isFinite(gps.accuracyMeters) || gps.accuracyMeters < 0
        || typeof gps.capturedAt !== 'string' || !Number.isFinite(Date.parse(gps.capturedAt))) {
      fail('Invalid GPS comparison data');
    }
    const age = now.getTime() - Date.parse(gps.capturedAt);
    comparison = 'inconclusive';
    unavailableReason = age < -5000 ? 'future_fix' : age > policy.maxAgeSeconds * 1000 ? 'stale_fix'
      : gps.accuracyMeters > policy.maxAccuracyMeters ? 'poor_accuracy' : undefined;
    if (!unavailableReason) {
      accuracyMeters = gps.accuracyMeters;
      const distance = distanceInMeters(incidentCoordinates, gps.coordinates);
      distanceMeters = Math.round(distance);
      comparison = Math.max(0, distance - accuracyMeters) > policy.thresholdMeters ? 'discrepancy' : 'consistent';
    }
  } else if (['denied', 'unavailable'].includes(input.unavailableReason)) {
    unavailableReason = input.unavailableReason;
  }
  let explanation;
  if (input.explanation != null) {
    const reason = input.explanation.reason;
    const text = typeof input.explanation.text === 'string' ? input.explanation.text.trim() : '';
    if (!reasons.includes(reason) || text.length > 500 || (reason === 'other' && text.length < 10)) {
      fail('Choose an explanation; Other requires 10-500 characters');
    }
    explanation = { reason, ...(text ? { text } : {}) };
  }
  if (comparison === 'discrepancy' && !explanation) fail('Explain why the damage location differs from current GPS');
  return {
    pinSource: input.pinSource, comparison, unavailableReason, distanceMeters, accuracyMeters,
    significantDiscrepancy: comparison === 'discrepancy', thresholdMeters: policy.thresholdMeters,
    explanation, confirmedAt: now, jurisdictionStatus: 'unverified_geographically'
  };
};
exports.safeLocationIntegrity = (value) => {
  if (!value) return undefined;
  const source = value.toObject ? value.toObject() : value;
  return Object.fromEntries(['pinSource', 'comparison', 'unavailableReason', 'distanceMeters',
    'accuracyMeters', 'significantDiscrepancy', 'thresholdMeters', 'explanation', 'confirmedAt',
    'jurisdictionStatus'].map((key) => [key, source[key]]));
};
