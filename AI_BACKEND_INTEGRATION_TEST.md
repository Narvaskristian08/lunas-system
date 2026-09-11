# LUNAS AI Backend Integration Test

Test date: 2026-09-10 (Asia/Manila)

Scope: Flutter mobile, Next.js web, the main API, the Python AI service, MongoDB persistence, and repair evidence. This report distinguishes source-code wiring from runtime proof. A passing unit test with a mocked AI response is not treated as live inference.

## Overall Result

| Area | Result | Basis |
|---|---|---|
| Mobile AI Integration | **NOT CONNECTED** | The production Flutter route has no on-device model. The current backend AI flags are disabled, and the exact mobile upload failed before persistence because storage is unconfigured. |
| Mobile -> Backend | **PARTIAL** | URL, authentication, multipart contract, and Express route match. An authenticated multipart request reached the route, but returned HTTP 500 at Supabase Storage and created no incident. |
| Web -> Backend | **CONNECTED** | An authenticated Next.js validation page rendered a real API record at HTTP 200 and generated the expected API requests. With the API stopped, the same page returned HTTP 500 and did not render the record. |
| Backend -> AI | **NOT CONNECTED in the tested runtime** | Conditional Express-to-Flask code exists, but `.env` disables both AI flags, port 5001 was closed, Python was unavailable, and no live model call ran. |
| AI -> Database | **NOT CONNECTED in the tested runtime** | The schema and conditional write path exist, but no real inference result was generated or stored. The runtime record contains defaults/unavailable state only. |
| Backend AI -> Web | **PARTIAL** | The real backend-to-web AI response contract works and the UI displayed the backend's unavailable state. No generated AI result was available to prove the completed-result path at runtime. |
| Repair Verification Pipeline | **NOT CONNECTED** | Repair evidence upload/storage code exists, but there is no comparison endpoint, OpenCV/SSIM invocation, result schema, persistence, or web verification result. |

The primary API is **Express/Node.js**, not FastAPI. The AI microservice is **Flask**, not FastAPI. No FastAPI application or route was found in the repository.

## Architecture Found

### Running components and configured boundaries

- Flutter mobile uses `http` through `ApiClient` and defaults to `http://10.0.2.2:5000/api/v1` (`lunas_mobile/lib/core/config/api_config.dart`).
- Next.js uses server-side `fetch` and defaults to `http://localhost:5000/api/v1` (`lunas_web/src/lib/api/url.ts`, `backend.server.ts`).
- The main API is Express on port 5000 (`lunas_backend/src/server.js`).
- The database is MongoDB through Mongoose (`lunas_backend/src/config/database.js`).
- The AI service is Flask on port 5001 (`lunas_ai/app.py`) and uses Ultralytics YOLO/PyTorch.
- Incident images are decoded, quality-checked, re-encoded to WebP, and stripped of metadata with Sharp in the Node backend.
- Private object storage is Supabase Storage. The local `.env` used for this test did not configure Supabase.

### Where AI/image processing runs

| Feature | Execution location | Runtime state |
|---|---|---|
| Mobile file size/type check | Flutter device | Connected; not AI |
| Mobile TensorFlow Lite hazard detection | Flutter device | Not implemented; no TFLite dependency/model load/inference call |
| Image decode, dimension quality check, WebP normalization, EXIF stripping | Express backend / Sharp | Executed during the multipart probe before storage failed |
| Road hazard detection | Flask / YOLO `road_damage` model | Code and model file exist; not running in tested configuration |
| `other` environmental hazard detection | Flask / YOLO `environmental_hazards` model | Code and model file exist; not running in tested configuration |
| Drainage/electrical/water/gas/streetlight inference | Flask | Explicitly unavailable (`category_models` maps these to `null`) |
| Privacy detection/redaction | Flask/Express boundary | Direct detector route exists, but application report flow does not call it; redaction is explicitly unavailable |
| Repair before/after comparison | Backend | Not implemented; no SSIM/alignment execution |

Model files existing on disk were not counted as execution proof. The configured road and environmental model files are present, but the tested environment could not start Python and exposed no service on port 5001.

## Mobile Connection

### Actual citizen evidence/report flow

`EvidencePickerScreen._pick()`

