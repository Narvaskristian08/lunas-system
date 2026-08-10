#!/bin/bash

# RDD2022 Dataset Preparation Script
# Extracts and organizes RDD2022 from Figshare zip file

echo "╔════════════════════════════════════════════════════════╗"
echo "║       RDD2022 Dataset Preparation Script              ║"
echo "╔════════════════════════════════════════════════════════╗"
echo ""

# Check if zip file is provided
if [ -z "$1" ]; then
    echo "Usage: ./prepare_rdd2022.sh <path-to-rdd2022.zip>"
    echo ""
    echo "Example:"
    echo "  ./prepare_rdd2022.sh ~/Downloads/rdd2022.zip"
    echo ""
    echo "📥 Download RDD2022 from:"
    echo "   https://figshare.com/articles/dataset/RDD2022/21431547"
    echo ""
    exit 1
fi

ZIP_FILE="$1"

# Check if zip file exists
if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ Error: File not found: $ZIP_FILE"
    exit 1
fi

echo "📦 Found zip file: $ZIP_FILE"
echo "📊 File size: $(du -h "$ZIP_FILE" | cut -f1)"
echo ""

# Set target directory
TARGET_DIR="datasets/rdd2022"
TEMP_DIR="datasets/rdd2022_temp"

echo "🎯 Target directory: $TARGET_DIR"
echo ""

# Create backup if directory exists
if [ -d "$TARGET_DIR" ]; then
    echo "⚠️  Warning: $TARGET_DIR already exists"
    read -p "Do you want to overwrite? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled"
        exit 1
    fi
    echo "🗑️  Removing old directory..."
    rm -rf "$TARGET_DIR"
fi

# Create directories
echo "📁 Creating directory structure..."
mkdir -p "$TARGET_DIR"
mkdir -p "$TEMP_DIR"

# Extract zip file
echo ""
echo "📦 Extracting zip file (this may take 2-5 minutes)..."
unzip -q "$ZIP_FILE" -d "$TEMP_DIR"

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to extract zip file"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "✅ Extraction complete"
echo ""

# Find the actual data directory (RDD2022 structure varies)
echo "🔍 Analyzing directory structure..."

# Common RDD2022 structures:
# Option 1: Direct structure (images/, labels/)
# Option 2: RDD2022/train/, RDD2022/val/, etc.
# Option 3: Country folders (Japan/, India/, etc.)

# Look for images and labels directories
IMAGES_DIR=$(find "$TEMP_DIR" -type d -name "images" | head -1)
LABELS_DIR=$(find "$TEMP_DIR" -type d -name "labels" | head -1)

if [ -z "$IMAGES_DIR" ] || [ -z "$LABELS_DIR" ]; then
    echo "⚠️  Standard structure not found. Looking for alternative structure..."
    
    # Look for train/val directories
    TRAIN_DIR=$(find "$TEMP_DIR" -type d -name "train" | head -1)
    VAL_DIR=$(find "$TEMP_DIR" -type d -name "val" | head -1)
    
    if [ ! -z "$TRAIN_DIR" ] && [ ! -z "$VAL_DIR" ]; then
        echo "✅ Found train/val structure"
        
        # Create target structure
        mkdir -p "$TARGET_DIR/images/train"
        mkdir -p "$TARGET_DIR/images/val"
        mkdir -p "$TARGET_DIR/labels/train"
        mkdir -p "$TARGET_DIR/labels/val"
        
        # Copy images
        echo "📋 Copying training images..."
        find "$TRAIN_DIR" -name "*.jpg" -exec cp {} "$TARGET_DIR/images/train/" \;
        
        echo "📋 Copying validation images..."
        find "$VAL_DIR" -name "*.jpg" -exec cp {} "$TARGET_DIR/images/val/" \;
        
        # Copy labels
        echo "📋 Copying training labels..."
        find "$TRAIN_DIR" -name "*.txt" -exec cp {} "$TARGET_DIR/labels/train/" \;
        
        echo "📋 Copying validation labels..."
        find "$VAL_DIR" -name "*.txt" -exec cp {} "$TARGET_DIR/labels/val/" \;
    else
        echo "❌ Error: Could not find standard RDD2022 structure"
        echo ""
        echo "Manual extraction needed. Extracted to: $TEMP_DIR"
        echo "Please organize files according to RDD2022_SETUP.md"
        exit 1
    fi
