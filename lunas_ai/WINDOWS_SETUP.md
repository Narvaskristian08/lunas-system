# 🪟 LUNAS AI - Windows Setup Guide

Complete setup guide for Windows users.

---

## 📋 Prerequisites

### Required Software

1. **Python 3.10 or higher**
   - Download: https://www.python.org/downloads/
   - ✅ Make sure to check "Add Python to PATH" during installation!

2. **Git for Windows** (optional, for cloning)
   - Download: https://git-scm.com/download/win

3. **Visual C++ Redistributable** (for PyTorch)
   - Usually installed with Python, but if needed:
   - Download: https://aka.ms/vs/17/release/vc_redist.x64.exe

---

## 🚀 Setup Steps

### Step 1: Open Command Prompt or PowerShell

```cmd
# Right-click Start menu → Windows Terminal or Command Prompt
# Or press Win+R, type "cmd", press Enter
```

### Step 2: Navigate to Project

```cmd
cd C:\path\to\lunas-system\lunas_ai
```

Or if on Desktop:
```cmd
cd %USERPROFILE%\Desktop\lunas-system\lunas_ai
```

### Step 3: Create Virtual Environment

```cmd
python -m venv venv
```

### Step 4: Activate Virtual Environment

```cmd
venv\Scripts\activate
```

You should see `(venv)` at the start of your command prompt.

### Step 5: Install Dependencies

```cmd
pip install -r requirements.txt
```

This will take 5-10 minutes (downloads ~2GB of packages).

### Step 6: Verify Model Exists

```cmd
dir models\yolov8n-rdd2022-best.pt
```

If not found, copy from training output:
```cmd
copy ..\runs\detect\runs\train\rdd2022_yolov8n_small\weights\best.pt models\yolov8n-rdd2022-best.pt
```

---

## 🧪 Running QA Tests

### Option 1: Using Batch Script (Recommended)

```cmd
start_qa_testing.bat
```

This will:
1. Activate virtual environment
2. Check model
3. Start API server
4. Open GUI in browser

### Option 2: Manual Start

**Terminal 1 - Start API:**
```cmd
cd C:\path\to\lunas-system\lunas_ai
venv\Scripts\activate
python app.py
```

**Terminal 2 - Open GUI:**
```cmd
cd C:\path\to\lunas-system\lunas_ai
start qa_test_gui.html
```

---

## 🔧 Windows-Specific Commands

### Check Python Version
```cmd
python --version
```
Should show Python 3.10 or higher.

### Check if Virtual Environment is Active
```cmd
where python
```
Should show path containing `venv\Scripts`.

### Stop API Server
Press `Ctrl+C` in the terminal where it's running.

### Check if Port 5001 is in Use
```cmd
netstat -ano | findstr :5001
```

### Kill Process on Port 5001
```cmd
# Find PID from netstat command above
taskkill /PID <PID> /F
```

### View Logs
```cmd
type logs\lunas_ai.log
```

Or open in Notepad:
```cmd
notepad logs\lunas_ai.log
```

---

## 🐛 Windows-Specific Troubleshooting

### Issue: "python not recognized"

**Cause:** Python not in PATH

**Solution:**
1. Reinstall Python and check "Add Python to PATH"
2. Or add manually:
   - Search "Environment Variables" in Start
   - Edit PATH
   - Add: `C:\Users\YourName\AppData\Local\Programs\Python\Python310`

---

### Issue: "pip install fails with SSL error"

**Solution:**
```cmd
python -m pip install --upgrade pip
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
```

---

### Issue: "torch not found" or "CUDA errors"

**Solution:** The model runs on CPU by default (no GPU needed).

