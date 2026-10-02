const radians = (degrees) => degrees * Math.PI / 180;
exports.distanceInMeters = ([lonA, latA], [lonB, latB]) => {
  const a = Math.sin(radians(latB - latA) / 2) ** 2
    + Math.cos(radians(latA)) * Math.cos(radians(latB))
    * Math.sin(radians(lonB - lonA) / 2) ** 2;
  const clamped = Math.max(0, Math.min(1, a));
  return 6371000 * 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped));
};
