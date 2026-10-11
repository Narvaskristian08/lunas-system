const { body, param, query, validationResult } = require('express-validator');
const { INCIDENT_CATEGORY_CODES } = require('../utils/incidentCategories');
const {
  canonicalizeBarangay,
  canonicalizeDagupanCity,
  isRecognizedBarangay
} = require('../data/dagupanBarangays');

const canonicalBarangay = (field, { optional = false } = {}) => {
  let rule = body(field);
  if (optional) rule = rule.optional();
  return rule
    .isString().withMessage('Choose a recognized Dagupan barangay').bail()
    .customSanitizer((value) => canonicalizeBarangay(value) || value)
    .custom(isRecognizedBarangay)
    .withMessage('Choose a recognized Dagupan barangay');
};

const dagupanCity = (field, { optional = false } = {}) => {
  let rule = body(field);
  if (optional) rule = rule.optional();
  return rule
    .isString().withMessage('City must be Dagupan City').bail()
    .customSanitizer((value) => canonicalizeDagupanCity(value) || value)
    .custom((value) => canonicalizeDagupanCity(value) !== null)
    .withMessage('City must be Dagupan City');
};

const passwordValidationRule = (field) => body(field)
  .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must contain uppercase, lowercase, and number');

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
  body('firstName').trim().isLength({ min: 1, max: 80 }).withMessage('First name is required and must be at most 80 characters'),
  body('lastName').trim().isLength({ min: 1, max: 80 }).withMessage('Last name is required and must be at most 80 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().matches(/^(\+639|09)\d{9}$/).withMessage('Valid Philippine phone number is required'),
  passwordValidationRule('password'),
  // Privileged accounts must be provisioned through protected administration,
  // never through the public registration endpoint.
  body('role').optional().equals('citizen').withMessage('Public registration can only create citizen accounts'),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('address.street').optional().trim().isLength({ max: 160 }),
  body('address.barangay').optional().trim().isLength({ max: 100 }),
  body('address.city').optional().trim().isLength({ max: 100 }),
  body('address.province').optional().trim().isLength({ max: 100 }),
  body('address.zipCode').optional().trim().isLength({ max: 20 })
];

exports.loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 1, max: 128 }).withMessage('Password is required'),
  body('captchaToken').optional().isString().isLength({ min: 1, max: 2048 })
    .withMessage('Complete the CAPTCHA challenge'),
  body('deviceToken').optional().trim().isLength({ max: 512 }),
  body('platform').optional().isIn(['android', 'ios', 'web']).withMessage('Invalid device platform')
];

exports.registrationMfaValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('challengeToken').isString().isLength({ min: 64, max: 128 })
    .withMessage('A valid registration challenge is required'),
  body('code').trim().matches(/^\d{6}$/).withMessage('Enter the 6-digit verification code')
];

exports.registrationMfaResendValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('challengeToken').isString().isLength({ min: 64, max: 128 })
    .withMessage('A valid registration challenge is required')
];

exports.archiveUserValidation = [
  body('reason').trim().isLength({ min: 3, max: 500 })
    .withMessage('An archive reason between 3 and 500 characters is required')
];

exports.refreshValidation = [
  body('refreshToken').isString().isLength({ min: 20, max: 4096 }).withMessage('A valid refresh token is required')
];

exports.forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
];

exports.recoveryEmailRequestValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid recovery email is required')
];

exports.recoveryEmailVerifyValidation = [
  body('code').trim().matches(/^\d{6}$/).withMessage('Enter the 6-digit verification code')
];

exports.resetPasswordValidation = [
  body('token').isString().isLength({ min: 32, max: 256 }).withMessage('A valid reset token is required'),
  passwordValidationRule('password')
];

exports.changePasswordValidation = [
  body('currentPassword').isLength({ min: 1, max: 128 }).withMessage('Current password is required'),
  passwordValidationRule('newPassword')
];

