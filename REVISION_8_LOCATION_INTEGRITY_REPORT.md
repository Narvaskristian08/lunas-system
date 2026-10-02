# LUNAS Revision 8 - location integrity and verification

Date: 2 October 2026 (Asia/Shanghai).

## Git safety

Initial branch: `scope/exclude-automatic-privacy-masking`. Initial HEAD: `a203de2b9e1934614eba0781dca37f3c7cb3bf4e` (`refactor(privacy): exclude automatic image masking from project scope`). `git status --short`, unstaged/staged diff statistics, and untracked-file inspection were empty. Revision 7 was already committed; the reported 27 modified and 3 untracked files were no longer present. No preservation commit was needed. Created `feature/report-location-integrity` after checking this evidence. The sandbox initially prevented Git ref creation; the branch command succeeded through the approved escalation. No reset, stash, commit, merge, or push was performed. HEAD remains the Revision 7 commit; Revision 8 is uncommitted for review.

## Verified audit findings and root causes

- The active Citizen route uses `NewCitizenReportScreen`, `MapPickerScreen`, `ReportReviewScreen`, and `ReportService`. Camera and photo-library evidence already work; there is no reason to require live capture or physical presence. The separate placeholder location-selection screen is not used by this reporting route and was not used for GPS verification.
- `LocationService` obtains a platform position and reverse-geocodes a selected pin. Before Revision 8, accuracy and fix timestamp were discarded, there was no GPS/pin comparison, and opening the map always replaced the selected incident pin with current GPS. This could accidentally move a delayed report to the submitter's home.
- Final review previously lacked an explicit actual-damage-location confirmation and discrepancy explanation. The incident schema and creation validation had no integrity contract.
- Canonical 31-barangay matching and geocoder suggestions already exist. Name recognition and address lookup do not establish geographic containment.
- Existing incident query scopes restrict Citizen ownership, Barangay jurisdiction, City Engineering review, and Utility Provider organization. Review UI, rejection reasons, status history, private evidence URLs, EXIF removal, and audit logging were reused.
- Existing rejection reasons are free text; duplicate and rejection decisions do not reliably distinguish intentional fabrication, inaccurate locations, invalid evidence, or unverifiable reports. No historical report is relabeled.
- Duplicate detection already uses category, distance, and time. Its Haversine calculation was extracted to a shared numeric utility with a clamp for rounding near antipodal points; the same advisory heuristic is retained.
- Nearby incident responses previously returned whole incident documents. With new restricted review records this would disclose unnecessary information to operational callers. The response now uses an allowlisted projection, omitting both review records and location-integrity summaries.
- User account restrictions remain under the existing account-management policy. No review finding invokes suspension, penalties, notifications accusing a citizen, or account changes.

## Citizen behavior

Citizens may choose GPS, tap/adjust a map pin, or provide a manual selected location. Existing selected pins survive reopening the map. A GPS refresh is optional; denied or unavailable location permits manual selection. Photos captured earlier remain accepted through the existing library flow.

Final review always requires confirmation that the pin represents the actual damage location. Significant differences display a neutral warning and require one of: photo taken earlier, inaccurate GPS, reporting elsewhere, or Other with 10-500 characters. Confirmed reports with an explanation are submitted through the unchanged lifecycle. No mismatch automatically rejects a report. Location review has loading, retry, submission/error states, labeled controls, and an accessibility label for loading. GPS comparison is recalculated when pins or fixes change, every five seconds during final review, and immediately before submission.

## Calculation and policy

Haversine great-circle distance uses radius 6,371,000 metres and GeoJSON coordinate order `[longitude, latitude]`. Significant discrepancy means `max(0, distanceMetres - reportedHorizontalAccuracyMetres) > configuredThresholdMetres`. Comparison uses full distance; the retained distance summary is rounded to the nearest metre. Equality at the threshold is not significant.

Operational defaults are a 500m discrepancy threshold, maximum 100m reported horizontal accuracy, and maximum fix age of 120 seconds. A fix over five seconds in the future is inconclusive. Configure positive finite `LOCATION_DISCREPANCY_METERS`, `LOCATION_MAX_ACCURACY_METERS`, and `LOCATION_MAX_AGE_SECONDS`; invalid configuration falls back to defaults. These are adjustable initial operating values, not scientifically validated fraud thresholds. Accuracy subtraction is a conservative advisory allowance, not a guaranteed statistical confidence bound. GPS accuracy, time, and coordinates can all be falsified by a client.

