#!/bin/bash

echo "=========================================="
echo "🌿 LUNAS AI - Environmental Hazards Training"
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

# Check dataset
if [ ! -f "datasets/env_hazards_4class/data.yaml" ]; then
    echo "❌ Filtered dataset not found!"
    echo "Please run: python filter_env_hazards.py"
    exit 1
fi

echo "✅ Dataset found: datasets/env_hazards_4class/"
echo ""

# Display training info
echo "📊 Training Configuration:"
echo "  Model: YOLOv8n"
echo "  Classes: 4 (fallen_tree, fire_source, garbage_pileup, open_manhole)"
echo "  Epochs: 100"
echo "  Device: MPS (Apple M1)"
echo "  Batch size: 8"
echo "  Train images: 2,418"
echo "  Valid images: 106"
echo ""
echo "⏱️  Expected duration: ~3-4 hours"
echo ""
echo "Starting training..."
echo "=========================================="
echo ""

# Run training with nice priority
nice -n 10 python train_env_hazards.py 2>&1 | tee train_env_hazards.log

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Training completed successfully!"
    echo "=========================================="
    echo ""
    echo "📦 Model saved to: models/yolov8n-env-hazards-best.pt"
    echo "📊 Training logs: train_env_hazards.log"
    echo "📁 Training artifacts: runs/train/env_hazards_yolov8n/"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ Training failed!"
    echo "=========================================="
    echo ""
    echo "Check logs: train_env_hazards.log"
    echo ""
    exit 1
fi
