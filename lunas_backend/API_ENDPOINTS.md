# LUNAS API Endpoints Reference

Complete reference guide for all API endpoints with request/response examples.

Base URL: `http://localhost:5000/api/v1`

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

**Access:** Public

**Request Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "email": "juan@example.com",
  "phone": "09123456789",
  "password": "SecurePass123",
  "role": "citizen",
  "address": {
    "street": "123 Main Street",
    "barangay": "Poblacion Oeste",
    "city": "Dagupan City",
    "zipCode": "2400"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64abc123...",
      "firstName": "Juan",
      "lastName": "Dela Cruz",
      "email": "juan@example.com",
      "role": "citizen"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login
**POST** `/auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "juan@example.com",
  "password": "SecurePass123",
  "deviceToken": "fcm_device_token_here",
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Current User
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

### 4. Update Profile
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

### 5. Change Password
**PUT** `/auth/change-password`

**Access:** Private

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass123"
}
```

### 6. Logout
**POST** `/auth/logout`

**Access:** Private

**Request Body:**
```json
{
  "deviceToken": "fcm_device_token_here"
}
```

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

**Request Body:**
```json
{
  "category": "road",
  "subcategory": "pothole",
  "description": "Large pothole on AB Fernandez Avenue causing traffic delays and potential vehicle damage. Approximately 1 meter in diameter.",
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
      "url": "https://storage.googleapis.com/lunas-bucket/uploads/...",
      "key": "uploads/1722508800000-abc123.jpg",
      "isPrivacyMasked": false
    }
  ],
  "aiAnalysis": {
    "detected": true,
    "hazardType": "road_damage",
    "confidence": 0.87,
    "needsPrivacyMasking": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Incident reported successfully",
  "data": {
    "_id": "64abc123...",
    "reportNumber": "LUNAS-202608-000001",
    "status": "submitted",
    "sla": {
      "targetResolutionTime": 72,
      "deadline": "2026-08-04T10:30:00Z"
    }
  }
}
```

### 3. Get Single Incident
**GET** `/incidents/:id`

**Access:** Private

**Response:** Full incident details with populated fields

### 4. Update Incident
**PUT** `/incidents/:id`

**Access:** Private (Officials only)

**Request Body:**
```json
{
  "status": "validated",
  "priority": "critical",
  "notes": "Upgraded to critical due to heavy traffic area"
}
```

### 5. Validate Incident
**POST** `/incidents/:id/validate`

**Access:** Private (Barangay Official, City Engineer, Admin)

**Response:**
```json
{
  "success": true,
  "message": "Incident validated successfully",
  "data": { ... }
}
```

### 6. Reject Incident
**POST** `/incidents/:id/reject`

**Access:** Private (Officials only)

**Request Body:**
```json
{
  "reason": "Duplicate report. Original report number: LUNAS-202607-000945"
}
```

### 7. Get Nearby Incidents
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

## Work Order Endpoints

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

**Access:** Private (Repair Personnel)

**Request Body:**
```json
{
  "status": "in_progress",
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

### 5. Complete Work Order
**POST** `/work-orders/:id/complete`

**Access:** Private (Repair Personnel)

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

## User Endpoints

### 1. Get All Users
**GET** `/users`

**Access:** Private (Officials, Admin)

**Query Parameters:**
- `page`, `limit`, `role`, `barangay`, `search`, `sortBy`

### 2. Get Single User
**GET** `/users/:id`

**Access:** Private

### 3. Update User
**PUT** `/users/:id`

**Access:** Private (Admin only)

**Request Body:**
```json
{
  "role": "barangay_official",
  "isActive": true,
  "isVerified": true,
  "barangay": "Poblacion Oeste"
}
```

### 4. Get Repair Personnel
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

**Access:** Private

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

### 2. Analytics
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
| 429 | Too Many Requests |
| 500 | Server Error |

---

**Last Updated:** August 2026
