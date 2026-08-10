# 🚀 START HERE - Team Testing Guide

**Welcome to LUNAS AI! Choose your path below.**

---

## ⚡ NEW TO THE PROJECT? Start Here!

### 👉 **SETUP_AND_TEST.md** - Complete Step-by-Step Guide

**This is THE guide for first-time setup and testing!**

- ✅ Numbered steps (no guessing!)
- ✅ Setup + Testing + Troubleshooting all in one
- ✅ Takes 10 minutes start to finish
- ✅ Perfect for first-time users

**👉 [Click here to open SETUP_AND_TEST.md](SETUP_AND_TEST.md)**

---

## 📚 Other Documentation (For Reference)

Your team also has these specialized guides:

### 1. 🌐 **Web Browser Test** (Easiest - No coding!)
   - Open `test_page.html` in Chrome/Safari
   - Drag & drop an image or click to upload
   - See results instantly with nice visuals
   - **Best for:** Quick demos and non-technical team members

### 2. 💻 **Command Line Test** (Fast - One command!)
   - Follow instructions in `HOW_TO_TEST.md`
   - Just one `curl` command
   - **Best for:** Quick verification

### 3. 🐍 **Python Script Test** (Automated)
   - Run `python test_detection.py <image_path>`
   - Saves results to JSON file
   - **Best for:** Batch testing multiple images

### 4. 📮 **Postman Test** (API Testing)
   - Import the collection from `TESTING_GUIDE.md`
   - Visual interface for API testing
   - **Best for:** Full API exploration

---

## ⚡ Quick Start (3 Steps)

### Step 1: Start the AI Service

```bash
cd lunas_ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

**Wait for:** `🚀 Starting server on http://0.0.0.0:5001`

---

### Step 2: Choose Your Testing Method

**Option A - Web Browser (Easiest):**
```bash
# Just double-click test_page.html
# Or open it:
open test_page.html
```

**Option B - Command Line:**
```bash
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@/path/to/your/image.jpg" \
  -F "confidence=0.5"
```

**Option C - Python Script:**
```bash
python test_detection.py /path/to/your/image.jpg
```

---

### Step 3: Verify Results

✅ **Success looks like:**
```json
{
  "success": true,
  "detections": [...],
  "total_damages": 2,
  "inference_time": "0.84s"
}
```

---

## 📖 Full Documentation

| File | What's Inside | Who Should Read |
|------|---------------|-----------------|
| **README.md** | Complete setup, API docs, training guide | Everyone (start here) |
| **HOW_TO_TEST.md** | Step-by-step testing with all methods | Testers, QA team |
| **TESTING_GUIDE.md** | Quick reference for API endpoints | Developers |
| **test_page.html** | Visual web interface | Everyone (easiest!) |
| **test_detection.py** | Python test script | Automation testers |

---

## 🎯 Recommended Path

### For Non-Technical Team Members:
1. Read `HOW_TO_TEST.md` (Method 4 - Web Browser)
2. Open `test_page.html`
3. Upload an image
4. Done! ✅

### For Developers:
1. Skim `README.md` (setup section)
2. Start service: `python app.py`
3. Try `TESTING_GUIDE.md` curl commands
4. Integrate with Node.js backend

### For QA/Testing Team:
1. Read `HOW_TO_TEST.md` (all methods)
2. Use `test_page.html` for visual testing
3. Use `test_detection.py` for automation
4. Use Postman for API testing

---

## 🆘 Common Questions

### Q: "How do I know if it's working?"

A: Run this command:
```bash
curl http://localhost:5001/api/v1/health
```

If you see `"status": "healthy"`, it's working! ✅

---

### Q: "What images should I test with?"

A: 
- **Potholes:** Any photo of a damaged road with holes
- **Cracks:** Road surface with visible cracks
- **Clean roads:** Should return 0 detections
- Download samples: See `HOW_TO_TEST.md` for free image sources

---

### Q: "It says 'Connection refused'"

A: The service isn't running. Start it:
```bash
cd lunas_ai
source venv/bin/activate
python app.py
```

---

### Q: "No damage detected but there IS damage"

A: Lower the confidence threshold:
```bash
# Try 0.3 instead of 0.5 (more sensitive)
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@your-image.jpg" \
  -F "confidence=0.3"
```

---

### Q: "Where are the trained models?"

