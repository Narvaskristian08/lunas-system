# Roadside surface drainage — installed 13 October 2026

**Scope correction:** the user subsequently specified garbage blockage only.
Flood-only detections are now suppressed, and generic blockage candidates are
manual-review-only. The broad water/blockage metrics and deployment decision
below are historical; they do not establish garbage-specific model quality.
See [the scope correction](GARBAGE_BLOCKAGE_SCOPE_20261013.md).

The balanced roadside checkpoint is now installed at
`lunas_ai/models/drainage/surfacedrainage/best.pt`. The canonical `drainage`
route loads it for visible surface flooding and blocked roadside
drains/gutters/canals. Indoor drains, underground pipes and sewer interiors are
outside its training scope. It cannot infer hidden pipe condition or prove
that flooding was caused by a blockage.

The previous model is preserved at
`lunas_ai/models/drainage/surfacedrainage/pre-roadside-20261013.pt`; its hash was
verified against the original baseline. All other original checkpoints remain
unchanged. The earlier rejected candidate remains available separately.

## Training and data

- NVIDIA RTX 4060 Laptop GPU, CUDA device 0, PyTorch 2.14.0+cu130.
- 30 epochs, 640 pixels, batch 8, AdamW, learning rate 0.0001, seed 17,
  patience 10, zero data-loader workers.
- Fine-tuning initializer: the earlier drainage candidate, which had learned
  surface water well but needed better negative-example behavior.
- Training time: **361.771990 seconds**.
- Train: 754 copies representing 415 unique images; 381 negative copies.
- Validation: 63 unique images, including 16 negatives.
- Test: 66 unique images, including 20 negatives.

Training alone oversamples clear drains and reviewed dry roads. Repeated copies
are not additional independent evidence. Original drainage and RDD split
membership is retained. Snow, wet roads, visible puddles and ambiguous scenes
were excluded from the added road negatives after visual review. The five QA
images remained held out; byte and decoded-pixel overlap checks ran before
training. Cross-split decoded-pixel duplicates are rejected by the comparison
utility.