exports.updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 1, max: 80 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 80 }),
  body('phone').optional().trim().matches(/^(\+639|09)\d{9}$/).withMessage('Valid Philippine phone number is required'),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('address.street').optional().trim().isLength({ max: 160 }),
  body('address.barangay').optional().trim().isLength({ max: 100 }),
  body('address.city').optional().trim().isLength({ max: 100 }),
  body('address.province').optional().trim().isLength({ max: 100 }),
  body('address.zipCode').optional().trim().isLength({ max: 20 }),
  body('profileImage').optional().isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('Profile image must be a secure URL')
];

exports.supportTicketCreateValidation = [
  body('category').isIn(['bug', 'account_access', 'data_issue', 'feature_request', 'other']).withMessage('Choose a valid support category'),
  body('subject').trim().isLength({ min: 5, max: 160 }).withMessage('Subject must be between 5 and 160 characters'),
  body('description').trim().isLength({ min: 20, max: 4000 }).withMessage('Description must be between 20 and 4000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Choose a valid priority')
];

exports.supportTicketUpdateValidation = [
  body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Choose a valid ticket status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Choose a valid priority'),
  body('adminResponse').optional().trim().isLength({ max: 4000 }).withMessage('Response must be at most 4000 characters')
];

exports.supportTicketQueryValidation = [
  query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid ticket status'),
  query('category').optional().isIn(['bug', 'account_access', 'data_issue', 'feature_request', 'other']).withMessage('Invalid ticket category')
];

