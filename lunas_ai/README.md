# LUNAS AI Service 🤖

AI/ML Microservice for Infrastructure Damage Detection using YOLOv8 and YOLOv11

**Version:** 1.0.0  
**Author:** LUNAS Development Team  
**ML Engineer:** AI/ML Engineering

---

## 📋 Overview

LUNAS AI Service is a production-ready Python microservice that provides real-time infrastructure damage detection capabilities for the LUNAS urban maintenance system. It uses state-of-the-art YOLO models for detecting potholes, cracks, manholes, sewer covers, and privacy-sensitive objects.

### Key Features

✅ **Multi-Model Support** - YOLOv8, YOLOv11, custom fine-tuned models  
✅ **Real-time Detection** - Sub-second inference on CPU, even faster on GPU/M1  
✅ **Category-routed Detection** - The backend selects only the model assigned to the submitted category
✅ **Privacy Protection** - Automatic detection of people and vehicles  
✅ **Production Ready** - Docker support, logging, metrics, error handling  
✅ **Easy Integration** - RESTful API, JSON responses  
✅ **Extensible** - Support for custom models and fine-tuning  

The `electrical` category is damage-only. Its model is trained from explicit
fault/damage bounding boxes and returns advisory labels, confidence values, and
normalized image regions. It does not detect intact poles/components and it
cannot make severity, priority, routing, status, or closure decisions. Missing
or failed category models remain manual review.

---

## 🏗️ Architecture

```
lunas_ai/
├── app.py                  # Main Flask application
├── config.yaml             # Model and service configuration
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker image configuration
│
├── src/
│   ├── api/               # REST API endpoints
│   │   └── routes.py      # API route definitions
│   │
│   ├── models/            # Model management
│   │   └── model_manager.py  # YOLO model loading and caching
│   │
│   ├── services/          # Business logic
│   │   └── detection_service.py  # Detection algorithms
│   │
│   └── utils/             # Utilities
│       ├── config.py      # Configuration management
│       └── logger.py      # Logging setup
│
├── models/                # Model weights (*.pt files)
│   └── cache/            # Downloaded model cache
│
├── datasets/              # Training datasets (for fine-tuning)
│   └── rdd2022/          # RDD2022 dataset (to be added)
│
├── logs/                  # Application logs
└── tests/                 # Unit tests
```

---

## 🚀 Quick Start

### Local Development (No Docker)

```bash
# 1. Navigate to directory
cd lunas_ai

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your settings

# 5. Run the service
python app.py

# Server will start on http://localhost:5001
```

### Docker Deployment

```bash
# Build image
docker build -t lunas-ai:latest .

# Run container
docker run -d \
  --name lunas-ai \
  -p 5001:5001 \
  -v $(pwd)/models:/app/models \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  lunas-ai:latest

# Check logs
docker logs -f lunas-ai
```

---

## 📡 API Endpoints

### Base URL
```
http://localhost:5001/api/v1
```

### 1. Health Check
```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "lunas-ai",
  "version": "1.0.0",
  "device": "mps",
  "models_loaded": 1,
  "loaded_models": ["road_damage"]
}
```

### 2. List Available Models
```http
GET /api/v1/models
```

**Response:**
```json
{
  "success": true,
  "models": {
    "road_damage": {
      "name": "road_damage",
      "display_name": "YOLOv8n Road Damage Detection",
      "type": "detection",
      "classes": ["pothole", "alligator_crack", "longitudinal_crack", "transverse_crack", "manhole", "sewer_cover"],
      "loaded": true,
      "device": "mps",
      "confidence_threshold": 0.25
    }
  },
  "total": 3
}
```

### 3. Detect Road Damage
```http
POST /api/v1/detect/road-damage
Content-Type: multipart/form-data

Parameters:
- image: File (required) - Image file (JPG, PNG, WEBP)
- confidence: Float (optional) - Confidence threshold (default: 0.25)
```

**Response:**
```json
{
  "success": true,
  "model": "road_damage",
  "detections": [
    {
      "class": "pothole",
      "class_id": 0,
      "confidence": 0.876,
      "bbox": {
        "x1": 245.5,
        "y1": 120.3,
        "x2": 380.2,
        "y2": 210.8,
        "width": 134.7,
        "height": 90.5
      },
      "area": 12190.35,
      "severity": "moderate",
      "area_percentage": 3.25
    }
  ],
  "summary": "Detected: 1 pothole(s)",
  "total_detections": 1,
  "processing_time": 0.523
}
```

