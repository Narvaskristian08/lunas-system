#!/usr/bin/env python3
"""
LUNAS AI - Simple Detection Test Script
Upload an image and get damage detection results
"""

import requests
import json
import sys
import os

# Configuration
API_URL = "http://localhost:5001/api/v1/detect/road-damage"
CONFIDENCE = 0.5

def print_banner():
    print("\n" + "="*60)
    print("🛣️  LUNAS AI - Road Damage Detection Test")
    print("="*60 + "\n")

def check_service():
    """Check if AI service is running"""
    try:
        response = requests.get("http://localhost:5001/api/v1/health", timeout=2)
        if response.status_code == 200:
            print("✅ AI Service is running\n")
            return True
        else:
            print("❌ AI Service returned error:", response.status_code)
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to AI service!")
        print("   Make sure the service is running:")
        print("   $ cd lunas_ai")
        print("   $ source venv/bin/activate")
        print("   $ python app.py\n")
        return False
    except Exception as e:
        print(f"❌ Error checking service: {e}\n")
        return False

def detect_damage(image_path, confidence=0.5):
    """Send image to API and get detection results"""
    
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return None
    
    print(f"📸 Analyzing image: {os.path.basename(image_path)}")
    print(f"📊 Confidence threshold: {confidence}")
    print(f"🔄 Processing...\n")
    
    try:
        with open(image_path, "rb") as image_file:
            files = {"image": image_file}
            data = {"confidence": confidence}
            
            response = requests.post(API_URL, files=files, data=data, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ API returned error: {response.status_code}")
                print(f"   Response: {response.text}")
                return None
                
    except requests.exceptions.Timeout:
        print("❌ Request timed out (>30s)")
        print("   The image might be too large or service is slow")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def display_results(result):
    """Display detection results in a nice format"""
    
    print("="*60)
    
    if not result.get("success"):
        print("❌ Detection failed")
        print(f"   Error: {result.get('error', 'Unknown error')}")
        print("="*60 + "\n")
        return
    
    total = result.get("total_damages", 0)
    inference_time = result.get("inference_time", "N/A")
    image_size = result.get("image_size", {})
    
    # Summary
    print(f"⏱️  Processing Time: {inference_time}")
    print(f"📐 Image Size: {image_size.get('width', '?')}x{image_size.get('height', '?')}")
    print(f"🔍 Damages Found: {total}")
    print("="*60)
    
    if total == 0:
        print("\n✅ NO DAMAGE DETECTED")
        print("   The road appears to be in good condition!\n")
    else:
        print(f"\n⚠️  FOUND {total} DAMAGE(S):\n")
        
        for i, detection in enumerate(result.get("detections", []), 1):
            damage_type = detection.get("class", "unknown")
            confidence = detection.get("confidence", 0) * 100
            severity = detection.get("severity", "unknown")
            bbox = detection.get("bbox", {})
            
            # Icon based on severity
            icon = "🔴" if severity == "high" else "🟡" if severity == "medium" else "🟢"
            
            print(f"{icon} {i}. {damage_type.upper().replace('_', ' ')}")
            print(f"   Confidence: {confidence:.1f}%")
            print(f"   Severity: {severity.upper()}")
            print(f"   Location: ({bbox.get('x', 0)}, {bbox.get('y', 0)})")
            print(f"   Size: {bbox.get('width', 0)}×{bbox.get('height', 0)} pixels")
            print()
    
    print("="*60 + "\n")

def main():
    """Main function"""
    print_banner()
    
    # Check if service is running
    if not check_service():
        sys.exit(1)
    
    # Get image path from command line or prompt
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        print("Usage:")
        print(f"  python test_detection.py <image_path> [confidence]\n")
        print("Example:")
        print(f"  python test_detection.py /Users/deb/Desktop/pothole.jpg 0.5\n")
        
        image_path = input("Enter path to image: ").strip()
        
        if not image_path:
            print("❌ No image path provided")
            sys.exit(1)
    
    # Get confidence from command line or use default
    if len(sys.argv) > 2:
        try:
            confidence = float(sys.argv[2])
            if not 0.1 <= confidence <= 0.9:
                print("⚠️  Confidence should be between 0.1 and 0.9, using 0.5")
                confidence = 0.5
        except ValueError:
            print("⚠️  Invalid confidence value, using 0.5")
            confidence = 0.5
    else:
        confidence = CONFIDENCE
    
    # Detect damage
    result = detect_damage(image_path, confidence)
    
    if result:
        display_results(result)
        
        # Save results to JSON file
        output_file = "detection_result.json"
        with open(output_file, "w") as f:
            json.dump(result, f, indent=2)
        print(f"💾 Full results saved to: {output_file}\n")
    else:
        print("\n❌ Detection failed\n")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}\n")
        sys.exit(1)
