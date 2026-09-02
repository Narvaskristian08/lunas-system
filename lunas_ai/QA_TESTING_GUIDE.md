# 🧪 LUNAS AI - QA Testing Guide

Complete guide for Quality Assurance testing of the AI infrastructure damage detection service.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [What Was Trained](#what-was-trained)
3. [Testing Interface](#testing-interface)
4. [Test Scenarios](#test-scenarios)
5. [Expected Results](#expected-results)
6. [API Testing](#api-testing)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Option 1: Automated Startup (Recommended)

```bash
cd /Users/deb/Desktop/lunas-system/lunas_ai
chmod +x start_qa_testing.sh
./start_qa_testing.sh
```

This will:
- ✅ Activate virtual environment
- ✅ Check trained model
- ✅ Start API server
- ✅ Open QA test GUI in browser

### Option 2: Manual Startup

```bash
# 1. Navigate to AI directory
cd /Users/deb/Desktop/lunas-system/lunas_ai

# 2. Activate virtual environment
source venv/bin/activate

# 3. Start API server
python app.py

# 4. Open GUI in another terminal
open qa_test_gui.html
```

---

## 🎯 What Was Trained

### Model Details

| Property | Value |
|----------|-------|
| **Model** | YOLOv8n (Nano - smallest, fastest) |
| **Dataset** | RDD2022 (Road Damage Dataset 2022) |
| **Training Data** | 30% of dataset (~11,500 images) |
| **Epochs** | 50 |
| **Device** | CPU (Apple M1) |
| **Training Time** | ~4-5 days |
| **Model Size** | 6.0 MB |
| **Model File** | `models/yolov8n-rdd2022-best.pt` |

### Damage Classes Detected

1. **D00** - Longitudinal Crack
2. **D10** - Transverse Crack
3. **D20** - Alligator/Fatigue Crack
4. **D40** - Pothole

### Training Results

- **Final box_loss:** ~1.56
- **Final cls_loss:** ~1.67
- **Final dfl_loss:** ~1.54
- **Confidence Threshold:** 0.25 (25%)
- **IOU Threshold:** 0.45

---

## 🖥️ Testing Interface

### GUI Features

1. **System Status**
   - API Server connection status
   - Model loading status
   - Trained model information

2. **Upload Options**
   - Drag & drop images
   - File picker
   - Sample test images

3. **Results Display**
   - Original vs Detected comparison
   - Detection metrics
   - Confidence scores
   - Processing time
   - Severity assessment

4. **Detection Details**
   - Number of damages found
   - Average confidence
   - Class breakdown
   - Bounding box coordinates

---

## 🧪 Test Scenarios

### Test Case 1: Pothole Detection

**Objective:** Verify pothole detection accuracy

**Steps:**
1. Upload image with visible potholes
2. Click "Run Detection"
3. Verify detections

**Expected Result:**
- ✅ Potholes detected with >25% confidence
- ✅ Bounding boxes drawn correctly
- ✅ Class labeled as "D40" or "pothole"

---

### Test Case 2: Crack Detection

**Objective:** Verify crack detection (all types)

**Steps:**
1. Upload image with road cracks
2. Run detection
3. Check results

**Expected Result:**
- ✅ Cracks detected (D00, D10, or D20)
- ✅ Proper classification by crack type
- ✅ Confidence >25%

---

### Test Case 3: Multiple Damages

**Objective:** Test detection of multiple damage types

**Steps:**
1. Upload image with multiple damage types
2. Run detection
3. Verify all damages detected

**Expected Result:**
- ✅ All visible damages detected
- ✅ Correct classification for each
- ✅ No duplicate detections (IOU filtering working)

---

### Test Case 4: Clean Road (Negative Test)

**Objective:** Verify no false positives on good roads

**Steps:**
1. Upload image of clean, undamaged road
2. Run detection

**Expected Result:**
- ✅ 0 detections OR
- ✅ Very low confidence detections (<30%)
- ✅ No false positives

---

### Test Case 5: Edge Cases

**Objective:** Test model robustness

**Test Images:**
- Wet roads
- Night images
- Shadows
- Different angles
- Blurry images

**Expected Result:**
- ✅ Handles various conditions
- ✅ Reasonable detection rates
- ✅ No crashes/errors

---

### Test Case 6: Performance

**Objective:** Verify processing speed

**Steps:**
1. Upload test image
2. Record processing time

**Expected Result:**
- ✅ Processing time: 1-5 seconds (CPU)
- ✅ < 1 second (GPU if available)
- ✅ Consistent performance

---

## ✅ Expected Results

### Good Detection

```json
{
  "success": true,
  "detections": [
    {
      "class": "D40",
      "confidence": 0.78,
      "bbox": [120, 340, 180, 400]
    }
  ],
  "processing_time_ms": 1234,
  "severity": "moderate",
  "suggested_category": "Road/Pavement"
}
```

### No Detection

```json
{
  "success": true,
  "detections": [],
  "processing_time_ms": 856,
  "severity": "none",
  "message": "No damages detected"
}
```

---

## 🔌 API Testing

### Health Check

```bash
curl http://localhost:5001/api/v1/health
```

**Expected:**
```json
{
  "status": "healthy",
  "model": "yolov8n-rdd2022-best.pt",
  "model_loaded": true,
  "device": "cpu"
}
```

### Detection Endpoint

```bash
curl -X POST http://localhost:5001/api/v1/detect \
  -F "image=@test_image.jpg" \
  -F "confidence=0.25" \
  -F "save_output=true"
```

### Get Categories

```bash
curl http://localhost:5001/api/v1/categories
```

---

## 📊 Performance Benchmarks

### CPU (Apple M1)

| Metric | Target | Actual |
|--------|--------|--------|
| Cold Start | <5s | ~3s |
| Detection Time | <3s | 1-2s |
| Memory Usage | <500MB | ~300MB |
| Accuracy (mAP@50) | >50% | ~60-70% (estimated) |

### Expected Confidence Ranges

| Damage Type | Good | Acceptable | Poor |
|-------------|------|------------|------|
| Clear Potholes | >70% | 40-70% | <40% |
| Clear Cracks | >60% | 30-60% | <30% |
| Small Damages | >40% | 25-40% | <25% |
| Ambiguous | >30% | 20-30% | <20% |

---

## 🐛 Troubleshooting

### Issue: API Server Won't Start

**Error:** `Cannot connect to API server`

**Solution:**
```bash
# Check if port 5001 is in use
lsof -i :5001

# Kill existing process
kill -9 <PID>

# Restart server
python app.py
```

---

### Issue: Model Not Found

**Error:** `Model file not found: yolov8n-rdd2022-best.pt`

**Solution:**
```bash
# Check if trained model exists
ls -lh models/yolov8n-rdd2022-best.pt

# If not, copy from training output
cp /Users/deb/Desktop/lunas-system/runs/detect/runs/train/rdd2022_yolov8n_small/weights/best.pt \
   models/yolov8n-rdd2022-best.pt
```

---

### Issue: Low Detection Accuracy

**Symptoms:**
- Few or no detections
- Very low confidence scores
- Wrong classifications

**Possible Causes:**
1. **Confidence threshold too high** - Lower to 0.20
2. **Image quality poor** - Use better quality images
3. **Model not fully trained** - 50 epochs on 30% data is moderate
4. **Dataset mismatch** - RDD2022 is optimized for certain road types

**Solutions:**
```bash
# Test with lower confidence
curl -X POST http://localhost:5001/api/v1/detect \
  -F "image=@test.jpg" \
  -F "confidence=0.20"

# Try with different images
# Use RDD2022 test images for best results
```

---

### Issue: Slow Performance

**Symptoms:**
- Detection takes >5 seconds
- GUI is sluggish

**Solutions:**
1. **Use smaller images** - Resize to max 1920px
2. **Check system resources** - Close other applications
3. **Enable GPU** - If available (MPS for M1)

```python
# In config.yaml
device:
  preference:
    - mps    # Try M1 GPU
    - cuda   # Or NVIDIA
    - cpu
```

---

### Issue: CORS Errors in Browser

**Error:** `Access-Control-Allow-Origin`

**Solution:**
Update `app.py` CORS settings:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": "*"
    }
})
```

---

## 📝 QA Checklist

### Pre-Testing

- [ ] Virtual environment activated
- [ ] Dependencies installed
- [ ] Trained model copied to `models/`
- [ ] API server starts successfully
- [ ] GUI opens in browser

### Functional Testing

- [ ] Image upload works (drag & drop)
- [ ] Image upload works (file picker)
- [ ] Detection runs without errors
- [ ] Results display correctly
- [ ] Confidence scores reasonable
- [ ] Processing time acceptable
- [ ] Multiple damages detected
- [ ] Clean road returns 0 detections

### API Testing

- [ ] Health endpoint responds
- [ ] Detect endpoint works
- [ ] Categories endpoint works
- [ ] Error handling works
- [ ] Large images rejected properly
- [ ] Invalid images rejected

### Performance Testing

- [ ] Cold start <5 seconds
- [ ] Detection <3 seconds
- [ ] Memory usage stable
- [ ] No memory leaks
- [ ] Handles multiple requests

### Edge Cases

- [ ] Very large image
- [ ] Very small image
- [ ] Corrupted image
- [ ] Non-image file
- [ ] Empty file
- [ ] Multiple simultaneous requests

---

## 📈 Success Criteria

### Must Have ✅

- ✅ API server starts and responds
- ✅ Model loads successfully
- ✅ Detections work for clear damages
- ✅ No false positives on clean roads
- ✅ Processing time <5 seconds
- ✅ GUI functional and responsive

### Nice to Have 🎯

- 🎯 Confidence >60% on clear damages
- 🎯 Multiple damage types detected
- 🎯 Processing time <2 seconds
- 🎯 Accurate severity estimation
- 🎯 Good categorization suggestions

### Known Limitations ⚠️

- ⚠️ Trained on 30% dataset (not full)
- ⚠️ 50 epochs (could be better with 100+)
- ⚠️ CPU inference (slower than GPU)
- ⚠️ YOLOv8n (smallest model, trade-off)
- ⚠️ May miss small/subtle damages
- ⚠️ Best for Philippine road types (RDD2022)

---

## 🎓 For QA Team

### What to Report

**For Each Test:**
1. Test case ID
2. Image used
3. Expected result
4. Actual result
5. Pass/Fail
6. Screenshots
7. Notes/observations

**Bug Report Template:**
```
Title: [Component] Brief description
Severity: Critical/High/Medium/Low
Steps to Reproduce:
1. ...
2. ...
Expected: ...
Actual: ...
Environment: macOS/Windows/Linux, Browser, etc.
Screenshots: [attach]
```

---

## 📧 Support

**Issues?** 
- Check logs: `logs/lunas_ai.log`
- API logs: Terminal output
- Browser console: F12 > Console tab

**Contact:**
- Development Team
- PHINMA University of Pangasinan
- IT Capstone Project 2025-2026

---

## 🎉 Ready to Test!

1. Run `./start_qa_testing.sh`
2. Open the GUI
3. Upload test images
4. Verify results
5. Report findings

**Happy Testing!** 🧪✨

