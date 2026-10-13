"""Fine-tune a candidate and compare on fixed splits without promoting it."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys
import time

BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True, help="Model key in config.yaml")
    parser.add_argument("--data", required=True, type=Path)
    parser.add_argument("--name", required=True)
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--qa", type=Path, required=True)
    parser.add_argument("--baseline-only", action="store_true", help="Validate without training when required negatives are missing")
    parser.add_argument("--initial-weights", type=Path, help="Local fine-tuning initializer; baseline remains the configured production checkpoint")
    args = parser.parse_args()
    import torch
    import yaml
    from PIL import Image
    from ultralytics import YOLO

    settings = yaml.safe_load((BASE / "config.yaml").read_text(encoding="utf-8"))
    spec = settings["models"][args.model]
    checkpoint = BASE / spec["path"]
    candidate = checkpoint.parent / f"{args.name}-candidate.pt"
    run = BASE / "runs" / "comparison" / args.name
    if run.exists() or candidate.exists():
        parser.error("Experiment already exists; use a new --name")
    data_path = args.data.resolve()
    data = yaml.safe_load(data_path.read_text(encoding="utf-8"))
    root = Path(data["path"])
    if not root.is_absolute():
        root = data_path.parent / root
    names = data["names"]
    if isinstance(names, dict):
        names = [names[k] for k in sorted(names)]
    if names != spec["classes"]:
        parser.error("Dataset class order must match production configuration")
    qa = json.loads(args.qa.read_text(encoding="utf-8"))
    qa_hashes = {s["sha256"] for s in qa["samples"]}
    def pixels(path):
        with Image.open(path) as im:
            rgb = im.convert("RGB")
            return hashlib.sha256(str(rgb.size).encode() + rgb.tobytes()).hexdigest()
    qa_pixels = {pixels(Path(s["path"])) for s in qa["samples"]}
    seen = {}
    inventory = []
    split_paths = {}
    for split in ("train", "val", "test"):
        folder = root / data[split]
        paths = sorted(p for p in folder.rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
        if not paths:
            parser.error(f"No images in {split}")
        split_paths[split] = paths
        for path in paths:
            sha = digest(path)
            decoded = pixels(path)
            if sha in qa_hashes or decoded in qa_pixels:
                parser.error(f"Held-out QA leakage: {path}")
            if decoded in seen and seen[decoded] != split:
                parser.error(f"Duplicate crosses dataset splits: {path}")
            seen[decoded] = split
            label = root / "labels" / split / f"{path.stem}.txt"
            if not label.is_file():
                parser.error(f"Missing annotation: {label}")
            annotations = label.read_text(encoding="utf-8").splitlines()
            for annotation in annotations:
                fields = annotation.split()
                if len(fields) != 5 or not 0 <= int(fields[0]) < len(names):
                    parser.error(f"Invalid YOLO annotation: {label}")
                coords = [float(v) for v in fields[1:]]
                if not all(0 <= v <= 1 for v in coords) or min(coords[2:]) <= 0:
                    parser.error(f"Invalid box: {label}")
            inventory.append({"split": split, "path": str(path), "sha256": sha,
                              "pixel_sha256": decoded, "label_sha256": digest(label),
                              "negative": not annotations})
    device = 0 if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    run.mkdir(parents=True)
    report = {"model": args.model, "device": device, "torch": torch.__version__,
              "device_name": torch.cuda.get_device_name(0) if device == 0 else str(device),
              "command": sys.argv, "checkpoint": str(checkpoint),
              "checkpoint_sha256": digest(checkpoint), "config_sha256": digest(BASE / "config.yaml"),
              "dataset": str(data_path), "data_yaml_sha256": digest(data_path),
              "dataset_inventory": inventory, "validation": {},
              "limitations": ["No labeled local Philippine dataset supplied.",
                              "Original checkpoint training-image provenance is incomplete; public-split results are regression comparisons, not proof of unseen generalization.",
                              "Folder-level blocked-drain boxes do not establish precise blockage localization."]}
    source_manifest = data_path.parent / "manifest.json"
    if source_manifest.exists():
        report["source_manifest"] = json.loads(source_manifest.read_text(encoding="utf-8"))
    def save():
        encoded = json.dumps(report, indent=2, default=lambda value: value.item())
        temporary = run / "report.json.tmp"
        temporary.write_text(encoded, encoding="utf-8")
        temporary.replace(run / "report.json")
    save()
    common = dict(data=str(data_path), device=device, imgsz=640, batch=args.batch,
                  workers=0, plots=True, project=str(run), exist_ok=False)
    def evaluate(path, label):
        model = YOLO(str(path))
        results = {}
        for split in ("val", "test"):
            metrics = model.val(split=split, name=f"{label}_{split}", **common)
            negatives = [Path(x["path"]) for x in inventory if x["split"] == split and x["negative"]]
            false_positives = sum(len(r.boxes) > 0 for r in model.predict(
                source=[str(p) for p in negatives], device=device, imgsz=640,
                conf=spec["confidence_threshold"], iou=spec.get("iou_threshold", .45), verbose=False
            )) if negatives else 0
            results[split] = {"precision": float(metrics.box.mp), "recall": float(metrics.box.mr),
                              "mAP50": float(metrics.box.map50), "mAP50_95": float(metrics.box.map),
                              "per_class": metrics.summary(), "speed_ms_per_image": metrics.speed,
                              "negative_images": len(negatives), "negative_images_with_detection": false_positives}
        sample = Image.open(split_paths["test"][0]).convert("RGB")
        for _ in range(3):
            model.predict(sample, device=device, imgsz=640, verbose=False)
        if device == 0:
            torch.cuda.synchronize()
        start = time.perf_counter()
        for _ in range(20):
            model.predict(sample, device=device, imgsz=640, verbose=False)
        if device == 0:
            torch.cuda.synchronize()
        results["warm_inference_wall_ms"] = (time.perf_counter() - start) * 50
        return results
    report["validation"]["baseline"] = evaluate(checkpoint, "baseline")
    save()
    if args.baseline_only:
        report["production_replacement"] = "Not performed; baseline-only evaluation."
        save()
        print(f"Baseline evidence saved to {run / 'report.json'}")
        return
    start = time.perf_counter()
    initial = args.initial_weights.resolve() if args.initial_weights else checkpoint
    if not initial.is_file():
        raise FileNotFoundError(initial)
    report["initial_weights"] = str(initial)
    report["initial_weights_sha256"] = digest(initial)
    model = YOLO(str(initial))
    model.train(data=str(data_path), epochs=args.epochs, batch=args.batch, imgsz=640,
                device=device, workers=0, project=str(run), name="train", exist_ok=False,
                optimizer="AdamW", lr0=.0001, patience=10, seed=17,
                cache=False, plots=True, pretrained=True, save=True)
    report["training_seconds"] = time.perf_counter() - start
    shutil.copy2(run / "train/weights/best.pt", candidate)
    report["candidate"] = str(candidate)
    report["candidate_sha256"] = digest(candidate)
    save()
    report["validation"]["candidate"] = evaluate(candidate, "candidate")
    # Swap only the in-memory cache for the candidate QA run; never edit config.
    from src.services.detection_service import DetectionService
    service = DetectionService()
    service.model_manager.device = device
    service.model_manager.models[args.model] = YOLO(str(candidate))
    report["candidate_qa"] = []
    for sample in qa["samples"]:
        with Image.open(sample["path"]) as source:
            result = service.comprehensive_detection(source.convert("RGB"), sample["category"])
        report["candidate_qa"].append({"name": sample["name"], "sha256": sample["sha256"], "result": result})
    report["production_replacement"] = "Not performed; requires assessment of split metrics, negatives and held-out QA."
    if digest(checkpoint) != report["checkpoint_sha256"] or digest(BASE / "config.yaml") != report["config_sha256"]:
        raise RuntimeError("Production files changed during experiment")
    save()
    print(f"Comparison evidence saved to {run / 'report.json'}")


if __name__ == "__main__":
    main()
