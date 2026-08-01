const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

/**
 * Create an audit log entry
 * @param {Object} logData - Audit log data
 * @returns {Promise<Object>} Created audit log
 */
exports.createAuditLog = async (logData) => {
  try {
    const auditLog = await AuditLog.create(logData);
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
          details: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: sanitizeBody(req.body)
          },
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

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body) {
  if (!body) return {};
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}
