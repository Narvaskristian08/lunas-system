# 🚀 LUNAS AI - QA Quick Start

**5-minute setup guide for QA testing**

---

## 📋 Prerequisites

**Before starting, make sure you have:**
- Python 3.10 or higher installed
- Internet connection (for first-time setup only)

**Check Python version:**

**Mac/Linux:**
```bash
python3 --version
```

**Windows:**
```cmd
python --version
```

Should show Python 3.10 or higher. If not, download from https://www.python.org/downloads/

---

## ⚙️ First-Time Setup (5 minutes)

### Step 1: Navigate to Directory

**Mac/Linux:**
```bash
cd /path/to/lunas-system/lunas_ai
```

**Windows:**
```cmd
cd C:\path\to\lunas-system\lunas_ai
```

### Step 2: Create Virtual Environment

**Mac/Linux:**
```bash
python3 -m venv venv
```

**Windows:**
```cmd
python -m venv venv
```

### Step 3: Activate Virtual Environment

**Mac/Linux:**
```bash
source venv/bin/activate
```

**Windows (Command Prompt):**
```cmd
venv\Scripts\activate
```

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
```

You should see `(venv)` at the start of your command prompt.

### Step 4: Install Requirements

**All Platforms:**
```bash
pip install -r requirements.txt
```

This will take 5-10 minutes (downloads ~2GB of packages). Be patient! ⏳

### Step 5: Verify Model Exists

**Mac/Linux:**
```bash
ls -lh models/yolov8n-rdd2022-best.pt
```

**Windows:**
```cmd
dir models\yolov8n-rdd2022-best.pt
```

You should see the model file (6.0 MB). ✅

---

## 🚀 Running QA Tests (After Setup)

### One-Command Startup

**Mac/Linux:**
```bash
./start_qa_testing.sh
```

**Windows:**
```cmd
start_qa_testing.bat
```

This will automatically:
1. ✅ Activate virtual environment
2. ✅ Start the AI API server
3. ✅ Load the trained model (6.0 MB)
4. ✅ Open the QA testing GUI in your browser

---

## What You'll See

### 1. API Server Terminal
```
🌙 LUNAS AI Service
✅ Model loaded: yolov8n-rdd2022-best.pt
🚀 Server running on http://localhost:5001
```

### 2. Browser GUI
- **Status indicators** (green = ready)
- **Upload area** (drag & drop or click)
- **Detection results** (images, metrics, details)

---

## Quick Test

1. **Upload an image** of a road (with or without damage)
2. **Click "Run Detection"**
3. **View results:**
   - Detected damages highlighted
   - Confidence scores
   - Processing time
   - Severity level

---

## What's Trained

- **Model:** YOLOv8n (6.0 MB)
- **Dataset:** RDD2022 (Road Damage Dataset 2022)
- **Training:** 50 epochs on 30% of dataset
- **Classes:** 4 types of road damage
  - D00: Longitudinal Crack
  - D10: Transverse Crack
  - D20: Alligator Crack  
  - D40: Pothole

---

## Expected Performance

| Metric | Value |
|--------|-------|
| **Detection Time** | 1-3 seconds (CPU) |
| **Confidence** | 25-90% (damage dependent) |
| **Memory Usage** | ~300 MB |
| **Accuracy** | Good for clear damages |

---

## Test Cases

### ✅ Should Detect:
- Clear potholes
- Visible cracks
- Road surface damage
- Multiple damages in one image

### ✅ Should NOT Detect:
- Clean roads
- Shadows (usually)
- Road markings
- Non-damage objects

---

## If Something Goes Wrong

### Python Not Found?

**Mac/Linux:**
- Try `python3` instead of `python`
- Install from https://www.python.org/downloads/

**Windows:**
- Reinstall Python and check "Add Python to PATH"
- Or search "Environment Variables" and add Python to PATH

---

### Virtual Environment Won't Activate?

**PowerShell (Windows):**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try activating again.

---

### pip install fails?

**Try updating pip first:**
```bash
pip install --upgrade pip
```

**If SSL errors:**
```bash
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
```

---

### API Won't Start?

**Mac/Linux:**
```bash
# Check if port is busy
lsof -i :5001

# Kill process and restart
kill -9 <PID>
python app.py
```

**Windows:**
```cmd
# Check if port is busy
netstat -ano | findstr :5001

# Kill process
taskkill /PID <PID> /F
```

---

### Model Not Found?

The trained model should be included in the repository at:
- `models/yolov8n-rdd2022-best.pt`

If missing, contact the development team.

---

### Low Accuracy?
- Use clear, well-lit images
- Try lowering confidence threshold to 0.20
- Remember: trained on 30% of data (moderate accuracy expected)

---

## Files You Need

```
lunas_ai/
├── qa_test_gui.html          ← Open this in browser
├── start_qa_testing.sh       ← Run this to start
├── app.py                    ← API server
├── models/
│   └── yolov8n-rdd2022-best.pt  ← Trained model (6.0 MB)
└── QA_TESTING_GUIDE.md       ← Full testing guide
```

---

## Quick Links

- **GUI:** Open `qa_test_gui.html` in browser
- **API Health:** http://localhost:5001/api/v1/health
- **API Docs:** http://localhost:5001/api/v1/docs
- **Full Guide:** Read `QA_TESTING_GUIDE.md`

---

## Success Checklist

**First-time Setup:**
- [ ] Python 3.10+ installed
- [ ] Virtual environment created (`venv/` folder exists)
- [ ] Virtual environment activated (shows `(venv)` in terminal)
- [ ] Requirements installed (took 5-10 minutes)
- [ ] Model file exists (6.0 MB)

**Running QA Tests:**
- [ ] API server started (terminal shows "Server running")
- [ ] GUI opened in browser
- [ ] Status dots are green
- [ ] Can upload images
- [ ] Detection runs and shows results
- [ ] Processing time <5 seconds

---

## 📚 Need More Help?

| Document | When to Use |
|----------|-------------|
| **QA_QUICK_START.md** | You are here (5-minute setup) |
| **WINDOWS_SETUP.md** | Detailed Windows troubleshooting |
| **QA_TESTING_GUIDE.md** | Complete testing reference |
| **QA_README.md** | Overview and technical specs |

---

## 🎯 Ready to Test!

**First time?** Run through Steps 1-5 above (takes 5-10 minutes).

**Already set up?** Just run the startup script and you're good to go!

**Mac/Linux:**
```bash
./start_qa_testing.sh
```

**Windows:**
```cmd
start_qa_testing.bat
```

For detailed testing instructions, see `QA_TESTING_GUIDE.md`

---

## 💡 Pro Tips

1. **Activate venv first** - Always activate the virtual environment before running commands
2. **Keep terminal open** - The API server needs to stay running while testing
3. **Use good images** - Clear, well-lit photos work best
4. **Check logs** - If issues occur, check `logs/lunas_ai.log`
5. **Read WINDOWS_SETUP.md** - Windows users should review this for platform-specific tips

---

**Questions?** Check the troubleshooting section above or see `QA_TESTING_GUIDE.md`

**Happy Testing!** 🧪✨
