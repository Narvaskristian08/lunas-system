#!/usr/bin/env python3
"""Cautiously fine-tune the environmental-hazard model on street garbage.

The source supplement contains only class index 2 (garbage_pileup). This is
deliberately a small adaptation run, not a replacement for a balanced
four-class retraining. The existing checkpoint is never overwritten by this
script; promotion happens only after the candidate is evaluated.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from ultralytics import YOLO


ROOT = Path(__file__).resolve().parent
DATASET = ROOT / "datasets/garbage_supplement/data.yaml"
BASE_MODEL = ROOT / "models/other/environmentalhazard/yolov8n-env-hazards-best.pt"
RUN_DIR = ROOT / "runs/train/env_hazards_garbage_finetune"
CANDIDATE = ROOT / "models/other/environmentalhazard/yolov8n-env-hazards-garbage-finetuned.pt"
HARD_NEGATIVES = [
    ROOT.parent / "qa/classification-assets/other-control.jpg",
    ROOT.parent / "qa/classification-assets/road-positive.jpg",
    ROOT.parent / "qa/classification-assets/drainage-positive.jpg",
]


def add_hard_negatives() -> None:
    """Add local non-garbage QA scenes as unlabeled background images."""
    destination = DATASET.parent / "train/images"
    for source in HARD_NEGATIVES:
        if source.is_file():
            shutil.copy2(source, destination / f"negative-{source.name}")


def main() -> None:
    if not DATASET.is_file():
        raise SystemExit(f"Missing dataset: {DATASET}")
    if not BASE_MODEL.is_file():
        raise SystemExit(f"Missing base model: {BASE_MODEL}")

    add_hard_negatives()
    model = YOLO(str(BASE_MODEL))
    results = model.train(
        data=str(DATASET),
        epochs=25,
        batch=8,
        imgsz=512,
        device="cpu",
        name=RUN_DIR.name,
        project=str(RUN_DIR.parent),
        exist_ok=True,
        pretrained=False,
        patience=8,
        cache=False,
        workers=2,
        optimizer="AdamW",
        lr0=0.0005,
        lrf=0.01,
        weight_decay=0.0005,
        warmup_epochs=1.0,
        freeze=0,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=0.0,
        translate=0.1,
        scale=0.5,
        shear=0.0,
        perspective=0.0,
        flipud=0.0,
        fliplr=0.5,
        mosaic=0.5,
        mixup=0.0,
        copy_paste=0.0,
    )

    best = RUN_DIR / "weights/best.pt"
    if not best.is_file():
        raise SystemExit(f"Training completed without a best checkpoint: {best}")
    CANDIDATE.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(best, CANDIDATE)

    metrics = getattr(results, "results_dict", {})
    print({
        "candidate": str(CANDIDATE),
        "precision": metrics.get("metrics/precision(B)"),
        "recall": metrics.get("metrics/recall(B)"),
        "map50": metrics.get("metrics/mAP50(B)"),
        "map50_95": metrics.get("metrics/mAP50-95(B)"),
    })


if __name__ == "__main__":
    main()