-> `EvidenceService.pick()`

-> `ImagePicker.pickImage()` plus local non-empty, <=10 MB, and JPG/PNG/WebP checks

-> `EvidenceSelection(analysis: modelAvailable=false, privacyStatus=unavailable, qualityStatus=basicChecksPassed)`

-> `ReportReviewScreen._submit()`

-> `ReportService.submit()`

-> `ApiClient.multipart('/incidents')`

-> `POST http://10.0.2.2:5000/api/v1/incidents`

-> Bearer token + multipart fields `category`, `description`, `privacyAcknowledged`, JSON `location`, and file field `evidence`

-> Express `uploadIncidentEvidence`, `parseIncidentPayload`, validators, `createIncident`

-> `processAndUploadEvidence()` / Sharp processing

-> conditional `aiService.analyzeIncidentImage()` only when `AI_EVIDENCE_ANALYSIS_ENABLED=true`

-> conditional Flask `POST /api/v1/detect/comprehensive` only when `AI_SERVICE_ENABLED=true`

-> Supabase upload

-> MongoDB `Incident.create({ images, aiAnalysis, ... })`

-> citizen-safe JSON response

-> `IncidentReport.fromJson()`

-> `CitizenReportDetailScreen` / `AiAssistanceCard`

Relevant source:

- `lunas_mobile/lib/features/reporting/presentation/screens/evidence_picker_screen.dart`
- `lunas_mobile/lib/features/reporting/data/services/evidence_service.dart`
- `lunas_mobile/lib/features/reporting/presentation/screens/report_review_screen.dart`
- `lunas_mobile/lib/features/reporting/data/services/report_service.dart`
- `lunas_mobile/lib/core/network/api_client.dart`
- `lunas_backend/src/routes/incidentRoutes.js`
- `lunas_backend/src/controllers/incidentController.js`
- `lunas_backend/src/services/evidenceService.js`

### Mobile hazard detection finding

Hazard Detection:

- Execution Location: **No mobile inference; optional Flask backend inference after submit**
- Backend Required for Inference: **Yes**
- TensorFlow Lite model loaded: **NO**
- Inference function called on device: **NO**
- Mobile prediction produced: **NO**
- Mobile prediction used in report: **NO**
- Mobile prediction sent to backend: **NO**
- Backend-generated prediction stored: **Not in this runtime; conditional source path only**

Flutter has no `tflite_flutter`, TensorFlow Lite, or equivalent inference dependency. `UnavailableEvidenceAnalysisService` always returns `modelAvailable: false`. The actual `GoRouter` does not register `AiHazardDetectionResultScreen`.

### Actual mobile request contract

| Field/header | Flutter sends | Express expects | Match |
|---|---|---|---|
| Method/path | `POST /incidents` under `/api/v1` | `POST /api/v1/incidents` | Yes |
| Authorization | `Authorization: Bearer <access token>` | `protect` bearer JWT middleware | Yes |
| Content type | multipart/form-data | Multer multipart | Yes |
| Evidence | file field `evidence` | `evidence` or legacy `images`, max 5 | Yes |
| Category | canonical code | canonical category enum | Yes |
| Description | text | 10-2000 characters | Yes |
| Location | JSON string containing GeoJSON point/address | parsed JSON object, `[longitude, latitude]`, barangay | Yes |
| Privacy | string `true`/`false` | citizen evidence requires `true` or `'true'` | Yes |
| Response | `{ data: incident }` | citizen-safe incident envelope | Yes |

The contract matches, but the exact runtime request failed at storage. Contract correctness is therefore not an end-to-end pass.

## Web Connection

### Actual incident/AI display flow

`app/(protected)/validation-routing/[id]/page.tsx`

-> `getValidationIncident(id)`

-> server-side `backendRequest()` with Bearer access token and `cache: 'no-store'`

-> parallel GET requests:

- `/api/v1/incidents/:id`
- `/api/v1/incidents/:id/history`
- `/api/v1/incidents/:id/duplicate-candidates`
- `/api/v1/incidents/:id/sla`

-> Express `incidentRoutes.js` / `incidentController.js`

-> MongoDB incident and normalized `aiAnalysis`/`images[].aiFindings`

