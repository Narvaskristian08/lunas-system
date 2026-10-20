# Mobile, web and backend QA rerun — 2026-10-20

Local Windows, Docker and Android 16 x64 emulator; Australia/Perth, approximately 21:28–21:46. Starting commit: `7bcc4e2`, branch `KristianRevisions`. Fixes and this report are uncommitted. This run supersedes the earlier report only for the checks described here. It does not certify production readiness or resolve institutional workflow policy.

## Executed results

| Boundary | Check | Actual result |
| --- | --- | --- |
| Backend | Full Jest run with `ACCOUNT_TEST_MONGODB_URI=mongodb://127.0.0.1:27119`, `--runInBand --coverage=false` | **53 suites / 453 tests passed**, zero skipped in the final full run |
| Backend | ESLint over `src/**/*.js` and `scripts/**/*.js` | Passed after final controller fix |
| Web | ESLint, Next production build and its TypeScript check | Passed |
| Web | Full Playwright suite using standalone production server on port 3110 | **28 passed**, including new redirect regression |
| Mobile | `flutter analyze` | No issues found |
| Mobile | `flutter test` | **78 passed** |
| Android | `flutter build apk --debug --target-platform android-x64 --dart-define=LUNAS_API_BASE_URL=http://10.0.2.2:5000/api/v1` | APK compilation passed; live journey used the already running current-source debug app |
| Live clients | Citizen Android → Secretary web → Tanod Android → agency web → final Tanod Android → Secretary web → citizen Android | Synthetic report reached database `closed`; citizen displayed Resolved / Completed, step 5 of 5 |
| Live evidence | Citizen gallery image and initial/final Tanod gallery photos through real multipart/privacy/storage pipeline | Three stored WebP objects; both inspection photos retained `isPrivacyMasked=true`, MIME type, checksum and size |
| Private storage | Signed citizen/inspection image retrieval; unsigned object request | Signed requests returned 200; unsigned request returned 403 |
| Live API scopes | Anonymous, citizen operational access, Tanod repair/review access, agency inspection access, cross-barangay and cross-agency report access | Expected 401/403/404 responses; unauthorized Tanod could not start another barangay's final inspection |
| Live web | Admin accounts/tickets/notifications; Secretary review/personnel/reports/notifications; agency list/reports/notifications | Rendered without `pageerror` after the fix; checked 1280px desktop and 390px phone width, no settled horizontal document overflow |
| CSV | Secretary and agency daily/weekly/monthly exports | Six HTTP 200 CSV responses; expected fixture identifiers present, other-barangay/other-agency sample identifiers absent |
| Services | Backend readiness, web health, internal AI health, Compose status | HTTP 200; MongoDB/backend/web/AI healthy; RustFS running. AI reported `road_damage` and `environmental_hazards` loaded |
| Android runtime log | `flutter:E` / `AndroidRuntime:E` since approximately 21:28 | No entries returned |
| Diff | `git diff --check` | Passed |

The isolated MongoDB container `lunas-qa-mongo-20261020` used loopback port 27119. The integration suite created/dropped its own uniquely named database. The temporary container was stopped and automatically removed afterward. No database backups were created during this QA.

## Live report journey

Retained synthetic report: **LUNAS-202610-000075**, database ID `6ad76dbeeda91a434ee658ce`. This adds one report to the 74 reseeded fixtures; the 68 seeded accounts were retained.

1. Existing citizen Android session loaded current seeded reports. Selected a generated, explicitly labelled synthetic PNG through Android Photo Library, chose Road Damage and entered a synthetic description.
2. Set the emulator GPS test location to Dagupan (`120.3387,16.0433`), centered the map, confirmed the pin and manually selected Poblacion Oeste when reverse geocoding could not identify a canonical barangay. Reviewed location/privacy confirmations and submitted from mobile.
3. Backend returned the report reference. Nearby duplicate suggestions remained advisory; the report was not automatically rejected or merged. Citizen evidence recorded privacy processing as applied before storage.
4. Secretary signed in through the real web BFF, viewed the citizen evidence/location, selected the same-barangay Tanod and confirmed assignment. Citizen dashboard displayed Tanod Assigned.
5. Tanod signed in on Android, opened the assigned initial inspection, entered findings, selected the synthetic gallery photo and confirmed submission. The item left the initial-action queue.
6. Secretary browser displayed the mobile findings and Tanod photo. Signed photo retrieval returned 200. Secretary approved verification; the report routed to the configured City Engineering agency.
7. Agency browser selected a synthetic High priority, recorded Pending Procurement/Bidding, supplied a test deadline, moved to Work in Progress and then Work Completed. Reloads verified persisted status changes. These updates describe a test scenario, not real bidding or maintenance.
8. Secretary assigned final verification through web. Tanod Android displayed the final task, submitted final findings and another gallery photo, and the final-action queue cleared.
9. Secretary browser displayed final findings/photo, retrieved the photo and confirmed Finalize and Complete. Database showed both inspections approved and the incident closed, with 12 timeline events and nine incident notifications.
10. Citizen signed back in on Android and saw Resolved / Completed, step 5 of 5. The report timeline rendered the initial inspection, agency progress, final inspection and resolution events. This verifies the current implemented path, not official closure authority or ownership-aware routing correctness.

## Defects fixed and test maintenance

