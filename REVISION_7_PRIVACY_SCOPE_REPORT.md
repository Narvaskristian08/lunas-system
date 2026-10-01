# Revision 7 — Exclude automatic image privacy masking

## Git safety and scope

Active branch: `scope/exclude-automatic-privacy-masking`, created from
`SystemRevision` at `a090036` (the Revision 6 SLA commit). Initial working tree,
index, and untracked-file status were clean. The requested branch did not already
exist; its active name was confirmed before project edits. No existing changes
needed relocation or preservation. No commit, push, merge, stash, reset, evidence
deletion, or database migration was performed.

Automatic face blurring, license-plate masking, visual privacy redaction, image
anonymization, and the unsupported privacy detector are excluded from current
scope. This does not exclude privacy notices, reporter acknowledgement,
credential/audit secret redaction, or protected evidence access.

## Verified original implementation

- The active Citizen evidence path already validated/decoded images with Sharp,
  re-encoded to WebP without EXIF/GPS metadata, calculated SHA-256, uploaded through
  the private-default Supabase service, and recorded `isPrivacyMasked=false`,
  `privacyProcessing.status=not_available`, and `applied=false`.
- Hazard AI was optional and advisory. It did not invoke a privacy detector.
  Repair evidence used validation, normalization, hashing, and private storage
  without incident AI classification.
- `imageProcessor.applyPrivacyMask` was an unused throwing stub. Repository
  searches found no caller.
- `aiService.detectPrivacyConcerns` was an unused backend HTTP client. Flask's
  `/api/v1/detect/privacy` invoked a standalone privacy detector method with a
  generic `models/yolov8n.pt` configuration. That checkpoint was absent. The method
  filtered generic person/vehicle classes; it did not blur faces, detect/redact
  plates reliably, or modify stored images. The example `MODEL_PRIVACY` flag had
  no configuration consumer.
- AI evidence normalization could derive a legacy `needsPrivacyMasking` flag
  from `privacy_concerns`, despite no supported visual privacy processing.
- Web work-order copy called evidence “privacy-processed” and combined
  “EXIF/privacy processing.” Other web/mobile notices truthfully said redaction
  was unavailable, but framed it as missing functionality rather than excluded
  scope. Scope documentation also listed a replacement detector as unfinished
  release work.
- Historical evidence models and serializers retain privacy fields and legacy
  URLs. Their compatibility behavior must remain; records were not rewritten.

## Functions removed, disabled, and retained

| Function/configuration | Result |
| --- | --- |
| `imageProcessor.applyPrivacyMask` | Remove unused throwing stub. |
| Backend `aiService.detectPrivacyConcerns` | Remove unused detector HTTP client. |
| Python `DetectionService.detect_privacy_concerns` | Remove unsupported detector implementation. |
| Flask `detect_privacy` / `/api/v1/detect/privacy` | Retain compatibility endpoint; return HTTP 410, `success=false`, `status=not_available`, `applied=false`, without reading an upload or invoking inference. |
| `privacy_detection` model and `MODEL_PRIVACY` example | Remove unused model configuration and example flag; no replacement model. |
| `normalizeAiAnalysis.needsPrivacyMasking` | Retain legacy field, always false for newly normalized analysis, irrespective of AI privacy suggestions. |
| Evidence/model privacy fields | Retain for historical reads; new evidence keeps truthful unavailable/unapplied values. |
| `checkImageQuality`, `getImageMetadata`, `prepareEvidenceImage` | Retain original validation, decoding, orientation correction, dimension bound, and metadata-stripping behavior. |
| Incident/repair upload, cleanup, checksum and storage services | Retain existing security and rollback paths. No historical object deletion. |
| Hazard analysis and `_run_category_detection` | Retain category selection, image validation, inference and manual-review behavior. |
| Secret redaction in audit logs | Retain; credential handling is unrelated to visual image masking. |

## Exact changed files