-> `normalizeIncident()` in `validation.server.ts`

-> `ValidationReview`

-> `AiAssistance` and evidence overlays

The web validation UI does not calculate confidence locally. It formats the backend number as a percent and renders backend bounding boxes. Runtime failure with the API stopped proves this real page is backend-dependent.

### Repair/work-order web flow

`app/(protected)/repairs/[id]/page.tsx` redirects to `/work-orders/:id`.

`app/(protected)/work-orders/[id]/page.tsx`

-> `getWorkOrder(id)`

-> GET `/work-orders/:id`, `/assignments`, `/progress`, `/sla`

-> Express/MongoDB

-> `WorkOrderDetail`

-> separate citizen and repair evidence galleries.

This is a real backend evidence display, but it is **not** repair AI verification. The web model contains no SSIM/similarity/recommendation fields and the UI displays no calculated comparison result.

## AI Connection

| AI Feature | Execution Location | Called By | Backend Connected | Database Connected | UI Connected |
|---|---|---|---|---|---|
| On-device hazard prediction | Mobile | Nothing in production router | No | No | No; an unregistered hardcoded prototype exists |
| Road damage detection | Flask YOLO | Express incident evidence service, feature-gated | Source only; runtime disabled | Schema/write path only; no live result | Yes to backend result contract, not live inference |
| Environmental hazards for `other` | Flask YOLO | Same comprehensive route | Source only; runtime disabled | Same | Same |
| Unsupported-category availability | Flask/Express normalization | Incident submission | Source connected | Can store `unavailable` on successful multipart submission | Web/mobile can truthfully show unavailable |
| Sharp image quality/normalization | Express | Incident and repair evidence services | Yes | Yes after storage succeeds | Status fields are parsed/displayed |
| Privacy redaction | None | No report-flow caller | No | Stores `not_available`/`applied=false` | Web/mobile display unavailable state |
| Duplicate candidate scoring | Express geospatial service; not ML model | Incident creation | Yes | Yes | Web/mobile validation UI connected |
| Repair OpenCV alignment | None | Nothing | No | No fields | No real UI result |
| Repair SSIM | None | Nothing | No | No fields | No real UI result |
| Repair recommendation | None | Nothing | No | No fields | No real UI result |

### Conditional backend AI path

The source path is concrete:

1. `processOne()` checks `AI_EVIDENCE_ANALYSIS_ENABLED === 'true'`.
2. It calls `aiService.analyzeIncidentImage(preparedBuffer, category)`.
3. `aiService.comprehensiveDetection()` posts the WebP image and canonical category to `${AI_SERVICE_URL}/api/v1/detect/comprehensive`.
4. Flask validates the image/category and calls `detection_service.comprehensive_detection()`.
5. That service chooses only the configured category model, invokes Ultralytics, and returns normalized detections.
6. Express normalizes the response into `aiAnalysis` and `images[].aiFindings`.
7. `Incident.create()` persists those fields.

This source path is **conditionally wired**, but current runtime evidence is negative: both flags were false and Flask was not listening.

## API Endpoints

| Source | Endpoint | Method | Destination | AI/integration function | Connected? |
|---|---|---|---|---|---|
| Flutter citizen | `/api/v1/incidents` | POST multipart | Express | Report/evidence submission; optional AI after upload processing | **Partial runtime** |
| Flutter citizen | `/api/v1/incidents/:id` | GET | Express | Retrieve persisted AI/evidence state | Source connected |
| Flutter repair | `/api/v1/work-orders/:id/evidence` | POST multipart | Express | Store repair evidence only | Source connected; no AI |
| Flutter repair | `/api/v1/work-orders/:id/progress` | POST | Express | Progress and optional evidence | Source connected; no AI |
| Next.js validation | `/api/v1/incidents/:id` | GET | Express | Retrieve normalized incident AI result | **Runtime connected** |
| Next.js validation | `/api/v1/incidents/:id/history` | GET | Express | Incident history | **Runtime connected** |
| Next.js validation | `/api/v1/incidents/:id/duplicate-candidates` | GET | Express | Advisory duplicate candidates | **Runtime connected** |
| Next.js validation | `/api/v1/incidents/:id/sla` | GET | Express | SLA state | **Runtime connected** |
| Next.js work order | `/api/v1/work-orders/:id` | GET | Express | Before/citizen and repair evidence retrieval | Source connected; no comparison |
| Next.js work order | `/api/v1/work-orders/:id/evidence` | POST multipart | Express | Repair evidence upload | Source connected; no comparison |
| Express | `/api/v1/detect/comprehensive` | POST multipart | Flask | Category-routed YOLO inference | Conditional source path; **not runtime connected** |
| Express legacy helper | `/api/v1/detect/road-damage` | POST multipart | Flask | Direct road detection | Route exists; not used by current incident workflow |
| Express legacy helper | `/api/v1/detect/cracks` | POST multipart | Flask | Crack detection | Route exists; configured model file absent and not used by current workflow |
| Express legacy helper | `/api/v1/detect/privacy` | POST multipart | Flask | Privacy-object detection | Route exists; not used for report redaction |
| Any client | Repair comparison endpoint | N/A | N/A | OpenCV/SSIM verification | **No endpoint exists** |

