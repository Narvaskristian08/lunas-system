const Incident = require('../models/Incident');
const logger = require('../utils/logger');

const toRadians = (degrees) => degrees * (Math.PI / 180);

const distanceInMeters = ([longitudeA, latitudeA], [longitudeB, latitudeB]) => {
  const earthRadius = 6371000;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB))
    * Math.sin(deltaLongitude / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const duplicateWindowHours = () => parseInt(process.env.DUPLICATE_WINDOW_HOURS, 10) || 72;
const duplicateRadiusMeters = () => parseInt(process.env.DUPLICATE_RADIUS_METERS, 10) || 100;

/**
 * Find conservative possible-duplicate candidates. A match requires the same
 * category, a nearby coordinate, and a recent submission. The caller stores
 * this only as advisory metadata; it never auto-changes an incident status.
 */
exports.findPossibleDuplicateCandidates = async ({ category, coordinates }) => {
  const [longitude, latitude] = coordinates;
  const radiusMeters = duplicateRadiusMeters();
  const windowHours = duplicateWindowHours();
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  try {
    const incidents = await Incident.find({
      category,
      status: { $nin: ['rejected', 'closed'] },
      createdAt: { $gte: cutoff },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: radiusMeters
        }
      }
    })
      .select('_id reportNumber location createdAt')
      .limit(5)
      .lean();

    const now = Date.now();
    return incidents
      .map((incident) => {
        const distanceMeters = distanceInMeters(coordinates, incident.location.coordinates);
        const recencyRatio = Math.max(0, 1 - ((now - new Date(incident.createdAt).getTime())
          / (windowHours * 60 * 60 * 1000)));
        const proximityRatio = Math.max(0, 1 - (distanceMeters / radiusMeters));

        return {
          incident: incident._id,
          reportNumber: incident.reportNumber,
          distanceMeters: Math.round(distanceMeters),
          score: Math.round((proximityRatio * 0.7 + recencyRatio * 0.3) * 100),
          detectedAt: new Date()
        };
      })
      .filter((candidate) => candidate.distanceMeters <= radiusMeters);
  } catch (error) {
    // Duplicate hints improve triage but must never prevent a citizen from
    // reporting a real hazard when the geospatial index is unavailable.
    logger.warn(`Possible duplicate lookup skipped: ${error.message}`);
    return [];
  }
};

exports.distanceInMeters = distanceInMeters;
