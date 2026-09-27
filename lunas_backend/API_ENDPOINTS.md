# LUNAS API Endpoints Reference

Complete reference guide for all API endpoints with request/response examples.

Base URL: `http://localhost:5000/api/v1`

---

## Audit Log Endpoint

### Read Audit Logs
**GET** `/audit-logs`

**Access:** Private (Admin only)

Supported filters are `action`, `status`, `actorType`, `source`,
`resourceType`, `from`, `to`, `page`, and `limit`. Results are newest first.
The endpoint returns sanitized, read-only records; passwords, session tokens,
CAPTCHA tokens, MFA challenge tokens, and one-time codes are never included.

Security events include web CAPTCHA failures/provider outages, registration MFA
challenge/delivery/verification outcomes, login success/failure, and account
archive success/failure. Anonymous events retain request context without storing
the submitted email address or credentials.

---

## Authentication Endpoints

### 1. Register Citizen
**POST** `/auth/register`

**Access:** Public

Public registration always creates a `citizen` account. A request cannot
self-assign a barangay, city, utility, repair, or administrator role.

**Request Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "email": "juan@example.com",
  "phone": "09123456789",
  "password": "SecurePass123",
  "address": {
    "street": "123 Main Street",
    "barangay": "Poblacion Oeste",
    "city": "Dagupan City",
    "zipCode": "2400"
  }
}
```

The account remains inactive until its email one-time code is verified.

**Response (HTTP 201):**
```json
{
  "success": true,
  "message": "Enter the verification code sent to your email to finish registration.",
  "data": {
    "challengeToken": "one-time-registration-challenge",
    "email": "juan@example.com",
    "expiresInSeconds": 600,
    "resendAfterSeconds": 60
  }
}
```

### 1a. Verify Mobile Registration MFA
**POST** `/auth/register/verify`

```json
{
  "email": "juan@example.com",
  "challengeToken": "one-time-registration-challenge",
  "code": "123456"
}
```

Successful verification activates the account and returns the access/refresh
session pair. The code expires, is attempt-limited, and is never stored in
plain text.

### 1b. Resend Mobile Registration MFA
**POST** `/auth/register/resend`

```json
{
  "email": "juan@example.com",
  "challengeToken": "current-registration-challenge"
}
```

The endpoint is rate-limited and rotates both the challenge and code.

### 2. Login
**POST** `/auth/login`

**Access:** Public

Web login must include `"platform": "web"` and a current
`"captchaToken"` returned by the Turnstile widget. Native mobile login does
not render or call Turnstile.

**Request Body:**
```json
{
  "email": "juan@example.com",
  "password": "SecurePass123",
  "deviceToken": "optional-push-device-token",
  "platform": "android"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "short-lived-access-jwt",
    "refreshToken": "rotating-refresh-jwt",
    "token": "short-lived-access-jwt",
    "expiresIn": "15m"
  }
}
```

### 3. Refresh Session
**POST** `/auth/refresh`

**Access:** Public, with a valid one-time refresh token

```json
{ "refreshToken": "rotating-refresh-jwt" }
```

The supplied refresh token is rotated. Store it in platform secure storage or
the web server's encrypted HttpOnly session only; never put it in browser
JavaScript or application logs.

### 4. Request Password Reset
**POST** `/auth/forgot-password`

**Access:** Public

```json
{ "email": "juan@example.com" }
```

The response is deliberately generic. Reset email delivery occurs only when
`PASSWORD_RESET_APP_URL` and `PASSWORD_RESET_DELIVERY_URL` are configured.

### 5. Complete Password Reset
**POST** `/auth/reset-password`

**Access:** Public

```json
{
  "token": "one-time-reset-token",
  "password": "NewSecurePass123"
}
```

Reset tokens are stored as hashes, expire, and are invalidated after use. A
successful reset returns a new access/refresh token pair.

### 6. Get Current User
**GET** `/auth/me`

**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64abc123...",
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "email": "juan@example.com",
    "role": "citizen",
    "isVerified": true
  }
}
```

### 7. Update Profile
**PUT** `/auth/profile`

**Access:** Private

**Request Body:**
```json
{
  "firstName": "Juan Carlos",
  "phone": "09123456789",
  "address": {
    "street": "456 New Street",
    "barangay": "Poblacion Oeste"
  }
}
```

