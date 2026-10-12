# LUNAS AI Service - Dockerfile
# Production-ready Python ML service

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install only the runtime libraries needed by headless OpenCV and CPU PyTorch.
# Keeping GUI/OpenGL packages out of the image is important on the 2 GiB t3.small.
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy runtime-only requirements. Training, FiftyOne, test, and lint packages
# are intentionally not installed in the inference image.
COPY requirements.runtime.txt ./requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# Ultralytics also installs GUI OpenCV, which overwrites the shared cv2 module.
# Restore only the headless implementation for this server image.
RUN pip uninstall -y opencv-python opencv-python-headless \
    && pip install --no-cache-dir --no-deps 'opencv-python-headless>=4.8,<5' \
    && python -c "import cv2; from ultralytics import YOLO; assert hasattr(cv2, 'CascadeClassifier'); assert hasattr(cv2, 'FaceDetectorYN_create'); assert hasattr(cv2.data, 'haarcascades')"

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs models/cache cache/inference datasets

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5001/api/v1/health', timeout=5).raise_for_status()"

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# Run with gunicorn for production
# The t3.small has 2 GiB RAM; two workers duplicate the PyTorch model and can
# be OOM-killed during privacy processing. Keep one worker for the bounded AI host.
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "1", "--threads", "2", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "app:create_app()"]
