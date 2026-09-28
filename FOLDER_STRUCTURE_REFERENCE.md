# LUNAS System - Folder Structure & File Reference Guide

**Purpose:** This document provides a comprehensive map of the LUNAS system codebase for future prompting, development, and maintenance. It describes what each folder contains, what files are used for, and best practices for working with them.

**Last Updated:** August 1, 2026

**System Components:**
- **lunas_backend** - Node.js/Express REST API (Main backend service)
- **lunas_ai** - Python/Flask AI microservice (YOLOv8 detection models)
- **lunas_mobile** - Flutter mobile app (iOS/Android)
- **lunas_web** - Web frontend (if applicable)

---

## 📁 Root Directory Structure

```
lunas-system/
├── lunas_backend/          # Node.js REST API backend
├── lunas_ai/               # Python AI microservice
├── lunas_mobile/           # Flutter mobile application
├── lunas_web/              # Web frontend (if applicable)
├── runs/                   # Training output logs
├── docker-compose.yml      # Docker orchestration
├── .env.example            # Environment template
├── README.md               # Main project README
├── C4_DIAGRAMS.md          # System architecture diagrams
├── DEPLOYMENT_GUIDE.md     # Production deployment guide
├── QUICK_START.md          # Quick start guide
└── [other docs].md         # Various documentation files
```

---

## 🔧 LUNAS BACKEND (`lunas_backend/`)

**Purpose:** Main REST API backend for the LUNAS system. Handles authentication, incident management, work orders, user management, and integration with AI service and external services.

**Technology Stack:**
- Node.js + Express.js
- MongoDB (via Mongoose ODM)
- JWT authentication
- Supabase Storage (for file storage)
- Cloudflare Turnstile (CAPTCHA)

### Directory Structure

```
lunas_backend/
├── src/
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers (route logic)
│   ├── middleware/         # Express middleware (auth, validation, upload)
│   ├── models/             # Mongoose schemas (MongoDB models)
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic layer (external integrations)
│   ├── utils/              # Utility functions (logger, validators, helpers)
│   ├── server.js           # Main entry point
│   └── server.test.js      # Server tests
├── scripts/                # Utility scripts (seeding, migrations)
├── logs/                   # Application logs
├── coverage/               # Test coverage reports
├── package.json            # Node.js dependencies
├── .env.example            # Environment variables template
├── Dockerfile              # Docker configuration
└── README.md               # Backend documentation
```

### Key Files & Their Uses

#### 📄 Configuration Files

| File | Purpose | When to Modify |
|------|---------|----------------|
| `.env.example` | Environment variables template | Add new config variables |
| `package.json` | Node.js dependencies and scripts | Add new npm packages |
| `Dockerfile` | Docker container configuration | Change deployment setup |