// Incident validation rules
exports.createIncidentValidation = [
  body('locationIntegrity').custom((value, { req }) => {
    require('../services/locationIntegrityService').buildLocationIntegrity(value, Array.isArray(req.body.location?.coordinates) ? req.body.location.coordinates.map(Number) : undefined);
    return true;
  }),
  body('category').trim().isIn(INCIDENT_CATEGORY_CODES)
    .withMessage('Valid category is required'),
  body('subcategory').optional().isIn(['pothole', 'crack', 'collapse', 'flooding', 'blockage', 'leak', 'outage', 'damage', 'missing', 'other'])
    .withMessage('Invalid subcategory'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('location').isObject().withMessage('Location is required'),
  body('location.type').optional().equals('Point').withMessage('Location type must be Point'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates required'),
  body('location.coordinates.0').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('location.coordinates.1').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('location.address').isObject().withMessage('Location address is required'),
  canonicalBarangay('location.address.barangay'),
  body('location.address.street').optional().trim().isLength({ max: 160 }),
  dagupanCity('location.address.city', { optional: true }),
  body('location.address.landmark').optional().trim().isLength({ max: 160 }),
  body('images').optional().isArray({ max: 5 }).withMessage('A maximum of five evidence images is allowed'),
  body('images.*.url').if((value, { req }) => Array.isArray(req.body.images))
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('Evidence image URL must be a secure URL'),
  body().custom((value, { req }) => {
    const uploadedFiles = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files || {}).flat();
    const suppliedImages = Array.isArray(req.body.images) ? req.body.images : [];

    if (!uploadedFiles.length && !suppliedImages.length) {
      throw new Error('At least one evidence image is required');
    }
    if (uploadedFiles.length + suppliedImages.length > 5) {
      throw new Error('A maximum of five evidence images is allowed');
    }
    return true;
  }),
  body('privacyAcknowledged').custom((value, { req }) => {
    const hasEvidence = Object.values(req.files || {}).flat().length > 0
      || (Array.isArray(req.body.images) && req.body.images.length > 0);
    if (req.user?.role === 'citizen' && hasEvidence && value !== true && value !== 'true') {
      throw new Error('Privacy acknowledgement is required before submitting evidence');
    }
    return true;
  }),
  body('priority').optional().isIn(['critical', 'high', 'medium', 'low'])
];

exports.updateIncidentValidation = [
  body('notes').trim().isLength({ min: 1, max: 2000 })
    .withMessage('A note between 1 and 2000 characters is required')
];

const priorityRule = body('priority').isIn(['critical', 'high', 'medium', 'low'])
  .withMessage('Priority must be critical, high, medium, or low');

const jurisdictionRules = [
  body('jurisdiction').optional().isObject().withMessage('Jurisdiction must be an object'),
  canonicalBarangay('jurisdiction.barangay', { optional: true }),
  dagupanCity('jurisdiction.city', { optional: true }),
];

exports.validateIncidentDecisionValidation = [
  ...jurisdictionRules,
  body('notes').optional().trim().isLength({ max: 2000 })
    .withMessage('Review notes cannot exceed 2000 characters')
];

exports.clarificationValidation = [
  body('reason').trim().isLength({ min: 2, max: 2000 })
    .withMessage('A clarification reason between 2 and 2000 characters is required')
];

exports.rejectIncidentDecisionValidation = [
  body('reason').trim().isLength({ min: 2, max: 500 })
    .withMessage('A rejection reason between 2 and 500 characters is required'),
  body('notes').optional().trim().isLength({ max: 2000 })
    .withMessage('Rejection notes cannot exceed 2000 characters')
];

exports.markDuplicateValidation = [
  body('duplicateOf').isMongoId().withMessage('A valid canonical incident is required'),
  body('reason').trim().isLength({ min: 2, max: 500 })
    .withMessage('A duplicate reason between 2 and 500 characters is required'),
  body('notes').optional().trim().isLength({ max: 2000 })
    .withMessage('Duplicate notes cannot exceed 2000 characters')
];

exports.updatePriorityValidation = [priorityRule];

exports.updateJurisdictionValidation = [
  canonicalBarangay('barangay'),
  dagupanCity('city', { optional: true }),
];

exports.routeIncidentValidation = [
  body('responsibleOrganization').trim().isLength({ min: 1, max: 160 })
    .withMessage('Responsible organization is required'),
  body('responsibleRole').equals('utility_provider')
    .withMessage('Incidents may only be routed to a Utility Provider'),
  body('reason').optional().trim().isLength({ max: 1000 })
    .withMessage('Routing reason cannot exceed 1000 characters')
];

exports.pendingValidationQuery = [
  query('search').optional().trim().isLength({ max: 100 }),
  query('category').optional().isIn(INCIDENT_CATEGORY_CODES)
    .withMessage('Invalid category filter'),
  query('barangay').optional().isString().bail()
    .customSanitizer((value) => canonicalizeBarangay(value) || value)
    .custom(isRecognizedBarangay).withMessage('Choose a recognized Dagupan barangay'),
  query('hasDuplicateCandidate').optional().isBoolean()
    .withMessage('hasDuplicateCandidate must be true or false'),
  query('sortBy').optional().isIn(['createdAt', '-createdAt', 'priority', '-priority'])
    .withMessage('Invalid validation queue sort'),
  query('from').optional().isISO8601().withMessage('from must be an ISO date'),
  query('to').optional().isISO8601().withMessage('to must be an ISO date')
];

// Work order validation rules
exports.createWorkOrderValidation = [
  body().custom((value, { req }) => {
    if (!req.params.id && !req.params.incidentId && !req.body.incident) {
      throw new Error('Valid incident ID is required');
    }
    return true;
  }),
  body('incident').optional().isMongoId().withMessage('Valid incident ID is required'),
  body('instructions').optional().trim().isLength({ max: 4000 })
    .withMessage('Instructions cannot exceed 4000 characters')
];

exports.updateWorkOrderValidation = [
  body('updateType').optional().isIn(['note', 'completion']).withMessage('Repair update type is invalid'),
  body('progressPercent').isIn([0, 25, 50, 75, 100])
    .withMessage('Repair progress must be 0, 25, 50, 75, or 100').toInt(),
  body('stage').isIn(['assigned', 'site_preparation', 'main_repair', 'finishing', 'ready_for_completion'])
    .withMessage('Repair stage is invalid'),
  body('notes').optional().trim().isLength({ max: 2000 })
    .withMessage('Progress notes cannot exceed 2000 characters'),
  body('location').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
        return true;
      } catch (_error) {
        throw new Error('Location must be valid JSON');
      }
    }
    if (!value || !value.coordinates) return true;
    if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
      throw new Error('Location must contain longitude and latitude');
    }
    return true;
  })
];

exports.assignWorkOrderValidation = [
  body("instructions").optional().isString().trim().isLength({ max: 4000 }),
  body().custom((value, { req }) => {
    const assigneeId = req.body.assigneeId || req.body.assignedTo;
    if (!assigneeId || !/^[a-f\d]{24}$/i.test(String(assigneeId))) {
      throw new Error('A valid repair personnel ID is required');
    }
    return true;
  })
];

