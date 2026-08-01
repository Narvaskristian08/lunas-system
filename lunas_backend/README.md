# LUNAS Backend API

AI-Assisted Urban Infrastructure Maintenance System

RESTful API backend for LUNAS - A cloud-based infrastructure reporting and maintenance platform for Dagupan City, Philippines.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Environment Configuration](#environment-configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Overview

The LUNAS Backend API provides comprehensive endpoints for managing urban infrastructure incidents, work orders, notifications, and user management with role-based access control.

### Key Capabilities

- JWT-based authentication with role-based authorization
- Geospatial incident tracking with MongoDB
- Automated SLA monitoring and escalation
- OneSignal for push notifications
- Supabase Storage for image uploads
- Comprehensive audit logging
- Real-time statistics and analytics

---

## Features

### Authentication & Authorization
- User registration and login
- JWT token-based authentication
- Role-based access control (6 roles)
- Password change and profile management
- Device token management for push notifications

### Incident Management
- Create and track infrastructure incidents
- Geospatial location tracking
- AI analysis integration (placeholder)
- Priority-based categorization
- Status workflow management
- Nearby incident search
- Duplicate detection

### Work Order System
- Automated work order creation
- Personnel assignment
- Progress tracking with updates
- Completion reporting
- Repair verification
- Before/after image comparison

### SLA Monitoring
- Automated deadline tracking
- Priority-based SLA configuration
- Escalation management
- Reminder notifications
- Overdue incident tracking

### Notifications
- In-app notifications
- OneSignal push notifications
- Notification templates for common events
- Bulk notification sending
- Read/unread status tracking

### Analytics & Reports
- Dashboard statistics
- Incident analytics by category, priority, barangay
- Work order completion metrics
- SLA compliance tracking
- Resolution time analysis

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT (jsonwebtoken) |
| File Storage | Supabase Storage |
| Push Notifications | OneSignal |
| Image Processing | Sharp |
| Validation | Express Validator |
| Security | Helmet, CORS, Rate Limiting |
| Logging | Winston |
| Scheduling | Node-cron |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB 6.0+
- Supabase Account (for file storage)
- OneSignal Account (for push notifications)

**OR**

- Docker and Docker Compose (recommended for easy setup)

### Installation

#### Option 1: Using Docker (Recommended)

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop

2. Configure environment variables

```bash
cp .env.docker .env
# Edit .env with your Supabase and OneSignal credentials
```

3. Start all services

```bash
docker-compose up -d
```

4. Verify services are running

```bash
docker-compose ps
curl http://localhost:5000/health
```

See `DOCKER_GUIDE.md` for complete Docker documentation.

#### Option 2: Local Installation

1. Install dependencies

```bash
npm install
```

2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start MongoDB (if running locally)

```bash
mongod
```

4. Run the application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The API will be available at `http://localhost:5000`

### Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-08-01T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

---

## Project Structure

```
lunas_backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── incidentController.js
│   │   ├── workOrderController.js
│   │   ├── notificationController.js
│   │   ├── userController.js
│   │   └── statsController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT & authorization
│   │   ├── validation.js        # Request validation
│   │   ├── upload.js            # File upload handling
│   │   ├── errorHandler.js      # Global error handler
│   │   └── asyncHandler.js      # Async wrapper
│   ├── models/
│   │   ├── User.js
│   │   ├── Incident.js
│   │   ├── WorkOrder.js
│   │   ├── Notification.js
│   │   ├── Category.js
│   │   ├── SLAConfig.js
│   │   ├── AuditLog.js
│   │   └── SystemConfig.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── incidentRoutes.js
│   │   ├── workOrderRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── userRoutes.js
│   │   ├── statsRoutes.js
│   │   └── index.js
│   ├── services/
│   │   ├── storageService.js    # Supabase Storage
│   │   ├── notificationService.js # OneSignal
│   │   └── slaService.js        # SLA monitoring
│   ├── utils/
│   │   ├── logger.js            # Winston logger
│   │   ├── auditLogger.js
│   │   ├── imageProcessor.js
│   │   ├── validators.js
│   │   ├── responseFormatter.js
│   │   └── helpers.js
│   └── server.js                # Entry point
├── logs/                        # Log files
├── .env.example
├── .env.docker                  # Docker environment template
├── .dockerignore
├── .gitignore
├── Dockerfile                   # Docker image configuration
├── docker-compose.yml           # Docker services orchestration
├── package.json
├── README.md                    # This file
├── QUICK_START.md               # 5-minute quick start guide
├── API_ENDPOINTS.md             # Complete API reference
├── SETUP_GUIDE.md               # Step-by-step setup
├── DOCKER_GUIDE.md              # Complete Docker documentation
└── SUPABASE_ONESIGNAL_GUIDE.md  # Integration guide
```

---

## API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Endpoints Summary

#### Authentication (`/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login user | Public |
| GET | `/auth/me` | Get current user | Private |
| PUT | `/auth/profile` | Update profile | Private |
| PUT | `/auth/change-password` | Change password | Private |
| POST | `/auth/logout` | Logout user | Private |

#### Incidents (`/incidents`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/incidents` | Get all incidents | Private |
| POST | `/incidents` | Create incident | Citizen |
| GET | `/incidents/:id` | Get single incident | Private |
| PUT | `/incidents/:id` | Update incident | Officials |
| DELETE | `/incidents/:id` | Delete incident | Admin |
| POST | `/incidents/:id/validate` | Validate incident | Officials |
| POST | `/incidents/:id/reject` | Reject incident | Officials |
| GET | `/incidents/nearby` | Get nearby incidents | Private |

#### Work Orders (`/work-orders`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/work-orders` | Get all work orders | Private |
| POST | `/work-orders` | Create work order | Officials |
| GET | `/work-orders/:id` | Get single work order | Private |
| POST | `/work-orders/:id/accept` | Accept work order | Personnel |
| POST | `/work-orders/:id/progress` | Update progress | Personnel |
| POST | `/work-orders/:id/complete` | Complete work order | Personnel |
| POST | `/work-orders/:id/verify` | Verify completion | Officials |
| DELETE | `/work-orders/:id` | Delete work order | Admin |

#### Users (`/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users` | Get all users | Officials |
| GET | `/users/:id` | Get single user | Private |
| PUT | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Delete user | Admin |
| GET | `/users/repair-personnel` | Get repair personnel | Officials |

#### Notifications (`/notifications`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/notifications` | Get notifications | Private |
| PUT | `/notifications/:id/read` | Mark as read | Private |
| PUT | `/notifications/read-all` | Mark all as read | Private |
| DELETE | `/notifications/:id` | Delete notification | Private |

#### Statistics (`/stats`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/stats/dashboard` | Get dashboard stats | Private |
| GET | `/stats/analytics` | Get analytics | Officials |

For detailed API documentation with request/response examples, see `API_ENDPOINTS.md`.

---

## Database Schema

### Collections

1. **users** - User accounts with role-based access
2. **incidents** - Infrastructure incident reports
3. **workorders** - Repair work assignments
4. **notifications** - In-app notifications
5. **categories** - Incident categories and subcategories
6. **slaconfigs** - SLA configuration by priority
7. **auditlogs** - System audit trail
8. **systemconfigs** - System-wide configuration

### User Roles

| Role | Description |
|------|-------------|
| citizen | Report incidents, track reports |
| repair_personnel | Receive and complete work orders |
| barangay_official | Validate incidents, assign work (barangay-scoped) |
| city_engineer | City-wide incident management |
| utility_provider | Handle utility-related incidents |
| admin | Full system access |

---

## Authentication

### JWT Token Structure

```json
{
  "id": "user_id",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Role-Based Authorization

Routes are protected by role-based middleware:

```javascript
router.post('/incidents/:id/validate', 
  protect, 
  authorize('barangay_official', 'city_engineer', 'admin'),
  validateIncident
);
```

---

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/lunas_db
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/lunas_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=30d

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=lunas-storage

# OneSignal Configuration
ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_REST_API_KEY=your_onesignal_rest_api_key
ONESIGNAL_USER_AUTH_KEY=your_onesignal_user_auth_key

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# SLA Configuration (in hours)
SLA_CRITICAL=48
SLA_HIGH=72
SLA_MEDIUM=168
SLA_LOW=336

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
```

See `.env.example` for a complete template.

---

## Development

### Running in Development Mode

```bash
npm run dev
```

This starts the server with nodemon for automatic restarts on file changes.

### Code Style

The project follows standard JavaScript conventions:
- Use async/await for asynchronous operations
- Follow Express.js best practices
- Use descriptive variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Logging

The application uses Winston for structured logging:

```javascript
const logger = require('./utils/logger');

logger.info('Server started successfully');
logger.error('Error connecting to database:', error);
logger.warn('SLA deadline approaching');
```

Logs are written to:
- Console (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

---

## Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

---

## Deployment

### Deployment Options

- **Heroku** - Easy deployment with MongoDB Atlas
- **DigitalOcean** - VPS with PM2 process manager
- **AWS EC2** - Scalable cloud infrastructure
- **Render** - Free tier available
- **Railway** - Modern platform with auto-deploy

### Pre-Deployment Checklist

- [ ] Update all environment variables for production
- [ ] Use strong JWT secrets (minimum 32 characters)
- [ ] Enable MongoDB authentication
- [ ] Configure Supabase storage policies
- [ ] Secure OneSignal API keys
- [ ] Set up HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Enable production logging
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Test all critical endpoints

### Environment Variables for Production

Ensure these are set in your production environment:

- `NODE_ENV=production`
- `MONGODB_URI` (use MongoDB Atlas or managed service)
- Strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- All Supabase and OneSignal credentials
- Appropriate `CORS_ORIGIN` values

---

## SLA Monitoring

The system includes automated SLA monitoring with cron jobs:

### Priority-Based SLA Times

| Priority | Target Resolution | Reminder Before |
|----------|------------------|-----------------|
| Critical | 48 hours | 24h, 12h, 6h, 2h |
| High | 72 hours | 24h, 12h, 6h, 2h |
| Medium | 168 hours (7 days) | 24h, 12h |
| Low | 336 hours (14 days) | 24h |

### Automated Actions

- **Hourly**: Check for overdue incidents
- **Every 30 minutes**: Send SLA reminders
- **On overdue**: Escalate to higher authorities
- **Escalation levels**: Increase with each missed deadline

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Security Considerations

### Implemented Security Measures

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Request validation and sanitization
- Rate limiting to prevent abuse
- Helmet.js for HTTP security headers
- CORS configuration
- Comprehensive audit logging
- Secure file upload handling

### Best Practices

- Never commit `.env` file to version control
- Use strong, unique secrets for JWT tokens
- Regularly update dependencies
- Monitor logs for suspicious activity
- Implement proper error handling
- Validate all user inputs
- Use HTTPS in production
- Keep service account keys secure

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Verify MongoDB is running
- Check connection string in `.env`
- Ensure network access if using MongoDB Atlas

**Port Already in Use**
- Change `PORT` in `.env`
- Or kill existing process on port 5000

**JWT Token Invalid**
- Check token expiration
- Verify `JWT_SECRET` matches
- Ensure token is properly formatted

**File Upload Failed**
- Verify Supabase credentials
- Check storage bucket exists
- Ensure bucket policies are configured

**Push Notifications Not Working**
- Verify OneSignal credentials
- Check player IDs are registered
- Ensure device has notification permissions

For detailed troubleshooting, see `SETUP_GUIDE.md`.

---

## Contributing

This project is developed as a Capstone Research Project for academic purposes. For questions or contributions, contact the development team at PHINMA University of Pangasinan.

---

## License

This project is developed as a Capstone Research Project for academic purposes under the College of Information Technology, PHINMA University of Pangasinan.

---

## Development Team

| Name | Role |
|------|------|
| Mark Khean M. Viari | Project Manager, System Integrator |
| Terrence Lappay | System Analyst, UI/UX |
| Mark Anthony Lafuente | System Analyst, Frontend |
| Kristian Dave Narvas | System Integrator |
| John Miller Ungos | System Integrator |

---

## Contact & Support

**Institution:** PHINMA University of Pangasinan  
**College:** Information Technology  
**Location:** Dagupan City, Pangasinan, Philippines

For technical support or questions, contact the development team.

---

**LUNAS Backend API** - Building smarter, faster, and more transparent urban infrastructure maintenance through AI and automation.

Version 1.0.0 | Last Updated: August 2026