else
    echo "✅ Found standard images/labels structure"
    
    # Copy everything
    echo "📋 Copying files..."
    cp -r "$IMAGES_DIR"/* "$TARGET_DIR/images/" 2>/dev/null || true
    cp -r "$LABELS_DIR"/* "$TARGET_DIR/labels/" 2>/dev/null || true
fi

# Clean up temp directory
echo ""
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

# Count files
echo ""
echo "📊 Counting files..."
TRAIN_IMAGES=$(find "$TARGET_DIR/images/train" -name "*.jpg" 2>/dev/null | wc -l | tr -d ' ')
VAL_IMAGES=$(find "$TARGET_DIR/images/val" -name "*.jpg" 2>/dev/null | wc -l | tr -d ' ')
TRAIN_LABELS=$(find "$TARGET_DIR/labels/train" -name "*.txt" 2>/dev/null | wc -l | tr -d ' ')
VAL_LABELS=$(find "$TARGET_DIR/labels/val" -name "*.txt" 2>/dev/null | wc -l | tr -d ' ')

echo "  Training images:   $TRAIN_IMAGES"
echo "  Training labels:   $TRAIN_LABELS"
echo "  Validation images: $VAL_IMAGES"
echo "  Validation labels: $VAL_LABELS"
echo ""

# Create data.yaml if it doesn't exist
DATA_YAML="$TARGET_DIR/data.yaml"

if [ ! -f "$DATA_YAML" ]; then
    echo "📝 Creating data.yaml..."
    
    cat > "$DATA_YAML" << 'EOF'
# RDD2022 Dataset Configuration for LUNAS AI
# Road Damage Detection Dataset 2022

# Dataset paths (relative to this file)
path: ../datasets/rdd2022  # Root directory
train: images/train        # Training images
val: images/val           # Validation images
test: images/test         # Test images (optional)

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
EOF

    echo "✅ data.yaml created"
else
    echo "✅ data.yaml already exists"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              ✅ Dataset Preparation Complete            ║"
echo "╔════════════════════════════════════════════════════════╗"
echo ""

# Verify setup
echo "🔍 Verifying dataset..."
echo ""

if [ $TRAIN_IMAGES -gt 0 ] && [ $TRAIN_LABELS -gt 0 ]; then
    echo "✅ Training set: OK ($TRAIN_IMAGES images, $TRAIN_LABELS labels)"
else
    echo "⚠️  Warning: Training set might be incomplete"
fi

if [ $VAL_IMAGES -gt 0 ] && [ $VAL_LABELS -gt 0 ]; then
    echo "✅ Validation set: OK ($VAL_IMAGES images, $VAL_LABELS labels)"
else
    echo "⚠️  Warning: Validation set might be incomplete"
fi

echo ""
echo "📂 Dataset location:"
echo "   $(pwd)/$TARGET_DIR"
echo ""
echo "📊 Dataset structure:"
echo "   $TARGET_DIR/"
echo "   ├── data.yaml"
echo "   ├── images/"
echo "   │   ├── train/ ($TRAIN_IMAGES images)"
echo "   │   └── val/ ($VAL_IMAGES images)"
echo "   └── labels/"
echo "       ├── train/ ($TRAIN_LABELS labels)"
echo "       └── val/ ($VAL_LABELS labels)"
echo ""

# Next steps
echo "╔════════════════════════════════════════════════════════╗"
echo "║                    Next Steps                          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "1️⃣  Verify dataset:"
echo "   python verify_dataset.py"
echo ""
echo "2️⃣  Start training:"
echo "   python train.py --model yolov8s --dataset rdd2022 --epochs 100"
echo ""
echo "   Training will take approximately 6-8 hours on your M1 Mac"
echo ""
echo "3️⃣  Monitor progress:"
echo "   tail -f logs/lunas_ai.log"
echo ""
echo "📚 For detailed instructions, see: RDD2022_SETUP.md"
echo ""
echo "🎉 Ready to train!"
echo ""
