# LUNAS System - Complete Deployment Guide 🚀

Production deployment guide for the entire LUNAS system.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Local Development Setup](#local-development-setup)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Configuration Guide](#configuration-guide)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Minimum Requirements
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 20GB
- **OS:** Linux, macOS, or Windows with WSL2

### Recommended for Production
- **CPU:** 4+ cores
- **RAM:** 8GB+
- **Storage:** 50GB+ SSD
- **OS:** Ubuntu 22.04 LTS or similar

### Software Requirements
- Docker 20.10+ & Docker Compose 2.0+
- OR Node.js 18+, Python 3.10+, MongoDB 6.0+

---

## ✅ Pre-Deployment Checklist

### 1. External Services Setup

**Supabase (Storage):**
- [ ] Create Supabase project
- [ ] Create storage bucket named `lunas-storage`
- [ ] Set bucket to public
- [ ] Copy project URL and keys

**OneSignal (Notifications):**
- [ ] Create OneSignal app
- [ ] Configure for mobile push notifications
- [ ] Copy App ID and REST API Key

**MongoDB:**
- [ ] Local: Install MongoDB 6.0+
- [ ] Cloud: Create MongoDB Atlas cluster

**Google Maps (Optional):**
- [ ] Create Google Cloud project
- [ ] Enable Maps JavaScript API
- [ ] Create API key

### 2. Repository Setup

```bash
# Clone repository
git clone https://github.com/your-username/lunas-system.git
cd lunas-system

# Create .env file
cp .env.example .env
```

### 3. Environment Variables

Edit `.env` and `lunas_backend/.env`:

```bash
# Critical: Change these!
JWT_SECRET=your_very_secure_random_string_here
JWT_REFRESH_SECRET=another_secure_random_string
MONGODB_URI=your_mongodb_connection_string

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OneSignal
ONESIGNAL_APP_ID=your_app_id
ONESIGNAL_REST_API_KEY=your_rest_api_key
```

---

## 💻 Local Development Setup

### Option 1: Manual Setup (No Docker)

#### Step 1: MongoDB
```bash
# macOS
brew install mongodb-community@6.0
brew services start mongodb-community

# Linux
sudo apt-get install mongodb-org
sudo systemctl start mongod

# Verify
mongosh --eval "db.version()"
```

#### Step 2: Backend
```bash
cd lunas_backend

# Install dependencies
npm install

# Configure
cp .env.example .env
# Edit .env with your credentials

# Start
npm run dev

# Backend runs on http://localhost:5000
```

#### Step 3: AI Service
```bash
cd lunas_ai

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure
cp .env.example .env

# Start
python app.py

# AI service runs on http://localhost:5001
```

#### Step 4: Verify
```bash
# Test backend
curl http://localhost:5000/health

# Test AI service
curl http://localhost:5001/api/v1/health

# Run integration tests
cd lunas_ai
python test_api.py
```

### Option 2: Docker Setup (Recommended)

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Services will be running on:
# - Backend: http://localhost:5000
# - AI: http://localhost:5001
# - MongoDB: localhost:27017
```

---

## 🐳 Docker Deployment

### Development Mode

```bash
# Start with database UI
docker-compose --profile dev up -d

# Access services:
# - Backend: http://localhost:5000
# - AI: http://localhost:5001
# - Mongo Express: http://localhost:8081
```

### Production Mode

```bash
# Set production environment
export NODE_ENV=production
export FLASK_ENV=production

# Start services
docker-compose up -d

# Scale backend (if needed)
docker-compose up -d --scale backend=3
```

### Container Management

```bash
# View logs
docker logs -f lunas_backend
docker logs -f lunas_ai

# Restart specific service
docker-compose restart backend
docker-compose restart lunas-ai

# Update after code changes
docker-compose build
docker-compose up -d

# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🌐 Production Deployment

### Deploy to VPS (DigitalOcean, AWS EC2, etc.)

#### 1. Server Setup

```bash
# SSH into server
ssh user@your-server-ip

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

#### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-username/lunas-system.git
cd lunas-system

# Configure environment
cp .env.example .env
nano .env  # Edit with production credentials

# Configure backend
cd lunas_backend
cp .env.example .env
nano .env  # Edit with production credentials
cd ..
```

#### 3. Deploy

```bash
# Build and start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

#### 4. Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt-get install nginx

# Configure
sudo nano /etc/nginx/sites-available/lunas
```

Add configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name ai.yourdomain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/lunas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d api.yourdomain.com -d ai.yourdomain.com

# Auto-renewal is configured automatically
```

---

## ⚙️ Configuration Guide

### Backend Configuration

**Key Settings in `lunas_backend/.env`:**

```bash
# Environment
NODE_ENV=production  # production or development

# Security
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRE=7d

# Database
MONGODB_URI=mongodb://username:password@host:port/lunas_db

# Storage
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_STORAGE_BUCKET=lunas-storage

# AI Service
AI_SERVICE_URL=http://lunas-ai:5001  # Docker network
AI_SERVICE_ENABLED=true

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
```

### AI Service Configuration

**Key Settings in `lunas_ai/.env`:**

```bash
# Environment
FLASK_ENV=production

# Device (auto-detect or force)
DEVICE=cpu  # cpu, cuda, or mps

# Detection
CONFIDENCE_THRESHOLD=0.25
IOU_THRESHOLD=0.45
MAX_DETECTIONS=50

# Performance
ENABLE_HALF_PRECISION=False  # True for GPU
```

### Docker Compose Configuration

Edit `docker-compose.yml` for:
- Port mappings
- Resource limits
- Environment variables
- Volume mounts

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# AI service health
curl http://localhost:5001/api/v1/health

# Database connection
mongosh mongodb://localhost:27017/lunas_db --eval "db.stats()"
```

### View Logs

```bash
# Docker logs
docker logs -f lunas_backend
docker logs -f lunas_ai
docker logs -f lunas_mongodb

# Application logs (if mounted)
tail -f lunas_backend/logs/combined.log
tail -f lunas_ai/logs/lunas_ai.log
```

### Database Backups

```bash
# Backup MongoDB
docker exec lunas_mongodb mongodump --out /backup

# Copy backup from container
docker cp lunas_mongodb:/backup ./mongodb_backup_$(date +%Y%m%d)

# Restore
docker exec -i lunas_mongodb mongorestore /backup
```

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Or update specific service
docker-compose build backend
docker-compose up -d backend
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up
docker system prune -a
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: Backend won't start**
```bash
# Check logs
docker logs lunas_backend

# Common issues:
# 1. MongoDB not accessible
docker-compose up -d mongodb
docker exec lunas_mongodb mongosh --eval "db.version()"

# 2. Port 5000 already in use
sudo lsof -i :5000
# Change PORT in .env

# 3. Missing environment variables
docker exec lunas_backend env | grep JWT_SECRET
```

**Problem: AI service not responding**
```bash
# Check AI service logs
docker logs lunas_ai

# Test directly
curl http://localhost:5001/api/v1/health

# Check backend connection
docker exec lunas_backend curl http://lunas-ai:5001/api/v1/health
```

### AI Service Issues

**Problem: Models not loading**
```bash
# Check disk space
df -h

# Models auto-download on first use
# Check logs for download progress
docker logs -f lunas_ai

# Manual model download
docker exec -it lunas_ai python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

**Problem: Slow inference**
```bash
# Check device
curl http://localhost:5001/api/v1/health | jq '.device'

# Should show "mps" for M1, "cuda" for GPU
# If showing "cpu", check DEVICE setting

# Use smaller model
# Edit lunas_ai/.env:
MODEL_ROAD_DAMAGE=yolov8n.pt
```

### Database Issues

**Problem: MongoDB connection failed**
```bash
# Check MongoDB status
docker ps | grep mongodb

# Check logs
docker logs lunas_mongodb

# Test connection
mongosh mongodb://admin:admin123@localhost:27017/lunas_db
```

### Network Issues

**Problem: Services can't communicate**
```bash
# Check Docker network
docker network ls
docker network inspect lunas_network

# Verify all services on same network
docker-compose ps

# Test connectivity
docker exec lunas_backend ping lunas-ai
docker exec lunas_backend curl http://lunas-ai:5001/api/v1/health
```

---

## 📋 Production Checklist

Before going live:

### Security
- [ ] Change all default passwords
- [ ] Use strong JWT secrets (64+ characters random)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall rules
- [ ] Disable MongoDB Express in production
- [ ] Set up rate limiting
- [ ] Configure CORS properly

### Performance
- [ ] Set NODE_ENV=production
- [ ] Enable caching where appropriate
- [ ] Configure resource limits in docker-compose.yml
- [ ] Set up CDN for static assets (if applicable)

### Monitoring
- [ ] Set up logging aggregation
- [ ] Configure health check monitoring
- [ ] Set up alerts for service failures
- [ ] Monitor disk usage
- [ ] Monitor database performance

### Backup
- [ ] Configure automated database backups
- [ ] Test restore procedure
- [ ] Back up environment files
- [ ] Document recovery procedures

### Documentation
- [ ] Update API documentation
- [ ] Document deployment procedures
- [ ] Create runbook for common issues
- [ ] Document configuration changes

---

## 🎉 Deployment Complete!

Your LUNAS system is now deployed and running!

**Quick verification:**
```bash
# 1. Check all services
docker-compose ps

# 2. Test backend
curl http://your-domain.com/health

# 3. Test AI service
curl http://your-domain.com:5001/api/v1/health

# 4. Check logs
docker-compose logs --tail=50
```

**Access points:**
- Backend API: `https://api.yourdomain.com`
- AI Service: `https://ai.yourdomain.com`
- Web Dashboard: `https://yourdomain.com`

**Next steps:**
1. Create initial admin user
2. Configure categories and SLA rules
3. Test incident reporting workflow
4. Set up monitoring dashboards
5. Train team on system usage

---

**Need help?** Check the documentation:
- Backend: `lunas_backend/README.md`
- AI Service: `lunas_ai/README.md`
- Integration: `lunas_ai/INTEGRATION_GUIDE.md`

**Support:** Contact the LUNAS Development Team