### 8. Change Password
**PUT** `/auth/change-password`

**Access:** Private

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass123"
}
```

### 9. Logout
**POST** `/auth/logout`

**Access:** Private

Logout revokes the account's currently issued sessions; an optional
`deviceToken` removes that push-device registration too.

---

## Incident Endpoints

### 1. Get All Incidents
**GET** `/incidents`

**Access:** Private

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` - Filter by status
- `priority` - Filter by priority
- `category` - Filter by category
- `barangay` - Filter by barangay
- `search` - Search in report number and description
- `sortBy` - Sort field (default: -createdAt)

**Example:** `/incidents?status=submitted&priority=high&page=1&limit=10`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc123...",
      "reportNumber": "LUNAS-202608-000001",
      "category": "road",
      "subcategory": "pothole",
      "description": "Large pothole causing traffic issues",
      "status": "submitted",
      "priority": "high",
      "location": {
        "coordinates": [120.3387, 16.0433],
        "address": {
          "barangay": "Poblacion Oeste",
          "street": "AB Fernandez Avenue"
        }
      },
      "reporter": {
        "firstName": "Juan",
        "lastName": "Dela Cruz"
      },
      "createdAt": "2026-08-01T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

### 2. Create Incident
**POST** `/incidents`

**Access:** Private (Citizen, Admin)

**Preferred request:** `multipart/form-data`

| Field | Value |
| --- | --- |
| `category` | One of `road`, `drainage`, `electrical`, `water`, `gas`, `streetlight`, `other` |
| `subcategory` | Optional supported subcategory |
| `description` | 10–2,000 character citizen description |
| `location` | JSON string with GeoJSON-style `Point`, `[longitude, latitude]`, and address/barangay |
| `privacyAcknowledged` | Required `true` for citizen evidence while a real face/plate detector is unavailable |
| `evidence` | One to five JPG/PNG/WebP images, each at most the configured size (10 MB by default) |

The backend decodes and validates the image, re-encodes it to WebP to remove
EXIF metadata and reduce storage size, generates the object key/checksum, and
stores evidence through the configured storage provider. It ignores a
citizen-supplied priority and begins
the report in `submitted`; it does not accept a client-declared AI result.

Example multipart location field:

```json
{
  "type": "Point",
  "coordinates": [120.3387, 16.0433],
  "address": {
    "street": "AB Fernandez Avenue",
    "barangay": "Poblacion Oeste",
    "city": "Dagupan City",
    "landmark": "Near City Hall"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Incident reported successfully",
  "data": {
    "id": "64abc123...",
    "reportNumber": "LUNAS-202608-000001",
    "status": "submitted",
    "statusHistory": [{ "status": "submitted", "changedAt": "2026-08-01T10:30:00Z" }],
    "possibleDuplicateCandidateCount": 0
  }
}
```

### 3. Get Single Incident
**GET** `/incidents/:id`

**Access:** Private

Citizen callers may retrieve only their own report. Their response contains
safe report fields, processed-evidence URLs, location, current status, and
server-authored status history; it does not expose private storage keys,
reviewer identity, internal review/routing notes, or other official-only data.
For a rejected or duplicate outcome, the permitted citizen-visible reason is
returned in the dedicated `rejectionReason` or `duplicateReason` field.

### 4. Get My Reports
**GET** `/incidents/my?page=1&limit=20`

**Access:** Private (Citizen)

Returns only the authenticated citizen's reports, newest first, with a normal
pagination envelope. This endpoint is not a client-side filter over all
citizen records.

### 5. Get Status History
**GET** `/incidents/:id/history`

**Access:** Private, ownership-protected for citizens

```json
{
  "success": true,
  "data": [{
    "status": "submitted",
    "changedAt": "2026-08-01T10:30:00Z"
  }]
}
```

### 6. Pending Validation Queue
**GET** `/incidents/pending-validation`

**Access:** Private (Barangay Official, City Engineer, Administrator)

Returns only `submitted` reports within the authenticated official's
server-enforced jurisdiction. The result is not a client-side filter over all
reports.

**Query parameters:**

- `page`, `limit`
- `search` - report number, description, street, or barangay
- `category`
- `barangay` - city-wide roles only; barangay scope is always enforced
- `hasDuplicateCandidate=true|false`
- `sortBy=createdAt|-createdAt|priority|-priority`
- `from`, `to` - ISO calendar dates

