const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// User validation rules
exports.registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('role').optional().isIn(['citizen', 'repair_personnel', 'barangay_official', 'city_engineer', 'utility_provider', 'admin'])
    .withMessage('Invalid role'),
  body('barangay').optional().trim(),
  body('address').optional().isObject()
];

exports.loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Incident validation rules
exports.createIncidentValidation = [
  body('category').isIn(['road', 'drainage', 'electrical', 'water', 'gas', 'streetlight', 'other'])
    .withMessage('Valid category is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates required'),
  body('location.coordinates.*').isFloat().withMessage('Coordinates must be numbers'),
  body('location.address.barangay').trim().notEmpty().withMessage('Barangay is required'),
  body('priority').optional().isIn(['critical', 'high', 'medium', 'low'])
];

exports.updateIncidentValidation = [
  body('status').optional().isIn(['submitted', 'validated', 'assigned', 'in_progress', 'completed', 'verified', 'rejected', 'duplicate', 'closed']),
  body('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
  body('notes').optional().trim(),
  body('rejectionReason').optional().trim()
];

// Work order validation rules
exports.createWorkOrderValidation = [
  body('incident').isMongoId().withMessage('Valid incident ID is required'),
  body('assignedTo').isMongoId().withMessage('Valid user ID is required'),
  body('priority').isIn(['critical', 'high', 'medium', 'low']).withMessage('Valid priority is required'),
  body('instructions').optional().trim()
];

exports.updateWorkOrderValidation = [
  body('status').optional().isIn(['pending', 'accepted', 'in_progress', 'completed', 'verified', 'rejected']),
  body('notes').optional().trim()
];

// Query validation
exports.paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().trim(),
  query('status').optional().trim(),
  query('priority').optional().trim()
];

// ID parameter validation
exports.mongoIdValidation = [
  param('id').isMongoId().withMessage('Invalid ID format')
];
