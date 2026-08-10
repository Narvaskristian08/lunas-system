# 🚀 How to Send an Image and Check for Road Damage

**Super simple guide for testing the AI service**

---

## 📱 Method 1: Using Terminal (Easiest)

### Step 1: Start the AI Service

```bash
cd lunas_ai
source venv/bin/activate
python app.py
```

**Wait for this message:**
```
🚀 Starting server on http://0.0.0.0:5001
```

### Step 2: Open a NEW Terminal

Keep the service running, open a new terminal window

### Step 3: Send an Image

```bash
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@/path/to/your/image.jpg" \
  -F "confidence=0.5"
```

**Replace `/path/to/your/image.jpg` with your actual image path!**

### Example:
```bash
# If your image is on Desktop
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@/Users/deb/Desktop/pothole.jpg" \
  -F "confidence=0.5"

# Or if it's in Downloads
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@/Users/deb/Downloads/road_damage.jpg" \
  -F "confidence=0.5"
```

### Step 4: Read the Result

You'll get a response like this:

**✅ If damage is found:**
```json
{
  "success": true,
  "detections": [
    {
      "class": "pothole",
      "confidence": 0.89,
      "bbox": {
        "x": 320,
        "y": 240,
        "width": 150,
        "height": 120
      },
      "severity": "high"
    }
  ],
  "total_damages": 1,
  "inference_time": "0.82s"
}
```

**This means:** Found 1 pothole with 89% confidence!

---

**❌ If no damage found:**
```json
{
  "success": true,
  "detections": [],
  "total_damages": 0,
  "inference_time": "0.75s",
  "message": "No road damage detected"
}
```

**This means:** The road looks fine!

---

## 🌐 Method 2: Using Postman (Visual)

### Step 1: Download Postman
https://www.postman.com/downloads/

### Step 2: Create New Request

1. Click **"New"** → **"HTTP Request"**
2. Change **GET** to **POST**
3. Enter URL: `http://localhost:5001/api/v1/detect/road-damage`

### Step 3: Set Up the Body

1. Click **"Body"** tab
2. Select **"form-data"**
3. Add two rows:

| Key | Type | Value |
|-----|------|-------|
| `image` | **File** | (Click "Select Files" and choose your image) |
| `confidence` | **Text** | `0.5` |

### Step 4: Send Request

Click the big blue **"Send"** button

### Step 5: See Results

Look at the bottom panel - you'll see the JSON response showing any detected damage!

---

## 🐍 Method 3: Using Python Script

### Create a test file: `test_detection.py`

```python
import requests
import json

# Configuration
API_URL = "http://localhost:5001/api/v1/detect/road-damage"
IMAGE_PATH = "/Users/deb/Desktop/pothole.jpg"  # CHANGE THIS!

# Send image
print("🔍 Analyzing image...")
with open(IMAGE_PATH, "rb") as image_file:
    files = {"image": image_file}
    data = {"confidence": 0.5}
    
    response = requests.post(API_URL, files=files, data=data)
    result = response.json()

# Display results
print("\n" + "="*50)
if result["success"]:
    total = result["total_damages"]
    
    if total == 0:
        print("✅ No damage detected - Road looks good!")
    else:
        print(f"⚠️  Found {total} damage(s):\n")
        
        for i, detection in enumerate(result["detections"], 1):
            damage_type = detection["class"]
            confidence = detection["confidence"] * 100
            severity = detection["severity"]
            
            print(f"{i}. {damage_type.upper()}")
            print(f"   Confidence: {confidence:.1f}%")
            print(f"   Severity: {severity}")
            print(f"   Location: x={detection['bbox']['x']}, y={detection['bbox']['y']}")
            print()
    
    print(f"⏱️  Processing time: {result['inference_time']}")
else:
    print(f"❌ Error: {result.get('error', 'Unknown error')}")
print("="*50)
```

### Run it:

```bash
# Install requests if needed
pip install requests

# Run the script
python test_detection.py
```

