#!/usr/bin/env python3
"""Prepare a public-data surface drainage issue detector.

This utility intentionally prepares only visible issue labels:

* ``standing_water`` from the CC BY 4.0 Roadway Flooding Image Dataset. Its
  binary masks are converted into one normalized YOLO box per image.
* ``blocked_surface_drain`` from the Apache-2.0 drainage-channel-images set.
  That source provides blocked/clear folders rather than object boxes, so
  blocked samples receive an explicit image-level full-image box and clear
  samples are kept as negative images.

The downloaded archives and generated YOLO export stay under ignored paths in
``lunas_ai``. No package installation is performed.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import shutil
import urllib.request
import zipfile
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[1]
CACHE_DIR = BASE_DIR / ".cache" / "datasets" / "kaggle"
DEFAULT_OUTPUT = BASE_DIR / "datasets/drainage/surface"

ROAD_FLOODING_URL = (
    "https://www.kaggle.com/api/v1/datasets/download/"
    "saurabhshahane/roadway-flooding-image-dataset"
)
CHANNEL_URL = (
    "https://www.kaggle.com/api/v1/datasets/download/"
    "irenemargi/drainage-channel-images"
)

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
CLASSES = ["standing_water", "blocked_surface_drain"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare public surface-drainage issue data for YOLO"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Ignored YOLO output directory",
    )
    parser.add_argument(
        "--max-flood-images",
        type=int,
        default=None,
        help="Optional deterministic cap for roadway-flooding images",
    )
    parser.add_argument(
        "--max-channel-images",
        type=int,
        default=None,
        help="Optional deterministic cap for drainage-channel images",
    )
    parser.add_argument(
        "--no-download",
        action="store_true",
        help="Use archives already present in lunas_ai/.cache",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace an existing generated output directory",
    )
    parser.add_argument("--seed", type=int, default=17)
    return parser.parse_args()


def configure_local_caches() -> None:
    os.environ.setdefault("HF_HOME", str(BASE_DIR / ".cache/huggingface"))
    os.environ.setdefault("YOLO_CONFIG_DIR", str(BASE_DIR / ".cache/ultralytics"))
    os.environ.setdefault("MPLCONFIGDIR", str(BASE_DIR / ".cache/matplotlib"))


def download_archive(url: str, destination: Path) -> Path:
    """Download an archive atomically, without adding a Python dependency."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.is_file() and zipfile.is_zipfile(destination):
        return destination

    partial = destination.with_suffix(destination.suffix + ".part")
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "LUNAS-AI-surface-drainage-qa/1.0"},
    )
    with urllib.request.urlopen(request, timeout=120) as response, partial.open("wb") as handle:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            handle.write(chunk)
    if not zipfile.is_zipfile(partial):
        raise RuntimeError(f"Downloaded file is not a valid ZIP archive: {partial}")
    partial.replace(destination)
    return destination


def find_cached_archive(prefix: str) -> Path:
    candidates = sorted(CACHE_DIR.glob(f"{prefix}*.zip"))
    for candidate in candidates:
        if zipfile.is_zipfile(candidate):
            return candidate
    raise FileNotFoundError(
        f"No cached {prefix} archive found in {CACHE_DIR}; run without --no-download"
    )


def safe_extract(archive_path: Path, output_dir: Path) -> None:
    """Extract an archive while rejecting path traversal members."""
    output_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive_path) as archive:
        root = output_dir.resolve()
        for member in archive.infolist():
            target = (output_dir / member.filename).resolve()
            if target != root and root not in target.parents:
                raise RuntimeError(f"Unsafe archive member: {member.filename}")
        archive.extractall(output_dir)


def extracted_dir(archive_path: Path, name: str) -> Path:
    output_dir = CACHE_DIR / "extracted" / name
    marker = output_dir / ".ready"
    if not marker.is_file():
        if output_dir.exists():
            shutil.rmtree(output_dir)
        safe_extract(archive_path, output_dir)
        marker.write_text("ready\n", encoding="utf-8")
    return output_dir


def find_dataset_root(extracted: Path, expected_name: str) -> Path:
    candidates = [extracted / "Dataset", *[path for path in extracted.rglob("Dataset")]]
    for candidate in candidates:
        if (candidate / expected_name).is_dir():
            return candidate
    raise FileNotFoundError(
        f"Could not find Dataset/{expected_name} below extracted archive {extracted}"
    )


def flood_records(extracted: Path, max_images: int | None) -> list[dict[str, Any]]:
    """Create masked standing-water records from roadway flooding images."""
    from PIL import Image

    root = find_dataset_root(extracted, "images")
    image_dir = root / "images"
    label_dir = root / "labels"
    records: list[dict[str, Any]] = []
    for image_path in sorted(image_dir.iterdir()):
        if image_path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        mask_path = label_dir / f"label_{image_path.stem.split('_')[-1]}.png"
        if not mask_path.is_file():
            continue
        with Image.open(image_path) as image, Image.open(mask_path) as mask:
            width, height = image.size
            if mask.size != (width, height):
                continue
            box = mask.convert("L").getbbox()
        if not box:
            continue
        x1, y1, x2, y2 = box
        annotations = [
            " ".join(
                [
                    "0",
                    str(((x1 + x2) / 2) / width),
                    str(((y1 + y2) / 2) / height),
                    str((x2 - x1) / width),
                    str((y2 - y1) / height),
                ]
            )
        ]
        records.append(
            {
                "source": "roadway_flooding",
                "source_path": str(image_path),
                "annotations": annotations,
                "annotation_scope": "mask-derived-region",
            }
        )
    return records[:max_images] if max_images is not None else records


