# CAPTCHA Toggle Guide

## 📂 CAPTCHA File Location

**Folder:** `lunas_backend/src/services/`

**File:** `captchaService.js`

**Full Path:** `/Users/deb/Desktop/lunas-system/lunas_backend/src/services/captchaService.js`

---

## 🔄 How to Enable/Disable CAPTCHA

### **Method 1: Environment Variable (Recommended)**

Edit your `.env` file:

```bash
# To DISABLE CAPTCHA (default for development)
CAPTCHA_ENABLED=false

# To ENABLE CAPTCHA (production)
CAPTCHA_ENABLED=true
```

**That's it!** Just change `false` to `true` and restart the server.

---

### **Method 2: Hardcoded Toggle (Alternative)**

If you prefer to hardcode the toggle in the code, edit `captchaService.js`:

**Location:** `lunas_backend/src/services/captchaService.js`

**Line 20-24:**

```javascript
/**
 * Check if CAPTCHA is enabled
 * Set CAPTCHA_ENABLED=false in .env to disable CAPTCHA
 * Set CAPTCHA_ENABLED=true in .env to enable CAPTCHA
 * Default: false (disabled)
 */
const isCaptchaEnabled = () => {
  const enabled = process.env.CAPTCHA_ENABLED === 'true';
  logger.debug(`CAPTCHA enabled: ${enabled}`);
  return enabled;
};
```

**To Hardcode (not recommended):**

```javascript
const isCaptchaEnabled = () => {
  return false;  // Always disabled
  // return true;  // Always enabled
};
```

---

## 📋 What Happens When CAPTCHA is Disabled?

When `CAPTCHA_ENABLED=false`:

1. **Login requests skip CAPTCHA verification**
   - Web login does NOT require `captchaToken`
   - Backend returns `{ success: true, unavailable: false }`
   - No call to Cloudflare Turnstile API

2. **Login controller behavior:**
   ```javascript
   // In authController.js
   if (platform === 'web') {
     // With CAPTCHA_ENABLED=false, this block is skipped
     // No captchaToken required
   }
   ```

3. **Audit logs:**
   - No `login_captcha_failed` events
   - No `login_captcha_unavailable` events

---

## 🧪 Testing CAPTCHA Toggle

### **Test CAPTCHA Disabled:**

1. Set `CAPTCHA_ENABLED=false` in `.env`
2. Restart backend: `npm run dev`
3. Try login without `captchaToken`:
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "platform": "web"
     }'
   ```
4. **Result:** Login succeeds without CAPTCHA token

### **Test CAPTCHA Enabled:**

1. Set `CAPTCHA_ENABLED=true` in `.env`
2. Set `TURNSTILE_SECRET_KEY` to a valid key (or dummy key for testing)
3. Restart backend: `npm run dev`
4. Try login without `captchaToken`:
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "platform": "web"
     }'
   ```
5. **Result:** Login fails with `"Complete the CAPTCHA challenge."`

---

## 📁 Related Files

| File | Purpose | Line Reference |
|------|---------|----------------|
| `lunas_backend/src/services/captchaService.js` | Main CAPTCHA verification logic | Line 20-24 (toggle function) |
| `lunas_backend/.env` | Environment configuration | Add `CAPTCHA_ENABLED=false` |
| `lunas_backend/.env.example` | Environment template | Line 24 (CAPTCHA_ENABLED) |
| `lunas_backend/src/controllers/authController.js` | Login controller | Line 379-407 (CAPTCHA check) |
| `lunas_backend/src/middleware/validation.js` | Input validation | Line 46-47 (captchaToken validation) |

---

## 🚀 Quick Start

### **Disable CAPTCHA (Development):**

```bash
# 1. Edit .env
echo "CAPTCHA_ENABLED=false" >> lunas_backend/.env

# 2. Restart backend
cd lunas_backend
npm run dev
```

### **Enable CAPTCHA (Production):**

```bash
# 1. Edit .env
echo "CAPTCHA_ENABLED=true" >> lunas_backend/.env

# 2. Set Turnstile secret (get from Cloudflare dashboard)
echo "TURNSTILE_SECRET_KEY=your_production_secret_key" >> lunas_backend/.env

# 3. Restart backend
cd lunas_backend
npm run dev
```

---

## ⚠️ Security Notes

**Development:**
- ✅ Keep `CAPTCHA_ENABLED=false` for easier testing
- ✅ Use dummy Turnstile keys

**Production:**
- ✅ Set `CAPTCHA_ENABLED=true`
- ✅ Use real Turnstile production keys
- ✅ Configure allowed hostnames

---

## 📊 CAPTCHA Flow Diagram

```
User Login Request (Web)
    ↓
Check CAPTCHA_ENABLED
    ↓
    ├─ false → Skip CAPTCHA verification → Proceed to login
    │
    └─ true  → Check captchaToken present?
               ↓
               ├─ No  → Return error: "Complete the CAPTCHA challenge."
               │
               └─ Yes → Verify with Cloudflare Turnstile
                        ↓
                        ├─ Success → Proceed to login
                        │
                        └─ Failed → Return error: "CAPTCHA verification failed."
```

---

## 🔧 Troubleshooting

### **CAPTCHA still required even with CAPTCHA_ENABLED=false?**

1. Check `.env` file is in the correct location: `lunas_backend/.env`
2. Restart the server after changing `.env`
3. Check the log: Should see `CAPTCHA is disabled - skipping verification`

### **How to verify CAPTCHA is disabled?**

Check backend logs when logging in:

```bash
# Should see this log message:
[INFO] CAPTCHA is disabled - skipping verification
```

### **How to verify CAPTCHA is enabled?**

Check backend logs when logging in:

```bash
# Should see this log message:
[DEBUG] CAPTCHA enabled: true
```

---

## 📝 Summary

**Location:** `lunas_backend/src/services/captchaService.js`

**Toggle Function:** Line 20-24

**Environment Variable:** `CAPTCHA_ENABLED=false` (disabled) or `CAPTCHA_ENABLED=true` (enabled)

**Default:** Disabled (`false`)

**Change:** Just edit `.env` and restart server!

---

**Last Updated:** August 1, 2026
