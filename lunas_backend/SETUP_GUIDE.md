# LUNAS Backend Setup Guide

Complete step-by-step guide to set up and run the LUNAS Backend API.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher  
- **MongoDB** 6.0 or higher (local or MongoDB Atlas)
- **Git** (for cloning the repository)

### Required Accounts
- **Supabase Project** (for file storage and realtime)
- **OneSignal Account** (for push notifications)
- **Google Maps API** (optional, for geocoding features)

---

## 🔧 Step 1: Install Node.js and MongoDB

### Install Node.js

**macOS (using Homebrew):**
```bash
brew install node@18
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show v9.x.x or higher
```

### Install MongoDB

**Option 1: Local Installation**

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

**Ubuntu:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Option 2: MongoDB Atlas (Cloud)**
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string

---

## 🚀 Step 2: Project Setup

### Clone or Navigate to Project

```bash
cd /Users/deb/Desktop/lunas-system/lunas_backend
```

### Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

---

## 🔑 Step 3: Supabase Setup

### Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Enter project name: `lunas-system`
4. Set a strong database password
5. Choose region (Southeast Asia recommended)
6. Click "Create new project"

### Create Storage Bucket

1. In Supabase Dashboard, go to "Storage"
2. Click "Create a new bucket"
3. Name: `lunas-storage`
4. Make it **public** (for image URLs to work)
5. Click "Create bucket"

### Configure Storage Policies

1. Click on `lunas-storage` bucket
2. Go to "Policies" tab
3. Create policies for:

**Insert Policy (Upload):**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lunas-storage');
```

**Select Policy (View):**
```sql
CREATE POLICY "Allow public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lunas-storage');
```

**Delete Policy (Remove):**
```sql
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lunas-storage');
```

### Get Supabase Credentials

1. In Supabase Dashboard, go to "Project Settings" > "API"
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (⚠️ Keep this secret!)

---

## 🔑 Step 4: OneSignal Setup

### Create OneSignal Account

1. Go to [OneSignal Dashboard](https://onesignal.com/)
2. Sign up for a free account
3. Click "New App/Website"
4. Enter app name: `LUNAS System`
5. Select platform: **Mobile App** (iOS & Android)

### Configure Mobile Platforms

#### Android Configuration:
1. Select "Google Android (FCM)"
2. Enter your FCM Server Key from Google Cloud (or use OneSignal's default)
3. Click "Save"

#### iOS Configuration:
1. Select "Apple iOS (APNs)"
2. Upload your APNs certificate (.p8 or .p12)
3. Enter Bundle ID
4. Click "Save"

### Get OneSignal Credentials

1. In OneSignal Dashboard, go to "Settings" > "Keys & IDs"
2. Copy these values:
   - **OneSignal App ID**
   - **REST API Key**
   - **User Auth Key** (from User Auth Key section)

### SDK Integration (for Mobile App)

For Flutter app integration:
```yaml
# pubspec.yaml
dependencies:
  onesignal_flutter: ^5.0.0
```

```dart
// Initialize in main.dart
OneSignal.initialize("YOUR_ONESIGNAL_APP_ID");
OneSignal.Notifications.requestPermission(true);
```

---

## ⚙️ Step 5: Environment Configuration

### Create Environment File

```bash
cp .env.example .env
```

### Edit .env File

Open `.env` and fill in your configuration:

```bash
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# MongoDB Configuration
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/lunas_db

# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lunas_db

# JWT Configuration
JWT_SECRET=change_this_to_a_random_secure_string_min_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=another_random_secure_string_min_32_chars
JWT_REFRESH_EXPIRE=30d

# Supabase Configuration (for file storage and realtime)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here_keep_secret
SUPABASE_STORAGE_BUCKET=lunas-storage

# OneSignal Configuration (for push notifications)
ONESIGNAL_APP_ID=your-onesignal-app-id-here
ONESIGNAL_REST_API_KEY=your_rest_api_key_here
ONESIGNAL_USER_AUTH_KEY=your_user_auth_key_here

# Google Maps API (optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_email_password

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

# CORS (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
```

### Generate Secure JWT Secrets

```bash
# Generate random secret (macOS/Linux)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🗄️ Step 5: Database Setup

### Verify MongoDB Connection

```bash
# Test MongoDB connection
mongosh

# In MongoDB shell:
show dbs
use lunas_db
exit
```

### Seed Initial Data (Optional)

Create initial categories and SLA configurations:

```bash
mongosh lunas_db
```

