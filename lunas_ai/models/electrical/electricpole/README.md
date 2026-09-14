# Electrical / Electric pole

This folder is reserved for the backend model assigned to the canonical
`electrical` category.

The folder name follows the mobile category layout. The current InsPLAD
checkpoint localizes electrical hardware assets (insulators, dampers, yokes,
and related parts); it is not a broken-pole, exposed-wire, or damage detector.

Expected trained checkpoint:

```text
models/electrical/electricpole/best.pt
```

The training source is the **detection** task from
[Voxel51/InsPLAD](https://huggingface.co/datasets/Voxel51/InsPLAD). The
repository includes the preparation utility at
`lunas_ai/tools/prepare_insplad.py` and the training utility at
`lunas_ai/train_electrical_insplad.py`.

InsPLAD is licensed **CC BY-NC 3.0**. It is non-commercial only and uses UAV
imagery from a Brazilian utility. The team must add and validate local,
ground-level phone images before using a trained model for LUNAS QA.

The current local `best.pt` is a runtime-limited QA checkpoint from 16 of the
configured 100 epochs on a 2% slice of the 1,000-sample pilot. It is suitable
for integration testing only, not accuracy claims. Run the training utility
with `--fraction 1.0` on a faster training host to complete the full pilot.

Until `best.pt` is present, the AI service returns `analysis_status:
"unavailable"` for `electrical`. It never substitutes the road, environmental,
or another category model.
