# 📦 LUNAS AI - Datasets

This directory is for storing training and testing datasets. The datasets are **not included in the repository** due to their large size (63GB for RDD2022).

---

## 🗂️ Directory Structure

```
datasets/
├── README.md          ← You are here
├── .gitkeep          ← Keeps folder in git
├── rdd2022/          ← Road Damage Dataset 2022 (user must download)
└── electrical/damage/  ← Generated locally; never committed
```

## ⚡ Electrical Model: Damage Only

The backend `electrical` category uses only explicit fault/damage bounding
boxes. The preparation utility downloads the selected source archives into the
ignored `.cache` directory and combines them into a local YOLO export:

```bash
cd lunas_ai
python tools/prepare_electrical_damage.py
```

The selected sources are the transmission-line fault subset of the [Power
Equipment Image Dataset](https://huggingface.co/datasets/sxiong/Power-equipment-image-dataset)
(MIT) and [Cable Damage](https://huggingface.co/datasets/LibreYOLO/cable-damage)
(CC BY 4.0). The output contains only their documented fault labels. InsPLAD
detection, pole-only, and intact-component datasets are intentionally excluded
because they highlight assets rather than damage.

The training utility requires the local `yolov8n.pt` checkpoint and does not
download it automatically:

```bash
cd lunas_ai
python train_electrical_damage.py
```

The output is `models/electrical/electricpole/best.pt`. If it is absent or
inference fails, the backend returns an unavailable/manual-review result and
does not substitute a road, environmental, or other category model.

---

## 📥 Download RDD2022 Dataset

The system uses the **Road Damage Dataset 2022 (RDD2022)** for training the road damage detection model.

### Option 1: Official Source (Recommended)

**Dataset:** RDD2022 - Road Damage Detection Dataset  
**Size:** ~38,385 images (~60GB extracted)  
**Source:** [Crowdsensing-based Road Damage Detection Challenge (CRDDC2022)](https://crddc2022.sekilab.global/)

**Download Link:**  
https://github.com/sekilab/RoadDamageDetector/

**Steps:**
1. Visit the official GitHub repository
2. Download the RDD2022 dataset (ZIP file)
3. Extract to `lunas_ai/datasets/rdd2022/`

### Option 2: Alternative Sources

**Zenodo:**  
https://zenodo.org/record/7396295

**Kaggle:**  
https://www.kaggle.com/datasets/sakshaymahna/road-damage-detection-dataset-2022

---

## 📂 Expected Structure After Download

After downloading and extracting, your directory should look like this:

```
datasets/rdd2022/
├── train/
│   ├── images/
│   │   ├── China_Drone/
│   │   ├── China_MotorBike/
│   │   ├── Czech/
│   │   ├── India/
│   │   ├── Japan/
│   │   └── Norway/
│   └── labels/
│       └── (corresponding .txt files)
├── valid/
│   ├── images/
│   └── labels/
└── test/
    ├── images/
    └── labels/
```

---

## 🏷️ Dataset Information

### Classes (4 types of road damage)

| Class ID | Name | Description |
|----------|------|-------------|
| D00 | Longitudinal Crack | Linear cracks parallel to road direction |
| D10 | Transverse Crack | Linear cracks perpendicular to road direction |
| D20 | Alligator Crack | Interconnected cracks resembling alligator skin |
| D40 | Pothole | Bowl-shaped holes in pavement |

### Statistics

- **Total Images:** ~38,385
- **Countries:** 6 (China, Czech Republic, India, Japan, Norway, USA)
- **Annotation Format:** YOLO format (class x_center y_center width height)
- **Image Size:** Variable (typically 600x600 to 4032x3024)

---

## 🚀 Quick Setup

### 1. Download Dataset

```bash
# Navigate to datasets directory
cd lunas_ai/datasets

# Download RDD2022 (example with wget)
wget https://path-to-rdd2022-dataset.zip

# Extract
unzip rdd2022-dataset.zip -d rdd2022/
```

### 2. Verify Structure

```bash
# Check if structure is correct
ls -la rdd2022/train/images/
ls -la rdd2022/train/labels/
ls -la rdd2022/valid/images/
```

### 3. Update config.yaml

The `config.yaml` in the parent directory should already point to the correct paths:

```yaml
datasets:
  rdd2022:
    path: "./datasets/rdd2022"
    train: "train/images"
    val: "valid/images"
    test: "test/images"
    names:
      0: "D00"  # Longitudinal Crack
      1: "D10"  # Transverse Crack
      2: "D20"  # Alligator Crack
      3: "D40"  # Pothole
```

---

## 🔧 Alternative: Use Pre-trained Model Only

If you **don't want to train** and only want to **use the pre-trained model** for testing:

1. **Skip downloading the dataset** (saves 60GB)
2. Use the included trained model: `models/yolov8n-rdd2022-best.pt`
3. Run the QA testing: `./start_qa_testing.sh`

The pre-trained model was already trained on RDD2022 (30% subset, 50 epochs).

---

## 🎓 Training from Scratch

If you want to re-train the model:

### Using Full Dataset (100%)

```bash
# After downloading dataset
cd lunas_ai
python train.py
```

**Requirements:**
- 16GB+ RAM
- 4-8 hours on GPU (or 2-3 days on CPU)

### Using Subset (30% - Faster)

```bash
# Train on 30% of data
python train_small.py
```

**Requirements:**
- 8GB+ RAM
- 1-2 hours on GPU (or 4-5 days on CPU M1)

---

## 📊 Dataset Citation

If you use RDD2022 in your research or project, please cite:

```bibtex
@article{arya2021rdd2022,
  title={RDD2022: A multi-national image dataset for automatic Road Damage Detection},
  author={Arya, Deeksha and Maeda, Hiroya and Ghosh, Sanjay Kumar and others},
  journal={arXiv preprint arXiv:2209.08538},
  year={2022}
}
```

**Official Paper:**  
https://arxiv.org/abs/2209.08538

---

## 🔒 License

**RDD2022 License:** Creative Commons Attribution 4.0 International (CC BY 4.0)

You are free to:
- Share — copy and redistribute
- Adapt — remix, transform, and build upon

**Attribution:** Always credit the RDD2022 creators in your work.

---

## ❓ FAQ

### Q: Do I need the dataset to run the AI service?

**A:** No! The trained model (`yolov8n-rdd2022-best.pt`) is included. You only need the dataset if you want to **re-train** the model.

---

### Q: Can I use a different dataset?

**A:** Yes! You can train on any YOLO-format dataset. Just:
1. Place your dataset in `datasets/your_dataset/`
2. Update `config.yaml` with your dataset path
3. Run `python train.py`

---

### Q: The dataset is too large for my storage. What should I do?

**A:** Use the pre-trained model! It's already trained and ready to use. The dataset is only needed for training.

---

### Q: How do I verify the dataset is correct?

```bash
# Check image count
find datasets/rdd2022/train/images -type f | wc -l

# Check label count
find datasets/rdd2022/train/labels -type f | wc -l

# They should match!
```

---

## 📞 Support

For dataset-related issues:
- **Official RDD2022:** https://github.com/sekilab/RoadDamageDetector/issues
- **LUNAS Project:** Check project documentation or contact the dev team

---

**Happy Training! 🚀**

*Last Updated: August 15, 2026*
