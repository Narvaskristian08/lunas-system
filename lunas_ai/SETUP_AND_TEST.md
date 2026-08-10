# 🚀 LUNAS AI - Complete Setup & Testing Guide

**Follow these steps EXACTLY in order. Takes 10 minutes.**

---

## 📋 Before You Start

**You need:**
- [ ] Mac or Linux computer (Windows works too)
- [ ] Python 3.10 or newer installed
- [ ] Internet connection (for installing packages)
- [ ] A road image to test (or use the samples below)

**Check Python version:**
```bash
python3 --version
```
Should show: `Python 3.10.x` or higher

---

# PART 1: FIRST TIME SETUP (Do this once)

## Step 1: Clone the Repository

```bash
# Go to your projects folder
cd ~/Desktop

# Clone the repo (if you haven't already)
git clone <your-repo-url>
cd lunas-system/lunas_ai
```

**Expected result:** You're now in the `lunas_ai` folder

---

## Step 2: Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv
```

**Expected result:** A new `venv` folder appears

**If error:** Try `python` instead of `python3`

---

## Step 3: Activate Virtual Environment

**On Mac/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

**Expected result:** Your terminal shows `(venv)` at the start of the line:
```
(venv) ➜ lunas_ai
```

---

## Step 4: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Expected result:** 
- Downloads ~200MB of packages
- Takes 3-5 minutes
- Shows "Successfully installed..."

**⚠️ If you see errors:**
- Make sure you're in the `lunas_ai` folder
- Make sure virtual environment is activated (see `(venv)`)
- Make sure you have internet connection

---

## Step 5: Verify Installation

```bash
python -c "import flask, torch, ultralytics; print('✅ All packages installed!')"
```

**Expected result:** `✅ All packages installed!`

**If error:** Reinstall with `pip install -r requirements.txt`

---

# PART 2: START THE AI SERVICE

## Step 6: Start the Server

```bash
python app.py
```

**Expected result:** You should see this:

```
╔════════════════════════════════════════════════════════╗
║              LUNAS AI Service Starting                 ║
╚════════════════════════════════════════════════════════╝

✅ Device: mps (Apple Silicon GPU)
✅ Model Manager initialized
✅ Flask app configured
🚀 Starting server on http://0.0.0.0:5001

Press CTRL+C to quit
```

**⚠️ Common Issues:**

**Issue:** "Port 5001 already in use"
```bash
# Find and kill the process
lsof -i :5001
kill -9 <PID>
# Try again: python app.py
```

**Issue:** "Module not found"
```bash
# Make sure venv is activated
source venv/bin/activate
# Reinstall
pip install -r requirements.txt
```

---

## ✅ Checkpoint: Is the service running?

**Leave this terminal open!** The service must keep running for testing.

Open a **NEW terminal window** for the next steps.

---

# PART 3: TEST THE AI (Choose ONE method)

## 🎯 Method 1: Web Browser Test (EASIEST - Recommended!)

**This is the easiest way to test. Perfect for first-time users.**

### Step 7: Open the Test Page

**On Mac:**
```bash
cd ~/Desktop/lunas-system/lunas_ai
open test_page.html
```

**On Windows:**
```bash
cd C:\path\to\lunas-system\lunas_ai
start test_page.html
```

**Or:** Just double-click `test_page.html` in your file browser

---

### Step 8: Upload an Image

1. **Click "Choose Image"** or drag & drop an image
2. **Adjust confidence** slider if needed (0.5 is good)
3. **Click "🔍 Analyze Image"** button
4. **Wait 1-2 seconds**
5. **See results!**

---

### Step 9: Understand the Results

**✅ If damage found:**
```
⚠️ Found 2 Damage(s):

1. POTHOLE
   Confidence: 89.3%
   Severity: HIGH
   Location: (320, 240)

2. LONGITUDINAL_CRACK
   Confidence: 76.5%
   Severity: MEDIUM
   Location: (120, 180)
```

**✅ If no damage:**
```
✅ No Damage Detected
The road appears to be in good condition!
```

**❌ If error:**
```
❌ Error: Connection error
Make sure the AI service is running on http://localhost:5001
```
→ Go back to Part 2, Step 6

---

### Step 10: Try Different Images

Test with these types of images:

1. **Pothole photo** → Should detect "pothole"
2. **Cracked road** → Should detect "crack"
3. **Clean highway** → Should show 0 damages
4. **Random photo** (cat, person) → Should show 0 damages

---

## 📸 Where to Get Test Images?

### Option A: Download Sample Images

```bash
# Create test folder
mkdir -p test_images
cd test_images

# Download pothole sample
curl -o pothole.jpg "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=640"

# Download crack sample  
curl -o crack.jpg "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=640"

# Download clean road
curl -o clean.jpg "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=640"

