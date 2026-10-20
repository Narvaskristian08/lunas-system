"""Owned loopback HTTP smoke checks using existing local weights; no accuracy claim."""
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time

ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = ROOT / ".local-backups" / "step13-ai"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
os.environ.update(PYTHON_DOTENV_DISABLED="1", YOLO_OFFLINE="true", YOLO_AUTOINSTALL="false", YOLO_CONFIG_DIR=str(ARTIFACTS))
sys.path.insert(0, str(ROOT / "lunas_ai"))

from PIL import Image  # noqa: E402
from werkzeug.serving import make_server  # noqa: E402
import requests  # noqa: E402
from app import create_app  # noqa: E402


def main():
    server = make_server("127.0.0.1", 0, create_app())
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"
    sample = ARTIFACTS / "synthetic.png"
    Image.new("RGB", (320, 320), "gray").save(sample)
    environment = {key: value for key, value in os.environ.items() if key.upper() in {"PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "USERPROFILE"}}
    environment.update(AI_SERVICE_URL=base, AI_SERVICE_ENABLED="true", AI_SERVICE_TIMEOUT="15000", NO_PROXY="127.0.0.1,localhost")
    node = """
const assert = require('assert/strict');
const ai = require('./src/services/aiService');
(async () => {
  const result = await ai.analyzeIncidentImage(require('fs').readFileSync(process.argv[1]), 'road');
  assert.equal(result.analysisStatus, process.argv[2]);
  assert.equal(result.requiresManualReview, true);
  if (process.argv[2] === 'completed') assert.equal(result.advisoryOnly, true);
  else { assert.equal(result.success, false); assert.equal(result.detected, false); assert.equal(result.confidence, 0); }
  console.log(JSON.stringify({analysisStatus:result.analysisStatus,requiresManualReview:result.requiresManualReview,advisoryOnly:result.advisoryOnly}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
"""
    started = time.perf_counter()
    try:
        assert requests.get(base + "/api/v1/health", timeout=10).status_code == 200
        assert requests.post(base + "/api/v1/detect/road", files={"image": ("invalid.jpg", io.BytesIO(b"invalid"), "image/jpeg")}, timeout=10).status_code == 400
        subprocess.run(["node", "-e", node, str(sample), "completed"], cwd=ROOT / "lunas_backend", env=environment, check=True, timeout=30)
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
    subprocess.run(["node", "-e", node, str(sample), "failed"], cwd=ROOT / "lunas_backend", env=environment, check=True, timeout=20)
    print(json.dumps({"health": "passed", "invalid_image": "passed", "backend_http_inference": "passed", "unavailable_fallback": "passed", "image": "synthetic 320x320 gray", "elapsed_seconds": round(time.perf_counter() - started, 3), "accuracy": "not evaluated"}))


if __name__ == "__main__":
    main()
