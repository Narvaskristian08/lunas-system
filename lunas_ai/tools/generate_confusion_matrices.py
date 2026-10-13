"""Generate raw-checkpoint count/normalized matrices where labeled data exists."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys

BASE = Path(__file__).resolve().parents[1]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def prepare_cable_test(settings):
    """Use complete cached test pairs; never pretend the partial export is full."""
    source = BASE / ".cache/datasets/cable-damage/test"
    images = sorted(p for p in (source / "images").glob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
    if not images or any(not (source / "labels" / f"{p.stem}.txt").is_file() for p in images):
        return None
    names = settings["models"]["electrical_damage"]["classes"]
    indexes = {0: names.index("cable_break"), 1: names.index("cable_thunderbolt")}
    target = BASE / ".cache/confusion_cable_test"
    (target / "images/test").mkdir(parents=True, exist_ok=True)
    (target / "labels/test").mkdir(parents=True, exist_ok=True)
    records = []
    for image in images:
        label = source / "labels" / f"{image.stem}.txt"
        converted = []
        for line in label.read_text(encoding="utf-8").splitlines():
            fields = line.split()
            if len(fields) != 5 or int(fields[0]) not in indexes:
                raise ValueError(f"Invalid cable annotation: {label}")
            if not all(0 <= float(v) <= 1 for v in fields[1:]):
                raise ValueError(f"Invalid cable box: {label}")
            converted.append(str(indexes[int(fields[0])]) + " " + " ".join(fields[1:]))
        destination = target / "images/test" / image.name
        if not destination.exists():
            shutil.copy2(image, destination)
        (target / "labels/test" / label.name).write_text("\n".join(converted), encoding="utf-8")
        records.append({"image": image.name, "sha256": sha(image), "source_label_sha256": sha(label)})
    import yaml
    # The loader requires a val key; test is the only evaluated split here.
    data = {"path": str(target), "train": None, "val": "images/test", "test": "images/test", "names": names}
    (target / "data.yaml").write_text(yaml.safe_dump(data), encoding="utf-8")
    manifest = {"source": "https://huggingface.co/datasets/LibreYOLO/cable-damage", "license": "CC BY 4.0",
                "scope": "Cached cable test subset only; covers two of 29 electrical classes; no intact-pole validation.", "records": records}
    (target / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return target / "data.yaml"


def main():
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", default="20261013")
    parser.add_argument("--output", type=Path, default=BASE.parent / "qa_outputs/confusion_matrices_20261013")
    args = parser.parse_args()
    if args.output.exists():
        parser.error("Output exists; choose a new output/name")
    import torch
    import yaml
    from ultralytics import YOLO
    settings = yaml.safe_load((BASE / "config.yaml").read_text(encoding="utf-8"))
    models = settings["models"]
    cable = prepare_cable_test(settings)
    datasets = {"road_damage": BASE / "datasets/road/rdd_subset_20261013/data.yaml",
                "surface_drainage": BASE / "datasets/drainage/surface_balanced_20261013/data.yaml",
                "electrical_damage": cable}
    profiles = {"road_damage": "Small RDD2022 public subset; prior training overlap is unknown.",
                "surface_drainage": "Raw water/blockage checkpoint diagnostics, NOT garbage-specific validation. App suppresses water and keeps blockage manual-only.",
                "electrical_damage": "PARTIAL: cable break/thunderbolt only; other 27 classes and intact hardware not validated."}
    device = 0 if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    args.output.mkdir(parents=True)
    index = {"device": device, "conf": .25, "nms_iou": .45, "model_weights_changed": False,
             "purpose": "Raw checkpoint diagnostics against labeled boxes; application filtering/manual-review gates are not applied.", "models": []}
    canonical = {str((BASE / spec["path"]).resolve()): key for key, spec in models.items() if spec.get("path")}
    cached = {}
    paths = sorted((BASE / "models").rglob("*.pt"))
    for path in paths:
        resolved = str(path.resolve())
        key = canonical.get(resolved)
        if key is None:
            key = "road_damage" if "rdd" in path.name or "road_cuda" in path.name else "environmental_hazards" if "env-hazards" in path.name else "surface_drainage" if path.parent.name == "surfacedrainage" else "privacy_license_plate" if path.parent.name == "privacy" else None
        folder = path.parent / "confusion_matrices" / path.stem / args.name
        if folder.exists():
            parser.error(f"Model artifact directory exists: {folder}")
        folder.mkdir(parents=True)
        row = {"checkpoint": str(path.resolve()), "sha256": sha(path), "model": key,
               "folder": str(folder.resolve()), "splits": {}}
        data = datasets.get(key)
        if data is None or not data.is_file():
            row.update(status="missing_labeled_dataset", reason="Cannot generate a valid confusion matrix without labeled evaluation images for this model.")
        else:
            row.update(status="partial" if key == "electrical_damage" else "generated", dataset=str(data), scope=profiles[key])
            splits = ("test",) if key == "electrical_damage" else ("val", "test")
            cache_key = (row["sha256"], str(data))
            if cache_key in cached:
                previous = cached[cache_key]
                for split in splits:
                    shutil.copytree(Path(previous["folder"]) / split, folder / split)
                row["splits"] = {
                    split: {"count_image": str((folder / split / "confusion_matrix.png").resolve()),
                            "normalized_image": str((folder / split / "confusion_matrix_normalized.png").resolve())}
                    for split in splits
                }
                row["copied_identical_weights_from"] = previous["checkpoint"]
            else:
                model = YOLO(str(path))
                for split in splits:
                    metrics = model.val(data=str(data), split=split, device=device, imgsz=640,
                                        batch=8, workers=0, conf=.25, iou=.45, plots=True,
                                        project=str(folder), name=split, exist_ok=False)
                    matrix = metrics.confusion_matrix.matrix
                    labels = list(model.names.values()) + ["background"]
                    (folder / split / "confusion_matrix.json").write_text(json.dumps({"labels": labels, "rows": "predicted", "columns": "true", "counts": matrix.tolist()}, indent=2), encoding="utf-8")
                    row["splits"][split] = {"count_image": str((folder / split / "confusion_matrix.png").resolve()),
                                             "normalized_image": str((folder / split / "confusion_matrix_normalized.png").resolve())}
                cached[cache_key] = row
        (folder / "status.json").write_text(json.dumps(row, indent=2), encoding="utf-8")
        index["models"].append(row)
        (args.output / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
        print(f"{path.relative_to(BASE)}: {row['status']}")
    gas = models.get("gas_infrastructure_damage", {})
    if gas:
        index["models"].append({"model": "gas_infrastructure_damage", "checkpoint": gas.get("path"), "status": "no_checkpoint_or_dataset", "reason": "Gas remains manual-only."})
    (args.output / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    lines = ["# Confusion matrices", "", "Count and normalized plots are stored beside each checkpoint.",
             "Matrices use raw model detections at confidence 0.25 and NMS IoU 0.45, not app policy.",
             "Electrical is a cable-only subset; drainage is the broader water/blockage benchmark, not garbage validation.", "",
             "| Checkpoint | Status | Plots |", "|---|---|---|"]
    for row in index["models"]:
        links = []
        for split, plots in row.get("splits", {}).items():
            # For duplicate weights, use this checkpoint's copied artifact path.
            for name in ("confusion_matrix.png", "confusion_matrix_normalized.png"):
                target = Path(row["folder"]) / split / name
                portable = Path(os.path.relpath(target, args.output)).as_posix()
                links.append(f"[{split} {'normalized' if 'normalized' in name else 'counts'}]({portable})")
        checkpoint_label = row.get('checkpoint', row['model'])
        if checkpoint_label and Path(checkpoint_label).is_absolute():
            checkpoint_label = Path(checkpoint_label).relative_to(BASE.parent).as_posix()
        lines.append(f"| {checkpoint_label} | {row['status']} | {' · '.join(links) or row.get('reason', '')} |")
    (args.output / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