**Output example:**
```
🔍 Analyzing image...

==================================================
⚠️  Found 2 damage(s):

1. POTHOLE
   Confidence: 89.3%
   Severity: high
   Location: x=320, y=240

2. LONGITUDINAL_CRACK
   Confidence: 76.5%
   Severity: medium
   Location: x=120, y=180

⏱️  Processing time: 0.84s
==================================================
```

---

## 📱 Method 4: Using Web Browser (Simple HTML)

### Create a test file: `test_page.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>LUNAS AI - Test Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .container {
            border: 2px solid #ddd;
            padding: 30px;
            border-radius: 10px;
        }
        h1 { color: #333; }
        input[type="file"] {
            margin: 20px 0;
            padding: 10px;
        }
        button {
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover { background: #45a049; }
        #result {
            margin-top: 30px;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 5px;
            display: none;
        }
        .damage { 
            background: #fff3cd;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #ffc107;
        }
        .no-damage {
            background: #d4edda;
            padding: 15px;
            border-left: 4px solid #28a745;
        }
        .error {
            background: #f8d7da;
            padding: 15px;
            border-left: 4px solid #dc3545;
        }
        img { max-width: 100%; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛣️ LUNAS AI - Road Damage Detection</h1>
        <p>Upload an image to detect potholes and cracks</p>
        
        <input type="file" id="imageInput" accept="image/*">
        <br>
        <button onclick="detectDamage()">🔍 Analyze Image</button>
        
        <div id="result"></div>
    </div>

    <script>
        async function detectDamage() {
            const input = document.getElementById('imageInput');
            const resultDiv = document.getElementById('result');
            
            if (!input.files || !input.files[0]) {
                alert('Please select an image first!');
                return;
            }
            
            resultDiv.innerHTML = '<p>🔄 Analyzing image...</p>';
            resultDiv.style.display = 'block';
            
            // Prepare form data
            const formData = new FormData();
            formData.append('image', input.files[0]);
            formData.append('confidence', '0.5');
            
            try {
                // Send to API
                const response = await fetch('http://localhost:5001/api/v1/detect/road-damage', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                // Display results
                if (result.success) {
                    let html = '';
                    
                    if (result.total_damages === 0) {
                        html = '<div class="no-damage">✅ No damage detected - Road looks good!</div>';
                    } else {
                        html = `<h3>⚠️ Found ${result.total_damages} damage(s):</h3>`;
                        
                        result.detections.forEach((det, i) => {
                            html += `
                                <div class="damage">
                                    <strong>${i+1}. ${det.class.toUpperCase()}</strong><br>
                                    Confidence: ${(det.confidence * 100).toFixed(1)}%<br>
                                    Severity: ${det.severity}<br>
                                    Location: (${det.bbox.x}, ${det.bbox.y})
                                </div>
                            `;
                        });
                    }
                    
                    html += `<p>⏱️ Processing time: ${result.inference_time}</p>`;
                    
                    // Show image preview
                    const imageUrl = URL.createObjectURL(input.files[0]);
                    html += `<img src="${imageUrl}" alt="Uploaded image">`;
                    
                    resultDiv.innerHTML = html;
                } else {
                    resultDiv.innerHTML = `<div class="error">❌ Error: ${result.error}</div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="error">❌ Error: ${error.message}<br><br>Make sure the AI service is running!</div>`;
            }
        }
    </script>
</body>
</html>
```

### How to use:

1. **Save the code above** as `test_page.html` in `lunas_ai` folder
2. **Open it** in your browser (Chrome, Safari, etc.)
3. **Click "Choose File"** and select a road image
4. **Click "Analyze Image"** button
5. **See the results** displayed on the page!

---

## 🎨 Getting Test Images

### Option 1: Download Sample Images

```bash
# Create test folder
mkdir -p test_images
cd test_images

# Download pothole samples
curl -o pothole1.jpg "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=640"
curl -o pothole2.jpg "https://images.unsplash.com/photo-1617369516169-e1e7f3d1c29f?w=640"

# Download crack samples
curl -o crack1.jpg "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=640"

# Download clean road (should return 0 detections)
curl -o clean_road.jpg "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=640"

cd ..
```

### Option 2: Use Your Phone

1. Take a photo of a road with your phone
2. AirDrop it to your Mac (or email it)
3. Use that image path in the curl command

---

## 🔍 Understanding the Response

### The API returns:

```json
{
  "success": true,              // ✅ Request worked
  "detections": [...],          // 📍 List of damages found
  "total_damages": 2,           // 🔢 How many damages
  "inference_time": "0.84s",    // ⏱️ How long it took
  "image_size": {               // 📐 Image dimensions
    "width": 1280,
    "height": 720
  }
}
```

### Each detection includes:

```json
{
  "class": "pothole",           // 🕳️ Type: pothole, crack, etc.
  "confidence": 0.89,           // 📊 How sure (0.0 to 1.0)
  "severity": "high",           // ⚠️ low, medium, high
  "bbox": {                     // 📦 Where in the image
    "x": 320,                   //    Top-left x
    "y": 240,                   //    Top-left y  
    "width": 150,               //    Box width
    "height": 120               //    Box height
  }
}
```

### Confidence Levels:

- **0.9 - 1.0** (90-100%) = Very confident 🟢
- **0.7 - 0.9** (70-90%) = Confident 🟡
- **0.5 - 0.7** (50-70%) = Maybe ⚠️
- **Below 0.5** = Not detected ❌

---

## 🛠️ Troubleshooting

### Problem: "Connection refused"

**Solution:**
```bash
# Make sure AI service is running
cd lunas_ai
source venv/bin/activate
python app.py
```

---

### Problem: "File not found"

**Solution:** Check your image path
```bash
# Find your image path
# On Mac: Right-click image → Get Info → Copy full path
# Or drag file to terminal to see path

# Test if file exists
ls -la /path/to/your/image.jpg
```

---

### Problem: "No damage detected" but there IS damage

**Solution:** Lower the confidence threshold
```bash
curl -X POST http://localhost:5001/api/v1/detect/road-damage \
  -F "image=@your-image.jpg" \
  -F "confidence=0.3"  # Lower = more sensitive
```

---

### Problem: Python script error "Module not found"

**Solution:**
```bash
source venv/bin/activate
pip install requests
```

---

## ✅ Quick Test Checklist

**Before your team tests:**

1. [ ] AI service is running (`python app.py`)
2. [ ] Service shows: `Starting server on http://0.0.0.0:5001`
3. [ ] Have a test image ready
4. [ ] Know the full path to your image
5. [ ] Tried the curl command

**Test with this one-liner:**
```bash
# Replace with your actual image path!
curl -X POST http://localhost:5001/api/v1/detect/road-damage -F "image=@/Users/deb/Desktop/test.jpg" -F "confidence=0.5"
```

---

## 📞 Need Help?

**If it's not working:**

1. Check service is running: `ps aux | grep "python app.py"`
2. Check logs: `tail -50 lunas_ai/logs/lunas_ai.log`
3. Try health check: `curl http://localhost:5001/api/v1/health`
4. Ask team with screenshot of error

---

## 🎯 Expected Results

### Test Image Types:

| Image Type | Expected Result |
|------------|----------------|
| **Pothole photo** | `"class": "pothole"`, confidence >0.8 |
| **Cracked road** | `"class": "longitudinal_crack"` or similar |
| **Clean highway** | `"total_damages": 0` |
| **Random photo** | `"total_damages": 0` (or unexpected results) |

---

## 🚀 Ready to Test!

**Choose your method:**
- **Fastest:** Method 1 (Terminal curl)
- **Easiest:** Method 4 (HTML page)
- **Best for demos:** Method 2 (Postman)
- **For automation:** Method 3 (Python script)

**Good luck testing! 🎉**
