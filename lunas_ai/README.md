# LUNAS AI Service

Optional Flask inference service for advisory image analysis. The API or
authorized operator may request category-specific model output; no model result
can make a Barangay, City Engineering, Utility Provider, or incident-closure
decision. See the [project scope](../LUNAS_PROJECT_SCOPE.md) for that boundary.

## Local setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```

The service listens on port 5001 by default. Configure the model paths and
runtime settings in `config.yaml`/`.env`, and verify required weight files are
present. `GET /api/v1/health` reports service and loaded-model status; it does
not prove that every configured model is available or accurate. Model
availability depends on local files, Python dependencies, hardware, and
configuration.

## Routes

| Method | Path | Use |
| --- | --- | --- |
| GET | `/api/v1/health` | Service and loaded-model status. |
| GET | `/api/v1/models` | Configured model metadata/status. |
| POST | `/api/v1/detect/comprehensive` | Multipart `image` plus canonical `category`; uses the service-owned category/model mapping. |
| POST | `/api/v1/detect/drainage`, `/api/v1/detect/electrical` | Fixed-category QA routes. |
| POST | `/api/v1/detect/road-damage`, `/api/v1/detect/cracks` | Standalone road/crack detection routes. |
| POST | `/api/v1/detect/privacy` | Excluded from current scope; compatibility endpoint returns HTTP 410 with `not_available` and `applied=false`, without loading a detector. |
| POST | `/api/v1/detect/all-hazards` | Disabled; returns HTTP 410 and directs callers to category-specific inference. |
| GET | `/api/v1/ping` | Simple liveness check. |

Inference output and confidence scores are model suggestions, can be wrong, and
are not calibrated public-safety decisions. Human review is required. Automatic
image privacy detection and visual masking are excluded from current scope. The legacy privacy route is disabled and its unused model configuration
is removed. Metadata removal in the backend does not anonymize image content.
LUNAS does not claim image-based duplicate detection.

The Express integration uses `AI_SERVICE_URL`, `AI_SERVICE_TIMEOUT`, and
`AI_SERVICE_ENABLED`; it stores supported output as advisory analysis when
incident evidence is submitted. A category without an available model remains
manual review. Configure and verify the backend-to-Flask path in the target
environment before demonstrating inference.

## Validation

From this directory, run the project tests if the required Python packages and
model fixtures are available. For a service smoke check, start Flask and query
the health/models endpoints. That check does not verify detection quality or
the mobile/web workflow.
