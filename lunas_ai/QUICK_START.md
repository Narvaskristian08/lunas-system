# LUNAS AI - Quick Start Guide 🚀

Get the AI service running in 5 minutes!

---

## 📋 Prerequisites

- Python 3.10+ installed
- 2GB free RAM minimum
- Internet connection (first run only)

---

## ⚡ Quick Setup

### Step 1: Navigate to Directory

```bash
cd /Users/deb/Desktop/lunas-system/lunas_ai
```

### Step 2: Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # Your terminal should now show (venv)
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

This will take 3-5 minutes on first install.

### Step 4: Configure Environment

```bash
cp .env.example .env
```

The defaults work fine for local development!

### Step 5: Run the Service

```bash
python app.py
```

You should see:
```
============================================================
LUNAS AI Service Starting...
============================================================
Environment: production
Device: mps
Host: 0.0.0.0:5001
============================================================
✅ Pre-loaded: road_damage model
 * Running on http://0.0.0.0:5001
```

**That's it!** The service is running. 🎉

---

## ✅ Test It Works

Open another terminal and run:

```bash
# Test health endpoint
curl http://localhost:5001/api/v1/health
```

You should see:
```json
{
  "status": "healthy",
  "service": "lunas-ai",
  "device": "mps",
  "models_loaded": 1
}
```

---

## 🧪 Test with an Image

### Download a test image:

```bash
curl -o test_pothole.jpg https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=640
```

### Send to API:

```bash
curl -X POST \
  -F "image=@test_pothole.jpg" \
  http://localhost:5001/api/v1/detect/road-damage
```

---

## 🔌 Connect to Node.js Backend

Update `lunas_backend/.env`:

```bash
# Add this line
AI_SERVICE_URL=http://localhost:5001
```

The backend can now call the AI service!

---

## 🛑 Stop the Service

Press `Ctrl+C` in the terminal where `python app.py` is running.

---

## 📝 What Gets Downloaded on First Run

On first inference, Ultralytics will auto-download:
- YOLOv8n base model (~6MB)
- Any pre-trained weights (~20MB)

This happens automatically, no manual download needed!

---

## 🐛 Troubleshooting

### "No module named 'ultralytics'"
```bash
pip install -r requirements.txt
```

### "Address already in use"
Another service is using port 5001. Change in `.env`:
```bash
FLASK_PORT=5002
```

### "Model file not found"
The model will auto-download on first use. Just wait a few seconds.

### Still not working?
Check logs:
```bash
cat logs/lunas_ai.log
```

---

## ✨ Next Steps

1. ✅ Service is running
2. 📚 Read `README.md` for full API documentation
3. 🎯 Fine-tune models (optional): see README "Fine-Tuning" section
4. 🐳 Deploy with Docker: see README "Docker Deployment" section

---

**Need help?** Check `README.md` or contact the team!
