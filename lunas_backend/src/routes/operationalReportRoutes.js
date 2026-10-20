const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { report } = require('../controllers/operationalReportController');
router.use(protect);
router.get('/', report());
router.get('/csv', report('csv'));
router.get('/pdf', report('pdf'));
module.exports = router;