### 4. Detect Cracks (Segmentation)
```http
POST /api/v1/detect/cracks
Content-Type: multipart/form-data

Parameters:
- image: File (required)
- confidence: Float (optional, default: 0.30)
```

### 5. Detect Privacy Concerns
```http
POST /api/v1/detect/privacy
Content-Type: multipart/form-data

Parameters:
- image: File (required)
- confidence: Float (optional, default: 0.40)
```

**Response:**
```json
{
  "success": true,
  "has_privacy_concerns": true,
  "detections": [
    {
      "class": "person",
      "confidence": 0.912,
      "bbox": {...}
    }
  ],
  "summary": "Found 1 privacy-sensitive object(s)",
  "total_detections": 1,
  "processing_time": 0.412
}
```

### 6. Comprehensive Detection
```http
POST /api/v1/detect/comprehensive
Content-Type: multipart/form-data

Parameters:
- image: File (required)
- category: String (required) - "road_pavement", "drainage_sewage", etc.
```

**Response:**
```json
{
  "category": "electrical",
  "model": "electrical_damage",
  "damage_only": true,
  "analysis_status": "completed",
  "model_available": true,
  "detections": [{
    "class": "conductor_insulation_damage",
    "confidence": 0.876,
    "bbox": {"x1": 0.21, "y1": 0.18, "x2": 0.64, "y2": 0.51}
  }],
  "advisory_only": true,
  "requires_manual_review": true,
  "processing_time": 1.234
}
```

The web category is the routing authority. Mobile and web submit images to the
backend; neither contains model files or calls the AI service directly. AI
results are display guidance only and never replace the official decision.

### 7. Category QA Endpoints

For quick testing, the backend also exposes fixed category endpoints. They
accept an image only; the backend selects the assigned model and never accepts
a `.pt` path from the caller:

```bash
curl -X POST http://localhost:5001/api/v1/detect/drainage \
  -F "image=@/path/to/drainage-photo.jpg"

curl -X POST http://localhost:5001/api/v1/detect/electrical \
  -F "image=@/path/to/electrical-photo.jpg"
```

Both return `analysis_status`, `model_available`, labels, confidence values,
normalized `bbox` coordinates, `advisory_only: true`, and
`requires_manual_review: true`. Unsupported categories remain manual review.

---

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:5001/api/v1/health

# Detect road damage
curl -X POST \
  -F "image=@/path/to/pothole.jpg" \
  -F "confidence=0.25" \
  http://localhost:5001/api/v1/detect/road-damage

# Comprehensive detection
curl -X POST \
  -F "image=@/path/to/road.jpg" \
  -F "category=road_pavement" \
  http://localhost:5001/api/v1/detect/comprehensive
```

### Using Python

```python
import requests

# Detect road damage
url = "http://localhost:5001/api/v1/detect/road-damage"
files = {"image": open("pothole.jpg", "rb")}
data = {"confidence": 0.25}

response = requests.post(url, files=files, data=data)
result = response.json()

print(f"Detections: {result['total_detections']}")
print(f"Summary: {result['summary']}")
print(f"Time: {result['processing_time']}s")
```

---

## 🎯 Model Configuration

Models are configured in `config.yaml`:

```yaml
models:
  road_damage:
    name: "YOLOv8n Road Damage Detection"
    path: "models/yolov8n-road-damage.pt"
    type: "detection"
    classes:
      - pothole
      - alligator_crack
      - longitudinal_crack
      - transverse_crack
      - manhole
      - sewer_cover
    confidence_threshold: 0.25
```

### Adding Custom Models

1. Place your `.pt` model file in `models/` directory
2. Add configuration to `config.yaml`
3. Update detection service to use the new model
4. Restart the service

---

## 🔧 Fine-Tuning on RDD2022

### Prepare Dataset

```bash
# 1. Download RDD2022 dataset
# Place in datasets/rdd2022/

# Structure:
# datasets/rdd2022/
# ├── images/
# │   ├── train/
# │   ├── val/
# │   └── test/
# └── labels/
#     ├── train/
#     ├── val/
#     └── test/
```

### Training Script

Create `train.py`:

```python
from ultralytics import YOLO

