# LUNAS AI training and validation prompt

Copy the prompt below into the other computer's AI assistant.

```text
You are training and validating the LUNAS AI service in this repository.

Goal:
Improve the image models for road damage, environmental hazards, electrical damage, drainage, water leaks, and streetlight damage. Do not claim improvement unless validation metrics and the five QA images confirm it.

Project:
lunas_ai/

Existing checkpoints:
- models/road/rdd/yolov8s-rdd2022-mit.pt
- models/road/rdd/yolov8n-rdd2022-best.pt
- models/other/environmentalhazard/yolov8n-env-hazards-best.pt
- models/electrical/electricpole/best.pt
- models/drainage/surfacedrainage/best.pt
- models/water/waterleak/best.pt
- models/streetlight/streetlightdamage/best.pt

Known QA failures:
1. Fire image: no automatic classification.
2. Electrical pole image: false positive bird_nest_on_line on normal hardware.
3. Flood image: weak blocked_surface_drain result instead of standing_water.
4. Intact streetlight image: no damage detection is acceptable.
5. Pothole image: current RDD model misses visible potholes.

Instructions:
1. Inspect the hardware and use the best available device:
   - NVIDIA GPU/CUDA if available
   - Apple MPS if supported
   - CPU only as fallback
2. Do not reset, delete, or overwrite unrelated working-tree changes.
3. Do not train on the five QA images. Use them only as held-out regression tests.
4. Use properly labeled public datasets and local LUNAS/Philippine images. Respect dataset licenses.
5. Add intact/negative examples, especially:
   - normal electrical poles and hardware
   - roads without potholes
   - flood scenes without blocked drains
   - intact streetlights
6. Fine-tune existing checkpoints instead of training from zero where appropriate.
7. Keep gas infrastructure manual-only unless a valid labeled dataset is available.
8. Compare every new checkpoint against the current checkpoint using precision, recall, mAP50, mAP50-95, confusion matrix, and inference speed.
9. Replace a production checkpoint only if it improves validation and does not create unacceptable false positives.
10. Keep low-confidence outputs manual-review-only. Never turn weak detections into automatic incident decisions.

Expected deliverables:
- Dataset manifest and licenses
- Training commands and device used
- Training logs and validation metrics
- Confusion matrices/plots
- New checkpoints saved under the existing models/ folders
- Updated config only after successful comparison
- Results from the five held-out QA images
- Full test results using:
  cd lunas_ai
  .venv/bin/python -m pytest -q

At the end, report which models improved, which did not, exact metrics, training time, and whether production replacement is recommended.
```