Each item includes only operationally necessary fields: report number,
category/description, submitted location, signed evidence thumbnail, status,
submitted time, advisory duplicate count, and safe AI assistance metadata when
available. AI metadata includes `analysisStatus`, `hazardType`, `confidence`,
 normalized detection counts, per-image normalized bounding boxes,
 `requiresManualReview: true`, and `advisoryOnly: true`. AI runs only the model
 assigned to the incident's canonical category; unsupported categories remain
 manual-review only. AI never changes category, priority, routing, duplicate
status, incident status, work orders, or closure. It does not expose citizen
email, phone, account internals, raw model errors, or storage keys.

### 7. Review Advisory Duplicate Candidates
**GET** `/incidents/:id/duplicate-candidates`

**Access:** Private (authorized validation officials)

Candidates are suggestions only. They contain a scoped reference number,
category, submitted time, location, distance/score when available, and a
signed evidence thumbnail. This endpoint never changes a report's status.

### 8. Read SLA Foundation
**GET** `/incidents/:id/sla`

**Access:** Private and incident-scope protected

Returns `priority`, target resolution hours, `startedAt`, `deadline`, and the
current SLA state. A submitted report has `not_started`; validating with a
priority initializes an active SLA record.

### 9. Validate a Report
**POST** `/incidents/:id/validate`

**Access:** Private (Barangay Official, City Engineer, Administrator), scoped
to the report's jurisdiction

```json
{
  "priority": "high",
  "jurisdiction": {
    "barangay": "Poblacion Oeste",
    "city": "Dagupan City",
    "responsibility": "city_engineering"
  },
  "routing": {
    "responsibleOrganization": "City Engineering",
    "responsibleRole": "city_engineering",
    "reason": "Requires city road assessment"
  },
  "notes": "Evidence and location reviewed"
}
```

This is the only validate transition: `submitted → validated`. It persists the
priority, validator/timestamp, jurisdiction, routing history, and SLA start in
the same conditional incident update, then records audit and notification
events. A stale or already-decided report returns HTTP `409`. The `jurisdiction`
and `routing` objects may both be omitted to use the authorized server defaults;
when routing is supplied, `responsibleOrganization` and `responsibleRole` must
be supplied together so a partial client value cannot produce a mismatched
route.

### 10. Reject a Report
**POST** `/incidents/:id/reject`

**Access:** Private (authorized validation officials), jurisdiction scoped

```json
{
  "reason": "Insufficient evidence to identify the infrastructure issue",
  "notes": "Optional internal review note"
}
```

`reason` is mandatory, trimmed, and 2–500 characters. This is the only reject
transition: `submitted → rejected`. The safe reason is available to the
reporting citizen; internal notes are not.

### 11. Mark a Report as Duplicate
**POST** `/incidents/:id/mark-duplicate`

**Access:** Private (authorized validation officials), jurisdiction scoped

```json
{
  "duplicateOf": "64abc123...",
  "reason": "Same road defect and evidence as the canonical report",
  "notes": "Optional internal review note"
}
```

This is the only duplicate transition: `submitted → duplicate`. The canonical
report must be visible to the official, cannot be the same report, and cannot
create a circular duplicate chain. The duplicate report remains stored and
auditable.

### 12. Update Priority of a Validated Report
**PATCH** `/incidents/:id/priority`

**Access:** Private (Barangay Official, City Engineer, Administrator),
jurisdiction scoped

```json
{ "priority": "critical" }
```

Only a `validated` report can be reprioritized. The endpoint records priority
metadata/history and recalculates its centralized SLA foundation.

### 13. Confirm Jurisdiction of a Validated Report
**PATCH** `/incidents/:id/jurisdiction`

**Access:** Private (authorized validation officials), jurisdiction scoped

```json
{
  "barangay": "Poblacion Oeste",
  "city": "Dagupan City",
  "responsibility": "barangay"
}
```

Jurisdiction confirmation is auditable. Barangay officials can only confirm
their own configured barangay; city engineers and administrators have the
city-wide permission.

### 14. Route a Validated Report
**POST** `/incidents/:id/route`

**Access:** Private (authorized validation officials), jurisdiction scoped

