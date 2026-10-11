const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { mongoIdValidation, validate } = require('../middleware/validation');
const controller = require('../controllers/reportingAppealController');

router.get('/me', protect, authorize('citizen'), controller.getMyAppeal);
router.post('/', protect, authorize('citizen'), controller.createAppeal);
router.get('/reporter/:reporterId', protect, authorize('barangay_official'), mongoIdValidation, validate, controller.getAppealForReporter);
router.get('/', protect, authorize('barangay_official'), controller.listAppeals);
router.patch('/:id', protect, authorize('barangay_official'), mongoIdValidation, validate, controller.reviewAppeal);

module.exports = router;
