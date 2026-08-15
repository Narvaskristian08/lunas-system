#!/bin/bash
# Train YOLOv8n on RDD2022 with live progress updates

cd /Users/deb/Desktop/lunas-system/lunas_ai
source venv/bin/activate

echo "=========================================="
echo "LUNAS AI - Training YOLOv8n on RDD2022"
echo "=========================================="
echo ""
echo "Model: YOLOv8n (smallest, fastest)"
echo "Dataset: RDD2022 (38,385 images)"
echo "Epochs: 30 (reduced for 8GB RAM)"
echo "Batch: 8"
echo "Device: CPU (more stable than MPS)"
echo ""
echo "Starting training..."
echo ""

# Run training with unbuffered output so we can see progress
python -u train.py --model yolov8n --dataset rdd2022 --epochs 30 --batch 8 --device cpu 2>&1 | tee train_live.log

echo ""
echo "=========================================="
echo "Training Complete!"
echo "=========================================="