```javascript
// Insert categories
db.categories.insertMany([
  { 
    name: "Road Infrastructure", 
    code: "ROAD",
    description: "Road-related issues",
    defaultPriority: "high",
    isActive: true,
    order: 1
  },
  { 
    name: "Drainage System", 
    code: "DRAIN",
    description: "Drainage and flooding issues",
    defaultPriority: "medium",
    isActive: true,
    order: 2
  },
  { 
    name: "Electrical", 
    code: "ELEC",
    description: "Electrical and streetlight issues",
    defaultPriority: "high",
    isActive: true,
    order: 3
  },
  { 
    name: "Water Supply", 
    code: "WATER",
    description: "Water supply issues",
    defaultPriority: "critical",
    isActive: true,
    order: 4
  }
]);

// Insert SLA configurations
db.slaconfigs.insertMany([
  {
    priority: "critical",
    targetResolutionTime: 48,
    escalationLevels: [
      { level: 1, triggerAfter: 24, notifyRoles: ["city_engineer"] },
      { level: 2, triggerAfter: 48, notifyRoles: ["admin"] }
    ],
    reminderSchedule: [
      { sendBefore: 24 },
      { sendBefore: 12 },
      { sendBefore: 6 }
    ],
    isActive: true
  },
  {
    priority: "high",
    targetResolutionTime: 72,
    escalationLevels: [
      { level: 1, triggerAfter: 48, notifyRoles: ["city_engineer"] }
    ],
    reminderSchedule: [
      { sendBefore: 24 },
      { sendBefore: 12 }
    ],
    isActive: true
  },
  {
    priority: "medium",
    targetResolutionTime: 168,
    escalationLevels: [
      { level: 1, triggerAfter: 120, notifyRoles: ["barangay_official"] }
    ],
    reminderSchedule: [
      { sendBefore: 24 }
    ],
    isActive: true
  },
  {
    priority: "low",
    targetResolutionTime: 336,
    escalationLevels: [],
    reminderSchedule: [
      { sendBefore: 24 }
    ],
    isActive: true
  }
]);
```

---

## ▶️ Step 6: Run the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Production Mode

```bash
npm start
```

### Verify Server is Running

Open your browser or use curl:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-08-01T...",
  "uptime": 1.234,
  "environment": "development"
}
```

---

## 🧪 Step 7: Test the API

### Create Admin User

Using Postman, curl, or any API client:

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@lunas.com",
    "phone": "09123456789",
    "password": "Admin@123",
    "role": "admin"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lunas.com",
    "password": "Admin@123"
  }'
```

Save the returned `token` for authenticated requests.

### Test Protected Endpoint

```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📝 Step 8: Monitor Logs

### View Real-time Logs

```bash
# In development mode, logs appear in console
npm run dev

# View log files
tail -f logs/combined.log
tail -f logs/error.log
```

### Log Locations

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output in development mode

---

## 🔍 Troubleshooting

### MongoDB Connection Issues

**Error:** `MongoServerError: bad auth`
```bash
# Solution: Check your MongoDB credentials in .env
# For local MongoDB, use:
MONGODB_URI=mongodb://localhost:27017/lunas_db
```

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`
```bash
# Solution: Start MongoDB service
# macOS:
brew services start mongodb-community@6.0
# Linux:
sudo systemctl start mongod
```

### Supabase Errors

**Error:** `Supabase Storage not initialized`
```bash
# Solution: Verify Supabase credentials in .env
# Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set correctly
# URL format: https://xxxxx.supabase.co
```

**Error:** `Failed to upload file: new row violates row-level security policy`
```bash
# Solution: Check storage bucket policies in Supabase Dashboard
# Make sure you have policies for INSERT, SELECT, and DELETE
# Bucket should be public if you want direct URL access
```

**Error:** `Bucket not found`
```bash
# Solution: Create the storage bucket in Supabase Dashboard
# Default bucket name: lunas-storage
# Or change SUPABASE_STORAGE_BUCKET in .env to match your bucket name
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`
```bash
# Solution: Kill the process using port 5000
# macOS/Linux:
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env to different port
PORT=5001
```

### CORS Errors

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`
```bash
# Solution: Add your frontend URL to CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change all default passwords and secrets
- [ ] Use strong JWT secrets (minimum 32 characters)
- [ ] Enable MongoDB authentication
- [ ] Configure Supabase Row-Level Security (RLS) policies
- [ ] Set Supabase storage bucket to appropriate access level
- [ ] Secure OneSignal API keys (never expose REST API key publicly)
- [ ] Set up HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Regular security audits
- [ ] Keep dependencies updated

---

## 📚 Next Steps

1. **Read API Documentation:** Check `API_ENDPOINTS.md` for complete endpoint reference
2. **Test File Upload:** Upload a test image through the API to verify Supabase Storage
3. **Test Notifications:** Send a test push notification via OneSignal
4. **Configure Mobile App:** Set up Flutter mobile app with OneSignal SDK
5. **Set up Web Dashboard:** Configure Next.js web app
6. **Test All Features:** Test incident reporting, work orders, notifications
7. **Deploy to Production:** Follow deployment guide for your hosting platform

---

## 🆘 Getting Help

If you encounter issues:

1. Check this setup guide thoroughly
2. Review error logs in `logs/` directory
3. Check MongoDB and Firebase status
4. Verify all environment variables
5. Contact development team

---

## 📞 Support

PHINMA University of Pangasinan  
College of Information Technology  
LUNAS Development Team

---

**Last Updated:** August 2026
