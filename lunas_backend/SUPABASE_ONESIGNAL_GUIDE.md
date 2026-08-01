# Supabase + OneSignal Integration Guide

Complete guide for setting up Supabase Storage and OneSignal Push Notifications for LUNAS backend.

---

## 🗄️ Supabase Setup

### What is Supabase?

Supabase is an open-source Firebase alternative that provides:
- **PostgreSQL Database** (not used in LUNAS, we use MongoDB)
- **Storage** - File and image storage (✅ Used in LUNAS)
- **Realtime** - Real-time subscriptions (can be added later)
- **Auth** - Authentication (not used, we use JWT)

### Why Supabase for Storage?

- ✅ Simple REST API
- ✅ No service account JSON needed
- ✅ Direct public URLs for images
- ✅ Built-in Row-Level Security (RLS)
- ✅ 1GB free storage
- ✅ Can self-host if needed

### Step-by-Step Setup

#### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name:** `lunas-system`
   - **Database Password:** (choose a strong password)
   - **Region:** Southeast Asia (Singapore)
4. Click "Create new project" (takes ~2 minutes)

#### 2. Create Storage Bucket

1. In sidebar, click "Storage"
2. Click "Create a new bucket"
3. Fill in:
   - **Name:** `lunas-storage`
   - **Public bucket:** ✅ Yes (for direct image URLs)
4. Click "Create bucket"

#### 3. Configure Storage Policies

Storage policies control who can upload, view, and delete files.

**Navigate to Policies:**
1. Click on your `lunas-storage` bucket
2. Click "Policies" tab
3. Click "New Policy"

**Create these 3 policies:**

**Policy 1: Allow Uploads**
```sql
-- Policy name: Allow authenticated uploads
-- Allowed operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lunas-storage');
```

**Policy 2: Allow Public Access (View)**
```sql
-- Policy name: Allow public access
-- Allowed operation: SELECT
-- Target roles: public

CREATE POLICY "Allow public access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'lunas-storage');
```

**Policy 3: Allow Deletes**
```sql
-- Policy name: Allow authenticated deletes
-- Allowed operation: DELETE
-- Target roles: authenticated

CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lunas-storage');
```

#### 4. Get API Credentials

1. In sidebar, click "Project Settings" (gear icon)
2. Click "API" section
3. Copy these values:

```bash
# Project URL
SUPABASE_URL=https://xxxxx.supabase.co

# anon public key (safe to use in client apps)
SUPABASE_ANON_KEY=eyJhbG...

# service_role key (⚠️ KEEP SECRET - server use only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

#### 5. Add to .env File

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_STORAGE_BUCKET=lunas-storage
```

---

## 🔔 OneSignal Setup

### What is OneSignal?

OneSignal is a push notification service that supports:
- ✅ iOS, Android, Web push notifications
- ✅ Free up to 10,000 subscribers
- ✅ Easy SDK integration
- ✅ Segmentation and targeting
- ✅ Analytics and reporting

### Why OneSignal?

- ✅ No Firebase dependency
- ✅ Simpler than FCM
- ✅ Better analytics
- ✅ Cross-platform support
- ✅ Generous free tier

### Step-by-Step Setup

#### 1. Create OneSignal Account

1. Go to https://onesignal.com/
2. Click "Get Started Free"
3. Sign up with email or Google
4. Verify your email

#### 2. Create New App

1. Click "New App/Website"
2. Enter app name: `LUNAS System`
3. Select: **Native Mobile Apps**
4. Click "Next"

#### 3. Configure Platforms

**For Android:**

1. Select "Google Android (FCM)"
2. You need a Firebase Server Key:
   - Go to Firebase Console (if you have it)
   - Or use OneSignal's Firebase project
   - Click "Configure Automatically"
3. Click "Save & Continue"

**For iOS (if applicable):**

1. Select "Apple iOS"
2. Upload your APNs certificate (.p8 or .p12)
3. Enter your Bundle ID (e.g., `com.lunas.app`)
4. Click "Save & Continue"

**Skip other platforms for now**

#### 4. Get API Keys

1. Go to "Settings" > "Keys & IDs"
2. Copy these values:

```bash
# OneSignal App ID
ONESIGNAL_APP_ID=12345678-1234-1234-1234-123456789012

# REST API Key (for backend)
ONESIGNAL_REST_API_KEY=OS1234567890abcdef1234567890

# User Auth Key (for advanced features)
ONESIGNAL_USER_AUTH_KEY=YourUserAuthKeyHere
```

#### 5. Add to .env File

```bash
ONESIGNAL_APP_ID=your-app-id-here
ONESIGNAL_REST_API_KEY=your-rest-api-key
ONESIGNAL_USER_AUTH_KEY=your-user-auth-key
```

#### 6. Mobile App Integration (Flutter)