#### 📄 Entry Point

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/server.js` | Main application entry | MongoDB connection, middleware setup, routes, error handling, server startup |

**Important:** This is where you configure:
- CORS origins
- Rate limiting
- Helmet security headers
- MongoDB connection
- API versioning

#### 📂 Controllers (`src/controllers/`)

**Purpose:** Handle HTTP requests and responses. Contains business logic for each feature.

| File | Purpose | Key Functions |
|------|---------|---------------|
| `authController.js` | Authentication endpoints | Login, register, logout, refresh token, password reset, MFA verification |
| `incidentController.js` | Incident management | Create, read, update, validate, route incidents |
| `workOrderController.js` | Work order operations | Create, assign, update progress, complete work orders |
| `userController.js` | User management | Profile updates, role changes, archive users |
| `analyticsController.js` | Analytics and reporting | Dashboard stats, reports, metrics |
| `uploadController.js` | File upload handling | Image upload, evidence processing |
| `validationController.js` | Incident validation queue | Review, approve, reject incidents |

**When to modify:**
- Adding new API endpoints
- Changing business logic
- Adding new features

#### 📂 Middleware (`src/middleware/`)

**Purpose:** Express middleware functions that process requests before reaching controllers.

| File | Purpose | Key Functions |
|------|---------|---------------|
| `auth.js` | Authentication & authorization | `protect()` (JWT validation), `authorize()` (role checks), `optionalAuth()`, `checkBarangayJurisdiction()` |
| `validation.js` | Input validation rules | Validation rules for all endpoints using express-validator |
| `upload.js` | File upload handling | Multer configuration, file filtering, size limits |
| `errorHandler.js` | Global error handling | Catches and formats all errors consistently |
| `rateLimit.js` | Rate limiting (if separate) | Throttles requests to prevent abuse |

**When to modify:**
- Adding new authentication methods
- Changing validation rules
- Adding new middleware functions

#### 📂 Models (`src/models/`)

**Purpose:** Mongoose schemas that define MongoDB document structure and validation.

| File | Purpose | Key Fields |
|------|---------|------------|
| `User.js` | User accounts | Email, password (hashed), role, barangay, tokenVersion, refreshTokens, MFA fields |
| `Incident.js` | Incident reports | Category, description, location, reporter, status, priority, evidence, validation, workOrder |
| `WorkOrder.js` | Repair assignments | Incident reference, assignedTo, status, progress, completion evidence |
| `AuditLog.js` | Audit trail | Action, performedBy, details, ipAddress, userAgent |
| `Notification.js` | User notifications | User, type, title, message, read status |
| `PasswordReset.js` | Password reset tokens | User, token, expiresAt |

**When to modify:**
- Adding new database fields
- Changing validation rules
- Adding new models

#### 📂 Routes (`src/routes/`)

**Purpose:** Define API endpoints and map them to controllers with middleware.

| File | Purpose | Endpoints |
|------|---------|-----------|
| `index.js` | Main router | Mounts all route modules |
| `auth.js` | Authentication routes | POST /login, /register, /logout, /refresh, /forgot-password, /reset-password |
| `incidents.js` | Incident routes | GET/POST /incidents, GET/PUT /incidents/:id, validation endpoints |
| `workOrders.js` | Work order routes | GET/POST /work-orders, assignment, progress, completion |
| `users.js` | User routes | GET/PUT /users/:id, profile, role management |
| `analytics.js` | Analytics routes | GET /analytics/dashboard, reports |

**When to modify:**
- Adding new API endpoints
- Changing route structure
- Adding middleware to routes

#### 📂 Services (`src/services/`)

**Purpose:** Business logic layer that handles external integrations and complex operations.

| File | Purpose | Key Functions |
|------|---------|---------------|
| `aiService.js` | AI microservice integration | `analyzeIncidentImage()`, `detectRoadDamage()`, `checkHealth()` |
| `storageService.js` | Supabase Storage integration | `uploadToStorage()`, `deleteFromStorage()`, `getSignedUrl()`, `generateThumbnail()` |
| `evidenceService.js` | Evidence processing | `processAndUploadEvidence()`, image validation, AI analysis orchestration |
| `emailService.js` | Email delivery (if configured) | Send emails via configured provider |
| `notificationService.js` | Push notifications | OneSignal integration |
| `auditService.js` | Audit logging | Create audit logs for security events |
| `slaService.js` | SLA monitoring | Track incident resolution times |
| `registrationMfaService.js` | Registration MFA | Email OTP for citizen registration |
| `privilegedMfaService.js` | Privileged account MFA | Email OTP for admin/engineer login |
| `captchaService.js` | CAPTCHA verification | Cloudflare Turnstile validation |

**When to modify:**
- Integrating new external services
- Changing AI service communication
- Modifying storage logic

#### 📂 Utils (`src/utils/`)

**Purpose:** Utility functions used across the application.

| File | Purpose | Key Functions |
|------|---------|---------------|
| `logger.js` | Winston logger | Logging with levels (info, warn, error) |
| `authTokens.js` | JWT token utilities | `createAccessToken()`, `createRefreshToken()`, `verifyAccessToken()`, `hashToken()` |
| `auditLogger.js` | Audit log utilities | `createAuditLog()`, `sanitizeAuditValue()` (redacts sensitive data) |
| `imageProcessor.js` | Image processing | `checkImageQuality()`, `getImageMetadata()`, `prepareEvidenceImage()` (strips EXIF), `applyPrivacyMask()` (placeholder) |
| `validators.js` | Custom validation helpers | Phone validation, coordinate validation |
| `responseFormatter.js` | API response formatting | Standardize API responses |
| `incidentCategories.js` | Category constants | List of valid incident categories |

**When to modify:**
- Adding new utility functions
- Changing logging format
- Adding new validators

---

## 🤖 LUNAS AI SERVICE (`lunas_ai/`)

**Purpose:** AI/ML microservice for infrastructure damage detection using YOLOv8 models. Processes images and returns detection results.

**Technology Stack:**
- Python 3.10+
- Flask (web framework)
- YOLOv8 (Ultralytics)
- PyTorch (deep learning framework)

### Directory Structure

```
lunas_ai/
├── src/
│   ├── api/                # API route definitions
│   ├── models/             # Model management and loading
│   ├── services/           # Detection logic
│   └── utils/              # Configuration, logging, helpers
├── models/                 # Trained YOLOv8 model files (.pt)
├── datasets/               # Training datasets (not in git)
├── runs/                   # Training output logs
├── tests/                  # Test files
├── tools/                  # Utility scripts
├── app.py                  # Main Flask application entry
├── config.yaml             # Model configuration
├── requirements.txt        # Python dependencies
├── qa_test_gui.html        # Web GUI for testing detection
├── train.py                # Training script
└── [various scripts].sh    # Helper scripts for training/testing
```

### Key Files & Their Uses

#### 📄 Entry Point & Configuration

| File | Purpose | When to Modify |
|------|---------|----------------|
| `app.py` | Flask application factory | Configure CORS, register blueprints, add middleware |
| `config.yaml` | Model configuration | Add new models, change confidence thresholds, update model paths |
| `requirements.txt` | Python dependencies | Add new Python packages |
| `.env.example` | Environment variables template | Add new config variables |

**Important in `config.yaml`:**
- Model paths and types
- Confidence thresholds per model
- Class names per model
- Device preferences (MPS/CUDA/CPU)

#### 📂 API Routes (`src/api/`)

| File | Purpose | Key Endpoints |
|------|---------|---------------|
| `routes.py` | Detection endpoints | `/detect/road-damage`, `/detect/all-hazards`, `/detect/privacy`, `/detect/drainage`, `/detect/electrical`, `/health`, `/models` |

**When to modify:**
- Adding new detection endpoints
- Changing request/response format
- Adding new validation logic

#### 📂 Models (`src/models/`)

| File | Purpose | Key Functions |
|------|---------|---------------|
| `model_manager.py` | Model loading and caching | `load_model()`, `get_model()`, `unload_model()`, `get_model_info()` |

**When to modify:**
- Changing model loading logic
- Adding model validation
- Implementing model versioning

#### 📂 Services (`src/services/`)

| File | Purpose | Key Functions |
|------|---------|---------------|
| `detection_service.py` | Detection logic | `detect_road_damage()`, `detect_environmental_hazards()`, `detect_all_hazards()`, `comprehensive_detection()` |

**When to modify:**
- Changing detection logic
- Adding new detection methods
- Implementing confidence filtering

#### 📂 Utils (`src/utils/`)

| File | Purpose | Key Functions |
|------|---------|---------------|
| `config.py` | Configuration management | Load config from YAML, provide config values |
| `logger.py` | Logging setup | Configure Python logging |

#### 📂 Trained Models (`models/`)

| File | Purpose | Classes |
|------|---------|---------|
| `yolov8n-rdd2022-best.pt` | Road damage detection | pothole, alligator_crack, longitudinal_crack, transverse_crack |
| `yolov8n-env-hazards-best.pt` | Environmental hazards | fallen_tree, fire_source, garbage_pileup, open_manhole |
| `yolov8n-road-collapse-best.pt` | Road collapse (REMOVED from unified detection due to false positives) | bridge_collapse, road_collapse |

**Important:**
- `.pt` files are tracked in Git (6MB each)
- Models are loaded on first request and cached
- Use `model_manager.load_model('model_name')` to load models

#### 📄 Testing & QA

| File | Purpose | Usage |
|------|---------|-------|
| `qa_test_gui.html` | Web GUI for testing | Access via `http://localhost:5001/qa` (NOT file://) |
| `start_qa_testing.sh` | Start QA server | `./start_qa_testing.sh` |
| `test_*.py` | Test scripts | Test individual models or endpoints |
| `QA_README.md` | QA documentation | How to test the AI service |

