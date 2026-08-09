# RDD2022 Dataset Setup Guide 📊

Complete guide for preparing the RDD2022 (Road Damage Dataset 2022) for training.

---

## 📋 About RDD2022

**RDD2022** is the largest public road damage dataset with images from:
- 🇯🇵 Japan
- 🇮🇳 India  
- 🇨🇿 Czech Republic
- 🇺🇸 USA

**Classes (4 types):**
1. **Longitudinal Cracks (D00)** - Cracks parallel to traffic direction
2. **Transverse Cracks (D10)** - Cracks perpendicular to traffic direction
3. **Alligator Cracks (D20)** - Interconnected crack patterns
4. **Potholes (D40)** - Bowl-shaped depressions

**Dataset Size:**
- ~47,000 images total
- Multiple countries and conditions
- Pre-annotated in YOLO format

---

## 📥 Step 1: Download RDD2022

### Option A: Official Source (Recommended)

```bash
# 1. Visit the official RDD2022 GitHub
# https://github.com/sekilab/RoadDamageDetector

# 2. Download from Google Drive or Zenodo
# The dataset is ~15GB compressed

# 3. Or use wget (if direct link available)
cd /Users/deb/Desktop/lunas-system/lunas_ai/datasets
wget [DOWNLOAD_URL] -O rdd2022.zip
```

### Option B: Roboflow (Easier)

```bash
# Visit: https://universe.roboflow.com/road-damage/rdd2022
# Download in YOLO format
# Already split into train/val/test
```

---

## 📁 Step 2: Extract and Organize

Your target structure:

```
lunas_ai/datasets/rdd2022/
├── data.yaml              # Dataset configuration (you'll create this)
│
├── images/
│   ├── train/            # Training images
│   │   ├── image1.jpg
│   │   ├── image2.jpg
│   │   └── ...
│   ├── val/              # Validation images
│   │   ├── image1.jpg
│   │   └── ...
│   └── test/             # Test images (optional)
│       └── ...
│
└── labels/
    ├── train/            # Training labels (YOLO format)
    │   ├── image1.txt
    │   ├── image2.txt
    │   └── ...
    ├── val/              # Validation labels
    │   └── ...
    └── test/             # Test labels (optional)
        └── ...
```

### Extract Commands

```bash
cd /Users/deb/Desktop/lunas-system/lunas_ai/datasets

# Extract the downloaded file
unzip rdd2022.zip -d rdd2022/

# Or if it's tar.gz
tar -xzf rdd2022.tar.gz -d rdd2022/

# Check structure
ls -la rdd2022/
```

---

## 📝 Step 3: Create data.yaml

Create the YOLO configuration file:

```bash
cd /Users/deb/Desktop/lunas-system/lunas_ai/datasets/rdd2022
nano data.yaml
```

**Paste this content:**

```yaml
# RDD2022 Dataset Configuration for LUNAS AI
# Road Damage Detection Dataset 2022

# Dataset paths (relative to this file)
path: ../datasets/rdd2022  # Root directory
train: images/train        # Training images
val: images/val           # Validation images
test: images/test         # Test images (optional)

# Number of classes
nc: 4

# Class names (RDD2022 standard)
names:
  0: longitudinal_crack  # D00 - Parallel to traffic
  1: transverse_crack    # D10 - Perpendicular to traffic
  2: alligator_crack     # D20 - Interconnected patterns
  3: pothole             # D40 - Bowl-shaped holes

# Dataset info
dataset: RDD2022
version: 2022
source: https://github.com/sekilab/RoadDamageDetector
description: Multi-national road damage dataset for infrastructure maintenance

# Training settings (optional - can override in train.py)
download: false  # Already downloaded
```

Save and close (Ctrl+X, Y, Enter)

---

## ✅ Step 4: Verify Dataset

Run this verification script:

