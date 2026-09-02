# 🎯 LUNAS AI - Confidence Level Guide

## Current Configuration

### Confidence Thresholds (config.yaml)

| Model | Threshold | Purpose |
|-------|-----------|---------|
| **Road Damage** | **0.25 (25%)** | Main detection - allows moderate confidence |
| Crack Segmentation | 0.30 (30%) | Slightly higher for segmentation |
| Privacy Detection | 0.40 (40%) | Higher threshold for privacy concerns |

---

## Where Confidence is Displayed

### 1. Individual Detection List
**Location:** In the "Detected Damages" card
**Shows:** Each damage type with its own confidence bar

```
🚧 Detected Damages (3)

1. D40 (Pothole)
   [████████████████████ 92.3%]  ← High confidence ✅

2. D10 (Transverse Crack)
   [███████████████ 78.5%]       ← Good confidence ✅

3. D00 (Longitudinal Crack)
   [██████████ 54.2%]            ← Moderate confidence ⚠️
```

### 2. Average Confidence Metric
**Location:** Top metrics dashboard
**Shows:** Average across all detections

```
Damage Count: 3
Avg Confidence: 75.0%  ← Overall confidence
Processing Time: 1234ms
Severity: Moderate
```

### 3. Bounding Box Labels
**Location:** On the annotated image
**Shows:** Class name + confidence percentage

```
[Image with boxes]
  D40 92%  ← Label on each box
  D10 79%
  D00 54%
```

---

## Confidence Interpretation

### High Confidence (70-100%) ✅
- **Meaning:** Model is very sure about the detection
- **Reliability:** Trust this detection
- **Action:** Safe to report this damage
- **Color:** Green (could add color-coding)

**Example:**
```
Pothole: 92.3%
```

### Medium Confidence (50-69%) ⚠️
- **Meaning:** Model is moderately confident
- **Reliability:** Probably correct but verify
- **Action:** Flag for manual review
- **Color:** Yellow (could add color-coding)

**Example:**
```
Longitudinal Crack: 54.2%
```

### Low Confidence (25-49%) ⚠️⚠️
- **Meaning:** Model is uncertain
- **Reliability:** May be false positive
- **Action:** Requires manual verification
- **Color:** Orange (could add color-coding)

**Example:**
```
Alligator Crack: 32.1%
```

### Below Threshold (<25%) ❌
- **Meaning:** Not confident enough
- **Reliability:** Likely false positive
- **Action:** Filtered out, not shown
- **Color:** N/A (not displayed)

---

## Why Different Confidence Levels?

### Factors Affecting Confidence:

1. **Image Quality**
   - Clear, well-lit image → Higher confidence
   - Blurry, dark image → Lower confidence

2. **Damage Visibility**
   - Large, obvious pothole → 90%+
   - Small, subtle crack → 30-60%

3. **Damage Type**
   - Potholes: Usually 70-95% (clear boundaries)
   - Longitudinal cracks: 50-80% (harder to detect)
   - Alligator cracks: 40-70% (complex patterns)
   - Transverse cracks: 60-85% (varies by clarity)

4. **Training Data**
   - Model trained on 30% of dataset
   - More training → higher confidence
   - Full dataset (100%) would improve this

5. **Model Size**
   - YOLOv8n (nano): Fast but lower accuracy
   - YOLOv8s (small): Better accuracy
   - YOLOv8m (medium): Even better

---

## Current Performance Expectations

### With YOLOv8n + 30% Dataset + 50 Epochs:

| Damage Type | Expected Confidence | Reliability |
|-------------|-------------------|-------------|
| **D40 (Pothole)** | 70-95% | ✅ High |
| **D10 (Transverse Crack)** | 60-85% | ✅ Good |
| **D20 (Alligator Crack)** | 40-70% | ⚠️ Moderate |
| **D00 (Longitudinal Crack)** | 50-80% | ⚠️ Moderate |

---

## Improving Confidence

### To Get Higher Confidence Scores:

1. **Train with More Data**
   ```bash
   # Use 100% of dataset instead of 30%
   python train.py  # instead of train_small.py
   ```
   Expected improvement: +5-15% confidence

2. **Train for More Epochs**
   ```yaml
   # config.yaml
   training:
     epochs: 100  # instead of 50
   ```
   Expected improvement: +3-8% confidence

3. **Use Larger Model**
   ```yaml
   # Use YOLOv8s or YOLOv8m instead of YOLOv8n
   model: yolov8s.pt
   ```
   Expected improvement: +5-10% confidence

4. **Better Image Quality**
   - Use high-resolution images (1920x1080+)
   - Ensure good lighting
   - Stable camera (no motion blur)
   Expected improvement: +10-20% confidence

5. **Lower Threshold (Trade-off)**
   ```yaml
   # config.yaml
   confidence_threshold: 0.20  # instead of 0.25
   ```
   Result: More detections but more false positives

---

## Recommended Settings for Production

### Conservative (High Precision)
```yaml
confidence_threshold: 0.60  # Only show high-confidence detections
```
- Fewer false positives
- May miss some real damages

### Balanced (Current)
```yaml
confidence_threshold: 0.25  # Show moderate+ confidence
```
- Good balance
- Some false positives expected

### Aggressive (High Recall)
```yaml
confidence_threshold: 0.15  # Show low-confidence detections
```
- Catches more damages
- Many false positives

---

## Visual Confidence Display (Current)

### In GUI:
```
🚧 Detected Damages (3)

1. D40 (Pothole)
   Confidence Bar: [████████████████████ 92.3%]
   ↑ Width = confidence percentage

2. D10 (Transverse Crack)
   Confidence Bar: [███████████████ 78.5%]
   
3. D00 (Longitudinal Crack)
   Confidence Bar: [██████████ 54.2%]
```

### On Image:
```
[Bounding Box with Label]
┌─────────────────┐
│ D40 92%        │ ← Class + Confidence
│                │
│   [Pothole]    │
│                │
└─────────────────┘
```

---

## Summary

✅ **What's Working:**
- Confidence is displayed for each detection
- Each damage has its own confidence score
- Average confidence calculated across all detections
- Confidence threshold (25%) filters out very low confidence detections

⚠️ **What to Expect:**
- Confidence varies by damage type (normal behavior)
- 50-90% range is typical with current model
- Lower confidence = requires verification
- Not all detections will be 90%+ (that's OK!)

🎯 **For Production:**
- Consider raising threshold to 0.40-0.50 for higher precision
- Add color-coding (green/yellow/red) for quick assessment
- Flag low-confidence detections for manual review
- Train on full dataset for better confidence scores

---

**Current Status:** System is working correctly! Different confidence levels per detection is expected and normal.

**Last Updated:** August 20, 2026
