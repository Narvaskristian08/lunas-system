# LUNAS AI Service on Windows

The service's dependencies, API, model availability caveats, and decision
boundary are documented in the [AI service README](./README.md). This file
contains Windows-specific shell commands only.

## Install and run

From PowerShell in the `lunas_ai` directory:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```

If script activation is restricted, follow your organization's PowerShell
policy; do not weaken system-wide execution policy for this project. Verify
`http://localhost:5001/api/v1/health` and confirm the required configured
model weights are available before sending a detection request.

## Install troubleshooting

PyTorch and GPU/CUDA wheels depend on the installed Python version, hardware,
and driver. Use the official dependency installation instructions for the
target environment if `pip install -r requirements.txt` cannot resolve a
compatible build. CPU inference can be slower. A running Flask process or
healthy endpoint does not prove that model inference is available or accurate.
