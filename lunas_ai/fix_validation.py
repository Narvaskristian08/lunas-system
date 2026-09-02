#!/usr/bin/env python3
"""Fix validation set - split from training data"""

import shutil
from pathlib import Path
import random

# Set seed for reproducibility
random.seed(42)

base_dir = Path("datasets/rdd2022")
train_img = base_dir / "images/train"
train_lbl = base_dir / "labels/train"
val_img = base_dir / "images/val"
val_lbl = base_dir / "labels/val"

# Get all training images
train_images = list(train_img.glob("*.jpg"))
print(f"Total training images: {len(train_images)}")

# Take 10% for validation (about 3,800 images)
val_count = int(len(train_images) * 0.1)
val_images = random.sample(train_images, val_count)

print(f"Moving {val_count} images to validation...")

# Move images and labels
moved = 0
for img_path in val_images:
    # Move image
    new_img = val_img / img_path.name
    if new_img.exists():
        continue
    shutil.move(str(img_path), str(new_img))
    
    # Move label
    lbl_name = img_path.stem + ".txt"
    lbl_path = train_lbl / lbl_name
    new_lbl = val_lbl / lbl_name
    
    if lbl_path.exists():
        shutil.move(str(lbl_path), str(new_lbl))
    
    moved += 1
    if moved % 500 == 0:
        print(f"  Moved {moved}/{val_count}...")

print(f"\n✅ Done! Moved {moved} images and labels to validation set")
print(f"   Training: {len(list(train_img.glob('*.jpg')))} images")
print(f"   Validation: {len(list(val_img.glob('*.jpg')))} images")
