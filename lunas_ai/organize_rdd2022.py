#!/usr/bin/env python3
"""
Organize RDD2022 dataset into YOLO format
Converts XML annotations to YOLO format and organizes files
"""

import os
import shutil
from pathlib import Path
import xml.etree.ElementTree as ET
from tqdm import tqdm

# RDD2022 class mapping
CLASS_MAPPING = {
    'D00': 0,  # Longitudinal crack
    'D10': 1,  # Transverse crack
    'D20': 2,  # Alligator crack
    'D40': 3,  # Pothole
}

def convert_xml_to_yolo(xml_file, img_width, img_height):
    """Convert RDD2022 XML annotation to YOLO format"""
    try:
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        yolo_lines = []
        
        for obj in root.findall('object'):
            # Get class name
            class_name = obj.find('name').text
            if class_name not in CLASS_MAPPING:
                continue
            
            class_id = CLASS_MAPPING[class_name]
            
            # Get bounding box
            bbox = obj.find('bndbox')
            xmin = float(bbox.find('xmin').text)
            ymin = float(bbox.find('ymin').text)
            xmax = float(bbox.find('xmax').text)
            ymax = float(bbox.find('ymax').text)
            
            # Convert to YOLO format (center_x, center_y, width, height) - normalized
            x_center = (xmin + xmax) / 2.0 / img_width
            y_center = (ymin + ymax) / 2.0 / img_height
            width = (xmax - xmin) / img_width
            height = (ymax - ymin) / img_height
            
            yolo_lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")
        
        return yolo_lines
    except Exception as e:
        print(f"Error converting {xml_file}: {e}")
        return []

def get_image_size(img_path):
    """Get image dimensions"""
    from PIL import Image
    try:
        with Image.open(img_path) as img:
            return img.size  # Returns (width, height)
    except:
        return (1280, 720)  # Default size if can't read

def organize_dataset():
    """Organize RDD2022 into YOLO format"""
    
    print("╔════════════════════════════════════════════════════════╗")
    print("║      Organizing RDD2022 into YOLO Format              ║")
    print("╚════════════════════════════════════════════════════════╝")
    print()
    
    base_dir = Path("datasets/rdd2022")
    rdd_dir = base_dir / "RDD2022"
    
    # Create output directories
    output_dir = base_dir
    for split in ['train', 'val', 'test']:
        (output_dir / 'images' / split).mkdir(parents=True, exist_ok=True)
        (output_dir / 'labels' / split).mkdir(parents=True, exist_ok=True)
    
    # Countries to process
    countries = ['Japan', 'India', 'Czech', 'Norway', 'United_States', 
                 'China_Drone', 'China_MotorBike']
    
    stats = {'train': 0, 'val': 0, 'test': 0}
    
    for country in countries:
        country_path = rdd_dir / country / country
        
        if not country_path.exists():
            print(f"⚠️  Skipping {country} (not found)")
            continue
        
        print(f"\n🌍 Processing {country}...")
        
        for split in ['train', 'test']:
            split_path = country_path / split
            
            if not split_path.exists():
                continue
            
            # RDD2022 uses 'test' for validation
            output_split = 'val' if split == 'test' else 'train'
            
            images_path = split_path / 'images'
            annotations_path = split_path / 'annotations' / 'xmls'
            
            if not images_path.exists():
                continue
            
            image_files = list(images_path.glob('*.jpg'))
            
            print(f"   📸 Found {len(image_files)} images in {split}")
            
            for img_file in tqdm(image_files, desc=f"   Converting {country}/{split}"):
                # Copy image
                img_name = img_file.name
                shutil.copy(img_file, output_dir / 'images' / output_split / img_name)
                
                # Convert annotation
                xml_file = annotations_path / img_name.replace('.jpg', '.xml')
                
                if xml_file.exists():
                    # Get image size
                    width, height = get_image_size(img_file)
                    
                    # Convert to YOLO
                    yolo_lines = convert_xml_to_yolo(xml_file, width, height)
                    
                    # Save YOLO label
                    label_file = output_dir / 'labels' / output_split / img_name.replace('.jpg', '.txt')
                    with open(label_file, 'w') as f:
                        f.write('\n'.join(yolo_lines))
                    
                    stats[output_split] += 1
    
    print("\n╔════════════════════════════════════════════════════════╗")
    print("║              ✅ Dataset Organized!                      ║")
    print("╚════════════════════════════════════════════════════════╝")
    print()
    print("📊 Final Statistics:")
    print(f"   Training images:   {stats['train']:,}")
    print(f"   Validation images: {stats['val']:,}")
    print(f"   Test images:       {stats['test']:,}")
    print(f"   Total:             {sum(stats.values()):,}")
    print()
    
    # Create data.yaml
    data_yaml = base_dir / 'data.yaml'
    with open(data_yaml, 'w') as f:
        f.write(f"""# RDD2022 Dataset Configuration for LUNAS AI
# Road Damage Detection Dataset 2022

# Dataset paths (relative to this file)
path: {base_dir.absolute()}
train: images/train
val: images/val
test: images/test

# Number of classes
nc: 4

# Class names (RDD2022 standard)
names:
  0: longitudinal_crack  # D00 - Parallel to traffic
  1: transverse_crack    # D10 - Perpendicular to traffic
  2: alligator_crack     # D20 - Interconnected patterns
  3: pothole             # D40 - Bowl-shaped holes

# Dataset info
dataset: RDD2022
version: 2022
source: https://figshare.com/articles/dataset/RDD2022/21431547
description: Multi-national road damage dataset for infrastructure maintenance
countries: [{', '.join(countries)}]
""")
    
    print(f"✅ Created: {data_yaml}")
    print()
    print("╔════════════════════════════════════════════════════════╗")
    print("║                    Ready to Train!                     ║")
    print("╚════════════════════════════════════════════════════════╝")
    print()
    print("Next steps:")
    print("1️⃣  Verify dataset:")
    print("   python verify_dataset.py")
    print()
    print("2️⃣  Start training:")
    print("   python train.py --model yolov8s --dataset rdd2022 --epochs 100")
    print()

if __name__ == '__main__':
    try:
        from PIL import Image
    except ImportError:
        print("Installing Pillow...")
        os.system("pip install Pillow")
        from PIL import Image
    
    try:
        from tqdm import tqdm
    except ImportError:
        print("Installing tqdm...")
        os.system("pip install tqdm")
        from tqdm import tqdm
    
    organize_dataset()