```bash
cd /Users/deb/Desktop/lunas-system/lunas_ai

# Create verification script
cat > verify_dataset.py << 'EOF'
"""Verify RDD2022 dataset structure"""
import os
from pathlib import Path

dataset_path = Path('datasets/rdd2022')

print("="*60)
print("RDD2022 Dataset Verification")
print("="*60)

# Check main directory
if not dataset_path.exists():
    print("❌ Dataset directory not found!")
    print(f"   Expected: {dataset_path.absolute()}")
    exit(1)

print(f"✅ Dataset directory found: {dataset_path.absolute()}\n")

# Check data.yaml
data_yaml = dataset_path / 'data.yaml'
if not data_yaml.exists():
    print("❌ data.yaml not found!")
    print("   Create it following Step 3 above")
    exit(1)

print("✅ data.yaml found\n")

# Check directories
required_dirs = [
    'images/train',
    'images/val',
    'labels/train',
    'labels/val'
]

for dir_name in required_dirs:
    dir_path = dataset_path / dir_name
    if not dir_path.exists():
        print(f"❌ Missing: {dir_name}")
        print(f"   Expected: {dir_path.absolute()}")
        exit(1)
    
    # Count files
    files = list(dir_path.glob('*.*'))
    print(f"✅ {dir_name}: {len(files)} files")

# Verify label-image pairs
print("\n" + "="*60)
print("Checking label-image pairs...")
print("="*60)

for split in ['train', 'val']:
    img_dir = dataset_path / 'images' / split
    lbl_dir = dataset_path / 'labels' / split
    
    images = {f.stem for f in img_dir.glob('*.jpg')}
    labels = {f.stem for f in lbl_dir.glob('*.txt')}
    
    missing_labels = images - labels
    extra_labels = labels - images
    
    print(f"\n{split.upper()} split:")
    print(f"  Images: {len(images)}")
    print(f"  Labels: {len(labels)}")
    print(f"  Matched pairs: {len(images & labels)}")
    
    if missing_labels:
        print(f"  ⚠️  {len(missing_labels)} images without labels")
    if extra_labels:
        print(f"  ⚠️  {len(extra_labels)} labels without images")
    
    if not missing_labels and not extra_labels:
        print(f"  ✅ All pairs matched!")

print("\n" + "="*60)
print("✅ Dataset verification complete!")
print("="*60)
print("\nYou can now run: python train.py --model yolov8s --dataset rdd2022")
EOF

python verify_dataset.py
```

Expected output:
```
============================================================
RDD2022 Dataset Verification
============================================================
✅ Dataset directory found: /Users/deb/Desktop/lunas-system/lunas_ai/datasets/rdd2022

✅ data.yaml found

✅ images/train: 33750 files
✅ images/val: 9450 files
✅ labels/train: 33750 files
✅ labels/val: 9450 files

============================================================
Checking label-image pairs...
============================================================

TRAIN split:
  Images: 33750
  Labels: 33750
  Matched pairs: 33750
  ✅ All pairs matched!

VAL split:
  Images: 9450
  Labels: 9450
  Matched pairs: 9450
  ✅ All pairs matched!

============================================================
✅ Dataset verification complete!
============================================================

You can now run: python train.py --model yolov8s --dataset rdd2022
```

---

## 🎯 Step 5: Start Training

Once dataset is verified:

```bash
cd /Users/deb/Desktop/lunas-system/lunas_ai
source venv/bin/activate

# Basic training (recommended settings)
python train.py --model yolov8s --dataset rdd2022 --epochs 100

# Fast training (for testing)
python train.py --model yolov8n --dataset rdd2022 --epochs 50 --batch 8

# High accuracy training
python train.py --model yolov8m --dataset rdd2022 --epochs 150 --batch 8
```

**Training will:**
- Use your M1 GPU automatically (MPS)
- Take 6-10 hours for 100 epochs
- Save checkpoints every 10 epochs
- Save best model to `models/yolov8s-rdd2022-best.pt`

---

## 📊 Expected Results

After training 100 epochs on RDD2022:

| Model | mAP@0.5 | Precision | Recall | Size | Speed (M1) |
|-------|---------|-----------|--------|------|------------|
| YOLOv8n | ~91% | ~90% | ~81% | 6MB | 0.5s |
| YOLOv8s | ~93.5% | ~92% | ~86% | 23MB | 0.8s |
| YOLOv8m | ~95% | ~93% | ~88% | 52MB | 1.2s |

---

## 🔍 Monitoring Training

### View Progress