exports.reassignWorkOrderValidation = [
  ...exports.assignWorkOrderValidation,
  body('reason').trim().isLength({ min: 2, max: 500 })
    .withMessage('A reassignment reason between 2 and 500 characters is required')
];

exports.declineWorkOrderValidation = [
  body('reason').trim().isLength({ min: 2, max: 500 })
    .withMessage('A decline reason between 2 and 500 characters is required'),
  body('notes').optional().trim().isLength({ max: 2000 })
    .withMessage('Decline notes cannot exceed 2000 characters')
];

exports.providerWorkOrderReviewValidation = [
  body('decision').isIn(['accepted', 'request_correction'])
    .withMessage('Choose accepted or request_correction'),
  body('reason').if(body('decision').equals('request_correction')).trim().isLength({ min: 2, max: 2000 })
    .withMessage('A correction reason between 2 and 2000 characters is required'),
  body('reason').optional().trim().isLength({ max: 2000 }),
  body('instructions').optional().trim().isLength({ max: 4000 })
];

exports.providerCorrectionValidation = [
  body('instructions').trim().isLength({ min: 2, max: 4000 })
    .withMessage('Corrective instructions between 2 and 4000 characters are required')
];

exports.cityFinalReviewValidation = [
  body('decision').isIn(['approved', 'return']).withMessage('Choose approved or return'),
  body('reason').if(body('decision').equals('return')).trim().isLength({ min: 2, max: 2000 })
    .withMessage('A return reason between 2 and 2000 characters is required'),
  body('reason').optional().trim().isLength({ max: 2000 })
];

exports.repairEvidenceValidation = [
  body('caption').optional().trim().isLength({ max: 500 })
    .withMessage('Evidence caption cannot exceed 500 characters'),
  body('progressUpdateId').optional().isMongoId()
    .withMessage('Progress update reference is invalid')
];

exports.workOrderQueryValidation = [
  query('status').optional().isIn([
    'pending', 'accepted', 'in_progress', 'completed', 'rework_required', 'needs_correction', 'awaiting_review',
    'provider_accepted', 'city_correction_required', 'verified', 'declined', 'reassigned'
  ]),
  query('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
  query('assignmentStatus').optional().isIn(['unassigned', 'pending', 'accepted', 'declined']),
  query('progress').optional().isIn(['0', '25', '50', '75', '100']),
  query('slaState').optional().isIn(['approaching', 'overdue']),
  query('sortBy').optional().isIn([
    'newest', 'oldest', 'deadline', '-deadline', 'priority', '-priority', 'progress', '-progress'
  ]),
  query('search').optional().trim().isLength({ max: 100 }),
  query('category').optional().isIn(INCIDENT_CATEGORY_CODES),
  query('personnel').optional().isMongoId(),
  query('organization').optional().trim().isLength({ min: 1, max: 160 })
];

// Query validation
exports.paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().trim(),
  query('sortBy').optional().trim().isLength({ max: 50 }),
  query('status').optional().trim(),
  query('priority').optional().trim()
];

exports.auditLogQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('action').optional().trim().isLength({ min: 1, max: 80 }),
  query('status').optional().isIn(['success', 'failure', 'warning']),
  query('actorType').optional().isIn(['user', 'anonymous', 'system']),
  query('source').optional().isIn(['web', 'mobile', 'api', 'system']),
  query('resourceType').optional().isIn(['User', 'Incident', 'WorkOrder', 'Notification', 'System']),
  query('from').optional().isISO8601().withMessage('from must be an ISO date'),
  query('to').optional().isISO8601().withMessage('to must be an ISO date')
];

exports.nearbyCoordinatesValidation = [
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  query('maxDistance').optional().isInt({ min: 1, max: 10000 })
    .withMessage('Maximum distance must be between 1 and 10000 meters')
];

// ID parameter validation
exports.mongoIdValidation = [
  param('id').isMongoId().withMessage('Invalid ID format')
];
