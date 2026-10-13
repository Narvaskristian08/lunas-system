"""Prepare a reproducible RDD2022 subset, preserving upstream split membership."""

from concurrent.futures import ThreadPoolExecutor
import argparse
import hashlib
import json
from pathlib import Path
import random
import time

import requests
from PIL import Image
import yaml

BASE = Path(__file__).resolve().parents[1]
REPO = "dronefreak/RDD2022"
NAMES = ["longitudinal_crack", "transverse_crack", "alligator_crack", "pothole"]


def get(url):
    for attempt in range(12):
        response = requests.get(url, timeout=90)
        if response.status_code == 429 or response.status_code >= 500:
            time.sleep(45 if response.status_code == 429 else min(30, 2 ** attempt))
            continue
        response.raise_for_status()
        return response
    raise RuntimeError(f"Download failed after retries: {url}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=BASE / "datasets/road/rdd_subset_20261013")
    parser.add_argument("--resume", action="store_true", help="Resume an incomplete export using its pinned source revision")
    args = parser.parse_args()
    output = args.output.resolve()
    if output.exists() and not args.resume:
        parser.error("Output already exists; choose a new path")
    if (output / "manifest.json").exists():
        parser.error("Export is already complete; choose a new output path")
    if args.resume and output.exists() and not (output / "SOURCE_README.md").exists():
        parser.error("Resume requires an existing incomplete RDD export")
    info = get(f"https://huggingface.co/api/datasets/{REPO}").json()
    preparation = output / "preparation.json"
    revision = json.loads(preparation.read_text(encoding="utf-8"))["revision"] if preparation.exists() else info["sha"]
    if info.get("cardData", {}).get("license") != "cc-by-sa-4.0":
        parser.error("Upstream license changed; inspect before downloading")
    raw = f"https://huggingface.co/datasets/{REPO}/resolve/{revision}/"
    card = get(raw + "README.md").text
    selected = []
    for split, shards in (("train", 9), ("valid", 2), ("test", 2)):
        for shard in range(shards):
            prefix = f"data/images/{split}/shard_{shard:03d}/"
            rows = [json.loads(line) for line in get(raw + prefix + "metadata.jsonl").text.splitlines()]
            random.Random(17 + shard).shuffle(rows)
            # Keep all annotations, including cracks on pothole images.
            buckets = [[], [], []]
            for row in rows:
                cats = row["objects"]["categories"]
                buckets[0 if not cats else 1 if 3 in cats else 2].append(row)
            limits = (15, 30, 45) if split == "train" else (10, 20, 30)
            for bucket, limit in zip(buckets, limits):
                for row in bucket[:limit]:
                    selected.append(("val" if split == "valid" else split, prefix, row))
    output.mkdir(parents=True, exist_ok=args.resume)
    preparation.write_text(json.dumps({"revision": revision, "selection": selected}, indent=2), encoding="utf-8")
    (output / "SOURCE_README.md").write_text(card, encoding="utf-8")
    for split in ("train", "val", "test"):
        (output / "images" / split).mkdir(parents=True, exist_ok=args.resume)
        (output / "labels" / split).mkdir(parents=True, exist_ok=args.resume)

    def download(item):
        split, prefix, row = item
        filename = row["file_name"]
        path = output / "images" / split / filename
        if not path.is_file():
            content = get(raw + prefix + filename).content
            temporary = path.with_suffix(path.suffix + ".part")
            temporary.write_bytes(content)
            temporary.replace(path)
        with Image.open(path) as image:
            width, height = image.size
        annotations = []
        for category, bbox in zip(row["objects"]["categories"], row["objects"]["bbox"], strict=True):
            x, y, w, h = bbox
            if not (0 <= category < 4 and w > 0 and h > 0 and x >= 0 and y >= 0 and x + w <= width and y + h <= height):
                raise ValueError(f"Invalid upstream annotation: {filename}")
            annotations.append(f"{category} {(x+w/2)/width:.8f} {(y+h/2)/height:.8f} {w/width:.8f} {h/height:.8f}")
        (output / "labels" / split / f"{path.stem}.txt").write_text("\n".join(annotations), encoding="utf-8")
        return {"split": split, "upstream_path": prefix + filename,
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "negative": not annotations}

    with ThreadPoolExecutor(max_workers=2) as pool:
        records = list(pool.map(download, selected))
    (output / "data.yaml").write_text(yaml.safe_dump({"path": str(output), "train": "images/train", "val": "images/val", "test": "images/test", "names": NAMES}), encoding="utf-8")
    manifest = {"source": f"https://huggingface.co/datasets/{REPO}", "revision": revision,
                "license": "CC BY-SA 4.0", "attribution": "Deeksha Arya, Hiroya Maeda, Sanjay Kumar Ghosh, Durga Toshniwal, Yoshihide Sekimoto; RDD2022, arXiv:2209.08538",
                "sampling": "Seed 17+shard; separate negatives, pothole scenes and other damage; upstream split membership retained; all boxes retained.",
                "limitations": "Small stratified public subset; no Philippine locality evidence; prior checkpoint may have trained on redistributed validation/test images.",
                "records": records}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print({s: sum(r["split"] == s for r in records) for s in ("train", "val", "test")})
    print(f"Prepared {output}")


if __name__ == "__main__":
    main()
