#!/bin/bash

# LUNAS AI - QA Testing Startup Script
# This script starts the AI service and opens the QA testing GUI

echo "=========================================="
echo "🌙 LUNAS AI - QA Testing Environment"
echo "=========================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

# Check if trained model exists
if [ ! -f "models/yolov8n-rdd2022-best.pt" ]; then
    echo "⚠️  Trained model not found!"
    echo "Checking for trained weights..."
    
    if [ -f "../runs/detect/runs/train/rdd2022_yolov8n_small/weights/best.pt" ]; then
        echo "✅ Found trained model, copying..."
        cp ../runs/detect/runs/train/rdd2022_yolov8n_small/weights/best.pt models/yolov8n-rdd2022-best.pt
        echo "✅ Model copied successfully!"
    else
        echo "❌ Trained model not found! Please train the model first."
        exit 1
    fi
fi

# Check model size
MODEL_SIZE=$(ls -lh models/yolov8n-rdd2022-best.pt | awk '{print $5}')
echo "✅ Using trained model: yolov8n-rdd2022-best.pt ($MODEL_SIZE)"
echo ""

# Start the API server in background
echo "🚀 Starting AI API server on http://localhost:5001"
python app.py &
API_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server started successfully
if curl -s http://localhost:5001/api/v1/health > /dev/null; then
    echo "✅ API server is running (PID: $API_PID)"
else
    echo "❌ Failed to start API server"
    kill $API_PID 2>/dev/null
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ QA Testing Environment Ready!"
echo "=========================================="
echo ""
echo "📊 API Server: http://localhost:5001"
echo "🧪 QA Test GUI: Open qa_test_gui.html in your browser"
echo ""
echo "To open the GUI:"
echo "  macOS:   open qa_test_gui.html"
echo "  Linux:   xdg-open qa_test_gui.html"
echo "  Windows: start qa_test_gui.html"
echo ""
echo "API Endpoints:"
echo "  - Health Check: http://localhost:5001/api/v1/health"
echo "  - Detection:    http://localhost:5001/api/v1/detect"
echo "  - Categories:   http://localhost:5001/api/v1/categories"
echo ""
echo "📝 API Documentation: http://localhost:5001/api/v1/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="
echo ""

# Open the GUI in default browser
if command -v open > /dev/null; then
    # macOS
    open qa_test_gui.html
elif command -v xdg-open > /dev/null; then
    # Linux
    xdg-open qa_test_gui.html
elif command -v start > /dev/null; then
    # Windows Git Bash
    start qa_test_gui.html
fi

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping API server...'; kill $API_PID 2>/dev/null; echo '✅ Server stopped'; exit 0" INT

# Keep script running
wait $API_PID