An unusable accuracy/time yields `inconclusive`; absent GPS yields `unavailable`. Neither is a suspicion label. Current GPS never establishes photo capture location. This does not introduce an AI fraud detector, image duplication model, or face recognition.

## Backend security and privacy

Authenticated policy retrieval informs the mobile comparison. New report creation requires confirmed pin metadata; multipart JSON parsing accepts the new integrity field. Backend validation and the controller independently recompute applicable values, require explanations when needed, and ignore client-derived distance, discrepancy flags, jurisdiction verification, thresholds, and confirmation timestamps. The recorded confirmation timestamp is server receipt time for a confirmed submission.

Persisted fields are pin source, comparison availability/result, unavailable reason where known, usable distance/accuracy summary, configured threshold, discrepancy indicator, bounded explanation, server confirmation time, and `unverified_geographically` jurisdiction status. Incident coordinates stay in the existing incident location. Raw current coordinates and fix timestamps are transient request inputs and are never persisted or returned. General audit sanitization redacts GPS, current-position, and integrity payload keys; validation errors return messages/field names without raw values. Citizen serializers and operational maps omit summaries; scoped official detail responses expose only the allowlisted summary. False-report review records are available only through the dedicated authorized, scoped endpoints.

Existing evidence validation, private storage, signed URL access, metadata/EXIF removal, category AI assistance, and Revision 7 masking exclusion remain intact. No retention of citizen movement history was introduced. New API submissions from older clients lacking confirmation will receive validation errors; deploy the updated backend and mobile client together. Historical records remain readable with comparison/confirmation labeled unavailable or not recorded.

## Barangay jurisdiction and official review

