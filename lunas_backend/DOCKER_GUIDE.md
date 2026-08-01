# Docker Deployment Guide

Complete guide for running LUNAS Backend with Docker and Docker Compose.

---

## Prerequisites

### Install Docker

**macOS:**
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify installation:
```bash
docker --version
docker-compose --version
```

**Ubuntu/Debian:**
```bash
# Update package index
sudo apt-get update

# Install dependencies
sudo apt-get install ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

**Windows:**
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install Docker Desktop
3. Enable WSL 2 if prompted
4. Restart your computer
5. Verify installation in PowerShell:
```powershell
docker --version
docker-compose --version
```

---

## Quick Start

### 1. Configure Environment Variables

Copy the Docker environment template:

```bash
cp .env.docker .env
```

Edit `.env` and add your credentials:

```bash
# JWT Secrets - Generate strong random strings
JWT_SECRET=your_32_character_minimum_secret_key_here
JWT_REFRESH_SECRET=another_32_character_secret_key_here

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=lunas-storage

# OneSignal
ONESIGNAL_APP_ID=your_app_id
ONESIGNAL_REST_API_KEY=your_rest_api_key
ONESIGNAL_USER_AUTH_KEY=your_user_auth_key

# CORS (adjust for your frontend URL)
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
```

### 2. Start All Services

```bash
# Start backend + MongoDB
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Verify Services are Running

```bash
# Check running containers
docker-compose ps

# Expected output:
# NAME                COMMAND                  SERVICE      STATUS
# lunas_backend       "npm start"              backend      Up (healthy)
# lunas_mongodb       "docker-entrypoint.s…"   mongodb      Up (healthy)
```

### 4. Test the API

```bash
# Health check
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "OK",
#   "timestamp": "2026-08-01T...",
#   "uptime": 123.45,
#   "environment": "production"
# }
```

---

## Docker Compose Services

### Backend API (Port 5000)
- **Container:** lunas_backend
- **Image:** Built from Dockerfile
- **URL:** http://localhost:5000
- **Health Check:** Every 30 seconds

### MongoDB (Port 27017)
- **Container:** lunas_mongodb
- **Image:** mongo:6.0
- **URL:** mongodb://localhost:27017
- **Credentials:**
  - Username: `admin`
  - Password: `admin123`
  - Database: `lunas_db`

### Mongo Express (Port 8081) - Optional
- **Container:** lunas_mongo_express
- **Image:** mongo-express:latest
- **URL:** http://localhost:8081
- **Credentials:**
  - Username: `admin`
  - Password: `admin123`

To start with Mongo Express (database UI):
```bash
docker-compose --profile dev up -d
```

---

## Common Commands

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start with live logs
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

# View specific service logs
docker-compose logs backend
docker-compose logs mongodb

# Last 100 lines
docker-compose logs --tail=100
```

### Stopping Services

```bash
# Stop all services (keeps data)
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop and remove everything including volumes (deletes data!)
docker-compose down -v
```

### Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuilding

```bash
# Rebuild backend image
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build

# Force rebuild (no cache)
docker-compose build --no-cache backend
```

---

## Accessing Services

### Backend API

```bash
# Health check
curl http://localhost:5000/health

# API base URL
http://localhost:5000/api/v1

# Example: Register user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "09123456789",
    "password": "Test@123"
  }'
```

### MongoDB

```bash
# Connect with mongosh (if installed)
mongosh mongodb://admin:admin123@localhost:27017/lunas_db?authSource=admin

# Or exec into container
docker exec -it lunas_mongodb mongosh -u admin -p admin123 --authenticationDatabase admin
```

### Mongo Express (Database UI)

1. Start with dev profile: `docker-compose --profile dev up -d`
2. Open browser: http://localhost:8081
3. Login: admin / admin123
4. Select `lunas_db` database

---

## Volume Management

### View Volumes

```bash
# List all volumes
docker volume ls

# Inspect volume
docker volume inspect lunas_backend_mongodb_data
```

### Backup MongoDB Data

```bash
# Create backup
docker exec lunas_mongodb mongodump \
  --uri="mongodb://admin:admin123@localhost:27017/lunas_db?authSource=admin" \
  --out=/data/backup

# Copy backup to host
docker cp lunas_mongodb:/data/backup ./mongodb_backup
```

### Restore MongoDB Data

```bash
# Copy backup to container
docker cp ./mongodb_backup lunas_mongodb:/data/restore

# Restore
docker exec lunas_mongodb mongorestore \
  --uri="mongodb://admin:admin123@localhost:27017/lunas_db?authSource=admin" \
  /data/restore
```

### Delete Volumes (Warning: Data Loss!)

```bash
# Stop and remove containers + volumes
docker-compose down -v

# Or manually delete specific volume
docker volume rm lunas_backend_mongodb_data
```

---

## Production Deployment

### Using Docker Compose in Production

1. **Update environment variables:**

```bash
# Create production .env
cp .env.docker .env.production

# Edit .env.production with production values
nano .env.production
```

2. **Use production compose file:**

```bash
# Create docker-compose.prod.yml with SSL, reverse proxy, etc.
```

3. **Deploy:**

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Security Checklist

- [ ] Change MongoDB admin password
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Use environment-specific .env files
- [ ] Don't commit .env to version control
- [ ] Use Docker secrets for sensitive data
- [ ] Set up reverse proxy (nginx/traefik)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Limit exposed ports
- [ ] Regular security updates

---

## Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker-compose logs backend

# Check container status
docker-compose ps

# Inspect container
docker inspect lunas_backend
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "5001:5000"
```

### MongoDB Connection Issues

```bash
# Check MongoDB is healthy
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify connection string
# Should be: mongodb://admin:admin123@mongodb:27017/lunas_db?authSource=admin
```

### Out of Disk Space

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused containers
docker container prune

# See disk usage
docker system df
```

### Backend API Not Responding

```bash
# Check if backend is healthy
docker-compose ps backend

# View backend logs
docker-compose logs -f backend

# Restart backend
docker-compose restart backend

# Check environment variables
docker exec lunas_backend env | grep MONGODB
```

---

## Development with Docker

### Hot Reload (Development Mode)

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    environment:
      NODE_ENV: development
    volumes:
      - ./src:/app/src
      - ./package.json:/app/package.json
    command: npm run dev
```

Run:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Access Container Shell

```bash
# Backend container
docker exec -it lunas_backend sh

# MongoDB container
docker exec -it lunas_mongodb sh
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t lunas-backend .
      
      - name: Run tests
        run: docker run lunas-backend npm test
```

---

## Useful Docker Commands

```bash
# View container resource usage
docker stats

# Clean up everything
docker system prune -a --volumes

# Export image
docker save lunas-backend > lunas-backend.tar

# Import image
docker load < lunas-backend.tar

# View image layers
docker history lunas-backend
```

---

## Performance Optimization

### Image Size

```bash
# Check image size
docker images lunas-backend

# Use multi-stage build for smaller images
# Use alpine base images
# Remove dev dependencies in production
```

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
          memory: 256M
```

---

## Additional Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- MongoDB Docker: https://hub.docker.com/_/mongo
- Node.js Docker: https://hub.docker.com/_/node

---

**Last Updated:** August 2026

For questions or issues, contact the LUNAS development team.
