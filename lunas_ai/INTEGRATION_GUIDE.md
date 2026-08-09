# LUNAS AI Integration Guide 🔌

Complete guide for integrating the AI service with the LUNAS backend.

---

## 📋 Overview

The LUNAS AI service is a standalone Python microservice that provides infrastructure damage detection. It communicates with the Node.js backend via REST API.

**Architecture:**
```
┌──────────────┐    HTTP REST    ┌──────────────┐    YOLO Models    ┌──────────────┐
│   Node.js    │ ──────────────> │   Python     │ ───────────────> │   Detection   │
│   Backend    │ <────────────── │   AI Service │ <─────────────── │   Results     │
└──────────────┘    JSON         └──────────────┘                  └──────────────┘
```

---

## 🚀 Quick Start

### 1. Start AI Service

```bash
# Terminal 1: Start AI service
cd lunas_ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 2. Configure Backend

Add to `lunas_backend/.env`:

```bash
AI_SERVICE_URL=http://localhost:5001
AI_SERVICE_TIMEOUT=30000
AI_SERVICE_ENABLED=true
```

### 3. Start Backend

```bash
# Terminal 2: Start backend
cd lunas_backend
npm install
npm run dev
```

### 4. Test Integration

```bash
# Terminal 3: Test
curl http://localhost:5000/api/v1/incidents

# Upload test incident with image
curl -X POST http://localhost:5000/api/v1/incidents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "category=road" \
  -F "description=Pothole on main street" \
  -F "image=@test_pothole.jpg" \
  -F "latitude=16.0433" \
  -F "longitude=120.3397"
```

---

## 🔗 Backend Integration

### Using the AI Service

The `aiService.js` module is already created in `lunas_backend/src/services/aiService.js`.

**Example usage in Incident Controller:**

```javascript
// src/controllers/incidentController.js
const { analyzeIncidentImage } = require('../services/aiService');