| File | Change |
| --- | --- |
| `LUNAS_CURRENT_PROJECT_SCOPE.md` | Clarify current exclusion; remove privacy-model/masking release requirements while preserving unrelated audit statements. |
| `LUNAS_PROJECT_SCOPE.md` | Add explicit scope boundary and retained security requirements. |
| `README.md` | Root scope clarification. |
| `REVISION_7_PRIVACY_SCOPE_REPORT.md` | This audit, validation, and paper-review record. |
| `lunas_ai/.env.example` | Remove unused `MODEL_PRIVACY`. |
| `lunas_ai/config.yaml` | Remove unsupported privacy-model configuration only. |
| `lunas_ai/src/api/routes.py` | Disable legacy privacy endpoint with an explicit 410 response. |
| `lunas_ai/src/services/detection_service.py` | Remove privacy detector method; retain hazard inference. |
| `lunas_ai/README.md` | Align endpoint catalog and scope statements. |
| `lunas_ai/CONFIDENCE_GUIDE.md` | Explain disabled route and metadata/visual-redaction distinction. |
| `lunas_ai/test_privacy_scope.py` | Add isolated handler/config/hazard-routing unit tests. |
| `lunas_backend/src/utils/imageProcessor.js` | Remove dead mask stub; retain image security functions. |
| `lunas_backend/src/services/aiService.js` | Remove unused privacy HTTP client. |
| `lunas_backend/src/services/evidenceService.js` | Force truthful compatibility flag and clarify scope comments. |
| `lunas_backend/src/services/evidenceService.test.js` | Add metadata, format, size, minimum dimensions, hashing, and false-success regression assertions. |
| `lunas_backend/src/services/storageService.test.js` | Add private upload, short-lived signing, fail-closed signing, and legacy URL tests. |
| `lunas_backend/src/controllers/incidentController.test.js` | Add historical evidence/privacy-field readability test. |
| `lunas_backend/README.md` | Explicit privacy scope/security boundary. |
| `lunas_backend/SUPABASE_ONESIGNAL_GUIDE.md` | Explicit privacy scope/security boundary. |
| `lunas_mobile/lib/features/reporting/data/services/report_service.dart` | Clarify continuing acknowledgement requirement in comment. |
| `lunas_mobile/lib/features/reporting/presentation/screens/evidence_picker_screen.dart` | Explain exclusion, metadata distinction, and safe capture guidance. |
| `lunas_mobile/lib/features/reporting/presentation/screens/report_review_screen.dart` | Keep required checkbox with accurate acknowledgement wording. |
| `lunas_mobile/lib/features/reporting/presentation/screens/citizen_report_detail_screen.dart` | Explain scope exclusion for unavailable evidence processing. |
| `lunas_mobile/test/incident_report_test.dart` | Historical records with missing/present legacy privacy fields remain readable. |
| `lunas_mobile/README.md` | Explicit privacy scope/security boundary. |
| `lunas_web/src/app/(public)/privacy/page.tsx` | Retain privacy notice; explicitly exclude visual masking and anonymity claims. |
| `lunas_web/src/components/validation/validation-review.tsx` | Replace unavailable-feature badge with scope-exclusion wording. |
| `lunas_web/src/components/work-orders/work-order-detail.tsx` | Replace misleading privacy-processing claims with validation/metadata/private-access wording. |
| `lunas_web/tests/shared-screens.spec.ts` | Verify the public privacy notice contains the scope exclusion. |
| `lunas_web/README.md` | Explicit privacy scope/security boundary. |

## Evidence security and prior revisions preserved

No production authentication, authorization, ownership, jurisdiction, priority,
notification, SLA, assignment/reassignment, or closure logic was changed. Docker
deployment configuration was not changed. Existing masks/checkpoints, user
evidence, database records, and audit entries were not deleted. No replacement
privacy model or background privacy task was introduced.

Validation still enforces supported image formats, byte limits, minimum quality
dimensions, safe Sharp decoding, output resolution bounds, orientation correction,
and WebP re-encoding. EXIF/GPS removal and SHA-256 remain intact. Supabase is
private by default; protected APIs continue issuing configured short-lived signed
URLs instead of returning public URLs. Role/record scope remains enforced. Tests
use mocks for Supabase; no live bucket policy or storage deployment was changed
or verified. Historical URLs and privacy metadata remain readable without
fabricating new masking results.

## Executed validation

