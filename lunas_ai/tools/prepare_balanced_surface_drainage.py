"""Balance surface-drainage training using clear drains and reviewed dry roads.

This exports a new dataset without modifying the previous experiment's data.
Drainage split membership is retained. Extra road negatives retain their RDD
split membership. Negative oversampling occurs exclusively in training.
"""

import hashlib
import json
from pathlib import Path
import random
import shutil

import yaml

BASE = Path(__file__).resolve().parents[1]
SOURCE = BASE / "datasets/drainage/surface"
ROAD = BASE / "datasets/road/rdd_subset_20261013"
OUTPUT = BASE / "datasets/drainage/surface_balanced_20261013"
# Reviewed contact sheets in .cache/surface_review. Exclude snow, wet roads,
# visible puddles and scenes too dark/ambiguous to establish a negative.
EXCLUDED = {"train": {0, 12, 16, 17, 25, 27},
            "val": {1, 4, 6, 11, 15, 17}, "test": {4, 13, 17}}


def main():
    if OUTPUT.exists():
        raise SystemExit("Output exists; preserve previous data and choose a new path")
    selected = {}
    for split in ("train", "val", "test"):
        paths = [p for p in sorted((ROAD / "images" / split).glob("*"))
                 if not (ROAD / "labels" / split / f"{p.stem}.txt").read_text().strip()]
        random.Random(41).shuffle(paths)
        paths = paths[:30 if split == "train" else 20]
        selected[split] = [p for index, p in enumerate(paths) if index not in EXCLUDED[split]]
    manifest = {"task": "Visible roadside surface water and blocked surface drains only",
                "excluded_scope": ["indoor drains", "underground pipe condition", "sewer interiors"],
                "sources": json.loads((SOURCE / "manifest.json").read_text())["sources"],
                "negative_source": {"url": "https://huggingface.co/datasets/dronefreak/RDD2022",
                                    "license": "CC BY-SA 4.0",
                                    "attribution": "Arya, Maeda, Ghosh, Toshniwal and Sekimoto; RDD2022",
                                    "revision": json.loads((ROAD / "manifest.json").read_text())["revision"],
                                    "review": "Dry roads visually reviewed for absence of surface water/visible blocked drains. Snow, wet, puddled and ambiguous scenes excluded."},
                "review_excluded_contact_sheet_indices": {k: sorted(v) for k, v in EXCLUDED.items()},
                "oversampling": "Training only: clear drains 15 copies each; reviewed dry roads 4 copies each. No extra independent information implied.",
                "records": [], "counts": {}}
    for split in ("train", "val", "test"):
        (OUTPUT / "images" / split).mkdir(parents=True)
        (OUTPUT / "labels" / split).mkdir(parents=True)
        def copy(image, label, stem, origin):
            target = OUTPUT / "images" / split / (stem + image.suffix)
            shutil.copy2(image, target)
            (OUTPUT / "labels" / split / (stem + ".txt")).write_text(label, encoding="utf-8")
            manifest["records"].append({"split": split, "source": origin, "source_path": str(image),
                                        "image": str(target), "negative": not label.strip(),
                                        "sha256": hashlib.sha256(image.read_bytes()).hexdigest()})
        for path in sorted((SOURCE / "images" / split).glob("*")):
            label = (SOURCE / "labels" / split / (path.stem + ".txt")).read_text()
            repetitions = 15 if split == "train" and not label.strip() else 1
            for index in range(repetitions):
                copy(path, label, f"{path.stem}_repeat{index:02d}", "surface_drainage")
        for path in selected[split]:
            for index in range(4 if split == "train" else 1):
                copy(path, "", f"dry_road_{path.stem}_repeat{index:02d}", "reviewed_RDD2022")
        records = [r for r in manifest["records"] if r["split"] == split]
        manifest["counts"][split] = {"images": len(records), "negatives": sum(r["negative"] for r in records),
                                     "unique_images": len({r["sha256"] for r in records})}
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (OUTPUT / "data.yaml").write_text(yaml.safe_dump({"path": str(OUTPUT), "train": "images/train",
                                                     "val": "images/val", "test": "images/test",
                                                     "names": ["standing_water", "blocked_surface_drain"]}), encoding="utf-8")
    print(json.dumps(manifest["counts"], indent=2))


if __name__ == "__main__":
    main()