**When to modify:**
- Adding new test cases
- Updating QA GUI
- Adding new testing scripts

---

## 📱 LUNAS MOBILE APP (`lunas_mobile/`)

**Purpose:** Flutter mobile application for iOS and Android. Provides user interfaces for citizens, repair personnel, barangay officials, city engineers, and admins.

**Technology Stack:**
- Flutter (Dart)
- Provider (state management)
- Flutter Secure Storage (token storage)
- HTTP client (API communication)

### Directory Structure

```
lunas_mobile/
├── lib/
│   ├── main.dart           # App entry point
│   ├── core/               # Core functionality (config, network, storage, utils)
│   ├── features/           # Feature-based modules (auth, incidents, etc.)
│   └── common/             # Shared components
├── assets/                 # Images, fonts, etc.
├── android/                # Android-specific code
├── ios/                    # iOS-specific code
├── test/                   # Test files
├── pubspec.yaml            # Flutter dependencies
└── README.md               # Mobile app documentation
```

### Key Directories

#### 📂 Core (`lib/core/`)

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `config/` | App configuration | API URLs, environment config |
| `network/` | API client | `api_client.dart` (HTTP client with token refresh) |
| `storage/` | Secure storage | `secure_session_store.dart` (token storage using Flutter Secure Storage) |
| `routes/` | Navigation | Route definitions |
| `theme/` | App theming | Colors, text styles |
| `utils/` | Utilities | Helpers, validators |
| `widgets/` | Shared widgets | Reusable UI components |