def channel_records(extracted: Path, max_images: int | None) -> list[dict[str, Any]]:
    """Create blocked/clear records from folder-level drainage labels."""
    root = find_dataset_root(extracted, "Blocked")
    records: list[dict[str, Any]] = []
    blocked_dir = root / "Blocked"
    clear_dir = root / "Clear"

    for image_path in sorted(blocked_dir.rglob("*")):
        if image_path.is_file() and image_path.suffix.lower() in IMAGE_SUFFIXES:
            records.append(
                {
                    "source": "drainage_channels",
                    "source_path": str(image_path),
                    "annotations": ["1 0.5 0.5 1.0 1.0"],
                    "annotation_scope": "image-level-full-image-box",
                    "source_label": "blocked/" + str(image_path.parent.relative_to(blocked_dir)),
                }
            )

    for image_path in sorted(clear_dir.rglob("*")):
        if image_path.is_file() and image_path.suffix.lower() in IMAGE_SUFFIXES:
            records.append(
                {
                    "source": "drainage_channels",
                    "source_path": str(image_path),
                    "annotations": [],
                    "annotation_scope": "negative-clear-image",
                    "source_label": "clear/" + str(image_path.parent.relative_to(clear_dir)),
                }
            )

    return records[:max_images] if max_images is not None else records


def split_records(records: list[dict[str, Any]], seed: int) -> dict[str, list[dict[str, Any]]]:
    shuffled = list(records)
    random.Random(seed).shuffle(shuffled)
    if len(shuffled) < 3:
        raise RuntimeError("At least three records are required for train/val/test")
    train_end = max(1, int(len(shuffled) * 0.8))
    val_end = max(train_end + 1, int(len(shuffled) * 0.9))
    return {
        "train": shuffled[:train_end],
        "val": shuffled[train_end:val_end],
        "test": shuffled[val_end:],
    }


def copy_records(splits: dict[str, list[dict[str, Any]]], output_dir: Path) -> dict[str, int]:
    counts: dict[str, int] = {}
    for split, records in splits.items():
        image_dir = output_dir / "images" / split
        label_dir = output_dir / "labels" / split
        image_dir.mkdir(parents=True, exist_ok=True)
        label_dir.mkdir(parents=True, exist_ok=True)
        for index, record in enumerate(records):
            source_path = Path(record["source_path"])
            stem = f"{record['source']}_{split}_{index:05d}"
            target_image = image_dir / f"{stem}{source_path.suffix.lower()}"
            shutil.copy2(source_path, target_image)
            (label_dir / f"{stem}.txt").write_text(
                "\n".join(record["annotations"]) + ("\n" if record["annotations"] else ""),
                encoding="utf-8",
            )
        counts[split] = len(records)
    return counts


def write_data_yaml(output_dir: Path) -> None:
    (output_dir / "data.yaml").write_text(
        "\n".join(
            [
                f"path: {output_dir}",
                "train: images/train",
                "val: images/val",
                "test: images/test",
                f"names: {json.dumps(CLASSES)}",
                "",
            ]
        ),
        encoding="utf-8",
    )


def main() -> int:
    args = parse_args()
    if args.max_flood_images is not None and args.max_flood_images <= 0:
        raise SystemExit("--max-flood-images must be greater than zero")
    if args.max_channel_images is not None and args.max_channel_images <= 0:
        raise SystemExit("--max-channel-images must be greater than zero")
    configure_local_caches()

    output_dir = args.output.expanduser().resolve()
    if output_dir.exists() and any(output_dir.iterdir()):
        if not args.overwrite:
            raise SystemExit(
                f"Output directory is not empty: {output_dir}; use --overwrite after inspection"
            )
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.no_download:
        flood_archive = find_cached_archive("roadway-flooding")
        channel_archive = find_cached_archive("drainage-channel-images")
    else:
        flood_archive = download_archive(ROAD_FLOODING_URL, CACHE_DIR / "roadway-flooding.zip")
        channel_archive = download_archive(
            CHANNEL_URL, CACHE_DIR / "drainage-channel-images.zip"
        )

    flood_data = flood_records(
        extracted_dir(flood_archive, "roadway-flooding"), args.max_flood_images
    )
    channel_data = channel_records(
        extracted_dir(channel_archive, "drainage-channel-images"), args.max_channel_images
    )
    records = flood_data + channel_data
    if not records:
        raise RuntimeError("No surface drainage records were prepared")

    splits = split_records(records, args.seed)
    counts = copy_records(splits, output_dir)
    write_data_yaml(output_dir)

    manifest = {
        "task": "surface drainage issue detection",
        "classes": CLASSES,
        "image_counts": counts,
        "records": len(records),
        "seed": args.seed,
        "sources": [
            {
                "id": "saurabhshahane/roadway-flooding-image-dataset",
                "upstream": "10.17632/t395bwcvbw.1",
                "license": "CC BY 4.0",
                "used_labels": ["standing_water"],
                "annotation": "binary masks converted to region boxes",
                "records": len(flood_data),
            },
            {
                "id": "irenemargi/drainage-channel-images",
                "license": "Apache 2.0",
                "used_labels": ["blocked_surface_drain"],
                "annotation": "blocked/clear folders; blocked images use full-image boxes",
                "records": len(channel_data),
            },
        ],
        "safety": {
            "damage_only": True,
            "advisory_only": True,
            "requires_manual_review": True,
            "not_trained_for": [
                "exact trash or silt boundaries in phone photos",
                "broken or missing grates",
                "collapsed channels",
                "severity, priority, routing, status, or closure decisions",
            ],
        },
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Prepared surface drainage dataset at {output_dir}")
    print(f"Images by split: {counts}")
    print(f"Classes: {', '.join(CLASSES)}")
    print(f"YOLO configuration: {output_dir / 'data.yaml'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