## End-to-End Test Results

| Test | Expected | Actual | Status |
|---|---|---|---|
| A — Mobile -> backend exact multipart | Authenticated request, evidence stored, incident created | Request reached Express; HTTP 500 `Failed to upload file to Supabase Storage`; zero matching incident records | **FAIL** |
| B — Mobile AI | TFLite model load/inference or backend inference used | No TFLite implementation; backend flags false; no prediction generated | **FAIL** |
| C — Web -> backend incident | Web requests protected API and renders returned incident | HTTP 200; report `LUNAS-202609-000007` and `Analysis unavailable` rendered; backend logged user + four incident GETs | **PASS for backend connectivity** |
| D — Backend AI -> web | Live AI function executes, result returns, same value renders | Web rendered backend unavailable state; no Flask execution or generated value | **FAIL for AI; PASS for truthful unavailable-state propagation** |
| E — Repair verification | Before/after upload -> OpenCV/alignment -> SSIM -> DB -> web | Upload/storage code only; no comparison call, fields, endpoint, or web result | **FAIL** |
| Failure test | Backend-dependent data fails when API is stopped | Same authenticated page changed from HTTP 200 to HTTP 500; report vanished; server logged `BackendApiError` 503 | **PASS (not mocked/cached)** |
| Backend automated tests | Project tests pass | 21 suites, 76 tests passed; AI and storage dependencies are mocked in relevant tests | **PASS, not E2E proof** |
| Web lint | No lint errors | `npm run lint` exited 0 | **PASS** |
| Web production build | Build/type-check succeeds | Compilation succeeded, type-check failed on stale/missing `.next/dev/types` route `verification/[id]/page.js` | **FAIL** |
| Flutter tests | Test suite completes | Flutter process emitted no output and remained blocked; it was stopped after repeated waits | **NOT VERIFIED** |
| Flask live test | Service/model starts and answers | Python executable unavailable, Docker unavailable, port 5001 closed | **NOT RUN** |

### Runtime evidence details

#### Test A — exact mobile-shaped request

- Registration: HTTP 201, citizen token issued.
- Request: `POST /api/v1/incidents`, Bearer JWT, multipart fields matching `ReportService`, real PNG in `evidence`.
- HTTP status: **500**.
- Response: `Failed to upload file to Supabase Storage`.
- Backend log: `Supabase Storage not initialized`, then `Incident evidence processing failed`.
- Database query: matching exact-mobile-probe incidents = **0**.
- Result: **FAIL**.

#### Backend/database control probe

A separate legacy JSON evidence request was used only to isolate the API/database boundary:

- `POST /api/v1/incidents`: HTTP 201.
- Created report: `LUNAS-202609-000007`, MongoDB id `6aa2a0a6fcd6fc35b65f5f92`.
- `GET /api/v1/incidents/:id`: HTTP 200; ID and description matched; one evidence record returned.
- Direct MongoDB query confirmed the record.
- It contains no generated AI result: `modelAvailable=false`, zero detections/findings, and legacy privacy status `unverified_legacy_upload`.
- This proves auth/API/database persistence, **not** the mobile upload or AI pipeline.