#### 📂 Features (`lib/features/`)

**Purpose:** Feature-based modular architecture. Each feature has its own controllers, screens, and widgets.

| Directory | Purpose | Key Screens/Controllers |
|-----------|---------|-------------------------|
| `auth/` | Authentication | Login, register, MFA verification, password reset |
| `citizen/` | Citizen features | Citizen dashboard, incident list |
| `reporting/` | Incident reporting | Report incident form, camera, location picker |
| `repair/` | Repair personnel | Work order list, progress updates, completion |
| `barangay/` | Barangay official | Barangay dashboard, incident validation |
| `engineering/` | City engineer | City-wide dashboard, analytics |
| `admin/` | Admin features | User management, system settings |
| `utility/` | Utility provider | Utility-specific incidents |
| `validation/` | Incident validation | Validation queue, review screens |
| `notifications/` | Notifications | Notification list, settings |
| `profile/` | User profile | Profile view, edit profile |
| `settings/` | App settings | Settings screen |
| `maps/` | Map features | Map view, location picker |
| `analytics/` | Analytics | Dashboard charts, reports |

**When to modify:**
- Adding new features
- Adding new screens
- Changing UI/UX

---

## 🔐 Authentication Flow

### Backend Authentication

1. **Login:** POST `/api/v1/auth/login` → Returns `accessToken` + `refreshToken`
2. **Token Storage:** Mobile app stores tokens in Flutter Secure Storage
3. **API Requests:** Include `Authorization: Bearer <accessToken>` header
4. **Token Refresh:** On 401 response, mobile app uses `refreshToken` to get new `accessToken`
5. **Logout:** POST `/api/v1/auth/logout` → Invalidates tokens (increments tokenVersion)

