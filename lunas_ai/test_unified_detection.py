#!/usr/bin/env python3
"""
Test script for unified detection across all 3 models
"""

import requests
import sys
from pathlib import Path

API_URL = "http://localhost:5001/api/v1"

def test_unified_detection(image_path: str):
    """Test the unified detection endpoint"""
    
    print("=" * 70)
    print("🌙 LUNAS AI - Unified Detection Test")
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
                f"{API_URL}/detect/all-hazards",
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
                
                # Summary
                print(f"Total Detections: {data['total_detections']}")
                print(f"Processing Time: {data['processing_time']}s")
                print(f"Severity Level: {data['severity_level'].upper()}")
                print(f"Requires Urgent Action: {'YES' if data['requires_urgent_action'] else 'NO'}")
                print()
                
                # By Model
                print("By Model:")
                print(f"  🔧 RDD2022 (Road Damage): {data['by_model']['rdd2022']} detections")
                print(f"  🏗️  Road Collapse: {data['by_model']['road_collapse']} detections")
                print(f"  🌿 Environmental Hazards: {data['by_model']['environmental_hazards']} detections")
                print()
                
                # By Category
                print("By Category:")
                print(f"  Road Damage: {data['by_category']['road_damage']}")
                print(f"  Critical Infrastructure: {data['by_category']['critical_infrastructure']}")
                print(f"  Environmental/Urban: {data['by_category']['environmental_urban']}")
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
                        print(f"   Severity: {det.get('severity', 'N/A')}")
                        if 'priority' in det:
                            print(f"   Priority: {det['priority']}")
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
    test_unified_detection(image_path)


if __name__ == '__main__':
    main()
