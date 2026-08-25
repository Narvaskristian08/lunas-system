#!/bin/bash
# LUNAS AI - Start Road Collapse Training (100 epochs)

echo "=========================================="
echo "🌙 LUNAS AI - Road Collapse Training"
echo "=========================================="
echo ""
echo "Dataset: Road Collapse Detection"
echo "  - Train images: 578"
echo "  - Valid images: 37"
echo "  - Test images: 36"
echo "  - Classes: bridge collapse, road collapse"
echo ""
echo "Training Configuration:"
echo "  - Model: YOLOv8n"
echo "  - Epochs: 100"
echo "  - Batch: 8"
echo "  - Device: Auto-detect (MPS/CPU)"
echo ""
echo "⏱️  Estimated time:"
echo "  - On M1 CPU: ~8-12 hours"
echo "  - On M1 MPS: ~4-6 hours"
echo ""
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

# Check if dataset exists
if [ ! -f "datasets/road_collapse/data.yaml" ]; then
    echo "❌ Dataset not found!"
    echo "Please extract road_collapse.v1i.yolov8.zip to datasets/road_collapse/"
    exit 1
fi

echo "✅ Dataset found"
echo ""

# Confirm before starting
read -p "Start training? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Training cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting training..."
echo "📝 Logs: logs/lunas_ai.log"
echo "💾 Progress: runs/train/road_collapse_yolov8n/"
echo ""
echo "To monitor progress:"
echo "  tail -f logs/lunas_ai.log"
echo ""
echo "Press Ctrl+C to stop training (not recommended)"
echo ""

# Run training
python train_road_collapse.py

echo ""
echo "=========================================="
echo "✅ Training completed!"
echo "=========================================="
echo ""
echo "Model saved to: models/yolov8n-road-collapse-best.pt"
echo ""
echo "Next steps:"
echo "  1. Update config.yaml to use the new model"
echo "  2. Test with: python test_detection.py"
echo "  3. Deploy to production"
echo ""
