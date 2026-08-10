#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║       Extracting RDD2022 Dataset by Country           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

cd datasets/rdd2022/RDD2022

echo "📦 Found country datasets:"
ls -lh *.zip
echo ""

# Extract each country
for country_zip in *.zip; do
    country=$(basename "$country_zip" .zip)
    echo "🌍 Extracting $country..."
    ditto -x -k "$country_zip" "$country/"
    echo "   ✅ $country extracted"
done

echo ""
echo "✅ All countries extracted!"
echo ""
echo "📂 Dataset structure:"
ls -la

echo ""
echo "🔍 Checking for train/val/test folders..."
cd Japan
ls -la

echo ""
echo "✅ Extraction complete!"
echo ""
echo "Next step: Run python verify_dataset.py"