```json
{
  "responsibleOrganization": "Dagupan Water District",
  "responsibleRole": "utility_provider",
  "reason": "Water-line leak requires provider review"
}
```

Routing identifies the responsible organization and appends a routing-history
record. It is not a work order or repair-personnel assignment.

### 15. Update an Official Note
**PUT** `/incidents/:id`

**Access:** Private (authorized officials), jurisdiction scoped

```json
{ "notes": "A non-workflow review note" }
```

This endpoint cannot update `status`, `priority`, a rejection reason, or a
duplicate reference. Use the dedicated controlled endpoints above instead.

### 16. Get Nearby Incidents
**GET** `/incidents/nearby`

**Access:** Private

**Query Parameters:**
- `longitude` (required)
- `latitude` (required)
- `maxDistance` (default: 5000 meters)

**Example:** `/incidents/nearby?longitude=120.3387&latitude=16.0433&maxDistance=1000`

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "count": 3
}
```

---

## Category Endpoints

### 1. Get Reportable Categories
**GET** `/categories`

**Access:** Public

Returns active category records when configured, otherwise the established
incident category codes used by the report validator. The citizen app can keep
manual selection available if this request is temporarily unavailable.

---

## Legacy Work-Order Endpoints (Removed at 75%)

The remainder of this legacy section is retained only to describe the
pre-75% repository state. Do **not** call its create-with-assignee,
arbitrary-progress, `/complete`, or `/verify` endpoints: they are not
registered by the current API and do not represent the supported workflow.

### 1. Get All Work Orders
**GET** `/work-orders`

**Access:** Private

**Query Parameters:**
- `page`, `limit`, `status`, `priority`, `sortBy`

### 2. Create Work Order
**POST** `/work-orders`

**Access:** Private (Officials only)

**Request Body:**
```json
{
  "incident": "64abc123...",
  "assignedTo": "64def456...",
  "priority": "high",
  "instructions": "Please bring equipment for asphalt repair. Road section needs to be cordoned off during repair.",
  "estimatedCompletionTime": "2026-08-03T15:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Work order created successfully",
  "data": {
    "orderNumber": "WO-202608-000001",
    "status": "pending",
    "progressPercent": 0,
    "sla": {
      "deadline": "2026-08-04T10:30:00Z"
    }
  }
}
```

### 3. Accept Work Order
**POST** `/work-orders/:id/accept`

**Access:** Private (Repair Personnel, Utility Provider)

**Response:**
```json
{
  "success": true,
  "message": "Work order accepted",
  "data": { ... }
}
```

### 4. Update Progress
**POST** `/work-orders/:id/progress`

**Access:** Private (Repair Personnel, Utility Provider)

**Request Body:**
```json
{
  "status": "in_progress",
  "progressPercent": 65,
  "stage": "asphalt filling",
  "notes": "Started repair work. Excavation complete, preparing for asphalt filling.",
  "images": [
    {
      "url": "https://...",
      "key": "progress/..."
    }
  ],
  "location": {
    "type": "Point",
    "coordinates": [120.3387, 16.0433]
  }
}
```

`progressPercent` is a number from `0` to `100` and cannot be reduced from
the work order's current value. It is optional for legacy clients; an omitted
value retains the current percentage. `stage` is an optional repair milestone
and is separate from the workflow status. Progress updates may only set the
workflow status to `in_progress`.

### 5. Complete Work Order
**POST** `/work-orders/:id/complete`

**Access:** Private (Repair Personnel, Utility Provider)

**Prerequisite:** The work order must have `progressPercent` equal to `100`.
Submitting completion retains/sets the aggregate percentage to `100` and adds
a completion entry to the progress history.

**Request Body:**
```json
{
  "description": "Pothole has been filled and compacted. Road surface leveled and marked.",
  "beforeImages": [
    {
      "url": "https://...",
      "key": "before/..."
    }
  ],
  "afterImages": [
    {
      "url": "https://...",
      "key": "after/..."
    }
  ],
  "workPerformed": "Excavated damaged area, filled with hot mix asphalt, compacted and leveled",
  "materialsUsed": [
    {
      "name": "Hot Mix Asphalt",
      "quantity": 0.5,
      "unit": "cubic meters"
    }
  ],
  "laborHours": 3,
  "totalCost": 5000
}
```

### 6. Verify Completion
**POST** `/work-orders/:id/verify`

**Access:** Private (Officials only)

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Repair quality verified. Work meets standards.",
  "aiScore": 0.85,
  "aiAnalysis": {
    "similarity": 0.82,
    "improvementDetected": true,
    "notes": "Significant improvement detected in road surface"
  }
}
```

