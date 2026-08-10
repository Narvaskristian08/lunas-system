# 🧪 LUNAS AI - Quick Testing Guide

**For Team Members: Fast setup and testing in 10 minutes**

---

## ⚡ Super Quick Start (3 steps)

```bash
# 1. Setup
cd lunas_ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Run
python app.py

# 3. Test
curl http://localhost:5001/api/v1/health
```

✅ If you see `"status": "healthy"`, you're ready!

---

## 🎯 Test All Endpoints (Copy & Paste)

### 1. Health Check
```bash
curl http://localhost:5001/api/v1/health
```

**Expected:** `{"status": "healthy"}`

---

### 2. List Models
```bash
curl http://localhost:5001/api/v1/models
```

**Expected:** List of available YOLO models

---

### 3. Detect Road Damage (File Upload)

**Using a test image:**
```bash
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@/path/to/your/road-image.jpg" \
  -F "confidence=0.5"
```

**Using sample images from the web:**
```bash
# Download a sample pothole image
curl -o test_pothole.jpg https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=640

# Test detection
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@test_pothole.jpg" \
  -F "confidence=0.5"
```

---

### 4. Detect Only Cracks
```bash
curl -X POST http://localhost:5001/api/v1/detect/cracks \
  -F "image=@/path/to/cracked-road.jpg" \
  -F "confidence=0.4"
```

---

### 5. Privacy Protection (Blur Faces/Plates)
```bash
curl -X POST http://localhost:5001/api/v1/detect/privacy \
  -F "image=@/path/to/street-photo.jpg" \
  -F "blur_faces=true" \
  -F "blur_plates=true"
```

---

### 6. Comprehensive Analysis
```bash
curl -X POST http://localhost:5001/api/v1/detect/comprehensive \
  -F "image=@/path/to/road.jpg" \
  -F "confidence=0.5" \
  -F "blur_privacy=true"
```

---

## 🌐 Testing with Postman

### Import This Collection:

**1. Create New Request**
- Name: `LUNAS AI - Road Damage Detection`
- Method: `POST`
- URL: `http://localhost:5001/api/v1/detect/road-damage`

**2. Body Tab**
- Select: `form-data`
- Add Key: `image` | Type: `File` | Value: [Select your image]
- Add Key: `confidence` | Type: `Text` | Value: `0.5`

**3. Send & Check Response**

---

## 🐍 Testing with Python

```python
import requests

# Test health
response = requests.get("http://localhost:5001/api/v1/health")
print("Health:", response.json())

# Test detection
url = "http://localhost:5001/api/v1/detect/road-damage"
files = {"image": open("road_image.jpg", "rb")}
data = {"confidence": 0.5}

response = requests.post(url, files=files, data=data)
result = response.json()

print(f"Found {result['total_damages']} damages")
for detection in result['detections']:
    print(f"  - {detection['class']}: {detection['confidence']*100:.1f}%")
```

---

## 🧪 Test Expected Results

### Good Detection Response ✅
```json
{
  "success": true,
  "detections": [
    {
      "class": "pothole",
      "confidence": 0.89,
      "bbox": {"x": 320, "y": 240, "width": 150, "height": 120},
      "severity": "high"
    }
  ],
  "total_damages": 1,
  "inference_time": "0.82s"
}
```

### No Detection Response ✅
```json
{
  "success": true,
  "detections": [],
  "total_damages": 0,
  "inference_time": "0.75s",
  "message": "No road damage detected"
}
```

### Error Response ❌
```json
{
  "success": false,
  "error": "Invalid image format"
}
```

---

## 🔍 Check Service Status

### Is it running?
```bash
# Check process
ps aux | grep "python app.py"

# Check port
lsof -i :5001

# Check logs
tail -f logs/lunas_ai.log
```

### Stop service
```bash
# Find process ID
ps aux | grep "python app.py"

# Kill it
kill -9 <PID>
```

---

## 🐛 Common Issues & Fixes

### ❌ "Connection refused"
**Problem:** Service not running

**Fix:**
```bash
cd lunas_ai
source venv/bin/activate
python app.py
```

---

### ❌ "Module not found"
**Problem:** Dependencies not installed

**Fix:**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

---

### ❌ "Port 5001 already in use"
**Problem:** Another service using the port

**Fix:**
```bash
# Kill existing process
lsof -i :5001
kill -9 <PID>

# Or change port in config.yaml to 5002
```

---

