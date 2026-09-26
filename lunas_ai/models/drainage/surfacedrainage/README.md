# Surface-drainage issue model

`best.pt` is a backend-only YOLOv8n model assigned to the canonical
`drainage` category. It is trained only on visible issue signals:

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
python train_surface_drainage.py
```

Source attribution and licenses are recorded in the generated
`datasets/drainage/surface/manifest.json`.