---

## 75% Work-Order, Assignment, and Repair API

The current maintenance state machine is:

```text
unassigned pending → assigned pending → accepted → in_progress → completed
```

`completed` means **100% repair progress and ready for formal
completion/verification**. It never verifies, approves, or closes an incident.

### Create and monitor

- **POST** `/incidents/:id/work-orders` — creates one unassigned, 0%
  primary work order from a validated, routed incident in the official's
  permitted scope. It inherits priority, jurisdiction, organization, and SLA.
- **POST** `/work-orders` — compatibility form using
  `{ "incident": "<id>", "instructions": "..." }`; follows the same rules.
- **GET** `/work-orders` — scoped list with `page`, `limit`, `search`,
  `status`, `priority`, `assignmentStatus`, `personnel`,
  `organization`, `category`, `progress`, `slaState`, and safe
  `sortBy` values.
- **GET** `/work-orders/my` — current repair person's assigned work only.
- **GET** `/work-orders/:id` — scoped operational detail.

Citizens cannot call any work-order management endpoint. Repair personnel are
restricted server-side to their own current assignments.

### Assignment

- **GET** `/work-orders/:id/eligible-personnel` — active,
  organization-compatible, available repair personnel in applicable
  jurisdiction.
- **POST** `/work-orders/:id/assign`

  ```json
  { "assigneeId": "64def456..." }
  ```

- **POST** `/work-orders/:id/reassign`

  ```json
  {
    "assigneeId": "64abc456...",
    "reason": "Original worker reported an equipment conflict."
  }
  ```

- **GET** `/work-orders/:id/assignments` — append-only assignment history.
- **POST** `/work-orders/:id/accept` — active assigned repair personnel.
- **POST** `/work-orders/:id/decline` — active assigned repair personnel;
  body requires a 2–500 character `reason`, with optional `notes`.

Assignment and reassignment preserve history, create audit events, persist
in-app notifications, and return `409` on stale/conflicting operations.
Declining preserves the work order and makes it available for reassignment.

### Start, progress, and evidence

- **POST** `/work-orders/:id/start` — only the active accepted assignee may
  transition to `in_progress`.
- **POST** `/work-orders/:id/progress` — active in-progress assignee;
  accepts JSON or multipart `FormData` with up to five `evidence` images.
- **POST** `/work-orders/:id/evidence` — additional in-progress field
  evidence, multipart `evidence` images plus optional `caption` and
  `progressUpdateId`. When supplied, `progressUpdateId` must belong to this
  work order and the new evidence remains linked to that append-only progress
  record.
- **GET** `/work-orders/:id/progress` — append-only progress entries.

Every progress update must use exactly one approved pair:

| Repair progress | Stage |
| --- | --- |
| 0% | `assigned` |
| 25% | `site_preparation` |
| 50% | `main_repair` |
| 75% | `finishing` |
| 100% | `ready_for_completion` |

Progress cannot regress, repeat, or use arbitrary percentages. At 100%, a
meaningful note is required; the work order becomes `completed` and
`readyForCompletion`. It does not trigger completion submission, SSIM/AI,
verification, rework, or closure.

### SLA and dashboard

- **GET** `/work-orders/:id/sla`
- **GET** `/work-orders/approaching-deadline`
- **GET** `/work-orders/overdue`
- **GET** `/dashboard/work-orders-summary`

Deadline, remaining time, approaching state, and overdue state are generated
by the backend. `runWorkOrderSlaCheck` is scheduler-invokable and records
only one approaching and one overdue alert per active work order.

---

## User Endpoints

### 1. Get or Update My Profile
**GET/PATCH** `/users/me`

**Access:** Private

Returns or updates only the authenticated account's permitted personal fields.
`role`, account status, organization, and other administrative fields cannot be
self-assigned through this endpoint.

### 2. Get All Users
**GET** `/users`

**Access:** Private (Officials, Admin)

