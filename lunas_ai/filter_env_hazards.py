#!/usr/bin/env python3
"""
Filter environmental hazards dataset to only 4 classes:
- fallen_tree (original class 1)
- fire_source (original class 2)  
- garbage_pileup (original class 3)
- open_manhole (original class 4)
"""

import os
import shutil
from pathlib import Path
from tqdm import tqdm

# Mapping: original_class_id -> new_class_id
CLASS_MAPPING = {
    1: 0,  # Fallen Tree -> fallen_tree
    2: 1,  # Fire Source -> fire_source
    3: 2,  # Garbage Pillups -> garbage_pileup
    4: 3,  # Open-Manhole -> open_manhole
}

KEEP_CLASSES = set(CLASS_MAPPING.keys())

def filter_label_file(src_label_path: Path, dst_label_path: Path) -> bool:
    """
    Filter and remap classes in a single label file.
    Returns True if file has any of the target classes, False otherwise.
    """
    filtered_lines = []
    
    with open(src_label_path, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if not parts:
                continue
            
            class_id = int(parts[0])
            
            # Keep only if class is in our target set
            if class_id in KEEP_CLASSES:
                # Remap class ID
                new_class_id = CLASS_MAPPING[class_id]
                parts[0] = str(new_class_id)
                filtered_lines.append(' '.join(parts))
    
    # Only write if we have any annotations
    if filtered_lines:
        dst_label_path.parent.mkdir(parents=True, exist_ok=True)
        with open(dst_label_path, 'w') as f:
            f.write('\n'.join(filtered_lines) + '\n')
        return True
    
    return False


def filter_dataset(src_dir: Path, dst_dir: Path, split: str):
    """Filter one split (train/valid/test) of the dataset."""
    
    src_labels_dir = src_dir / split / 'labels'
    src_images_dir = src_dir / split / 'images'
    dst_labels_dir = dst_dir / split / 'labels'
    dst_images_dir = dst_dir / split / 'images'
    
    dst_labels_dir.mkdir(parents=True, exist_ok=True)
    dst_images_dir.mkdir(parents=True, exist_ok=True)
    
    label_files = list(src_labels_dir.glob('*.txt'))
    
    kept_count = 0
    skipped_count = 0
    
    print(f"  Processing {split} set: {len(label_files)} files...")
    
    for label_path in tqdm(label_files, desc=f"  {split}"):
        dst_label_path = dst_labels_dir / label_path.name
        
        # Filter and remap the label file
        has_target_classes = filter_label_file(label_path, dst_label_path)
        
        if has_target_classes:
            # Copy corresponding image
            image_name = label_path.stem + '.jpg'  # Assuming .jpg
            src_image = src_images_dir / image_name
            
            # Try .png if .jpg doesn't exist
            if not src_image.exists():
                image_name = label_path.stem + '.png'
                src_image = src_images_dir / image_name
            
            if src_image.exists():
                dst_image = dst_images_dir / image_name
                shutil.copy2(src_image, dst_image)
                kept_count += 1
            else:
                print(f"    Warning: Image not found for {label_path.name}")
                os.remove(dst_label_path)
        else:
            skipped_count += 1
    
    print(f"    ✅ Kept: {kept_count} | Skipped: {skipped_count}\n")
    return kept_count, skipped_count


def main():
    print("=" * 70)
    print("🌿 FILTERING ENVIRONMENTAL HAZARDS DATASET")
    print("=" * 70)
    print("\nKeeping only 4 classes:")
    print("  0: fallen_tree    (original class 1)")
    print("  1: fire_source    (original class 2)")
    print("  2: garbage_pileup (original class 3)")
    print("  3: open_manhole   (original class 4)")
    print()
    
    src_dir = Path('datasets/environmental_hazards')
    dst_dir = Path('datasets/env_hazards_4class')
    
    # Remove destination if it exists
    if dst_dir.exists():
        print(f"⚠️  Removing existing filtered dataset: {dst_dir}")
        shutil.rmtree(dst_dir)
    
    dst_dir.mkdir(parents=True, exist_ok=True)
    
    # Filter each split
    total_kept = 0
    total_skipped = 0
    
    for split in ['train', 'valid', 'test']:
        kept, skipped = filter_dataset(src_dir, dst_dir, split)
        total_kept += kept
        total_skipped += skipped
    
    # Create new data.yaml
    yaml_content = f"""# Filtered Environmental Hazards Dataset (4 classes)
# Original dataset: Environmental_Hazards.v2i.yolov8 (9 classes)
# Filtered to keep only critical urban hazards

path: {dst_dir.absolute()}
train: train/images
val: valid/images
test: test/images

nc: 4
names: ['fallen_tree', 'fire_source', 'garbage_pileup', 'open_manhole']

# Class mapping from original dataset:
# fallen_tree    <- Fallen Tree (class 1)
# fire_source    <- Fire Source (class 2)
# garbage_pileup <- Garbage Pillups (class 3)
# open_manhole   <- Open-Manhole (class 4)
"""
    
    yaml_path = dst_dir / 'data.yaml'
    with open(yaml_path, 'w') as f:
        f.write(yaml_content)
    
    print("=" * 70)
    print("✅ FILTERING COMPLETE")
    print("=" * 70)
    print(f"Total images kept:    {total_kept}")
    print(f"Total images skipped: {total_skipped}")
    print(f"Output directory:     {dst_dir}")
    print(f"Config file:          {yaml_path}")
    print("=" * 70)


if __name__ == '__main__':
    main()
