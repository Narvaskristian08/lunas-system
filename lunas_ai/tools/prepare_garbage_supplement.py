#!/usr/bin/env python3
"""Download and convert a small street-garbage supplement for LUNAS.

The source dataset has one YOLO class named ``garbage``. LUNAS keeps the
existing four-class order, so source class 0 is remapped to class 2:
``garbage_pileup``.

Raw images are intentionally ignored by git. This script keeps the download
reproducible and records the source license beside the local subset.
"""

from __future__ import annotations

import argparse
import json
import random
import shutil
import urllib.parse
import urllib.request
from pathlib import Path


DATASET_API = (
    "https://huggingface.co/api/datasets/Shynuaa/Street-garbage/tree/main/"
)
RAW_BASE = "https://huggingface.co/datasets/Shynuaa/Street-garbage/resolve/main/"
CLASS_NAMES = ["fallen_tree", "fire_source", "garbage_pileup", "open_manhole"]


def fetch_json(url: str):
    with urllib.request.urlopen(url, timeout=60) as response:
        return json.load(response)


def list_files(directory: str) -> list[str]:
    query = urllib.parse.urlencode({"limit": 1000})
    entries = fetch_json(f"{DATASET_API}{directory}?{query}")
    return [entry["path"] for entry in entries if entry.get("type") == "file"]


def download(source_path: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    url = RAW_BASE + urllib.parse.quote(source_path, safe="/")
    with urllib.request.urlopen(url, timeout=120) as response, destination.open("wb") as output:
        shutil.copyfileobj(response, output)


def convert_label(source: Path, destination: Path) -> bool:
    converted = []
    for raw_line in source.read_text(encoding="utf-8").splitlines():
        parts = raw_line.split()
        if len(parts) != 5 or parts[0] != "0":
            continue
        try:
            values = [float(value) for value in parts[1:]]
        except ValueError:
            continue
        if not all(0 <= value <= 1 for value in values):
            continue
        converted.append("2 " + " ".join(f"{value:.6f}" for value in values))

    if not converted:
        return False
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text("\n".join(converted) + "\n", encoding="utf-8")
    return True


def select_pairs(split: str, count: int, seed: int) -> list[tuple[str, str]]:
    image_dir = f"yolo/{split}/images"
    label_dir = f"yolo/{split}/labels"
    images = {
        Path(path).stem: path
        for path in list_files(image_dir)
        if Path(path).suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    }
    labels = {Path(path).stem: path for path in list_files(label_dir) if path.endswith(".txt")}
    pairs = [(images[key], labels[key]) for key in sorted(images.keys() & labels.keys())]
    random.Random(seed).shuffle(pairs)
    return pairs[:count]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("datasets/garbage_supplement"))
    parser.add_argument("--train-count", type=int, default=32)
    parser.add_argument("--val-count", type=int, default=8)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    if args.output.exists():
        shutil.rmtree(args.output)
    for split in ("train", "val"):
        (args.output / split / "images").mkdir(parents=True, exist_ok=True)
        (args.output / split / "labels").mkdir(parents=True, exist_ok=True)

    selected = {
        "train": select_pairs("train", args.train_count, args.seed),
        "val": select_pairs("valid", args.val_count, args.seed + 1),
    }
    if len(selected["val"]) < args.val_count:
        selected["val"] = select_pairs("test", args.val_count, args.seed + 1)

    downloaded = {"train": 0, "val": 0}
    for split, pairs in selected.items():
        for image_path, label_path in pairs:
            image_name = Path(image_path).name
            source_label = args.output / "_source_labels" / f"{Path(image_path).stem}.txt"
            download(image_path, args.output / split / "images" / image_name)
            download(label_path, source_label)
            target_label = args.output / split / "labels" / f"{Path(image_path).stem}.txt"
            if convert_label(source_label, target_label):
                downloaded[split] += 1
            else:
                (args.output / split / "images" / image_name).unlink(missing_ok=True)

    shutil.rmtree(args.output / "_source_labels", ignore_errors=True)
    if not all(downloaded.values()):
        raise RuntimeError(f"No usable annotations downloaded: {downloaded}")

    (args.output / "data.yaml").write_text(
        "# Local supplement generated from Shynuaa/Street-garbage (MIT)\n"
        "# Repository-relative paths keep the dataset portable between host and Docker.\n"
        "path: datasets/garbage_supplement\n"
        "train: train/images\n"
        "val: val/images\n"
        "nc: 4\n"
        "names: ['fallen_tree', 'fire_source', 'garbage_pileup', 'open_manhole']\n",
        encoding="utf-8",
    )
    (args.output / "SOURCE.md").write_text(
        "# Garbage supplement\n\n"
        "Source: https://huggingface.co/datasets/Shynuaa/Street-garbage\n"
        "License: MIT (source dataset card)\n"
        "Source class `garbage` is mapped to LUNAS class index 2, `garbage_pileup`.\n"
        "This is a small reproducible subset for fine-tuning and QA; it is not the\n"
        "complete source dataset.\n",
        encoding="utf-8",
    )
    print(json.dumps({"output": str(args.output), "downloaded": downloaded}, indent=2))


if __name__ == "__main__":
    main()
