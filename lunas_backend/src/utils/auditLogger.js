const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'captchatoken',
  'challengetoken',
  'verificationtoken',
  'secret',
  'apikey',
  'authorization',
  'code',
  'otp'
]);

const normalizeKey = (key) => String(key).replace(/[^a-z0-9]/gi, '').toLowerCase();

const sanitizeAuditValue = (value, depth = 0) => {
  if (depth > 8) return '[TRUNCATED]';
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditValue(item, depth + 1));
  if (!value || typeof value !== 'object' || value instanceof Date) return value;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;

  return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [
    key,
    SENSITIVE_KEYS.has(normalizeKey(key))
      ? REDACTED
      : sanitizeAuditValue(nestedValue, depth + 1)
  ]));
};

exports.sanitizeAuditValue = sanitizeAuditValue;

/**
 * Create an audit log entry
 * @param {Object} logData - Audit log data
 * @returns {Promise<Object>} Created audit log
 */
exports.createAuditLog = async (logData) => {
  try {
    const auditLog = await AuditLog.create({
      ...logData,
      actorType: logData.actorType || (logData.performedBy ? 'user' : 'system'),
      details: sanitizeAuditValue(logData.details || {}),
      changes: sanitizeAuditValue(logData.changes)
    });
    return auditLog;
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw error to prevent breaking the main operation
    return null;
  }
};

/**
 * Middleware to automatically log certain actions
 */
exports.auditMiddleware = (action, resourceType = null) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to capture response
    res.json = function(data) {
      // Only log if operation was successful
      if (data.success !== false && req.user) {
        const logData = {
          action,
          performedBy: req.user._id,
          resourceType,
          resourceId: req.params.id || data.data?._id,
          details: sanitizeAuditValue({
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.body
          }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'success'
        };

        // Create audit log asynchronously (don't wait)
        exports.createAuditLog(logData).catch(err => {
          logger.error('Audit log creation failed:', err);
        });
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};
