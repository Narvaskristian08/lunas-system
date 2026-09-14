#!/usr/bin/env python3
"""Train the backend surface-drainage advisory detector.

The base checkpoint must already exist locally. Automatic model downloads are
disabled so a category cannot silently receive an unrelated checkpoint.
"""

from __future__ import annotations

import argparse
import os
import shutil
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATA = BASE_DIR / "datasets/drainage/surface/data.yaml"
DEFAULT_OUTPUT = BASE_DIR / "models/drainage/surfacedrainage/best.pt"
CACHE_DIR = BASE_DIR / ".cache"
os.environ.setdefault("YOLO_CONFIG_DIR", str(CACHE_DIR / "ultralytics"))
os.environ.setdefault("MPLCONFIGDIR", str(CACHE_DIR / "matplotlib-training"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train the LUNAS surface-drainage issue detector"
    )
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument(
        "--base-model",
        type=Path,
        default=Path("yolov8n.pt"),
        help="Local YOLOv8n checkpoint; it will not be downloaded",
    )
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--fraction", type=float, default=1.0)
    parser.add_argument("--device", type=str, default=None)
    parser.add_argument("--workers", type=int, default=0)
    parser.add_argument(
        "--skip-validation",
        action="store_true",
        help="Skip per-epoch validation for a quick smoke run",
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--name", default="surface_drainage_yolov8n")
    return parser.parse_args()


def absolute_path(path: Path) -> Path:
    candidate = path.expanduser()
    if not candidate.is_absolute():
        candidate = BASE_DIR / candidate
    return candidate.resolve()


def main() -> int:
    args = parse_args()
    data_path = absolute_path(args.data)
    base_checkpoint = absolute_path(args.base_model)
    output_path = absolute_path(args.output)
    if not data_path.is_file():
        raise FileNotFoundError(
            f"Surface drainage data.yaml not found: {data_path}. "
            "Run tools/prepare_surface_drainage.py first."
        )
    if not base_checkpoint.is_file():
        raise FileNotFoundError(
            f"Local base checkpoint not found: {base_checkpoint}. "
            "Automatic downloads are disabled."
        )
    if not 0 < args.fraction <= 1:
        raise SystemExit("--fraction must be greater than zero and no greater than one")
    if args.epochs <= 0 or args.batch <= 0 or args.imgsz <= 0:
        raise SystemExit("--epochs, --batch, and --imgsz must be greater than zero")

    try:
        from src.utils.config import config
        from src.utils.logger import logger
        from ultralytics import YOLO
    except ImportError as exc:
        raise SystemExit(
            "Ultralytics is not available. Install dependencies separately only "
            "when your team is ready to train."
        ) from exc

    device = args.device or config.get_device()
    logger.info("Training surface drainage model from %s", data_path)
    logger.info("Using local YOLOv8n checkpoint: %s", base_checkpoint)
    logger.info("Using device: %s", device)
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
        patience=30,
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
    output_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(run_best, output_path)
    logger.info("Surface drainage model installed for backend use: %s", output_path)
    print(f"Saved trained surface drainage model to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
