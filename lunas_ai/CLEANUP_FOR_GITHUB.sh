#!/bin/bash
# LUNAS AI - GitHub Cleanup Script
# This script removes temporary files, logs, cache, and large datasets
# while preserving the essential code and trained model

set -e

echo "🧹 LUNAS AI - Cleaning for GitHub"
echo "=================================="
echo ""

# Confirm before proceeding
read -p "This will delete logs, cache, training artifacts, and datasets (63GB). Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

echo "🚀 Starting cleanup..."
echo ""

# Remove Python cache
echo "🗑️  Removing Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true
find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true

# Remove virtual environment (users will create their own)
if [ -d "venv" ]; then
    echo "🗑️  Removing virtual environment (venv/)..."
    rm -rf venv/
fi

# Remove logs (keep .gitkeep)
echo "🗑️  Removing log files..."
find logs/ -type f -name "*.log" -delete 2>/dev/null || true
rm -f train_live.log train_output.log train_small.log training.log train_pid.txt 2>/dev/null || true

# Remove cache
echo "🗑️  Removing cache..."
if [ -d "cache/inference" ]; then
    rm -rf cache/inference/
fi
if [ -d "models/cache" ]; then
    rm -rf models/cache/
fi

# Remove YOLO base models (auto-downloaded on first use)
echo "🗑️  Removing base YOLO models (will auto-download when needed)..."
rm -f yolov8n.pt yolov8s.pt yolov8m.pt yolov8l.pt yolov8x.pt 2>/dev/null || true

# Remove training artifacts from runs/ directory
if [ -d "../runs" ]; then
    echo "🗑️  Removing training artifacts (runs/)..."
    rm -rf ../runs/
fi

# Remove datasets (63GB - users should download separately)
echo "🗑️  Removing datasets (63GB)..."
if [ -d "datasets/rdd2022" ]; then
    # Keep only the .gitkeep and README
    find datasets/rdd2022 -mindepth 1 ! -name ".gitkeep" ! -name "README.md" -exec rm -rf {} + 2>/dev/null || true
fi

# Remove temporary files
echo "🗑️  Removing temporary files..."
find . -type f \( -name "*.tmp" -o -name "*.bak" -o -name "*.swp" -o -name "*~" \) -delete 2>/dev/null || true

# Remove OS files
echo "🗑️  Removing OS files..."
find . -type f -name ".DS_Store" -delete 2>/dev/null || true
find . -type f -name "Thumbs.db" -delete 2>/dev/null || true

# Remove IDE files
echo "🗑️  Removing IDE files..."
rm -rf .idea/ .vscode/ 2>/dev/null || true

# Remove .env if exists (should use .env.example)
if [ -f ".env" ]; then
    echo "⚠️  Found .env file - keeping it (add to .gitignore if it contains secrets)"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 What was kept:"
echo "  ✅ Source code (src/, app.py, etc.)"
echo "  ✅ Configuration (config.yaml, .env.example)"
echo "  ✅ Documentation (*.md files)"
echo "  ✅ Trained model (models/yolov8n-rdd2022-best.pt - 6MB)"
echo "  ✅ QA testing files (qa_test_gui.html, start scripts)"
echo "  ✅ Docker files (Dockerfile, .dockerignore)"
echo "  ✅ Requirements (requirements.txt)"
echo ""
echo "🗑️  What was removed:"
echo "  ❌ Virtual environment (venv/) - users will create their own"
echo "  ❌ Log files (*.log)"
echo "  ❌ Python cache (__pycache__, *.pyc)"
echo "  ❌ Training artifacts (runs/)"
echo "  ❌ Base YOLO models (*.pt) - auto-downloads on first use"
echo "  ❌ Cache directories"
echo "  ❌ Datasets (63GB) - users should download separately"
echo "  ❌ Temporary files"
echo ""
echo "📦 Directory is now ready for GitHub!"
echo ""

# Show final size
echo "📏 Current directory size:"
du -sh . 2>/dev/null | head -1
echo ""

echo "🎯 Next steps:"
echo "  1. Review the .gitignore file"
echo "  2. Create datasets/README.md with download instructions"
echo "  3. Test the setup with: pip install -r requirements.txt"
echo "  4. Run: git add . && git commit -m 'Add LUNAS AI service'"
echo ""