### JWT Token Structure

```json
{
  "id": "user_id",
  "tokenType": "access",  // or "refresh"
  "tokenVersion": 0,
  "iat": 1234567890,
  "exp": 1234567890
}
```

### MFA Flow

**For Citizen Registration:**
1. POST `/api/v1/auth/register` → Returns `challengeToken`
2. POST `/api/v1/auth/register/mfa` with `challengeToken` + `code` (from email)
3. Returns `accessToken` + `refreshToken`

**For Privileged Login (admin, city_engineer, etc.):**
1. POST `/api/v1/auth/login` → Returns `challengeToken` (if MFA required)
2. POST `/api/v1/auth/login/mfa` with `challengeToken` + `code` (from email)
3. Returns `accessToken` + `refreshToken`

---

## 🔒 Security Best Practices

### Environment Variables

**Backend (`.env`):**
```bash
# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/lunas_db

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=lunas-storage
SUPABASE_STORAGE_PUBLIC=false  # Keep evidence private!

# AI Service
AI_SERVICE_URL=http://localhost:5001
AI_SERVICE_API_KEY=your_api_key  # Add this!

# MFA
REGISTRATION_MFA_SECRET=your_mfa_secret
PRIVILEGED_MFA_SECRET=your_mfa_secret
```

**AI Service (`.env`):**
```bash
# API Authentication (add this!)
API_KEY=your_api_key

# Device
DEVICE=mps  # or cuda/cpu
```

### File Upload Security

**Evidence Processing Pipeline:**
1. Multer stores file in memory (not disk)
2. Sharp validates image integrity
3. Sharp strips EXIF/GPS metadata
4. Sharp re-encodes to WebP
5. SHA-256 checksum calculated
6. Upload to private Supabase bucket
7. Generate signed URL (1 hour expiry)

**Never:**
- Store files on local disk
- Skip EXIF stripping (leaks location data)
- Use public buckets for evidence
- Return permanent URLs for private files

---

## 🚀 Common Development Tasks

### Adding a New API Endpoint

1. **Create controller function** in `lunas_backend/src/controllers/`
2. **Add validation rules** in `lunas_backend/src/middleware/validation.js`
3. **Create route** in `lunas_backend/src/routes/`
4. **Test endpoint** with Postman or curl
5. **Update API documentation**

### Adding a New YOLO Model

1. **Train model** or obtain `.pt` file
2. **Add model file** to `lunas_ai/models/`
3. **Update `config.yaml`** with model configuration:
   ```yaml
   models:
     your_model:
       name: "YOLOv8n Your Model"
       path: "models/yolov8n-your-model.pt"
       type: "detection"
       classes: [class1, class2, class3]
       confidence_threshold: 0.25
   ```
4. **Add detection method** in `lunas_ai/src/services/detection_service.py`
5. **Create API endpoint** in `lunas_ai/src/api/routes.py`
6. **Test with QA GUI** at `http://localhost:5001/qa`

### Adding a New Mobile Feature

1. **Create feature directory** in `lunas_mobile/lib/features/`
2. **Create controller** with state management
3. **Create screens/widgets**
4. **Add routes** in `lunas_mobile/lib/core/routes/`
5. **Integrate with API** using `ApiClient`
6. **Test on iOS and Android**

---

## 📋 Prompting Guidelines for Future Development

### When Prompting About Backend

**Include:**
- Specific file paths (e.g., `lunas_backend/src/controllers/incidentController.js`)
- The endpoint you're working with (e.g., `POST /api/v1/incidents`)
- The user role (citizen, admin, etc.)
- What you want to achieve

