# LUNAS training results — 13 October 2026

The drainage recommendation below records the first experiment. A subsequent
balanced roadside run passed its calibrated regression checks and was installed;
see [the follow-up results](ROADSIDE_DRAINAGE_RESULTS_20261013.md).

**No production replacement is recommended.** Two candidates were fine-tuned
and evaluated. Drainage improved on public splits and the flood QA case, but
added unacceptable false positives. Road did not improve validation or the
pothole QA case. Four categories could not be responsibly fine-tuned with the
available labeled inputs. No production checkpoint or `config.yaml` was changed.

## Device and training

NVIDIA GeForce RTX 4060 Laptop GPU, 8 GB VRAM; CUDA device 0; Python 3.14.7;
PyTorch 2.14.0+cu130; torchvision 0.29.0+cu130; Ultralytics 8.4.163.
CUDA tensor execution was verified. The project `.venv` inherits the existing
system dependencies and overrides torch/torchvision locally. See
[environment](environment_20261013.json) and
[dependency snapshot](requirements_snapshot_20261013.txt).

Both runs used the existing category checkpoint, 640-pixel images, batch 8,
AdamW, learning rate 0.0001, seed 17, zero workers, maximum 30 epochs and
early-stopping patience 10. Exact commands and setup are in
[the workflow](../lunas_ai/TRAINING_VALIDATION.md).

- Drainage training: **223.987513 seconds**, 30 epochs.
- Road training: **431.036185 seconds**, stopped early after 19 epochs.
- Environmental, electrical, water and streetlight: no training; new metrics
  and training time are unavailable, not assumed improved.

## Validation and dataset-test comparisons

Values below are proportions, rounded to six decimals. Full-precision values,
per-class results, input hashes and timing breakdowns are in the
[comparison summary](comparison_summary_20261013.json) and packaged reports.

| Model | Split | Checkpoint | Precision | Recall | mAP50 | mAP50-95 |
|---|---|---|---:|---:|---:|---:|
| Drainage | Validation | Current | 0.051153 | 0.446970 | 0.050052 | 0.017115 |
| Drainage | Validation | Candidate | 0.958697 | 0.956982 | 0.982179 | 0.763021 |
| Drainage | Test | Current | 0.035068 | 0.579545 | 0.032127 | 0.011998 |
| Drainage | Test | Candidate | 0.805988 | 0.947965 | 0.900365 | 0.724962 |
| Road | Validation | Current | 0.641795 | 0.626346 | 0.642885 | 0.336040 |
| Road | Validation | Candidate | 0.698082 | 0.574114 | 0.638616 | 0.330036 |
| Road | Test | Current | 0.637885 | 0.553854 | 0.597943 | 0.303076 |
| Road | Test | Candidate | 0.596219 | 0.587372 | 0.590644 | 0.294571 |

Precision and recall summarize Ultralytics' validation operating point.
Application QA and the negative-image checks retain the configured category
gates. No gates were lowered to make the QA cases pass.

| Model | Warm wall-clock inference, current → candidate | Test inference stage, current → candidate | Test negative images with detections, current → candidate |
|---|---:|---:|---:|
| Drainage | 7.835765 → 7.067195 ms | 3.732137 → 6.203698 ms | 0/3 → **2/3** |
| Road | 9.797320 → 8.568625 ms | 6.215986 → 5.850689 ms | 1/20 → 1/20 |

Wall-clock measurement uses the same image, three warm-up predictions and
20 timed predictions for each checkpoint. These short measurements include
noise and are not a deployment-load benchmark. Stage timing comes from the
full test validation run and includes different batching behavior.

## Five held-out QA images

Images remain in Downloads and were not used for training or dataset
validation/test. File hashes and decoded-pixel hashes were checked for overlap
before training. A copied QA image in a temporary training split was rejected;
see [the leakage guard check](leakage_guard_check_20261013.txt).

| Case | Current result | Relevant candidate result | Assessment |
|---|---|---|---|
| Fire | `fire_source`, 0.170 on CUDA; manual review | Same model, unchanged | Weak; no automatic classification improvement |
| Electrical pole | False `bird_nest_on_line`, 0.737; manual review | Same model, unchanged | False positive remains |
| Flood | Incorrect `blocked_surface_drain`, 0.129 | Drainage: `standing_water`, 0.476 | QA classification improved, but negative-image regression rejects replacement |
| Streetlight | No damage detections | Same model, unchanged | Acceptable for this held-out case |
| Potholes | `pothole`, 0.045; manual review | Road: `pothole`, 0.038; manual review | Still misses usable pothole classification; no improvement |

The drainage and road experiments each reran all five cases with only their
own candidate swapped into the in-memory model cache. Those are separate
experiments; the other category checkpoints stayed current in each run.
Results are in the packaged reports and
[CUDA baseline](windows_cuda_baseline_2026-10-13.json).

## Datasets, licenses and limitations

The [dataset manifest](dataset_manifest_20261013.json) records sources,
licenses, split records, hashes, availability and exclusions.