# Load pre-trained model
model = YOLO('yolov8n.pt')

# Train on RDD2022
results = model.train(
    data='datasets/rdd2022/data.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    name='rdd2022_yolov8n',
    patience=50,
    save_period=10,
    device='mps'  # or 'cuda' or 'cpu'
)

# Validate
metrics = model.val()

# Save trained model
model.save('models/yolov8n-road-damage-rdd2022.pt')
```

Run training:
```bash
python train.py
```

---

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Service
FLASK_ENV=production
FLASK_PORT=5001
DEBUG=False

# Detection
CONFIDENCE_THRESHOLD=0.25
IOU_THRESHOLD=0.45

# Device
DEVICE=cpu  # cpu, cuda, mps (auto-detect if not set)

# Paths
MODEL_CACHE_DIR=./models/cache
LOG_FILE=logs/lunas_ai.log
```

### config.yaml

Edit `config.yaml` to customize:
- Model paths and thresholds
- Category mappings
- Severity estimation
- Training parameters

---

## 📊 Performance

### Inference Speed (Apple M1)

| Model | Input Size | Device | Speed |
|-------|-----------|--------|-------|
| YOLOv8n | 640x640 | M1 (MPS) | ~0.5s |
| YOLOv8s | 640x640 | M1 (MPS) | ~0.8s |
| YOLOv8n | 640x640 | CPU | ~1.2s |

### Accuracy (RDD2022 Dataset)

| Model | mAP@0.5 | Precision | Recall |
|-------|---------|-----------|--------|
| YOLOv8n (pre-trained) | 91.1% | 90% | 81% |
| YOLOv8s (fine-tuned) | 93.5% | 92% | 86% |

---

## 🐛 Troubleshooting

### Model Not Loading

```bash
# Check if model file exists
ls -la models/

# Download base models manually
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### Out of Memory

```python
# Reduce batch size in config.yaml
batch_size: 1

# Disable half precision
ENABLE_HALF_PRECISION=False
```

### Slow Inference

```bash
# Check device
curl http://localhost:5001/api/v1/health

# Force GPU if available
DEVICE=cuda  # or mps for M1

# Use smaller model
MODEL_ROAD_DAMAGE=yolov8n.pt  # instead of yolov8s.pt
```

---

## 📝 Logging

Logs are written to:
- **Console:** INFO level and above
- **File:** `logs/lunas_ai.log` (DEBUG level, rotates at 10MB)

```bash
# View logs
tail -f logs/lunas_ai.log

# Docker logs
docker logs -f lunas-ai
```

---

## 🧪 Development

### Running Tests

```bash
pytest tests/ -v
```

### Code Formatting

```bash
# Format code
black src/ tests/ app.py

# Lint
flake8 src/ tests/ app.py
```

---

## 📦 Production Deployment

### Using Gunicorn (Recommended)

```bash
gunicorn \
  --bind 0.0.0.0:5001 \
  --workers 2 \
  --threads 4 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile - \
  "app:create_app()"
```

### Using Docker Compose

Add to `docker-compose.yml`:

```yaml
services:
  lunas-ai:
    build: ./lunas_ai
    ports:
      - "5001:5001"
    volumes:
      - ./lunas_ai/models:/app/models
      - ./lunas_ai/logs:/app/logs
    environment:
      - FLASK_ENV=production
      - DEVICE=cpu
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 🤝 Integration with LUNAS Backend

### Node.js Integration

```javascript
// lunas_backend/src/services/aiService.js
const axios = require('axios');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

exports.detectRoadDamage = async (imageBuffer) => {
  const form = new FormData();
  form.append('image', imageBuffer, 'incident.jpg');
  
  const response = await axios.post(
    `${AI_SERVICE_URL}/api/v1/detect/comprehensive`,
    form,
    {
      headers: form.getHeaders(),
      params: { category: 'road_pavement' }
    }
  );
  
  return response.data;
};
```

---

## 📄 License

This project is part of the LUNAS system, developed as a Capstone Project for PHINMA University of Pangasinan.

---

## 👨‍💻 Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs in `logs/lunas_ai.log`
3. Contact the LUNAS Development Team

---

**Built with ❤️ by LUNAS ML Engineering Team**