**Inspection review ignored the incident URL.** `lunas_backend/src/controllers/tanodWorkflowController.js` looked up only `inspectionId`, so the assigned Secretary could approve a submitted inspection through an unrelated incident URL. A real-MongoDB regression first reproduced HTTP 200 where 404 was expected. Review now matches both inspection and incident IDs. `authorizedAccounts.integration.test.js` checks the wrong URL is rejected without changing the inspection before the correct approval succeeds. Final full backend run passed; rebuilt/restarted the Docker backend and confirmed the deployed wrong-URL request returns 404.

**Legacy Secretary exceptions URL failed during browser redirect.** Live `/validation-routing/exceptions` could display “This page couldn’t load” with React error 310. Its render-time redirect also dropped period query parameters. `lunas_web/next.config.ts` now applies a temporary HTTP redirect before page rendering. `tests/workspace-navigation.spec.ts` checks the canonical Reports destination, retained `period=weekly` and no browser error. Full suite passed with 28 tests; rebuilt/restarted Docker web and repeated real Secretary navigation successfully.

**Directory test expected only activated accounts.** The Secretary personnel directory intentionally includes pending invitations so their status can be managed. The integration test expected one active record while its own setup created another pending record. Updated the assertion to verify both records and their distinct statuses, retaining same-barangay and provider-denial assertions. No production directory behavior or access scope was relaxed.

## Remaining findings and unverified boundaries

- **Dependency findings remain:** backend production graph has 10 findings (2 critical, 1 high, 7 moderate); web has 6 (1 critical, 4 high, 1 moderate). Counts came from fresh `npm audit --omit=dev --json` runs. These are scanner results, not exploit demonstrations. Compatible dependency remediation remains a release priority; no forced upgrades were applied.
- **External delivery is not configured:** live registration OTP, activation/recovery email and push receipt delivery were not verified. Backend isolated tests mock delivery. In-app notification persistence passed; it does not prove external delivery.
- **Device/browser boundary:** Android 16 x64 emulator and Chromium only. No iOS, physical phone, Safari/Firefox, production TLS, app-store build/signing, load/soak or complete accessibility audit. Gallery selection and GPS confirmation passed; physical camera capture and live permission-denial/offline recovery journeys were not exercised.
- **AI/privacy accuracy:** synthetic image processing and protected storage succeeded. This is not a real-world face/plate recall test or hazard-model accuracy evaluation. Inspection schema stores the masking flag/checksum but does not retain the citizen image's full privacy-processing metadata.
- **Other workflow branches:** the live client journey used approval and completion. Rejection, clarification, duplicate, correction, stale actions and token revocation retain automated test coverage where present; they were not all repeated client-to-client. Active-reviewer false-report correction UI remains unverified. `/admin/appeals` intentionally calls `notFound()` and was observed as unavailable, not counted as a working appeals screen.
- **Export boundary:** verified scoped CSV, not PDF. Current exporters request at most 100 records without following pagination; larger exports were not tested. No spreadsheet-client formula interpretation audit was performed.
- **Policy boundaries remain:** current category mapping, required UI procurement progression, priority/deadline handling, SLA behavior and Secretary closure are implemented behaviors, not institutional policy approvals. Jurisdiction/asset ownership correctness and real external procurement are not established by this QA.
- Flutter still warns about future Gradle/AGP/Kotlin support; these warnings did not prevent the debug build.

## Reproduction and local evidence

Backend: start disposable MongoDB 6 on `127.0.0.1:27119`, set `ACCOUNT_TEST_MONGODB_URI=mongodb://127.0.0.1:27119`, then from `lunas_backend/` run `node node_modules/jest/bin/jest.js --runInBand --coverage=false` and `node node_modules/eslint/bin/eslint.js "src/**/*.js" "scripts/**/*.js"`. Never point this integration suite at application data.

Web: from `lunas_web/` run `node node_modules/eslint/bin/eslint.js .`, `node node_modules/next/dist/bin/next build`, `node scripts/prepare-standalone.mjs`, then set `PLAYWRIGHT_PORT=3110` and run `node scripts/run-playwright.mjs`. Playwright Chromium was installed for this run. These automated browser tests use API fixtures; the separate live journey above used Docker on port 3000/5000.

Mobile: from `lunas_mobile/` run `flutter analyze`, `flutter test` and the debug APK build command in the results table. Android UI checks used `adb`/UIAutomator, with local storage reachable through `adb reverse tcp:9000 tcp:9000`. Windows emulator-window access was unavailable through the Computer Use tool; Android's own interface provided the live checks.

Local evidence in `%TEMP%`: `lunas-backend-qa-rerun-final.log`, `lunas-web-qa-rerun-final.log`, `lunas-backend-audit-rerun.json`, `lunas-web-audit-rerun.json`, `lunas-mobile-qa-completed.png`, and the temporary live API/web/export/progress scripts (`lunas-live-*-qa.cjs`) plus `lunas-mobile-ui-qa.py`. These are local diagnostics, not database backups, and may be removed by OS cleanup. The retained report and automated regressions provide persistent evidence independently.

Next priorities: remediate dependency findings, configure sandbox email/push and test delivery, exercise live rejection/clarification/correction and outage recovery, broaden physical-device/browser coverage, and resolve the documented routing/SLA/closure policy questions.