**Example:**
```
"In lunas_backend/src/controllers/incidentController.js, I want to add a new field 
'urgencyScore' to the incident creation logic. This should be calculated based on 
the category and description. The endpoint is POST /api/v1/incidents and should 
work for citizen role users."
```

### When Prompting About AI Service

**Include:**
- Model name (e.g., `road_damage`, `environmental_hazards`)
- The detection endpoint (e.g., `/detect/road-damage`)
- What classes you expect to detect
- Confidence threshold concerns

**Example:**
```
"In lunas_ai/src/services/detection_service.py, the detect_environmental_hazards() 
method is detecting fire_source on streetlights. Can I add a higher confidence 
threshold specifically for fire_source class (45% instead of 25%)?"
```

### When Prompting About Mobile App

**Include:**
- The feature you're working on (e.g., incident reporting)
- The user role (citizen, repair personnel, etc.)
- The screen you're modifying
- API integration needed

**Example:**
```
"In lunas_mobile/lib/features/reporting/, I want to add a camera widget that lets 
users take photos for evidence. These photos should be sent to POST /api/v1/incidents 
with the incident report. The user is a citizen role."
```

---

## 🐛 Common Issues & Solutions

### CORS Errors

**Issue:** "Origin is not allowed by CORS policy"

**Solution:**
1. Check `CORS_ORIGIN` in backend `.env`
2. Ensure frontend origin is in the allowlist
3. For mobile apps, no Origin header is sent (automatically allowed)

### JWT Token Errors

**Issue:** "Token is not valid or has expired"

**Solutions:**
- **Expired token:** Use refresh token to get new access token
- **Invalid token:** Check JWT_SECRET is correct
- **Token version mismatch:** User changed password or logged out, need to re-login

### AI Service Connection Issues

**Issue:** Backend cannot reach AI service

**Solutions:**
1. Check `AI_SERVICE_URL` in backend `.env`
2. Ensure AI service is running: `cd lunas_ai && ./start_qa_testing.sh`
3. Check AI service logs

### File Upload Errors

**Issue:** "File too large" or "Invalid format"

**Solutions:**
1. Check `MAX_FILE_SIZE` in backend `.env` (default 10MB)
2. Ensure file is JPEG, PNG, or WebP
3. Check Multer configuration in `lunas_backend/src/middleware/upload.js`

---

## 📚 Additional Documentation

- **Backend README:** `lunas_backend/README.md`
- **AI Service README:** `lunas_ai/README.md`
- **Mobile README:** `lunas_mobile/README.md`
- **API Endpoints:** `lunas_backend/API_ENDPOINTS.md`
- **System Architecture:** `C4_DIAGRAMS.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **AI Role & Decision Policy:** `LUNAS_AI_ROLE_AND_DECISION_POLICY.md`

---

## ✅ Summary

**For Backend Development:**
- Controllers = Request handlers
- Middleware = Request processing (auth, validation)
- Models = Database schemas
- Routes = API endpoints
- Services = Business logic & external integrations
- Utils = Helper functions

**For AI Development:**
- `config.yaml` = Model configuration
- `src/api/routes.py` = Detection endpoints
- `src/services/detection_service.py` = Detection logic
- `models/` = Trained `.pt` files
- `qa_test_gui.html` = Testing interface

**For Mobile Development:**
- `lib/core/` = Shared functionality (API client, storage, routing)
- `lib/features/` = Feature-based modules (auth, reporting, etc.)
- Each feature has controllers, screens, and widgets

**Key Files to Remember:**
- Backend entry: `lunas_backend/src/server.js`
- AI entry: `lunas_ai/app.py`
- Mobile entry: `lunas_mobile/lib/main.dart`
- Model config: `lunas_ai/config.yaml`
- Environment variables: `.env` files in each service

---

**Document Version:** 1.0  
**Last Updated:** August 1, 2026  
**Author:** LUNAS Development Team
