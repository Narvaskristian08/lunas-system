#!/usr/bin/env python3
"""Prepare only electrical damage annotations for the category detector.

The electrical category must not learn to detect ordinary poles, insulators, or
other intact hardware.  This utility therefore uses only two sources whose
selected labels describe faults or damage:

* sxiong/Power-equipment-image-dataset, transmission-line object detection
  archive (MIT; documented fault labels)
* LibreYOLO/cable-damage (CC BY 4.0; break and thunderbolt labels)

The source archives are downloaded into ``lunas_ai/.cache`` and the combined
YOLO export is written under the ignored ``datasets/electrical/damage`` path.
No package installation is performed by this script.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[1]
CACHE_DIR = BASE_DIR / ".cache"
DOWNLOAD_DIR = CACHE_DIR / "datasets"
DEFAULT_OUTPUT = BASE_DIR / "datasets/electrical/damage"
POWER_REPO = "sxiong/Power-equipment-image-dataset"
POWER_FILE = "transmission line object detection.zip"
CABLE_REPO = "LibreYOLO/cable-damage"

# These are the documented fault/damage labels selected for the transmission-
# line object-detection subset. An allowlist is intentional: if the source archive
# changes and adds intact asset classes, those classes are not silently copied
# into the damage detector.
POWER_DAMAGE_LABELS = {
    "blq_bs": "surge_arrester_discoloration",
    "blq_jyjc": "surge_arrester_insulation_breakdown",
    "blq_lh": "surge_arrester_aging",
    "blq_lmsd": "surge_arrester_loose_nut",
    "blq_ps": "surge_arrester_damage",
    "blq_qx": "surge_arrester_ground_lead_missing",
    "blq_tl": "surge_arrester_detached",
    "blq_yxdk": "surge_arrester_ground_lead_broken",
    "czjyz_lw": "porcelain_insulator_crack",
    "czjyz_ps": "porcelain_insulator_damage",
    "czjyz_sl": "porcelain_insulator_flashover",
    "czjyz_qx": "porcelain_insulator_lead_missing",
    "dx_jypps": "conductor_insulation_damage",
    "dx_dg": "conductor_strand_breakage",
    "dx_sg": "conductor_strand_loosening",
    "dx_sz": "conductor_vegetation_encroachment",
    "dx_yhdjc": "conductor_crossarm_contact",
    "fhjyz_ps": "composite_insulator_damage",
    "gydxjd_fh": "high_voltage_joint_overheating",
    "gydxjd_ps": "high_voltage_joint_damage",
    "jj_jxps": "line_hardware_terminal_damage",
    "jj_xjlw": "line_hardware_clamp_crack",
    "jj_xjsd": "line_hardware_clamp_loose",
    "jyspbg": "insulator_shed_chipping",
    "nw": "bird_nest_on_line",
    "yw": "foreign_object_on_line",
    "yxdk": "ground_lead_broken",
}
CABLE_DAMAGE_LABELS = {
    "break": "cable_break",
    "thunderbolt": "cable_thunderbolt",
}

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download and combine damage-only electrical YOLO datasets"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Ignored output directory for the combined YOLO dataset",
    )
    parser.add_argument(
        "--max-power-images",
        type=int,
        default=None,
        help="Optional deterministic cap on Power Equipment images before splitting",
    )
    parser.add_argument(
        "--no-download",
        action="store_true",
        help="Use already downloaded files in lunas_ai/.cache",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace an existing generated output directory",
    )
    return parser.parse_args()


def configure_local_caches() -> None:
    """Keep downloader and ML caches within the project AI directory."""
    os.environ.setdefault("HF_HOME", str(CACHE_DIR / "huggingface"))
    os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
    os.environ.setdefault("YOLO_CONFIG_DIR", str(CACHE_DIR / "ultralytics"))
    os.environ.setdefault("FIFTYONE_DATABASE_DIR", str(CACHE_DIR / "fiftyone"))
    os.environ.setdefault("MPLCONFIGDIR", str(CACHE_DIR / "matplotlib"))


def download_sources() -> tuple[Path, Path]:
    """Download only the selected damage sources into the ignored cache."""
    from huggingface_hub import hf_hub_download, snapshot_download

    power_dir = DOWNLOAD_DIR / "power-equipment"
    cable_dir = DOWNLOAD_DIR / "cable-damage"
    power_dir.mkdir(parents=True, exist_ok=True)
    cable_dir.mkdir(parents=True, exist_ok=True)

    power_archive = Path(
        hf_hub_download(
            repo_id=POWER_REPO,
            filename=POWER_FILE,
            repo_type="dataset",
            local_dir=str(power_dir),
        )
    )
    snapshot_download(
        repo_id=CABLE_REPO,
        repo_type="dataset",
        local_dir=str(cable_dir),
        ignore_patterns=["*.md", ".gitattributes"],
    )
    return power_archive, cable_dir


def find_existing_power_archive() -> Path:
    candidates = sorted((DOWNLOAD_DIR / "power-equipment").glob("*.zip"))
    if not candidates:
        raise FileNotFoundError(
            "Power Equipment archive is not present. Run without --no-download."
        )
    return candidates[0]


def safe_extract(archive_path: Path, output_dir: Path) -> None:
    """Extract a trusted dataset while rejecting path traversal entries."""
    output_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive_path) as archive:
        root = output_dir.resolve()
        for member in archive.infolist():
            target = (output_dir / member.filename).resolve()
            if target != root and root not in target.parents:
                raise RuntimeError(f"Unsafe archive member: {member.filename}")
        archive.extractall(output_dir)


def load_yaml(path: Path) -> dict[str, Any]:
    import yaml

    with path.open("r", encoding="utf-8") as handle:
        value = yaml.safe_load(handle) or {}
    if not isinstance(value, dict):
        raise ValueError(f"Expected mapping in {path}")
    return value


def as_names(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, dict):
        return [str(value[index]) for index in sorted(value, key=lambda item: int(item))]
    raise ValueError("YOLO data.yaml has no usable names list")


def resolve_image_dir(data_yaml: Path, data: dict[str, Any], split: str) -> Path:
    raw_value = data.get(split)
    if raw_value is None and split == "val":
        raw_value = data.get("valid")
    if raw_value is None:
        raise FileNotFoundError(f"Split '{split}' is missing from {data_yaml}")

    relative = Path(str(raw_value))
    configured_root = data.get("path")
    candidates = [data_yaml.parent / relative]
    if configured_root:
        configured = Path(str(configured_root))
        candidates.extend(
            [
                data_yaml.parent / configured / relative,
                configured / relative,
            ]
        )

    for candidate in candidates:
        candidate = candidate.resolve()
        if candidate.name == "images" and candidate.is_dir():
            return candidate
        nested_images = candidate / "images"
        if nested_images.is_dir():
            return nested_images.resolve()
    raise FileNotFoundError(
        f"Could not resolve image directory for split '{split}' from {data_yaml}"
    )


def canonical_label(raw_label: str, aliases: dict[str, str]) -> str | None:
    token = raw_label.strip().lower()
    if token in aliases:
        return aliases[token]
    compact = "".join(character for character in token if character.isalnum())
    for alias, canonical in aliases.items():
        if compact == "".join(character for character in alias if character.isalnum()):
            return canonical
    return None


def read_damage_annotations(
    label_path: Path,
    source_names: list[str],
    aliases: dict[str, str],
    class_indexes: dict[str, int],
) -> list[str]:
    output: list[str] = []
    if not label_path.is_file():
        return output
    for raw_line in label_path.read_text(encoding="utf-8").splitlines():
        fields = raw_line.split()
        if len(fields) != 5:
            continue
        try:
            source_index = int(fields[0])
            coordinates = [float(value) for value in fields[1:]]
        except ValueError:
            continue
        if not 0 <= source_index < len(source_names):
            continue
        class_name = canonical_label(source_names[source_index], aliases)
        if class_name is None or not all(0.0 <= value <= 1.0 for value in coordinates):
            continue
        output.append(
            " ".join([str(class_indexes[class_name]), *[str(value) for value in coordinates]])
        )
    return output


def copy_pairs(
    *,
    source: str,
    split: str,
    pairs: list[tuple[Path, list[str]]],
    output_dir: Path,
) -> int:
    target_images = output_dir / "images" / split
    target_labels = output_dir / "labels" / split
    target_images.mkdir(parents=True, exist_ok=True)
    target_labels.mkdir(parents=True, exist_ok=True)
    for index, (image_path, annotations) in enumerate(pairs):
        output_stem = f"{source}_{split}_{index:06d}"
        shutil.copy2(image_path, target_images / f"{output_stem}{image_path.suffix.lower()}")
        (target_labels / f"{output_stem}.txt").write_text(
            "\n".join(annotations) + "\n", encoding="utf-8"
        )
    return len(pairs)


def collect_power_voc_pairs(
    extracted_dir: Path,
    class_indexes: dict[str, int],
) -> list[tuple[Path, list[str]]]:
    """Read only allowlisted damage objects from the Power VOC archive."""
    pairs: list[tuple[Path, list[str]]] = []
    for image_dir in sorted(extracted_dir.rglob("JPEGImages")):
        annotation_dir = image_dir.parent / "Annotations"
        for image_path in sorted(image_dir.iterdir()):
            if image_path.suffix.lower() not in IMAGE_SUFFIXES:
                continue
            annotation_path = annotation_dir / f"{image_path.stem}.xml"
            if not annotation_path.is_file():
                continue
            try:
                root = ET.parse(annotation_path).getroot()
                width = float(root.findtext("./size/width", "0"))
                height = float(root.findtext("./size/height", "0"))
                if width <= 0 or height <= 0:
                    continue
                annotations: list[str] = []
                for obj in root.findall("./object"):
                    class_name = canonical_label(
                        obj.findtext("./name", ""), POWER_DAMAGE_LABELS
                    )
                    box = obj.find("./bndbox")
                    if class_name is None or box is None:
                        continue
                    xmin = max(0.0, min(width, float(box.findtext("xmin", "0"))))
                    ymin = max(0.0, min(height, float(box.findtext("ymin", "0"))))
                    xmax = max(0.0, min(width, float(box.findtext("xmax", "0"))))
                    ymax = max(0.0, min(height, float(box.findtext("ymax", "0"))))
                    if xmax <= xmin or ymax <= ymin:
                        continue
                    annotations.append(
                        " ".join(
                            [
                                str(class_indexes[class_name]),
                                str(((xmin + xmax) / 2.0) / width),
                                str(((ymin + ymax) / 2.0) / height),
                                str((xmax - xmin) / width),
                                str((ymax - ymin) / height),
                            ]
                        )
                    )
                if annotations:
                    pairs.append((image_path, annotations))
            except (ET.ParseError, TypeError, ValueError):
                continue
    return pairs


def collect_cable_pairs(
    data_yaml: Path,
    split: str,
    class_indexes: dict[str, int],
) -> list[tuple[Path, list[str]]]:
    data = load_yaml(data_yaml)
    source_names = as_names(data.get("names"))
    image_dir = resolve_image_dir(data_yaml, data, split)
    label_dir = image_dir.parent / "labels"
    pairs: list[tuple[Path, list[str]]] = []
    for image_path in sorted(image_dir.iterdir()):
        if image_path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        annotations = read_damage_annotations(
            label_dir / f"{image_path.stem}.txt",
            source_names,
            CABLE_DAMAGE_LABELS,
            class_indexes,
        )
        if annotations:
            pairs.append((image_path, annotations))
    return pairs


def write_data_yaml(output_dir: Path, classes: list[str]) -> None:
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


def main() -> int:
    args = parse_args()
    if args.max_power_images is not None and args.max_power_images <= 0:
        raise SystemExit("--max-power-images must be greater than zero")
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
        power_archive = find_existing_power_archive()
        cable_dir = DOWNLOAD_DIR / "cable-damage"
    else:
        power_archive, cable_dir = download_sources()
    if not (cable_dir / "data.yaml").is_file():
        raise FileNotFoundError(f"Cable Damage data.yaml not found in {cable_dir}")

    power_extracted = DOWNLOAD_DIR / "power-equipment" / "extracted"
    power_ready = power_extracted / ".ready"
    if not power_ready.is_file():
        if power_extracted.exists():
            shutil.rmtree(power_extracted)
        safe_extract(power_archive, power_extracted)
        power_ready.write_text("voc", encoding="utf-8")

    classes = list(POWER_DAMAGE_LABELS.values()) + list(CABLE_DAMAGE_LABELS.values())
    class_indexes = {name: index for index, name in enumerate(classes)}
    counts: dict[str, int] = {}
    power_pairs = collect_power_voc_pairs(power_extracted, class_indexes)
    if args.max_power_images is not None:
        power_pairs = power_pairs[: args.max_power_images]
    train_end = max(1, int(len(power_pairs) * 0.8))
    val_end = max(train_end + 1, int(len(power_pairs) * 0.9))
    power_splits = {
        "train": power_pairs[:train_end],
        "val": power_pairs[train_end:val_end],
        "test": power_pairs[val_end:],
    }
    for split in ("train", "val", "test"):
        power_count = copy_pairs(
            source="power",
            split=split,
            pairs=power_splits[split],
            output_dir=output_dir,
        )
        cable_count = copy_pairs(
            source="cable",
            split=split,
            pairs=collect_cable_pairs(cable_dir / "data.yaml", split, class_indexes),
            output_dir=output_dir,
        )
        counts[split] = power_count + cable_count

    if any(counts[split] == 0 for split in ("train", "val", "test")):
        raise RuntimeError(f"Damage export must contain all splits; got {counts}")
    write_data_yaml(output_dir, classes)
    manifest = {
        "task": "damage-only electrical object detection",
        "sources": [
            {
                "id": POWER_REPO,
                "subset": "transmission line object detection",
                "license": "MIT",
                "labels": list(POWER_DAMAGE_LABELS.values()),
            },
            {
                "id": CABLE_REPO,
                "license": "CC BY 4.0",
                "labels": list(CABLE_DAMAGE_LABELS.values()),
            },
        ],
        "classes": classes,
        "image_counts": counts,
        "asset_only_sources_excluded": [
            "Voxel51/InsPLAD detection subset",
            "hotosm/streetlevel-poles",
            "OHL-UK pole localization",
        ],
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Prepared damage-only electrical dataset at {output_dir}")
    print(f"Images by split: {counts}")
    print(f"Classes ({len(classes)}): {', '.join(classes)}")
    print(f"YOLO configuration: {output_dir / 'data.yaml'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
