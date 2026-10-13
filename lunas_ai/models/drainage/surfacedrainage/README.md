# Surface-drainage issue model

Current scope: **visible garbage blocking roadside drains, gutters or canals**.
The `standing_water` checkpoint class is suppressed in application results.
The remaining `blocked_surface_drain` boxes are generic blockage candidates,
not validated garbage-cause detections, and are always manual-review-only.
Garbage-specific drain bounding boxes and healthy-drain negatives are needed
before enabling AI suggestions. The broader training metrics below describe
the earlier water/blockage experiment and do not validate garbage detection.

`best.pt` is the balanced roadside YOLOv8n checkpoint installed on
13 October 2026, assigned to the canonical `drainage` category. It is trained
for visible roadside drains, gutters, canals and surface flooding:

- `standing_water`: region boxes derived from binary roadway-flooding masks.
- `blocked_surface_drain`: image-level blocked drainage-channel labels. These
  annotations use a full-image box because the public source does not provide
  a debris boundary.

This is an advisory model. It does not decide severity, priority, routing,
status, duplicate reports, work orders, or closure. Every result requires an
official manual decision. It is not validated for Philippine phone imagery or
for exact silt/trash, grate, erosion, or collapse boundaries.

The generated training data is intentionally ignored by Git. Recreate it with:

```bash
cd lunas_ai
python tools/prepare_surface_drainage.py
python tools/prepare_rdd_subset.py
python tools/prepare_balanced_surface_drainage.py
```

Source attribution and licenses are recorded in the generated
`datasets/drainage/surface/manifest.json`.

The active checkpoint was fine-tuned for 30 epochs on CUDA using balanced
clear-drain negatives plus visually reviewed dry-road negatives from the
CC BY-SA 4.0 RDD2022 export. Training took 361.772 seconds. Dataset generation
and the exact comparison command are recorded in
[the roadside results](../../../../qa_outputs/ROADSIDE_DRAINAGE_RESULTS_20261013.md).
Reproduce the balanced export with
`python tools/prepare_balanced_surface_drainage.py` after preparing the original
surface dataset and road subset. The new manifest is
`datasets/drainage/surface_balanced_20261013/manifest.json`.

On 66 fixed test images, precision was 0.970655, recall 0.937604,
mAP50 0.984181 and mAP50-95 0.793987. With the calibrated gates, none of the
20 test negatives or 16 validation negatives produced an AI suggestion.
Low-confidence review boxes still occurred on some negative images. The held-out
flood photo returned `standing_water` at 0.717 confidence.

The standing-water suggestion gate is 0.50, calibrated from validation negatives;
the blocked-drain gate remains 0.35 and the review candidate floor remains 0.05.
This is an advisory deployment based on small public regression sets, not
validation for local Philippine images. The blocked-drain labels remain coarse.
Indoor drains, underground pipes and sewer interiors are outside the training
scope. Neither the presence of water nor this model establishes a hidden blockage.

`pre-roadside-20261013.pt` preserves the previous production checkpoint for
rollback. To restore its behavior, restore that checkpoint to `best.pt` and
remove the new per-class threshold overrides in `config.yaml`.