```bash
# Training logs (real-time)
tail -f runs/train/rdd2022_yolov8s/train.log

# Or check logs directory
tail -f logs/lunas_ai.log
```

### TensorBoard (Optional)

```bash
# Install tensorboard
pip install tensorboard

# View training metrics
tensorboard --logdir runs/train
# Open browser: http://localhost:6006
```

---

## ⚠️ Common Issues

### Issue 1: Dataset Not Found

```
Error: Dataset configuration not found
```

**Solution:**
```bash
# Make sure data.yaml exists
ls -la datasets/rdd2022/data.yaml

# Check paths in data.yaml are correct
cat datasets/rdd2022/data.yaml
```

### Issue 2: Out of Memory

```
RuntimeError: CUDA out of memory
```

**Solution:**
```bash
# Reduce batch size
python train.py --model yolov8s --batch 8  # Instead of 16

# Or use smaller model
python train.py --model yolov8n
```

### Issue 3: Slow Training

**Speed up:**
```bash
# Use smaller image size
python train.py --model yolov8s --imgsz 416  # Instead of 640

# Reduce workers
# Edit train.py: workers=2
```

### Issue 4: Label Format Error

```
Error: Invalid label format
```

**Check label format:**
```bash
# Labels should be in YOLO format:
# class x_center y_center width height (all normalized 0-1)

# Example label file (labels/train/image1.txt):
# 0 0.5 0.5 0.3 0.2
# 3 0.7 0.3 0.1 0.15

# View a label file
head -5 datasets/rdd2022/labels/train/$(ls datasets/rdd2022/labels/train | head -1)
```

---

## 📈 After Training

### 1. Test the Model

```bash
# Test on validation set
cd lunas_ai
python -c "
from ultralytics import YOLO
model = YOLO('models/yolov8s-rdd2022-best.pt')
metrics = model.val(data='datasets/rdd2022/data.yaml')
print(f'mAP@0.5: {metrics.box.map50:.3f}')
print(f'mAP@0.5:0.95: {metrics.box.map:.3f}')
"
```

### 2. Update Configuration

Edit `config.yaml`:
```yaml
models:
  road_damage:
    path: "models/yolov8s-rdd2022-best.pt"  # Your trained model
```

### 3. Restart Service

```bash
# Stop current service (Ctrl+C)
# Start with new model
python app.py
```

### 4. Test Detection

```bash
# Test API
curl -X POST \
  -F "image=@test_road.jpg" \
  http://localhost:5001/api/v1/detect/road-damage
```

---

## 📝 Quick Reference

### Dataset Structure (Final)
```
rdd2022/
├── data.yaml           ← Configuration
├── images/
│   ├── train/ (33K)   ← Training images
│   └── val/ (9K)      ← Validation images
└── labels/
    ├── train/ (33K)   ← Training labels
    └── val/ (9K)      ← Validation labels
```

### Training Command
```bash
python train.py --model yolov8s --dataset rdd2022 --epochs 100
```

### Expected Time
- **YOLOv8n:** ~4 hours
- **YOLOv8s:** ~6-8 hours  ⭐ Recommended
- **YOLOv8m:** ~10-12 hours

### Output Files
```
models/yolov8s-rdd2022-best.pt     ← Best model weights
runs/train/rdd2022_yolov8s/        ← Training outputs
logs/lunas_ai.log                  ← Training logs
```

---

## 🎓 Tips for Best Results

1. **Start Small:** Train yolov8n first (faster) to verify everything works
2. **Monitor:** Watch training logs to catch errors early
3. **Patience:** Let it train overnight, don't interrupt
4. **Save Checkpoints:** Already configured (every 10 epochs)
5. **Validate:** Test on validation set before deploying

---

## ✅ Checklist

Before training, verify:
- [ ] Dataset downloaded and extracted
- [ ] `data.yaml` created with correct paths
- [ ] Directory structure matches template
- [ ] Image-label pairs verified
- [ ] Virtual environment activated
- [ ] Enough disk space (~20GB)
- [ ] Enough time (6-8 hours)

---

**Ready to train! 🚀**

**Next step:** Download RDD2022 and place it in `datasets/rdd2022/`

**Questions?** Check `README.md` or run `python verify_dataset.py`
