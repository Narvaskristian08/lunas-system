require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const { startSLAMonitor, isSlaAutomationEnabled, getPollingMinutes } = require('./services/slaService');
const { validateRuntimeConfig } = require('./config/runtime');

const app = express();

// The production container is behind Nginx. Trust only the explicitly
// configured proxy hop so rate limiting and request IP logging use the client
// address without trusting arbitrary forwarded headers in other environments.
const configuredTrustProxy = process.env.TRUST_PROXY;
if (configuredTrustProxy) {
  app.set(
    'trust proxy',
    configuredTrustProxy === 'true' ? true : Number(configuredTrustProxy),
  );
}

// Security middleware
app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const isLocalDevelopmentOrigin = (origin) => process.env.NODE_ENV !== 'production'
  && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
app.use(cors({
  origin(origin, callback) {
    // Native mobile applications and server-to-server requests do not send an
    // Origin header. Browser origins must be explicitly configured.
    if (!origin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin(origin)) {
      return callback(null, true);
    }

    const error = new Error('Origin is not allowed by CORS policy');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Readiness includes the database dependency used by every durable workflow.
// Optional integrations (AI, push, email and storage) report their own errors
// without preventing the core API from starting.
app.get('/health/ready', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ready' : 'not_ready',
    dependencies: { mongodb: databaseConnected ? 'connected' : 'disconnected' }
  });
});

// API routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    validateRuntimeConfig();
    if (isSlaAutomationEnabled()) getPollingMinutes();
    await connectDB();
    if (isSlaAutomationEnabled()) {
      // This unique index is a delivery guarantee, including autoIndex=false deployments.
      await require('./models/Notification').collection.createIndex({ idempotencyKey: 1 }, {
        unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } }
      });
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      
      // Start SLA monitoring cron job
      startSLAMonitor();

    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  // Handle unhandled promise rejections only when this file is executed as the
  // server. Supertest and controller tests can import the app without an
  // attempted MongoDB connection or a process-wide exit handler.
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    process.exit(1);
  });

  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