If you want GPU support (NVIDIA only):
1. Install CUDA: https://developer.nvidia.com/cuda-downloads
2. Install PyTorch with CUDA:
```cmd
pip uninstall torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

---

### Issue: Virtual environment activation fails in PowerShell

**Error:** "execution of scripts is disabled"

**Solution:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try activating again:
```powershell
venv\Scripts\Activate.ps1
```

---

### Issue: Permission denied when copying model

**Solution:** Run Command Prompt as Administrator:
- Right-click Command Prompt
- Select "Run as administrator"
- Try the copy command again

---

### Issue: Browser doesn't open automatically

**Solution:** Manually open the GUI:
1. Open File Explorer
2. Navigate to: `C:\path\to\lunas-system\lunas_ai`
3. Double-click `qa_test_gui.html`

Or from command line:
```cmd
start qa_test_gui.html
```

---

### Issue: Slow performance on Windows

**Causes:**
- Windows Defender scanning
- Background processes
- Antivirus software

**Solutions:**
1. Add Python and project folder to Windows Defender exclusions
2. Close unnecessary programs
3. Use Task Manager to check CPU/RAM usage

---

## 📂 Windows File Paths

### Project Structure (Windows)
```
C:\Users\YourName\Desktop\lunas-system\lunas_ai\
├── qa_test_gui.html
├── start_qa_testing.bat      ← Use this on Windows
├── start_qa_testing.sh        ← Mac/Linux only
├── app.py
├── venv\                      ← Windows uses backslash
│   └── Scripts\
│       └── activate.bat
├── models\
│   └── yolov8n-rdd2022-best.pt
└── logs\
    └── lunas_ai.log
```

---

## 🎯 Quick Command Reference

| Task | Windows Command |
|------|----------------|
| **Activate venv** | `venv\Scripts\activate` |
| **Deactivate venv** | `deactivate` |
| **Start API** | `python app.py` |
| **Open GUI** | `start qa_test_gui.html` |
| **View logs** | `type logs\lunas_ai.log` |
| **Check running** | `netstat -ano \| findstr :5001` |
| **Stop server** | `Ctrl+C` |

---

## 🔒 Windows Firewall

If you get firewall warnings:
1. Click "Allow access"
2. This allows Python to accept local connections
3. Only affects localhost (127.0.0.1) - safe to allow

---

## 💡 Tips for Windows Users

### Use Windows Terminal (Modern)
- Download from Microsoft Store
- Better than Command Prompt
- Supports tabs and modern features

### Use PowerShell (Built-in)
- More powerful than CMD
- Better for development
- Syntax similar to CMD for basic commands

### Use Git Bash (If installed)
- Can run the `.sh` script on Windows
- Unix-like commands on Windows
- Best of both worlds

---

## 🧪 Testing on Windows

Everything works the same as Mac/Linux:

1. **GUI:** Works in any browser (Chrome, Edge, Firefox)
2. **API:** Same endpoints, same responses
3. **Detection:** Same accuracy and speed
4. **Model:** Same .pt file works on all platforms

### Performance Notes

| Platform | Typical Speed |
|----------|---------------|
| **Windows (CPU)** | 1-3 seconds |
| **Windows (NVIDIA GPU)** | 0.5-1 second |
| **Mac M1 (CPU)** | 1-3 seconds |
| **Mac M1 (MPS)** | 0.8-1.5 seconds |

---

## 📦 Distribution to Windows QA Team

### Zip Package Contents
```
lunas-ai-qa-package.zip
├── qa_test_gui.html
├── start_qa_testing.bat
├── WINDOWS_SETUP.md
├── QA_TESTING_GUIDE.md
├── requirements.txt
└── models/
    └── yolov8n-rdd2022-best.pt
```

### Setup Instructions for QA Team

1. Extract ZIP to `C:\lunas-ai-qa`
2. Install Python 3.10+
3. Open Command Prompt
4. Run:
   ```cmd
   cd C:\lunas-ai-qa
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   start_qa_testing.bat
   ```

---

## ✅ Windows Compatibility Checklist

- [x] Python 3.10+ works
- [x] Virtual environment works
- [x] Dependencies install correctly
- [x] API server runs
- [x] GUI opens in browser
- [x] Detection works
- [x] File paths use Windows backslash
- [x] Batch script provided
- [x] Documentation updated

---

## 🎉 You're Ready on Windows!

Run:
```cmd
start_qa_testing.bat
```

And start testing! 🧪✨

---

**For more help:** See `QA_TESTING_GUIDE.md`

**Last Updated:** August 15, 2026
