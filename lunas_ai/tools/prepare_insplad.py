#!/usr/bin/env python3
"""Prepare the InsPLAD detection subset for YOLO training.

This is an optional training-time utility. It does not install packages and it
does not change the running API. FiftyOne loads the Hugging Face dataset,
filters out the classification/anomaly samples, creates reproducible train /
validation / test splits, and exports the detection annotations to YOLO format.

The InsPLAD Hugging Face dataset is CC BY-NC 3.0. Confirm that this license is
appropriate for the intended use before training or distributing a model.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Iterable, List


DATASET_ID = "Voxel51/InsPLAD"
BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = BASE_DIR / "datasets/electrical/insplad"

# Keep all caches and FiftyOne's local database within lunas_ai. This avoids
# modifying user-level application directories while preparing the dataset.
LOCAL_CACHE = BASE_DIR / ".cache"
os.environ.setdefault("YOLO_CONFIG_DIR", str(LOCAL_CACHE / "ultralytics"))
os.environ.setdefault("FIFTYONE_DATABASE_DIR", str(LOCAL_CACHE / "fiftyone"))
os.environ.setdefault("FIFTYONE_DEFAULT_DATASET_DIR", str(LOCAL_CACHE / "datasets"))
os.environ.setdefault("FIFTYONE_DATASET_ZOO_DIR", str(LOCAL_CACHE / "datasets"))
os.environ.setdefault("HF_HOME", str(LOCAL_CACHE / "huggingface"))
os.environ.setdefault("HF_DATASETS_CACHE", str(LOCAL_CACHE / "huggingface/datasets"))
os.environ.setdefault("MPLCONFIGDIR", str(LOCAL_CACHE / "matplotlib"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export the InsPLAD object-detection task as a YOLO dataset"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Directory for the generated YOLO dataset",
    )
    parser.add_argument(
        "--max-samples",
        type=int,
        default=None,
        help="Optional sample limit for a small QA export",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Seed used for train/validation/test splitting",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Allow export into a non-empty output directory",
    )
    return parser.parse_args()


def collect_classes(view: Iterable) -> List[str]:
    """Collect stable class names from the FiftyOne detection field."""
    labels = set()
    for sample in view.iter_samples(progress=True):
        ground_truth = sample["ground_truth"]
        if not ground_truth:
            continue
        for detection in ground_truth.detections:
            if detection.label:
                labels.add(str(detection.label))
    return sorted(labels)


def write_data_yaml(output_dir: Path, classes: List[str]) -> Path:
    """Write the Ultralytics data configuration for the exported splits."""
    data_yaml = output_dir / "data.yaml"
    data_yaml.write_text(
        "\n".join(
            [
                f"path: {output_dir}",
                "train: images/train",
                "val: images/val",
                "test: images/test",
                f"names: {json.dumps(classes)}",
                "",
            ]
        ),
        encoding="utf-8",
    )
    return data_yaml


def main() -> int:
    args = parse_args()

    if args.max_samples is not None and args.max_samples <= 0:
        raise SystemExit("--max-samples must be greater than zero")

    output_dir = args.output.expanduser().resolve()
    if output_dir.exists() and any(output_dir.iterdir()) and not args.overwrite:
        raise SystemExit(
            f"Output directory is not empty: {output_dir}\n"
            "Use a new directory or pass --overwrite after checking its contents."
        )
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        import fiftyone as fo
        from fiftyone import ViewField as F
        from fiftyone.utils.huggingface import load_from_hub
    except ImportError as exc:
        raise SystemExit(
            "FiftyOne is not available. Install dependencies separately only "
            "when your team is ready to prepare the dataset."
        ) from exc

    load_args = {"max_samples": args.max_samples} if args.max_samples else {}
    dataset = load_from_hub(DATASET_ID, **load_args)
    detection_view = dataset.match(F("task") == "detection")
    if len(detection_view) == 0:
        raise SystemExit("No InsPLAD detection samples were found")

    classes = collect_classes(detection_view)
    if not classes:
        raise SystemExit("The InsPLAD detection view contains no labels")

    shuffled_view = detection_view.shuffle(seed=args.seed)
    train_count = int(len(shuffled_view) * 0.8)
    val_count = int(len(shuffled_view) * 0.1)
    splits = {
        "train": shuffled_view.limit(train_count),
        "val": shuffled_view.skip(train_count).limit(val_count),
        "test": shuffled_view.skip(train_count + val_count),
    }
    for split_name, split_view in splits.items():
        split_view.export(
            export_dir=str(output_dir),
            dataset_type=fo.types.YOLOv5Dataset,
            label_field="ground_truth",
            split=split_name,
            classes=classes,
            export_media=True,
        )

    data_yaml = write_data_yaml(output_dir, classes)
    print(f"Exported {len(detection_view)} InsPLAD detection samples")
    print(f"Classes ({len(classes)}): {', '.join(classes)}")
    print(f"YOLO configuration: {data_yaml}")
    print("Next: run train_electrical_insplad.py after placing yolov8n.pt locally.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
