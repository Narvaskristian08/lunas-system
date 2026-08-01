# LUNAS System - Docker Setup Guide

Complete guide for running the entire LUNAS system with Docker.

---

## What Gets Deployed

When you run `docker-compose up`, the following services start:

1. **MongoDB** (Port 27017) - Database
2. **Backend API** (Port 5000) - Node.js/Express API
3. **Web Dashboard** (Port 3000) - Next.js web application
4. **Mongo Express** (Port 8081) - Database UI (optional, dev only)

---

## Prerequisites

### Install Docker Desktop

**macOS:**
1. Download: https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify:
```bash
docker --version
docker-compose --version
```

**Windows:**
1. Download: https://www.docker.com/products/docker-desktop
2. Install Docker Desktop
3. Enable WSL 2 if prompted
4. Restart your computer
5. Verify in PowerShell:
```bash
docker --version
docker-compose --version
```

**Linux (Ubuntu):**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Verify
docker --version
docker compose version
```

---

## Quick Start (5 Minutes)

### Step 1: Setup Environment Variables

```bash
# From the lunas-system root directory
cp .env.example .env
```

Edit `.env` and add your credentials:

```bash
# Required: Strong JWT secrets (32+ characters)
JWT_SECRET=your_very_long_secret_key_at_least_32_characters_here
JWT_REFRESH_SECRET=another_very_long_secret_key_at_least_32_characters

# Required: Supabase credentials
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=lunas-storage

# Required: OneSignal credentials
ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_REST_API_KEY=your_rest_api_key
ONESIGNAL_USER_AUTH_KEY=your_user_auth_key

# Optional: Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**Don't have Supabase/OneSignal accounts?**
- See `lunas_backend/SUPABASE_ONESIGNAL_GUIDE.md` for setup instructions

### Step 2: Start All Services

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop with Ctrl+C or:
docker-compose down
```

### Step 3: Verify Services

```bash
# Check service status
docker-compose ps

# Expected output:
NAME                COMMAND                SERVICE      STATUS        PORTS
lunas_backend       "npm start"            backend      Up (healthy)  0.0.0.0:5000->5000/tcp
lunas_mongodb       "docker-entrypoint…"   mongodb      Up (healthy)  0.0.0.0:27017->27017/tcp
lunas_web           "node server.js"       web          Up (healthy)  0.0.0.0:3000->3000/tcp
```

### Step 4: Access the Applications

- **Web Dashboard:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/health
- **API Documentation:** http://localhost:5000/api/v1

---

## Service Details

### Backend API (Port 5000)

**Purpose:** RESTful API for all operations

**Endpoints:**
- Health: `http://localhost:5000/health`
- API Base: `http://localhost:5000/api/v1`
- Auth: `http://localhost:5000/api/v1/auth`
- Incidents: `http://localhost:5000/api/v1/incidents`
- Work Orders: `http://localhost:5000/api/v1/work-orders`

**Environment:**
- Connects to MongoDB at `mongodb:27017`
- Uses Supabase for file storage
- Uses OneSignal for push notifications

### Web Dashboard (Port 3000)

**Purpose:** Administrative web interface

**Features:**
- Incident management
- Work order tracking
- User management
- Analytics dashboard
- Reports

**Environment:**
- Connects to Backend API at `http://backend:5000`
- Built with Next.js 16

### MongoDB (Port 27017)

**Purpose:** Primary database

**Credentials:**
- Username: `admin`
- Password: `admin123`
- Database: `lunas_db`

**Connection String:**
```
mongodb://admin:admin123@localhost:27017/lunas_db?authSource=admin
```

### Mongo Express (Port 8081) - Optional

**Purpose:** Web UI for MongoDB management

**To Start:**
```bash
docker-compose --profile dev up -d
```

**Access:**
- URL: http://localhost:8081
- Username: `admin`
- Password: `admin123`

---

## Common Commands

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d backend

# Start with database UI
docker-compose --profile dev up -d
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# View specific service
docker-compose logs backend
docker-compose logs web
docker-compose logs mongodb

# Last 100 lines
docker-compose logs --tail=100
```

### Stopping Services

```bash
# Stop all (keeps data)
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop and remove everything including data (WARNING!)
docker-compose down -v
```

### Restarting Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart web
```

### Rebuilding

```bash
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build backend
docker-compose build web

# Rebuild and start
docker-compose up -d --build

# Force rebuild (no cache)
docker-compose build --no-cache
```

---

## Development Workflow

### Making Code Changes

**Backend changes:**
```bash
# Edit backend code
# Then rebuild and restart
docker-compose build backend
docker-compose up -d backend
```

**Web changes:**
```bash
# Edit web code
# Then rebuild and restart
docker-compose build web
docker-compose up -d web
```

### Viewing Logs During Development

```bash
# Watch backend logs
docker-compose logs -f backend

# Watch web logs
docker-compose logs -f web

# Watch all logs
docker-compose logs -f
```

