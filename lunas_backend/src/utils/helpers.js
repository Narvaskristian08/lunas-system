const crypto = require('crypto');

/**
 * Generate random string
 * @param {Number} length - String length
 * @returns {String} Random string
 */
exports.generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate UUID v4
 * @returns {String} UUID
 */
exports.generateUUID = () => {
  return crypto.randomUUID();
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {Number} lat1 - Latitude 1
 * @param {Number} lon1 - Longitude 1
 * @param {Number} lat2 - Latitude 2
 * @param {Number} lon2 - Longitude 2
 * @returns {Number} Distance in meters
 */
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Format date to readable string
 * @param {Date} date - Date object
 * @returns {String} Formatted date
 */
exports.formatDate = (date) => {
  return new Date(date).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate time difference in hours
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Number} Hours difference
 */
exports.getHoursDifference = (startDate, endDate) => {
  const diff = new Date(endDate) - new Date(startDate);
  return Math.floor(diff / (1000 * 60 * 60));
};

/**
 * Paginate array
 * @param {Array} array - Array to paginate
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Object} Paginated result
 */
exports.paginateArray = (array, page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    page: parseInt(page),
    limit: parseInt(limit),
    total: array.length,
    pages: Math.ceil(array.length / limit)
  };
};

/**
 * Sleep/delay function
 * @param {Number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
exports.sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Remove undefined/null values from object
 * @param {Object} obj - Object to clean
 * @returns {Object} Cleaned object
 */
exports.removeEmpty = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null)
  );
};