### ❌ Low detection accuracy
**Problem:** Using pre-trained general model

**Fix:**
- Lower confidence: `"confidence": 0.3`
- Or train with RDD2022 dataset (see README.md)

---

### ❌ Slow inference (>3 seconds)
**Problem:** Running on CPU instead of GPU

**Check:**
```bash
curl http://localhost:5001/api/v1/health | grep device
```

**Expected:** `"device": "mps"` (M1 Mac) or `"cuda"` (NVIDIA)
**If:** `"device": "cpu"` → Much slower but still works

---

## 📊 Performance Checklist

Test these to verify everything works:

- [ ] Health check responds in <0.1s
- [ ] Model list loads in <0.5s
- [ ] Detection completes in <2s
- [ ] Multiple requests work (no crashes)
- [ ] Error handling works (bad images)
- [ ] Logs are being written

---

## 🧑‍💻 Integration Test (with Node.js backend)

### 1. Start both services:

**Terminal 1 - AI Service:**
```bash
cd lunas_ai
source venv/bin/activate
python app.py
```

**Terminal 2 - Backend:**
```bash
cd lunas_backend
npm run dev
```

### 2. Test from backend:

```bash
# Backend should call AI service automatically
curl -X POST http://localhost:3000/api/incidents/detect \
  -F "image=@road.jpg"
```

---

## 🎨 Sample Test Images

Use these free image sources for testing:

1. **Potholes:**
   - Unsplash: https://unsplash.com/s/photos/pothole
   - Download any pothole image

2. **Cracks:**
   - Search: "road crack" on Unsplash
   - Use pavement/asphalt images

3. **Clean Roads:**
   - Search: "highway road" for negative tests
   - Should return 0 detections

---

## 📸 Creating Test Images

```bash
# Create test folder
mkdir -p test_images

# Download samples
cd test_images
curl -o pothole1.jpg "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=640"
curl -o road_clean.jpg "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=640"

# Run batch test
cd ..
for img in test_images/*.jpg; do
  echo "Testing: $img"
  curl -X POST http://localhost:5001/api/v1/detect/road-damage \
    -F "image=@$img" \
    -F "confidence=0.5" | jq '.total_damages'
done
```

---

## 🚀 Advanced Testing

### Load Test (Multiple Requests)
```bash
# Install Apache Bench
brew install apache2  # macOS

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 -p test.jpg -T multipart/form-data \
  http://localhost:5001/api/v1/detect/road-damage
```

### Monitor Resource Usage
```bash
# CPU & Memory
top -pid $(pgrep -f "python app.py")

# Or use htop
htop -p $(pgrep -f "python app.py")
```

---

## 📋 Test Report Template

After testing, report results:

```markdown
## Test Results - [Your Name] - [Date]

### Environment
- OS: macOS Sonoma 14.3
- Python: 3.11.5
- Device: Apple M1

### Tests Passed ✅
- [x] Health check
- [x] Model loading
- [x] Road damage detection
- [x] Error handling

### Tests Failed ❌
- [ ] Privacy blur (faces not detected)

### Performance
- Average inference time: 0.85s
- Accuracy on test set: 87%
- RAM usage: 1.6GB

### Issues Found
1. Slow first request (model loading)
2. Low confidence on small cracks

### Recommendations
- Add model warming on startup
- Lower confidence threshold to 0.4 for cracks
```

---

## 🆘 Getting Help

**Stuck? Try these in order:**

1. **Check logs:**
   ```bash
   tail -50 logs/lunas_ai.log
   ```

2. **Restart service:**
   ```bash
   # Stop (Ctrl+C)
   # Start again
   python app.py
   ```

3. **Reinstall:**
   ```bash
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Ask team:**
   - Screenshot the error
   - Share logs
   - Mention your OS/Python version

---

## ✅ Quick Verification (30 seconds)

```bash
# Run all checks
curl http://localhost:5001/api/v1/health && echo "✅ Health OK" || echo "❌ Service down"
curl http://localhost:5001/api/v1/models | grep yolov8s && echo "✅ Models loaded" || echo "❌ Models missing"
```

---

## 🎯 Success Criteria

Your testing is complete when:

1. ✅ All 6 endpoints respond
2. ✅ Detection works on sample images
3. ✅ Inference time <2 seconds
4. ✅ No crashes after 10+ requests
5. ✅ Integration with backend works

---

**Happy Testing! 🚀**

*Questions? Check the main README.md or ask the team*