The canonical Dagupan list and manual confirmation remain enforced. The audit found government polygon sources, including [PHIVOLCS boundary metadata](https://gisweb.phivolcs.dost.gov.ph/arcgis/rest/services/PHIVOLCS/Boundary_safe_ohas/MapServer/0), which describes indicative boundaries observed in June 2016, with PSA/NAMRIA attribution; another [GeoRisk layer](https://ulap-nga.georisk.gov.ph/arcgis/rest/services/PSA/BarangayPopMF/MapServer/0) has limited descriptive/license information. Current Dagupan coverage, authoritative fitness for jurisdiction decisions, and sufficient redistribution/use terms were not established. No polygons were downloaded or invented, and no pin is claimed geographically verified. A vetted licensed boundary integration remains future work.

Authorized officials see the reported incident pin, selection source, GPS summary/result, discrepancy warning, explanation, unavailable/inconclusive reason, confirmation time, and unverified geographic jurisdiction. Neutral wording includes No significant discrepancy detected, Location differs from current GPS, Comparison unavailable, and Location requires verification. The map link now says reported pin instead of verified coordinates. Existing validation, reasoned rejection, duplicate decisions, City clarification, routing, priority, and final closure remain human actions under their existing roles.

## Repeat-abuse foundation

The new dedicated review API and official form distinguish an explicitly reviewed fabrication finding from an ordinary rejection. A fabrication finding requires an already rejected incident, a 20-2000 character reason, an evidence/decision reference (1-500 characters), actor, time, and expected revision. UI requires review confirmation. References document the basis; they are not automatically authenticated evidence or proof of intent.

Barangay Officials are limited by the same canonical jurisdiction scope; City Engineers retain existing city scope. Citizens, Utility Providers, Repair Personnel, and Admin are denied these new review endpoints. No unrestricted account-management permissions are granted. A repeat count includes only active `confirmed_fabrication` findings for that incident's reporter in the caller's scope. It is explicitly visible to authorized reviewers and is neither a hidden account score nor a punishment trigger. There is no retrospective interpretation of historical rejection/duplicate data.

Corrections append an actor/time/reason/reference record and set the current finding to `corrected`, excluding it from active counts. An atomic version check prevents overwriting concurrent reviews. Earlier entries stay in the incident's dedicated audit history even if general audit logging is unavailable. Review decisions do not mutate incident lifecycle state, reporter accounts, or regular citizen history. Evidence references and reasons are sensitive official review data; they are omitted from ordinary incident serializers.

## Verification

| Check | Pass | Fail | Skip | Notes |
| --- | ---: | ---: | ---: | --- |
| Backend Jest suite | 236 | 0 | 32 | 38 suites pass; opt-in account/database integration suite skipped without isolated MongoDB URI |
| Flutter tests | 37 | 0 | 0 | Controlled GPS fixtures and injected policy/submission services; no live device claims |
| Browser Playwright | 9 | 0 | 0 | Existing account/shared screens plus neutral location labels, finding/correction history, and unauthorized interface access; local API fixtures |
| AI privacy handler tests | 5 | 0 | 0 | unittest handler/config tests; no models or live inference |
| AI category/config checks | 4 | 0 | 0 | Existing test functions executed through unittest FunctionTestCase because pytest is unavailable |

Backend ESLint, web ESLint, TypeScript no-emit check, Next production build, Android debug APK build, and Flutter web build were run. Flutter analysis has no errors/warnings and retains 14 pre-existing informational findings in untouched files; use `--no-fatal-infos` for a successful exit. Existing Android Gradle/AGP/Kotlin deprecation warnings remain outside this scope. `git diff --check` passed.

The new tests cover: delayed/home reporting and earlier evidence; accurate matching GPS; displaced pins; accuracy uncertainty; missing/denied, stale, inaccurate, and future fixes; manual confirmation; required discrepancy explanation/Other; recomputation and tampered client fields; canonical barangay enforcement; existing official scopes; restricted metadata projections and audit redaction; reviewed finding documentation; correction/history; and no implicit abuse finding for submission, duplication, or rejection alone. Existing role, evidence, workflow, SLA, notification, repair reassignment, and closure tests provide regression coverage for Revisions 1-7.

During implementation the first new widget fixture assumed a desktop XFile filename, and browser fixtures lacked an email and matched transient streaming markup outside main. Those fixture assumptions were corrected. An invalid const accessibility widget constructor was also corrected and verification rerun. Final results above describe the final tree, not the intermediate failures.

## Unverified integrations and remaining limitations

Live GPS permissions/accuracy, native Google Maps interaction, platform reverse geocoding, live backend evidence uploads, production MongoDB concurrency, public deployment, and a complete real-device six-role walkthrough were not verified. Database integration tests need an isolated `ACCOUNT_TEST_MONGODB_URI`; no production data was used. AI checks do not establish live inference accuracy. iOS builds were not available on this Windows host.

Client-supplied GPS can be fabricated or omitted; this is consistency guidance, not attestation or intent detection. Polygon containment remains unverified. Review findings depend on human evidence assessment; their references are not programmatically verified. No automatic sanctions or privacy masking are added. Historical records cannot support trustworthy retroactive fabrication counts. Review history is append-only through this API, not cryptographically immutable against direct database administrators.

## Exact files changed and final status

Inventory and final Git status are recorded below. All changes remain unstaged and uncommitted on `feature/report-location-integrity`; no merge or push occurred.

34 files: 22 modified tracked files and 12 new untracked files. Nothing is staged.

| Status | File |
| --- | --- |
| Modified | [README.md](README.md) |
| Modified | [lunas_backend/.env.example](lunas_backend/.env.example) |
| Modified | [lunas_backend/README.md](lunas_backend/README.md) |
| Modified | [lunas_backend/src/controllers/incidentController.js](lunas_backend/src/controllers/incidentController.js) |
| Modified | [lunas_backend/src/controllers/incidentController.test.js](lunas_backend/src/controllers/incidentController.test.js) |
| Modified | [lunas_backend/src/middleware/parseIncidentPayload.js](lunas_backend/src/middleware/parseIncidentPayload.js) |
| Modified | [lunas_backend/src/middleware/validation.js](lunas_backend/src/middleware/validation.js) |
| Modified | [lunas_backend/src/middleware/validation.test.js](lunas_backend/src/middleware/validation.test.js) |
| Modified | [lunas_backend/src/models/Incident.js](lunas_backend/src/models/Incident.js) |
| Modified | [lunas_backend/src/routes/incidentRoutes.js](lunas_backend/src/routes/incidentRoutes.js) |
| Modified | [lunas_backend/src/services/duplicateDetectionService.js](lunas_backend/src/services/duplicateDetectionService.js) |
| Modified | [lunas_backend/src/utils/auditLogger.js](lunas_backend/src/utils/auditLogger.js) |
| Modified | [lunas_backend/src/utils/auditLogger.test.js](lunas_backend/src/utils/auditLogger.test.js) |
| Modified | [lunas_mobile/README.md](lunas_mobile/README.md) |
| Modified | [lunas_mobile/lib/features/maps/domain/models/selected_location.dart](lunas_mobile/lib/features/maps/domain/models/selected_location.dart) |
| Modified | [lunas_mobile/lib/features/maps/presentation/screens/map_picker_screen.dart](lunas_mobile/lib/features/maps/presentation/screens/map_picker_screen.dart) |
| Modified | [lunas_mobile/lib/features/reporting/data/services/report_service.dart](lunas_mobile/lib/features/reporting/data/services/report_service.dart) |
| Modified | [lunas_mobile/lib/features/reporting/domain/models/citizen_report_draft.dart](lunas_mobile/lib/features/reporting/domain/models/citizen_report_draft.dart) |
| Modified | [lunas_mobile/lib/features/reporting/presentation/screens/report_review_screen.dart](lunas_mobile/lib/features/reporting/presentation/screens/report_review_screen.dart) |
| Modified | [lunas_web/README.md](lunas_web/README.md) |
| Modified | [lunas_web/src/components/validation/validation-review.tsx](lunas_web/src/components/validation/validation-review.tsx) |
| Modified | [lunas_web/src/lib/validation.server.ts](lunas_web/src/lib/validation.server.ts) |
| New | [REVISION_8_LOCATION_INTEGRITY_REPORT.md](REVISION_8_LOCATION_INTEGRITY_REPORT.md) |
| New | [lunas_backend/src/controllers/falseReportReviewController.js](lunas_backend/src/controllers/falseReportReviewController.js) |
| New | [lunas_backend/src/controllers/falseReportReviewController.test.js](lunas_backend/src/controllers/falseReportReviewController.test.js) |
| New | [lunas_backend/src/services/locationIntegrityService.js](lunas_backend/src/services/locationIntegrityService.js) |
| New | [lunas_backend/src/services/locationIntegrityService.test.js](lunas_backend/src/services/locationIntegrityService.test.js) |
| New | [lunas_backend/src/utils/geodesic.js](lunas_backend/src/utils/geodesic.js) |
| New | [lunas_mobile/lib/features/maps/domain/models/location_integrity.dart](lunas_mobile/lib/features/maps/domain/models/location_integrity.dart) |
| New | [lunas_mobile/test/location_integrity_test.dart](lunas_mobile/test/location_integrity_test.dart) |
| New | [lunas_mobile/test/report_location_review_test.dart](lunas_mobile/test/report_location_review_test.dart) |
| New | [lunas_web/src/app/actions/false-report-review.ts](lunas_web/src/app/actions/false-report-review.ts) |
| New | [lunas_web/src/components/validation/false-report-review.tsx](lunas_web/src/components/validation/false-report-review.tsx) |
| New | [lunas_web/tests/location-integrity.spec.ts](lunas_web/tests/location-integrity.spec.ts) |

```text
 M README.md
 M lunas_backend/.env.example
 M lunas_backend/README.md
 M lunas_backend/src/controllers/incidentController.js
 M lunas_backend/src/controllers/incidentController.test.js
 M lunas_backend/src/middleware/parseIncidentPayload.js
 M lunas_backend/src/middleware/validation.js
 M lunas_backend/src/middleware/validation.test.js
 M lunas_backend/src/models/Incident.js
 M lunas_backend/src/routes/incidentRoutes.js
 M lunas_backend/src/services/duplicateDetectionService.js
 M lunas_backend/src/utils/auditLogger.js
 M lunas_backend/src/utils/auditLogger.test.js
 M lunas_mobile/README.md
 M lunas_mobile/lib/features/maps/domain/models/selected_location.dart
 M lunas_mobile/lib/features/maps/presentation/screens/map_picker_screen.dart
 M lunas_mobile/lib/features/reporting/data/services/report_service.dart
 M lunas_mobile/lib/features/reporting/domain/models/citizen_report_draft.dart
 M lunas_mobile/lib/features/reporting/presentation/screens/report_review_screen.dart
 M lunas_web/README.md
 M lunas_web/src/components/validation/validation-review.tsx
 M lunas_web/src/lib/validation.server.ts
?? REVISION_8_LOCATION_INTEGRITY_REPORT.md
?? lunas_backend/src/controllers/falseReportReviewController.js
?? lunas_backend/src/controllers/falseReportReviewController.test.js
?? lunas_backend/src/services/locationIntegrityService.js
?? lunas_backend/src/services/locationIntegrityService.test.js
?? lunas_backend/src/utils/geodesic.js
?? lunas_mobile/lib/features/maps/domain/models/location_integrity.dart
?? lunas_mobile/test/location_integrity_test.dart
?? lunas_mobile/test/report_location_review_test.dart
?? lunas_web/src/app/actions/false-report-review.ts
?? lunas_web/src/components/validation/false-report-review.tsx
?? lunas_web/tests/location-integrity.spec.ts
```
