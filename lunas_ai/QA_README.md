# 🌙 LUNAS AI - QA Testing Package

## 📦 What's Included

This QA testing package contains everything you need to test the trained LUNAS AI road damage detection model.

### Files

| File | Purpose |
|------|---------|
| `qa_test_gui.html` | **Web-based testing interface** (main GUI) |
| `start_qa_testing.sh` | **One-command startup script** (Mac/Linux) |
| `start_qa_testing.bat` | **One-command startup script** (Windows) |
| `QA_QUICK_START.md` | **5-minute quick start guide** |
| `QA_TESTING_GUIDE.md` | **Complete testing documentation** |
| `WINDOWS_SETUP.md` | **Windows-specific setup guide** |
| `models/yolov8n-rdd2022-best.pt` | **Trained model** (6.0 MB) |

---

## 🚀 Getting Started (3 Steps)

### Step 1: Navigate to Directory

**Mac/Linux:**
```bash
cd /Users/deb/Desktop/lunas-system/lunas_ai
```

**Windows:**
```cmd
cd C:\path\to\lunas-system\lunas_ai
```

### Step 2: Run Startup Script

**Mac/Linux:**
```bash
./start_qa_testing.sh
```

**Windows:**
```cmd
start_qa_testing.bat
```

### Step 3: Test in Browser
The GUI will open automatically. If not, open `qa_test_gui.html` manually.

---

## 🎯 What You Can Test

### Core Features
- ✅ Road damage detection (4 types)
- ✅ Confidence scoring
- ✅ Bounding box visualization  
- ✅ Severity estimation
- ✅ Processing time measurement

### Damage Types
1. **D00** - Longitudinal Crack
2. **D10** - Transverse Crack
3. **D20** - Alligator Crack
4. **D40** - Pothole

---

## 📊 Model Information

| Property | Value |
|----------|-------|
| **Architecture** | YOLOv8n (Nano) |
| **Parameters** | 3.0M |
| **Model Size** | 6.0 MB |
| **Training Dataset** | RDD2022 (30% subset) |
| **Training Epochs** | 50 |
| **Training Device** | CPU (Apple M1) |
| **Training Duration** | ~4-5 days |
| **Input Size** | 640x640 |
| **Confidence Threshold** | 0.25 (25%) |

### Performance Metrics

- **box_loss:** 1.56 (final)
- **cls_loss:** 1.67 (final)
- **dfl_loss:** 1.54 (final)
- **Detection Speed:** 1-3 seconds (CPU)
- **Expected Accuracy:** 60-70% mAP@50 (estimated)

---

## 🖥️ GUI Features

### System Status Panel
- API server connectivity
- Model loading status
- Real-time health monitoring

### Upload Methods
- Drag & drop
- File browser
- Sample test images

### Results Display
- Side-by-side comparison (original vs detected)
- Detection metrics dashboard
- Confidence scores
- Detailed detection list
- Processing time
- Severity assessment

---

## 📋 Quick Test Checklist

### Basic Test (2 minutes)
1. [ ] Start the API server
2. [ ] Open GUI in browser
3. [ ] Upload a test image
4. [ ] Run detection
5. [ ] Verify results appear

### Full Test (15 minutes)
1. [ ] Test with pothole image
2. [ ] Test with crack image
3. [ ] Test with clean road (negative test)
4. [ ] Test with multiple damages
5. [ ] Check processing time
6. [ ] Verify confidence scores
7. [ ] Test API endpoints directly

---

## 🔌 API Endpoints

### Health Check
```bash
GET http://localhost:5001/api/v1/health
```

### Detect Damage
```bash
POST http://localhost:5001/api/v1/detect
Form Data:
  - image: [file]
  - confidence: 0.25
  - save_output: true
```

### Get Categories
```bash
GET http://localhost:5001/api/v1/categories
```

---

## 🎓 For QA Team

### What to Test

**Functional Testing:**
- Image upload (all methods)
- Detection accuracy
- Result display
- Error handling
- Edge cases

**Performance Testing:**
- Detection speed
- Memory usage
- Multiple requests
- Large images
- Small images

**Compatibility Testing:**
- Different browsers (Chrome, Firefox, Safari)
- Different image formats (JPG, PNG)
- Different image sizes
- Different damage types