A: 
- Currently using **pre-trained YOLOv8s** (general purpose)
- For 93%+ accuracy, train with RDD2022 dataset (see `README.md`)
- Training takes 6-8 hours on M1 Mac

---

### Q: "Can I test from mobile?"

A: Yes! If both your phone and Mac are on the same WiFi:
1. Find your Mac's IP: `ifconfig | grep "inet "`
2. Replace `localhost` with your IP (e.g., `192.168.1.5`)
3. Open in mobile browser: `http://192.168.1.5:5001/test_page.html`

---

## ✅ Testing Checklist

Before reporting "it works":

- [ ] Service starts without errors
- [ ] Health check returns 200
- [ ] Can detect damage in pothole images
- [ ] Returns 0 damages for clean road images
- [ ] Inference time < 2 seconds
- [ ] Error handling works (bad images)
- [ ] Integration with Node.js backend works

---

## 📊 Expected Results

| Test Case | Expected Result |
|-----------|----------------|
| Pothole image | `"class": "pothole"`, confidence >80% |
| Cracked road | `"class": "*_crack"`, confidence >70% |
| Clean highway | `"total_damages": 0` |
| Non-road image | `"total_damages": 0` or low confidence |
| Invalid file | Error message |

---

## 🎓 What to Test

### Basic Functionality ✅
- [ ] Upload image via web interface
- [ ] Detect potholes
- [ ] Detect cracks
- [ ] Handle clean roads (0 detections)
- [ ] Handle invalid images (error)

### Performance ⚡
- [ ] Inference time < 2 seconds
- [ ] Multiple requests work
- [ ] Service doesn't crash
- [ ] Memory usage stable

### Accuracy 🎯
- [ ] Detects obvious potholes (>80% confidence)
- [ ] Detects clear cracks (>70% confidence)
- [ ] Few false positives on clean roads
- [ ] Reasonable bbox positioning

---

## 🔗 API Endpoints to Test

| Endpoint | What It Does |
|----------|-------------|
| `/api/v1/health` | Check service status |
| `/api/v1/models` | List available models |
| `/api/v1/detect/road-damage` | Detect all damage types |
| `/api/v1/detect/cracks` | Detect only cracks |
| `/api/v1/detect/privacy` | Blur faces & plates |
| `/api/v1/detect/comprehensive` | Full analysis |

**All examples in `TESTING_GUIDE.md`**

---

## 🎯 Test Report Template

After testing, fill this out:

```markdown
## Test Report - [Your Name] - [Date]

### Environment
- OS: macOS / Windows / Linux
- Python Version: 3.x.x
- Device: M1 Mac / Intel / etc.

### Tests Completed
- [x] Web interface (test_page.html)
- [x] Command line (curl)
- [x] Python script
- [ ] Postman

### Results
- Successful detections: X/Y images
- Average inference time: X.Xs
- False positives: X
- False negatives: X

### Issues Found
1. [Issue description]
2. [Issue description]

### Screenshots
[Attach screenshots of successful/failed tests]

### Recommendation
✅ Ready for deployment / ⚠️ Needs fixes / ❌ Major issues
```

---

## 🚀 Next Steps After Testing

1. **If everything works:**
   - Document any bugs found
   - Share test results with team
   - Move to integration testing with backend

2. **If issues found:**
   - Check logs: `tail -50 logs/lunas_ai.log`
   - Screenshot the error
   - Report in team chat with details

3. **For production:**
   - Train with RDD2022 dataset (93%+ accuracy)
   - Set up Docker deployment
   - Configure load balancing

---

## 📞 Need Help?

**Stuck?**
1. Check `README.md` troubleshooting section
2. Read `HOW_TO_TEST.md` for your method
3. Check logs: `cat logs/lunas_ai.log`
4. Ask in team chat with:
   - Screenshot of error
   - Your OS & Python version
   - What you were trying to do

---

## 🎉 Quick Test (30 seconds)

**Verify everything is working:**

```bash
# 1. Check service
curl http://localhost:5001/api/v1/health

# 2. Check models
curl http://localhost:5001/api/v1/models

# 3. Test detection (replace image path)
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@test.jpg" \
  -F "confidence=0.5"
```

---

**Ready? Pick your testing method above and start! 🚀**

**Questions? Check the README.md or ask the team!**
