const express = require('express');
const router = express.Router();
const {
  createSupportTicket,
  getMySupportTickets,
  getSupportTickets,
  getSupportTicket,
  updateSupportTicket
} = require('../controllers/supportTicketController');
const { protect, authorize } = require('../middleware/auth');
const {
  mongoIdValidation,
  paginationValidation,
  supportTicketCreateValidation,
  supportTicketQueryValidation,
  supportTicketUpdateValidation,
  validate
} = require('../middleware/validation');

router.post('/', protect, authorize('admin', 'barangay_official', 'city_engineer', 'utility_provider'), supportTicketCreateValidation, validate, createSupportTicket);
router.get('/mine', protect, authorize('admin', 'barangay_official', 'city_engineer', 'utility_provider'), paginationValidation, validate, getMySupportTickets);
router.get('/', protect, authorize('admin'), paginationValidation, supportTicketQueryValidation, validate, getSupportTickets);
router.get('/:id', protect, mongoIdValidation, validate, getSupportTicket);
router.patch('/:id', protect, authorize('admin'), mongoIdValidation, supportTicketUpdateValidation, validate, updateSupportTicket);

module.exports = router;
