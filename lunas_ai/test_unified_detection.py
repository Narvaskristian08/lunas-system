#!/usr/bin/env python3
"""Test the canonical road category using the RDD2022 model."""

import requests
import sys
from pathlib import Path

API_URL = "http://localhost:5001/api/v1"

def run_road_detection(image_path: str):
    """Verify that the road category uses RDD2022 only."""
    
    print("=" * 70)
    print("🌙 LUNAS AI - RDD2022 Road Detection Test")
    print("=" * 70)
    print(f"Testing with image: {image_path}")
    print()
    
    # Check if file exists
    if not Path(image_path).exists():
        print(f"❌ Error: File not found: {image_path}")
        return
    
    # Open image
    with open(image_path, 'rb') as f:
        files = {'image': f}
        
        print("📤 Sending image to API...")
        try:
            response = requests.post(
                f"{API_URL}/detect/comprehensive",
                data={'category': 'road'},
                files=files,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                print("✅ Detection completed!")
                print()
                print("=" * 70)
                print("📊 RESULTS")
                print("=" * 70)
                
                print(f"Category: {data.get('category', 'unknown')}")
                print(f"Model: {data.get('model', 'unknown')}")
                print(f"Analysis status: {data.get('analysis_status', 'unknown')}")
                print(f"Total detections: {len(data.get('detections', []))}")
                print()
                
                # Individual Detections
                if data['detections']:
                    print("=" * 70)
                    print("🔍 INDIVIDUAL DETECTIONS")
                    print("=" * 70)
                    
                    for i, det in enumerate(data['detections'], 1):
                        print(f"\n{i}. {det['class'].upper()}")
                        print(f"   Model: {det['model']}")
                        print(f"   Category: {det['category']}")
                        print(f"   Confidence: {det['confidence']*100:.1f}%")
                        print(f"   Severity: {det.get('severity', 'advisory')}")
                        print(f"   Bbox: ({det['bbox']['x1']:.0f}, {det['bbox']['y1']:.0f}) - ({det['bbox']['x2']:.0f}, {det['bbox']['y2']:.0f})")
                else:
                    print("✅ No hazards detected - Image is clear!")
                
                print()
                print("=" * 70)
                
            else:
                print(f"❌ Error: HTTP {response.status_code}")
                print(response.json())
                
        except requests.exceptions.ConnectionError:
            print("❌ Error: Cannot connect to API server")
            print("Make sure the server is running: ./start_qa_testing.sh")
        except Exception as e:
            print(f"❌ Error: {e}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_unified_detection.py <image_path>")
        print()
        print("Example:")
        print("  python test_unified_detection.py test_images/sample.jpg")
        sys.exit(1)
    
    image_path = sys.argv[1]
    run_road_detection(image_path)


if __name__ == '__main__':
    main()
