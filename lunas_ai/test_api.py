"""
Simple API Test Script
Test LUNAS AI Service endpoints
"""

import requests
import sys
from PIL import Image
import io

BASE_URL = "http://localhost:5001/api/v1"


def test_health():
    """Test health endpoint"""
    print("Testing /health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        result = response.json()
        
        if result.get('status') == 'healthy':
            print("✅ Health check passed")
            print(f"   Device: {result.get('device')}")
            print(f"   Models loaded: {result.get('models_loaded')}")
            return True
        else:
            print("❌ Health check failed")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_models():
    """Test models endpoint"""
    print("\nTesting /models endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/models")
        result = response.json()
        
        if result.get('success'):
            print(f"✅ Found {result.get('total')} configured model(s)")
            for name, info in result.get('models', {}).items():
                loaded = "✓" if info.get('loaded') else "✗"
                print(f"   [{loaded}] {info.get('display_name')}")
            return True
        else:
            print("❌ Models endpoint failed")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_detection_with_dummy_image():
    """Test detection with a dummy image"""
    print("\nTesting /detect/road-damage with dummy image...")
    try:
        # Create a dummy image
        img = Image.new('RGB', (640, 480), color='gray')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Send request
        files = {'image': ('test.jpg', img_bytes, 'image/jpeg')}
        response = requests.post(
            f"{BASE_URL}/detect/road-damage",
            files=files
        )
        result = response.json()
        
        if result.get('success'):
            print("✅ Detection endpoint working")
            print(f"   Detections: {result.get('total_detections')}")
            print(f"   Processing time: {result.get('processing_time')}s")
            print(f"   Summary: {result.get('summary')}")
            return True
        else:
            print("❌ Detection failed")
            print(f"   Error: {result.get('error')}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests"""
    print("="*60)
    print("LUNAS AI Service - API Tests")
    print("="*60)
    
    tests = [
        test_health,
        test_models,
        test_detection_with_dummy_image
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print("\n" + "="*60)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    print("="*60)
    
    if all(results):
        print("✅ All tests passed! Service is working correctly.")
        return 0
    else:
        print("❌ Some tests failed. Check logs for details.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