Add to `pubspec.yaml`:
```yaml
dependencies:
  onesignal_flutter: ^5.0.0
```

Initialize in `main.dart`:
```dart
import 'package:onesignal_flutter/onesignal_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize OneSignal
  OneSignal.initialize("YOUR_ONESIGNAL_APP_ID");
  
  // Request permission (iOS)
  OneSignal.Notifications.requestPermission(true);
  
  // Handle notification opened
  OneSignal.Notifications.addClickListener((event) {
    print('Notification clicked: ${event.notification.jsonRepresentation()}');
  });
  
  runApp(MyApp());
}
```

---

## 🔄 How They Work Together

### File Upload Flow

```
1. Mobile App → Captures Image
2. Mobile App → Sends to Backend API
3. Backend → Uploads to Supabase Storage
4. Supabase → Returns Public URL
5. Backend → Saves URL in MongoDB
6. Backend → Returns Response to App
```

### Push Notification Flow

```
1. Event Occurs (e.g., work order assigned)
2. Backend → Creates notification in MongoDB
3. Backend → Sends push via OneSignal API
4. OneSignal → Delivers to user's device
5. Mobile App → Shows notification
6. User → Clicks notification
7. App → Opens relevant screen
```

---

## 📊 Testing

### Test Supabase Storage

```bash
# Using curl
curl -X POST http://localhost:5000/api/v1/incidents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "road",
    "description": "Test incident",
    "location": {
      "coordinates": [120.3387, 16.0433],
      "address": {"barangay": "Poblacion Oeste"}
    },
    "images": [
      {
        "url": "https://your-project.supabase.co/storage/v1/object/public/lunas-storage/test.jpg",
        "key": "uploads/test.jpg"
      }
    ]
  }'
```

### Test OneSignal Notifications

```bash
# Send test notification via API
curl -X POST http://localhost:5000/api/v1/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "USER_ONESIGNAL_PLAYER_ID",
    "title": "Test Notification",
    "message": "This is a test from LUNAS backend"
  }'
```

Or test directly in OneSignal Dashboard:
1. Go to "Messages" > "New Push"
2. Enter message
3. Select "Test Users"
4. Send

---

## 💰 Pricing

### Supabase Free Tier

- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 2GB bandwidth
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

**Perfect for development and small deployments**

### OneSignal Free Tier

- ✅ Unlimited devices
- ✅ Unlimited notifications
- ✅ 10,000 web push subscribers
- ✅ Basic segmentation
- ✅ Analytics

**Free forever for mobile push!**

---

## 🔒 Security Best Practices

### Supabase

1. ✅ Never expose `service_role` key in frontend
2. ✅ Use Row-Level Security (RLS) policies
3. ✅ Make buckets public only if needed
4. ✅ Set file size limits
5. ✅ Validate file types on backend

### OneSignal

1. ✅ Never expose REST API Key in frontend
2. ✅ Use player IDs, not email for targeting
3. ✅ Implement rate limiting
4. ✅ Validate notification data
5. ✅ Use segments for targeting

---

## 🐛 Common Issues

### Supabase Issues

**Error: "new row violates row-level security policy"**
- Solution: Check your storage policies
- Make sure INSERT policy exists for authenticated users

**Error: "Bucket not found"**
- Solution: Create bucket named `lunas-storage`
- Or change `SUPABASE_STORAGE_BUCKET` in .env

**Files not accessible**
- Solution: Make sure bucket is public
- Or create SELECT policy for public access

### OneSignal Issues

**No notifications received**
- Solution: Check if app is installed and opened once
- Make sure player ID is registered
- Check notification permissions on device

**Invalid player ID**
- Solution: Player IDs are generated by OneSignal SDK
- They change if app is reinstalled
- Store latest player ID on login

**Notifications work in dev but not production**
- Solution: Check FCM server key is for production
- Make sure app bundle ID matches OneSignal config

---

## 📚 Resources

### Supabase
- Docs: https://supabase.com/docs
- Storage API: https://supabase.com/docs/guides/storage
- Dashboard: https://supabase.com/dashboard

### OneSignal
- Docs: https://documentation.onesignal.com/
- Flutter SDK: https://documentation.onesignal.com/docs/flutter-sdk-setup
- REST API: https://documentation.onesignal.com/reference/push-channel-properties

---

## ✅ Checklist

### Before Going Live

**Supabase:**
- [ ] Bucket policies configured correctly
- [ ] File size limits set
- [ ] Storage quota monitored
- [ ] Backup strategy in place

**OneSignal:**
- [ ] API keys secured
- [ ] iOS certificates uploaded
- [ ] Android FCM configured
- [ ] Test notifications sent successfully

**Backend:**
- [ ] Environment variables set
- [ ] Error handling tested
- [ ] Rate limiting enabled
- [ ] Monitoring configured

---

**Last Updated:** August 2026
