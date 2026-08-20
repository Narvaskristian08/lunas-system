const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const incidentRoutes = require('./incidentRoutes');
const workOrderRoutes = require('./workOrderRoutes');
const notificationRoutes = require('./notificationRoutes');
const userRoutes = require('./userRoutes');
const statsRoutes = require('./statsRoutes');
const categoryRoutes = require('./categoryRoutes');
const { getWorkOrderSummary } = require('../controllers/workOrderController');
const { protect, authorize } = require('../middleware/auth');

// Mount routes
router.use('/auth', authRoutes);
router.use('/incidents', incidentRoutes);
router.use('/work-orders', workOrderRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/stats', statsRoutes);
router.use('/categories', categoryRoutes);
router.get(
  '/dashboard/work-orders-summary',
  protect,
  authorize('barangay_official', 'city_engineer', 'utility_provider', 'repair_personnel', 'admin'),
  getWorkOrderSummary
);

// API info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LUNAS API v1.0',
    description: 'AI-Assisted Urban Infrastructure Maintenance and Monitoring System',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      incidents: '/api/v1/incidents',
      workOrders: '/api/v1/work-orders',
      notifications: '/api/v1/notifications',
      users: '/api/v1/users',
      stats: '/api/v1/stats',
      categories: '/api/v1/categories'
    }
  });
});

module.exports = router;