### What to Report

For each test, document:
1. Test case description
2. Input image details
3. Expected result
4. Actual result
5. Pass/Fail status
6. Screenshots
7. Any issues or observations

---

## 🐛 Common Issues

### Issue: GUI doesn't open
**Solution:** Manually open `qa_test_gui.html` in any web browser

### Issue: API server won't start

**Mac/Linux:**
```bash
# Check if port 5001 is in use
lsof -i :5001
# Kill the process
kill -9 <PID>
```

**Windows:**
```cmd
# Check if port 5001 is in use
netstat -ano | findstr :5001
# Kill the process
taskkill /PID <PID> /F
```

### Issue: Virtual environment activation fails (Windows)

**PowerShell Error:** "execution of scripts is disabled"

**Solution:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Model not found

**Mac/Linux:**
```bash
ls -lh models/yolov8n-rdd2022-best.pt
```

**Windows:**
```cmd
dir models\yolov8n-rdd2022-best.pt
```

### Issue: Low detection accuracy
**Reasons:**
- Model trained on 30% of dataset (not full)
- 50 epochs (could be better with more)
- Small model (YOLOv8n for speed)
- CPU inference (no GPU acceleration)

**Solutions:**
- Lower confidence threshold to 0.20
- Use clear, well-lit images
- Expect moderate accuracy (this is a demo/testing model)

---

## 📈 Success Criteria

### Minimum Viable (Must Pass)
- ✅ API starts without errors
- ✅ GUI loads and is functional
- ✅ Can upload and detect images
- ✅ Results display correctly
- ✅ Processing time <5 seconds
- ✅ No crashes on valid images

### Good Performance (Should Pass)
- ✅ Clear potholes detected (>50% conf)
- ✅ Clear cracks detected (>40% conf)
- ✅ Multiple damages in one image
- ✅ Clean roads = 0 detections
- ✅ Processing time <3 seconds

### Excellent Performance (Nice to Have)
- 🎯 High confidence scores (>70%)
- 🎯 All damage types detected correctly
- 🎯 Accurate severity estimation
- 🎯 Processing time <2 seconds
- 🎯 Good categorization suggestions

---

## 📚 Documentation

| Document | When to Use | Platform |
|----------|-------------|----------|
| `QA_QUICK_START.md` | **First time setup** (5 min read) | All |
| `QA_TESTING_GUIDE.md` | **Complete reference** (30 min read) | All |
| `WINDOWS_SETUP.md` | **Windows-specific setup** | Windows |
| `QA_README.md` | **This file** (overview) | All |

---

## 🔧 Technical Specs

### System Requirements
- **OS:** macOS, Linux, Windows ✅
- **Python:** 3.10+
- **RAM:** 2GB minimum
- **Disk:** 1GB free space
- **Browser:** Any modern browser (Chrome, Firefox, Edge, Safari)

### Cross-Platform Support

| Feature | Mac | Linux | Windows |
|---------|-----|-------|---------|
| **API Server** | ✅ | ✅ | ✅ |
| **QA GUI** | ✅ | ✅ | ✅ |
| **Detection** | ✅ | ✅ | ✅ |
| **Startup Script** | `start_qa_testing.sh` | `start_qa_testing.sh` | `start_qa_testing.bat` |

**Note:** The GUI, API, and model work identically on all platforms - only the startup script differs.

### Dependencies
All installed via `requirements.txt`:
- Flask 3.0.0
- ultralytics 8.4.117
- PyTorch 2.13.0
- OpenCV 4.10.0
- Pillow 11.0.0

---

## 📞 Support

**For Issues:**
1. Check `logs/lunas_ai.log`
2. Check browser console (F12)
3. Review troubleshooting section in full guide
4. Contact development team

**Development Team:**
- PHINMA University of Pangasinan
- College of Information Technology
- Capstone Project 2025-2026

---

## 🎉 You're Ready!

Everything is set up and ready for QA testing. Just run:

**Mac/Linux:**
```bash
./start_qa_testing.sh
```

**Windows:**
```cmd
start_qa_testing.bat
```

And start testing! 🧪✨

---

**Last Updated:** August 15, 2026
**Version:** 1.0.0
**Status:** Ready for QA Testing ✅