cd ..
```

Now test with: `test_images/pothole.jpg`, `test_images/crack.jpg`, etc.

---

### Option B: Use Your Phone

1. Take a photo of any road with your phone
2. Transfer it to your computer (AirDrop, email, etc.)
3. Use that image in the test page

---

## 💻 Method 2: Command Line Test (For Developers)

**If you prefer terminal commands:**

### Step 7: Open New Terminal

Keep the AI service running in the first terminal.

Open a **second terminal window**.

---

### Step 8: Test Health Check

```bash
curl http://localhost:5001/api/v1/health
```

**Expected result:**
```json
{
  "status": "healthy",
  "service": "lunas-ai",
  "version": "1.0.0",
  "device": "mps"
}
```

✅ If you see this, the service is working!

---

### Step 9: Test Detection

```bash
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@/path/to/your/image.jpg" \
  -F "confidence=0.5"
```

**⚠️ Replace `/path/to/your/image.jpg` with your actual image path!**

**Example:**
```bash
# If image is on Desktop
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@/Users/yourusername/Desktop/pothole.jpg" \
  -F "confidence=0.5"
```

---

### Step 10: Read Results

**Success response:**
```json
{
  "success": true,
  "detections": [
    {
      "class": "pothole",
      "confidence": 0.89,
      "severity": "high",
      "bbox": {"x": 320, "y": 240, "width": 150, "height": 120}
    }
  ],
  "total_damages": 1,
  "inference_time": "0.84s"
}
```

✅ This means: Found 1 pothole with 89% confidence!

---

## 🐍 Method 3: Python Script Test (For Automation)

### Step 7: Run the Test Script

```bash
# Make sure venv is activated
source venv/bin/activate

# Run the script
python test_detection.py /path/to/your/image.jpg
```

**Example:**
```bash
python test_detection.py test_images/pothole.jpg
```

---

### Step 8: See Results

**Output example:**
```
==============================================================
🛣️  LUNAS AI - Road Damage Detection Test
==============================================================

✅ AI Service is running

📸 Analyzing image: pothole.jpg
📊 Confidence threshold: 0.5
🔄 Processing...

==============================================================
⏱️  Processing Time: 0.84s
📐 Image Size: 1280x720
🔍 Damages Found: 2
==============================================================

⚠️  FOUND 2 DAMAGE(S):

🔴 1. POTHOLE
   Confidence: 89.3%
   Severity: HIGH
   Location: (320, 240)
   Size: 150×120 pixels

🟡 2. LONGITUDINAL CRACK
   Confidence: 76.5%
   Severity: MEDIUM
   Location: (120, 180)
   Size: 400×50 pixels

==============================================================

💾 Full results saved to: detection_result.json
```

---

# PART 4: VERIFY EVERYTHING WORKS

## Step 11: Run All Tests

**Test 1 - Health Check:**
```bash
curl http://localhost:5001/api/v1/health
```
Expected: `"status": "healthy"` ✅

---

**Test 2 - List Models:**
```bash
curl http://localhost:5001/api/v1/models
```
Expected: Shows YOLOv8s model ✅

---

**Test 3 - Detect Damage:**
```bash
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@test_images/pothole.jpg" \
  -F "confidence=0.5"
```
Expected: Detections found ✅

---

**Test 4 - Clean Road:**
```bash
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@test_images/clean.jpg" \
  -F "confidence=0.5"
```
Expected: `"total_damages": 0` ✅

---

## Step 12: Complete Testing Checklist

**Mark each as complete:**

- [ ] Service starts without errors
- [ ] Health check responds
- [ ] Can upload images via web interface
- [ ] Detects potholes in test images (confidence >70%)
- [ ] Detects cracks in test images (confidence >60%)
- [ ] Returns 0 damages for clean roads
- [ ] Inference time < 2 seconds
- [ ] Multiple requests work (no crashes)
- [ ] Error handling works (test with invalid file)

---

# PART 5: STOP THE SERVICE

## Step 13: Shut Down

**In the terminal running the service:**

Press `CTRL+C` (or `Command+C` on Mac)

**Expected result:**
```
^C
⚠️  Shutting down...
✅ Service stopped
```

---

# 🎉 SUCCESS CRITERIA

**You've successfully tested the AI if:**

✅ Service started without errors  
✅ Health check returned `"healthy"`  
✅ Detected damage in pothole images  
✅ Returned 0 damages for clean images  
✅ Inference time was under 2 seconds  
✅ Web interface worked smoothly  

---

# 🐛 TROUBLESHOOTING

## Problem 1: "python: command not found"

**Solution:** Try `python3` instead
```bash
python3 app.py
```

---

## Problem 2: "Module not found"

**Solution:** Install dependencies again
```bash
source venv/bin/activate
pip install -r requirements.txt
```

---

## Problem 3: "Connection refused"

**Solution:** Service not running, start it
```bash
cd lunas_ai
source venv/bin/activate
python app.py
```

---

## Problem 4: "Port 5001 already in use"

**Solution:** Kill the existing process
```bash
lsof -i :5001
kill -9 <PID_NUMBER>
python app.py
```

---

## Problem 5: "No damage detected" but there IS damage

**Solution:** Lower confidence threshold
```bash
# Try 0.3 instead of 0.5
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@your-image.jpg" \
  -F "confidence=0.3"
