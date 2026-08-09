#!/bin/bash

# LUNAS AI - Quick Start Script
# Run this to set up everything automatically

echo "=========================================="
echo "LUNAS AI - Quick Setup"
echo "=========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version
if [ $? -ne 0 ]; then
    echo "❌ Python 3 not found. Please install Python 3.10+"
    exit 1
fi
echo "✅ Python found"
echo ""

# Create virtual environment
echo "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Install dependencies
echo "Installing dependencies (this may take 3-5 minutes)..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo ""

# Create .env if not exists
echo "Setting up configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi
echo ""

# Create necessary directories
echo "Creating directories..."
mkdir -p models logs cache datasets
echo "✅ Directories ready"
echo ""

echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "To start the AI service:"
echo "  1. source venv/bin/activate"
echo "  2. python app.py"
echo ""
echo "Then test it:"
echo "  curl http://localhost:5001/api/v1/health"
echo ""
echo "Or run the test script:"
echo "  python test_api.py"
echo ""
echo "📚 Documentation:"
echo "  - QUICK_START.md - 5-minute guide"
echo "  - README.md - Full API documentation"
echo "  - RDD2022_SETUP.md - Dataset preparation"
echo "  - FINAL_SUMMARY.md - Complete overview"
echo ""
echo "🚀 Ready to go!"
echo "=========================================="
