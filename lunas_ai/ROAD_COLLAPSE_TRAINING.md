# 🌉 LUNAS AI - Road Collapse Training Guide

## Dataset Information

**Source:** road_collapse.v1i.yolov8.zip  
**License:** CC BY 4.0  
**Classes:** 2  
- `bridge collapse` - Collapsed bridge structures
- `road collapse` - Collapsed road surfaces

### Dataset Split
- **Training:** 578 images (88.8%)
- **Validation:** 37 images (5.7%)
- **Test:** 36 images (5.5%)
- **Total:** 651 images

---

## Training Configuration

| Parameter | Value | Why |
|-----------|-------|-----|
| **Model** | YOLOv8n | Fast, lightweight (3M params) |
| **Epochs** | 100 | Full training (2x previous) |
| **Batch Size** | 8 | Stable on M1 8GB RAM |
| **Image Size** | 640x640 | Standard YOLO input |
| **Device** | MPS/CPU | Auto-detect (M1 GPU or CPU) |
| **Optimizer** | AdamW | Better convergence |
| **Learning Rate** | 0.001 | Standard for fine-tuning |
| **Patience** | 50 | Early stopping after 50 epochs |
| **Save Period** | 10 | Save checkpoint every 10 epochs |

---

## Quick Start

### Option 1: Interactive Script (Recommended)

```bash
cd /Users/deb/Desktop/lunas-system/lunas_ai
./start_training_road_collapse.sh
```

The script will:
1. ✅ Check virtual environment
2. ✅ Check dataset exists
3. ⚠️ Ask for confirmation
4. 🚀 Start training
5. 💾 Save model to `models/yolov8n-road-collapse-best.pt`

### Option 2: Direct Python

```bash
cd /Users/deb/Desktop/lunas-system/lunas_ai
source venv/bin/activate
python train_road_collapse.py
```

---

## Monitoring Training

### View Live Logs
```bash
tail -f logs/lunas_ai.log
```

### Check Progress Files
```bash
# Training progress
ls -lh runs/train/road_collapse_yolov8n/

# Weights (saved every 10 epochs)
ls -lh runs/train/road_collapse_yolov8n/weights/
```

### What to Look For

**Good Training:**
- Loss decreasing over time
- mAP@50 increasing (aim for >0.60)
- Validation loss close to training loss

**Problems:**
- Loss not decreasing after 20+ epochs
- Validation loss >> training loss (overfitting)
- Loss = NaN (learning rate too high)

---

## Expected Training Time

| Device | Estimated Time | Speed |
|--------|---------------|-------|
| **M1 MPS (GPU)** | 4-6 hours | ~2-3 min/epoch |
| **M1 CPU** | 8-12 hours | ~5-7 min/epoch |
| **Intel CPU** | 12-18 hours | ~7-10 min/epoch |

**Progress updates every ~30 minutes**

---

## Expected Results

### With 100 Epochs + 651 Images:

| Metric | Expected Range | Good Performance |
|--------|---------------|------------------|
| **mAP@50** | 0.60 - 0.85 | >0.70 ✅ |
| **mAP@50-95** | 0.40 - 0.65 | >0.50 ✅ |
| **Precision** | 0.65 - 0.90 | >0.75 ✅ |
| **Recall** | 0.60 - 0.85 | >0.70 ✅ |
| **Final Loss** | 0.8 - 1.5 | <1.2 ✅ |

**Note:** Results should be MUCH better than RDD2022 training because:
- Smaller dataset (easier to learn)
- Only 2 classes (vs 4)
- 100 epochs (vs 50)
- More focused problem

---

## Output Files

### After Training Completes:

```
models/
└── yolov8n-road-collapse-best.pt  ← Main output (6-7 MB)

runs/train/road_collapse_yolov8n/
├── weights/
│   ├── best.pt      ← Best model (lowest val loss)
│   ├── last.pt      ← Last epoch model
│   └── epoch*.pt    ← Checkpoints every 10 epochs
├── results.png      ← Training curves
├── confusion_matrix.png
├── F1_curve.png
├── PR_curve.png
├── P_curve.png
├── R_curve.png
└── args.yaml        ← Training configuration
```

---

## Using the Trained Model

### 1. Update Config

Edit `config.yaml`:

```yaml
models:
  road_collapse:
    name: "YOLOv8n Road Collapse Detection"
    path: "models/yolov8n-road-collapse-best.pt"
    type: "detection"
    classes:
      - bridge_collapse
      - road_collapse
    confidence_threshold: 0.35
    iou_threshold: 0.45
    input_size: 640
```

### 2. Test Detection

```bash
python test_detection.py
```

### 3. Update Detection Service

Edit `src/services/detection_service.py` to add road collapse detection method.

---

## Troubleshooting

### Training Crashes

**Problem:** Out of memory  
**Solution:** Reduce batch size to 4:
```python
'batch': 4
```

**Problem:** Training too slow  
**Solution:** Use CPU if MPS is slow:
```python
'device': 'cpu'
```

### Low Accuracy

**Problem:** mAP@50 < 0.50 after 100 epochs  
**Solutions:**
1. Train for more epochs (150)
2. Increase batch size to 16 (if RAM allows)
3. Add more augmentation
4. Check dataset quality

### Loss = NaN

**Problem:** Loss becomes NaN  
**Solution:** Lower learning rate:
```python
'lr0': 0.0005
```

---

## Stopping Training

### Graceful Stop (Recommended)
Press **Ctrl+C** once - will save current progress and exit

### Force Stop (Not Recommended)
Press **Ctrl+C** twice - immediate kill, may lose progress

### Resume Training
If training stops, you can resume from the last checkpoint:
```python
model = YOLO('runs/train/road_collapse_yolov8n/weights/last.pt')
model.train(resume=True)
```

---

## After Training

### 1. Evaluate Performance
```bash
# View training curves
open runs/train/road_collapse_yolov8n/results.png

# Check confusion matrix
open runs/train/road_collapse_yolov8n/confusion_matrix.png
```

### 2. Test on Sample Images
```bash
python -c "
from ultralytics import YOLO
model = YOLO('models/yolov8n-road-collapse-best.pt')
results = model.predict('path/to/test/image.jpg', save=True)
"
```

### 3. Compare with Baseline
- **Baseline:** No trained model (use yolov8n.pt)
- **Your Model:** yolov8n-road-collapse-best.pt
- **Expected Improvement:** 50-80% better accuracy

---

## Next Steps

1. ✅ Train model (100 epochs)
2. ✅ Evaluate results (check mAP@50)
3. ✅ Copy to `models/` directory
4. ⬜ Update `config.yaml`
5. ⬜ Add detection endpoint
6. ⬜ Test with QA GUI
7. ⬜ Deploy to production

---

## Questions?

**Is 100 epochs enough?**  
Yes, for 651 images. More epochs may overfit.

**Can I train with more data?**  
Yes! More data = better accuracy. Add to `datasets/road_collapse/train/`

**Should I use YOLOv8s instead of YOLOv8n?**  
YOLOv8s is more accurate but 3x slower. YOLOv8n is good for real-time.

**Can I train on GPU?**  
Yes! The script auto-detects M1 MPS. On NVIDIA, it uses CUDA.

---

## Ready to Train!

```bash
cd /Users/deb/Desktop/lunas-system/lunas_ai
./start_training_road_collapse.sh
```

**Good luck!** 🚀🌉

---

*Last Updated: August 24, 2026*