```

---

## Problem 6: Very slow (>5 seconds per image)

**Solution:** Check device
```bash
curl http://localhost:5001/api/v1/health | grep device
```

- **"device": "mps"** → Good (M1/M2 GPU) ✅
- **"device": "cuda"** → Good (NVIDIA GPU) ✅
- **"device": "cpu"** → Slower but works ⚠️

---

## Problem 7: Can't find image path

**Solution:** Find full path
```bash
# On Mac: Drag file to terminal to see path
# Or use:
pwd  # Shows current directory
ls   # Shows files in directory
```

---

# 📝 NEXT STEPS

## After Basic Testing Works:

### 1. Test Integration with Backend

```bash
# Terminal 1: Start AI service
cd lunas_ai
source venv/bin/activate
python app.py

# Terminal 2: Start Node.js backend
cd lunas_backend
npm run dev

# Terminal 3: Test integration
curl -X POST http://localhost:3000/api/incidents/detect \
  -F "image=@pothole.jpg"
```

---

### 2. Train with RDD2022 Dataset (Optional)

**For 93%+ accuracy on road damage:**

```bash
# 1. Download RDD2022 from:
# https://figshare.com/articles/dataset/RDD2022/21431547

# 2. Extract and organize
python organize_rdd2022.py

# 3. Train (takes 6-8 hours on M1)
python train.py --model yolov8s --dataset rdd2022 --epochs 100
```

See `README.md` for detailed training guide.

---

### 3. Deploy with Docker

```bash
# Build image
docker build -t lunas-ai:latest .

# Run container
docker run -d -p 5001:5001 lunas-ai:latest
```

---

### 4. Set Up Continuous Testing

Use the Python script in your CI/CD:

```bash
#!/bin/bash
# test_ai.sh

# Start service
python app.py &
SERVICE_PID=$!

# Wait for startup
sleep 5

# Run tests
python test_detection.py test_images/pothole.jpg
python test_detection.py test_images/crack.jpg
python test_detection.py test_images/clean.jpg

# Stop service
kill $SERVICE_PID
```

---

# 📊 TEST REPORT TEMPLATE

**After testing, fill this out:**

```markdown
## LUNAS AI Test Report

**Tester:** [Your Name]
**Date:** [Date]
**Environment:** 
- OS: macOS / Windows / Linux
- Python: 3.x.x
- Device: M1 Mac / Intel / etc.

### Setup
- [x] Dependencies installed successfully
- [x] Service started without errors
- [x] Virtual environment working

### Basic Tests
- [x] Health check: PASS
- [x] Model loading: PASS
- [x] Pothole detection: PASS (confidence: 89%)
- [x] Crack detection: PASS (confidence: 76%)
- [x] Clean road: PASS (0 damages)
- [x] Invalid image: PASS (error handled)

### Performance
- Average inference time: 0.85s
- Memory usage: 1.6GB
- CPU usage: 45%
- No crashes after 20 requests

### Issues Found
1. None

### Screenshots
[Attach screenshots of test page and results]

### Recommendation
✅ Ready for integration testing
```

---

# ✅ FINAL CHECKLIST

**Before reporting "Testing Complete":**

- [ ] Read this entire guide
- [ ] Completed Part 1 (Setup)
- [ ] Completed Part 2 (Start service)
- [ ] Completed Part 3 (Testing - at least one method)
- [ ] Completed Part 4 (Verification)
- [ ] All tests passed
- [ ] Documented any issues
- [ ] Filled out test report

---

# 🆘 NEED HELP?

**If stuck:**

1. **Check logs:**
   ```bash
   tail -50 logs/lunas_ai.log
   ```

2. **Restart everything:**
   ```bash
   # Stop service (Ctrl+C)
   # Deactivate venv
   deactivate
   # Start fresh
   source venv/bin/activate
   python app.py
   ```

3. **Ask team with:**
   - Screenshot of error
   - Your OS and Python version
   - Step number where you got stuck

---

# 🎯 SUMMARY

**What you did:**

1. ✅ Set up Python environment
2. ✅ Installed AI dependencies
3. ✅ Started the AI service
4. ✅ Tested with images
5. ✅ Verified results

**What you learned:**

- How to start/stop the AI service
- How to upload images for detection
- How to interpret detection results
- How to troubleshoot common issues

**You're now ready to:**

- Test the AI independently
- Integrate with the backend
- Help team members set up
- Report bugs if found

---

**🎉 Congratulations! You've successfully tested the LUNAS AI system!**

**Questions? Check README.md or ask the team!**
