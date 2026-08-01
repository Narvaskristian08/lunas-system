/**
 * Format success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {*} data - Response data
 * @param {Object} meta - Additional metadata
 */
exports.successResponse = (res, statusCode = 200, message, data = null, meta = {}) => {
  const response = {
    success: true,
    message,
    ...(data && { data }),
    ...meta
  };

  return res.status(statusCode).json(response);
};

/**
 * Format error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Array} errors - Validation errors
 */
exports.errorResponse = (res, statusCode = 500, message, errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors })
  };

  return res.status(statusCode).json(response);
};

/**
 * Format paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Data array
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @param {Number} total - Total items count
 * @param {String} message - Success message
 */
exports.paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    }
  });
};