Two clearly labelled integration-QA citizen accounts and the above one incident remain in the local test database for inspection.

#### Test C and failure test — authenticated Next.js page

Backend running:

- Web request: `GET /validation-routing/6aa2a0a6fcd6fc35b65f5f92`.
- Web HTTP status: **200**.
- UI HTML contained report number: **YES**.
- UI HTML contained backend AI state `Analysis unavailable`: **YES**.
- Backend requests logged: `GET /users/me`, `/incidents/:id`, `/history`, `/duplicate-candidates`, `/sla`, all HTTP 200.

Backend stopped:

- Same URL and encrypted session cookie.
- Web HTTP status: **500**.
- UI HTML contained the report: **NO**.
- Next.js log: `BackendApiError: The LUNAS service could not be reached`, status 503 internally.
- Backend was restarted after the failure check to confirm recovery, then the backend and web processes started by this audit were stopped during cleanup.

## Repair Verification Trace

Actual connected portion:

Flutter `UploadRepairEvidenceScreen`

-> `RepairService.uploadEvidence()`

-> `POST /api/v1/work-orders/:id/evidence`

-> Multer + `uploadRepairEvidence()`

-> `processAndUploadRepairEvidence()`

-> Sharp quality check/WebP normalization

-> Supabase Storage

-> MongoDB `WorkOrder.repairEvidence[]`

-> `GET /api/v1/work-orders/:id`

-> Next.js `getWorkOrder()`

-> `WorkOrderDetail` repair evidence gallery.

Missing portion:

Before image **X** OpenCV alignment **X** SSIM **X** similarity/result **X** repair recommendation **X** persisted verification **X** web review control.

`compareRepairImages()` in `lunas_backend/src/utils/imageProcessor.js` returns only:

- `available: false`
- `similarity: null`
- `improvementDetected: null`
- `notes: 'Repair image comparison is not configured'`

No production caller invokes this function.

## Broken Connections

### 1. Requested FastAPI layer does not exist

Problem: The requested architecture names FastAPI, but the repository implements Express plus Flask.

Frontend File: mobile/web API clients.

Backend File: `lunas_backend/src/server.js`; `lunas_ai/app.py`.

Expected Flow: Flutter/Next.js -> FastAPI -> AI.

Actual Flow: Flutter/Next.js -> Express -> optional Flask AI.

Reason: Technology differs from the requested architecture.

Recommended Fix: Either update architecture/test documentation to Express + Flask, or intentionally migrate with explicit API compatibility tests. Do not describe the current system as FastAPI.

### 2. Mobile incident upload cannot complete locally

Problem: Exact mobile multipart request returns HTTP 500.

Frontend File: `lunas_mobile/lib/features/reporting/data/services/report_service.dart`.

Backend File: `lunas_backend/src/services/storageService.js`.

Expected Flow: upload -> storage -> incident record -> response.

Actual Flow: upload -> Sharp -> uninitialized Supabase -> 500 -> no record.

Reason: Supabase URL/service-role/bucket are not configured in the tested `.env`.

Recommended Fix: Configure a private Supabase bucket and credentials, or add a deliberate local storage adapter for development; rerun the exact multipart test.

### 3. Backend AI is disabled/unavailable

Problem: No incident inference executes.

Frontend File: `ReportService` and web `ValidationReview` depend on backend state.

Backend File: `evidenceService.js`, `aiService.js`, local `.env`.

Expected Flow: successful evidence processing -> Flask comprehensive detection.

Actual Flow: `AI_EVIDENCE_ANALYSIS_ENABLED=false`; `AI_SERVICE_ENABLED=false`; port 5001 closed.

Reason: Runtime configuration and missing Python/Docker runtime.

Recommended Fix: Start Flask with pinned dependencies, enable both flags, configure storage, verify `/health` models, then submit a real image and retain Flask/Express/DB/web evidence.

### 4. Mobile on-device AI does not exist

Problem: No TFLite inference occurs.

Frontend File: `evidence_analysis_service.dart`, `evidence_service.dart`.

Expected Flow: image -> model -> prediction -> report payload (if on-device AI is intended).

Actual Flow: explicit `modelAvailable=false`; report payload has no client AI fields.

