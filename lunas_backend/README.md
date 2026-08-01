# LUNAS Backend API

## 🌙 AI-Assisted Urban Infrastructure Maintenance System

RESTful API backend for LUNAS - A cloud-based infrastructure reporting and maintenance platform for Dagupan City, Philippines.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Project Structure](#project-structure)

---

## 🎯 Overview

The LUNAS Backend API provides comprehensive endpoints for managing urban infrastructure incidents, work orders, notifications, and user management with role-based access control.

### Key Capabilities:
- JWT-based authentication with role-based authorization
- Geospatial incident tracking with MongoDB
- Automated SLA monitoring and escalation
- OneSignal for push notifications
- Supabase Storage for image uploads
- Comprehensive audit logging
- Real-time statistics and analytics

---

## ✨ Features

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

## 🛠 Tech Stack

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

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB 6.0+
- Firebase Project (for storage and notifications)

### Installation

1. **Clone the repository**
```bash
cd lunas_backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB** (if running locally)
```bash
mongod
```

5. **Run the application**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The API will be available at `http://localhost:5000`

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### API Endpoints

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

### Example Requests

#### Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "email": "juan@example.com",
  "phone": "09123456789",
  "password": "SecurePass123",
  "role": "citizen",
  "address": {
    "street": "123 Main St",
    "barangay": "Poblacion Oeste",
    "city": "Dagupan City"
  }
}
```

#### Create Incident
```bash
POST /api/v1/incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "road",
  "subcategory": "pothole",
  "description": "Large pothole on main road causing traffic issues",
  "location": {
    "coordinates": [120.3387, 16.0433],
    "address": {
      "street": "AB Fernandez Avenue",
      "barangay": "Poblacion Oeste",
      "landmark": "Near City Hall"
    }
  },
  "priority": "high",
  "images": [
    {
      "url": "https://storage.googleapis.com/...",
      "key": "uploads/..."
    }
  ]
}
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/lunas_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_key

# SLA Configuration (hours)
SLA_CRITICAL=48
SLA_HIGH=72
SLA_MEDIUM=168
SLA_LOW=336

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
```

---

## 🗄 Database Schema

### Collections

1. **Users** - User accounts with role-based access
2. **Incidents** - Infrastructure incident reports
3. **WorkOrders** - Repair work assignments
4. **Notifications** - In-app notifications
5. **Categories** - Incident categories and subcategories
6. **SLAConfig** - SLA configuration by priority
7. **AuditLogs** - System audit trail
8. **SystemConfig** - System-wide configuration

### User Roles

- `citizen` - Report incidents, track reports
- `repair_personnel` - Receive and complete work orders
- `barangay_official` - Validate incidents, assign work
- `city_engineer` - City-wide incident management
- `utility_provider` - Handle utility-related incidents
- `admin` - Full system access

---

## 🔒 Authentication

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

## 📁 Project Structure

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
│   │   ├── storageService.js    # Firebase Storage
│   │   ├── notificationService.js
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
├── .gitignore
├── package.json
└── README.md
```

---

## 🔄 SLA Monitoring

The system includes automated SLA monitoring:

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

## 🔔 Notification System

### Notification Types

- Incident submitted/validated/rejected
- Work order assigned/accepted/completed
- Repair verified/rejected
- SLA reminders and escalations
- Status updates

### Delivery Channels

- In-app notifications (stored in database)
- Firebase push notifications (mobile)
- Email notifications (optional)

---

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
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
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 🧪 Testing

Run tests:
```bash
npm test
```

---

## 📝 License

This project is developed as a Capstone Research Project for academic purposes under the College of Information Technology, PHINMA University of Pangasinan.

---

## 👥 Development Team

- Mark Khean M. Viari - Project Manager • System Integrator
- Terrence Lappay - System Analyst • UI/UX
- Mark Anthony Lafuente - System Analyst • Frontend
- Kristian Dave Narvas - System Integrator
- John Miller Ungos - System Integrator

---

## 📞 Support

For questions or support, contact the development team at PHINMA University of Pangasinan, College of Information Technology.

---

**LUNAS** — *Building smarter, faster, and more transparent urban infrastructure maintenance through AI and automation.*