### Accessing Container Shell

```bash
# Backend container
docker exec -it lunas_backend sh

# Web container
docker exec -it lunas_web sh

# MongoDB container
docker exec -it lunas_mongodb mongosh -u admin -p admin123
```

---

## Data Management

### Backup MongoDB

```bash
# Create backup
docker exec lunas_mongodb mongodump \
  --uri="mongodb://admin:admin123@localhost:27017/lunas_db?authSource=admin" \
  --out=/data/backup

# Copy backup to host
docker cp lunas_mongodb:/data/backup ./mongodb_backup_$(date +%Y%m%d)
```

### Restore MongoDB

```bash
# Copy backup to container
docker cp ./mongodb_backup lunas_mongodb:/data/restore

# Restore
docker exec lunas_mongodb mongorestore \
  --uri="mongodb://admin:admin123@localhost:27017/lunas_db?authSource=admin" \
  /data/restore
```

### Reset Database

```bash
# WARNING: This deletes all data!
docker-compose down -v
docker-compose up -d
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check what's wrong
docker-compose ps
docker-compose logs

# Check specific service
docker-compose logs backend
docker-compose logs web
```

### Port Already in Use

**Error:** `Bind for 0.0.0.0:5000 failed: port is already allocated`

**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml:
services:
  backend:
    ports:
      - "5001:5000"  # Change host port
```

### Backend Can't Connect to MongoDB

**Check:**
1. MongoDB is running: `docker-compose ps mongodb`
2. Check MongoDB logs: `docker-compose logs mongodb`
3. Verify connection string in backend

**Fix:**
```bash
# Restart MongoDB
docker-compose restart mongodb

# Or restart everything
docker-compose restart
```

### Web Can't Connect to Backend

**Check:**
1. Backend is running: `docker-compose ps backend`
2. Backend is healthy: `curl http://localhost:5000/health`
3. Environment variables are set correctly

**Fix:**
```bash
# Restart services in order
docker-compose restart backend
docker-compose restart web
```

### Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Clean up unused images
docker image prune -a

# Clean up unused volumes
docker volume prune

# Clean up everything
docker system prune -a --volumes
```

### Container is Unhealthy

```bash
# Check health status
docker-compose ps

# View container logs
docker-compose logs <service-name>

# Restart unhealthy service
docker-compose restart <service-name>
```

---

## Production Deployment

### Checklist Before Production

- [ ] Change MongoDB admin password
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Update all API keys and secrets
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up reverse proxy (nginx/traefik)
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring and alerts
- [ ] Configure log aggregation
- [ ] Set up automated backups
- [ ] Limit exposed ports
- [ ] Use Docker secrets for sensitive data

### Using External MongoDB

Instead of the MongoDB container, use MongoDB Atlas:

```yaml
# In docker-compose.yml, remove mongodb service
# Update backend environment:
environment:
  MONGODB_URI: mongodb+srv://username:password@cluster.mongodb.net/lunas_db
```

### Using Docker Swarm or Kubernetes

For scaling and high availability, consider:
- Docker Swarm for simple orchestration
- Kubernetes for complex deployments
- Managed container services (ECS, GKE, AKS)

---

## Performance Optimization

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Image Optimization

```bash
# Check image sizes
docker images

# Use multi-stage builds (already implemented)
# Use alpine base images (already implemented)
# Remove dev dependencies in production
```

---

## Monitoring

### View Resource Usage

```bash
# Real-time stats
docker stats

# Specific services
docker stats lunas_backend lunas_web lunas_mongodb
```

### Health Checks

```bash
# Check all services health
docker-compose ps

# Test backend health
curl http://localhost:5000/health

# Test web health
curl http://localhost:3000
```

---

## Connecting Mobile App

The mobile app (Flutter) should connect to:

```dart
// In Flutter app configuration
const String apiBaseUrl = 'http://YOUR_IP_ADDRESS:5000/api/v1';

// For iOS simulator: http://localhost:5000/api/v1
// For Android emulator: http://10.0.2.2:5000/api/v1
// For physical device: http://YOUR_COMPUTER_IP:5000/api/v1
```

---

## Additional Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- MongoDB Docker: https://hub.docker.com/_/mongo
- Node.js Docker: https://hub.docker.com/_/node

---

## Getting Help

**Documentation:**
- Backend: `lunas_backend/README.md`
- Backend Docker: `lunas_backend/DOCKER_GUIDE.md`
- API Reference: `lunas_backend/API_ENDPOINTS.md`
- Supabase/OneSignal: `lunas_backend/SUPABASE_ONESIGNAL_GUIDE.md`

**Common Issues:**
- Check service logs: `docker-compose logs <service>`
- Verify environment variables in `.env`
- Ensure ports are not in use
- Check Docker Desktop is running

---

**LUNAS System** - Building smarter infrastructure maintenance with Docker

Last Updated: August 2026