**Query Parameters:**
- `page`, `limit`, `role`, `barangay`, `search`, `sortBy`

### 3. Get Single User
**GET** `/users/:id`

**Access:** Private

### 4. Update User
**PUT** `/users/:id`

**Access:** Private (Admin only)

**Request Body:**
```json
{
  "role": "barangay_official",
  "isActive": true,
  "isVerified": true,
  "barangay": "Poblacion Oeste",
  "utilityCompany": "Dagupan Water District"
}
```

### 5. Archive User
**PATCH** `/users/:id/archive`

**Access:** Private (Admin only)

```json
{ "reason": "Employment ended" }
```

Archiving keeps the database record and audit history, marks the account
inactive, and revokes access, refresh, and device sessions. The former
`DELETE /users/:id` route is retained only as a compatibility alias and also
performs this same non-destructive archive operation.

### 6. Get Repair Personnel
**GET** `/users/repair-personnel`

**Access:** Private (Officials)

**Query Parameters:**
- `barangay` - Filter by barangay
- `expertise` - Filter by expertise (road, drainage, electrical, etc.)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64def456...",
      "firstName": "Pedro",
      "lastName": "Santos",
      "role": "repair_personnel",
      "barangay": "Poblacion Oeste",
      "expertise": ["road", "drainage"]
    }
  ],
  "count": 5
}
```

---

## Notification Endpoints

### 1. Get Notifications
**GET** `/notifications`

**Access:** Private

**Query Parameters:**
- `page`, `limit`
- `isRead` - Filter by read status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "unreadCount": 3,
  "pagination": { ... }
}
```

### 2. Mark as Read
**PUT** `/notifications/:id/read`

**Access:** Private

### 3. Mark All as Read
**PUT** `/notifications/read-all`

**Access:** Private

### 4. Delete Notification
**DELETE** `/notifications/:id`

**Access:** Private

---

## Statistics Endpoints

### 1. Dashboard Statistics
**GET** `/stats/dashboard`

**Access:** Private (operational roles only; not citizens)

**Response:**
```json
{
  "success": true,
  "data": {
    "incidents": {
      "total": 150,
      "pending": 25,
      "inProgress": 40,
      "completed": 85,
      "overdue": 5,
      "byPriority": [
        { "_id": "critical", "count": 10 },
        { "_id": "high", "count": 35 }
      ],
      "byCategory": [
        { "_id": "road", "count": 60 },
        { "_id": "drainage", "count": 30 }
      ]
    },
    "workOrders": {
      "total": 120,
      "active": 35,
      "completed": 85
    },
    "recentIncidents": [ ... ]
  }
}
```

### 2. Validation Summary
**GET** `/stats/validation-summary`

**Access:** Private (Barangay Official, City Engineer, Administrator)

Returns real aggregate counts only for the authenticated official's incident
scope. It is intended for the 50% validation dashboard and does not load the
queue merely to count it.

```json
{
  "success": true,
  "data": {
    "pending": 12,
    "validated": 9,
    "rejected": 2,
    "duplicate": 1,
    "total": 24
  }
}
```

### 3. Analytics
**GET** `/stats/analytics`

**Access:** Private (Officials, Admin)

**Query Parameters:**
- `startDate` - ISO date string
- `endDate` - ISO date string
- `barangay` - Filter by barangay

**Example:** `/stats/analytics?startDate=2026-07-01&endDate=2026-07-31&barangay=Poblacion%20Oeste`

**Response:**
```json
{
  "success": true,
  "data": {
    "incidentsOverTime": [
      {
        "_id": { "year": 2026, "month": 7, "day": 15 },
        "count": 5
      }
    ],
    "avgResolutionTime": 52.5,
    "topBarangays": [
      { "_id": "Poblacion Oeste", "count": 45 },
      { "_id": "Bonuan Boquig", "count": 32 }
    ]
  }
}
```

---

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Authorization Error
```json
{
  "success": false,
  "message": "User role 'citizen' is not authorized to access this route"
}
```

### Not Found Error
```json
{
  "success": false,
  "message": "Resource not found"
}
```

---

## Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 per IP
- **Response when exceeded:**
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict: a submitted report was already decided by another official |
| 429 | Too Many Requests |
| 500 | Server Error |

---

**Last Updated:** August 2026