| Command/check | Exact result |
| --- | --- |
| Backend `npm test -- --runInBand --silent` | 36 suites / 198 tests passed; 1 suite / 32 tests skipped. |
| Backend `npm run lint` | Passed. |
| Web `npm run lint` | Passed. |
| Web `npm run test:e2e` | Next.js production build and TypeScript passed; 3 browser tests passed, 3 fixture-dependent cases skipped. |
| Web standalone preparation + `node scripts/run-playwright.mjs` after adding the privacy assertion | 3 browser tests passed, 3 skipped. Uses the already built production bundle. |
| Mobile `flutter test --no-pub` | 25 tests passed, including the new historical evidence test. |
| Mobile `flutter analyze --no-pub` | Exit 1: 14 informational lint findings, no reported errors/warnings, in unchanged files (`report_timeline_screen.dart`, `repair_service.dart`, `incident_report.dart`). They were left outside this scope. |
| Mobile `flutter build apk --debug --no-pub` | Passed; generated `lunas_mobile/build/app/outputs/flutter-apk/app-debug.apk`. Existing Gradle/AGP/Kotlin deprecation warnings were reported. No bypass flags used. |
| AI `python -m unittest test_privacy_scope -v` | 5 unit tests passed, covering disabled handler, image-validation failure, all canonical hazard categories, fixed/generic routing, and config/checkpoint preservation. |
| Existing AI `test_category_models.py` functions run with `unittest.FunctionTestCase` | 4 tests passed: category routes, available checkpoints, water/streetlight checkpoints, and missing-gas manual behavior. |
| AI `python -m compileall -q src test_privacy_scope.py` | Passed. |
| AI `python -m pytest` | Could not run: installed Python has no pytest. Flask and Ultralytics are also unavailable. No packages were installed. |
| Git whitespace validation | `git diff --check` passed. |

The initial sandboxed Flutter command could not acquire its SDK-cache lock; it
was stopped. Requested mobile tests/analysis/build then ran with approved SDK
cache access. Flutter tests and an APK build do not establish device execution.
The isolated Python handler tests compile actual handler source with test doubles;
they do not start Flask, exercise HTTP middleware, or load YOLO. No live hazard
inference, Supabase access, or automatic anonymization was claimed.

## Privacy limits and academic review

People, faces, license plates, and unrelated private details can remain visible
in uploaded images. Metadata removal does not anonymize visible content. Required
acknowledgement, careful evidence capture, and scoped access remain important;
they do not establish legal compliance. Existing legacy external/public URLs keep
their historical compatibility and do not inherit new private-storage or
metadata-stripping guarantees. Stored historical privacy flags are preserved as
recorded data, not a new guarantee of successful masking.

No capstone paper (`.pdf`, `.doc`, `.docx`, or `.tex`) was found in the current
tracked repository or the repository file audit. Review the following paper
sections when the approved manuscript is supplied; these are section topics,
not invented section numbers:

1. **Abstract and objectives:** remove automatic masking as a delivered objective.
   Suggested replacement: “LUNAS validates and normalizes evidence images,
   removes embedded EXIF/GPS metadata, and restricts evidence access. Automatic
   visual image anonymization is excluded from the current scope.”
2. **Scope and delimitations:** explicitly exclude face blurring, plate masking,
   visual redaction, image anonymization, and privacy-detection models; retain
   secure evidence handling, consent/acknowledgement, and access controls.
3. **Requirements and feature tables:** separate metadata removal and secure
   access from visual masking. Do not list automatic masking as implemented or
   as a current acceptance criterion.
4. **Architecture, conceptual framework, data-flow and processing diagrams:**
   remove unsupported detector/redactor blocks. Retain validation → safe decode/
   re-encode and metadata removal → checksum → private storage; keep hazard AI
   advisory and category-scoped.
5. **Methodology and privacy/ethics:** describe actual acknowledgement and access
   safeguards without implying visual anonymity. Have the academic/privacy
   reviewer assess the exclusion; do not rewrite approved methodology or assert
   statutory compliance without approval/evidence.
6. **Testing and results:** remove unsupported masking-success metrics or claims.
   Report only the executed security/scope tests and their limits; do not alter
   empirical study results or infer detection accuracy from these checks.
7. **Conclusions, limitations, and future work:** acknowledge visible identifying
   content can remain. Any later privacy-model proposal requires separate scope
   approval; it is not a promised feature of this revision.

## Final Git state

Branch remains `scope/exclude-automatic-privacy-masking`. Final changes are
unstaged and uncommitted: 27 modified tracked files and 3 new files (this report,
the Python scope test, and the storage-service test), matching the inventory
above. No merge or push was attempted. Revision 6 remains in the branch ancestry.