- Road: 720 train / 120 validation / 120 test; 135 / 20 / 20 negative images.
  The [RDD2022 export](https://huggingface.co/datasets/dronefreak/RDD2022)
  publishes CC BY-SA 4.0; revision
  `72b01f94c2e5bfe430861afd73995f2d412b8855` was pinned. Attribution is retained
  for Arya, Maeda, Ghosh, Toshniwal and Sekimoto. The stratified subset preserves
  upstream split membership and all annotations. This is not the full RDD2022
  benchmark. Cross-split exact decoded-pixel duplicates were rejected.
- Drainage: 392 / 49 / 49; 19 / 2 / 3 clear-image negatives. Sources are
  [Roadway Flooding](https://www.kaggle.com/datasets/saurabhshahane/roadway-flooding-image-dataset)
  (published CC BY 4.0; Saurabh Shahane) and
  [drainage-channel-images](https://www.kaggle.com/datasets/irenemargi/drainage-channel-images)
  (published Apache 2.0; Margaret Nabbumba). Water masks become region boxes;
  blocked-drain folder labels become full-image boxes. The latter do not
  validate precise debris localization. One repeated flood image occurs
  within training only; no exact decoded-pixel duplicates cross splits.
- Electrical: the [Power Equipment source](https://huggingface.co/datasets/sxiong/Power-equipment-image-dataset)
  publishes MIT and [Cable Damage](https://huggingface.co/datasets/LibreYOLO/cable-damage)
  publishes CC BY 4.0. The former archive downloaded; the latter download is
  incomplete and retained in cache. Review found visibly damaged insulation
  in `IMG_03592.jpg` despite an empty XML annotation. Empty XML files must not
  automatically become intact negatives. No electrical candidate was trained.
- Environmental: no licensed labeled export covering all four classes and
  negatives was available. Fire-only or garbage-only data would not validate
  retention of the remaining classes. No candidate was trained.
- Water: [pipe-leak v6](https://universe.roboflow.com/pipe-leak/pipe-leak-yshqq/dataset/6)
  publishes CC BY 4.0; export returned HTTP 401. No local export was supplied.
  A multispectral UAV surface-leak dataset was considered but not used as a
  substitute for the existing phone-image pipe-leak task.
- Streetlight: [StreetLampPole](https://universe.roboflow.com/jeong-yeonsu/streetlamppole)
  publishes CC BY 4.0 and a `Damaged` class; export returned HTTP 401. No local
  export or verified intact-streetlight training set was supplied.
- Gas remains manual-only; no gas dataset or checkpoint was introduced.

The user confirmed no labeled local LUNAS/Philippine images or original
dataset exports are available. Prior checkpoint training-image provenance is
incomplete: overlap between its original training and these public split
images cannot be excluded. These measurements establish regression results
on fixed public splits, not unseen local generalization. The very small
negative sets, possible near-duplicate frames and coarse drain labels further
limit conclusions. Five qualitative QA images cannot establish precision/mAP.

## Artifacts and recommendation

Candidates are retained for research only:

- [Drainage candidate](../lunas_ai/models/drainage/surfacedrainage/drainage_cuda_20261013_v2-candidate.pt)
- [Road candidate](../lunas_ai/models/road/rdd/road_cuda_20261013-candidate.pt)

Packaged evidence includes full reports, confusion matrices, normalized
matrices, precision/recall curves, epoch metrics and training plots:

- [Drainage report](comparisons_20261013/drainage_cuda_20261013_v2/report.json)
- [Drainage test confusion matrix](comparisons_20261013/drainage_cuda_20261013_v2/candidate_test/confusion_matrix.png)
- [Road report](comparisons_20261013/road_cuda_20261013/report.json)
- [Road test confusion matrix](comparisons_20261013/road_cuda_20261013/candidate_test/confusion_matrix.png)
- [Drainage training log](drainage_training_20261013_v2.log)
- [Road training log](road_training_20261013.log)

The initial drainage comparison stopped before training because NumPy summary
values needed JSON conversion. The corrected v2 run completed; its earlier
Windows log-encoding errors were fixed by specifying UTF-8 in the file logger.
Road completed without that logging problem. Source downloads were rate-limited;
road preparation resumed from cached files, and the partial electrical download
was stopped and preserved. Earlier logs are retained for audit.

**Reject drainage replacement:** higher public metrics and corrected flood QA
do not outweigh 2/3 clear-drain test images becoming false positives.
**Reject road replacement:** lower mAP50 and mAP50-95 on both splits and lower
pothole QA confidence. Neither is a demonstrated overall production improvement.
The other four image categories remain untrained and unvalidated for improvement.
Original checkpoint hashes were verified against the baseline. Production
configuration, manual-review gates and gas behavior remain unchanged.

## Tests

Command: `cd lunas_ai; .\.venv\Scripts\python.exe -m pytest -q`.
This is the Windows equivalent of the requested `.venv/bin/python` command.

Final result: **21 passed, 10 subtests passed, 3 warnings in 15.99 seconds**.
See [full output](pytest_cuda_final_20261013.txt).
The three existing API tests return booleans rather than asserting success;
passing pytest does not independently establish running API health. The actual
five-image service regression runs completed separately.
