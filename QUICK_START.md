# LUNAS System - Quick Start with Docker

Get the entire LUNAS system running in 5 minutes!

---

## What You'll Get

Running `docker-compose up` will start:
- **Backend API** (Port 5000) - Node.js/Express
- **Web Dashboard** (Port 3000) - Next.js
- **MongoDB** (Port 27017) - Database
- **Mongo Express** (Port 8081) - Database UI (optional)

---

## Step 1: Install Docker

### macOS
Download and install: https://www.docker.com/products/docker-desktop

### Windows  
Download and install: https://www.docker.com/products/docker-desktop

### Linux (Ubuntu)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

Verify installation:
```bash
docker --version
docker-compose --version
```

---

## Step 2: Configure Environment

1. Copy environment template:
```bash
cd lunas-system
cp .env.example .env
```

2. Edit `.env` with your credentials:
```bash
nano .env
```

Required values:
```bash
# Strong secrets (32+ characters)
JWT_SECRET=your_very_long_secret_key_here
JWT_REFRESH_SECRET=another_very_long_secret_key_here

# Supabase (get from https://supabase.com)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=lunas-storage

# OneSignal (get from https://onesignal.com)
ONESIGNAL_APP_ID=your_app_id
ONESIGNAL_REST_API_KEY=your_rest_api_key
ONESIGNAL_USER_AUTH_KEY=your_user_auth_key
```

**Need help setting up Supabase/OneSignal?**
See `lunas_backend/SUPABASE_ONESIGNAL_GUIDE.md`

---

## Step 3: Start Everything

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop with Ctrl+C, or:
docker-compose down
```

---

## Step 4: Verify It's Working

Check services status:
```bash
docker-compose ps
```

Expected output:
```
NAME                STATUS        PORTS
lunas_backend       Up (healthy)  0.0.0.0:5000->5000/tcp
lunas_mongodb       Up (healthy)  0.0.0.0:27017->27017/tcp
lunas_web           Up (healthy)  0.0.0.0:3000->3000/tcp
```

Test the services:
```bash
# Backend API health check
curl http://localhost:5000/health

# Should return: {"status":"OK",...}
```

---

## Step 5: Access the Applications

Open in your browser:

- **Web Dashboard:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/v1
- **API Health:** http://localhost:5000/health

Optional database UI:
```bash
# Start with database management UI
docker-compose --profile dev up -d

# Access at: http://localhost:8081
# Login: admin / admin123
```

---

## Step 6: Create First User

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

You should receive a JWT token in the response!

---

## Common Commands

```bash
# Start services
docker-compose up -d

# View logs (all services)
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f web

# Stop services (keeps data)
docker-compose down

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build

# Remove everything including data (WARNING!)
docker-compose down -v
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :5000  # or :3000, :27017

# Kill the process
kill -9 <PID>
```

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend

# Restart everything
docker-compose restart
```

### Need to Reset

```bash
# Stop and remove everything (WARNING: deletes data!)
docker-compose down -v

# Start fresh
docker-compose up -d
```

---

## What's Next?

1. **Explore the API**
   - Full documentation: `lunas_backend/API_ENDPOINTS.md`
   - Test endpoints with Postman or curl

2. **Connect Mobile App**
   - Configure Flutter app to use `http://YOUR_IP:5000/api/v1`
   - See mobile app documentation

3. **Production Deployment**
   - See `DOCKER_SETUP.md` for production guide
   - Update secrets and environment variables
   - Set up HTTPS and reverse proxy

4. **Learn More**
   - Backend docs: `lunas_backend/README.md`
   - Complete Docker guide: `DOCKER_SETUP.md`
   - Supabase/OneSignal setup: `lunas_backend/SUPABASE_ONESIGNAL_GUIDE.md`

---

## Need Help?

- **Full Setup Guide:** `DOCKER_SETUP.md`
- **Backend API Docs:** `lunas_backend/README.md`
- **API Reference:** `lunas_backend/API_ENDPOINTS.md`

---

**That's it! You now have the complete LUNAS system running!**

LUNAS Development Team  
PHINMA University of Pangasinan

Last Updated: August 2026
