@echo off
REM LUNAS AI - QA Testing Startup Script (Windows)
REM This script starts the AI service and opens the QA testing GUI

echo ==========================================
echo 🌙 LUNAS AI - QA Testing Environment
echo ==========================================
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Virtual environment not found!
    echo Please run: python -m venv venv
    echo Then: venv\Scripts\activate
    echo Then: pip install -r requirements.txt
    pause
    exit /b 1
)

REM Activate virtual environment
echo ✅ Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if trained model exists
if not exist "models\yolov8n-rdd2022-best.pt" (
    echo ⚠️  Trained model not found!
    echo Checking for trained weights...
    
    if exist "..\runs\detect\runs\train\rdd2022_yolov8n_small\weights\best.pt" (
        echo ✅ Found trained model, copying...
        copy "..\runs\detect\runs\train\rdd2022_yolov8n_small\weights\best.pt" "models\yolov8n-rdd2022-best.pt"
        echo ✅ Model copied successfully!
    ) else (
        echo ❌ Trained model not found! Please train the model first.
        pause
        exit /b 1
    )
)

REM Get model size (Windows version)
echo ✅ Using trained model: yolov8n-rdd2022-best.pt
echo.

REM Start the API server in background
echo 🚀 Starting AI API server on http://localhost:5001
start /B python app.py

REM Wait for server to start
echo ⏳ Waiting for server to start...
timeout /t 5 /nobreak >nul

REM Check if server started (simplified for Windows)
echo ✅ API server starting...

echo.
echo ==========================================
echo ✅ QA Testing Environment Ready!
echo ==========================================
echo.
echo 📊 API Server: http://localhost:5001
echo 🧪 QA Test GUI: Opening qa_test_gui.html
echo.
echo API Endpoints:
echo   - Health Check: http://localhost:5001/api/v1/health
echo   - Detection:    http://localhost:5001/api/v1/detect
echo   - Categories:   http://localhost:5001/api/v1/categories
echo.
echo 📝 API Documentation: http://localhost:5001/api/v1/docs
echo.
echo Press Ctrl+C to stop the server
echo ==========================================
echo.

REM Open the GUI in default browser (Windows)
start qa_test_gui.html

echo GUI opened in browser!
echo Server is running... Press Ctrl+C to stop
echo.

REM Keep window open
pause