Reason: The current design delegates optional inference to the backend.

Recommended Fix: If backend-only is intentional, remove/archive misleading prototype AI screens and document backend-only inference. If on-device is required, add a real model/interpreter, tests, and signed result contract.

### 5. Repair verification has no AI/CV pipeline

Problem: No OpenCV alignment, SSIM, score, recommendation, or official verification endpoint.

Frontend File: real work-order evidence screens; static prototype verification screens.

Backend File: `imageProcessor.js`, `workOrderRoutes.js`, `WorkOrder.js`.

Expected Flow: before + after -> alignment -> SSIM -> result -> DB -> web official decision.

Actual Flow: after evidence -> Sharp/storage -> evidence gallery only.

Reason: Explicitly deferred/not configured.

Recommended Fix: Design a human-reviewed verification resource, implement deterministic image retrieval/alignment/comparison, store algorithm/version/score/status, expose a protected endpoint, and bind web controls to it. Validate that SSIM is meaningful for the capture protocol before using it operationally.

### 6. Production web build currently fails

Problem: `next build` fails during type-check.

Frontend File: generated `.next/dev/types/validator.ts` references missing `src/app/(protected)/verification/[id]/page.js`.

Expected Flow: successful build and deployable command center.

Actual Flow: compilation passes, type-check fails.

Reason: stale generated route types or a removed route not reconciled with the build cache.

Recommended Fix: safely clear/recreate generated Next output and confirm the route inventory, then rerun `npm run build`. No source code was changed during this audit.

## Mock / Placeholder Detection

### AI-specific hardcoded results found

| File | Finding | Production route? |
|---|---|---|
| `lunas_mobile/lib/features/citizen/presentation/screens/ai_hazard_detection_result_screen.dart` | Hardcoded `Severe Road Pothole`, `98%`, `.98`, privacy `Passed`, and “No faces or license plates” | **No**; class is not registered/imported by the actual router |
| `lunas_mobile/lib/features/operations/presentation/screens/repair_verification_screen.dart` | Hardcoded “98% match,” synthetic before/after panels, approval navigation | **No** in actual `GoRouter` |
| `lunas_mobile/lib/features/engineering/presentation/screens/repair_verification_engineering_screen.dart` | Hardcoded “98% structural match,” explicitly says visuals are native placeholders | **No** in actual `GoRouter` |
| `lunas_mobile/lib/features/reporting/presentation/screens/report_details_screen.dart` | Static “AI triage: High priority” report detail prototype | **No** in actual `GoRouter`; real route is `CitizenReportDetailScreen` |

The real routed mobile evidence screen truthfully says automated quality scoring and privacy redaction are unavailable. The real routed report-detail screen parses backend `aiAnalysis` and `aiFindings`.

### Web mocks

The core validation and work-order pages use the real backend. Other command-center modules still import mock data/services:

- Barangay operations imports `mock-data`.
- Admin console imports `mock-data`.
- Notifications and help center import `mock-api`.
- Maintenance coordination contains static table rows/actions.

These are real product mock areas, but they are not the source of the tested validation page's AI state. `Math.random()` in the toast provider generates UI IDs, not AI results.

## Database Persistence

Actual incident schema fields:

- `images[].quality.status/issues`
- `images[].privacyProcessing.status/applied/acknowledgedByReporter/detectedRegions/processedAt`
- `images[].aiFindings[].label/confidence/bbox`
- `aiAnalysis.analysisStatus/category/modelAvailable/detected/hazardType/confidence`
- `aiAnalysis.detections.roadDamage/cracks`
- `aiAnalysis.findingsCount/needsPrivacyMasking/requiresManualReview/advisoryOnly/processedAt`

Actual work-order evidence schema stores file metadata but has **no** SSIM, repair score, comparison result, AI verification, or recommendation field.

Persistence verdict:

- API/database control record: proven.
- AI schema: proven by source.
- Mocked completed-AI normalization: proven by unit tests.
- Real AI-generated value persisted: **not proven and did not occur**.
- Repair comparison result persisted: **impossible in current schema/path**.

## Final Connection Diagram

### Citizen mobile / incident AI

Camera or gallery

✅ CONNECTED -> Flutter `ImagePicker`

