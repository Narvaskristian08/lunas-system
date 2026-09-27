const express = require('express');
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect, authorize } = require('../middleware/auth');
const { auditLogQueryValidation, validate } = require('../middleware/validation');

const router = express.Router();

router.get('/', protect, authorize('admin'), auditLogQueryValidation, validate, getAuditLogs);

module.exports = router;
