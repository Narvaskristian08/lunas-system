# Road / RDD

The RDD model in this folder is the assigned model for the canonical `road`
category. It returns advisory image labels and normalized bounding boxes.

The active checkpoint is `yolov8s-rdd2022-mit.pt`, a YOLOv8-small model
published in the MIT-licensed
[ProjectRoadDamageDetection RDD2022 Space](https://huggingface.co/spaces/ProjectRoadDamageDetection/Automated-Road-Damage-Detection).
Its class IDs are ordered as:

1. `longitudinal_crack`
2. `transverse_crack`
3. `alligator_crack`
4. `pothole`

The previous `yolov8n-rdd2022-best.pt` checkpoint is retained for rollback and
comparison. The production gate is intentionally `0.65`; lower-confidence
boxes remain reviewer candidates and are not automatic suggestions.
