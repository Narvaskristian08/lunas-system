# Training and validation workflow

Use candidate checkpoints and fixed dataset splits. The comparison utility
never installs a candidate into production or edits `config.yaml`.

On this Windows computer, the project `.venv` uses Python 3.14.7, CUDA
PyTorch 2.14.0 and torchvision 0.29.0. It inherits the existing system
dependencies; the CUDA packages are installed locally in `.venv`.

```powershell
cd lunas_ai
.\.venv\Scripts\python.exe -m pip install --ignore-installed --no-deps torch==2.14.0+cu130 torchvision==0.29.0+cu130 --index-url https://download.pytorch.org/whl/cu130
.\.venv\Scripts\python.exe -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
```

The five original regression images are in `C:\Users\jodeu\Downloads`.
Their paths, SHA-256 hashes and baseline results are in
`../qa_outputs/windows_cuda_baseline_2026-10-13.json`. Keep them out of every
training, validation and dataset-test split. A copy of the pole image is also
present in Downloads; changing a filename does not make an image independent.

```powershell
.\.venv\Scripts\python.exe tools/run_heldout_qa.py --output ../qa_outputs/new_baseline.json
.\.venv\Scripts\python.exe tools/prepare_surface_drainage.py
.\.venv\Scripts\python.exe tools/prepare_rdd_subset.py
```

Preparation refuses to overwrite existing exports. Road preparation supports
`--resume` for an incomplete export, preserves downloaded images and pins its
source revision in `preparation.json`. Its small deterministic sample retains
upstream split membership and all four classes. It is not the full RDD2022
benchmark. Manifests record source, license, attribution and sampling rules.

The actual fine-tuning commands for this session are:

```powershell
.\.venv\Scripts\python.exe tools/compare_finetune.py --model surface_drainage --data datasets/drainage/surface/data.yaml --name drainage_cuda_20261013_v2 --epochs 30 --batch 8 --qa ../qa_outputs/windows_baseline_2026-10-13.json
.\.venv\Scripts\python.exe tools/compare_finetune.py --model road_damage --data datasets/road/rdd_subset_20261013/data.yaml --name road_cuda_20261013 --epochs 30 --batch 8 --qa ../qa_outputs/windows_cuda_baseline_2026-10-13.json
```

Use a new experiment name for another run. The utility checks class order,
annotation syntax, exact and decoded-pixel QA overlap, and decoded-pixel
duplicates across splits before inference or training. These checks do not
establish absence of near-duplicate video frames or differently recompressed
photos. The QA leakage rejection was exercised with an actual QA image in a
temporary training split; see `../qa_outputs/leakage_guard_check_20261013.txt`.

The utility selects CUDA, then MPS, then CPU. It fine-tunes the configured
checkpoint using AdamW at learning rate 0.0001, seed 17, 640-pixel input,
zero data-loader workers, and patience 10. It saves candidates beside their
production checkpoint under distinct filenames. Validation and test use the
same data and settings for both models. `--baseline-only` measures a model
without training it.

Each experiment under `runs/comparison/<name>/` contains:

- `report.json`: image/annotation hashes, source manifest, device, command,
  precision, recall, mAP50, mAP50-95, per-class metrics, inference timing,
  negative-image detections, training time, and all five candidate QA results.
- `baseline_val/`, `baseline_test/`, `candidate_val/`, `candidate_test/`:
  confusion matrices, precision/recall curves and example predictions.
- `train/`: epoch metrics, training plots and the best/last checkpoints.

Ultralytics precision and recall summarize its validation operating point.
Negative-image detections and application QA use the existing configured
production gates. Wall-clock speed is measured after three warm-up predictions
over 20 runs on the same test image; validation also reports per-stage timings.
Do not interpret image loading/model initialization times as inference speed.

The five qualitative QA cases cannot establish precision or mAP. Original
checkpoint training-image provenance is incomplete, so overlap between its
earlier training and public validation/test images cannot be excluded. Public
split improvements are regression comparisons, not evidence of unseen local
generalization. No labeled local Philippine images were available this session.

Do not treat empty electrical annotations as verified intact negatives. Review
of the downloaded Power Equipment archive found a visibly damaged conductor
(`IMG_03592.jpg`) with an empty XML annotation. The source needs annotation
review and a verified intact-pole/hardware set before a replacement can be
recommended. The incomplete Cable Damage download is retained in the cache;
it is not a complete exported dataset.

The original water-leak v6 and damaged-streetlight sources were located:
[pipe leak v6](https://universe.roboflow.com/pipe-leak/pipe-leak-yshqq/dataset/6)
and [StreetLampPole](https://universe.roboflow.com/jeong-yeonsu/streetlamppole).
Both publish CC BY 4.0 licenses. Their export endpoints returned HTTP 401 in
this session, and no local exports were available. No credentials were fetched
or embedded in artifacts. Environmental training also needs a labeled export
covering all four existing classes and negatives; a fire-only or garbage-only
supplement would not validate retention of the other classes.

Keep gas manual-only and weak outputs in manual review. Reject replacement
when a candidate adds unacceptable negative-image detections, even when its
aggregate metrics increase. The final results and replacement recommendations
are recorded in `../qa_outputs/TRAINING_RESULTS_2026-10-13.md`.

Run the full suite using the Windows equivalent of `.venv/bin/python`:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

The existing API tests return booleans rather than asserting success; pytest
emits three warnings and a passing suite alone does not prove API health.
