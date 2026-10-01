const mongoose = require('mongoose');
const {
  DAGUPAN_BARANGAYS,
  canonicalizeBarangay,
  isRecognizedBarangay
} = require('../data/dagupanBarangays');

/**
 * Validate MongoDB ObjectId
 * @param {String} id - ID to validate
 * @returns {Boolean} Is valid
 */
exports.isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} Is valid
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Philippine format)
 * @param {String} phone - Phone number to validate
 * @returns {Boolean} Is valid
 */
exports.isValidPhoneNumber = (phone) => {
  // Philippine phone numbers: 09XX-XXX-XXXX or +639XX-XXX-XXXX
  const phoneRegex = /^(\+639|09)\d{9}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
};

/**
 * Validate coordinates
 * @param {Number} longitude - Longitude
 * @param {Number} latitude - Latitude
 * @returns {Boolean} Is valid
 */
exports.isValidCoordinates = (longitude, latitude) => {
  return (
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object} Validation result with strength score
 */
exports.validatePasswordStrength = (password) => {
  const result = {
    isValid: false,
    score: 0,
    issues: []
  };

  if (password.length < 8) {
    result.issues.push('Password must be at least 8 characters long');
  } else {
    result.score += 1;
  }

  if (!/[a-z]/.test(password)) {
    result.issues.push('Password must contain lowercase letters');
  } else {
    result.score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    result.issues.push('Password must contain uppercase letters');
  } else {
    result.score += 1;
  }

  if (!/\d/.test(password)) {
    result.issues.push('Password must contain numbers');
  } else {
    result.score += 1;
  }

  if (!/[@$!%*?&#]/.test(password)) {
    result.score += 0.5;
  } else {
    result.score += 1;
  }

  result.isValid = result.issues.length === 0;

  return result;
};

/**
 * Sanitize user input
 * @param {String} input - Input string
 * @returns {String} Sanitized string
 */
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Validate barangay name (Dagupan City)
 * @param {String} barangay - Barangay name
 * @returns {Boolean} Is valid
 */
exports.BARANGAYS = DAGUPAN_BARANGAYS;
exports.canonicalizeBarangay = canonicalizeBarangay;
exports.isValidBarangay = isRecognizedBarangay;
