# LUNAS Backend - Quick Start Guide

Get up and running in 5 minutes with Docker!

---

## Step 1: Install Docker

### macOS
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify:
```bash
docker --version
```

### Windows
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install Docker Desktop
3. Restart your computer
4. Verify in PowerShell:
```bash
docker --version
```

### Linux (Ubuntu)
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start Docker
sudo systemctl start docker

# Add your user to docker group (optional)
sudo usermod -aG docker $USER

# Verify
docker --version
```

---

## Step 2: Setup Environment Variables

1. Copy the environment template:
```bash
cd lunas_backend
cp .env.docker .env
```

2. Open `.env` and add your credentials:
```bash
# REQUIRED: Change these secrets!
JWT_SECRET=your_32_character_minimum_secret_here
JWT_REFRESH_SECRET=your_32_character_minimum_secret_here

# REQUIRED: Add your Supabase credentials
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=lunas-storage

# REQUIRED: Add your OneSignal credentials
ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_REST_API_KEY=your_rest_api_key
ONESIGNAL_USER_AUTH_KEY=your_user_auth_key

# OPTIONAL: Add your frontend URLs
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
```

**Don't have Supabase/OneSignal accounts?**
- Supabase: https://supabase.com (see `SUPABASE_ONESIGNAL_GUIDE.md`)
- OneSignal: https://onesignal.com (see `SUPABASE_ONESIGNAL_GUIDE.md`)

---

## Step 3: Start the Application

```bash
# Start all services (backend + MongoDB)
docker-compose up -d

# View logs
docker-compose logs -f

# To stop: Ctrl+C or run
docker-compose down
```

---

## Step 4: Verify It's Working

### Check Services Status
```bash
docker-compose ps
```

Expected output:
```
NAME                COMMAND                  SERVICE      STATUS
lunas_backend       "npm start"              backend      Up (healthy)
lunas_mongodb       "docker-entrypoint.s…"   mongodb      Up (healthy)
```

### Test the API
```bash
# Health check
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "OK",
#   "timestamp": "2026-08-01T10:30:00.000Z",
#   "uptime": 123.45,
#   "environment": "production"
# }
```

### Access API
- **Backend API:** http://localhost:5000
- **API Docs:** http://localhost:5000/api/v1
- **Health Check:** http://localhost:5000/health

---

## Step 5: Create Your First User

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

You should receive a response with a JWT token!

---

## Common Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View running containers
docker-compose ps

# Rebuild after code changes
docker-compose up -d --build

# Access MongoDB UI (optional)
docker-compose --profile dev up -d
# Then open: http://localhost:8081
# Login: admin / admin123
```

---

## What's Running?

### Backend API (Port 5000)
- Main API application
- Connects to MongoDB
- Handles all requests

### MongoDB (Port 27017)
- Database for storing data
- Credentials: admin / admin123
- Database name: lunas_db

### Mongo Express (Port 8081) - Optional
- Web UI for MongoDB
- Start with: `docker-compose --profile dev up -d`
- Access: http://localhost:8081
- Login: admin / admin123

---

## Troubleshooting

### Port 5000 Already in Use
```bash
# Kill process using port 5000
lsof -i :5000
kill -9 <PID>

# Or change port in docker-compose.yml:
ports:
  - "5001:5000"
```

### Can't Connect to MongoDB
```bash
# Check MongoDB is running
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Backend Won't Start
```bash
# View backend logs
docker-compose logs backend

# Common issues:
# - Missing .env file
# - Invalid MongoDB connection
# - Port already in use
```

### Need to Reset Everything
```bash
# Stop and remove everything (WARNING: Deletes database!)
docker-compose down -v

# Then start fresh
docker-compose up -d
```

---

## Next Steps

1. **Read API Documentation:** See `API_ENDPOINTS.md`
2. **Setup Supabase & OneSignal:** See `SUPABASE_ONESIGNAL_GUIDE.md`
3. **Learn Docker Commands:** See `DOCKER_GUIDE.md`
4. **Connect Mobile App:** Configure Flutter app to use `http://localhost:5000`
5. **Connect Web App:** Configure Next.js to use `http://localhost:5000`

---

## Production Deployment

For production deployment:

1. **Secure your secrets** - Use strong JWT secrets
2. **Update CORS** - Set to your actual frontend domain
3. **Use managed MongoDB** - MongoDB Atlas recommended
4. **Enable HTTPS** - Use reverse proxy (nginx/traefik)
5. **Monitor logs** - Set up log aggregation
6. **Backup database** - Regular MongoDB backups

See `DOCKER_GUIDE.md` for complete production deployment guide.

---

## Getting Help

- **Full Setup Guide:** `SETUP_GUIDE.md`
- **Docker Guide:** `DOCKER_GUIDE.md`
- **API Reference:** `API_ENDPOINTS.md`
- **Supabase/OneSignal:** `SUPABASE_ONESIGNAL_GUIDE.md`

---

**That's it! You're now running LUNAS Backend with Docker!**

For questions or issues, contact the LUNAS development team.

Last Updated: August 2026
