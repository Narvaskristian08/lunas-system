"""Run the five Downloads regression images without using them for training."""

import argparse
import hashlib
import json
from pathlib import Path
import sys
import time

BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE))

SAMPLES = [
    ("fire", "other", "844301033_1411316137780876_8638335178326863001_n.jpg", "fire_source"),
    ("pole", "electrical", "846279126_907408942309941_4406752512608342515_n.jpg", "no bird_nest_on_line false positive"),
    ("flood", "drainage", "847915701_1180016337691912_580455796795374560_n.jpg", "standing_water"),
    ("streetlight", "streetlight", "848533950_958568280133192_6363952578695930284_n.jpg", "no damage detection acceptable"),
    ("potholes", "road", "846483029_1746278599779825_8921914851645189267_n.jpg", "pothole"),
]


def main():
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--images", type=Path, default=Path.home() / "Downloads")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        parser.error("Choose a new output path to preserve previous QA evidence")
    for _, _, filename, _ in SAMPLES:
        if not (args.images / filename).is_file():
            parser.error(f"Missing held-out image: {args.images / filename}")

    from PIL import Image
    import torch
    from src.services.detection_service import DetectionService
    from src.utils.config import config

    service = DetectionService()
    report = {"purpose": "held-out regression only; never training data",
              "torch": torch.__version__, "device": str(service.model_manager.device),
              "metric_limit": "Five qualitative cases cannot establish precision, recall or mAP.",
              "checkpoints": [], "samples": []}
    for checkpoint in sorted((BASE / "models").rglob("*.pt")):
        report["checkpoints"].append({"path": checkpoint.relative_to(BASE).as_posix(),
                                      "sha256": hashlib.sha256(checkpoint.read_bytes()).hexdigest()})
    for name, category, filename, expected in SAMPLES:
        path = args.images / filename
        with Image.open(path) as source:
            image = source.convert("RGB")
        start = time.perf_counter()
        result = service.comprehensive_detection(image, category)
        report["samples"].append({"name": name, "category": category,
                                  "path": str(path.resolve()),
                                  "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                                  "expected": expected,
                                  "elapsed_seconds_including_model_load": time.perf_counter() - start,
                                  "result": result})
    report["config_sha256"] = hashlib.sha256((BASE / "config.yaml").read_bytes()).hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Saved held-out QA evidence to {args.output}")


if __name__ == "__main__":
    main()