exports.createIncident = async (req, res) => {
  try {
    // ... incident creation logic ...
    
    // If image uploaded, run AI analysis
    if (req.file) {
      const aiAnalysis = await analyzeIncidentImage(
        req.file.buffer,
        req.body.category
      );
      
      // Add AI results to incident
      incidentData.aiAnalysis = {
        detected: aiAnalysis.detected,
        confidence: aiAnalysis.confidence,
        suggestion: aiAnalysis.suggestion,
        detections: aiAnalysis.detections,
        processedAt: new Date()
      };
      
      logger.info(`AI Analysis: ${aiAnalysis.detected ? 'Damage detected' : 'No damage'} (${aiAnalysis.confidence})`);
    }
    
    // Save incident
    const incident = await Incident.create(incidentData);
    
    res.status(201).json({
      success: true,
      data: incident,
      aiAnalysis: incidentData.aiAnalysis
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### Available Functions

```javascript
const aiService = require('./services/aiService');

// 1. Check if AI service is available
const health = await aiService.checkHealth();
console.log(health);
// { available: true, device: 'mps', models_loaded: 1 }

// 2. Analyze incident image (comprehensive)
const result = await aiService.analyzeIncidentImage(imageBuffer, 'road');
console.log(result);
// {
//   detected: true,
//   confidence: 0.876,
//   suggestion: 'Road/Pavement - Pothole',
//   requiresManualReview: false,
//   detections: { road_damage: 1, cracks: 0 }
// }

// 3. Detect road damage specifically
const roadDamage = await aiService.detectRoadDamage(imageBuffer);

// 4. Detect cracks
const cracks = await aiService.detectCracks(imageBuffer);

// 5. Check privacy concerns
const privacy = await aiService.detectPrivacyConcerns(imageBuffer);

// 6. Get AI service status
const status = await aiService.getStatus();
```

---

## 🔧 Configuration

### Backend Environment Variables

```bash
# AI Service Configuration
AI_SERVICE_URL=http://localhost:5001      # AI service URL
AI_SERVICE_TIMEOUT=30000                  # Request timeout (ms)
AI_SERVICE_ENABLED=true                   # Enable/disable AI
```

### AI Service Environment Variables

```bash
# Service Configuration
FLASK_ENV=production
FLASK_PORT=5001

# Detection Configuration
CONFIDENCE_THRESHOLD=0.25    # Minimum confidence (0-1)
IOU_THRESHOLD=0.45          # IoU threshold for NMS
MAX_DETECTIONS=50           # Max detections per image

# Performance
DEVICE=cpu                  # cpu, cuda, or mps
ENABLE_HALF_PRECISION=False # FP16 (GPU only)

# Image Processing
MAX_IMAGE_SIZE=1920        # Max dimension
IMAGE_QUALITY=85           # JPEG quality
```

---

## 📊 Response Formats

### AI Analysis Response

```json
{
  "detected": true,
  "confidence": 0.876,
  "suggestion": "Road/Pavement - Pothole",
  "requiresManualReview": false,
  "aiEnabled": true,
  "detections": {
    "road_damage": 1,
    "cracks": 0,
    "privacy_concerns": false
  },
  "processing_time": 0.523
}
```

### Road Damage Detection Response

```json
{
  "success": true,
  "model": "road_damage",
  "detections": [
    {
      "class": "pothole",
      "confidence": 0.876,
      "bbox": {
        "x1": 245.5,
        "y1": 120.3,
        "x2": 380.2,
        "y2": 210.8,
        "width": 134.7,
        "height": 90.5
      },
      "severity": "moderate",
      "area_percentage": 3.25
    }
  ],
  "summary": "Detected: 1 pothole(s)",
  "total_detections": 1,
  "processing_time": 0.523
}
```

---

## 🐳 Docker Integration

### Running with Docker Compose

The AI service is already configured in `docker-compose.yml`:

```bash
# Start all services (including AI)
docker-compose up -d

# Start specific services
docker-compose up -d mongodb backend lunas-ai

# Check logs
docker logs -f lunas_ai

# Stop AI service
docker-compose stop lunas-ai

# Restart AI service
docker-compose restart lunas-ai
```

### Service Communication

Inside Docker network:
- Backend URL: `http://backend:5000`
- AI Service URL: `http://lunas-ai:5001`
- MongoDB URL: `mongodb://mongodb:27017`

**Backend uses:** `AI_SERVICE_URL=http://lunas-ai:5001`

---

## 🧪 Testing Integration

### Test Script

Create `test_integration.js` in backend:

```javascript
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testAIIntegration() {
  console.log('Testing AI Integration...\n');
  
  // 1. Test AI service health
  console.log('1. Checking AI service health...');
  try {
    const health = await axios.get('http://localhost:5001/api/v1/health');
    console.log('✅ AI service healthy:', health.data);
  } catch (error) {
    console.log('❌ AI service unavailable:', error.message);
    return;
  }
  
  // 2. Test detection
  console.log('\n2. Testing road damage detection...');
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream('test_pothole.jpg'));
    
    const response = await axios.post(
      'http://localhost:5001/api/v1/detect/road-damage',
      form,
      { headers: form.getHeaders() }
    );
    
    console.log('✅ Detection successful:');
    console.log('   Detections:', response.data.total_detections);
    console.log('   Summary:', response.data.summary);
    console.log('   Time:', response.data.processing_time + 's');
  } catch (error) {
    console.log('❌ Detection failed:', error.message);
  }
  
  // 3. Test backend integration
  console.log('\n3. Testing backend integration...');
  try {
    const aiService = require('./src/services/aiService');
    const imageBuffer = fs.readFileSync('test_pothole.jpg');
    
    const result = await aiService.analyzeIncidentImage(imageBuffer, 'road');
    
    console.log('✅ Backend integration working:');
    console.log('   Detected:', result.detected);
    console.log('   Confidence:', result.confidence);
    console.log('   Suggestion:', result.suggestion);
  } catch (error) {
    console.log('❌ Backend integration failed:', error.message);
  }
  
  console.log('\n✅ Integration test complete!');
}

testAIIntegration();
```

Run:
```bash
node test_integration.js
```

---

## 🔍 Monitoring

### Check AI Service Status

```bash
# From backend
curl http://localhost:5000/api/v1/ai/status

# Direct to AI service
curl http://localhost:5001/api/v1/health
```

### View Logs

```bash
# AI service logs
tail -f lunas_ai/logs/lunas_ai.log

# Backend logs
tail -f lunas_backend/logs/combined.log

# Docker logs
docker logs -f lunas_ai
docker logs -f lunas_backend
```

---

## ⚠️ Error Handling

The AI service is designed to fail gracefully. If unavailable:

```javascript
// Backend automatically handles failures
const result = await aiService.analyzeIncidentImage(buffer, category);

if (!result.aiEnabled) {
  console.log('AI service disabled or unavailable');
  // Continue with manual classification
}

if (result.requiresManualReview) {
  console.log('AI detected but requires manual review');
  // Flag for barangay staff review
}
```

**Fallback behavior:**
1. ✅ Incident creation continues even if AI fails
2. ✅ AI results are optional, not required
3. ✅ Manual review is always an option
4. ✅ Errors are logged but don't block workflow

---

## 🚀 Performance Tuning

### AI Service Performance

**Fast mode (lower accuracy):**
```bash
# Use nano model
MODEL_ROAD_DAMAGE=yolov8n.pt
CONFIDENCE_THRESHOLD=0.3
```

**Balanced mode (recommended):**
```bash
# Use small model
MODEL_ROAD_DAMAGE=yolov8s.pt
CONFIDENCE_THRESHOLD=0.25
```

**Accurate mode (slower):**
```bash
# Use medium model
MODEL_ROAD_DAMAGE=yolov8m.pt
CONFIDENCE_THRESHOLD=0.2
```

### Backend Timeout

Adjust based on AI service speed:
```bash
AI_SERVICE_TIMEOUT=30000  # 30 seconds (default)
AI_SERVICE_TIMEOUT=60000  # 60 seconds (if slow)
```

---

## 📝 Best Practices

### 1. Always Check AI Availability

```javascript
const health = await aiService.checkHealth();
if (!health.available) {
  logger.warn('AI service unavailable, using manual classification');
}
```

### 2. Handle Timeouts

```javascript
try {
  const result = await aiService.analyzeIncidentImage(buffer, category);
} catch (error) {
  if (error.code === 'ETIMEDOUT') {
    logger.warn('AI service timeout, continuing without AI');
  }
}
```

### 3. Log AI Results

```javascript
logger.info('AI Analysis', {
  incidentId: incident._id,
  detected: aiAnalysis.detected,
  confidence: aiAnalysis.confidence,
  processingTime: aiAnalysis.processing_time
});
```

### 4. Use AI Suggestions

```javascript
if (aiAnalysis.suggestion && aiAnalysis.confidence > 0.7) {
  // Auto-categorize based on AI suggestion
  incident.suggestedCategory = aiAnalysis.suggestion;
  incident.aiConfidence = aiAnalysis.confidence;
}
```

---

## 🐛 Troubleshooting

### AI Service Not Responding

```bash
# Check if running
curl http://localhost:5001/api/v1/health

# Check Docker
docker ps | grep lunas_ai
docker logs lunas_ai

# Restart service
docker-compose restart lunas-ai
```

### Backend Can't Connect

```bash
# Check network (Docker)
docker network ls
docker network inspect lunas_network

# Check environment variable
echo $AI_SERVICE_URL

# Test from backend container
docker exec -it lunas_backend curl http://lunas-ai:5001/api/v1/health
```

### Slow Performance

```bash
# Check device
curl http://localhost:5001/api/v1/health | jq '.device'

# Use smaller model
# Edit lunas_ai/.env:
DEVICE=cpu
MODEL_ROAD_DAMAGE=yolov8n.pt
```

---

## 📚 Additional Resources

- **AI Service README:** `lunas_ai/README.md`
- **API Documentation:** `lunas_ai/README.md#api-endpoints`
- **Training Guide:** `lunas_ai/README.md#fine-tuning-on-rdd2022`
- **Backend API:** `lunas_backend/API_ENDPOINTS.md`

---

**Integration complete! 🎉**

The AI service is now fully integrated with the LUNAS backend.