✅ CONNECTED -> local file type/size checks

❌ NOT CONNECTED -> on-device TensorFlow Lite inference

✅ CONNECTED (request reached server) -> Bearer multipart `POST /api/v1/incidents`

✅ CONNECTED -> Express auth/Multer/validation/Sharp

❌ NOT CONNECTED in runtime -> Flask YOLO (both flags false; service down)

❌ NOT CONNECTED in runtime -> Supabase Storage (unconfigured)

❌ NOT CONNECTED for exact mobile probe -> MongoDB incident creation

⚠️ PARTIALLY CONNECTED -> mobile AI result display (real backend contract exists; no live result)

### Web validation

Next.js validation page

✅ CONNECTED -> server-side authenticated fetch

✅ CONNECTED -> Express incident/history/candidates/SLA endpoints

✅ CONNECTED -> MongoDB record

✅ CONNECTED -> backend unavailable AI state

✅ CONNECTED -> web `AiAssistance` display

⚠️ PARTIALLY CONNECTED -> completed AI display (source contract only; no live result exercised)

### Repair flow

Flutter repair evidence selection

✅ CONNECTED by source -> multipart upload route

✅ CONNECTED by source -> Sharp normalization

⚠️ PARTIALLY CONNECTED -> storage/database (code exists; current storage config blocks live upload)

❌ NOT CONNECTED -> OpenCV alignment

❌ NOT CONNECTED -> SSIM

❌ NOT CONNECTED -> repair recommendation/result persistence

✅ CONNECTED by source -> raw repair evidence retrieval and Next.js gallery

❌ NOT CONNECTED -> official web AI verification result

🟡 MOCKED -> unregistered Flutter 98% repair-verification prototypes

## Final Verdict

1. **Is AI actually working in Mobile?** No. There is no on-device inference, and the optional backend inference did not run in the tested environment.
2. **Is Mobile actually connected to FastAPI?** No FastAPI exists. Flutter is wired to Express. The exact request reached Express but failed at storage, so the complete mobile workflow is only partially connected.
3. **Are mobile AI results actually reaching FastAPI?** No. Mobile produces no AI result, FastAPI does not exist, and the report sends image/category data rather than client AI fields.
4. **Are AI results actually stored in the database?** The schema and conditional code support it, but no real generated result was stored or proven. Current answer: **No, not in this runtime**.
5. **Is Web actually connected to FastAPI?** No FastAPI exists. The web is demonstrably connected to Express.
6. **Is Web displaying real backend AI data?** It displayed the real backend's `unavailable` AI state. A real completed inference value was not available to demonstrate.
7. **Does backend repair verification actually execute OpenCV/SSIM?** No.
8. **Does the repair verification result reach the Web Command Center?** No result exists. Only raw before/citizen and repair evidence reaches the work-order page.
9. **Are any AI results currently mocked or hardcoded?** Yes, in several unregistered Flutter prototype screens, including 98% hazard/repair values and a fake privacy pass. The real web validation AI panel is backend-backed.
10. **Can we truthfully demonstrate that LUNAS AI is integrated end-to-end?** **No.** We can demonstrate real Web -> Express -> MongoDB connectivity and conditional Express -> Flask source wiring. We cannot demonstrate Mobile -> storage -> AI -> MongoDB -> Web, nor any repair OpenCV/SSIM pipeline, in the current implementation/configuration.

## Minimum Retest Gate for an End-to-End Claim

Before claiming full integration, all of the following must produce retained runtime evidence:

1. Configure private storage and successfully complete the exact Flutter multipart payload.
2. Start Flask, prove `/api/v1/health` reports the intended loaded model, and enable both backend AI flags.
3. Submit a real supported-category image and capture Flutter request, Express log, Flask inference log, HTTP 201 response, and MongoDB `aiAnalysis`/`aiFindings` from the same incident ID.
4. Load that incident in the authenticated Next.js validation page and compare the exact stored confidence/finding values with rendered output.
5. Implement the repair comparison contract and repeat the same evidence chain for before image, after image, algorithm execution, persisted versioned result, and official web review.
6. Repeat with Flask stopped and verify a truthful `failed`/`unavailable` state rather than a generated confidence value.