The [dataset manifest](roadside_dataset_manifest_20261013.json) records sources,
licenses, source revision, review choices, copies and image hashes. Sources are
[Roadway Flooding](https://www.kaggle.com/datasets/saurabhshahane/roadway-flooding-image-dataset)
(published CC BY 4.0),
[drainage-channel-images](https://www.kaggle.com/datasets/irenemargi/drainage-channel-images)
(published Apache 2.0), and reviewed negatives from the pinned
[RDD2022 export](https://huggingface.co/datasets/dronefreak/RDD2022)
(published CC BY-SA 4.0). Original attribution is retained in the source
manifests and earlier training report.

```powershell
cd lunas_ai
.\.venv\Scripts\python.exe tools/prepare_balanced_surface_drainage.py
.\.venv\Scripts\python.exe tools/compare_finetune.py --model surface_drainage --data datasets/drainage/surface_balanced_20261013/data.yaml --name roadside_drainage_cuda_20261013 --epochs 30 --batch 8 --initial-weights models/drainage/surfacedrainage/drainage_cuda_20261013_v2-candidate.pt --qa ../qa_outputs/windows_cuda_baseline_2026-10-13.json
```

Commands above record this experiment; repeat runs require a new name/output
and should explicitly select the saved pre-replacement checkpoint as their
baseline if comparing against the original. The comparison utility now uses
the installed production checkpoint by default.

## Fixed public-split metrics

Values are proportions rounded to six decimals; the
[full report](comparisons_20261013/roadside_drainage_cuda_20261013/report.json)
retains full precision and per-class metrics.

| Split | Model | Precision | Recall | mAP50 | mAP50-95 |
|---|---|---:|---:|---:|---:|
| Validation | Previous | 0.038082 | 0.270512 | 0.049068 | 0.015982 |
| Validation | New | 0.976843 | 0.789784 | 0.940636 | 0.744024 |
| Test | Previous | 0.019461 | 0.022727 | 0.028678 | 0.009822 |
| Test | New | 0.970655 | 0.937604 | 0.984181 | 0.793987 |

Warm wall-clock prediction: **7.584460 → 6.508700 ms/image**, measured with
three warm-ups and 20 predictions on the same image. Test validation inference
stage: **2.809083 → 3.032789 ms/image**. These different measurements include
different batching/overhead and are not a deployment-load benchmark.

## Calibrated suggestions and actual API check

At the old uniform 0.35 gate, the candidate produced one false water match on
a dry validation road (0.444964). Calibration used validation negatives only:

- `standing_water`: **0.50** suggestion gate.
- `blocked_surface_drain`: **0.35** suggestion gate, unchanged.
- Review candidate floor: **0.05**, unchanged.

With these gates, actual service inference produced **0/16 validation-negative
suggestions and 0/20 test-negative suggestions**. The previous model also
produced zero at its original gates. Eleven of the 36 negative images still
have weaker review candidates; these do not produce an AI suggestion.
See [calibration evidence](roadside_negative_calibration_20261013.json) and
[active service verification](roadside_active_verification_20261013.json).

Ultralytics precision/recall in the metrics table summarize its validation
operating point; they are not precision/recall measured at the application
class gates. Negative-image suggestion counts were tested using the actual
configured service after installation.

The fixed `/api/v1/detect/drainage` route was exercised through Flask's test
client with the held-out flood image. It returned HTTP 200,
`ai_suggestion: standing_water`, confidence **0.717**, and
`requires_manual_review: true`, `advisory_only: true`.

## All five held-out QA cases after installation

| Case | Active result | Change |
|---|---|---|
| Fire | Weak `fire_source`, 0.170; manual review | Environmental model unchanged |
| Pole | False `bird_nest_on_line`, 0.737; manual review | Electrical model unchanged |
| Flood | `standing_water`, **0.717**, above its 0.50 suggestion gate | Correct label; previous result was weak `blocked_surface_drain`, 0.129 |
| Streetlight | No damage detections | Unchanged, acceptable for this case |
| Potholes | Weak `pothole`, 0.045; manual review | Road model unchanged |

The [active QA results](roadside_active_qa_20261013.json) include current
checkpoint/configuration hashes. The streetlight interpretation of the pole
photo remains a separate test; this five-case suite preserves the original
electrical regression case.

## Evidence, limits and operation

The replacement is supported as **advisory roadside detection** by better fixed
public metrics, improved flood QA and no additional suggestions on the tested
negative images after validation-based calibration. It is not proof of
performance on new Philippine photos. There is no labeled local dataset;
previous checkpoint training-image provenance is incomplete; public test and
QA cases were examined during earlier experiments. These are regression checks,
not a newly untouched final benchmark. Exact duplicate checks do not rule out
near-duplicate frames. Blocked-channel annotations remain full-image boxes and
do not validate precise trash/silt boundaries or structural grate/channel damage.

The model does not decide incident severity, priority, assignments or closure.
Weak boxes remain manual review and all suggestions require an official decision.

The existing mobile/web `Drainage` category reaches this model through the
backend's AI service integration. The local checkpoint/configuration is updated;
a separately running or hosted AI service must restart or deploy these files
to load them. No deployment to an external server was performed.

Packaged confusion matrices, curves and training metrics are under
`comparisons_20261013/roadside_drainage_cuda_20261013/`, including the
[test confusion matrix](comparisons_20261013/roadside_drainage_cuda_20261013/candidate_test/confusion_matrix.png).
The [training log](roadside_drainage_training_20261013.log) is retained.

After replacement, `.\.venv\Scripts\python.exe -m pytest -q` completed:
**21 passed, 10 subtests passed, 3 warnings in 14.77 seconds**.
See [full test output](pytest_roadside_active_20261013.txt).
Existing API tests return booleans rather than assertions; the actual fixed
drainage endpoint was independently tested above.

Rollback: restore `pre-roadside-20261013.pt` to `best.pt`, remove the new
`class_confidence_thresholds` overrides for surface drainage, and restart the
AI service. The original uniform gate was 0.35 and its review floor was 0.05.
