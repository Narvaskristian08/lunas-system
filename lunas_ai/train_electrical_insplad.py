#!/usr/bin/env python3
"""Train the backend electrical model from an exported InsPLAD dataset.

The script deliberately requires a local base checkpoint. Ultralytics is not
allowed to silently download ``yolov8n.pt`` because the repository workflow
does not install or fetch dependencies automatically.
"""

from __future__ import annotations

import argparse
import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATA = BASE_DIR / "datasets/electrical/insplad/data.yaml"
DEFAULT_OUTPUT = BASE_DIR / "models/electrical/electricpole/best.pt"
LOCAL_CACHE = BASE_DIR / ".cache"
os.environ.setdefault("YOLO_CONFIG_DIR", str(LOCAL_CACHE / "ultralytics"))
os.environ.setdefault("MPLCONFIGDIR", str(LOCAL_CACHE / "matplotlib-training"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train the LUNAS electrical category model"
    )
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument(
        "--base-model",
        type=Path,
        default=Path("yolov8n.pt"),
        help="Local YOLOv8 detection checkpoint; it will not be downloaded",
    )
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument(
        "--fraction",
        type=float,
        default=1.0,
        help="Fraction of the exported training set to use (keep 1.0 for QA training)",
    )
    parser.add_argument(
        "--skip-validation",
        action="store_true",
        help="Skip per-epoch validation for long CPU runs; validate the final checkpoint separately",
    )
    parser.add_argument("--device", type=str, default=None)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Final checkpoint path consumed by the backend",
    )
    parser.add_argument("--name", default="electrical_insplad_yolov8n")
    return parser.parse_args()


def resolve_local_checkpoint(path: Path) -> Path:
    candidate = path.expanduser()
    if not candidate.is_absolute():
        candidate = BASE_DIR / candidate
    candidate = candidate.resolve()
    if not candidate.is_file():
        raise FileNotFoundError(
            f"Local base checkpoint not found: {candidate}. "
            "Place yolov8n.pt there or pass --base-model /path/to/model.pt; "
            "automatic downloads are disabled."
        )
    return candidate


def main() -> int:
    args = parse_args()
    data_path = args.data.expanduser()
    if not data_path.is_absolute():
        data_path = BASE_DIR / data_path
    data_path = data_path.resolve()
    if not data_path.is_file():
        raise FileNotFoundError(
            f"YOLO data configuration not found: {data_path}. "
            "Run tools/prepare_insplad.py first."
        )

    base_checkpoint = resolve_local_checkpoint(args.base_model)
    if not 0 < args.fraction <= 1:
        raise SystemExit("--fraction must be greater than zero and no greater than one")
    output_path = args.output.expanduser()
    if not output_path.is_absolute():
        output_path = BASE_DIR / output_path
    output_path = output_path.resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        from src.utils.config import config
        from src.utils.logger import logger
        from ultralytics import YOLO
    except ImportError as exc:
        raise SystemExit(
            "Ultralytics is not available. Install dependencies separately "
            "only when your team is ready to train."
        ) from exc

    device = args.device or config.get_device()
    logger.info("Training electrical model from %s", data_path)
    logger.info("Using local YOLOv8n checkpoint: %s", base_checkpoint)
    logger.info("Output checkpoint: %s", output_path)

    model = YOLO(str(base_checkpoint))
    results = model.train(
        data=str(data_path),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        fraction=args.fraction,
        device=device,
        name=args.name,
        project=str(BASE_DIR / "runs/train"),
        exist_ok=True,
        pretrained=True,
        patience=50,
        save_period=10,
        cache=False,
        workers=args.workers,
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3.0,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=0.0,
        translate=0.1,
        scale=0.5,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.0,
        copy_paste=0.0,
        val=not args.skip_validation,
    )

    run_best = Path(results.save_dir) / "weights/best.pt"
    if not run_best.is_file():
        raise FileNotFoundError(f"Training completed without best.pt: {run_best}")

    shutil.copy2(run_best, output_path)
    logger.info("Electrical model installed for backend use: %s", output_path)
    print(f"Saved trained electrical model to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
