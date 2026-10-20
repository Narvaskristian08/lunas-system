# LUNAS implementation audit and developer handoff

## STEP 14 — R2-T13 LEGACY WORKFLOW CLEANUP AND FINAL COMPATIBILITY REVIEW

**R2-T13: COMPLETE as a bounded compatibility review and controlled cleanup. LUNAS remains PARTIALLY IMPLEMENTED and NOT PRODUCTION-READY.** The available local checks were rerun; unresolved authority, privacy, device and deployment requirements remain explicit blocks. This section supersedes older implementation claims, including the historical API catalog; previous reports remain intact below. Roadmap review completion does not certify the entire target lifecycle.

### A. Review identity and exact changes

2026-10-20, Asia/Shanghai; branch `revision`; HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`. The initial tree already contained extensive modified/untracked Steps 1–13 work, including the active mobile role-policy tests. Initial `git status --short`, branch and commit were inspected before editing. Prior source hashes in `qa_outputs/system_verification_20261020/verification_manifest.json` distinguish this step's changes from that baseline. All earlier work was preserved. No commit/push, production connection, seed, account conversion, data migration, external notification or shared SDK permission change occurred.

Exact Step 14 paths (20):

- `README.md`
- `lunas_backend/API_ENDPOINTS.md`
- `lunas_backend/scripts/migrate-tanod-workflow.js`
- `lunas_backend/scripts/migrate-tanod-workflow.test.js`
- `lunas_backend/src/controllers/tanodWorkflowController.js`
- `lunas_backend/src/controllers/agencySlaIntegrity.test.js`
- `lunas_mobile/lib/features/auth/domain/auth_role_policy.dart`
- `lunas_mobile/lib/features/repair/data/services/repair_service.dart`
- `lunas_mobile/lib/features/repair/presentation/screens/tanod_inspections_screen.dart`
- `lunas_mobile/tool/verify_citizen_tracking.dart`
- `lunas_mobile/tool/verify_field_role_routes.dart`
- `lunas_mobile/tool/verify_inspection_workflow.dart`
- `lunas_mobile/tool/verify_repair_handoff.dart`
- `lunas_web/src/components/validation/validation-review.tsx`
- `lunas_web/src/components/work-orders/work-order-detail.tsx`
- `lunas_web/tests/secretary-verification.spec.ts`
- `lunas_web/tests/repair-staffing.spec.ts`
- `qa_outputs/legacy_compatibility_20261020/route_inventory.md`
- `qa_outputs/legacy_compatibility_20261020/route_inventory.json`
- `qa_outputs/legacy_compatibility_20261020/verification_manifest.json`

### B. Architecture and target workflow

Mobile roles remain Citizen (`citizen`), Barangay Tanod (`barangay_tanod`) and Repair Personnel (`repair_personnel`). Web roles remain Secretary (`barangay_official`), organization-scoped Agency Officer (`utility_provider`, including authorized City Engineering organizations) and governance Administrator (`admin`). `city_engineer` remains a historical enum/display value and cannot authenticate. Agency names do not create additional RBAC roles. Existing repair accounts were neither converted nor granted Tanod access.

Target: citizen submission → barangay intake → assigned Tanod acknowledgment/physical verification/findings → independent Secretary approval, rejection or clarification → approved ownership/category/jurisdiction routing → agency acknowledgment/assessment → conditional manual external processing → approved work authorization → maintenance order → worker acceptance/decline/progress → completion verification/review → authorized closure → citizen transparency/reporting. Implementation stops at the documented policy gates; this sequence is not an assertion of an executable report-to-closure demonstration.

### C. Registered routes and consumers

The [complete seven-column route table](qa_outputs/legacy_compatibility_20261020/route_inventory.md) inventories **128 explicit method/path registrations**: 126 API routes mounted by `src/routes/index.js` and two server health GETs. The [JSON inventory](qa_outputs/legacy_compatibility_20261020/route_inventory.json) retains registration text, middleware, role constants, scopes, lifecycle preconditions, reachability and candidate web/mobile/test/document references. Default prefix is `/api/v1`; deployment may configure `API_VERSION`. Express implicit HEAD/OPTIONS and wildcard 404 are excluded from counts.

| Classification | Count | Decision |
|---|---:|---|
| ACTIVE — REQUIRED | 103 | Keep current functionality and guards, including dynamic CSV/PDF format calls |
| ACTIVE — COMPATIBILITY | 7 | Keep self-profile, account/archive, device-removal and role-dependent personnel aliases |
| LEGACY — PROTECTED | 10 | Keep explicit denials or narrowly scoped historical maintenance behavior |
| LEGACY — DEPRECATION CANDIDATE | 6 | Retain retired-role functions/routes; current authentication denies access |
| OBSOLETE — VERIFIED UNUSED | 0 | No API removal justified |
| UNKNOWN — NEEDS REVIEW | 2 | Retain deadline queue aliases; external usage unestablished |

Route counts are registrations, not enabled workflows. Reference matches can be unused server actions or historical tests/docs. Dynamic consumers were reviewed separately (for example `/operational-reports/${format}`). Searches covered backend, web, Flutter, tests, scripts/configuration and repository documentation; no connected external client inventory was available. No absent match was treated as proof of safe public API deletion.

### D. Legacy decisions and evidence

| Original purpose / current usage | Security and final decision | Compatibility / evidence |
|---|---|---|
| Old Secretary validate, priority and manual route; retained web action definitions/old documents | KEEP protected 409; never substitute automatic approval or mapping | `incidentController.js`, `inspectionIntegrity.test.js`; misleading legacy forms now unavailable |
| City confirm/clarification/jurisdiction and three city-only statistics routes | DEFER removal; `canSignIn` rejects retired role and generic incident scope also denies it | Retained handlers, action definitions, tests and historical names; no reactivation |
| Both new-order POST forms and old final-review/incident-complete | KEEP explicit 409 | Old callers receive controlled failure; no new order, closure or retrospective authorization |
| Legacy agency-status labels | KEEP scoped historical compatibility; add explicit protocol-9 denial before status/SLA writes | Missing incident preparation metadata could otherwise admit a protocol-9 order; new `agencySlaIntegrity.test.js` case checks unchanged status/clocks |
| Historical provider review/correction and repair handoff | KEEP correction, staffing, assignment and progress compatibility; acceptance cannot close | `workOrderHandoff.test.js`, reassignment/lifecycle suites and native persistence; provider closure button disabled |
| `/users/repair-personnel`, generic account update and DELETE archive aliases | KEEP verified adapters; Secretary read returns Tanods, agency read returns own repairs; archive never physically deletes | Route/controller policies and native account tests; preserve original account/reference identities |
| Old Tanod migration npm/module entry | DEPRECATE WITH GUARDED RESPONSE before dotenv/model/database access | It previously supplied its own demo opt-in, rewrote repair organization/barangay fields and advanced incidents; no approved mapping/rollback. Two new CLI/module tests pass |
| Deadline queue aliases | UNKNOWN; retain scoped adapters to `getWorkOrders` | No concrete current consumer found outside registration/implementation; obtain external usage evidence first |

The migration command/module name stays available to fail clearly. No replacement migration was executed. A future proposal requires data inventory, explicit per-account/incident mapping, dry run, backup, compatibility validation, authorized approval and tested rollback; it must not bulk-convert Repair Personnel into Tanods. Reverting cleanup code alone does not authorize executing the retired script.

### E. Exact cleanup and compatibility corrections

Retired the unsafe migration implementation behind an immediate error (`LEGACY_MIGRATION_RETIRED`), retaining its command/export contract. Added the explicit legacy agency-status protocol-9 guard. Disabled obsolete web validation/manual-routing/final-completion controls; historical routing now explains reconciliation/policy status, completion findings remain visible, and provider correction remains available while its closure button is disabled. Three browser regressions cover these views. Historical API documentation now points to this current inventory rather than implying its old transitions remain authorized.

These are restrictions and deprecation, **not API endpoint removal**. No database field, account, evidence, status enum, historical inspection or operational record was deleted. Unused action definitions and inactive JSX branches remain for separately reviewed removal; they do not supply authority. Flutter edits address the 17 identified findings only.

### F. Backend/web/mobile/AI contracts

Web Secretary actions use current task identifiers, expected versions, category confirmation and clarification recipients; agency preparation uses versioned operations; repair handoff uses work-order version and reason. HTTP conflict/error handling does not report success. Source review found and corrected legacy controls advertising operations the backend denies. Retained server-action functions are still permission checked and cannot override API denials. Retired City Engineer final-review UI remains unreachable under current web permissions/authentication.

Flutter retains distinct role homes/routes, current task acknowledgment/start/submit, findings outcomes, worker accept/decline/start/progress, citizen ownership tracking, scoped evidence display, safe notification resource navigation and logout behavior. Package imports in CLI contracts now require the generated package configuration. API serializers/models and all widget tests remain compatible. AI remains advisory; no model or classification threshold changed.

### G. Historical preservation

Existing `repairOrganization`, agency names, repair assignments, inspection types/pointers, original category, correction/routing/assessment histories, repair photos, notifications and audit attribution remain. Current assignments and reverse incident/order links determine live access; having an old notification or old assignment does not restore it. Historical unconfirmed jurisdiction fallback remains barangay scoped. Existing repair work can continue through guarded compatibility without fabricating authorization records. No account/data migration or evidence cleanup was run.

### H. Security and lifecycle invariants

`protect` requires an active, unarchived, activated account and current access-token version; retired roles and suspended accounts remain denied. Citizens access their own records; Tanods require current assigned inspections and barangay; Repair Personnel require current work/organization/assignment; Secretary review is canonical-barangay scoped; agencies require exact organization; Admin governance does not confer operational authority. Initial and completion inspections remain distinct. Initial approval requires current submitted verified findings, expected version and explicit category confirmation. Stale/replaced tasks, invalid outcomes and conflicting claims cannot authorize routing.

Routing requires verified ownership plus one active approved participating rule/account; missing/conflicting configuration stays in review, preserving provenance/history. Manual disputes/transfers remain blocked. Receipt, assessment and bidding completion do not authorize work; new orders, protocol-9 activation and final closure remain denied. Legacy status updates now explicitly deny protocol-9 even without preparation metadata. Priority/start/deadline amendment is not enabled. Original SLA starts/deadlines, breach/reminder history and progress survive valid historical handoff; monitors require a valid started clock. Durable incident claims intentionally remain after partial failures and need reconciliation rather than automatic takeover.

New remote image URLs/forged keys cannot bypass managed processing. Signing is authorized and capped at 300 seconds; privacy approval remains required for new managed uploads. Legacy bearer URLs/private-object policy remain integration risks. Notifications recheck current resource access at read/delivery, bound retries and distinguish provider acceptance from device delivery; interrupted sends still need reconciliation. Reporting keeps role scope, Manila periods, stable pagination, bounded exports, CSV formula protection and genuine PDF bytes; export audience allowlists remain empty by default. No storage, push, TLS or recovery guarantee is inferred from unit tests.

### I. Flutter analysis: 17 findings resolved

The Step 13 analyzer exited 1 because informational lints fail its default acceptance criteria. All 17 were application/tool files, not generated code or deprecated Flutter APIs: ten missing control-flow braces, one unnecessary spread `toList`, four CLI `print` calls and two relative imports into `lib`. Added braces, removed the redundant conversion, used `stdout.writeln` for CLI results and package imports. No analyzer configuration/global suppression changed. Full `flutter analyze --no-pub` now exits **0: No issues found**, with zero errors, warnings or infos. Full Flutter tests pass **79/79**; four Dart contracts pass **53 checks**. Physical device behavior remains unverified.

### J. Newly executed verification

Commands below use refreshed prepared copies under `.local-backups/environment-baseline-20261020`; see U for environment setup. Counts are Step 14 executions, not copied Step 13 results.

| Check / command | Actual result | Limit |
|---|---|---|
| Backend `npm.cmd run lint` | PASS, exit 0 | Static check |
| Backend `npm.cmd test -- --runInBand` | **794 pass, 0 fail, 52 skip**; 72 suites pass / 2 opt-in suites skip | Default suite deliberately omits native DB opt-ins |
| Root isolated runner `node .local-backups/environment-baseline-20261020/lunas_backend/scripts/run-isolated-integration.js --all` | **846 pass, 0 fail, 0 skip**, 74 suites, 40.222 s | Owned MongoDB 7.0.24, one-member replica set; all 52 opt-ins execute |
| Web `npm.cmd run lint`; `npx.cmd --no-install tsc --noEmit`; `npm.cmd run build` | All PASS, exit 0 | Prepared Next 16.2.1 source/build |
| Standalone preparation + eight configured Playwright files | Final rerun **23 pass, 0 fail**, 24.7 s | 22 fixture cases + 1 native API/MongoDB case; initial run 22 pass / 1 intermittent fixture pagination failure retained |
| Flutter `flutter analyze --no-pub` | PASS, exit 0, no findings | Writable copied Flutter 3.47.2 / Dart 3.13.2 SDK |
| Full Flutter `flutter test --no-pub` | **79 pass**, exit 0 | Widget/contract tests, not physical device |
| Four `dart --packages=.dart_tool/package_config.json tool/verify_*.dart` commands | **12 + 9 + 23 + 9 = 53 checks**, all exit 0 | Pure Dart contracts, not native navigation proof |
| AI `python -m unittest test_privacy_scope` | **5 pass**, exit 0 | Existing privacy scope checks |
| AI `python -m pytest -q test_category_models.py test_surface_drainage.py test_electrical_damage.py` | **15 pass**, exit 0 | Existing category contracts |
| `python lunas_ai/tool/verify_local_integration.py` | Health/invalid image/backend HTTP inference/unavailable fallback PASS, exit 0 | Real loopback Flask + backend adapter, existing road checkpoint, synthetic image |
| `git diff --check` | PASS | Whole current uncommitted tree |

Initial MongoDB startup aborted with WiredTiger error 28 (disk full); the concurrent web build hit ENOSPC and one Flutter launch failed. Recovered 787,959,808 bytes by deleting only three reproducible `.pdb` debug-symbol copies inside the ignored writable SDK; the original SDK and source/data were untouched. Subsequent checks above passed. A retry without the analytics suppression variable hit an external telemetry-log permission error; the final correctly configured full test run passed. Keep these diagnostic attempts separate from final results.

### K. Native database evidence

The full native rerun covers declared unique indexes, persistence, competing assignments/activation/delivery claims, real JWT/role scopes, current inspection/version rejection, routed agency assessment, historical repair handoff preserving progress/clocks, no-start SLA monitoring/deduplication, durable held claims after controlled partial write failure, actual replica-set transaction rollback and 237-row reporting across three pages. Loopback Nodemailer SMTP capture sends one synthetic message to an owned local socket. CSV/PDF native assertions use test-only export grants; default deployment audiences stay denied.

The native browser uses actual JWT/API/Mongoose/MongoDB reporting and denies default export and foreign barangay. Test-only fixtures are synthetic. No production database, deployed index/credential audit, multi-node failover, physical backup restore, representative load or production SMTP was tested. The test runner ignores caller-supplied DB URIs. Its historical `.local-backups/step13-integration/full-results.json` output is now the Step 14 run; the tracked Step 13 manifest preserves the older counts.

### L. Fixture/browser/widget/device distinction

Final browser run: **22 fixture-backed** cases exercise real built web pages/actions with controlled responses; **one native integration** uses the actual API/database. Three new fixture cases prove old routing/closure controls are unavailable while history/correction remains. First full run had one pagination transition remain at page 1; an unchanged full rerun passed 23/23. Root cause was not established, so retain an intermittent test/runtime-navigation risk rather than claim it was fixed. Flutter's 79 tests and 53 contracts do not establish camera permissions, GPS, Android/iOS release builds, native push callbacks or physical device receipt. No complete citizen-to-closure E2E exists while policy gates remain.

### M. AI evidence and limitations

Existing privacy/category checks and real backend-to-Flask HTTP inference pass. The smoke uses one synthetic gray 320×320 image with the existing road checkpoint; manual review remains required both for completed inference and unavailable-service fallback. Harness elapsed time 6.189 s is a smoke-run duration, not endpoint throughput or an accuracy metric. No retraining, new weights, model substitution, dataset evaluation or accuracy claim. Step 13's Ultralytics `opencv-python` metadata versus working headless-provider dependency issue remains open; no competing OpenCV provider was installed.

### N. Retained/unknown deprecation register

Keep all public endpoint aliases until historical/external callers are inventoried. In particular, `/work-orders/approaching-deadline` and `/work-orders/overdue` are UNKNOWN and retained as scoped list adapters. Six retired-role routes remain deprecation candidates; coordinate a versioned retirement contract before deleting them. Ten protected legacy routes include seven unconditional workflow denials and three historical agency/provider compatibility handlers. Old action functions/inactive UI branches, historical schema enums, display names, bearer evidence URLs and old documentation remain discoverable; none is proof of current authority. API catalog warning and this inventory establish precedence. Deadline-only statistics in historical dashboard aggregates also merit definition reconciliation with the current started-clock operational report; scheduler safety does not certify every historical metric.

Unregistered `userController.getUsers/getUser` and its `deleteUser` export alias were also reviewed; the mounted routes use approval-aware governance controllers and archive behavior instead. These exports remain retained candidates, not claimed removed endpoints. No active hardcoded category-to-agency decision map was found in the reviewed routing path: current decisions use `agencyRoutingService` rules, while historical organization strings stay readable. Administrator false-report finding oversight/correction remains an explicit governance exception; it does not grant incident workflow or operational export authority.

### O. Final 35-capability implementation matrix

Paths below are relative to `lunas_backend/src` unless prefixed. Test shorthand: **B** = all 846 native backend checks; **W** = 23 browser checks (22 fixtures/1 native); **F** = 79 Flutter + 53 Dart checks; **A** = 5 unittest + 15 pytest + real loopback AI smoke. A group label indicates the relevant tests ran, not that every possible scenario is covered. Native means an isolated owned service, never production.

| # / capability | Current status | Implementation | Verification / environment | Limitation / policy dependency / next action |
|---|---|---|---|---|
| 1 Citizen registration/login | VERIFIED WITH REAL ISOLATED SERVICE | `controllers/authController.js`, auth routes, `utils/accountPolicy.js` | B native accounts/token lifecycle; F role login | Real email/CAPTCHA ingress and deployment remain unverified |
| 2 Incident submission | PARTIALLY IMPLEMENTED | `controllers/incidentController.js`, `services/incidentCreation.js`, mobile reporting | B creation/evidence/location contracts; F | New managed evidence requires approved privacy policy and private storage integration |
| 3 Barangay intake | VERIFIED WITH REAL ISOLATED SERVICE | `getPendingValidation`, `services/jurisdictionService.js` | B native query/ownership; W | Institutional intake operation/training not certified |
| 4 Tanod assignment | VERIFIED WITH REAL ISOLATED SERVICE | `controllers/tanodWorkflowController.js`, inspection claim | B competing assignment/current references; W Secretary | Real roster provisioning/physical operation remains |
| 5 Tanod acknowledgment | VERIFIED WITH REAL ISOLATED SERVICE | `acknowledgeInspection` | B native persistence + role contracts; F | Native device/offline receipt not tested |
| 6 Findings/evidence | PARTIALLY IMPLEMENTED | `submitInspection`, `services/evidenceService.js`, mobile repair service | B native no-file findings + evidence mocks; F | Physical photo/private bucket/privacy approval required |
| 7 Independent Secretary decision | VERIFIED WITH REAL ISOLATED SERVICE | `reviewInspection`, `services/agencyRoutingService.js` | B native current/stale review; W | Does not authorize maintenance/closure |
| 8 Clarification/category correction | VERIFIED LOCALLY | `correctCategory`, `respondToClarification`, immutable follow-ups | B version/history/scope; W/F contracts | Wider device/integration paths unverified |
| 9 Automated routing | PARTIALLY IMPLEMENTED | `models/AgencyRoutingRule.js`, routing service | B native synthetic rule/provenance; W | Official ownership/jurisdiction/participation mappings pending |
| 10 Routing exceptions | PARTIALLY IMPLEMENTED | `listAgencyExceptions`, web exceptions | B scoped projections; W | Queue exists; resolution authority pending |
| 11 Agency transfer | BLOCKED BY POLICY | Existing provenance/transfer denial | B conflict/no silent transfer | Approve dispute/transfer authority and reconciliation procedure |
| 12 Agency acknowledgment | VERIFIED WITH REAL ISOLATED SERVICE | `updateAgencyPreparation`, preparation service/schema | B native persistence; W versioned receipt | Official partner onboarding still required |
| 13 Agency assessment | VERIFIED WITH REAL ISOLATED SERVICE | `services/agencyPreparationService.js` | B native assessment/concurrency; W | Assessment does not permit work |
| 14 External processing tracking | VERIFIED LOCALLY | Versioned manual milestone/history operations | B routine/external/dispute contracts; W | No procurement-system integration or automatic authorization |
| 15 Work authorization | BLOCKED BY POLICY | Preparation authorize/ready refusals | B policy denial | Approve authority/evidence/signoff requirements first |
| 16 New maintenance orders | BLOCKED BY POLICY | `createWorkOrder` 409; protocol-9 guards | B both POST aliases and legacy-status/worker denials | No workaround via intake/acceptance/status labels |
| 17 Repair staffing | VERIFIED WITH REAL ISOLATED SERVICE | `authorizedAccountController`, user routes | B native activation/governance; W | Live institutional roster/activation delivery unverified |
| 18 Worker accept/decline | VERIFIED WITH REAL ISOLATED SERVICE | `workOrderController`, current assignment CAS | B native historical replacement acceptance; F | Historical compatibility only; no new authorization |
| 19 In-progress handoff | VERIFIED WITH REAL ISOLATED SERVICE | `reassignWorkOrder`, reverse incident preflight | B native progress/date preservation; W/F | Cross-document preflight/recovery remains a technical risk |
| 20 Repair progress/evidence | PARTIALLY IMPLEMENTED | `updateProgress`, `uploadRepairEvidence`, mobile details | B scoped contracts; F | Private physical uploads/device operation unverified |
| 21 Completion review | PARTIALLY IMPLEMENTED | Completion inspections/provider correction | B type/current-cycle/history guards; W/F | Final acceptance authority unresolved; correction remains available |
| 22 Official closure | BLOCKED BY POLICY | `completeIncident`, `finalReviewWorkOrder` denial | B no mutation/stale closure; W disabled controls | Approved final authority/prerequisites required |
| 23 SLA integrity/monitoring | PARTIALLY IMPLEMENTED | `services/slaService.js`, work-order clocks | B native dates/no-start/dedup; W | Start/amendment/pause authority and deployed scheduler/recovery pending |
| 24 Citizen tracking | VERIFIED WITH REAL ISOLATED SERVICE | `services/citizenTrackingService.js`, mobile incident model | B native ownership/safe projection; F | Device usage and live partner updates unverified |
| 25 In-app notifications | VERIFIED WITH REAL ISOLATED SERVICE | Notification/access/delivery services | B real claims + local SMTP; W/F safe navigation | Transactional producer delivery/reconciliation and real email open |
| 26 Native push | IMPLEMENTED — INTEGRATION UNVERIFIED | Enrollment model/controller; provider transport | B enrollment/transport mocks | SDK callbacks, actual provider/device receipt absent |
| 27 Private evidence | PARTIALLY IMPLEMENTED | Storage/evidence services, authorized serializers | B signing/expiry/key/privacy contracts | No private bucket integration; legacy bearer links and policy pending |
| 28 Operational reports | VERIFIED WITH REAL ISOLATED SERVICE | `services/operationalReportService.js`, web reports | B 237-row native query; W native browser | Production indexes/scale/official definitions need signoff |
| 29 Secure CSV | PARTIALLY IMPLEMENTED | `services/reportExportService.js`, export routes | B native CSV bytes + adversarial formula cases; W fixtures | Export audience pending/default deny; test grants are synthetic |
| 30 PDF export | PARTIALLY IMPLEMENTED | PDFKit export service | B native PDF bytes; W download/multipage | Approved audience and deployed non-Latin font still required |
| 31 RBAC/scopes | VERIFIED WITH REAL ISOLATED SERVICE | Auth/account policy, field/jurisdiction/work scopes | B real JWT/account restrictions; W/F role contracts | Production proxy/TLS/service identity audit absent |
| 32 Audit/reconciliation | PARTIALLY IMPLEMENTED | Audit logger/history and durable mutation claims | B attribution/controlled failure/rollback | Approved recovery tooling, claim/send reconciliation and retention incomplete |
| 33 Flutter/device | PARTIALLY IMPLEMENTED | Existing mobile role workspaces and repaired tool scripts | F + clean full analyzer | Physical camera/GPS/push/platform builds unverified |
| 34 AI assistance | PARTIALLY IMPLEMENTED | Existing `lunas_ai`, backend `aiService.js` | A real advisory road-model smoke | Accuracy/generalization and dependency lock not certified |
| 35 Deployment | PARTIALLY IMPLEMENTED | Compose, Mongo app-user config, proxy/backup scripts | B static configuration tests only | No deployed TLS/restore/failover/private storage/device/operational acceptance |

No capability is marked fully report-to-closure VERIFIED END-TO-END. The retired migration is DEPRECATED SAFELY; retained unknown APIs remain available under their existing scopes.

### P. Institutional blockers

Approve agency participation and verified asset ownership/jurisdiction; dispute/transfer authority; work authorization; priority/SLA start, pause and amendment; final repair acceptance/closure; evidence privacy/redaction/retention; CSV/PDF audiences; and audit/notification retention/recovery responsibility. Test fixtures, agency names and UI cleanup do not establish any of these decisions. Existing denials remain intentional.

### Q. Technical blockers

Owned private storage/signing/expiry integration; native push enrollment/callback/device receipt; physical mobile/camera/GPS/release builds; actual mail/CAPTCHA delivery; deployment TLS/proxy/least-privilege/index verification; representative load; multi-node failover and physical backup restore; cross-document reconciliation/transaction recovery; ambiguous delivery recovery; Unicode PDF font; AI dependency metadata/lock; and externally used legacy client discovery remain open. The first browser run also exposes an unresolved intermittent pagination test/runtime issue. Local disk space was exhausted and remains constrained; provision working space before larger validation. Flutter's 17 analyzer infos are resolved and no longer an open blocker.

### R. Separate readiness verdicts

| Dimension | Verdict |
|---|---|
| Source compatibility / controlled cleanup | COMPLETE for this review; no API deletion; bounded fixes tested |
| Local automated regression | PASS at final tested boundaries; initial intermittent browser failure retained |
| Native service integration | PARTIAL: disposable MongoDB/API/SMTP/AI pass; private storage/push/device/recovery absent |
| Synthetic demonstration | Available for verified intake/inspection/approval/preparation, historical repair handoff and reports; policy blocks must be shown honestly |
| Full target workflow | PARTIAL / BLOCKED BY POLICY; no newly authorized maintenance-to-closure demonstration |
| Institutional readiness | BLOCKED: no fabricated jurisdiction, authorization, SLA, privacy or closure decision |
| Production deployment | NOT READY; no production operation was attempted |

### S. Prioritized remaining work

| ID | Priority | Requirement | Blocker | Required Decision/Action | Verification Needed |
|---|---|---|---|---|---|
| R14-01 | P0 before real evidence | Privacy/private evidence | Policy + service | Approve processing/access/retention; provide owned private bucket | Scoped upload/read, rejection, signing/expiry, cleanup, former-worker revocation |
| R14-02 | P0 before maintenance | Work authorization/closure | Institutional | Approve separate work and final closure authority/prerequisites | New full lifecycle and negative direct-API tests; no protocol-9 bypass |
| R14-03 | P1 | Routing/transfer | Institutional data/authority | Approve participation, ownership/jurisdiction rules and dispute authority | Unique matches, conflicts, transfers preserving provenance |
| R14-04 | P1 | SLA governance | Institutional | Approve start/amendment/pause and corrective-work policies | Native dates/breach preservation; deployed scheduler boundary tests |
| R14-05 | P1 | Durable recovery | Technical + operational approval | Define claim/send reconciliation, transactions/outbox and accountable recovery | Crash/fault races, no duplicate authority/delivery, safe replay/rollback |
| R14-06 | P1 | Deployment/recovery | No representative environment | Provide isolated stack, space, backup tooling/private bucket and least-privilege identity | TLS/proxy/index checks, physical restore, failover/load |
| R14-07 | P1 | Mobile/push/storage | Device/SDK integration absent | Integrate callbacks/enrollment and run physical Android/iOS | Camera/GPS/offline/logout/revocation and actual receipt |
| R14-08 | P1 | Export audiences | Institutional | Approve separate CSV/PDF role audiences and data scope | Default denial + approved grants, Unicode font, representative export performance |
| R14-09 | P2 | Legacy caller retirement | External usage unknown | Inventory old app versions/integrations; version a retirement notice | Deadline aliases/retired-role routes/adapters remain protected until proven safe |
| R14-10 | P2 | AI environment | Dependency metadata + no evaluation | Resolve one-provider OpenCV lock; define representative evaluation | Reproducible clean environment, quality/privacy/accuracy evidence |
| R14-11 | P2 | Browser determinism / historical metrics | One intermittent pagination failure; old dashboard definitions | Reproduce instrumented navigation; reconcile historical aggregate semantics | Repeated controlled runs with traces; no-start/date/terminal metric contracts |

### T. Roadmap achievement versus product completion

Steps 1–14 now have preserved reports and a final source/consumer review, successful feasible local regression, recovered Flutter tooling, actual isolated DB/HTTP evidence, explicit legacy decisions and a remaining-work register. Verified components include scoped intake, Tanod/Secretary separation, agency preparation, historical repair handoff, citizen projections and reporting. Private evidence, devices/push, recovery, deployment and parts of final workflow remain partial; authorization, SLA governance, export audiences and closure remain intentionally blocked. Historical compatibility was retained rather than recreated or erased. This review can be complete while the product and earlier integration task remain partial. A truthful synthetic demonstration must show the blocked boundaries. Production requires both institutional decisions and the technical/service acceptance above.

### U. Reproducible final handoff

Use root AGENTS/this latest section before earlier reports. Refresh non-environment repository files into the prepared backend/web/mobile folders, preserving lockfiles; never copy private `.env` contents or point tests at shared databases. Final result metadata and source/log hashes are in [the Step 14 verification manifest](qa_outputs/legacy_compatibility_20261020/verification_manifest.json). Detailed logs remain ignored under `.local-backups/environment-baseline-20261020`: `step14-backend-lint.log`, `step14-backend-tests.log`, `step14-backend-results.json`, `step14-native-full.log`, `step14-web-lint.log`, `step14-web-types.log`, `step14-web-build.log`, `step14-playwright.log` (initial failure), `step14-playwright-rerun.log` (final pass), `step14-flutter-analyze.log`, `step14-flutter-test.log`, `step14-ai-unittest.log`, `step14-ai-pytest.log` and `step14-ai-http.log`. Startup diagnostics are retained in `step14-native-debug.log`.

Run backend lint/default suite from the prepared backend and the native runner with `--all` from repository root. The runner owns its loopback replica set and ignores external database URIs. MongoDB 7.0.24 binary cache is `.local-backups/step13-integration/mongodb-binaries`; one member/0.25 GiB cache, synthetic prefixed DBs only. No root credentials needed. Web: run lint/types/build, `npm.cmd run prepare:standalone`, set `LUNAS_API_URL=http://127.0.0.1:5119/api/v1`, the isolated session secret from Step 13, `LUNAS_NATIVE_BROWSER=1` and an absolute `LUNAS_TEST_MONGODB_BINARY`; run `node scripts/run-playwright.mjs tests/native-reporting.spec.ts tests/operational-reporting.spec.ts tests/notification-access.spec.ts tests/repair-staffing.spec.ts tests/agency-preparation.spec.ts tests/secretary-verification.spec.ts tests/agency-sla-integrity.spec.ts tests/field-role-provisioning.spec.ts`. Ports 3100/5119 must be available; only owned test servers are stopped.

Flutter: set `FLUTTER_ROOT` to the writable copied SDK, `PUB_CACHE` to its sibling `pub-cache`, prepend its `bin` to PATH, and set `CI=true`, `FLUTTER_SUPPRESS_ANALYTICS=true`. From the prepared mobile folder run `flutter.bat --no-version-check analyze --no-pub` and `flutter.bat --no-version-check test --no-pub`. The final test run invoked the same cached Flutter tool directly: `dart.exe <FLUTTER_ROOT>/bin/cache/flutter_tools.snapshot --no-version-check test --no-pub`. For CLI contracts invoke that SDK's Dart with `--packages=.dart_tool/package_config.json` and each of `verify_field_role_routes.dart`, `verify_inspection_workflow.dart`, `verify_repair_handoff.dart`, `verify_citizen_tracking.dart` under `tool/`. Original shared SDK stays untouched.

AI: use `.local-backups/environment-baseline-20261020/python-env/Scripts/python.exe`, set `PYTHON_DOTENV_DISABLED=1`, `YOLO_OFFLINE=true`, `YOLO_AUTOINSTALL=false`, and writable `YOLO_CONFIG_DIR`; run J's unittest/pytest commands from `lunas_ai`, then its HTTP helper from root. It uses existing weights and owned loopback services only. Before any future cleanup, review the current routing/field-access/inspection/agency/SLA/handoff/evidence/notification/report suites, the new migration and protocol-9 regressions, and the three new browser cases. Do not run the retired migration, invent authority, delete unknown clients/history, unbind services or claim device/production integration from these results.

## STEP 13 — R2-T12 FULL SYSTEM TESTING AND INTEGRATION VERIFICATION

**R2-T12: PARTIAL; LUNAS is not production-ready.** The feasible local verification substantially improved: the complete backend suite passes against a disposable native MongoDB replica set, a real API/database browser case passes, full Flutter widget tests run, and backend-to-AI HTTP inference works with an existing checkpoint. Private storage, physical devices/push, deployment, physical backup/restore and institutionally blocked lifecycle stages remain incomplete. Earlier implementation/audit reports are preserved below and must be read with these current results.

### A. Environment inventory

2026-10-20, Windows 11 `10.0.26200.9711`, x64; Node `22.20.0`, npm `10.9.3`, Next.js `16.2.1`, Playwright `1.62.1`; Flutter `3.47.2`, Dart `3.13.2`; isolated Python `3.14.0`, PyTorch `2.9.0+cpu`, torchvision `0.24.0`, Ultralytics `8.4.183`, OpenCV headless `5.0.0`. No Docker, installed mongod/mongosh or private object-storage service was available on PATH. Android SDK 36.1 and Visual Studio were detected by doctor; Windows and Chrome targets were listed, with no physical Android/iOS device verified.

Native integration uses MongoDB `7.0.24`, downloaded into `.local-backups/step13-integration/mongodb-binaries` and started as an **owned, disposable, single-member WiredTiger replica set bound to 127.0.0.1**, with a 0.25 GiB WiredTiger cache setting. This is a cache configuration, not measured process memory. No production URI, credentials, bucket or account was used. The existing deployment Compose image remains MongoDB 6.0/standalone; the test replica set does not certify that deployment.

### B. Git and source details

Branch `revision`; HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`. Initial tree already contained extensive tracked/untracked Steps 1–12 work. It was preserved; no reset/clean, commit, push, seed, migration or production operation occurred. Tests cover this uncommitted tree, not HEAD alone. Machine-readable source SHA-256 values and actual results are in [verification_manifest.json](qa_outputs/system_verification_20261020/verification_manifest.json).

Exact Step 13 modified/added repository paths:

- `README.md`
- `lunas_backend/package.json`
- `lunas_backend/package-lock.json`
- `lunas_backend/scripts/dagupan-seed-config.js`
- `lunas_backend/scripts/dagupan-seed-config.test.js`
- `lunas_backend/scripts/run-isolated-integration.js`
- `lunas_backend/src/controllers/authorizedAccounts.integration.test.js`
- `lunas_backend/src/controllers/incidentController.js`
- `lunas_backend/src/controllers/incidentValidation.test.js`
- `lunas_backend/src/services/slaService.js`
- `lunas_backend/src/services/slaMonitoring.test.js`
- `lunas_backend/src/services/slaWorkOrder.test.js`
- `lunas_backend/src/integration/system.integration.test.js`
- `lunas_web/tests/native-reporting.spec.ts`
- `lunas_mobile/test/incident_report_test.dart`
- `lunas_mobile/test/mobile_login_roles_test.dart`
- `lunas_mobile/test/notification_center_test.dart`
- `lunas_ai/tool/verify_local_integration.py`
- `qa_outputs/system_verification_20261020/skipped_backend_tests.json`
- `qa_outputs/system_verification_20261020/verification_manifest.json`

### C. Toolchain recovery

Backend/web source checks reuse `.local-backups/environment-baseline-20261020/{lunas_backend,lunas_web}`, refreshed from Git-listed tracked/untracked source excluding private `.env*`. Separate clean lockfile installs in `lockfile-check/{lunas_backend,lunas_web}` both passed with `npm.cmd ci --ignore-scripts --no-audit --no-fund --cache ../../npm-cache` (687 backend / 365 web packages); application install scripts were disabled. No existing dependency versions were unnecessarily upgraded. `mongodb-memory-server` was added as a locked development-only integration harness. It launches a real mongod binary, not a JavaScript database emulator; see its [official configuration documentation](https://typegoose.github.io/mongodb-memory-server/docs/api/config-options/).

The shared SDK at `C:\src\flutter` was **not modified or re-permissioned**. An independently writable copy was prepared at `.local-backups/environment-baseline-20261020/flutter-sdk`, retaining the actual Git/version metadata, cached Dart/tools/engine artifacts, packages, dev and examples metadata. Initial partial-copy failures (missing material fonts/dev/examples) were corrected by copying the existing SDK artifacts/source directories. Mobile source is copied to the adjacent `lunas_mobile`; a separate `pub-cache` receives cached packages and lockfile-resolved missing packages. Offline pub resolution correctly identified missing `url_launcher`; `pub get --enforce-lockfile` then passed without changing app dependency versions. Original SDK/package-cache paths remain unchanged.

AI recovery installed missing libraries only in the ignored Python environment, aligned torchvision with the existing PyTorch 2.9 runtime, and retained all existing model weights. Full installed versions are recorded in `step13-python-freeze.txt`. No pretrained model was downloaded/replaced. `pip check` still exits 1 because Ultralytics declares `opencv-python`, whereas the project uses working `opencv-python-headless`. Do not install two competing OpenCV providers blindly or describe the whole production requirements set as clean. A reviewed compatible dependency lock is still needed.

### D. Backend baseline and persistent failures

| Execution | Passed | Failed | Skipped | Exit / interpretation |
|---|---|---|---|---|
| Reproduced previous two failures | Existing baseline subset | 2 | 0 | Exit 1; evidence in `step13-baseline-failures.log` |
| Normal full `npm.cmd test -- --runInBand` | **791** | **0** | **52** | Exit 0; 71 passed / 2 opt-in skipped suites |
| Full suite with owned replica set | **843** | **0** | **0** | Exit 0; **73/73 suites**, native MongoDB enabled |
| Backend lint | Check passed | 0 | 0 | Exit 0 |

The original queue test expected only the old flat status list. Current Secretary responsibilities also include assigned/in-progress/submitted Tanod verification and agency completion review. Its replacement checks actual eligibility and barangay boundaries using query execution, not merely a copied object shape. Investigation additionally reproduced a genuine defect: supplying search overwrote the queue's workflow `$or`, admitting closed records. `incidentController.js` now intersects search with workflow eligibility. The failing regression returned true for a closed matching record before the correction and false afterward.

The old seed test's 42 count was obsolete, but simply replacing it with 69 would hide a fixture defect: all 31 Tanod examples were Repair Personnel and organization repair workers were absent. The development-only fixture now provides distinct canonical-barangay Secretary/Tanod examples and separate organization Repair Personnel. Counts are derived from fixture structure (73 currently), emails are unique, and organization expertise pairing is checked. Existing demo organization definitions were reused; no official routing mappings, real accounts or seed execution were introduced.

Native account tests also had stale assumptions: retired `city_engineer` tokens are rejected at authentication (401); legacy validation is deliberately blocked (409); privileged login requires CAPTCHA. The harness now provides a synthetic CAPTCHA response through its already mocked HTTP verifier and asserts the stronger current denials. CAPTCHA is not disabled in application code. Full database execution initially exposed these obsolete contracts; all 40 account cases now pass.

**Skipped inventory:** all 40 original skips were in `authorizedAccounts.integration.test.js`, gated by `ACCOUNT_TEST_MONGODB_URI`. Twelve new system cases are gated by `LUNAS_INTEGRATION_MONGODB_URI`, making 52 default skips. Each exact name, file, reason/category and successful native execution is recorded in [skipped_backend_tests.json](qa_outputs/system_verification_20261020/skipped_backend_tests.json). Every one ran in the owned replica-set full execution. There are no unexplained backend skips or intentionally suppressed failing assertions. Browser's separate native case also requires its explicit infrastructure opt-in.

### E. Flutter verification

Full Flutter tooling is recovered in the writable copy; custom SDK-only scripts are not substituted for widget tests. Commands run from the isolated mobile source with `FLUTTER_ROOT`/`PUB_CACHE` pointing to the adjacent writable copies:

```powershell
& "$env:FLUTTER_ROOT/bin/flutter.bat" --no-version-check doctor -v
& "$env:FLUTTER_ROOT/bin/cache/dart-sdk/bin/dart.exe" "$env:FLUTTER_ROOT/bin/cache/flutter_tools.snapshot" --no-version-check pub get --enforce-lockfile
& "$env:FLUTTER_ROOT/bin/cache/dart-sdk/bin/dart.exe" "$env:FLUTTER_ROOT/bin/cache/flutter_tools.snapshot" --no-version-check analyze --no-pub
& "$env:FLUTTER_ROOT/bin/cache/dart-sdk/bin/dart.exe" "$env:FLUTTER_ROOT/bin/cache/flutter_tools.snapshot" --no-version-check test --no-pub
```

**Flutter tests: 79 passed, 0 failed**, exit 0, actual Flutter test engine/widgets. The first full execution exposed ten old test expectations (pre-review completion wording, mobile role/error wording and notification UI labels). They were aligned with existing Step 2/11 behavior; a distinct Tanod mobile-login acceptance case was added, and no application permissions were widened. Full analysis completes with **17 informational lint findings, no errors or warnings**, exit 1 under default fatal-info behavior. These include existing braces/style findings in auth/repair screens/services and `avoid_print`/relative imports in SDK verification tools; they were not suppressed or broadly refactored.

Final launcher doctor exited 0 and recognized the copied SDK/toolchains, with one remaining network-resources warning category caused by sandbox network restrictions. It does not certify mobile deployment. No APK/IPA build, physical field visit, native push callback, real photo submission, Android/iOS device run or platform secure-storage integration is claimed. Remaining work: address the recorded lint infos separately, then verify approved flows on an isolated device/emulator and supported native SDKs.

### F. Web verification

`npm.cmd run lint`, `npx.cmd --no-install tsc --noEmit`, `npm.cmd run build` and `npm.cmd run prepare:standalone` all passed, exit 0. The final browser execution passed **20/20 cases**, exit 0: **19 controlled fixture/mocked API cases and one actual JWT → Next.js → Express API → native MongoDB case**. They are not equivalent coverage. The native case creates its own replica set/test database, traverses reporting pages beyond 100 rows, and verifies export-denial and barangay-tampering behavior. It does not run the complete incident lifecycle through browser/mobile clients.

Prepared web process settings: `NEXT_TELEMETRY_DISABLED=1`, `LUNAS_SESSION_SECRET=lunas-playwright-isolated-session-secret-only`, `LUNAS_API_URL=http://127.0.0.1:5119/api/v1`. The native browser flag is `LUNAS_NATIVE_BROWSER=1`, with `LUNAS_TEST_MONGODB_BINARY` set to the existing absolute test binary path. No automatic binary download is allowed by that browser case. Run:

```powershell
node scripts/run-playwright.mjs tests/native-reporting.spec.ts tests/operational-reporting.spec.ts tests/notification-access.spec.ts tests/repair-staffing.spec.ts tests/agency-preparation.spec.ts tests/secretary-verification.spec.ts tests/agency-sla-integrity.spec.ts tests/field-role-provisioning.spec.ts
```

Local ports 3100/5119 are closed by the runner/fixtures; native test databases and replica-set processes are disposed in cleanup. The native API mounts real routes/authentication, but does not represent deployed reverse-proxy/TLS configuration or a production ingress/load test.

### G. AI verification

In the isolated Python environment, with `PYTHON_DOTENV_DISABLED=1`, `YOLO_OFFLINE=true`, `YOLO_AUTOINSTALL=false` and a writable ignored `YOLO_CONFIG_DIR`:

- `python -m unittest test_privacy_scope`: **5 passed**, exit 0; handler/config scope checks, not real approved redaction.
- `python -m pytest -q test_category_models.py test_surface_drainage.py test_electrical_damage.py`: **15 passed**, exit 0; configuration/classification-contract tests, many with controlled prediction fixtures, not accuracy evaluation.
- From repository root: `python lunas_ai/tool/verify_local_integration.py`: exit 0. Starts an owned loopback Flask HTTP server, checks health and invalid-image rejection, invokes the real backend AI client over HTTP using a generated 320×320 gray PNG and the existing road checkpoint, then stops the service and verifies failed/manual-review fallback. No citizen evidence or private image is used. Completed inference remains advisory; stopped-service fallback returns `analysisStatus=failed`, no detection and mandatory review.

Health reports CPU and a loaded road model; the existing `models/road/rdd/yolov8s-rdd2022-mit.pt` loads and performs inference. Its hash/size are recorded in the manifest. A blank synthetic image yielding no detections is only a connectivity/execution smoke check. No accuracy, precision, recall, confusion matrix, category-wide model readiness or real redaction performance is claimed. Survey responses were not used as image ground truth. Other checkpoints and complete unpinned production dependencies remain separately unverified.

### H. MongoDB integration

From repository root, after installing the locked backend dev dependencies, run `node lunas_backend/scripts/run-isolated-integration.js --all` (this session used the same script under the prepared backend copy). The runner accepts **no caller database URI**, uses its owned loopback mongod, passes synthetic process configuration to Jest, and closes the replica set in `finally`. It strips inherited application/provider variables from the child environment. Database names are uniquely prefixed `lunas_accounts_test_*` / `lunas_system_test_*`; cleanup checks the actual name before dropping only that disposable database. No production/shared database is reset.

Verified with real Mongoose/driver/database operations: account provisioning/activation and token revocation; incident ownership; persisted inspection assignment/findings/Secretary review; synthetic routing/agency preparation; notifications; historical repair handoff; SLA state/notification persistence; reporting aggregation; and native unique indexes on incident references, one work order per incident and notification idempotency keys. Concurrent duplicate-reference writes have one winner; concurrent Tanod assignments persist one inspection; concurrent activation consumes one token; concurrent notification delivery claims record one attempt. No unique Inspection assignment index is claimed—the durable incident claim supplies the tested assignment guard.

The single-member replica set supports actual transaction rollback, verified on disposable data. Existing application workflows do **not** thereby become transactional; deployment Compose does not configure a replica set. A controlled failure after a first incident write leaves that write and the durable mutation claim persisted; the next attempt fails closed with 409. This proves the reconciliation requirement, not automatic recovery or cross-document atomicity. Real index creation in this test does not prove deployment indexes exist. Broader reassignment/acceptance/agency/SLA interleavings remain future concurrency work.

### I. Evidence storage

Real private S3-compatible storage is **BLOCKED / NOT RUN**. Docker is absent; no usable local storage service/bucket is available, and production AWS/storage credentials were not used. Existing `docker-compose.local.yml` uses RustFS plus a bucket initializer, with shared local volumes/environment interpolation; it was inspected but deliberately not started as a disposable test stack. The MongoDB binary alternative solves database testing, not private object storage. A future storage run must use a distinct Compose project, ports/volumes, synthetic credentials and a disposable private bucket, with explicit cleanup of only owned objects.

Current passing backend tests exercise image validation/privacy orchestration, scoped evidence serializers, forged-reference rejection, failure cleanup and the 300-second signing cap using mocked storage/provider calls. They do not verify real bucket anonymity, signature expiry, revocation of an issued bearer URL, legacy public-object privacy or actual S3 cleanup. New managed uploads remain **POLICY PENDING** under R2-T05A. No privacy gate was disabled. Historical retrieval, raw storage connectivity, mocked processing and approved new uploads remain distinct verification categories.

### J. End-to-end workflow results

| Scenario | Actual verification | Result / boundary |
|---|---|---|
| Citizen | Real JWT and DB own-report read; another citizen/agency/admin denied; account registration/OTP persistence with mocked delivery | PARTIAL: incident fixtures are synthetic; actual new-evidence upload/submission is policy-blocked |
| Secretary/Tanod | Concurrent assignment, start, no-image synthetic findings submission, stale approval denial, separate Secretary confirmation | PASSED API/DB contract; no physical visit/photo claim or mobile-device E2E |
| Routing | Persisted test-only ownership/rule → exact synthetic agency; missing ownership remains pending; no automatic work order/SLA start | PASSED tested API/DB boundaries; official mappings remain pending |
| Agency | Correct organization acknowledges/assesses/external preparation; unrelated organization denied; ready/authorization blocked | PASSED tested gates; all external process data synthetic |
| Maintenance authority | New protocol/readiness path remains blocked; routing/assessment does not create work | POLICY PENDING; no invented authorization |
| Repair | Explicit synthetic historical work-order fixture: in-progress replacement, previous-worker mutation denied, replacement acceptance, original 50% progress/start/deadline retained | PASSED API/DB historical handoff; no newly authorized task, real evidence, completion or final closure E2E |
| Citizen transparency | Safe status/agency/pending/SLA projection contracts, actual ownership read, fixture browser notifications | PARTIAL: no complete physical-device notification/report journey |
| Reports | Native >100-row aggregates/pagination/CSV/PDF, default-denied exports, real API/database browser pagination | PASSED tested local reporting boundaries; audiences and deployment remain pending |

The inspection findings request explicitly says it is synthetic and makes no physical visit claim. Downstream repair uses a deliberately labelled historical DB fixture because new Mongoose-validated work orders carry protocol 9 and cannot be activated without approved authority. These are separate supported test segments, **not an approved uninterrupted report-to-resolution lifecycle**. Category correction/clarification, conflicting routing and unsafe finalization remain covered by existing controlled tests; not all were exercised as complete native-client journeys.

### K. Notification integration

Real notification documents, unique idempotency index and concurrent atomic delivery claims are tested. An unavailable OneSignal configuration is persisted as `not_configured`, never delivered. Real Nodemailer transport also successfully sent one synthetic message to a temporary **loopback SMTP capture**; no real recipient/server was contacted. Account activation/OTP/webhook provider responses in the account suite are mocked; they are not real external email proof. Provider acceptance and actual device receipt remain **NOT RUN**. Native enrollment/rotation/logout/tap callback integration remains incomplete.

Bounded retry/failure-state tests pass; abandoned `processing` attempts, missing post-mutation notifications, orphan subscription claims and ambiguous provider acceptance still require reconciliation. Crash recovery is not certified from persistence/claim tests. Existing TTL/retention and legacy evidence limits remain pending as recorded in Step 11.

### L. SLA and reporting integration

Native SLA polling exposed an actual defect that mocked fixtures missed: a deadline-only `not_started` record was changed to overdue. `slaService.monitorable` now requires a valid start no later than the poll, ordered deadline and an active/approaching/overdue state. It does not create a start or amend a deadline. The native failing assertion is preserved in the investigation evidence, and now passes. Four focused malformed/not-started cases protect both incident and work-order monitors; old unit fixtures now explicitly represent legitimately started clocks rather than anonymous deadlines. Native polling also verifies date preservation and repeat-alert deduplication. Terminal normalization/authority policies were not redesigned.

Native reporting traverses all **237** incidents across three 100-row pages with unique IDs and correct full totals; direct scoped CSV/PDF endpoints and format-specific default-denial pass. The additional real browser case verifies JWT/API/database-backed screen pagination and cross-barangay/export denial. Other fixture browser tests verify combined filters, complete CSV/download bytes and genuine multi-page PDF. Calendar-boundary/CSV-injection/PDF-structure tests pass. No export audience was enabled in production or inferred from page viewing; synthetic process-local grants are test-only.

### M. Security regression/readiness matrix

| Area | Local Unit | Real Integration | End-to-End | Status |
|---|---|---|---|---|
| Authentication | PASSED | PASSED JWT/account persistence; CAPTCHA response mocked | PARTIAL | PARTIAL |
| Six-role RBAC | PASSED | PASSED tested API role/scopes | PARTIAL | PARTIAL |
| Citizen reporting | PASSED | Ownership/read/account paths PASSED | Upload BLOCKED | PARTIAL |
| Tanod verification | PASSED | Synthetic API/DB PASSED | Device/photo NOT RUN | PARTIAL |
| Secretary approval | PASSED | Stale/independent review PASSED | Full client chain NOT RUN | PARTIAL |
| Agency routing | PASSED | Synthetic rule/persistence PASSED | Official mappings POLICY PENDING | PARTIAL |
| Agency assessment | PASSED | Scoped preparation PASSED | Full client chain NOT RUN | PARTIAL |
| Work authorization | Denial PASSED | Denial PASSED | POLICY PENDING | POLICY PENDING |
| Repair assignment | PASSED | Historical handoff PASSED | Device chain NOT RUN | PARTIAL |
| Repair completion | PASSED controlled tests | NOT RUN complete native chain | POLICY PENDING | PARTIAL |
| Final closure | Unsafe-path denial PASSED | Full lifecycle NOT RUN | POLICY PENDING | POLICY PENDING |
| SLA monitoring | PASSED | Poll/date/dedup PASSED | Deployed scheduler NOT RUN | PARTIAL |
| Evidence upload | Validation/gate tests PASSED | Storage NOT RUN | POLICY PENDING | BLOCKED |
| Evidence retrieval | Scoped/signing tests PASSED | Real storage NOT RUN | NOT RUN | PARTIAL |
| Notifications | PASSED | In-app/claim/SMTP capture PASSED | Device NOT RUN | PARTIAL |
| Push delivery | Provider/state mocks PASSED | OneSignal NOT RUN | NOT RUN | BLOCKED |
| Operational reporting | PASSED | Native MongoDB/API/browser PASSED | Reporting segment PASSED | PARTIAL deployment |
| CSV/PDF export | PASSED | Native endpoint output/denial PASSED | Controlled downloads PASSED | POLICY PENDING audience |
| Database recovery | Guard tests PASSED | Rollback/retained claim PASSED | Physical restore NOT RUN | PARTIAL |
| Flutter/device | 79 widget tests PASSED | Physical device NOT RUN | NOT RUN | PARTIAL; analysis FAILED on infos |
| AI integration | 20 contract/scope checks PASSED | Road HTTP smoke/fallback PASSED | Full evidence chain BLOCKED | PARTIAL |

Negative coverage includes cross-citizen/barangay/agency denial, retired/suspended accounts, token invalidation, former worker access, stale decisions, unauthorized readiness/exports, search eligibility, malformed filters, CSV formulas and no-start SLA clocks. Existing CAPTCHA/throttling/evidence/finalization guards pass controlled regression tests. Live Cloudflare, distributed rate limits, deployed proxy forwarding/TLS and broad penetration testing are not claimed.

### N. Measured performance baseline

These are **test execution observations, not production load estimates**: final native-enabled 843-test run took 37.106 seconds; normal backend run took 15.508 seconds; 20 browser cases took 25.9 seconds; 79 Flutter widget tests took approximately 17 seconds. Native reporting uses 237 synthetic rows; assignment/activation/delivery races use concurrency 2. Native assertion durations include fixture setup/hashing and are retained in Jest JSON, so they must not be quoted as isolated endpoint latency. The backend-to-AI smoke uses one synthetic 320×320 image on CPU; actual elapsed/inference timings are in `step13-ai-http.log` and are not model accuracy or deployment SLAs. No representative large-dataset throughput, saturation, sustained concurrency or RSS benchmark was performed.

### O. Remaining institutional blockers

Evidence privacy/redaction/retention; official agency ownership/jurisdiction mappings; routing dispute/transfer resolution; work authorization; who sets priority and starts/pauses/amends SLA timing; final repair approval/closure; reporting/export audiences; and evidence/notification/audit retention/recovery authority. All remain pending where previously recorded. No institutional approval, synthetic-to-official mapping, deadline change, new closure path or privacy exemption was fabricated.

### P. Remaining technical blockers

Full Flutter analysis has 17 infos; physical Android/iOS/device storage and native push callback integration remain unverified. Private S3-compatible storage, real OneSignal receipt, production email, deployment indexes/least-privilege credentials, multi-node transactions/failover, physical backup restore, cross-document reconciliation and interrupted delivery recovery remain open. The deployed proxy/security configuration was read, not deployed. AI has only a road-model smoke result and an unresolved OpenCV dependency-metadata mismatch; non-Latin PDF font deployment remains unverified. No production services were contacted to fill these gaps.

### Q. Readiness assessment

Local backend/web development and automated tests are **PASSED at tested boundaries**. Database integration is **PARTIAL** (real owned replica set passes; deployment/scale/recovery incomplete). Mobile is **PARTIAL** (toolchain and widget tests recovered; analysis infos/device/native integration incomplete). Full revised workflow and deployment readiness are **BLOCKED / POLICY PENDING**. This verification task is **PARTIAL** because material storage/device/deployment activities remain blocked, even though the complete local backend suite passes.

### R. Defect and risk register

| ID / severity | Reproduction / evidence | Cause / outcome | Owner/dependency / next action |
|---|---|---|---|
| V13-01 P1, resolved | Secretary queue + matching search admitted closed record | Search overwrote workflow OR; intersected query with failing→passing regression | Backend queue; rerun native/full tests after compatibility changes |
| V13-02 P1, resolved | Native deadline-only not_started record became overdue | Monitor trusted deadline without start/state; minimal guard + four regressions now pass | SLA / R2-T04–05; retain no-start invariant |
| V13-03 P2, resolved | Old seed count/pairing/role checks fail | Obsolete count plus mislabelled Tanod/missing organization repair fixtures; six-role structural fixture corrected | Development fixtures only; no seed run |
| V13-04 P2, resolved tests | Native account/Flutter tests expected retired auth, CAPTCHA bypass or old labels | Obsolete contracts corrected; stronger denial/manual-review behavior retained | Test harness; no RBAC weakening |
| V13-05 P2, open | Full Flutter analysis exits 1 with 17 infos | Existing style/tool lint debt, no compile errors | Mobile compatibility cleanup; fix individually, rerun full tools |
| V13-06 P1, blocked | No private object-storage integration can run without local service | Docker absent; privacy policy also blocks approved new upload | Environment/privacy owners; isolated private bucket then scoped signing/expiry/cleanup tests |
| V13-07 P1, open | Controlled first write survives failure with held claim; processing notifications can remain stuck | No cross-document atomicity/reconciliation tooling certified | Backend operations; approved recovery procedure and wider fault/concurrency tests |
| V13-08 P1, policy pending | New work/closure/export cannot complete with current authority | Institutional decisions unresolved | Institutional owners; approve authority/audiences before enabling anything |
| V13-09 P2, open | pip check reports opencv-python missing despite working headless inference | Upstream package metadata conflicts with project's headless provider choice | AI environment; review compatible constraints/lock, retain one OpenCV provider |
| V13-10 P1, unverified | No deployed restore/failover/proxy/TLS/real device/push result | Test replica set/SMTP capture do not certify deployment or devices | Deployment/mobile owners; separate reviewed integration environment |

### S. Updated backlog

R2-T12 now has reproducible real database/HTTP/widget/inference evidence and resolved queue/SLA integration defects. Keep private storage, device/push, analysis hygiene, representative DB performance, physical restore, recovery/transactions and deployment checks open. Preserve all earlier policy-blocked work. Existing Compose was reviewed: separate application DB user has readWrite rather than root, backend bind/proxy controls remain, storage defaults private, and automation/readiness configuration remains as previously recorded. No least-privilege deployment proof is inferred from source.

Backup/restore scripts under `infra/aws/scripts` describe mongodump/mongorestore plus S3, including an explicit drop confirmation; they were **not executed**. No mongodump/mongorestore tools or isolated private backup bucket were available. Documented procedure, locally tested rollback and deployed disaster recovery are different capabilities.

### T. Reproduction, evidence and next developer handoff

Primary ignored evidence root: `.local-backups/environment-baseline-20261020`. Logs: `step13-baseline-failures.log`, `step13-reproduced-defects.log`, `step13-backend-tests.log`, `step13-backend-results.json`, `step13-native-full.log`, `step13-web-build.log`, `step13-playwright.log`, `step13-flutter-version.log`, `step13-flutter-doctor-final.log`, `step13-flutter-pub.log`, `step13-flutter-analyze.log`, `step13-flutter-test.log`, `step13-ai-unittest.log`, `step13-ai-pytest.log`, `step13-ai-http.log`, `step13-ai-pip-check.log`, `step13-python-freeze.txt`, and clean-install logs. Final native JSON: `.local-backups/step13-integration/full-results.json`. Earlier failed attempts are diagnostic evidence; final counts above supersede them. Machine-readable inventories/source hashes are tracked in the QA paths in B.

Final non-environment backend/web/mobile source/package hash comparison: **670 files, zero mismatches** against prepared copies; AI source and the exercised model hash are also recorded. `git diff --check` passed. Only owned test databases/processes are eligible for cleanup; unrelated/inaccessible local processes are not stopped or connected to.

Reproduce clean installs in disposable manifest-only folders with lockfiles; refresh prepared source before checks. Run backend `npm.cmd run lint` and `npm.cmd test -- --runInBand`; from repository root run the isolated runner with `--all` for all native tests. The first owned binary download needs network access, never production credentials. Run web lint/types/build/standalone preparation, then F with native flags. Use E for the writable Flutter copy, and G for isolated AI scope/contracts/HTTP checks. Do not point opt-in tests at shared databases or silently replace live integration with fixture-browser results.

Next developer must inspect the two small application fixes (queue search and SLA monitor), the fixture corrections, integration runner/system suite and native browser case; rerun their regressions before removing legacy paths. Remaining prerequisites are an owned private storage stack, approved privacy/authority/audience decisions, physical device/native push setup, compatible AI dependency lock and representative deployment/restore environment. Keep original SDK permissions, evidence confidentiality, current role scopes, history, maintenance/closure gates and SLA dates intact.

**Step 14 / next task: R2-T13 — Legacy Workflow Cleanup and Final Compatibility Review.** Inspect retired role/routes/labels and old clients/fixtures against current fail-closed contracts; do not reopen compatibility paths that bypass approved workflow boundaries. No commit or push was made.

## STEP 12 — R2-T11 OPERATIONAL REPORTING, CSV SECURITY, AND PDF EXPORT

**R2-T11: PARTIALLY IMPLEMENTED.** Scoped operational reporting, calendar periods, full-result metrics, pagination, safe CSV and real PDF generation are implemented and locally tested at the boundaries below. Export audiences are **BLOCKED / POLICY PENDING by default**; live MongoDB/index/performance and production integration remain unverified. This report supersedes corresponding older reporting findings; all previous reports remain below.

### A. Implementation information

2026-10-20, Asia/Shanghai; branch `revision`; HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`. Starting Git tree contained extensive tracked modifications and untracked Steps 1–11 files. Those changes were preserved. No commit/push, seed, migration, production connection, incident mutation, private environment-file read or shared Flutter SDK permission change occurred.

Exact Step 12 modified/added paths:

- `README.md`
- `lunas_backend/.env.example`
- `lunas_backend/package.json`
- `lunas_backend/package-lock.json`
- `lunas_backend/src/models/Incident.js`
- `lunas_backend/src/routes/index.js`
- `lunas_backend/src/routes/operationalReportRoutes.js`
- `lunas_backend/src/routes/operationalReportRoutes.test.js`
- `lunas_backend/src/controllers/operationalReportController.js`
- `lunas_backend/src/services/operationalReportService.js`
- `lunas_backend/src/services/operationalReportService.test.js`
- `lunas_backend/src/services/reportExportService.js`
- `lunas_backend/src/services/reportExportService.test.js`
- `lunas_web/src/lib/validation.server.ts`
- `lunas_web/src/lib/operational-reports.server.ts`
- `lunas_web/src/components/reports/operational-report.tsx`
- `lunas_web/src/app/(protected)/validation-routing/reports/page.tsx`
- `lunas_web/src/app/(protected)/validation-routing/reports/export/route.ts`
- `lunas_web/src/app/(protected)/work-orders/reports/page.tsx`
- `lunas_web/src/app/(protected)/work-orders/reports/export/route.ts`
- `lunas_web/tests/operational-reporting.spec.ts`

Added locked dependencies: PDFKit `0.20.2` for generation, Mingo `7.2.5` as a development dependency for executing real aggregation pipelines on synthetic in-memory fixtures. Installation scripts were disabled. Independent QA uses pypdf `6.21.1` only in the ignored local Python environment; it is not a runtime dependency. PDFKit's [generation/text documentation](https://pdfkit.org/docs/getting_started.html) informed the implementation. Next.js 16 local Route Handler and Server Component documentation was read before web changes.

### B. Reporting architecture

Existing Barangay Reports and Agency Reports URLs remain operational. Their former duplicated date/list/export code now delegates to a shared Server Component and `operational-reports.server.ts`. Backend endpoints: authenticated `GET /api/v1/operational-reports`, `/operational-reports/csv`, `/operational-reports/pdf`. Existing stats, incident detail, review and work-order endpoints remain unchanged.

`operationalReportService` validates all query parameters, applies existing jurisdiction/organization scope first, joins only the incident's current linked work order with matching reverse incident and organization, projects a minimum operational field set, applies derived filters and runs full-result facets plus paginated rows. No inspection/progress/assignment history is unwound, preventing duplicate incident counts. `reportExportService` serializes the same result for CSV/PDF. The web export routes stream the authorized backend download; tokens remain server-side. Reporting performs no incident/work-order writes.

### C. Supported reports and authoritative fields

Daily, weekly, monthly and custom-range reports support submission, verification-confirmation or recorded-resolution event selection. Every view includes current category/original category, barangay, recorded routing organization, incident/agency state, linked maintenance/assignment state and safe SLA state. Summary and distributions cover **all matching incidents**, including category, barangay, agency, incident status, agency status, maintenance, assignment and SLA groups.

| Metric / selection | Authoritative fields | Qualification |
|---|---|---|
| Selected incidents | `_id`, selected event timestamp | One incident per result, not one per inspection/worker/progress event |
| Submission-period selection | `createdAt` | Does not mean each current state occurred in that period |
| Confirmed verification | `categoryConfirmedBy`, valid `categoryConfirmedAt` | Recorded separate category confirmation; raw Tanod submission is not approval |
| Recorded resolution selection/count | Current `status` resolved/closed, `finalVerifiedBy`, valid `finalVerifiedAt` | Recorded final review for currently terminal incidents; no new closure authority inferred |
| Category corrections | Nonempty `originalCategory` differs from `category` | Preserves original category; missing original is not fabricated |
| Current ownership groups | `routing.responsibleOrganization` within record scope | Recorded organization, not proof of currently approved institutional mapping or work authorization |
| Maintenance / acceptance | Current linked `WorkOrder.status` / `assignmentState` | Reverse incident and organization must agree; no worker identity disclosure |
| SLA distribution | Valid persisted start/deadline/state, terminal closure where applicable | Read-only projection at generation time; missing/invalid clock is not started |
| Historical recorded breaches | `sla.state === breached` | Separate history count even when incomplete legacy timing prevents a current-clock projection |

### D. Reporting definitions

Submitted means selected by `createdAt`. Verified means recorded Secretary category confirmation with actor and timestamp, not merely field inspection completion. Assessed/acknowledged/external states use stored `agencyStatus`; assignments and progress use the current linked work order. Completed maintenance and 100% progress remain recorded work states, **not resolution**. Bidding completion is not completed maintenance. An agency routing string is not work authorization. No metric claims an authorized work-order count because an approved authorization contract is unavailable.

Recorded resolved/closed cases require a final reviewer and final-review timestamp as well as a terminal current status. Legacy terminal strings without provenance remain visible in status distributions but do not inflate recorded-resolution counts. This is a conservative reporting definition, not institutional certification or a newly enabled closure pathway. Event selection cannot reconstruct every historic transition or reopened case from a single timestamp; current-state breakdowns are explicitly labelled separately from selection-period events.

Established SLA clocks require actual Date start/deadline, start no later than generation, deadline no earlier than start and a known started state. Terminal states require valid closure timing. Valid closed clocks project met/breached; a recorded breach/cancellation is preserved. Nonterminal clocks project overdue/approaching/active using the existing configured approaching threshold. Reports never start, reset, pause or amend an SLA. Missing priority remains missing; priority filtering additionally requires recorded assignment actor/time. Historical records are retained; no archival/deletion policy or incident exclusion was invented.

### E. Pagination

Previous web readers and CSV routes requested only `limit=100`, then presented that page as the report. They now use independent full-result facets and deterministic offset pagination ordered by `createdAt DESC, _id DESC`. Default size 25; supported size 1–100; positive integer pages only. Requested page×size is capped at 100,000 with an explicit 400 error beyond it. Filters precede metrics and pagination. Tied timestamps are tested across multiple pages without duplicates. Changes between requests may still move rows; no immutable database snapshot is promised.

Exports ignore the displayed page and select the complete filtered set up to **2,000 incidents**, with a 2,001-row sentinel and full total check. Larger exports return **413**, never a labelled-complete first page. A field above 4,096 characters or total detail text above 4 Mi characters also fails explicitly. PDF additionally limits output to 250 pages / 16 MiB. Narrow dates/filters to export a larger population in separately labelled selections. There is no background export job or unrestricted all-record memory load.

### F. Reporting filters

Combined validated filters: period, calendar date or custom start/end, event basis, canonical infrastructure category, canonical barangay, exact responsible-organization name, current incident status, confirmed/pending verification, agency-assessment state, external-processing state, maintenance state, worker acceptance/assignment state, SLA state and recorded priority. Verification/maintenance/assignment/SLA filters use projected fields before totals and detail pagination. Agency and external filters both constrain the persisted agency status; incompatible combinations yield empty results.

Unknown parameters, operator objects, arrays, duplicate BFF export parameters, invalid enums, control characters, malformed organization text, invalid pagination and impossible/excessive ranges are rejected. A Secretary's explicit unrelated barangay or Agency Officer's explicit unrelated organization is denied with 403. All other filters intersect the existing scope; they cannot broaden it. The agency filter accepts an exact validated name rather than exposing a cross-agency directory. No arbitrary MongoDB object or caller-supplied font/storage path is accepted.

### G. Period semantics

Reporting timezone is **Asia/Manila**, consistent with existing Philippine UTC+08 local calendar behavior. Daily = selected local midnight to next midnight; weekly = Monday midnight through next Monday; monthly = first day through first day of next month. Custom start and end are inclusive local dates converted to inclusive-start / exclusive-next-midnight database instants. Supported years 1970–2100 and ranges at most 366 days; leap years and year/month/week boundaries are tested. Calendar selectors default to the current Manila day/month; rolling windows were removed from these report pages. Stored timestamps are unchanged.

Submission selects `createdAt`; verified selects valid category confirmation actor/time; resolved selects recorded final reviewer/time plus current terminal status. Screen, CSV and PDF identify event basis, effective period, timezone, filters, scope and generation timestamp. Database instants appear explicitly in ISO UTC alongside the reporting timezone and exclusivity labels.

### H. Role and export permissions

| Role | View Summary | View Details | Export CSV | Export PDF | Scope |
|---|---|---|---|---|---|
| Citizen | No broad operational report | No | No | No | Existing own-report transparency unchanged |
| Barangay Tanod | No | No | No | No | Existing assigned inspections unchanged |
| Repair Personnel | No | No | No | No | Existing assigned tasks unchanged |
| Barangay Secretary | Yes, active assigned account | Yes, minimum operational fields | Policy pending by default | Policy pending by default | Existing canonical barangay scope with legacy location fallback |
| Agency Officer | Yes, active assigned account | Yes, minimum operational fields | Policy pending by default | Policy pending by default | Exact existing organization scope |
| System Administrator | No operational grant | No | No | No | Governance access does not imply operational reporting/export |

Backend view and export gates are independent. `OPERATIONAL_REPORT_CSV_ROLES` and `OPERATIONAL_REPORT_PDF_ROLES` are separate, empty-by-default deployment allowlists, restricted in code to the two eligible operational roles. They must be configured **only after institutional audience approval**; tests set synthetic process-local grants. Listing admin does not widen access. These controls implement a policy gate, not institutional approval. The web checks the relevant workspace and the backend independently checks active authentication, reporting role, assignment scope, filters and format permission. Direct API calls cannot bypass it. UI export controls display policy pending when disabled.

### I. CSV security

One central `csvCell` serializer quotes text, doubles embedded quotes, preserves commas/newlines/Unicode and emits UTF-8 BOM + CRLF with explicit CSV content type. Text starting with formula characters `= + - @` after whitespace/control/format characters is prefixed with an apostrophe; leading control/format characters are also neutralized. Quoting alone is not treated as protection. Typed finite numeric summary values remain numeric. Safe static/enumerated filenames and fixed content-disposition prevent header injection; responses are private/no-store with nosniff.

CSV has a record-type column: metadata/period/filter/generation/semantics records, summary records, distribution records, then one `Incident` record per complete selected incident. Operational detail columns exclude descriptions/free-form private remarks, citizen IDs/contacts, staff profiles, evidence URLs/keys, tokens and audit internals. Spreadsheet tests inspect emitted bytes, including whitespace/zero-width prefixes, quotation, Unicode, separators and full coverage beyond 100 rows.

### J. PDF implementation

PDFKit generates genuine A4 PDF bytes. Reports contain LUNAS title, scoped organization/barangay, period and event basis, effective timezone, filters, generation time, definitions, full-result summary/distributions and a wrapped three-column operational detail table. Page numbers and table headings repeat across page breaks; long cells continue without silent text truncation. Empty reports remain valid and explicit. Source-provided private metadata/images/links are never embedded.

The default Helvetica font covers the supported Latin text subset. Unsupported Unicode fails explicitly with **422** rather than corrupting text; an approved trusted local `OPERATIONAL_REPORT_FONT_PATH` can supply appropriate font coverage. It is deployment configuration, never a request parameter. Actual non-Latin font coverage/deployment is unverified. CSV preserves Unicode independently. Size/page/text/incident limits fail before returning an incomplete download. An independently parsed synthetic sample contains **237 incident references in 29 pages**; extraction normalizes ordinary kerning whitespace around hyphens.

### K. Data consistency

View/CSV/PDF share `parseReportQuery`, `reportPipeline`, full-result facets and the minimum operational row projection. CSV and PDF include the same aggregate distributions and row population. One request uses one aggregation command and generation time; all output definitions match for identical underlying data. This is not a MongoDB snapshot-isolation guarantee or a promise that separately generated screen/CSV/PDF requests remain identical while records change. No persisted summary copies, new reporting schema or incident history changes were introduced.

### L. Test results

Checks use current copied sources in the ignored prepared environment `.local-backups/environment-baseline-20261020/{lunas_backend,lunas_web}`, whose locked dependencies were recovered in Step 1. Original private `.env*` files are excluded. New locked dependencies were downloaded with installation scripts disabled and copied to that environment. All reporting data is synthetic; no MongoDB connection occurs.

| Component | Command | Passed | Failed | Skipped | Result | Limitations |
|---|---|---|---|---|---|---|
| Backend lint | `npm.cmd run lint` | check | 0 | 0 | PASS | Prepared environment |
| Full backend | `npm.cmd test -- --runInBand --json --outputFile=../step12-backend-results.json` | 784 | 2 | 40 | Baseline failures remain | 826 tests; 69 passed / 2 failed / 1 skipped suites |
| Focused reporting | Included three new reporting suites in full run | 67 | 0 | 0 | PASS | Mingo aggregation + HTTP/serialization/PDF checks; not native MongoDB |
| Web lint / types | `npm.cmd run lint`; `npx.cmd --no-install tsc --noEmit` | checks | 0 | 0 | PASS | Prepared environment |
| Web production build | `npm.cmd run build`; `npm.cmd run prepare:standalone` | checks | 0 | 0 | PASS | Process-only local fixture API/session values |
| Browser reporting / regressions | Seven named spec files below | 19 | 0 | 0 | PASS, exit 0 | Four reporting cases + 15 prior regressions; synthetic API/aggregation fixtures |
| Independent PDF/CSV parse | Isolated Python `pypdf.PdfReader(..., strict=True)` + `csv.reader` | check | 0 | 0 | PASS | 29 pages / all 237 report IDs and CSV incident rows; summary/scope/timezone/page labels |
| Mobile | Not run | — | — | — | Not applicable | No mobile/shared existing API contract modified; earlier full Flutter blocker persists |

Browser command: `node scripts/run-playwright.mjs tests/operational-reporting.spec.ts tests/notification-access.spec.ts tests/repair-staffing.spec.ts tests/agency-preparation.spec.ts tests/secretary-verification.spec.ts tests/agency-sla-integrity.spec.ts tests/field-role-provisioning.spec.ts`. Four new cases cover >100 rows and all pages, combined filters/full summaries, actual CSV/PDF downloads and default-denied exports/tampered barangay. The other 15 exercise prior workflow and notification controls. Initial browser runs exposed missing fixture email and ambiguous accessible labels/selectors; the fixture/selectors were corrected and explicit filter aria-labels added before final rerun.

The unchanged failures are `src/controllers/incidentValidation.test.js` (“returns submitted and clarification-required records only from the assigned barangay queue”, obsolete flat filter) and `scripts/dagupan-seed-config.test.js` (“local accounts cover all canonical barangays and matching provider/repair organizations”, expects 42 instead of 69 accounts). No seed ran and neither unrelated expectation was altered. Reporting tests cover 0/53/100/237 records, stable tied timestamps, all-page totals, invalid/operator inputs, date boundaries/leap years, current scopes, role denials, active-account checks, format-specific permissions, 2,001-row export failure, malformed header input, formula bytes, Unicode CSV, actual PDF xref/content/page structure, long text, empty reports and confidential-field exclusion.

Ignored evidence under the prepared environment root: `step12-backend-results.json`, `step12-backend-tests.log`, `step12-focused.log`, `step12-web-build.log`, `step12-playwright.log`, `step12-report.pdf`, `step12-report.csv`, `step12-pdf-validation.txt`. PDF/CSV artifacts contain synthetic records only. Browser services use local ports 3100/5119 and are closed by the runner/fixtures.

Final verification: all 404 non-environment backend/web source/package files matched the prepared copies by SHA-256. `git diff --check` passed. Backend full command exited 1 solely for the two baseline failures above; reporting tests, backend lint, web lint/type/build/standalone preparation, final browser run and independent PDF/CSV parsing passed. Earlier failed browser attempts were superseded by the final 19/19 run; no failing acceptance case remains hidden.

### M. Performance and integration limitations

Mingo executes the actual aggregation pipeline but is not native MongoDB: query planning, BSON/driver behavior, cross-request concurrency, deployed indexes, server aggregation memory and representative large datasets remain unverified. Three compound scope/createdAt/_id indexes are defined in the model only; no migration/index creation was run. Existing indexes were inspected. Scope/date/ordinary filters run early, the current-work-order lookup uses IDs and small projections, summaries are server facets, application detail rows are bounded, and database execution has a 15-second maximum. Facet sorting/derived filters may still be expensive; no explain-plan or production throughput claim is made. MongoDB facet/document limits may reject unusually high-cardinality/large reports; no partial-success fallback is supplied.

Institutional export audiences remain pending. Non-Latin PDF fonts require approved deployment and coverage verification. No production report deployment, live DB concurrency, email/push/storage integration, evidence privacy approval, Flutter SDK recovery, notification crash recovery or cross-document reconciliation is certified here. Prior SLA/priority/authorization/closure/routing/privacy policy blockers remain unchanged. Historical report records remain intact.

### N. Implementation status

| Area | Status | Boundary |
|---|---|---|
| Daily reports | VERIFIED IMPLEMENTED | Synthetic calendar/query tests; live DB unverified |
| Weekly reports | VERIFIED IMPLEMENTED | Monday/year-boundary tests |
| Monthly/custom reports | VERIFIED IMPLEMENTED | Leap-month/custom boundary and event-basis tests |
| Filters | VERIFIED IMPLEMENTED | Combined/invalid/scoped synthetic queries |
| Full pagination | VERIFIED IMPLEMENTED | Complete 237-record traversal; documented 100,000 page×size bound |
| Full-result metrics | VERIFIED IMPLEMENTED | Actual pipeline on in-memory fixtures; no snapshot guarantee |
| Reporting RBAC | VERIFIED IMPLEMENTED | HTTP + scope/role/active-account tests; production integration unverified |
| CSV export | PARTIALLY IMPLEMENTED | Complete bounded generator/download; institutional audience gate defaults denied |
| CSV injection protection | VERIFIED IMPLEMENTED | Actual output-byte tests, including leading whitespace/format characters |
| PDF export | PARTIALLY IMPLEMENTED | Genuine parsed output/download; audience and non-Latin font deployment pending |
| PDF pagination | VERIFIED IMPLEMENTED | Repeated headings/page numbers/long-cell handling; 29-page sample |
| Large dataset behavior | PARTIALLY IMPLEMENTED | Synthetic >100 and export-limit checks; representative DB performance unverified |
| Live database integration | IMPLEMENTED — UNVERIFIED | No isolated MongoDB instance available/used |

### O. Updated development backlog

R2-T11 core reporting is locally implemented at the stated boundaries; export audiences, non-Latin font deployment, native MongoDB pagination/aggregation/index checks and production performance remain incomplete. Keep R2-T10 native push/recovery, evidence privacy and the prior institutional lifecycle decisions open. Do not mark those blockers complete from reporting tests.

### P. Next developer handoff

Inspect A, especially the query parser/pipeline, export allowlists, minimum field projection, PDF limits and BFF download route. Rerun L against matching prepared-source hashes. Use an explicitly isolated MongoDB instance for native query/index/scope tests with tied timestamps, legacy values and representative record volumes; inspect explain plans before approved index deployment. Approve report/export audiences before populating either role allowlist. Provision/test a licensed Unicode font for actual agency names where needed. Verify deployed download headers, cancellation/timeouts and complete outputs. Preserve privacy, maintenance authority, SLA and closure gates.

Next task: **R2-T12 — Full development-environment recovery, regression testing, database/storage integration and end-to-end verification.** No commit or push was made.

## STEP 11 — R2-T10 CITIZEN TRANSPARENCY, NOTIFICATIONS, AND SECURE EVIDENCE ACCESS

**R2-T10: PARTIALLY IMPLEMENTED.** Local tracking, authorization, signing, enrollment and retry contracts are verified at the boundaries below. Live database/storage/push/device integration is unverified; native push callbacks and reliable recovery across workflow/notification writes remain incomplete. This section supersedes corresponding older findings without removing earlier reports.

### A. Task information

2026-10-20, Asia/Shanghai; branch `revision`; HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`. Starting tree contained extensive tracked and untracked Steps 1-10 work, preserved. No commit/push, seed/migration, live account/incident operation, production configuration, dependency change, private environment-file access or shared SDK permission change was performed.

Exact Step 11 modified/added repository paths (earlier-step modifications remain separate):

- `README.md`
- `lunas_backend/src/controllers/authController.js`
- `lunas_backend/src/controllers/incidentController.js`
- `lunas_backend/src/controllers/notificationController.js`
- `lunas_backend/src/controllers/notificationController.test.js`
- `lunas_backend/src/controllers/pushEnrollmentController.js`
- `lunas_backend/src/controllers/pushEnrollmentController.test.js`
- `lunas_backend/src/models/Notification.js`
- `lunas_backend/src/models/PushEnrollment.js`
- `lunas_backend/src/routes/notificationRoutes.js`
- `lunas_backend/src/server.js`
- `lunas_backend/src/services/citizenTrackingService.js`
- `lunas_backend/src/services/citizenTrackingService.test.js`
- `lunas_backend/src/services/notificationAccessService.js`
- `lunas_backend/src/services/notificationAccessService.test.js`
- `lunas_backend/src/services/notificationDeliveryService.js`
- `lunas_backend/src/services/notificationDeliveryService.test.js`
- `lunas_backend/src/services/notificationService.js`
- `lunas_backend/src/services/notificationService.test.js`
- `lunas_backend/src/services/pushTransport.test.js`
- `lunas_backend/src/services/storageService.js`
- `lunas_backend/src/services/storageService.test.js`
- `lunas_web/src/app/actions/notifications.ts`
- `lunas_web/tests/notification-access.spec.ts`
- `lunas_mobile/lib/features/reporting/data/models/incident_report.dart`
- `lunas_mobile/lib/features/reporting/presentation/screens/citizen_report_detail_screen.dart`
- `lunas_mobile/lib/features/reporting/presentation/widgets/reporting_widgets.dart`
- `lunas_mobile/lib/features/notifications/data/models/notification_data.dart`
- `lunas_mobile/lib/features/notifications/data/services/notification_service.dart`
- `lunas_mobile/lib/features/notifications/presentation/screens/notification_details_screen.dart`
- `lunas_mobile/tool/verify_citizen_tracking.dart`

### B. Citizen tracking implementation

The existing own-report serializer now includes `citizenTrackingService` projections: current status label, original/current category, verified responsible organization or explicit routing-pending/review state, and safe SLA timing. Mobile detail shows these fields and retains persisted timeline events. Actor identities, internal notes, routing candidates, evidence keys, escalation internals, worker staffing and organization directories remain absent from citizen projections. Citizen ownership queries are unchanged.

Organization display requires a matched routing review, agency/rule IDs, positive integer policy version, valid routing timestamp and Secretary category confirmation; a historical organization string alone is insufficient. This validates persisted provenance, not current live configuration approval. Agency assignment never creates maintenance authority. Missing, invalid or future-started clocks show `not_started` without deadlines. Established clocks use the existing read-only server SLA projection, preserving stored start/deadline and terminal outcomes; recorded breach history survives incomplete legacy timing. No priority, deadline, start or closure is written during reads. Mobile displays recorded backend timing rather than inventing a countdown. Invalid legacy clocks require reconciliation.

### C. Citizen-safe status matrix

| Internal State/Event | Citizen-Visible Label | Source Field | Authorized Audience |
|---|---|---|---|
| submitted | Awaiting barangay verification | status | Report owner |
| tanod_assigned / tanod_in_progress | Awaiting field verification / Under field verification | status | Report owner |
| tanod_verified | Awaiting barangay review; after confirmation, awaiting agency assignment | status, categoryConfirmedAt | Report owner |
| clarification_required | Additional information requested | status | Report owner; dedicated citizen clarification only |
| provider_assigned without verified routing | Awaiting verified agency assignment | status, routing provenance | Report owner |
| responsibility_review | Agency assignment under review | agencyStatus / routingReview | Report owner |
| acknowledged | Under agency assessment | agencyStatus | Report owner |
| routine_pending_authorization / awaiting_work_authorization | Awaiting work authorization | agencyStatus | Report owner |
| pending_external_processing / pending_funding / for_bidding | Awaiting external processing / Awaiting external funding / External bidding tracked | agencyStatus | Report owner |
| bidding_completed | Bidding completed; work authorization pending | agencyStatus | Report owner |
| repair_assigned / in_progress | Repair assignment pending / Repair in progress | status | Report owner |
| repair_completed / provider_review / work_completed | Repair submitted for review | status / agencyStatus | Report owner |
| rework_required / resolved / closed | Corrective work required / Resolved / Closed | status | Report owner |

Timeline agency labels derive from each persisted event's metadata, never the latest agency state applied retroactively. Unknown historical statuses retain existing generic rendering; no synthetic events or timestamps are appended.

### D. Notification recipient matrix

Existing producers remain in `incidentController.js`, `tanodWorkflowController.js`, `workOrderController.js` and `slaService.js`. "Selected" means the stored workflow recipient, not every user of that role. Every feed/read/update/delete remains scoped to the authenticated recipient, and linked content is reauthorized on read and before external delivery.

| Event | Citizen | Tanod | Secretary | Agency Officer | Repair Personnel | Admin |
|---|---|---|---|---|---|---|
| Submission / citizen decision | Report owner | - | - | - | - | - |
| Inspection assignment / clarification / reassignment | Decision update where produced | Selected/current worker; old notice becomes historical | Stored inspection Secretary for acknowledgement/start/submission | - | - | - |
| Secretary decision / category correction | Report owner | Selected clarification recipient | Routing exception recipient | Matched organization providers on successful routing | - | - |
| Agency assessment / external milestone | Report owner | - | Stored inspection Secretary | Existing officer workflow; no new role-wide broadcast | - | - |
| Work completed / correction / final verification | Existing final decision update | Selected final inspection worker | Stored Secretary / validator | Responsible-organization correction recipients | Assigned worker for repair correction | - |
| Repair assignment / replacement | - | - | - | Stored assigner receives accept/decline/start/completion events | New assignee; previous assignee receives historical replacement notice | - |
| Existing SLA alerts | Existing scheduler recipients only | Existing assignment scope | Existing scheduler scope | Responsible organization / stored task recipient where configured | Existing task recipient where configured | No new operational access |
| System/account notices | Own recipient only | Own recipient only | Own recipient only | Own recipient only | Own recipient only | Own recipient only; no incident grant |

No new broadcasts or institutional escalation recipients were invented. Admin notices do not confer operational incident access. Role/barangay helpers now persist per active account instead of sending unrestricted provider-tag broadcasts. Producer failures after a committed workflow remain a reconciliation gap, not an assertion of successful notification.

### E. Navigation and access security

`notificationAccessService` resolves stored incident/work-order IDs using current `buildReadableIncidentScope` / `buildWorkOrderScope`, including current worker relationships and organization/barangay restrictions. Tanod additionally needs the incident's current initial/completion inspection assigned to that worker. Citizens navigate to `/reports/:id`; Secretary to `/validation-routing/:id`; agency incident notices to `/work-orders/intake/:id`; agency tasks to `/work-orders/:id`; Repair Personnel to `/repair/work-orders/:id`; Tanod to its inspection queue with the authorized inspection ID. Clients ignore stored arbitrary URLs. Target endpoints independently authorize again.

Unavailable/revoked resources return a generic historical notice, empty resource data and `resourceAvailable: false`; no old report reference, message, signed link or navigation is exposed. DELETE dismisses the recipient's notice instead of destroying operational history. Existing `expiresAt` TTL index is unchanged; older expiring rows still require a separately authorized retention review. No TTL migration was run.

### F. Evidence retrieval

Existing incident, inspection and work-order reads authorize owner/barangay/organization/current assignment before serializers resolve persisted evidence references. There is no new client-key signing route. Citizen evidence filtering remains in place. S3 signing rejects absolute paths, traversal, backslashes, URLs, control characters and oversized/empty keys; default, configured and explicit TTLs are capped at **300 seconds**. Authorized refresh uses the same scoped read. No evidence object is copied, made public or replaced.

Historical URL-only evidence and opt-in Supabase migration reads remain supported, subject to existing read scope. Previously issued URLs remain usable until their expiry; application authorization cannot revoke an already issued bearer link or make a previously public legacy object private. Live bucket access, CORS, expiry enforcement and legacy-object privacy are unverified. New managed uploads remain blocked by the existing evidence privacy/redaction gate; this task does not approve privacy policy.

### G. Push enrollment

Authenticated `POST /notifications/devices` accepts only an Android/iOS UUID subscription ID and platform; `POST /notifications/devices/remove` (also DELETE devices) removes only the caller's association. User identity comes from auth, never request body. A hashed subscription primary-key claim prevents concurrent cross-account ownership, with a legacy-token ownership check and an atomic maximum-ten-device refresh. Re-enrollment updates the same token without duplicate entries. Login no longer trusts arbitrary `deviceToken` input. Existing global logout clears all that account's device associations and claims; invalid subscriptions returned by the provider are removed from its user record.

Mobile service methods expose authenticated enroll/unenroll contracts. **Native permission prompts, SDK installation, token acquisition/rotation callbacks and app-launch push navigation are not wired**: no native push SDK exists in the current dependency set. UUID syntax is validated; device possession/provider identity is not attested. Refresh requires native integration to unenroll the old ID and enroll the replacement. Orphan claims after partial database operations, account administration or invalid-token removal fail closed and require authorized reconciliation; no token-stealing override was added.

### H. Delivery reliability

In-app `Notification` persistence is separate from external send. Delivery stores state, attempt count, latest attempt time, next retry time, sanitized failure code and provider acceptance time. The existing server starts a 30-second monitor; each batch selects at most 20 due rows. Atomic pending/retry to processing claims limit each persisted event to three attempts; transient transport/429/5xx failures schedule 30-second then 120-second backoff. Third transient failure becomes permanent failure. Missing configuration, missing devices, revoked resources and inactive accounts are recorded separately. Generic push text contains only a notification ID, never private evidence links or workflow notes.

`provider_accepted` means the provider returned an ID and positive recipient count, **not delivery to a device**. No email/SMS delivery or delivery receipt is claimed. Existing producer idempotency keys and unique index remain; duplicate lookup also requires the same recipient. Concurrent claim losers do not send. Keys are producer-specific, not a guarantee that every legacy producer has one. Old rows without persisted delivery state are not automatically replayed.

Recovery limits: notification creation and workflow mutation are not transactional; a failed creation needs reconciliation. A process crash/provider hang can leave `processing` indefinitely; no unsafe age-based takeover or automated replay endpoint is supplied. A provider may accept before a network failure, so retries can produce up to the bounded number of sends; exactly-once delivery is not guaranteed. Operators must reconcile ambiguous acceptance, missing notifications and orphan claims before any deliberate replay. Latest attempt fields are retained, not a complete per-attempt audit ledger. All live delivery and cross-process MongoDB semantics remain unverified.

### I. Tests

Checks used the ignored prepared locked-dependency environment `.local-backups/environment-baseline-20261020/{lunas_backend,lunas_web}` because original dependency directories are incomplete. Current source was copied excluding private `.env*` files. Fixtures are synthetic local API/SDK mocks; browser tests do not exercise MongoDB, S3 or OneSignal.

| Component | Command | Passed | Failed | Skipped | Result | Limitations |
|---|---|---|---|---|---|---|
| Backend lint | `npm.cmd run lint` | check | 0 | 0 | PASS | Prepared environment |
| Backend full suite | `npm.cmd test -- --runInBand --json --outputFile=../step11-backend-results.json` | 717 | 2 | 40 | Existing failures remain | 759 tests; 66 passed / 2 failed / 1 skipped suites |
| Web lint / types | `npm.cmd run lint`; `npx.cmd tsc --noEmit` | checks | 0 | 0 | PASS | Prepared environment |
| Web build | `npm.cmd run build`; `npm.cmd run prepare:standalone` | checks | 0 | 0 | PASS | Process-only local fixture configuration |
| Web browser | `node scripts/run-playwright.mjs tests/notification-access.spec.ts tests/repair-staffing.spec.ts tests/agency-preparation.spec.ts tests/secretary-verification.spec.ts tests/agency-sla-integrity.spec.ts tests/field-role-provisioning.spec.ts` | 15 | 0 | 0 | PASS | 2 notification cases plus 13 prior regressions; fixture API |
| Mobile contracts | Dart `tool/verify_field_role_routes.dart`, `tool/verify_inspection_workflow.dart`, `tool/verify_repair_handoff.dart`, `tool/verify_citizen_tracking.dart` | 53 | 0 | 0 | PASS | 12+9+23+9 SDK-only checks; package config supplied except pure inspection script |
| Mobile targeted analysis | Direct `dart analyze` of the six modified `lib` paths in A | check | 0 | 0 | No issues | Does not analyze every app file |
| Flutter analysis / tests | `dart C:\src\flutter\bin\cache\flutter_tools.snapshot analyze --no-pub`; same snapshot `test --no-pub` | - | - | - | BLOCKED, each exit 1 | Cannot open `C:\src\flutter\bin\cache\lockfile`; SDK permissions unchanged |

Two unchanged baseline failures: `src/controllers/incidentValidation.test.js`, "returns submitted and clarification-required records only from the assigned barangay queue" expects an obsolete flat filter; `scripts/dagupan-seed-config.test.js`, "local accounts cover all canonical barangays and matching provider/repair organizations" expects 42 accounts instead of 69. No seed was executed. Do not interpret the suite as fully green.

Focused new tests cover unverified agency strings, missing/overdue/legacy SLA clocks, current scopes and destinations, revoked resources, enrollment claim conflicts and device cap, claim losers, safe push payloads, retry exhaustion, invalid subscriptions, unconfigured transport, provider response classification and unsafe signing references/lifetime caps. Ignored evidence: `step11-backend-tests.log`, `step11-backend-results.json`, `step11-web-build.log`, `step11-playwright.log` under the prepared environment root. Browser runner uses local ports 3100/5119 and closes its services.

### J. Data-security verification

Backend ownership tests and current-scope tests pass alongside the existing field-role access suite. Notification IDs alone cannot change recipient; resource IDs alone cannot bypass current scopes. New tests confirm admin denial, stale worker suppression, no arbitrary notification URL use, no unverified organization disclosure and no invented deadline. Existing evidence/RBAC regression tests pass at mocked boundaries. Real MongoDB uniqueness/concurrency, storage-object enforcement and actual device identity remain integration prerequisites.

### K. Previous safeguards preserved

R2-T01 through R2-T09 regression checks retain distinct field roles, authentication/rate limiting, durable inspection mutation claims, separate Secretary approval/category confirmation, routing provenance, unchanged SLA start/deadline semantics and terminal outcomes, evidence history and privacy gates, agency preparation without work authorization, and repair assignment acceptance/version checks. The 13 earlier workflow browser regressions pass. This is local regression evidence, not proof of production readiness or blanket verification of every previous feature.

### L. Remaining blockers

Evidence privacy/redaction and retention policy; live managed upload approval; unavailable full Flutter SDK checks; missing native push integration and provider/device credentials/deployment verification; email delivery; private S3 and legacy evidence integration; live MongoDB indexes and concurrency; durable recovery of missing/processing notifications and orphan subscriptions; cross-document reconciliation. Institutional approval/priority/SLA-start/work-authorization/closure and routing-exception authorities remain pending as recorded in Steps 5-10. No new authority or institution mapping was invented.

### M. Implementation status

| Area | Status | Verification boundary |
|---|---|---|
| Citizen status tracking | VERIFIED IMPLEMENTED | Serializer/model contracts and targeted analysis; live app unverified |
| Responsible agency visibility | VERIFIED IMPLEMENTED | Persisted provenance checks; live institutional configuration unverified |
| SLA transparency | VERIFIED IMPLEMENTED | Read-only projection; incomplete legacy clocks require reconciliation |
| Citizen notifications | PARTIALLY IMPLEMENTED | Existing event producers + current ownership checks; live delivery/recovery incomplete |
| Tanod notifications | PARTIALLY IMPLEMENTED | Current inspection authorization; native integration unverified |
| Secretary notifications | PARTIALLY IMPLEMENTED | Current barangay scopes; prior browser workflow regressions pass |
| Agency notifications | PARTIALLY IMPLEMENTED | Organization scope, intake navigation browser tested; live delivery incomplete |
| Repair Personnel notifications | PARTIALLY IMPLEMENTED | Current assignment checks; stale resources suppressed |
| Notification navigation | VERIFIED IMPLEMENTED | Backend scope tests, two web browser cases, mobile targeted analysis; native push tap unimplemented |
| Evidence retrieval | PARTIALLY IMPLEMENTED | Existing scopes + TTL/key tests; storage/legacy privacy unverified |
| Push enrollment | PARTIALLY IMPLEMENTED | Authenticated API/service contract; native SDK lifecycle absent |
| Delivery retries | PARTIALLY IMPLEMENTED | Persisted bounded state machine; crash/ambiguous-send recovery incomplete |
| Live integration | BLOCKED / POLICY PENDING | No live DB/storage/provider/device verification |

### N. Development backlog

R2-T10 remains partial. Preserve native SDK enrollment/rotation/logout/tap integration, authorized recovery tooling with ambiguity review, missing-event reconciliation, device ownership attestation, live index/provider/storage/device checks and privacy decisions as open work. Do not mark policy or infrastructure blockers complete from mocked tests. R2-T11 is the next bounded implementation task: operational reports, CSV security, pagination, filters and PDF export.

### O. Next developer handoff

Inspect the exact files in A, especially citizen projections, resource access, enrollment claims and delivery worker, then the existing `tanodWorkflowController.js`, `fieldIncidentAccess.js`, `workOrderService.js` and evidence serializers. Rerun I with current prepared-source hashes before interpreting results. Provision an isolated MongoDB/storage/provider test environment and a supported writable Flutter SDK through the normal development setup; verify real device subscription ownership, permissions, refresh, logout, invalid IDs and notification taps. Reconcile missing notifications, stuck processing attempts and legacy evidence before controlled replay. Keep privacy and maintenance authority gates intact. Proceed to **R2-T11 — Operational reports, CSV security, pagination, filters, and PDF export**; do not silently expand this task into authorization or infrastructure policy changes.

## STEP 10 — R2-T09 REPAIR PERSONNEL MANAGEMENT AND MAINTENANCE ASSIGNMENT

**R2-T09: PARTIALLY IMPLEMENTED; historical repair staffing/handoffs are locally verified at the stated boundaries, live integration UNVERIFIED.** Agency staffing routes are restored, assignments require worker decisions, and eligible in-progress handoffs preserve maintenance history. New work creation and protocol-9 activation remain **BLOCKED / POLICY PENDING** under Step 9. No official work authorization is fabricated. This current report supersedes the corresponding older repair findings; earlier reports are preserved below.

### A. Task information and exact files

Date: 2026-10-20, Asia/Shanghai; branch `revision`; HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`. Initial Git status contained tracked modifications and untracked source/tests from Steps 1–9; these were preserved. No commit, push, seed, migration, actual account/incident operation, production configuration, dependency change, private environment-file access or shared SDK permission change occurred.

Step 10 modified paths:

- `lunas_backend/src/routes/userRoutes.js`
- `lunas_backend/src/routes/workOrderRoutes.js`
- `lunas_backend/src/controllers/authorizedAccountController.js`
- `lunas_backend/src/controllers/workOrderController.js`
- `lunas_backend/src/services/workOrderService.js`
- `lunas_backend/src/controllers/fieldRoleAccess.test.js`
- `lunas_backend/src/controllers/repairPersonnelManagement.test.js`
- `lunas_backend/src/controllers/workOrderController.test.js`
- `lunas_backend/src/controllers/workOrderReassignment.test.js`
- `lunas_backend/src/controllers/workOrderWorkflow.test.js`
- `lunas_web/src/app/actions/work-orders.ts`
- `lunas_web/src/lib/work-orders.server.ts`
- `lunas_web/src/components/work-orders/work-order-detail.tsx`
- `lunas_web/tests/repair-staffing.spec.ts` (new)
- `lunas_mobile/lib/features/repair/data/models/repair_models.dart`
- `lunas_mobile/lib/features/repair/presentation/screens/work_order_details_screen.dart`
- `lunas_mobile/test/repair_models_test.dart`
- `lunas_mobile/tool/verify_repair_handoff.dart` (new)
- `README.md`

### B–C. Staffing restoration and actual workflow

Existing staffing controllers, validation, activation governance, personnel console and server actions were present. The regression was disconnected routes, not a missing staffing subsystem. Existing provider-scoped capabilities are reconnected without creating a second personnel directory or granting agency access to the Admin account API.

| Endpoint under /api/v1/users | Actual behavior |
| --- | --- |
| GET /repair-personnel | Agency Officer: existing explicit safe projection of non-archived own-organization Repair Personnel, including activation/status/availability. The earlier Secretary read alias still returns same-barangay Tanods for compatibility; it does not convert them to repair staff. New Secretary clients already use the dedicated Tanod endpoint. |
| POST /repair-personnel | Existing provider-only provisioning with role/organization fixed by the server, restricted input fields, pending activation, activation email and audit. No client password or organization override. |
| PUT /repair-personnel/:id | Existing permitted profile/team fields, own repair organization, account version, validation and audit. Login/role/organization cannot be changed through this form. |
| PATCH /repair-personnel/:id/status | Existing own-organization account-status governance, reason/version, session revocation and activation requirements. It cannot bypass pending activation or manage unrelated/archived accounts. |
| POST /repair-personnel/:id/activation | Existing pending-account invitation/cooldown/version rules, own organization and delivery result. |

The existing `repair-personnel.ts` actions and console now call valid endpoints; their files required no rewrite. Provider target-account lookups now include role, organization and archival restrictions in the query. Existing Admin governance remains independent. These software permissions reproduce current controller policy; they do not certify an institution's staffing mandate or actual agency participation.

For existing unmarked work orders: agency selects eligible personnel → assignment becomes pending → worker explicitly accepts or declines → accepted initial/corrective work can start → progress/evidence/completion use the existing protected repair pathway. In-progress replacement acceptance resumes the existing task context and does not restart maintenance.

### D. Repair mobile workflow

Independent `/repair` and `/tanod` navigation and existing protected repair dashboard, lists, location, evidence, history, notifications and progress screens were preserved. The repair detail now offers separate **Accept assignment** and **Decline assignment** actions for pending decisions. Decline requires a reason; successful decline returns to the work-order list. Errors/conflicts use authoritative refresh and existing API messages. Starting repair no longer implicitly accepts a pending task.

The model permits Start only after acceptance in accepted/rework_required states. An accepted in-progress replacement goes directly to existing progress actions. Pending handoffs cannot submit progress; contradictory pending/accepted indicators cannot unlock updates. Accepted workers cannot use pending-only decline to abandon active work; an officer handoff is required. Repair evidence cards now show retained photographs instead of hiding all but the newest. This is source and SDK/model verification, not device acceptance.

### E. Work-order transition matrix

| Current State | Actor | Action | Preconditions | Next State | History |
| --- | --- | --- | --- | --- | --- |
| pending, unassigned/declined | Own organization Agency Officer | assign | Historical compatibility; eligible worker; current version; incident available | pending + assignmentState pending | Fresh active pending assignment, actor/time/worker and notification |
| accepted before start | Own organization Agency Officer | reassign | Different eligible worker, reason/current version/current assignment | pending + pending decision | Previous assignment inactive/reassigned; reason and new assignment retained |
| in_progress | Own organization Agency Officer | reassign | Same organization; current active assignment or declined handoff; reason/version | in_progress + pending decision | Progress/start/evidence/SLA unchanged; previous worker revoked |
| rework_required | Own organization Agency Officer | assign/reassign as appropriate | Existing correction state; eligible worker and assignment guards | rework_required + pending decision | Existing correction/progress retained |
| pending + pending decision | Current worker | accept | Active account; current assignment/version; incident available | accepted + accepted decision | Assignment actor/time and acceptance history |
| in_progress/rework_required + pending decision | Current replacement worker | accept | Same guards | Overall state retained; assignment accepted | Earlier progress/timestamps/actors retained |
| pending/in_progress/rework_required + pending decision | Current worker | decline | Reason, current assignment/version; no already-accepted abandonment | Overall state retained; declined; current assignee cleared | Decline time/reason/notes retained; officer notified |
| accepted/rework_required + accepted decision | Current worker | start/resume | Current assignment/version; incident available | in_progress | Existing start time retained for corrective work |
| in_progress + accepted decision | Current worker | progress/evidence/completion | Current assignment/CAS; valid existing progress/evidence contract | Existing progress/review pathway | Append-oriented progress/photos, original attribution preserved |
| completed/closed/canceled or incompatible assignment | None through staffing | assign/reassign/accept/start | State fails guards | Denied; no reopening | No new authoritative transition |
| maintenanceProtocol=9 | None while policy unresolved | create/assign/accept/start/progress/evidence | Step 9 authority unavailable | Denied | No fabricated approval/readiness |

The actual persisted declined state is `assignmentState=declined`, with no current assignee; it does not delete the work order or reset its progress. Closed/canceled wording above describes rejected operations, not new lifecycle enum values.

### F. Eligibility, reassignment and former worker permissions

Eligible staff must be dedicated repair_personnel, active, non-archived, activated, not pending_activation/suspended/deactivated, available/assigned under current policy, in the exact repair organization and within any existing barangay restriction. Assigned staff remain selectable as before; no new exclusive-capacity or trade-certification policy was invented. Tanods/citizens are excluded. The eligible query itself now restricts organization and account eligibility, followed by the existing eligibility helper.

Reassignment binds the current assignment and work-order version. It rejects the same worker, missing reason, invalid/restricted destination and inappropriate lifecycle, including inconsistent started pending/accepted records. It deactivates the former record and appends a new pending decision without changing progress percentage, stages, notes, evidence, prior acceptance times, original actor attribution, start time or SLA. Previously declined in-progress handoffs can be reassigned while retaining overall in_progress.

Former workers immediately lose current query/mutation scope: they cannot accept, decline, add progress, attach evidence or complete a task after reassignment wins. No new former-worker historical-read entitlement was added; existing current-assignment scope remains authoritative. Organization transfer, reopening final work and final review authority were not enabled.

### G–H. Work authorization and security matrix

Both work-order creation routes retain their 409 policy denial. Protocol-9 assignment/acceptance/start/progress/evidence guards remain. Web detail now carries the protocol marker, hides staffing controls for those orders and displays the policy block. Staffing and worker acceptance do not authorize an incident, funding or maintenance. Unmarked historical orders retain Step 9 compatibility; this is not retrospective certification of official authorization. No new import/creation path can omit the marker to obtain supported new work.

| Core role | Repair staffing / maintenance permissions |
| --- | --- |
| Citizen | Existing own-report information only; no staffing or repair mutations |
| Barangay Tanod | Existing assigned inspections and dedicated navigation; not selectable as repair staff |
| Repair Personnel | Own current organization/assignment and valid work state; pending decisions and accepted progress; no agency staffing/approval |
| Secretary | Existing barangay monitoring/Tanod compatibility read; no agency repair account mutations or work assignment |
| Agency Officer | Own organization roster and preexisting scoped staffing governance; permitted historical work staffing/handoffs; no work-authorization override |
| Administrator | Existing authorized-account governance; no newly granted maintenance, incident-approval or closure powers |

All active-account, token, RBAC and organization/assignment checks remain server-side. UI controls supplement those checks.

### I. Concurrency and recovery guarantees

POST assign/reassign/accept/decline/start now requires a nonnegative integer `version` at the real router boundary. Web staffing actions send the displayed work-order version; mobile decision/start actions already send it. Old callers omitting it must update; they receive validation failure. Controllers reject supplied stale versions before effects and retain WorkOrder version/status/current-assignment CAS. Existing progress/evidence clients' supplied versions are now checked before image processing; their legacy optional-version contract remains, with current server snapshot CAS still enforced. Direct controller fixtures without a supplied version demonstrate server CAS only, not a stale-client guarantee.

Concurrent reassignment produces one current active assignment in controlled tests. Acceptance/reassignment bind the same version and current assignment, so incompatible snapshots cannot both commit. Completed retries conflict without duplicate authoritative history. Work-order notifications now use existing idempotency support with work-order/version/type/recipient keys; optional delivery failures do not erase committed staffing.

Staffing/worker actions preflight the incident for a held inspection claim, unreviewed/terminal state, mismatched current work-order pointer or conflicting responsible organization. Compatible incident states are provider_assigned, repair_assigned, in_progress, rework_required and city_correction_required; other historical combinations require reconciliation. Incident projection updates also exclude held claims. No claim is cleared. These reads are **not a cross-document lock**: an incident/participation/ownership change after preflight can still race the work-order write. Work-order CAS protects its own current assignment, not a MongoDB transaction spanning Incident/User/WorkOrder/audit/notification.

Availability, incident projection, audit and delivery remain sequential secondary operations. A failure after committed work-order CAS can require manual reconciliation; durable outbox/recovery and live overlap/failover tests remain incomplete. No automatic claim takeover or retry of unknown writes was added.

### J. SLA and evidence integrity

Assignment, acceptance, decline and reassignment write no SLA fields or priority. Progress/handoffs retain existing SLA start/deadline/warnings; there is no pause, extension, reset, final SLA decision or incident closure introduced here. Existing protected completion/review boundaries remain.

Inspection found a related history defect: progress/evidence uploads replaced `repairEvidence` and deleted old photographs. New uploads now append evidence and references. Attaching to a prior progress event requires that event's recorded updatedBy to be the current worker; another worker's or unattributed old event cannot be rewritten. General new evidence remains available through the authorized upload contract. Web and mobile detail expose the retained permitted photographs. Previously deleted/replaced historical photos cannot be reconstructed by this change; no restoration is claimed.

Known write conflicts clean up only the new upload batch. Historical files are not deleted. For an ambiguous persistence exception, new objects are retained and a reconciliation log records the work order, avoiding deletion of a possibly committed reference; definite validation/duplicate errors can clean the new batch. This can leave orphan objects requiring an approved recovery process. Managed validation, file limits, image processing/metadata stripping, private storage and signed retrieval remain mandatory. Default privacy processing still blocks real uploads as documented in Step 6. Mocks do not certify actual storage or prove end-to-end completion evidence.

### K. Actual verification

Refreshed current backend/web source, including untracked files, into `.local-backups/environment-baseline-20261020` with the previously installed locked dependencies, excluding private environment files. Final prepared/workspace source hashes matched (`Prepared source mismatches: []`). Backend/web commands run in those prepared packages; Dart commands run in workspace lunas_mobile. Logs reside in the prepared parent as step10-backend-tests.log, step10-backend-results.json, step10-web-build.log, step10-dart-analysis.log, step10-flutter-analyze.log and step10-flutter-tests.log.

| Component | Command | Passed | Failed | Skipped | Result | Limitations |
| --- | --- | --- | --- | --- | --- | --- |
| Backend lint | `npm.cmd run lint` | lint | 0 | — | exit 0 | Static source only |
| Backend | `npm.cmd test -- --runInBand --json --outputFile=../step10-backend-results.json` | **680 tests / 61 suites** | **2 tests / 2 suites** | **40 tests / 1 suite** | exit 1; 722 tests / 64 suites total | Same unrelated failures; no actual DB integration |
| Web lint / types | `npm.cmd run lint`; `npx.cmd --no-install tsc --noEmit` | both | 0 | — | exit 0 | Static validation |
| Web production | `npm.cmd run build` | build | 0 | — | exit 0 | Fixture-only process environment, no deployment |
| Browser | `npm.cmd run prepare:standalone`; `node scripts/run-playwright.mjs tests/repair-staffing.spec.ts tests/agency-preparation.spec.ts tests/secretary-verification.spec.ts tests/agency-sla-integrity.spec.ts tests/field-role-provisioning.spec.ts` | **13** | **0** | 0 | exit 0 | Local standalone web/fixture API, not real backend/DB |
| Repair contracts | Cached `dart.exe --packages=.dart_tool/package_config.json tool/verify_repair_handoff.dart` | **23** | 0 | 0 | exit 0 | SDK-only models |
| Prior mobile contracts | Cached `dart.exe --packages=.dart_tool/package_config.json tool/verify_field_role_routes.dart`; `dart.exe tool/verify_inspection_workflow.dart` | **12 + 9** | 0 | 0 | exit 0 | SDK-only role/inspection contracts |
| Targeted Dart analysis | Cached `dart.exe analyze lib/features/repair/data/models/repair_models.dart lib/features/repair/presentation/screens/work_order_details_screen.dart` | no issues | 0 | — | exit 0 | These two files only, not full Flutter |
| Dart formatting | Cached `dart.exe format --output=none --set-exit-if-changed` on the four modified/new Dart files | 4 files unchanged | 0 | — | exit 0 | Formatting only |
| Full Flutter | Cached Dart runs `C:\src\flutter\bin\cache\flutter_tools.snapshot analyze --no-pub` and `test --no-pub` | — | environment | — | both exit 1 | Cannot access `C:\src\flutter\bin\cache\lockfile`; shared SDK permissions unchanged |
| Workspace | `git diff --check` | diff | 0 | — | exit 0 | Formatting only |

Unchanged failures: `incidentValidation.test.js` — `sequential incident review workflow returns submitted and clarification-required records only from the assigned barangay queue` (old filter expectation); `scripts/dagupan-seed-config.test.js` — `local accounts cover all canonical barangays and matching provider/repair organizations` (expected 42/current 69). Neither was changed to manufacture a green suite.

Affected earlier tests were updated for pending decisions, explicit acceptance, supported in-progress handoff and append-only photos, rather than retaining contradictory auto-accept/delete expectations. New local cases cover restored real routers, account activation/scope/override denial, restricted worker selection, stale versions, held incident claims, concurrent handoffs, former-worker progress denial, progress/SLA preservation, cross-worker photo denial and ambiguous upload retention. Existing full-suite security/routing/agency/inspection/evidence regressions remain. Browser checks exercise roster/provisioning delivery status, in-progress handoff version/reason/conflict handling and pending replacement visibility alongside prior workflow regressions. Initial browser assertions were corrected for responsive duplicate roster content and the existing standardized conflict message; final checks passed.

### L–N. Remaining blockers, implementation status and backlog

| Area | Status |
| --- | --- |
| Staffing endpoints | VERIFIED IMPLEMENTED at isolated actual-router/model-fixture boundary |
| Staffing web UI | VERIFIED IMPLEMENTED with fixture API/browser; live UNVERIFIED |
| Repair mobile navigation | VERIFIED IMPLEMENTED at SDK role-contract boundary; device UNVERIFIED |
| Assignment / acceptance / decline | VERIFIED IMPLEMENTED at controlled API/controller/model boundaries; device integration UNVERIFIED |
| In-progress reassignment | VERIFIED IMPLEMENTED with deterministic CAS fixtures and browser controls; live MongoDB UNVERIFIED |
| Historical compatibility | VERIFIED IMPLEMENTED at local regression boundary; actual records not migrated/certified |
| Progress/evidence preservation | PARTIALLY IMPLEMENTED: retained/append-only source and mock checks; old deleted photos unrecoverable here, live privacy/storage blocked |
| RBAC | VERIFIED IMPLEMENTED at scoped local boundary; deployed acceptance UNVERIFIED |
| Concurrency | PARTIALLY IMPLEMENTED: version/current-assignment CAS and incident preflight; cross-document races/recovery remain |
| Live integration | IMPLEMENTED — UNVERIFIED |

R2-T09 remains **PARTIAL** overall. Preserve pending institutional work-authorization authority, actual agency participation/staff-management mandate, legacy lifecycle conversion/recovery, managed-evidence privacy policy, full Flutter/device validation, live MongoDB concurrency, private storage integration, real email/push delivery, outbox/reconciliation and final closure authority. No new work authorization, SLA start/extension, agency transfer or closure policy was inferred. Other R2 backlog statuses remain unchanged.

### O. Next developer handoff

Inspect userRoutes and existing authorizedAccountController staffing governance; workOrderController assign/accept/decline/start/progress/evidence/preflight helpers; workOrderService eligibility; real router version validators; web staffing actions/detail; repair_models/detail; and current tests first. Preserve separate Tanod/Repair scopes, Step 9 protocol-9/new-work blocks, original attribution, append-only photos, SLA timing and held incident claims. Old callers must send the current decision version. Legacy progress events without an actor require reconciliation instead of attaching photos under a guessed owner.

Rerun the commands above, then verify an isolated MongoDB plus actual web/API/Flutter/storage/delivery lifecycle: competing handoffs/acceptance/progress, suspension, stale/former-worker access, unknown writes, secondary-operation failure and photo retrieval. Do not point opt-in account tests at shared/application data. No mongod/Docker executable was available here and no real database writes occurred. Confirm account staffing/work-authorization mandate and approved legacy conversion before enabling new maintenance. Recommended next task: **R2-T10 — Citizen transparency, notifications, task evidence access and delivery reliability**, including durable recovery and actual client delivery evidence.

## STEP 9 — R2-T08 AGENCY ASSESSMENT AND WORK AUTHORIZATION

**R2-T08: PARTIALLY IMPLEMENTED. Work authorization, maintenance readiness and new work-order creation remain BLOCKED / POLICY PENDING. Live integration is UNVERIFIED.** Explicit agency receipt, assessment, optional external tracking and protected dispute visibility are implemented and tested at isolated API/browser boundaries. No official work-authorizing position or approved capability was established in the current repository. This report supersedes the corresponding older agency-workflow findings; all previous reports remain below.

### A. Implementation information and exact files

Date: 2026-10-20, Asia/Shanghai. Branch: `revision`. HEAD: `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`. Starting Git status was dirty, with tracked/untracked Step 1–8 changes; those changes were preserved. No commit, push, deployment, seed, migration, real account/incident operation, dependency change, private environment-file access or SDK permission change occurred.

Step 9 modified paths:

- `lunas_backend/src/controllers/tanodWorkflowController.js`
- `lunas_backend/src/controllers/incidentController.js`
- `lunas_backend/src/controllers/workOrderController.js`
- `lunas_backend/src/controllers/fieldRoleAccess.test.js`
- `lunas_backend/src/models/Incident.js`
- `lunas_backend/src/models/WorkOrder.js`
- `lunas_backend/src/models/agencyPreparationSchema.js` (new)
- `lunas_backend/src/services/agencyPreparationService.js` (new)
- `lunas_backend/src/services/agencyPreparationService.test.js` (new)
- `lunas_backend/src/routes/incidentRoutes.js`
- `lunas_web/src/app/actions/tanod-workflow.ts`
- `lunas_web/src/lib/work-orders.server.ts`
- `lunas_web/src/components/work-orders/agency-preparation.tsx` (new)
- `lunas_web/src/components/work-orders/provider-incident-detail.tsx`
- `lunas_web/src/components/work-orders/work-order-list.tsx`
- `lunas_web/src/app/(protected)/validation-routing/exceptions/page.tsx`
- `lunas_web/tests/agency-preparation.spec.ts` (new)
- `lunas_web/tests/agency-sla-integrity.spec.ts`
- `README.md`

### B. Current agency workflow

The existing organization-scoped intake/detail workspace now offers explicit **Acknowledge agency receipt**. It records actor/time and starts a versioned preparation record without creating work, changing Secretary findings, or altering SLA. Opening a page makes no acknowledgment mutation.

After acknowledgment, an Agency Officer may record a human assessment: category snapshot, outcome, notes, maintenance requirements, resource availability, recommended approach, optional reference and, for external cases, process description. Outcomes are `routine`, `external`, `responsibility_review` and `clarification`. Assessments append records; revised assessments create a new revision and tracking cycle while preserving earlier assessments and milestone history. A clarification assessment records the request in assessment notes; it does not create a citizen/Tanod reply workflow or overwrite the separate Secretary clarification process.

Routine work enters `routine_pending_authorization`; it never requires bidding. External work enters `pending_external_processing` and allows applicable manual tracking milestones. A responsibility dispute preserves the current organization and changes routingReview to `review_required` / `agency_responsibility_dispute`. The existing Secretary exception queue now also includes these same-barangay approved assigned disputes. Further preparation is blocked until an authorized routing-review procedure exists; no transfer or dispute override was introduced.

Authorization and readiness are distinct blocked operations. No successful work authorization, maintenance-ready transition or new work-order creation is claimed.

### C. Agency state-transition matrix

Every successful preparation operation also requires the current exact organization, `provider_assigned`, valid routing provenance/matched outcome, category confirmation, approved verified current initial inspection, no unresolved Secretary clarification, no work order/completion task, an available incident claim and the exact preparation revision.

| Current State | Authorized Actor | Action | Required Conditions | Next State | Evidence |
| --- | --- | --- | --- | --- | --- |
| Routed, no preparation | Current organization Agency Officer | acknowledge | expectedVersion=0; current Secretary review actor/time | acknowledged | Express/JWT acknowledgment test; browser receipt check |
| Acknowledged / previously assessed | Current organization Agency Officer | assess routine | Required notes/requirements/resources/approach; current revision | routine_pending_authorization | Pure transition + API tests |
| Acknowledged / previously assessed | Current organization Agency Officer | assess external | Same fields plus external process type | pending_external_processing | API + browser tests |
| Acknowledged / previously assessed | Current organization Agency Officer | assess responsibility_review | Required assessment fields | responsibility_review; routing review pending, assignment retained | API dispute/queue test |
| Acknowledged / previously assessed | Current organization Agency Officer | assess clarification | Required assessment fields | assessment_clarification | Pure transition test |
| pending_external_processing | Current organization Agency Officer | external milestone | Current external assessment/revision, remarks; optional reference/follow-up | pending_funding, for_bidding or awaiting_work_authorization | Transition/API tests |
| pending_funding | Current organization Agency Officer | external milestone | Same guards | for_bidding or awaiting_work_authorization | Transition/API tests |
| for_bidding | Current organization Agency Officer | external milestone | Same guards | bidding_completed | API history test |
| bidding_completed | Current organization Agency Officer | external milestone | Same guards | awaiting_work_authorization | API history test |
| Any preparation state | No established institutional authorizer | authorize / ready | Approved authority unavailable | 409; no authorization/readiness mutation | API and pure negative tests; disabled browser controls |
| Existing assignment disputed / stale revision / incompatible lifecycle | None through this action | bypass or retry | Guard fails | Denied; authoritative history unchanged | Scope, conflict and retry tests |

Preparation leaves the incident lifecycle status `provider_assigned`; the dedicated agencyStatus expresses preparation progress. It does not invent repair lifecycle transitions.

### D. External-processing rules

The five supported tracking milestones are `pending_external_processing`, `pending_funding`, `for_bidding`, `bidding_completed` and `awaiting_work_authorization`. Applicable paths can skip funding and bidding; these are software tracking choices, not assertions about official government/private utility procedure. Tracking cannot go backward, repeat a milestone or skip from `for_bidding` to an authorization label. A revised human assessment can begin a new cycle; earlier records remain attributable to their assessment revision.

Updates retain previous/new milestone, assessment revision, officer, organization, timestamp, remarks, optional reference and optional valid follow-up date. The web shows preparation and external history, including references/follow-up information. No bidder, bid, contract, award, budget approval, payment or fabricated government document is created. No additional evidence-upload path was added. **Bidding Completed never means Work Authorized.** Reaching awaiting_work_authorization records tracking progress only; it does not certify external administrative completion or authorize work.

### E. Work-authorization policy and readiness

Current organization Agency Officers may record assessment and external progress. That permission does not establish approval authority. The embedded authorization data shape reserves organization, assessment revision, authorizing actor/time, type/reference/basis and policy reference, but no action populates it. A request-supplied authorization, priority, SLA object or readiness label cannot populate it through preparation operations.

`authorize` and `ready` return 409 while policy is unresolved, even with a supplied reference or authorization-shaped object. `maintenanceReady` fails closed; the official response explicitly reports false. Blocked policy attempts use best-effort existing audit logging without appending an authoritative approval. Other validation/state denials return normal errors; there is no new complete denied-request audit subsystem.

Both work-order creation entry points retain the Step 4 fail-closed 409 handler. There is **no positive new-work creation path** until an approved authorizing capability, evidence/basis requirements, readiness procedure and SLA-start policy are established. No role, including Admin, can enable work by changing an agency label. A preexisting reserved authorization object alone is insufficient.

### F. API, database and historical compatibility

New POST `/api/v1/incidents/:id/agency-preparation` reuses authentication, active-account checks, utility_provider RBAC, Mongo ID validation and the durable incident-mutation claim. `operation` is acknowledge/assess/external/authorize/ready; `expectedVersion` is required, integer and nonnegative. Acknowledge starts at version 0. Assessment outcome and required text are validated before mutation; notes max 4,000, requirements/resources/approach max 2,000, external process type max 120, optional reference max 200. External remarks require 2–2,000 characters; optional follow-up must parse as a valid date. Server whitelists persisted fields and binds actor/organization/category to stored records, not request identity fields.

`Incident.agencyPreparation` is an optional embedded schema containing protocol=9, revision, receipt, assessments, external history, reserved authorization and preparation history. Existing agencyStatus values remain valid; preparation statuses are additive. No historical approvals are fabricated and no bulk conversion runs. The full preparation payload is exposed only on the current organization Agency Officer's scoped incident detail. Secretary/citizen/field projections retain safe status/timestamp information without internal assessment remarks or preparation staff records. Dispute queue data uses its existing explicit projection, now including the retained responsible organization.

Newly validated WorkOrder documents receive `maintenanceProtocol=9` only when `isNew` is true. Existing stored orders have no default retroactively applied. Direct assignment/reassignment, acceptance, start, progress and evidence mutations reject protocol-9 orders while authorization remains blocked; decline remains a safe non-activation action. Both creation routes reject regardless of marker. This also protects a new-protocol order accidentally inserted by an internal integration from being activated through these APIs. Direct database/bulk writers are outside this controller guarantee and require their own approved operational controls.

Existing unmarked work orders retain their existing scoped read, assignment, progress and correction paths. This explicit compatibility rule preserves recorded work and history; it does **not certify that every legacy order had an official authorization**. There is no supported new-work import route that may omit the marker to bypass policy. Review and repair-closure authority were not redesigned. Any future legacy conversion requires authorized inventory, backup, isolated dry-run, ambiguity review and rollback; none occurred here.

### G–H. Web integration and authorization matrix

The existing provider intake detail embeds `AgencyPreparationPanel` for new routed cases. It has explicit receipt, validated human assessment, conditional external controls, errors/loading, current status/organization, read-only history and disabled authorization/readiness controls. Successful actions revalidate and refresh server state; failed actions retain displayed state. Legacy work-order progress controls remain for historical cases. Intake register wording now says Agency intake / assessment. The existing routing exceptions page displays the retained responsible organization for disputes. There is no duplicate portal, procurement UI or new mobile workflow.

| Core role | Agency preparation / scope |
| --- | --- |
| Citizen | Existing own-report reads and safe agency status; no internal assessment, milestone mutation or approval |
| Barangay Tanod | Existing assigned-inspection scope and safe incident status; no assessment/authorization |
| Repair Personnel | Existing scoped historical work and assigned inspections as applicable; no agency preparation; new-protocol activation denied |
| Secretary | Existing same-barangay monitoring and approved dispute queue; no agency assessment, authorization or transfer override |
| Agency Officer | Exact currently responsible organization; acknowledge/assess/track permitted cases; no unapproved work authorization |
| Administrator | Existing system/account oversight only; no new agency decisions, maintenance authorization or closure authority |

Wrong-organization requests fail at query scope; non-provider roles fail route RBAC; inactive/suspended accounts fail existing authentication. No new per-agency software roles were added.

### I–J. SLA, notifications, history and concurrency

Preparation writes no priority, SLA start/deadline/state/pause/extension, work-order, evidence or Secretary finding fields. New milestones cannot be used via legacy `/agency-status`; any incident with agencyPreparation is denied by that progress action. Pending funding/bidding does not pause or extend SLA. Existing SLA timing and marker fields are preserved, including missing timing; no new start authority is invented.

Preparation and external histories retain actors, organization, timestamps, prior/new status, references and applicable remarks. Incident status history gets a safe summary with revision; private assessment text stays in the preparation record. Existing verification_update notifications tell the reporter and original Secretary about the safe status, never include private assessment notes/photo URLs and do not claim repairs started. Notifications are sent after save using the existing history-position idempotency keys; failures are logged by the shared helper and do not erase the action. Audit failure after commit is logged; there is no durable outbox or guaranteed external delivery.

Mutations reuse the nonexpiring conditional incident claim and exact preparation revision. Concurrent receipt or assessments produce one success and one conflict in controlled tests. Completed stale retries append no extra history or notifications. A persistence failure keeps the claim for explicit reconciliation; no timeout takeover or claim clearing is added. Existing Inspection version gates, routing checks and repair CAS remain. Agency preparation saves one Incident document, while claims, audit and notifications are separate operations; no live transaction/failover guarantee is asserted. Current participation/routing revocation races and configuration governance retain the Step 8 limitations.

### K. Actual test execution

Prepared source copies under `.local-backups/environment-baseline-20261020` were refreshed from current tracked/untracked backend/web source, excluding private environment files, using the already installed locked dependencies. Final source hashes matched the workspace (`Prepared source mismatches: []`). Commands below run in the corresponding prepared package; mobile commands run in the workspace lunas_mobile directory.

| Component | Command | Passed | Failed | Skipped | Status | Limitations |
| --- | --- | --- | --- | --- | --- | --- |
| Backend lint | `npm.cmd run lint` | lint | 0 | — | exit 0 | Current source, no live DB |
| Backend suite | `npm.cmd test -- --runInBand --json --outputFile=../step9-backend-results.json` | **662 tests / 61 suites** | **2 tests / 2 suites** | **40 tests / 1 suite** | exit 1; 704 tests, 64 suites total | Same two unrelated failures; model/API fixtures, real DB tests skipped |
| Web lint | `npm.cmd run lint` | lint | 0 | — | exit 0 | Source/static validation |
| Web types | `npx.cmd --no-install tsc --noEmit` | types | 0 | — | exit 0 | Source/static validation |
| Web build | `npm.cmd run build` | build | 0 | — | exit 0 | Fixture-only process environment; no deployment |
| Browser | `npm.cmd run prepare:standalone`; `node scripts/run-playwright.mjs tests/agency-preparation.spec.ts tests/secretary-verification.spec.ts tests/agency-sla-integrity.spec.ts tests/field-role-provisioning.spec.ts` | **10** | **0** | 0 | exit 0 | Local Chromium, standalone web 3100, fixture API 5119; no actual backend/DB |
| Mobile routes | Cached `dart.exe --packages=.dart_tool/package_config.json tool/verify_field_role_routes.dart` | **12** | 0 | 0 | exit 0 | SDK-only contracts |
| Mobile inspection models | Cached `dart.exe tool/verify_inspection_workflow.dart` | **9** | 0 | 0 | exit 0 | SDK-only contracts |
| Workspace | `git diff --check` | diff | 0 | — | exit 0 | Formatting only |

Known backend failures were not modified: `incidentValidation.test.js` — `sequential incident review workflow returns submitted and clarification-required records only from the assigned barangay queue` (old flat status-filter expectation), and `scripts/dagupan-seed-config.test.js` — `local accounts cover all canonical barangays and matching provider/repair organizations` (expected 42/current 69). Logs: `step9-backend-tests.log`, `step9-backend-results.json`, `step9-web-build.log` in the prepared environment parent.

New pure/API coverage verifies receipt, actor/time, required fields, four assessment outcomes, optional external paths, milestone history, bidding-not-authorization, scope/role/suspended-account denial, preserved SLA/Secretary findings, internal remark privacy, dispute queue, stale and overlapping requests, held-claim recovery, legacy progress bypass denial and direct create/assign/accept/start protection for new work. Existing full-suite auth/rate/CAPTCHA/evidence/reference/SLA/inspection/history regressions remain. Browser checks cover receipt, required external assessment/current revision, disabled approval/readiness, stale milestone errors and prior Secretary/account/SLA UI behavior.

Intermediate checks found and fixed a misplaced serializer projection and a test model-query spy omission. Initial browser checks also found an exact-label lookup mismatch and a duplicate responsive text selector; the milestone select now has an explicit accessible label and the regression assertion targets main-content. Final results above are from corrected source. Mocked concurrent tests do not establish real MongoDB atomicity.

No mobile source contract changed; existing clients may display newly added agencyStatus labels generically. Full Flutter analyze/tests were not rerun: the previously evidenced shared SDK lockfile access and missing cached url_launcher remain unresolved. No isolated mongod/Docker executable was available; no actual MongoDB, evidence storage, delivery, device or end-to-end client/API integration was exercised. Step 6 default photo privacy policy remains blocked. No new AI verification is claimed.

### L–N. Policy decisions, status and backlog

| Area | Implementation status |
| --- | --- |
| Agency acknowledgment | VERIFIED IMPLEMENTED at isolated API/browser boundaries; live UNVERIFIED |
| Agency assessment | VERIFIED IMPLEMENTED at isolated API/browser boundaries; clarification reply integration incomplete |
| Routine maintenance determination | VERIFIED IMPLEMENTED as a recorded assessment, never approval |
| External tracking / status history | VERIFIED IMPLEMENTED at pure/API/browser boundaries; real external references UNVERIFIED |
| Work-authorization record | IMPLEMENTED — UNVERIFIED reserved schema only; no authorization recorded |
| Authorization decision | BLOCKED / POLICY PENDING |
| Maintenance-readiness guards | VERIFIED IMPLEMENTED as fail-closed boundaries; successful readiness BLOCKED |
| Work-order creation integration | PARTIALLY IMPLEMENTED: bypass prevention and legacy compatibility; positive creation BLOCKED |
| Web UI | VERIFIED IMPLEMENTED at fixture browser boundary; actual backend integration UNVERIFIED |
| Live database integration | IMPLEMENTED — UNVERIFIED |

R2-T08 remains **PARTIAL**, not complete. Required institutional decisions remain: agency work-authorizing positions/capabilities, routine-maintenance approval/basis/reference procedure, applicability of outside-process milestones, officially participating agencies and ownership/coverage data, dispute/transfer authority, priority authority, SLA start/external elapsed-time effects and deadline amendment rules, and final repair review/closure authority. No approval capability configuration is enabled without those decisions. R2-T07 remains partial and other backlog items retain their earlier statuses.

### O. Next developer handoff

Inspect agencyPreparationService, agencyPreparationSchema, updateAgencyPreparation/listAgencyExceptions, Incident/WorkOrder protocol fields, workOrderController activation guards, current serializers, agency-preparation panel, server action and new tests first. Preserve organization scopes, separate Secretary review, claim/version gates, append-oriented history, private evidence, existing SLA and historical repair compatibility. Implement a confirmed authorizing capability and explicit readiness predicates before adding a successful new-work creation path; bind its authorization to current organization/assessment and routing revision, establish durable recovery and an approved legacy conversion process. Do not merely flip maintenanceReady or populate an authorization reference.

Rerun the exact checks above and then test a disposable restored MongoDB plus actual web/backend/storage delivery before claiming operational completion. Verify real same/wrong organization, deactivation, stale revisions, overlapping claims, partial saves and historical repair access. Recommended next assigned task: **R2-T09 — Repair Personnel management, assignment, acceptance/decline and safe reassignment**, preserving the policy-blocked new-maintenance boundary.

## STEP 8 — R2-T07 AUTOMATED JURISDICTION-AWARE AGENCY ROUTING

**R2-T07: PARTIALLY IMPLEMENTED; live integration UNVERIFIED; institutional data, configuration governance, dispute resolution and transfer authority BLOCKED / POLICY PENDING.** This current report supersedes Step 7's category-routing description. All earlier reports are preserved below.

### A. Implementation information and exact files

2026-10-20, Asia/Shanghai; branch `revision`; HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`. Initial Git status was dirty, with tracked and untracked Step 1-7 implementation, tests and infrastructure changes; all were preserved. No commit/push, seed, migration, real account/incident operation, production configuration, dependency change or shared SDK permission change was performed. Private environment files were not read or changed.

Step 8 files:

- `lunas_backend/src/models/AgencyRoutingRule.js` (new)
- `lunas_backend/src/services/agencyRoutingService.js` (new)
- `lunas_backend/src/services/agencyRoutingService.test.js` (new)
- `lunas_backend/src/models/Incident.js`
- `lunas_backend/src/controllers/tanodWorkflowController.js`
- `lunas_backend/src/controllers/incidentController.js`
- `lunas_backend/src/controllers/fieldRoleAccess.test.js`
- `lunas_web/src/app/(protected)/validation-routing/exceptions/page.tsx`
- `lunas_web/tests/secretary-verification.spec.ts`
- `lunas_web/tests/agency-sla-integrity.spec.ts`
- `README.md`

### B. Routing architecture and configuration requirements

Removed `CATEGORY_AGENCIES`, including the unsupported gas-to-DPWH mapping. The canonical five categories remain unchanged. `AgencyRoutingRule` is a minimal versioned routing master record with a stable agency ID, exact legacy organization binding, display name, category, asset type, owner ID, explicit city/barangay coverage, participation/activity flags, approval actor/reference, effective dates and timestamps. It is not a complete agency registry or participation-management console. No data is seeded or activated; flags default false. A unique rule/version index is declared, not verified deployed.

`Incident.routingAsset` holds structured asset type/owner ID and verification actor/time/reference. Neither citizen submission nor Secretary approval accepts these facts from request bodies. There is deliberately no configuration/asset write API while the responsible authority and data-verification process remain unresolved. Approved records can be consumed by the resolver, but production configuration entry and governance are incomplete. Test facts are synthetic only and establish no Dagupan ownership or participation.

The deterministic resolver requires canonical category, verified asset facts with a valid nonfuture timestamp, explicit city and canonical barangay. Exact category/asset/owner/city/barangay conditions must match. Every matching rule must be approved, active, participating and currently effective. One match routes; multiple matches remain pending, including duplicate/overlapping versions for the same agency. No arbitrary ordering or priority resolves a conflict. A receiving organization must also have an eligible active `utility_provider` account. Configuration/query failures become recoverable pending exceptions rather than erasing Secretary approval.

Stable agency ID/rule/version persist on routing and its appended history; exact legacy organization strings continue to enforce all current provider scopes. No user/work-order organization fields were deleted or migrated. Immutable configuration administration, verified organization-to-ID uniqueness across all categories, revocation races and approved asset data entry remain unimplemented operational requirements.

### C. Routing decision matrix

| Condition | Routing Result | Responsible Process | Evidence |
| --- | --- | --- | --- |
| Current verified initial findings, independent Secretary approval, confirmed category, unique valid ownership/coverage rule and eligible provider | provider_assigned; agencyStatus remains not_routed | Existing guarded Secretary review + resolver | Synthetic HTTP routing/provenance/notification test |
| Category alone, missing owner or verification provenance | Approved, awaiting review; unknown_ownership | Authorized institutional asset verification pending | Resolver + approval regressions |
| Missing explicit city / canonical barangay | missing_jurisdiction; no assignment | Jurisdiction data verification pending | Resolver tests |
| No matching rule | no_matching_configuration | Approved configuration process pending | Resolver tests |
| Multiple matching rules | conflicting_configuration; candidates retained internally | Dispute authority pending | Resolver tests |
| Inactive, unapproved, expired or malformed matching rule | inactive_or_invalid_configuration | Participation/configuration governance pending | Resolver tests |
| No eligible receiving account | no_active_participating_account | Authorized account/participation process | Resolver test |
| Configuration read failure | configuration_unavailable; approval retained | Operational reconciliation | Resolver failure test |
| Existing assignment, unresolved clarification, stale review/version, wrong scope/current pointer/type or held claim | Deny; no transfer or duplicate route | Existing claim/current-inspection protections | API and prior concurrency regressions |

No real agency mapping has been institutionally verified. DPWH, City Engineering and water/electricity providers have no automatic entitlement from their names or categories.

### D. Exceptions and authority

Existing GET `/incidents/agency-exceptions` now exposes only same-barangay, approved initial-inspection records waiting for routing, through an explicit projection. The redirecting web page is replaced with a functional read-only queue: reference/link, approved category, barangay, description, approval timestamp, reason, candidate rule/agency versions and routing history. The detail link provides existing authorized location information. No evidence storage keys, citizen profiles or global provider directory are returned by this endpoint. Queue is bounded to the latest 100 prefiltered records, with approval filtering after that limit; pagination and completeness for larger queues remain a limitation.

One `routingReview` snapshot per incident records outcome, reason, candidates and evaluation time; routing/status history remains append-oriented. Legacy approved unrouted records can appear with legacy_configuration_review_required. This is not a second case collection. Visibility is implemented; authoritative dispute resolution, corrections, retry/re-evaluation after approval, and durable exception-event history beyond existing routing/status history are incomplete. No role receives an override. Pending configuration does not silently route an already-approved case later.

### E. Corrections, transfers and compatibility

No approved cross-agency transfer mandate was found. Manual routing remains the Step 4 guarded denial; existing assigned incidents cannot be reassigned through initial approval. No transfer endpoint or successful transfer claim is provided. Active work, corrective orders, contractual/financial handling and former/new agency transition acceptance remain blocked pending explicit authority. Evidence, original category, inspection records, work orders and SLA clocks are not rewritten.

No bulk migration is needed for this additive schema. Before any future conversion: obtain authorization and backup; inventory exact organization values read-only; produce an approved one-to-one organization/agency mapping, flag ambiguous names; dry-run IDs/counts in an isolated restored database; preserve original strings and all historical references; compare scope access; prepare rollback from backup before executing. No migration/dry-run against actual records occurred here.

### F. Routing permissions

| Core role | Routing permissions |
| --- | --- |
| Citizen | Existing own-report scope; safe additive agencyAssignment projection; no routing/configuration decisions |
| Barangay Tanod | Existing assigned inspection scope; findings do not route or approve |
| Repair Personnel | Existing current work-order scope; no routing actions |
| Secretary | Existing same-barangay assigning-Secretary review gates; protected exception visibility; no dispute/transfer override |
| Agency Officer | Existing exact organization scope after valid assignment; no cross-agency access or override |
| Administrator | Existing account/oversight authority only; no new incident approval, dispute or closure powers |

### G-H. Maintenance, SLA, notifications and transparency

Routing creates no work order, assessment, budget approval, procurement milestone, repair assignment, maintenance authorization, priority amendment, SLA start/reset or closure. Agency receipt here means dashboard eligibility and best-effort scoped notification, not human acknowledgment. R2-T08 remains responsible for assessment/readiness.

Receiving eligible provider accounts receive agency_report_routed only after incident save. The reporter receives the existing accurate verification update; approved pending reports additionally notify the assigning Secretary. Existing idempotency keys/history positions and no-private-photo notification payloads remain. Citizen serializers add only assigned organization or awaiting_agency_assignment, without candidate rules, ownership allegations, internal review notes or staff identities. Mobile presentation does not yet render this new additive property; broader transparency belongs to R2-T10.

### I-J. Actual tests and concurrency limits

Checks used refreshed source copies with prepared locked dependencies under `.local-backups/environment-baseline-20261020`, excluding private environment files. Commands run from each prepared package unless noted:

| Check | Actual result |
| --- | --- |
| Backend `npm.cmd run lint` | PASS |
| Backend `npm.cmd test -- --runInBand --json --outputFile=../step8-backend-results.json` | Exit 1: **623 passed, 2 failed, 40 skipped**; suites 60 passed, 2 failed, 1 skipped (63 total); 665 tests |
| Web `npm.cmd run lint`; `npx.cmd --no-install tsc --noEmit` | PASS |
| Web `npm.cmd run build` | PASS; log step8-web-build.log |
| Web `npm.cmd run prepare:standalone`; `node scripts/run-playwright.mjs tests/secretary-verification.spec.ts tests/agency-sla-integrity.spec.ts tests/field-role-provisioning.spec.ts` | **7 passed**; loopback fixture API only |
| Mobile cached `dart.exe --packages=.dart_tool/package_config.json tool/verify_field_role_routes.dart` | **12 passed** in lunas_mobile |
| Mobile cached `dart.exe tool/verify_inspection_workflow.dart` | **9 passed** in lunas_mobile |

Known backend failures are unchanged: `sequential incident review workflow returns submitted and clarification-required records only from the assigned barangay queue` (`incidentValidation.test.js`, stale queue filter expectation), and `local accounts cover all canonical barangays and matching provider/repair organizations` (`scripts/dagupan-seed-config.test.js`, expected 42/current 69). They were not changed to manufacture a green suite.

New resolver tests cover exact matching, missing facts, wrong owner/type/city/category, invalid/inactive/expired configurations, ambiguous matches, configuration availability and missing accounts. Actual Express/JWT/router fixtures cover successful persisted provenance/provider notification, category-only fallback, approval retention, queue projection/role denial and existing-assignment transfer denial. Existing deterministic overlapping claims, stale review, partial persistence and legacy bypass tests remain in the full suite. Browser initial runs encountered duplicate DOM selectors in existing responsive layouts; test selectors now target #main-content, and the final run passed all seven. An intermediate test fixture deletion was corrected before the final backend run.

Incident claims remain conditional, durable and nonexpiring; inspection version/current-pointer checks prevent concurrent approvals and completed retries from producing another authoritative routing event. No new independent routing mutation endpoint bypasses them. Writes across Incident/Inspection/notifications remain sequential: partial writes retain the claim for reconciliation. Configuration/account reads are snapshots, not transactionally locked with routing; concurrent deactivation is not live-verified. No durable outbox, automatic recovery, transaction claim or live MongoDB overlap/failover verification is asserted.

Full Flutter analyze/tests were not rerun: shared SDK lockfile access and missing cached url_launcher remain the previously evidenced blockers. No mobile source changed. No isolated MongoDB, actual private storage, real delivery, production UI/backend integration or device acceptance was available. Previous AI results are historical, not rerun evidence for this task.

### K-N. Status, pending decisions, backlog and handoff

| Area | Status |
| --- | --- |
| Routing configuration | PARTIALLY IMPLEMENTED: model/consumer exist; authorized administration/data entry missing |
| Automatic matching / jurisdiction validation | VERIFIED IMPLEMENTED at isolated resolver and synthetic API boundaries only |
| Agency receipt | IMPLEMENTED - UNVERIFIED live; scoped dashboard eligibility/best-effort notifications |
| Exception review | PARTIALLY IMPLEMENTED: scoped bounded web/API queue |
| Exception resolution / transfer | BLOCKED / POLICY PENDING; no manual override or pending-case re-evaluation |
| Security isolation | VERIFIED IMPLEMENTED at local scoped API regression boundary; live UNVERIFIED |
| Notifications | IMPLEMENTED - UNVERIFIED actual delivery; no durable outbox |
| Live integration | IMPLEMENTED - UNVERIFIED / unavailable test infrastructure |

R2-T07 stays **PARTIAL**, not complete. Other R2 tasks retain their prior incomplete/blocked status. Required decisions: participating agencies and activation/revocation rules; verified asset ownership and service coverage; DPWH applicability; authoritative configuration/asset verification actors; dispute and transfer authority; legacy organization-to-ID governance; SLA start/extension/external processing rules; maintenance and closure mandates. Privacy-gated evidence remains blocked as reported in Step 6.

Next developer: inspect AgencyRoutingRule, agencyRoutingService, tanodWorkflowController.reviewInspection/listAgencyExceptions, Incident routingAsset/routingReview/routing, existing jurisdiction/claim services, exception page and current tests first. Supply formally approved data and governance before enabling automatic routing; implement authorized configuration lifecycle, immutable audit/version replacement and safe pending-case re-evaluation only after authority is confirmed. Use an isolated restored MongoDB for index/schema/scope/concurrency tests and a real API/browser integration environment before operational claims. Recommended next assigned workflow task: **R2-T08 - agency assessment, conditional external-processing tracking and work authorization**, preserving these routing gates and all unresolved SLA/closure decisions.







## STEP 7 — R2-T06 BARANGAY SECRETARY AND TANOD VERIFICATION WORKFLOW

**Overall: PARTIALLY IMPLEMENTED / live integration UNVERIFIED.** The requested assignment, acknowledgment, reassignment, separate review, category correction and clarification cycles are implemented with isolated API/browser checks. Default photo submission remains **BLOCKED / POLICY PENDING** from Step 6. Mobile dependency/SDK, real MongoDB/storage, durable recovery and institutional mandate limitations below prevent a verified end-to-end operational claim. This section supersedes the corresponding incomplete-source findings and next-task recommendation in the preserved earlier reports.

### A. Implementation information

Date: 2026-10-20 (Asia/Shanghai); branch `revision`; HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`. Initial tree already had 63 tracked modified paths plus untracked Step 2–6 source/tests/tools; these were preserved. No commit, push, seed, migration, deployment, real account/incident operation, historical evidence deletion, dependency/lockfile change or SDK permission change occurred. Actual environment files were not read or modified.

### B. Workflow implementation

The existing Inspection model remains authoritative. Secretary assignment accepts optional instructions; current tasks expose version, assigned/acknowledged/submission timestamps and findings. Mobile now opens the authorized task before any mutation, offers **Acknowledge assignment**, then **Start field verification**, and requires an explicit Verified / Not Verified / Unable to Verify selection. Opening the sheet no longer automatically starts an inspection. Receipt does not approve or complete verification, and the application does not prove physical attendance.

Reassignment is available to the assigning Secretary in the same barangay before initial approval, including assigned/in-progress/submitted initial work. It requires a different eligible dedicated Tanod, a reason and current version. The old record becomes replaced, retains findings/evidence/timestamps, and links to the new current task. Former assignees retain only their permitted own historical findings/photos, not live incident access or mutation authority. The web shows current acknowledgment, replacement controls, findings/result/timestamps, original category and inspection history.

Initial approval is a separate Secretary request requiring explicit current-category confirmation, a current version and verified findings. Rejection and clarification require a reason; clarification explicitly targets **assigned Tanod** or **citizen reporter**. Rejection keeps the existing tanod_rejected review state, not an invented final closure or fabrication finding.

A Tanod clarification consumes the earlier submitted review and creates a fresh assigned follow-up with instructions and a parent link; the incident stays clarification_required until follow-up work progresses. A citizen clarification leaves the earlier inspection immutable; only the reporter can send text context. The response creates a new submitted review record linked to the original findings, retaining the original Tanod result/evidence/physical timestamps and explicitly marking the review context. Missing original assignment time is not fabricated. It does not represent new citizen-authored field work. Responses are appended separately, the Secretary is notified, and a new independent decision is required. Reply fields cannot change the original report/category/location, findings, evidence or outcome.

Category correction is limited to current submitted initial findings before approval/maintenance. It accepts only existing canonical categories, a reason and version; records previous/new values, actor/time; preserves the original category; and advances the inspection version so stale approval fails. New reports capture the reporter's category at creation. Older records without that provenance use an explicitly labeled **legacy_snapshot**, not a fabricated historical fact.

Existing category mappings are retained. Approval routes only when the existing mapped organization has an eligible active provider account; otherwise it stays approved, not_routed and awaiting authorized routing review. Account availability is not a jurisdiction/ownership determination. No new agency mapping or jurisdiction engine was introduced. Routing still does not authorize maintenance or SLA changes.

### C. Status transitions and API contract

| Action / endpoint under /incidents | Scope / prerequisites | Result |
| --- | --- | --- |
| POST `/:id/tanod-inspections` | Same-barangay Secretary; submitted/reinspection-eligible state; eligible Tanod; optional instructions. Existing active pointer cannot be silently replaced. | Assigned task, current initial pointer, tanod_assigned history and assignee notification. |
| POST `/:id/inspections/:inspectionId/acknowledge` | Current assignee/type/pointer/barangay/lifecycle; assigned; required expectedVersion; not already acknowledged. | Actor/time receipt, one history event and Secretary notification; task remains assigned. |
| POST `.../start` | Existing current-task guards; version checked when supplied. | in_progress / tanod_in_progress, start timestamp and Secretary notification. Older authorized start/submission calls remain compatible and can record receipt; new mobile explicitly acknowledges first. |
| POST `.../submit` | Current assignment/type/state; explicit result and findings; secure evidence processing for supplied files; supplied version checked before upload. | Submitted findings and tanod_verified **awaiting Secretary decision**. No approval, routing, work order or closure. |
| POST `.../reassign` | Assigning Secretary, current initial task before approval, different eligible Tanod, reason and required version. | Old task replaced with evidence/history intact; fresh assigned pointer; both Tanods notified. |
| PATCH `.../category` | Assigning Secretary; submitted current initial task; supported changed category, reason and required version. | Original/provenance plus correction history retained; category changes and task version advances. No routing/priority/SLA mutation. |
| POST `.../review` | Assigning Secretary/current initial URL/reference/type/status/barangay; **expectedVersion now required**; verified outcome and categoryConfirmed=true for approval; reason for reject/clarification; explicit clarification recipient. | Approved + existing eligible category routing or pending routing review; tanod_rejected; or distinct clarification cycle. Updated web supplies the new contract. Older approval callers must migrate, not omit the safety fields. |
| POST `/:id/clarification-response` | Citizen reporter only; current addressed, unconsumed citizen clarification; required version and response text. | New review cycle preserving prior findings, appended response/actor/time, tanod_verified awaiting Secretary. Repeat/stale/closed/incompatible reply denies. |
| GET `/:id/inspections` | Secretary barangay scope and that Secretary's inspection records. | Ordered history with signed permitted evidence and clarification responses; no raw evidence keys in image projections. |

No new institutional approval, priority, SLA-start, procurement/readiness or closure authority is inferred. The existing finalization/legacy bypass denials remain enforced.

### D. Permission matrix

| Role | Permitted behavior / scope |
| --- | --- |
| Citizen | Existing own reports; text reply only to a current clarification addressed to that reporter. Cannot edit inspection decisions, findings/category or another reporter's record. |
| Barangay Tanod | Own current task in current barangay; acknowledgment/start/findings and explicit outcome. Own historical findings/evidence remain readable without stale live incident access. No Secretary review/routing/repair/closure authority. |
| Secretary | Same-barangay assignment; assigning-Secretary current-task reassignment/review/category correction and scoped history. Version/current-reference gates remain mandatory where listed. |
| Repair Personnel | Existing assigned/current work-order scope only; no initial field-inspection or Secretary mutation rights. |
| Agency officer | Existing own-organization reads/maintenance progress; no initial review/reassignment/category approval authority. |
| Administrator | Existing account/oversight permissions; no newly granted inspection approval or closure authority. |

Citizen acquisition of a durable incident claim is limited to the dedicated clarification-response path and owner scope. It does not enable other inspection mutations. Active-account/token/RBAC checks, privileged CAPTCHA, global throttles and Step 2 field scopes remain in the actual routers.

### E. Evidence integration

Existing image validation, metadata stripping, hashes, private storage, signed retrieval and rollback-aware batch processing remain unchanged. New mobile sends selected outcome/current version through the existing secure multipart contract, displays server errors and does not hard-code verified. It retains its existing one-photo UI requirement; the backend's existing optional-inspection-evidence contract was not changed into a new institutional photo-minimum policy. Submitted bytes always use managed validation; raw URLs/foreign storage references remain denied.

Default managed photo processing still returns 503 while privacy policy is unresolved. No raw upload fallback, model download, masking-policy change or fabricated physical-visit/GPS proof was added. Live photo upload/retrieval and device acceptance remain blocked/unverified. Text-only citizen clarification does not add photographic evidence or change stored originals.

### F. Concurrency, history and notification behavior

All new mutations reuse Step 4's conditional, non-expiring incident claim and Inspection version concurrency. Reassignment binds the current old ID before creating a replacement. New IDs separate clarification cycles, so a previous review cannot consume the latest response. Category changes advance a dedicated category revision, causing the model version to advance; stale category approval returns conflict. Existing evidence, findings and decision notes remain on earlier records; parent/replacement links and incident history retain actors, times and reasons.

Acknowledgment/review/reassignment/reply repeats deny without duplicate transitions. Notification keys include incident/event/history position/recipient, use existing notification types and carry scoped report references, not private photo URLs. Correctly persisted actions do not depend on external push success: optional notification errors are logged for reconciliation. This is best-effort delivery, **not a durable outbox or proof of receipt**.

Writes across Incident/Inspection and notifications remain sequential. A persistence exception or version-write conflict can leave partial records and a held reconciliation claim. No claim is automatically released by age or cleared as a retry workaround. Real MongoDB overlap/failover and safe recovery remain unverified. The tests prove current-pointer/claim behavior at controlled model boundaries, not atomic cross-document storage.

### G. Exact files and test execution

Step 7 repository-relative modifications:

- `lunas_backend/src/controllers/tanodWorkflowController.js`
- `lunas_backend/src/controllers/incidentController.js`
- `lunas_backend/src/controllers/fieldRoleAccess.test.js`
- `lunas_backend/src/controllers/inspectionIntegrity.test.js`
- `lunas_backend/src/models/Inspection.js`
- `lunas_backend/src/models/Incident.js`
- `lunas_backend/src/routes/incidentRoutes.js`
- `lunas_backend/src/services/fieldIncidentAccess.js`
- `lunas_backend/src/services/inspectionMutation.js`
- `lunas_web/src/app/actions/tanod-workflow.ts`
- `lunas_web/src/lib/validation.server.ts`
- `lunas_web/src/components/validation/validation-review.tsx`
- `lunas_web/tests/secretary-verification.spec.ts` (new)
- `lunas_mobile/lib/features/repair/data/models/inspection_models.dart`
- `lunas_mobile/lib/features/repair/data/services/repair_service.dart`
- `lunas_mobile/lib/features/repair/presentation/screens/tanod_inspections_screen.dart`
- `lunas_mobile/lib/features/reporting/data/models/incident_report.dart`
- `lunas_mobile/lib/features/reporting/data/services/report_service.dart`
- `lunas_mobile/lib/features/reporting/presentation/screens/citizen_report_detail_screen.dart`
- `lunas_mobile/tool/verify_inspection_workflow.dart` (new)
- `README.md`

Backend/web checks use refreshed ignored `.local-backups/environment-baseline-20261020/` component copies with locked dependencies, including new files and the Step 6 init fixture. ACCOUNT_TEST_MONGODB_URI was cleared; storage/delivery/models were controlled stubs. Mobile checks use original source/cached Dart. Logs: `step7-backend-results.json`, `step7-backend-tests.log`, `step7-web-build.log`, `step7-dart-analysis.log`.

| Command / evidence | Actual result | Verification boundary |
| --- | --- | --- |
| Backend `npm.cmd run lint` | **PASS, exit 0** | Source/tests/scripts. |
| Backend `npm.cmd test -- --runInBand --json --outputFile=../step7-backend-results.json` | **596 passed, 2 failed, 40 skipped; 59 suites passed, 2 failed, 1 skipped; exit 1** | **19 additional passes** vs Step 6. Same two baseline failures below. |
| Focused HTTP scenarios in full run | Assignment → acknowledgment → start → submission → separate approval; corrected-category routing; unavailable destination; Tanod/citizen clarification; former-assignee denial; wrong version/eligibility; two overlapping reassignments; partial failure; repeat acknowledgment/review/reply; optional delivery failure | Real Express/JWT/router/validator wiring with controlled model queries; no MongoDB transaction or real storage/device integration claim. |
| Web `npm.cmd run lint`; `npx.cmd --no-install tsc --noEmit`; `npm.cmd run build` | **PASS, exit 0 each** | Updated source and tests; telemetry disabled, existing isolated session setting and loopback fixture API. |
| Web `npm.cmd run prepare:standalone`; `node scripts/run-playwright.mjs tests/secretary-verification.spec.ts tests/agency-sla-integrity.spec.ts tests/field-role-provisioning.spec.ts` | **6 passed** | Current-version reassignment/clarification, blocked invalid approval, previous role/SLA regressions; fixture API only. |
| Cached Dart `tool/verify_inspection_workflow.dart` | **9 SDK-only checks passed** | Version/acknowledgment/instructions/location/outcome/history-evidence parsing; no Flutter UI/network claim. |
| Cached Dart `--packages=.dart_tool/package_config.json tool/verify_field_role_routes.dart` | **12 SDK-only checks passed** | Prior field-role navigation separation. |
| Cached Dart `format --output=none --set-exit-if-changed` on six modified Dart source files plus new tool | **PASS**, 7 files / 0 changes | Parser/format check only. |
| Cached Dart `analyze` on the six modified source files | **Exit 3; 14 issues: 3 errors, 11 informational lints** | Errors all relate to unresolved existing url_launcher import/launchUrl/LaunchMode. HEAD already contains the import; pubspec declares it but current package_config lacks it. This is not a clean mobile analysis result. Other reported items are style lints. |
| Cached Dart + flutter_tools.snapshot `analyze --no-pub`; `test --no-pub` | Both **exit 1**, shared `C:\src\flutter\bin\cache\lockfile` cannot be opened | No SDK permission change. Full Flutter/widget/device acceptance remains blocked. |
| Prepared Python `-m pytest test_privacy_scope.py -q` | **5 passed, 10 subtests passed** | Unchanged AST/handler privacy regression; no model inference. |
| `git diff --check` | **PASS** | Diff hygiene. |

Unchanged failures: `incidentValidation.test.js` — **sequential incident review workflow returns submitted and clarification-required records only from the assigned barangay queue** (old flat filter expectation); `scripts/dagupan-seed-config.test.js` — **local accounts cover all canonical barangays and matching provider/repair organizations** (42 expected vs current 69). Neither assertion was changed. Existing positive review fixtures now supply the deliberately required version/category confirmation and decision reason. During UI development, optional timestamps needed explicit fallback guards, and a placeholder-based browser selector matched multiple DOM elements; the final accessible decision-reason control/selector and checks pass.

### H. Known limitations and regressions

Step 2 roles/current assignment/organization/ownership/suspension checks, Step 3 auth/CAPTCHA/throttles, Step 4 typed/current inspection/claims/closure denials, Step 5 SLA preservation and Step 6 secure evidence/reference/aggregate/database-preparation checks remain passing apart from the same two baseline failures. No work order, SLA deadline, existing reference, account, photo or historical decision was rewritten in real data.

Live privacy/evidence availability, approved Secretary/verifier mandate, R2-T07 jurisdiction/ownership-aware routing, R2-T08 maintenance readiness/external processing, final closure authority, database/storage integration, durable notification/audit recovery and Flutter tooling/dependency/device validation remain open. Category-account availability does not certify official infrastructure ownership. Reassignment across barangays or transfer of approval power to a different Secretary was not invented. Historical records missing expected versions or with unresolved claims require authorized reconciliation, not migration/claim clearing in this task.

### I. R2-T06 implementation status

| Feature | Status |
| --- | --- |
| Secretary assignment/instructions and current task display | **IMPLEMENTED — UNVERIFIED** live. |
| Explicit acknowledgment/start and all three outcomes | **IMPLEMENTED — UNVERIFIED** Flutter/device integration. |
| Reassignment/history/former-assignee restrictions | **IMPLEMENTED — UNVERIFIED** real Mongo concurrency/recovery. |
| Separate approval/rejection/current-category confirmation | **IMPLEMENTED — UNVERIFIED** live multi-role operation. |
| Category provenance/correction and stale-approval guard | **IMPLEMENTED — UNVERIFIED** historical/live data acceptance. |
| Tanod follow-up and citizen clarification response | **IMPLEMENTED — UNVERIFIED** real clients/database/delivery. |
| Secure real photo submission/retrieval | **BLOCKED / POLICY PENDING**; no bypass introduced. |
| Overall field-verification workflow | **PARTIALLY IMPLEMENTED** operational acceptance; local source/isolated checks do not certify live evidence or institutional approval. |

### J. Updated backlog

R2-T06 source now includes the previously missing features above, while live evidence, client/database acceptance and policy limits remain tracked. R2-T03 recovery, R2-T05 privacy/storage/database limits, R2-T07 routing and other open R2 tasks are not marked complete. Earlier audit/Step 1–6 reports remain preserved and historical where superseded.

### K. Next developer handoff

Inspect currentInitial/assignedInspection, the new endpoints, serializers/validation normalizer, Secretary actions/review UI and both mobile task/reply forms first. Preserve pointer/type/version/role/claim gates, original category/findings/evidence, approved-state separation, SLA fields and closure denials. Rerun documented backend/web/browser/SDK checks after changes. Use a writable Flutter SDK and regenerate the declared dependencies before full analysis/widget/device checks; do not patch shared SDK permissions or fake a launcher implementation. Validate real reassignment/review races, partial recovery, photo pipeline, notifications and complete multi-role flows against isolated MongoDB/storage once privacy policy is approved.

**Next task: R2-T07 — Complete automated jurisdiction-aware agency routing.** Retain approved-but-unrouted cases and current maintenance/closure restrictions until that task's validated ownership/jurisdiction prerequisites are met. No commit or push performed.


## STEP 6 — R2-T05 EVIDENCE, DATA INTEGRITY, AND INFRASTRUCTURE SECURITY

**Overall: PARTIALLY IMPLEMENTED.** New remote-URL submissions and unauthorized aggregate disclosure are blocked in source; reference allocation, scoped database configuration and narrow recovery fixes are implemented with isolated tests. Privacy scope remains **BLOCKED / POLICY PENDING**. Real MongoDB privileges/concurrency, storage delivery and durable cross-document recovery remain unverified. No deployed evidence-availability or production-readiness claim is made. This section supersedes the corresponding current-defect descriptions and next-task recommendations in preserved earlier reports.

### A. Implementation information

2026-10-20 (Asia/Shanghai); branch `revision`; HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`. Starting tree was already dirty (54 tracked modified paths plus untracked Step 2–5 source/tests/tools); previous edits were preserved. Step 6 touches only evidence input/recovery, reference allocation, aggregate projection, database preparation and focused tests/templates/documentation. No commit, push, deployment, credential rotation, real database operation, seed, migration, backup/restore execution, historical evidence deletion, model/checkpoint download or dependency change occurred. Actual private environment files were not read or changed.

### B. Current evidence architecture

| Pipeline | Current implementation and verified boundary |
| --- | --- |
| Citizen | Authenticated POST incident, memory multipart upload/validation, persisted reporter ownership, shared processAndUploadEvidence, then incident creation. New nonempty images JSON references are rejected even alongside multipart files. Existing images=[] compatibility is retained; real routes still require uploaded evidence. |
| Tanod | Existing assigned/current/type/barangay/incident guards and explicit result; one rollback-aware processAndUploadEvidence batch. The stored incident category is used. Step 4 durable claim/version safeguards remain. |
| Repair progress/completion | Existing current work-order/organization/assignment/version guards; processAndUploadRepairEvidence normalizes/hashes/uploads under the work-order/uploader prefix. Completion still requires human review and cannot close an incident. |
| Validation | Existing Multer MIME/extension/size/count checks; Sharp decoding, allowed decoded formats, minimum dimensions and size limits. New **40,000,000 input-pixel decode budget** applies before metadata extraction/normalization; a header-only oversized-input test proves rejection. No MIME declaration alone proves safe content. |
| Normalization/integrity | Existing orientation correction, WebP re-encoding and EXIF/GPS removal, bounded output width, checksum of stored bytes and backend-owned evidence metadata retained. Existing real Sharp tests cover normalization, hash and metadata behavior. |
| Privacy dependency | All three pipelines still call redactEvidence. Explicit false or failed/unavailable detector causes **503 before storage**, never a raw-image fallback. Enabled-path tests stub detector availability; they do not establish real face/plate model coverage. |
| Storage/access | Existing private-key S3 upload contract, signed retrieval after record authorization, Step 2 field/ownership scopes and suspended-account protection retained. New caller-supplied remote references/storage keys cannot create evidence links. No arbitrary URL fetch was introduced. |
| Historical compatibility | Existing stored references, IDs, hashes, photos and history are unchanged. Authorized historical reads remain tested. Already-public legacy URLs cannot be revoked by a response-projection fix; issued bearer signed URLs remain usable until expiry. Live bucket policy/legacy migration and revocation limits remain deployment work. |

The approved project scope excludes mandatory automatic face/plate masking, while existing code requires successful privacy processing. **No new privacy decision was invented and no protective processing was bypassed.** Root/backend templates and base/local Compose now explicitly default the flag to false, consistently exposing the blocked state rather than implying upload availability. The minimum next decision is an approved privacy contract: either approve the existing processing dependency and verify models, or approve an alternative validated/normalized/private evidence policy before implementing it. Until then, default managed evidence submission is blocked. Do not re-enable legacy URLs as a workaround.

### C. Defects fixed

| Defect | Previous behavior | Correction / test evidence | Remaining risk |
| --- | --- | --- | --- |
| R2-10 new URL bypass | HTTPS JSON image metadata bypassed managed byte processing and private upload. | Controller and real request validators reject new image references; malicious URL/foreign key test denies before processing. Historical reads retained. | Default uploads blocked by privacy policy; existing public legacy objects need separate approved migration. |
| R2-11 references | countDocuments()+1 produced identical concurrent candidates and could reuse numbers after deletion. | 96-bit random suffix with existing unique schema/index declaration; 500 parallel real Mongoose validations without counting; bounded collision retry tests. | Actual deployed unique index and real Mongo concurrency unverified. |
| R2-11 DB principal | Base Compose backend used root credentials/authSource admin. | Separate database-scoped readWrite principal prepared; fresh-volume initialization VM tests and Compose YAML/source assertions. | Existing volumes need authorized provisioning before switching; no real grants/privilege tests run. |
| R2-11 aggregate | Barangay review returned a reporter's global confirmedFindingsTotal. | Only existing administrator oversight receives global total. Other reviewers receive scoped count without executing the global count query; cross-scope miss returns 404/no counts. | Three-findings restriction and appeals policy unchanged/pending as previously documented. |
| R2-T05F cleanup | A later error could delete successfully committed citizen evidence; cleanup failures were swallowed. | Track committed outcome; never clean up committed/uncertain writes. Definitive rejection cleans newly uploaded objects. Cleanup returns attempted/failed counts and logs reconciliation need. Fault tests distinguish committed/rejected/uncertain outcomes. | No durable orphan registry/outbox; unknown write outcomes still require reconciliation. |
| Connection logging | Raw connection exceptions could include URI details. | Log name/code only; synthetic-credential failure test confirms the sensitive value/stack is absent. | Other operational logging and deployment secret handling still require normal review. |

### D. Incident reference integrity

New references retain the `LUNAS-YYYYMM-` prefix and use **24 uppercase hexadecimal characters / 96 random bits**, avoiding count reads and counter initialization/migrations. They are identifiers, not gap-free sequence numbers. Existing six-digit references and Mongo IDs are never rewritten; repeat validation preserves an existing reference. Existing lookup/search treats references as strings; notification parsing accepts the new alphanumeric suffix.

The existing unique reportNumber index is the final database collision boundary **when present**. createIncidentRecord retries at most three attempts only for E11000 with a reportNumber keyPattern, keeping the same evidence/ownership payload. It does not reupload evidence or retry unrelated duplicate keys, validation or ambiguous network/write failures. Each new model validation allocates a fresh random candidate. The tests check actual hook behavior, declared uniqueness and controlled retry decisions, not real index enforcement. Verify the deployed index and any historical duplicates before rollout; do not silently rebuild or rewrite production records.

Repeated HTTP submissions without an idempotency contract can still create separate reports. Unknown write failures are not replayed automatically; neither UUID randomness nor collision retry is HTTP idempotency. Full request deduplication remains R2-T05F follow-up.

### E. Database security and rollout

Base Compose now uses MONGO_APP_USERNAME/MONGO_APP_PASSWORD with authSource equal to the application database. `infra/mongodb/init-app-user.js` prepares only `{role:readWrite, db:applicationDatabase}` on **fresh disposable volumes**. It rejects administrative database names, reuse of the configured root username, invalid names and empty/short/non-URL-safe passwords. This role preparation supports ordinary application CRUD/index operations without granting root; actual permission enforcement has not been exercised.

Root/admin access remains separate for Mongo initialization, health checks and the existing opt-in administrative console. No real credentials are printed here. Templates require a unique URL-safe application password of at least 24 characters; placeholders are not operational credentials. The backend standalone template also uses an application-authenticated URI. Init environment variables apply only to a fresh Mongo data volume.

**Existing-volume procedure (prepared, not executed):** inventory/backup and verify a restore using an approved operator principal; confirm target application database and index requirements; have the authorized DB operator provision/verify a separate database-scoped application user; securely configure the matching application URI; test authorized CRUD/index use and denial of unrelated/admin database actions in isolation; switch/restart the backend only after that acceptance; retain separate administrative recovery access. Do not delete volumes or rerun initialization as a migration. Do not start the changed Compose backend against an existing volume before the user exists. Backup/restore scripts still accept an operator-supplied URI; destructive restore remains separately guarded. No backup/restore/grant command was run.

Docker and mongod are unavailable on PATH and no isolated database was configured. YAML parsing, script execution against a mocked DB and source checks do **not** prove container startup, user creation, authentication, privilege denial or deployed index availability.

### F. Cross-scope security

The case lookup and count both retain caller jurisdiction scope; no count query runs when the case is out of scope. Non-admin responses omit confirmedFindingsTotal entirely. Existing administrator oversight keeps that field; no new administrator approval/closure power was added. The global reporting-restriction calculation remains server-side and unchanged; local display counts do not redefine the three-confirmed-findings rule or appeal authority. Existing user/account/evidence serializers and six-role restrictions remain independently enforced.

### G. Recovery and integrity boundaries

A committed incident is never compensated by deleting its images because a later audit/serialization step throws. An unexpected post-commit error returns **201 with the saved ID/reference/status and a reconciliation message**, rather than encouraging a false failed-submission retry. Definitive validation/unique rejection may clean up newly uploaded evidence; unknown database/network outcomes retain it for investigation because the write may have committed. Cleanup failures report counts without logging object contents or credentials. Batch-processing failures retain existing rollback behavior.

There is no atomic transaction across storage, Incident, Inspection, WorkOrder, audit and notification delivery. Audit creation still tolerates failure; embedded decision/history records and diagnostic logs are not a durable audit outbox. Unknown outcomes, retained private orphan objects, failed cleanup, duplicate manual HTTP retries and cross-document partial transitions require authorized reconciliation. No claim is automatically cleared, no historical object is deleted, and no broad outbox/queue/recovery architecture was added. R2-T05F remains partial.

### H. Exact Step 6 files modified

- `lunas_backend/src/controllers/incidentController.js`
- `lunas_backend/src/controllers/incidentController.test.js`
- `lunas_backend/src/controllers/falseReportReviewController.js`
- `lunas_backend/src/controllers/falseReportReviewController.test.js`
- `lunas_backend/src/middleware/validation.js`
- `lunas_backend/src/middleware/validation.test.js`
- `lunas_backend/src/models/Incident.js`
- `lunas_backend/src/services/incidentCreation.js` (new)
- `lunas_backend/src/services/incidentCreation.test.js` (new)
- `lunas_backend/src/services/evidenceService.js`
- `lunas_backend/src/services/evidenceService.test.js`
- `lunas_backend/src/utils/imageProcessor.js`
- `lunas_backend/src/utils/imageInputLimit.test.js` (new)
- `lunas_backend/src/config/database.js`
- `lunas_backend/src/config/database.test.js` (new)
- `lunas_backend/scripts/mongo-app-init.test.js` (new)
- `infra/mongodb/init-app-user.js` (new)
- `docker-compose.yml`
- `docker-compose.local.yml`
- `.env.example`
- `lunas_backend/.env.example`
- `README.md`

No Step 6 web/mobile/AI source, detection model or checkpoint change.

### I. Actual test execution

Tests used refreshed ignored `.local-backups/environment-baseline-20261020/lunas_backend` and `.../lunas_web`, locked dependencies and the prepared Python environment. The init script was copied into the isolated test tree for VM checks. ACCOUNT_TEST_MONGODB_URI was cleared. No actual .env or real service data was used. Logs/JSON: `step6-backend-tests.log`, `step6-backend-results.json`, `step6-web-build.log`.

| Command / area | Actual result | Boundary |
| --- | --- | --- |
| Backend `npm.cmd test -- --runInBand --json --outputFile=../step6-backend-results.json` | **577 passed, 2 failed, 40 skipped; 59 suites passed, 2 failed, 1 skipped; exit 1** | 21 additional passes vs Step 5. Same two pre-existing failures below. |
| Backend `npm.cmd run lint` | **PASS, exit 0** | Backend source/tests/scripts; Mongo init validated by isolated VM tests. |
| Reference tests | 500 distinct references from parallel Mongoose validations; legacy/repeat preservation and three-attempt collision budget pass | No live Mongo inserts, unique-index enforcement or transient DB integration claimed. |
| Evidence/security regressions | Shared Sharp/EXIF/checksum/storage-command tests, new decode limit/privacy-disabled/recovery/URL/scoped-count tests and all prior field-role tests pass | Storage and detector services mocked; no live S3/signature/detector acceptance. |
| Compose | PyYAML parses base/local definitions; backend URI uses app variables, not root; init VM grants only scoped readWrite and rejects unsafe config | No Docker Compose config/startup or actual Mongo privilege test available. |
| Web `npm.cmd run lint`; `npx.cmd --no-install tsc --noEmit`; `npm.cmd run build` | **PASS, exit 0 each** | Unchanged Step 5 source; isolated session/loopback API, telemetry disabled. |
| Web `npm.cmd run prepare:standalone`; `node scripts/run-playwright.mjs tests/agency-sla-integrity.spec.ts tests/field-role-provisioning.spec.ts` | **4 passed** | Fixture API only; no live uploads, aggregate UI or real DB integration certified. |
| AI prepared Python `-m pytest test_privacy_scope.py -q` (cwd lunas_ai) | **5 passed, 10 subtests passed** | AST/config/handler isolation; no live inference/models. Full AI/model suite not run; existing ML dependency limitations remain. |
| Cached Dart `--packages=.dart_tool/package_config.json tool/verify_field_role_routes.dart` | **12 passed** | SDK-only route regression. |
| Cached Dart + flutter_tools.snapshot `analyze --no-pub`; `test --no-pub` | Both **exit 1**, cannot open `C:\src\flutter\bin\cache\lockfile` | Full Flutter/device checks remain blocked; no SDK ACL changes. |
| `git diff --check` | **PASS** | Diff hygiene only. |

Exact unchanged failures: `incidentValidation.test.js` — **sequential incident review workflow returns submitted and clarification-required records only from the assigned barangay queue** (old flat status-filter expectation); `scripts/dagupan-seed-config.test.js` — **local accounts cover all canonical barangays and matching provider/repair organizations** (42 expected vs 69). Neither assertion was changed. The legacy JSON positive-validation expectation was deliberately revised to a rejecting security test; historical stored-reference tests remain positive. Initial development runs included the superseded URL expectations and two new recovery fixtures missing required pin confirmation; final tests assert the actual persistence path was reached and pass.

### J. Regression results and remaining risks

Step 2 field assignment/organization/ownership and suspension checks, Step 3 rate limits/CAPTCHA/token controls, Step 4 inspection type/current pointer/claim/version/closure denies, and Step 5 SLA preservation/scheduler tests introduce no new failures. Existing valid stored records and maintenance evidence/history remain intact. Default new managed uploads are explicitly blocked by unresolved privacy scope, not represented as working from mocked enabled-path tests.

Real DB reference races/privileges/indexes, fresh/existing volume rollout, S3 policy/signing/deletion, original public legacy references, bearer URL expiry, actual model processing, repeated HTTP submission idempotency, durable audit/notification delivery, cross-document reconciliation and Flutter integration remain unverified/open. No data was retroactively relabeled as verified or privacy masked. Unrelated SLA/start/priority/external readiness/final closure institutional decisions remain pending.

### K. Individual implementation status

| Subtask | Status |
| --- | --- |
| R2-T05A evidence policy/upload | **BLOCKED / POLICY PENDING** for default upload availability; pipeline traced, guards/budget and blocked-mode tests implemented. |
| R2-T05B legacy compatibility | **IMPLEMENTED — UNVERIFIED** live; new reference bypass denied, historical reads retained in isolated tests. |
| R2-T05C reference integrity | **IMPLEMENTED — UNVERIFIED** real Mongo concurrency/index enforcement. |
| R2-T05D database least privilege | **IMPLEMENTED — UNVERIFIED** deployment/privileges; configuration and fresh-volume script prepared only. |
| R2-T05E cross-scope disclosure | **IMPLEMENTED — UNVERIFIED** live role/database integration; local projection/query tests pass. |
| R2-T05F recovery | **PARTIALLY IMPLEMENTED**; committed evidence protection/definitive-collision retries/cleanup diagnostics pass; durable recovery/idempotency remain open. |

### L. Updated backlog

R2-T05 stays partial with the individual boundaries above. R2-10 privacy availability remains blocked; its new URL bypass is corrected. R2-11 source fixes cover references, application-principal preparation and scoped aggregates; durable audit/cross-document recovery remains open. Earlier reports are historical and not deleted. No unrelated R2 requirement is marked complete.

### M. Next developer handoff

Inspect evidenceService/imageProcessor/upload, incident creation/reference tests, false-report scope and Mongo init/Compose first. Obtain the approved privacy decision and isolated Mongo/storage services before claiming available uploads or privileged-operation denial. Verify real concurrent inserts/indexes, account roles, private bucket/signature behavior, post-commit/unknown-write/cleanup recovery and existing multi-role workflows. Preserve all current scopes, claims, SLA fields and closure restrictions. Re-run the documented full backend/security/browser checks after changes; do not seed or delete volumes to make tests pass.

**Next recommended implementation task: R2-T06 — Complete Secretary/Tanod workflow**, keeping R2-T05 privacy, database/storage acceptance and durable-recovery blockers tracked explicitly. No commit or push performed.


## STEP 5 — R2-T04 SLA DEADLINE PRESERVATION AND LIFECYCLE INTEGRITY

**Status: IMPLEMENTED — UNVERIFIED in live operation.** Deadline preservation, blocked unauthorized amendments, scheduler snapshot guards and client compatibility are verified at the isolated boundaries below. This does not certify production scheduling, delivery, database concurrency, atomic cross-document recovery or deployment readiness. SLA authority and positive closure remain **BLOCKED** pending policy. This section supersedes the current deadline-erasure finding and next-task recommendations in the preserved earlier reports.

### A. Scope and Environment

Date: 2026-10-20 (Asia/Shanghai); branch `revision`; HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`. The initial tree was already dirty: README/AGENTS, configuration, backend/web/mobile source and untracked services/tests/tools from Steps 1–4 were present. They were preserved; Step 5 changes are listed below. No commit, push, seed, migration, deployment, production/shared-record operation, dependency/lock change, private environment edit or SDK permission change occurred.

### B. SLA Defects Corrected

The before-fix isolated controller test reproduced the exact loss: changing high to critical replaced a populated SLA with a new not_started object. The original deadline, startedAt, warning thresholds/count, overdue flag and escalation timestamp disappeared. That test failed before correction and now passes with **409 and unchanged SLA**.

`updateAgencyStatus` no longer creates, replaces or updates any SLA field. Different/missing priority classification, a new deadline/start or a changed deadline returns **409 / SLA_POLICY_REQUIRED**; invalid date values return 400. An identical persisted priority/deadline may be echoed without changing it, including the same instant expressed with a timezone offset. An existing past deadline is preserved and remains overdue; passing a different past date is an amendment and is denied. Failed input/persistence cannot delete or reset SLA values.

The monitor now skips malformed/missing deadlines and terminal SLA records before writes/delivery. State writes and notification acknowledgments match the observed deadline, start, state and closure fields. Incident monitoring also excludes Step 4 claims. Terminal normalization no longer broadcasts the incident's SLA outcome to every linked work order: only the current reverse-linked order is considered, with its own deadline and existing closure time. Cancellation and recorded breach evidence are retained; invalid historical deadlines cannot yield a false met outcome, and invalid closure timestamps are rejected at the helper boundary.

### C. Current SLA Rules

| Area | Actual behavior / boundary |
| --- | --- |
| Targets | Existing critical 48h, high 72h, medium 168h, low 336h defaults remain; SLA_* environment overrides and calculation helpers are retained. These settings do not approve institutional priority/start authority. |
| Start/deadline | Calculation helper still derives deadline from an explicit/default start plus configured elapsed hours. Current agency progress cannot invoke a new start or amendment. Legacy validation/routing/work-order creation remains fail-closed from Step 4. Existing deadline-only historical records are monitored without fabricating startedAt; missing deadlines are not breaches. |
| Ordinary progress | Preserve all existing SLA timing, target, warning/delivery markers, escalation and terminal evidence. Same-priority echo is harmless; a classification change is denied until authority/amendment policy exists. |
| Agency maintenance start | Needs the existing workflow/current-order prerequisites and a valid persisted deadline. It cannot create one as a side effect. Existing terminal SLA states require reconciliation. |
| Linked records | Where both contain timing, differing start/deadline or priority denies agency progress and requires reconciliation. Missing historical fields are not backfilled. Delivery markers remain per record and need not match. |
| Monitoring | Existing opt-in scheduler, default five-minute polling, 24/12/6/2-hour incident thresholds, approaching work-order warning and initial overdue escalation retained. At the exact deadline, remaining time is zero; overdue begins after it. Keys remain deadline/stage/recipient based, with the existing notification idempotency constraint. No new escalation recipient authority or second-stage timer was invented. |
| Reassignment/acceptance/start | Existing work-order version/assignment guards remain. Maintenance and SLA start fields are distinct; these actions do not write SLA timing/history. Existing startedAt/deadline and warning markers survive handoff and worker acceptance. |
| Repair progress/completion | Existing 0/25/50/75/100 progress/evidence persists; submission to human review does not finalize SLA. Provider correction keeps elapsed time and warning/breach evidence. |
| Terminal | Historical authorized terminal fixtures use the stored authorized closure timestamp, never the monitoring time. met/breached derives from the record's own deadline; known breach/cancellation is retained. Normalization changes outcome fields only, preserving dates, warnings and history. It does not close incidents or authorize closure. |

### D. SLA Integrity Invariants

At the tested ordinary agency and maintenance write boundaries: no silent deadline deletion, accidental restart, unauthorized/unaudited amendment, new duplicate start, erased warning/escalation evidence or automatic procurement pause. No production amendment endpoint or authority was added. Existing claims are neither ignored nor cleared by SLA monitoring. Guarded updates can lose a race and retry on a later poll; they do not overwrite a different observed SLA snapshot.

The agency client now displays stored SLA timing, disables priority changes and sends only status/note for ordinary progress. It avoids resubmitting a timezone-less, minute-truncated datetime value as an amendment. A rejected response no longer advances the displayed agency step.

### E. Authorization Matrix

| Role | Current permitted SLA behavior |
| --- | --- |
| Citizen | Existing own-incident SLA reads; no changes. |
| Barangay Tanod | Existing current assigned-task/incident SLA reads under barangay/type/pointer scope; no amendments. |
| Secretary | Existing barangay reads and verification actions; no SLA priority/start/extension/final-compliance authority inferred. |
| Agency officer (`utility_provider`) | Existing responsible-organization reads and guarded progress on a current work order. Same existing priority/deadline may be echoed, but priority assignment/change, starts and deadline amendments are blocked pending policy. |
| Repair Personnel | Existing assigned/current-order organization scope; progress/evidence do not change SLA timing. |
| Administrator | Existing scoped platform visibility/account functions; no newly granted SLA amendment or closure power. |

There is no successful deadline-amendment operation to audit. Status history/audit still records actor/time/status/note/current priority. A future authorized amendment must record previous/new dates and priorities, reason and policy/reference atomically with the amendment; this task does not invent that policy or silently add such an endpoint.

### F. Exact Files Modified

| Repository-relative path | Step 5 change |
| --- | --- |
| `lunas_backend/src/controllers/tanodWorkflowController.js` | Remove SLA replacement; deny unsupported priority/start/date amendments; validate current linked timing; preserve existing SLA during agency progress. |
| `lunas_backend/src/services/slaService.js` | Snapshot guards, invalid/terminal exclusion, respect incident claims, current-order terminal normalization with per-record outcome. Existing scheduler/delivery behavior retained. |
| `lunas_backend/src/services/workOrderService.js` | Shared valid-date helper; preserve cancellation/breach evidence; reject invalid closure timestamps; safe missing/invalid deadline outcome. |
| `lunas_backend/src/controllers/agencySlaIntegrity.test.js` (new) | Reproduction, preservation, denied amendments, timezone, external-status, role, claim and failure tests. |
| `lunas_backend/src/services/slaMonitoring.test.js` | Snapshot/terminal/invalid-time tests; current-order normalization coverage. |
| `lunas_backend/src/services/slaWorkOrder.test.js` | Retain real date validator in the existing service mock. |
| `lunas_backend/src/controllers/workOrderWorkflow.test.js` | Existing SLA fixtures and invariant assertions for assignment/progress/evidence writes. |
| `lunas_backend/src/controllers/workOrderReassignment.test.js` | Existing overdue/warning fixture and preservation assertions across handoff/acceptance/progress. |
| `lunas_web/src/components/work-orders/provider-incident-detail.tsx` | Read-only SLA/priority, status-only request, keep displayed stage after denied update. |
| `lunas_web/tests/agency-sla-integrity.spec.ts` (new) | Fixture browser tests for disabled amendment control and status-only/error-response behavior. |
| `README.md` | Current results, policy boundaries, backlog and handoff. |

### G. Test Execution Results

Prepared ignored backend/web copies in `.local-backups/environment-baseline-20261020/` were refreshed from this working tree using Git-listed source plus new files, retaining installed locked dependencies and excluding private environment files. ACCOUNT_TEST_MONGODB_URI was cleared. No live database/storage/delivery was accessed. Ignored logs: `step5-backend-results.json`, `step5-backend-tests.log`, `step5-web-build.log`.

| Test Area | Exact command | Passed | Failed | Skipped | Result / limitations |
| --- | --- | --- | --- | --- | --- |
| Before-fix reproduction | `npm.cmd test -- --runInBand --coverage=false agencySlaIntegrity` | 0 | 1 | 0 | Expected failure: priority replacement erased original SLA fields. |
| Backend full | `npm.cmd test -- --runInBand --json --outputFile=../step5-backend-results.json` | **556** | **2** | **40** | Exit 1; 55 suites pass, 2 fail, 1 skip. Same two baseline failures below. Isolated models/services; no real Mongo concurrency certification. |
| Backend lint | `npm.cmd run lint` | PASS | 0 | 0 | Exit 0. |
| Web lint/types | `npm.cmd run lint`; `npx.cmd --no-install tsc --noEmit` | PASS | 0 | 0 | Exit 0 each; updated UI/test source checked. |
| Web production build | `npm.cmd run build` | PASS | 0 | 0 | Exit 0, loopback fixture API and existing isolated session setting, telemetry disabled. |
| Browser | `npm.cmd run prepare:standalone`; `node scripts/run-playwright.mjs tests/agency-sla-integrity.spec.ts tests/field-role-provisioning.spec.ts` | **4** | 0 | 0 | New SLA UI cases plus Step 2 role regressions. Fixture HTTP backend, not real agency/database integration. |
| Mobile SDK-only | Cached Dart `--packages=.dart_tool/package_config.json tool/verify_field_role_routes.dart` | **12** | 0 | 0 | Original mobile, no Step 5 mobile-source changes. |
| Flutter | Cached Dart + `C:\src\flutter\bin\cache\flutter_tools.snapshot analyze --no-pub` and `test --no-pub` | 0 | 2 commands | 0 | Each exit 1 opening `C:\src\flutter\bin\cache\lockfile`; no permission changes. Full Flutter/device validation blocked. |
| Diff hygiene | `git diff --check` | PASS | 0 | 0 | No whitespace errors. |

Unchanged exact failures: `incidentValidation.test.js` — **sequential incident review workflow returns submitted and clarification-required records only from the assigned barangay queue** (old flat status-filter expectation); `scripts/dagupan-seed-config.test.js` — **local accounts cover all canonical barangays and matching provider/repair organizations** (42 expected, current 69). Neither assertion was changed. All 40 opt-in/skipped tests remain unexecuted.

During development, the first focused run had six new fixture failures (cross-realm cloned Dates failed instanceof and the older service mock omitted the new validator); the validator now accepts actual Date values across realms and the mock preserves it. An initial browser run had two fixture failures because the new provider fixture omitted the required email; corrected without bypassing authentication. Final results above supersede those runs.

### H. Regression Results

Step 4 baseline: 515 passes, 2 failures, 40 skips. Step 5: **41 additional passes**, same two failures/skips. The full run retains Step 2 current-task/role scopes, Step 3 throttling/CAPTCHA/account security, and Step 4 typed/current inspection, claim/version and legacy/closure denial tests. Existing repair assignment/reassignment/acceptance/progress/correction/evidence and SLA calculations remain passing. Terminal tests use helper/historical-state fixtures; no production closure route was reopened.

### I. Remaining Issues / Verification Limits

Institutional approval is still needed for final priority authority, SLA start event, active-priority amendments/recalculation, extension authority/reason/reference requirements, external procurement elapsed-time treatment, escalation recipients and final SLA compliance/incident closure. Current pending_procurement tracking does not pause, extend, clear or restart SLA. Unsupported pending funding/bidding/authorization/pause states are denied; no persistence states or maintenance authorization were invented (R2-T08 remains open).

Snapshot CAS and existing Step 4 durable claims are narrower than transactions. Notification delivery can race after a successful snapshot check, and incident/order normalization is sequential: a crash, conflicting order write or failed notification can leave partial normalization/acknowledgment until retry/reconciliation. A claim acquired after the incident normalization write cannot be atomically excluded from the subsequent order write with the current standalone architecture. Historical mismatched incident/order clocks are never silently replaced; agency progress rejects conflicting populated timing/priority. Per-record terminal outcomes may differ when pre-existing clocks differ; these need authorized reconciliation, not a fabricated common deadline.

No broad outbox/recovery redesign was added. Existing work-order mutation versions, event histories and notification idempotency keys remain. Continuous scheduling, recipient delivery, real overlap/failover, multi-client flows, cross-document recovery and historical-record compatibility require isolated MongoDB/storage integration and approved deployment acceptance. Flutter remains blocked. R2-T03 recovery/live-concurrency and positive-closure policy limits remain; R2-T05 evidence/data/infrastructure risks and R2-T06–09 workflow/routing/readiness/staffing work are not completed by this patch.

### J. Implementation Status

**IMPLEMENTED — UNVERIFIED** for live operation. Local reproduction and focused controller/helper/scheduler/browser regressions pass at the stated boundaries. Policy-dependent starts/amendments/closure remain **BLOCKED**. No production-readiness or atomic cross-document guarantee is claimed.

### K. Updated Development Backlog

R2-T04's ordinary-update deadline-erasure defect is corrected in source; live scheduling/concurrency/integration acceptance and institutional SLA authority remain open. Historical R2-05 claims below are superseded by this section only for the corrected SLA defect. No unrelated backlog requirement is marked complete.

### L. Next Developer Handoff

Preserve stored SLA timing, warning/escalation history, Step 4 claims and fail-closed amendment/closure gates. Rerun full backend/lint and focused browser checks from refreshed copies after changes. Validate scheduler snapshots, terminal normalization, failed delivery/retry and existing multi-role maintenance flows against isolated MongoDB/storage; obtain a writable Flutter SDK for device checks. Do not re-enable manual deadlines/priority changes to work around missing policy. Add an approved, auditable amendment path only after actor/start/extension/external-delay authority is settled.

**Next implementation task: R2-T05 — Evidence, data integrity, and infrastructure-security corrections.** Keep SLA/live-recovery and policy decisions explicitly tracked alongside that work.


## STEP 4 — R2-T03 INSPECTION AND INCIDENT TRANSITION INTEGRITY

**Status: PARTIALLY IMPLEMENTED.** The reproduced stale-closure/type-confusion paths and reachable legacy approval/closure bypasses are blocked in source and isolated tests. Positive final closure is **BLOCKED** by unresolved institutional authority. Database concurrency, recovery and multi-client integration remain **IMPLEMENTED — UNVERIFIED**, with the limitations below. This section supersedes the related unsafe-current-behavior claims and next-task recommendations in the preserved historical reports.

Date: 2026-10-20 (Asia/Shanghai), branch `revision`, HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`. Prior Steps 1–3 and the existing working tree were preserved. No commits, pushes, deployments, seeds, migrations, production/shared database operations or actual environment-file changes occurred. No dependencies or locks changed.

### A. Implementation Summary

Before correction, two isolated Express/controller reproductions both returned **200**: completion evidence passed initial review, and a completion inspection closed a different URL incident. The same tests now deny both actions without saving either document. Initial review binds URL incident, initial type, assigned Secretary, current pointer, submitted status, verified result for approval and the initial-only incident lifecycle. Existing work orders/completion cycles prevent initial approval from overwriting maintenance. Rejection/clarification retain evidence and use `tanod_rejected`/`clarification_required` incident states.

The old Secretary, provider and retired City Engineer closure mutations are disabled. `/complete` always returns **409 / CLOSURE_POLICY_UNRESOLVED**, including apparently valid completion evidence; it does not approve an inspection, close an incident or send closure notifications. This prevents stale, different-URL, consumed, wrong-type and correction-cycle evidence from authorizing closure without inventing a final authority. It is **not an implemented positive closure workflow**.

Existing category routing after current verified initial approval remains, with routing history retained. Routing now leaves `agencyStatus=not_routed`; it does not establish authorized maintenance readiness. New legacy work-order creation is blocked until the assessment/readiness policy and implementation are established. Existing work-order reads, assignment, worker acceptance, progress/evidence and provider correction remain available under their existing scopes; provider acceptance can no longer close reports.

### B. Files Modified

Exact Step 4 repository-relative paths (other working-tree edits belong to previous steps):

- `lunas_backend/src/controllers/tanodWorkflowController.js`
- `lunas_backend/src/controllers/incidentController.js`
- `lunas_backend/src/controllers/workOrderController.js`
- `lunas_backend/src/models/Incident.js`
- `lunas_backend/src/models/Inspection.js`
- `lunas_backend/src/routes/incidentRoutes.js`
- `lunas_backend/src/services/incidentTransitionService.js`
- `lunas_backend/src/services/inspectionMutation.js` (new)
- `lunas_backend/src/controllers/fieldRoleAccess.test.js` (extends Step 2 file)
- `lunas_backend/src/controllers/inspectionIntegrity.test.js` (new)
- `lunas_backend/src/controllers/incidentController.test.js`
- `lunas_backend/src/controllers/incidentValidation.test.js`
- `lunas_backend/src/controllers/workOrderHandoff.test.js`
- `lunas_backend/src/controllers/workOrderLifecycle.test.js`
- `lunas_backend/src/controllers/workOrderWorkflow.test.js`
- `lunas_backend/src/models/inspectionConcurrency.test.js` (new)
- `lunas_backend/src/services/incidentTransitionService.test.js`
- `lunas_backend/src/services/inspectionMutation.test.js` (new)
- `README.md`

No Step 4 web/mobile source change. Their existing action handlers propagate backend failures; old finalization/manual-approval controls can still appear and receive rejection. UI policy messaging and complete client workflow acceptance remain follow-up work, not proof of an available closure capability.

### C. Revised Transition Rules

| Action | Enforced prerequisite/result |
| --- | --- |
| Initial assignment | Same-barangay Secretary; submitted/clarification_required/tanod_rejected; no maintenance/completion cycle; active dedicated Tanod in that barangay. Active assignment cannot be replaced by repeating the request. |
| Tanod start/submit | Current typed pointer, URL incident, assignee and barangay; matching inspection/incident stage; completion additionally requires agency work_completed and current same-organization work order completed/provider_accepted. Start only assigned; submit only assigned/in_progress. Explicit verified/not_verified/unable_to_verify is required; no silent verified default. |
| Initial Secretary review | Assigned Secretary, submitted INITIAL inspection for URL incident and CURRENT initial pointer, incident tanod_verified with no maintenance/completion cycle. Only verified findings may approve and route. Other findings may be rejected or returned for clarification. Repeat/consumed review denies without duplicate history. |
| Completion assignment | Same-barangay Secretary, agency work_completed, compatible incident stage and current completed/provider_accepted work order bound to that incident/organization; no existing completion pointer in that cycle. |
| Completion correction | Current submitted COMPLETION record belonging to the incident and Secretary, agency work_completed and incident tanod_verified. Mark inspection rejected/reviewed, retain findings/photos, append correction_required history. Repeating the correction denies. Resuming work clears the old completion pointer, preserving the old inspection/history. |
| Agency progress | Responsible organization, existing current work order, compatible state; terminal/not_routed reports deny. Work_completed requires an actually completed/provider_accepted order and prior work_in_progress. Duplicate agency status denies. Existing priority/deadline logic is otherwise unchanged (R2-T04 remains open). |
| Final closure | No positive transition permitted until authority and full prerequisites are approved and implemented. Future implementation must atomically bind URL, current completion/type/result/review/version, incident and work order, non-correction state, authorized role/jurisdiction/organization, preserve SLA/history and consume the reference once. |
| Legacy mutations | `/incidents/:id/validate`, priority, manual route, create-work-order and retired final-work-order-review return 409 WORKFLOW_POLICY_REQUIRED. Provider accepted review returns 409 before writes. Authorized provider correction requires the current reverse-linked order/incident and retains existing work-order version CAS. |

Inspection submission uploads all files in **one existing rollback-aware evidence-service batch**, using the persisted incident category. Existing evidence is retained. A batch upload failure advances neither document. If a later save fails, uploaded objects may require reconciliation; no cross-storage/database atomicity is claimed.

### D. Authorization and Validation Matrix

| Role | Permitted actions / scope |
| --- | --- |
| Citizen | Existing own report submission/reads; no inspection, maintenance authorization or closure privilege. |
| Barangay Tanod | Own current task in current barangay; type-specific start/submission, findings/evidence. Historical own findings remain readable without stale live incident access. No approval/routing/closure. |
| Barangay Secretary (`barangay_official`) | Own barangay assignment; assigned initial review; current completion correction. No final closure while policy is unresolved. |
| Utility provider | Own routed organization reads; existing work-order management and corrective review under current order/incident scopes. Agency progress needs a compatible current order. No new readiness authorization or final closure. |
| Repair Personnel | Existing organization/assignment/current-order scopes, acceptance/progress/evidence. No Tanod verification, Secretary review or closure. |
| Administrator / retired City Engineer | No new workflow authority; existing account/RBAC restrictions retained. Retired final-review mutation fails closed even if called directly. |

Step 2 field scopes and Step 3 rate limits, CAPTCHA, account eligibility and token checks remain independently enforced by the real routers.

### E. Test Results

Checks ran in refreshed ignored `.local-backups/environment-baseline-20261020/lunas_backend` and `.../lunas_web` copies with locked dependencies; original mobile used its cached Dart configuration. ACCOUNT_TEST_MONGODB_URI was cleared. Model calls/storage/notifications were isolated spies/stubs; no live MongoDB or real delivery was used.

| Command / evidence | Actual result |
| --- | --- |
| Before-fix `npm.cmd test -- --runInBand --coverage=false inspectionIntegrity` | **2 failures**, both unsafe requests returned 200; retained as rejecting regression tests. Initial launcher used a nonexistent jest.config.js, corrected to package-discovered Jest before reproduction. |
| Backend `npm.cmd run lint` | **PASS, exit 0**. |
| Backend `npm.cmd test -- --runInBand --json --outputFile=../step4-backend-results.json` | **515 passed, 2 failed, 40 skipped; 54 suites passed, 2 failed, 1 skipped; exit 1**. JSON/log: `step4-backend-results.json`, `step4-backend-tests.log`. |
| Web `npm.cmd run lint`; `npx.cmd --no-install tsc --noEmit`; `npm.cmd run build` | **PASS, exit 0 each**. Build uses loopback fixture API and existing isolated session setting, telemetry disabled; `step4-web-build.log`. |
| Web `npm.cmd run prepare:standalone`; `node scripts/run-playwright.mjs tests/field-role-provisioning.spec.ts` | **2 browser cases passed** (role provisioning and Tanod web restriction); fixture backend only. No browser claim about real closure/agency integration. |
| Mobile cached Dart `--packages=.dart_tool/package_config.json tool/verify_field_role_routes.dart` | **12 SDK-only checks passed**. |
| Cached Dart + `C:\src\flutter\bin\cache\flutter_tools.snapshot analyze --no-pub` and `test --no-pub` | Both **exit 1**, unable to open shared SDK `C:\src\flutter\bin\cache\lockfile`. No ACL/SDK changes. Full mobile/device integration remains blocked. |
| `git diff --check` | **PASS**. |

The **same two pre-existing failures** remain: `incidentValidation.test.js` queue expects the older flat status filter; `scripts/dagupan-seed-config.test.js` expects 42 accounts while current config has 69. Neither assertion was changed to hide its failure. Tests that previously required removed legacy mutations/closure were revised to assert 409/no writes. Removing their now-unused queued mocks also prevented those old fixtures from leaking into subsequent rejection/duplicate tests. Initial full iteration had 480 passes/23 failures while these superseded expectations were being updated; final counts above supersede that development run.

Focused coverage includes wrong type/URL/current pointer/lifecycle/result, positive initial decisions and actor/time assignment, existing maintenance rejection, duplicate assignment/review/submission/correction/closure, compatible completion work-order checks, evidence retention, one upload batch/failure, legacy denies, deterministic claim overlap and partial-write fault, and actual Mongoose version-filter generation/rejection using a mocked collection. Race tests do **not** certify MongoDB lock durability or transaction behavior.

### F. Regression Results

Compared with Step 3's 478 passes, the final run has **37 additional passes**, the same two baseline failures and 40 skipped. Existing report submission, field access/RBAC, repair progress/evidence, SLA calculation/projection and auth/security suites introduce no new failing assertions. Provider corrective review remains positive-tested. Old positive new-work-order and closure behavior is deliberately denied pending authority. Historical terminal SLA records remain readable; no terminal SLA record was rewritten or deleted.

### G. Remaining Risks

A persisted `inspectionMutation` token is acquired with conditional `findOneAndUpdate` before inspection assignment/start/submit/review, completion assignment/correction, agency status and provider corrective review. Competing actions receive 409; only the owner releases the token. Inspections now use Mongoose optimistic concurrency with the existing `version` field, and version conflicts return 409. Shared incident-transition filters exclude held claims. Current task pointers, not inspection count, determine which assignment can act. No unique-index migration was attempted on unknown historical data.

**This is not a transaction/outbox.** Writes to Incident, Inspection, WorkOrder, storage, notifications and audit are still sequential. An exception/crash leaves the non-expiring claim in place, including failures before a first business write, notification failure after persistence, or unlock failure. A partial inspection or orphan task/object can remain; subsequent guarded actions fail closed instead of automatically taking over. There is no operator recovery endpoint or automated reconciliation in this task. An authorized operator must compare claim actor/action/time/token, current pointers, inspection/order versions, history and stored evidence, reconcile the intended state, and clear only that exact token after review. Never blindly clear claims by age or retry the original request. Live claim durability and a safe operational reconciliation procedure are deployment prerequisites.

Older repair mutations retain their existing work-order version CAS and sequential incident synchronization; they do not all acquire this incident claim. Those multi-document failure windows and non-durable side effects remain open. No global transaction-level or exactly-once delivery guarantee is claimed. Client/server process termination, DB failover, real simultaneous worker/inspection operations and storage cleanup require isolated Mongo/storage integration verification.

R2-T04 deadline erasure on agency priority change remains open and its existing behavior was not redesigned here. R2-T05 evidence/integrity/privacy configuration, R2-T06 complete Secretary/Tanod workflow (including reassignment/clarification/category fixes), R2-T07 agency routing, R2-T08 assessment/external-processing/readiness authorization and R2-T09 repair staffing/handoff remain open. Category agency choices and institutional SLA/priority/start/final-closure authority were not approved by this patch. Flutter and live MongoDB limitations remain.

### H. Implementation Status

| Area | Classification |
| --- | --- |
| Isolated reproduction and local regression evidence | **VERIFIED IMPLEMENTED** at the stated controller/HTTP/model-spy boundaries only. |
| Source guards, persisted claims and inspection version CAS | **IMPLEMENTED — UNVERIFIED** in real MongoDB/multi-client operation. |
| R2-T03 overall / full concurrency and recovery | **PARTIALLY IMPLEMENTED**; safe denial is available, cross-document recovery/integration still open. |
| Positive final closure and new maintenance authorization | **BLOCKED** pending institutional policy and subsequent implementation. |

### I. Next Developer Handoff

Preserve the guarded current-task/type rules, dedicated Tanod/Repair roles, rate limits/CAPTCHA and all operational history. Reproduce current checks against refreshed source. Before enabling deployment, validate claims/version filters and partial-write recovery with isolated MongoDB/storage, then real multi-role browser/device flows. Resolve closure/readiness authority before replacing fail-closed endpoints; do not re-enable old mutations as a workaround. Build recovery/outbox handling without silently discarding partial records or replaying notifications.

**Exact next development task: R2-T04 — SLA deadline and lifecycle integrity.** Preserve existing deadlines on priority change, test procurement/start/correction/terminal projections and amendments, and keep unresolved SLA authority explicit. R2-T03 integration/recovery and final-closure policy remain tracked alongside that task.


## STEP 3 — R2-T02 API AND AUTHENTICATION SECURITY CORRECTIONS

**R2-T02 status: IMPLEMENTED — UNVERIFIED in deployed operation.** The restored middleware, auth route wiring and CAPTCHA role boundary are verified at isolated HTTP/controller test boundaries. Real reverse-proxy traffic, public Turnstile delivery, shared-store/multi-instance behavior and real multi-role client/database integration are not certified. This section supersedes removed-rate-limit/platform-bypass findings below; unrelated R2 issues remain open. No role/incident/inspection/agency/maintenance/SLA/closure policy was changed.

Date: 2026-10-20 (Asia/Shanghai); branch `revision`; HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`. The initial working tree already contained the preceding README/AGENTS and Step 2 source/tests; those changes were preserved. No commit, push, deployment, migration, seed, database operation or real account modification occurred. Existing private environment files and credentials were not read or changed. No dependency or lockfile changed; the locked `express-rate-limit` **7.5.1** is reused.

### Implementation and exact modified files

| Repository-relative file | Step 3 change |
| --- | --- |
| `lunas_backend/src/middleware/securityRateLimiter.js` (new) | Shared strict positive configuration, generic 429 handler, IPv4/IPv6 keys, proxy policy, API/auth limiter factories, canonical email normalization. Default stores are independent process-local MemoryStore instances. |
| `lunas_backend/src/server.js` | Global `/api` budget before body parsing; explicit trusted proxy addresses, deny trust-all/hop-count configuration. Root health endpoints remain outside this budget. |
| `lunas_backend/src/routes/authRoutes.js` | Aggregate mutation IP budget, shared public-security IP/email limits, refresh IP limit and authenticated security-account limits, retaining login-specific middleware and all existing validation/protect/controller gates. |
| `lunas_backend/src/middleware/loginRateLimiter.js` | Retain failed-login account/IP budgets and skip-success behavior; reuse safe IP normalization, strict config and consistent response. |
| `lunas_backend/src/controllers/authController.js` | Require CAPTCHA for stored Secretary/provider/admin roles even when platform is absent/android/ios, before session issuance; preserve mobile-role contract and existing explicit-web challenge. |
| `lunas_backend/src/middleware/securityRateLimiter.test.js` (new) | Controlled HTTP budget/header/proxy/NAT/account/IPv6/window tests. |
| `lunas_backend/src/routes/authRateLimits.test.js` (new) | Actual auth router/validator wiring with isolated controller/protect stubs; positive payloads and cross-route abuse budgets. |
| `lunas_backend/src/controllers/authController.test.js` | Add stored-role CAPTCHA, native compatibility, generic invalid-credential and production-bypass regression cases; preserve Step 2 login tests. |
| `lunas_backend/src/server.test.js` | Exercise actual server API budget across paths while health remains callable and Mongo readiness remains 503 without a database. |
| `lunas_backend/.env.example`, `.env.example`, `docker-compose.yml` | Publish/pass the configurable defaults below, including explicit proxy policy. Actual `.env` files remain untouched. |
| `infra/aws/deploy/nginx.conf` | Public edge overwrites X-Forwarded-For with its socket client, discarding supplied forwarding chains. No Nginx service was started or deployed. |
| `README.md` | Current policy, verified results, deployment limitations and updated R2-T02/next-task handoff. No Step 3 client-source or AGENTS edit. |

Historical `fdaae5c` confirms the removed API default was 100 and shared auth default 20 per 15 minutes. Restored defaults below deliberately increase shared-IP aggregate budgets to reduce interference with BFF/NAT users and polling; these are configurable engineering baselines, not measured production capacity. Read-only auth polling does not consume mutation/security-account budgets.

### Rate-limiting policy

All windows below default to **900000 ms / 15 minutes**, with independent `RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_WINDOW_MS` and `LOGIN_RATE_LIMIT_WINDOW_MS`. Configured integers must be 1–2147483647; blank/absent values use defaults, zero/negative/noninteger values fail application construction rather than disabling protection.

| Boundary / protected endpoints | Counter/key | Default / configuration |
| --- | --- | --- |
| Every `/api` version/path, including unknown paths and unauthorized calls | All requests per resolved IP; before JSON/body parsing | **1000**, `RATE_LIMIT_MAX_REQUESTS` |
| `/auth` state-changing requests, including login/refresh/logout | Aggregate per IP, including successful and failed attempts; GET/HEAD/OPTIONS excluded | **200**, `AUTH_RATE_LIMIT_MAX_REQUESTS` |
| POST register, activate-account, register/verify, register/resend, forgot-password, forgot-password/verify, reset-password | One shared sensitive-public IP bucket across all those paths | **60**, `AUTH_SENSITIVE_IP_MAX_REQUESTS` |
| Same sensitive public paths when an email is present | One shared SHA-256 key of canonical email across those paths, independent of IP; existing express-validator normalization precedes keying | **20**, `AUTH_ACCOUNT_MAX_REQUESTS`; activation without email still has sensitive IP/aggregate/global limits |
| POST login | Existing failed-login account/IP buckets; successful requests are decremented from these two counters, but still count against aggregate/global | **10** account / **100** IP, `LOGIN_RATE_LIMIT_MAX_REQUESTS` / `LOGIN_IP_RATE_LIMIT_MAX_REQUESTS` |
| POST refresh | IP bucket independent of login's failed-attempt budget; existing refresh-token validation/rotation/revocation retained | **120**, `REFRESH_RATE_LIMIT_MAX_REQUESTS`, plus auth aggregate/global |
| Authenticated recovery-email request/verify, profile PUT/PATCH, change-password, logout | One security-account bucket keyed by **protect-loaded user ID**, not request body, bearer string or IP | **20**, `SECURITY_ACCOUNT_MAX_REQUESTS`; protect runs before account counting, aggregate/global still apply |
| GET auth/me and recovery-email/status | Existing protect and global API budget; no sensitive-mutation/account budget | Prevent read polling from exhausting account security mutations |
| Root `/health`, `/health/ready` | Intentionally outside API/auth budgets; readiness still checks only Mongo connection state | Cheap process/dependency-state probes, not authenticated operational APIs. CORS middleware also handles preflight OPTIONS before the API limiter; preflight performs no auth operation. |

429 bodies consistently contain `success:false`, `code:RATE_LIMITED` and a generic retry message; the library supplies `Retry-After` and draft-7 RateLimit headers. Neither plaintext email, account match/role nor key values appear in the limiter response. Limits apply server-side and never substitute for credentials, validation, token revocation, role or record authorization. Refreshing a token does not reset a verified user's security-account bucket; changing paths/methods does not reset a shared family bucket.

IPv4-mapped IPv6 and plain IPv4 share keys. IPv6 addresses are canonicalized/grouped by **/56**, preventing spelling or privacy-address rotation within that prefix from creating fresh buckets. Invalid IP values fall into one conservative unknown bucket. Different verified users have distinct account counters even behind one BFF/NAT; shared IP caps can still affect others on that network, and /56 grouping can group multiple legitimate addresses. Public-account/failed-login budgets can temporarily throttle a targeted account; they are finite windows, not account suspension. Calibrate defaults to observed legitimate traffic without removing account controls.

**Proxy deployment requirement:** TRUST_PROXY absent/0/false trusts no forwarding header. Otherwise supply only verified proxy peer IP addresses or CIDRs, comma separated. Old `true` or numeric-hop settings such as `1` now fail fast; migrate configuration deliberately before deployment. Express uses the nearest untrusted address rather than an arbitrary leftmost XFF value. The supplied public-edge Nginx config overwrites XFF, and backend ingress must remain restricted to that edge. Do not trust public client ranges or copy browser forwarding headers into the BFF. The current BFF does not forward a separately authenticated browser IP, so its users share an outbound IP. Docker NAT can change the observed proxy peer; determine it in an authorized deployment test rather than assuming loopback. Default TRUST_PROXY=0 is conservative behind an unconfigured proxy and can aggregate clients; it does not trust attacker-supplied addresses.

**Store limitation:** counters live only in each Node process and reset on restart; replicas do not coordinate quotas. This is not a distributed abuse guarantee. Use reviewed shared-store/edge controls and ingress validation before horizontal scaling, retaining account scopes and fail-closed error handling. No new store/infrastructure service was introduced, and no deployment topology or throughput test was run.

### CAPTCHA trust boundary and compatibility

Explicit `platform=web` keeps its existing pre-credential challenge behavior. For non-web/omitted platform requests, invalid credentials always receive the same generic 401 for unknown, citizen or privileged accounts. **After valid credentials and account eligibility checks**, the persisted role `barangay_official`, `utility_provider` or `admin` requires a valid challenge before issuing tokens. Missing/android/ios platform cannot waive that server requirement. This ordering avoids advertising role/account existence through a challenge response before credentials have been validated; it does not claim timing-side-channel resistance, nor does it gate every native password comparison on CAPTCHA. Failed-login/IP/account throttles remain the password-guessing boundary for native requests.

Citizen, barangay_tanod and repair_personnel native logins still send email/password without CAPTCHA or platform. Existing web actions still send platform=web plus captchaToken; no client request fields, session shape or client source changed. Reused captchaService verifies provider success and configured hostname/action; its network call is mocked in tests. Missing/rejected required challenge yields existing 400 behavior; provider failure yields existing 503. Nonproduction development bypass remains explicitly gated by NODE_ENV != production; production ignores the bypass flag, verified by an isolated test. Real Turnstile delivery and deployed hostname/action configuration remain unverified.

### Executed checks and regression baseline

Backend/web commands ran in the prepared **`.local-backups/environment-baseline-20261020/lunas_backend`** and **`.../lunas_web`** copies, refreshed to this uncommitted working tree including new tests and Step 2 files. Hash comparison found no source differences in the prepared components. Dependencies/locks stayed unchanged, opt-in ACCOUNT_TEST_MONGODB_URI was cleared, and no real services/account data were used. Local logs/JSON remain ignored; do not publish raw synthetic fixture dumps as operational records.

| Command / evidence | Actual result | Scope and comparison |
| --- | --- | --- |
| Backend `npm.cmd test -- --runInBand --json --outputFile=../step3-backend-results.json` | **478 passed, 2 failed, 40 skipped; 51 suites passed, 2 failed, 1 skipped; exit 1** | **49 additional passes** vs Step 2 (429). Same two prior contract failures: incidentValidation queue-filter expectation and dagupan-seed-config expected 42 vs actual 69 accounts. Both inspected and left unchanged. `step3-backend-tests.log` / JSON. |
| Limiter/router subsets within that full run | **17 securityRateLimiter + 13 authRateLimits cases pass** | Actual isolated HTTP budgets/429/headers; spoofed forwarding, explicit proxy chain, unsafe proxy/limit config, IPv4-mapped/IPv6 /56, normalized email variants, distinct users behind NAT, token-string/body changes not changing verified identity, read polling, fake-clock expiry. Router tests cover registration/activation/email OTP/resend/recovery/reset/refresh before invalid payload processing and valid registration/OTP/recovery/refresh shapes. Those router controllers/protect are stubs; real crypto/DB/delivery is not claimed from them. |
| Auth/security regressions within full run | **40 authController, 2 loginRateLimiter, 4 server, 2 captchaService and all 25 Step 2 fieldRoleAccess cases pass** | Stored-role omitted/android/ios challenge denies, valid/rejected challenge, native six-role contract separation, generic invalid credentials, production flag ignored. Actual server API quota and health exception tested. Existing refresh/revocation/suspended-user/account/work-order suites introduce no new failures; authorization remains independently enforced. |
| Initial focused test development run | 69 passed, 2 failed, exit 1; corrected before final full run | Two new positive router fixtures used a refresh string below the existing 20-character validation minimum. Fixed the fixture, not validators or auth behavior; final full run above passes both cases. |
| Backend `npm.cmd run lint` | **PASSED, exit 0** | Existing correctness rules retained. |
| Web `npm.cmd run lint`; `npx.cmd --no-install tsc --noEmit`; `npm.cmd run build` | **PASSED, exit 0 each** | Unchanged Step 2 client source; build uses existing isolated fixture session setting and loopback API, telemetry disabled. No actual backend login or public CAPTCHA delivery implied. `step3-web-build.log`. Browser suite NOT RUN in Step 3; earlier Step 1/2 browser results remain historical. |
| Original mobile cached Dart `--packages=.dart_tool/package_config.json tool/verify_field_role_routes.dart` (cwd lunas_mobile) | **12 SDK-only route checks pass, exit 0** | No mobile source/contract change. Full Flutter analyzer/widget/device tests NOT RUN in Step 3; Step 1/2 shared SDK cache lockfile blocker remains. |
| Deployed Nginx/Compose, distributed store, live DB/email/CAPTCHA/storage, multi-role real clients | **NOT RUN** | Nginx/Docker unavailable on PATH; no stack launched, production request sent or infrastructure applied. Source config is not deployed verification. |

### Remaining risks and next handoff

R2-T01's distinct Tanod/repair identities, scoped inspection/order reads and restored routes remain intact; no data mapping/conversion was run. Do not recreate the rate-limit families or trust the old removed-limit claims as current source truth. Before release: configure exact trusted peers and isolated/live Turnstile hostname settings, test forwarded traffic through the real edge/BFF, measure shared-IP false positives, and choose coordinated quotas for multiple replicas. No account enumeration/timing penetration test, real credential/refresh persistence or full client/backend six-role acceptance is claimed.

Unrelated P0 findings remain: stale completion closure and inspection type confusion; legacy approval/work authorization bypass; SLA priority/deadline erasure; task/incident races and non-durable side effects; managed/legacy evidence and privacy-default contradiction; DB root principal, global findings aggregate and count-derived numbering. R2-T03–13 and institutional authority decisions remain open. **Next major task: R2-T03 — guard stale incident finalization, separate inspection review types and enforce safe workflow transitions**, preserving these throttles and Step 2 assignment restrictions. Do not deploy, seed, migrate, alter official authority or clear those findings from this security baseline alone.

---

## STEP 2 — TANOD / REPAIR ROLE SEPARATION AND RBAC CORRECTION

**R2-T01 status: IMPLEMENTED — UNVERIFIED as a complete client/database/storage workflow.** Backend authorization/provisioning and focused web UI boundaries have passing relevant tests; mobile route policy passes SDK-only checks. Full Flutter analysis/widget tests and real persistence/storage authorization remain unverified. This section supersedes role/access/navigation claims in the earlier October 20 audit; Step 1 is preserved as a historical test baseline. R2-T02–13 remain separate tasks.

### Task and implementation files

Date: 2026-10-20 (Asia/Shanghai). Branch `revision`, HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`; no new commit. Initial working tree contained only existing README/AGENTS modifications from the preceding steps, which were preserved. AGENTS was not edited in Step 2. No package manifest/lock, migration/seed, model artifact, production configuration or stored application data was changed.

| Component | Files changed / purpose |
| --- | --- |
| Account identity/provisioning | `lunas_backend/src/utils/accountPolicy.js`, `src/models/User.js`, `src/middleware/accountValidation.js`, `src/controllers/authorizedAccountController.js`: add **barangay_tanod** to authorized roles, require canonical assigned barangay, support administrator-approved activation/provisioning; reject unknown login roles. Preserve repair_personnel and its organization/optional barangay. Admin repair provisioning now accepts its required repair organization instead of treating it as a verifier account. |
| Incident and inspection access | New `lunas_backend/src/services/fieldIncidentAccess.js`; revised `src/services/jurisdictionService.js`, `src/controllers/incidentController.js`, `src/controllers/tanodWorkflowController.js`, `src/routes/incidentRoutes.js`: generic field-role scopes deny by default; explicit relationship resolution controls list/detail/history/SLA/nearby and evidence projection. Only dedicated active Tanods can be selected for inspection or invoke inspection list/start/submit. Start/submit bind URL incident, inspection assignee, current reference, barangay, task state and incident phase; invalid inspection IDs validate before upload processing. |
| Mobile | `lunas_mobile/lib/features/auth/domain/auth_role_policy.dart`, `presentation/controllers/auth_controller.dart`, `lib/core/routes/app_router.dart`; shared `lib/features/repair/routes/repair_routes.dart`, `presentation/widgets/repair_widgets.dart`, `presentation/screens/tanod_home_screen.dart`, `repair_profile_screen.dart`; `lib/features/notifications/presentation/screens/notification_details_screen.dart`. Auth policy exposes three independent mobile roles. `/tanod` and `/tanod/inspections` reuse existing Tanod screens; `/repair` and `/repair/work-orders` restore existing RepairDashboardScreen and AssignedWorkOrdersScreen. Shared profile/notification shell follows authenticated role; repair notification links open the linked work order, Tanod links stay in inspections. Cross-role URL entry redirects to the correct home. |
| Web | `lunas_web/src/types/index.ts`, `src/lib/permissions.ts`, `src/lib/authorized-accounts.ts`, `src/lib/auth/dal.server.ts`, `route-policy.ts`, `src/components/admin/admin-console.tsx`, `auth/unauthorized-state.tsx`, `validation/validation-review.tsx`: distinct Tanod role/provisioning option and barangay input; repair organization input retained separately. Tanod has no web operational permissions. Secretary selector labels identify Tanods, not repair workers. |
| Tests | New `lunas_backend/src/controllers/fieldRoleAccess.test.js`; expanded `src/controllers/authController.test.js`, `src/models/User.test.js`; new `lunas_web/tests/field-role-provisioning.spec.ts`; expanded `lunas_mobile/test/auth_role_policy_test.dart`; new SDK-only `lunas_mobile/tool/verify_field_role_routes.dart`. Existing unrelated expectations were not changed. |

Backend `src/` paths in that table are prefixed by `lunas_backend/`; mobile abbreviated `presentation/` paths are under their named auth or repair feature. Existing JWT issuance/serialization already returns the stored role; new credential-login tests exercise citizen, Tanod and repair role session issuance. `protect` still reloads account status/token version and denies suspended, archived, deactivated or revoked sessions. No automatic account conversion or new operational approval power was introduced.

<details>
<summary>Exact Step 2 changed-file manifest (repository-relative)</summary>

```text
README.md
lunas_backend/src/controllers/authController.test.js
lunas_backend/src/controllers/authorizedAccountController.js
lunas_backend/src/controllers/fieldRoleAccess.test.js
lunas_backend/src/controllers/incidentController.js
lunas_backend/src/controllers/tanodWorkflowController.js
lunas_backend/src/middleware/accountValidation.js
lunas_backend/src/models/User.js
lunas_backend/src/models/User.test.js
lunas_backend/src/routes/incidentRoutes.js
lunas_backend/src/services/fieldIncidentAccess.js
lunas_backend/src/services/jurisdictionService.js
lunas_backend/src/utils/accountPolicy.js
lunas_mobile/lib/core/routes/app_router.dart
lunas_mobile/lib/features/auth/domain/auth_role_policy.dart
lunas_mobile/lib/features/auth/presentation/controllers/auth_controller.dart
lunas_mobile/lib/features/notifications/presentation/screens/notification_details_screen.dart
lunas_mobile/lib/features/repair/presentation/screens/repair_profile_screen.dart
lunas_mobile/lib/features/repair/presentation/screens/tanod_home_screen.dart
lunas_mobile/lib/features/repair/presentation/widgets/repair_widgets.dart
lunas_mobile/lib/features/repair/routes/repair_routes.dart
lunas_mobile/test/auth_role_policy_test.dart
lunas_mobile/tool/verify_field_role_routes.dart
lunas_web/src/components/admin/admin-console.tsx
lunas_web/src/components/auth/unauthorized-state.tsx
lunas_web/src/components/validation/validation-review.tsx
lunas_web/src/lib/auth/dal.server.ts
lunas_web/src/lib/auth/route-policy.ts
lunas_web/src/lib/authorized-accounts.ts
lunas_web/src/lib/permissions.ts
lunas_web/src/types/index.ts
lunas_web/tests/field-role-provisioning.spec.ts
```

The AGENTS.md diff predates Step 2 and was preserved, not modified by this task.

</details>

### Record access and actual permission matrix

**Tanod current access:** canonical user/inspection/incident barangay must match; Inspection.tanod must equal the current user; task must be assigned/in_progress/submitted; the incident's initialInspection or completionInspection must point to that exact task. Incident phase must be tanod_assigned/tanod_in_progress/tanod_verified; completion inspections additionally require agencyStatus=work_completed. Generic incident detail/history/list/SLA data uses restricted citizen-safe projections, not official review/other-inspector records. Signed incident photos are minted only after scoped reads. Submit requires assigned/in_progress; submitted tasks are read-only.

**Tanod history:** own tasks in the currently assigned barangay retain findings/result/review metadata and signed own inspection evidence. Finished/stale tasks do not populate incident, citizen photos/location or current incident updates; stale active tasks serialize as `historical` without mutating stored status. Historical tasks never authorize start/submit. Former assignees cannot use a replaced current-task pointer. Previously issued signed URLs may remain valid until their configured expiration; immediate object-store revocation was not added.

**Repair access:** incident reads require an existing work order from the existing `buildWorkOrderScope` (current assignedTo, pending/accepted assignment, matching repairOrganization and optional barangay), plus reciprocal Incident.workOrder and matching incident routing organization. Barangay alone grants nothing. Existing assigned work-order history remains subject to its existing scope; former/different-org workers cannot gain incident access through retained history. Work-order progress/evidence/correction/version guards remain unchanged. No unrestricted historical incident permission was added.

| Core role | Platform / read scope | Permitted operations and exclusions |
| --- | --- | --- |
| Citizen (`citizen`) | Mobile; own reports/notifications | Submit/track own report; no inspection, maintenance management or official decisions. |
| Secretary (`barangay_official`) | Web; own barangay incident/inspection review | Select same-barangay eligible Tanod and use existing review actions. This task does not approve the current closure/priority policy or redesign the review gate. |
| Tanod (`barangay_tanod`) | Mobile; current assigned inspection/incident, own restricted task history | Start/submit findings/evidence; no repair work-order endpoint, Secretary approval, routing, priority, completion approval or closure authority. |
| Agency Officer (`utility_provider`) | Web; exact responsible organization | Existing agency/order operations retained; no new cross-org scope, routing policy, SLA authority or closure mandate. |
| Repair (`repair_personnel`) | Mobile; current assigned matching-organization work orders and linked incidents | Existing maintenance progress/evidence/completion/corrective work; no Tanod submission or unrelated same-barangay reads. Explicit worker acceptance and active handoff limitations remain R2-T09. |
| Administrator (`admin`) | Web; account governance/audit/support | Provision eligible Tanod using offline approval, activation and existing admin controls; no ordinary operational incident approval. Existing explicit false-report review exception retained. |

Retired `city_engineer` stays in schema/history for compatibility and cannot log in. Six core roles do not require deleting that historical enum. `/users/repair-personnel` remains the existing Secretary-only compatibility selector, now returning only eligible Tanod identities; provider staffing route restoration remains R2-T09. Incident review/routing/SLA/closure authorities and procurement behavior were not redesigned.

### Executed verification and regression evidence

Backend/web checks used **`.local-backups/environment-baseline-20261020/lunas_backend`** and **`.../lunas_web`**, with modified/new source/tests explicitly refreshed from this working tree before execution. Existing dependencies from Step 1 were reused; no dependency upgrade. These copies test uncommitted Step 2 source, not merely HEAD or the frozen Step 1 files. Original mobile source was checked directly with cached Dart. Logs/results remain ignored locally.

| Check / exact command | Actual result | Boundary / limitation |
| --- | --- | --- |
| Backend `npm.cmd test -- --runInBand --json --outputFile=../step2-backend-results.json` (ACCOUNT_TEST_MONGODB_URI cleared) | **429 passed, 2 failed, 40 skipped; 49 suites passed, 2 failed, 1 skipped; exit 1** | Compared with Step 1, 28 additional passes and one additional discovered skipped DB case. Only prior failures remain: incidentValidation queue-filter contract and dagupan-seed-config 42 vs 69 accounts. No unrelated test was changed to hide a failure. |
| New `fieldRoleAccess.test.js` in that run | **25 HTTP/model-stub security cases pass** | Real Express routes/validators/JWT protect/authorize/scoped serializers; process-local model query evaluator and fake storage/notification/audit/activation. Includes assigned reads/history/SLA, restricted evidence/list, submission, other verifier, wrong barangay, stale/missing/finished task, closed incident, completion during correction, unassigned same-barangay repair list/nearby/detail, wrong organization/reverse link/former worker, suspension/revocation, cross-role actions, malformed URL references and admin provisioning. Not real MongoDB/storage/delivery. |
| Expanded auth/model tests in full run | **Citizen/Tanod/repair credential login/session cases and canonical Tanod/repair compatibility validation pass** | Mocked persistence/session helpers for login; real Mongoose synchronous validation. Existing workOrderLifecycle, workOrderWorkflow, workOrderReassignment, workOrderHandoff, repair personnel, notifications, auth/middleware/account suites run within the same baseline and introduce no new failures. |
| Backend `npm.cmd run lint` | **PASSED, exit 0** | Static rules only. |
| Web `npm.cmd run lint`; `npx.cmd --no-install tsc --noEmit`; `npm.cmd run build` | **PASSED, exit 0 each** | Build uses existing fixture-only session setting and loopback API, telemetry disabled; no real backend. An initial accidental root-directory lint call returned ENOENT (no root package.json); corrected component commands above passed. |
| Web `npm.cmd run prepare:standalone`, then `node scripts/run-playwright.mjs field-role-provisioning.spec.ts` | **2 passed, 0 failed/skipped; exit 0**, 2.7 seconds | Admin sees separate provisioning fields; Tanod cannot enter administrator workspace. Local fixture APIs only. Full older browser suite was not rerun; its 11 Step 1 contract failures are not declared fixed. |
| Original mobile `C:\src\flutter\bin\cache\dart-sdk\bin\dart.exe --packages=.dart_tool/package_config.json tool/verify_field_role_routes.dart` (cwd lunas_mobile) | **12 SDK-only checks pass, exit 0** | Exercises the same pure home/route allowlist called by app router; no Flutter widget, emulator or backend integration. Dart formatting of affected files also succeeded. |
| Original mobile cached Dart invoking `C:\src\flutter\bin\cache\flutter_tools.snapshot analyze --no-pub`, then `test --no-pub` | **BLOCKED, exit 1 each**, bounded to 15 seconds | Both fail opening `C:\src\flutter\bin\cache\lockfile`. Expanded Flutter tests are present but not executed; shared SDK/ACLs were not changed. |
| Real MongoDB, private storage, signed URL fetching, device workflow, email/push | **NOT RUN** | No isolated services/device available. AI not changed or rerun; Step 1 ML blocker remains unrelated. |

### Compatibility, rollout plan and remaining work

No existing users, Inspection.tanod identifiers, incident/order references, progress, photographs, timestamps, histories, audit logs, notification records or SLA deadlines were edited. Existing repair accounts are not Tanods; legacy inspections pointing at repair identities now fail closed for field mutation. New approved Tanod accounts can be provisioned without converting repair accounts. Do not execute `migrate:tanod-workflow` to bypass this boundary: that older script clears repair identity fields and is unsuitable as an automatic rollout.

Any legacy data mapping requires a **separately reviewed plan**, not a migration executed here: (1) read-only dry-run inventory of legacy verifier accounts/tasks and all repair order/history references; (2) reviewed classification and formal personnel/barangay approval; retain valid repair IDs, provision separate Tanod IDs where both duties exist; (3) encrypted backup plus isolated restore check and immutable before/after mapping; (4) explicitly authorized task reassignment preserving original assignee/history under R2-T06, not destructive rewriting of old findings; (5) validate account activation, current pointers, org/barangay/assignment denies, row counts, evidence keys and preserved SLA; (6) rollback using reviewed mapping/version guards and backup without discarding post-cutover work. No bulk conversion, new seed fixture or migration code is supplied in this task.

R2-T01's backend source/security checks are complete at mocked HTTP boundaries; **full mobile/live-integration status is IMPLEMENTED — UNVERIFIED**. Live rollout of legacy inspection tasks needs the mapping/reassignment process above. Do not recreate the role, account option, scoped readers or restored mobile dashboards. Re-run the documented checks against refreshed copies after changes, and obtain a writable Flutter SDK plus isolated DB/store for negative authorization/evidence/device acceptance. DB query-to-mutation races and durable recovery remain R2-07/R2-T03; this change rejects stale references present at request authorization but does not claim transaction-level concurrency safety.

Remaining task boundaries: R2-T06 owns inspection reassignment/clarification/category correction and fuller evidence/task state behavior; R2-T09 owns provider staffing contract restoration, explicit worker accept/decline and safe active handoff. R2-T02 removed throttling, R2-T03 stale final closure/type confusion, R2-T04 SLA loss, and R2-T05 evidence/integrity/privacy issues remain open. **Next P0 implementation: R2-T02 — restore removed API and non-login authentication rate controls**, preserving the role/assignment restrictions established here. No commit, push, deployment or production-data operation occurred.

---

## Step 1 — Development environment and baseline testing (2026-10-20)

**Status: PARTIALLY COMPLETE.** Backend and web dependencies were installed successfully from unchanged locks in disposable source copies. Backend lint, web lint/typecheck/production build and five lightweight AI checks pass. Backend has two remaining executed assertion failures; browser fixtures have **17 passes / 11 failures**; the AI subset has five missing-dependency failures. Flutter is blocked by shared SDK cache access. This section updates environment/test evidence only; all October 20 R2 findings and implementation tasks below remain pending. No business logic, tests, roles, permissions, workflow or models were changed.

### Snapshot, preparation and reproducibility

- Branch `revision`, HEAD `3cb447fe3c18ce79aa8603b38178a09b477d8cbb`; Windows 11 `10.0.26200`, Windows PowerShell `5.1.26100.9711`. Date uses Asia/Shanghai. Start already had modified `README.md` and `AGENTS.md` from the preceding audit; both were preserved. This step adds to README only, with no further AGENTS edit.
- Read root/nested instructions, current audit, component setup guides, package manifests/locks, ESLint/TypeScript/Next/Playwright configuration and runner, Flutter pubspec/lock/analyzer configuration, AI requirements/tests/model loader, and opt-in MongoDB tests before executing checks. Jest uses default discovery; no standalone `jest.config.js` is present.
- To avoid replacing unknown manually maintained content in existing `node_modules`, created the previously nonexistent **`.local-backups/environment-baseline-20261020/`** (already ignored by Git). Copied 358 Git-listed backend/web files from the working tree into its component directories, excluding untracked files, actual `.env` files and existing dependencies. SHA-256 comparisons after build found **all 358 copied tracked files identical** to their originals, including both package manifests and locks. Existing source-tree dependencies remain unchanged and incomplete; use the prepared copies for this baseline.
- Installed backend and web with `npm.cmd ci --no-audit --no-fund --fetch-retries=0 --fetch-timeout=20000 --cache ../npm-cache-backend` (or `../npm-cache-web`) from each copied component. Initial restricted-network attempts failed with registry `EACCES` and npm `Exit handler never called!` (exit 1); user-cache logging was also unavailable. Network-enabled retries with workspace-local caches succeeded (exit 0), adding **636 backend / 365 web packages**. No lock regeneration, version override, integrity bypass or `npm audit fix` occurred. npm emitted deprecation warnings; no vulnerability audit was run.
- Created `python-env` inside that isolated root using `python -m venv --system-site-packages .local-backups/environment-baseline-20261020/python-env`. Installed `pytest>=7.4.0`, then `flask>=3.0.0` and `flask-cors>=4.0.0` with its `Scripts/python.exe -m pip install --disable-pip-version-check --no-cache-dir --retries 0 --timeout 20 --index-url https://pypi.org/simple ...` (exit 0 after network-enabled retry). This environment **inherits existing Python packages**; it is not a fully isolated or locked ML runtime. No global package was installed/upgraded. Version inventory is retained locally in `python-environment.json`.
- No environment file/credential was overwritten and no new authentication secret was generated. Web build/browser commands use only the existing repository Playwright fixture session constant and explicit `http://127.0.0.1:5119/api/v1`, set process-locally; no real backend. Backend clears `ACCOUNT_TEST_MONGODB_URI` for the test process so destructive opt-in DB tests cannot run. Final AI command disables dotenv loading with `PYTHON_DOTENV_DISABLED=1`.

| Component | Required tools | Detected/prepared version | Readiness / remaining issue |
| --- | --- | --- | --- |
| Backend | Node/npm/Jest/ESLint, declared mail library | Node `22.20.0`, npm `10.9.3`; Jest `29.7.0`, ESLint `8.57.1`, nodemailer `10.1.0` | Prepared copy ready for mocked tests/lint; original installation deliberately untouched. |
| Web | Node/Next/TypeScript/ESLint/Playwright | Next `16.2.1`, TypeScript `5.9.3`, ESLint `9.39.4`, Playwright `1.62.1`; existing Chromium executable present | Static checks and standalone build ready; browser results below. |
| Mobile | Writable compatible Flutter/Dart | Cached Flutter metadata `3.47.2`; direct Dart executable reports `3.13.2` | Manifest requires Dart `^3.11.3`; lock requires Dart >=3.12 / Flutter >=3.44, compatible with cached versions. Flutter cannot open `C:\src\flutter\bin\cache\lockfile`; running Flutter version not certified. |
| AI | Python/unittest/pytest plus runtime libraries | Python `3.14.0`, pip `25.2`; local pytest `9.1.1`, Flask `3.1.3`, Flask-CORS `6.0.5`; inherited torch `2.9.0`, numpy `2.3.4`, Pillow `12.0.0`, PyYAML `6.0.3`, dotenv `1.1.1` | Lightweight/config tests ready; Ultralytics, OpenCV and torchvision absent. Requirement files use minimum versions, not a reproducible lock. No full ML install or model download attempted. |
| Services/devices | Isolated MongoDB/private object store; Docker; device | Docker and mongod not found on PATH; adb available | Compose/local storage configuration exists but was not launched. `adb.exe devices -l` exits 0 with no attached devices; no emulator was launched. No isolated test DB/store was established. |

### Actual checks and comparison to the preceding October 20 audit

Paths in the command column are relative to the isolated root unless explicitly marked original. Counts are test counts, not feature-completion claims. Raw local test logs may include synthetic fixture values; only sanitized summaries are included here.

| ID / component | Exact command / directory | Previous audit result | Current result / exit | Passed / failed / skipped | Improvement, evidence and limitation |
| --- | --- | --- | --- | --- | --- |
| S1-01 backend dependencies | `npm.cmd ci --no-audit --no-fund --fetch-retries=0 --fetch-timeout=20000 --cache ../npm-cache-backend`, copied `lunas_backend` | Missing local nodemailer | PASSED / 0 | N/A | All 636 locked packages installed; `require('nodemailer/package.json').version` = 10.1.0. Existing original install not repaired in place. |
| S1-02 backend tests | `npm.cmd test -- --runInBand --json --outputFile=../backend-results.json`, copied `lunas_backend` | 43 suites passed, 7 failed, 1 skipped; 368 tests passed, 2 failed, 39 skipped | FAILED / 1 | **401 / 2 / 39**, 442 total | **48 suites passed, 2 failed, 1 skipped.** Five dependency-related suite failures resolved; 33 additional tests now pass. Account DB suite remains deliberately skipped. Local `backend-results.json` and `backend-tests.log`. |
| S1-03 backend lint | `npm.cmd run lint`, copied `lunas_backend` | PASSED | PASSED / 0 | N/A | Existing lint rules unchanged. |
| S1-04 web dependencies | `npm.cmd ci --no-audit --no-fund --fetch-retries=0 --fetch-timeout=20000 --cache ../npm-cache-web`, copied `lunas_web` | Incomplete | PASSED / 0 | N/A | 365 locked packages installed, expected local executables usable. |
| S1-05 web lint | `npm.cmd run lint`, copied `lunas_web` | BLOCKED: missing eslint | PASSED / 0 | N/A | `web-lint.log`; no lint/config source change. |
| S1-06 web types | `npx.cmd --no-install tsc --noEmit`, copied `lunas_web` | INCOMPLETE | PASSED / 0 | N/A | Installed project compiler, no unrelated tsc download; `web-types.log`. |
| S1-07 web build | `npm.cmd run build`, copied `lunas_web`, explicit fixture-only process env above; telemetry disabled | BLOCKED: missing next | PASSED / 0 | N/A | Compiled, typechecked, generated 42 static pages and standalone output; `web-build.log`. No deployment or live backend calls claimed. |
| S1-08 Playwright discovery | `npx.cmd --no-install playwright test --list`, copied `lunas_web` | NOT RUN | PASSED / 0 | 28 discovered; not test passes | Six spec files; existing Chromium found. `web-e2e-list.log`. |
| S1-09 browser tests | `npm.cmd run prepare:standalone`, then `node scripts/run-playwright.mjs`, copied `lunas_web`; explicit local fixture API, existing fixture secret and ACCOUNT_UI_TESTS=true | NOT RUN | Preparation PASSED / 0; tests FAILED / **1** | **17 / 11 / 0**, 28 total, 3.1 minutes | Ran standalone app on 127.0.0.1:3100 and per-spec in-memory HTTP fixtures on 5119. No DB or application data. Runner stopped its server. `web-e2e.log`, screenshots/traces in copied `test-results`. Failures listed below; browser/dependency readiness is established, full app integration is not. |
| S1-10 Flutter version | `flutter.bat --version`, original SDK | Wrapper incomplete | INCOMPLETE / interrupted with exit 1 | N/A | Wrapper produced no output and was stopped; read cached version metadata separately. SDK permissions unchanged. |
| S1-11 Flutter diagnostics/analyze/tests | `C:\src\flutter\bin\cache\dart-sdk\bin\dart.exe C:\src\flutter\bin\cache\flutter_tools.snapshot doctor -v`, then `analyze --no-pub`, `test --no-pub`, original `lunas_mobile` | Analysis incomplete; tests not run | BLOCKED / **1 each** | N/A | Each bounded to 15 seconds and fails immediately opening SDK cache lockfile. Direct cached tool avoids wrapper's silent retry loop. No source analysis or test cases actually run. |
| S1-12 mobile packages/device | `flutter.bat pub get` NOT RUN due S1-11; `adb.exe devices -l` | No device verification | Packages BLOCKED; adb PASSED / 0, device acceptance NOT RUN | N/A | Existing pubspec/lock and constraints preserved. No connected device; SDK/emulator installation not attempted. |
| S1-13 AI lightweight | `..\.local-backups\environment-baseline-20261020\python-env\Scripts\python.exe -m unittest test_privacy_scope`, original `lunas_ai` | 5 passed | PASSED / 0 | **5 / 0 / 0** | AST-extracted handler/config checks; no loaded models/inference. |
| S1-14 AI pytest | Same venv Python `-m pytest -q test_category_models.py test_surface_drainage.py test_electrical_damage.py`, original `lunas_ai` | BLOCKED: pytest absent | FAILED / 1 | **10 / 5 / 0** | pytest now runs all 15 cases. Initial run also lacked Flask; after installing Flask, all five failures are missing Ultralytics imports. `ai-pytest-final.log`. No source/model accuracy defect established by these import errors. |
| S1-15 infrastructure/integration | Docker/Compose/live SLA/DB/store/email/push/restore/six-role acceptance | NOT RUN | NOT RUN / N/A | N/A | No isolated infrastructure available/configured; no real delivery, storage, restore, scheduling or full workflow test. |

### Remaining test failures: separate contracts from environment

- **Backend assertion / test-contract discrepancy:** `src/controllers/incidentValidation.test.js` → `sequential incident review workflow returns submitted and clarification-required records only from the assigned barangay queue`. Test expects the old flat status filter; current query combines barangay scope with Tanod states and agency completion review. Source change and stale expectation require review against R2-T01/06; do not remove the new stages simply to pass the assertion.
- **Backend assertion / fixture-contract discrepancy:** `scripts/dagupan-seed-config.test.js` → `local accounts cover all canonical barangays and matching provider/repair organizations`. Expected 42 accounts, received **69**; test still assumes matching provider/repair organizations. This is a source/test design discrepancy associated with R2-08/R2-T09, not a missing dependency. Only the pure account-definition function was tested; no seed executed.
- **Browser failures / test and UI contract discrepancies:** tests executed successfully, then failed assertions/timeouts. Retired-role fixtures are incompatible with `lunas_web/src/lib/auth/dal.server.ts::toViewer`, which explicitly rejects `city_engineer`. Notification tests never reach the intended inbox, and location correction switches to that retired role. Provider tests also expect old Work Orders/register presentation while current default agency workspace differs. These results expose stale coverage; they do not by themselves establish notification or correction runtime defects. Review intended contracts under R2-T09/10/13 rather than restoring retired authority or changing UI to satisfy old expectations. Other UI/root-cause implications remain unverified until fixture contracts are aligned in a separately assigned task.

| Failing browser spec | Exact failed test names | Observed boundary |
| --- | --- | --- |
| `tests/engineering-maintenance.spec.ts` | `cards and tabs open separate review and verification queues`; `provider navigation retains work orders and has no engineering tabs` | Expected Maintenance / Work Orders headings not found; old role and presentation contracts. |
| `tests/location-integrity.spec.ts` | `neutral discrepancy and explanation are visible; documented finding can be corrected` | Times out clicking Correct Finding after switching to retired city_engineer fixture. |
| `tests/notifications.spec.ts` | `a delayed bulk save refreshes the current filter instead of the old one`; `reading the last unread page reconciles rows, counts and page number`; `failed read saves preserve unread state and repeated opens do not decrement twice`; `load failure does not claim the inbox is caught up`; `phone filters collapse and metadata uses readable references` | Fixture /users/me always returns city_engineer; intended inbox selectors/text absent, timeout or visibility assertion. No notification bug can be inferred from this invalid role fixture. |
| `tests/workspace-navigation.spec.ts` | `city_engineer landing, alias and restricted routes redirect without client errors`; `engineering dashboard puts linked review queues before geography`; `phone work orders and accounts expose status and actions in cards` | Old City Engineer redirect/dashboard expectations and provider Work-order register expectation fail. |

- **AI environment failures:** `test_category_models.py::test_other_review_model_never_creates_an_automatic_suggestion`; `test_surface_drainage.py::test_drainage_suppresses_floods_and_keeps_blockage_review_only[False]` and `[True]`; `::test_unavailable_category_is_manual_only_and_does_not_load_a_fallback`; `::test_fixed_qa_endpoints_route_by_category_without_exposing_model_paths`. All finally fail `ModuleNotFoundError: No module named 'ultralytics'`. Installing pytest/Flask did not complete the ML runtime; do not label these as inference regressions.
- R2-01–11 remain visible below and **were not fixed**. Passing lint/type/build and newly runnable auth/email mocks do not invalidate those security/workflow findings or demonstrate actual email delivery.

### Remaining blockers and handoff

| Blocker | Root cause/evidence | Required next action / authorization |
| --- | --- | --- |
| S1-B01 / Flutter | Shared SDK cache lockfile inaccessible; direct tool exits 1 before diagnostics/analysis/tests | Use an explicitly authorized writable SDK environment with compatible cached version, then `flutter.bat doctor -v`, `pub get`, `analyze`, `test`. Do not change global ACLs/security settings or force-update the shared SDK. |
| S1-B02 / full AI runtime | Missing Ultralytics/OpenCV/torchvision; local venv inherits Python 3.14 packages; requirements unpinned | Prepare a compatible ML runtime from reviewed requirements with known versions/resources. Larger ML dependency downloads need resource approval; no models/checkpoints should be auto-downloaded. Then rerun the 15 cases, separately check API import/startup, model loading, inference and accuracy. Bundled local checkpoint presence was inventoried, not execution-verified. |
| S1-B03 / integration | No isolated MongoDB/store, Docker not on PATH, no device | Provide approved disposable services/device; no seed/migration/volume changes. Account DB suite performs deletes/drop in its generated test database and stays disabled during this task. Real signed retrieval/email/push/live SLA/restore/full six-role acceptance remain unverified. |
| S1-B04 / dependency access | Restricted registry requests fail EACCES; network-enabled local-cache npm/pip retries succeeded | Use authorized package-network access for recreation; do not infer an invalid lockfile from sandbox failures. Retain exact locks and avoid package upgrades. |

**Reproduce this baseline:** use the prepared component directories under `.local-backups/environment-baseline-20261020` and the commands above. For a fresh directory, copy only Git-listed backend/web files from the current working tree, excluding untracked secrets and generated data, then run their locked installs. For later application changes, refresh only the corresponding source files in the copy before testing; this frozen baseline does not automatically test edits made in the original tree. Retain/review this directory as disposable tooling, never as a database backup. Local logs/results are ignored and not committed.

**Next functional task remains R2-T01 — separate Tanod and Repair Personnel identities and restore assignment-restricted incident access.** Backend mocked auth/jurisdiction/controller tests and web static/build checks are now available in the prepared copies; fixture browser checks are separate from real backend enforcement. Minimum remaining prerequisites for full acceptance are an authorized writable Flutter SDK and isolated direct-HTTP/MongoDB authorization test environment. Preserve the existing role/ownership/org/barangay/assignment history and all policy blockers. This step does not authorize functional changes, seed/migration, deployment, commit or push.

**Completion verification:** application/component source and tests have no Git changes; package manifests and npm/pub lockfiles are unchanged. The existing README audit and prior AGENTS change remain intact. Temporary test results/dependencies reside only in the ignored baseline directory; no seed, migration, production service, database operation, model download, deployment, commit or push occurred. The adb daemon started by device enumeration was stopped after the check. `git diff --check` passed. Backend unit/HTTP smoke mocks, web lint/type/build, fixture browsers and AI lightweight/config tests ran; Flutter execution, ML-dependent AI cases, real database/evidence/email/push/live SLA/restore and six-role acceptance remain blocked or unverified as specified above.

---

## Current re-audit — 2026-10-20

**Read this section first. It supersedes implementation claims in the preserved October 19 audit below.** This is a documentation-only second-round audit against the supplied citizen → assigned Tanod → separate Secretary decision → responsible agency → assessment → conditional external processing → authorized maintenance → review/closure target. New source exists, but the revised workflow is **PARTIALLY IMPLEMENTED with confirmed controller defects and security regressions**. No complete six-role, browser/device/API/MongoDB/storage lifecycle is certified.

### Repository, baseline and evidence boundaries

| Item | Current evidence |
| --- | --- |
| Audit date / branch / HEAD | 2026-10-20, Asia/Shanghai; `revision`; `3cb447fe3c18ce79aa8603b38178a09b477d8cbb` |
| Reliable previous audit | `fdaae5c` (`docs: audit implementation status and add developer handoff`); its README audits source at `9ccd38c`. `git diff --stat fdaae5c HEAD` identifies 75 changed files, 2,298 insertions and 283 deletions. |
| Working tree before audit | No change entries from `git status --short`; access warnings for two ignored `.chapter3-local/fr01-fr07-pdf` package directories. These inaccessible contents were not inspected. |
| Instructions / historical context | Root `AGENTS.md`, `lunas_web/AGENTS.md`, this README, scope documents, Revision 6 SLA, Revision 7 privacy and Revision 8 location reports reviewed. Existing root instructions already require source verification and preservation of scopes/history. |
| Technologies | Express 4/Mongoose 8/Jest; Next 16.2.1/React 19.2.4/TypeScript/Playwright; Flutter/Riverpod/go_router; Flask/PyTorch/Ultralytics; MongoDB/private S3/RustFS; Compose and AWS/Netlify scaffolds. Architecture remains as described below. |
| Audit method | Git delta plus current routes/controllers/models/services, web actions/pages/export paths, mobile role/router/inspection/report paths, tests and operational configuration. No seed, migration, deployment, production-data operation, commit or push. |
| Verification ceiling | Backend mocked tests and four isolated in-memory probes; backend lint; five AI handler checks. No live database, real signed-evidence retrieval, email/push delivery, inference accuracy, mobile/device or browser acceptance. Dependency installation was not attempted; clean lockfile reproducibility remains UNKNOWN. |

`VERIFIED IMPLEMENTED` means only the explicitly tested boundary; `IMPLEMENTED — UNVERIFIED` means code exists without sufficient functional verification. Other statuses are PARTIALLY IMPLEMENTED, MISSING, NEEDS REVISION, BROKEN / REGRESSION, BLOCKED / POLICY PENDING, OUT OF SCOPE and UNKNOWN. A source or mock check is never production integration evidence.

### Completed since the previous audit: evidence-based delta

All new workflow capabilities below are **source additions**, not verified end-to-end completions. The four controller probes verified defects, not successful lifecycle integration. No formerly missing full workflow can honestly be promoted to VERIFIED IMPLEMENTED in this environment.

| Feature | Previous status at audit baseline | Current status | What changed / implementation evidence | Remaining work |
| --- | --- | --- | --- | --- |
| Inspection persistence and mobile workspace | MISSING | PARTIALLY IMPLEMENTED / NEEDS REVISION | New `lunas_backend/src/models/Inspection.js`, `src/controllers/tanodWorkflowController.js`; mobile `lib/features/repair/data/models/inspection_models.dart`, `presentation/screens/tanod_home_screen.dart`, `tanod_inspections_screen.dart`; repair service and router now connect inspection list/start/submit, findings, evidence and map launch. | Distinct identity/assignment scopes and repair workspace restoration implemented in Step 2; remaining: evidence-required contract, reassignment, transactional stale-action controls and live integration tests. |
| Separate Secretary findings review | MISSING | PARTIALLY IMPLEMENTED | `reviewInspection`, web `src/app/actions/tanod-workflow.ts`, `components/validation/validation-review.tsx`, incident detail population and protected inspection evidence serialization exist. Tanod submission notifies Secretary and does not itself populate agency routing. | Legacy approval bypass, completion/initial separation, category correction, actionable clarification/rejection and concurrency tests. |
| Automatic routing | MISSING | NEEDS REVISION | `CATEGORY_AGENCIES` and `reviewInspection` route after approval and notify matching providers. | Hardcoded category names do not establish ownership/jurisdiction/participation; even gas maps to a DPWH label without authority evidence. Exception GET exists, but exceptions page redirects to reports and no resolution mutation exists. |
| Agency/external progress | MISSING | PARTIALLY IMPLEMENTED | Incident `agencyStatus` and `/agency-status`, provider detail controls, agency note/actor/time and incident-history events; ready/procurement/in-progress/completed/correction states. | Explicit acknowledgment/assessment, optional funding/bidding/work authorization and readiness guards; current status alone does not authorize work. |
| Completion inspection / correction / Secretary closure | MISSING | BROKEN / REGRESSION; authority POLICY PENDING | `assignCompletionInspection`, `requestAgencyCorrection`, `completeIncident` and web actions exist. Body inspection ID is read; correction restart clears current completion pointer. | Stale inspection still closes, generic review resets routing, concurrent assignments possible, parallel provider closure remains. Secretary closure is code behavior, not approved authority. |
| Period reports and exports | MISSING | PARTIALLY IMPLEMENTED | New web `validation-routing/reports` and `work-orders/reports` pages and `reports/export/route.ts`; `validation.server.ts` report functions; API `getIncidents` date filters. Real stored, backend-scoped incident data feeds CSV. | CSV is not PDF; cap of 100, no export pagination, UTC/rolling-date semantics, missing dedicated category/barangay/SLA/maintenance outputs, formula protection and role-specific export checks. |
| Citizen external-stage display | MISSING | PARTIALLY IMPLEMENTED | Citizen serializer now includes `agencyStatus`/updatedAt; mobile incident model, status labels and reporting widgets changed. | Responsible agency identity and citizen SLA remain absent from safe detail projection; complete stage synchronization needs acceptance tests. |
| Inspection evidence / closure parameter fixes | No previous implementation to compare | IMPLEMENTED — UNVERIFIED | New controller flattens upload `images` instead of a nonexistent `evidence` result; `completeIncident` reads body `inspectionId`; serializers filter null inspection evidence. | No dedicated inspection test suite; source fixes are not demonstrated storage/device repair outcomes. Do not call these fixes to a previous-audit defect. |
| Privacy inference tuning | Upload dependency/default contradiction previously reported | IMPLEMENTED — UNVERIFIED tuning; contradiction persists | AI request now uses `PRIVACY_DETECTION_TIMEOUT` default 180000; Docker/config adjust worker/tile/upscale settings. | No measured latency, model accuracy or outage acceptance. Mandatory redaction and base Compose privacy=false still conflict. |

Previously implemented citizen auth/reporting/location, private managed evidence, provider intake, repair controllers/history, notifications, account governance, safe serializers and SLA primitives remain present. Do not rebuild them. Prior fixes for canonical barangays, BFF backend address/session configuration, repair notification routes, safe nearby serialization and SLA terminal normalization are not newly missing requirements. Their passing unit boundaries do not certify all clients.

### Current six-role and layer matrix

| Role / platform | UI, API and persistence now present | Current status and exact remaining boundary |
| --- | --- | --- |
| Citizen / mobile | Registration/OTP/login/recovery; confirmed location/category/evidence submission; own reports/history, notifications and agency-status display; Incident/User persistence. | IMPLEMENTED — UNVERIFIED for client flows; PARTIALLY IMPLEMENTED transparency. Existing ownership scope retained. Needs full multipart submission/retrieval, AI advisory, canonical barangay/location, auth and timeline regression. No responsible-agency identity/SLA detail contract yet. |
| Tanod / mobile | Dedicated barangay_tanod account, /tanod workspace, assigned inspection/current incident access and signed evidence; own historical findings without live incident access. | IMPLEMENTED — UNVERIFIED (Step 2). Separate role/provisioning/scopes now exist; full Flutter/live DB checks blocked. Reassignment/clarification/category/photo-state expansion remains R2-T06. |
| Repair Personnel / mobile | Existing repair_personnel identity, /repair dashboard/work-order list restored, current organization/assignment access and notification work-order links; existing controllers/history retained. | IMPLEMENTED — UNVERIFIED for Step 2 navigation/access. Provider staffing mutation routes, explicit worker choice and safe active reassignment remain R2-T09; no legacy conversion run. |
| Secretary / web | Barangay queues, inspection selection/review, final inspection/correction/closure controls, dated reports/CSV. | PARTIALLY IMPLEMENTED; stale completion BROKEN. No separate category correction, approved reassignment/clarification roundtrip, jurisdiction exception resolution or PDF. Old `/:id/validate`, priority/manual-route operations remain reachable without a field-result prerequisite. |
| Agency Officer / web | Existing `utility_provider` org-scoped intake plus status/priority/manual deadline, completion and report controls. | PARTIALLY IMPLEMENTED / NEEDS REVISION. Exact organization string scope retained for agency updates. Assessment/readiness/authorization not enforced by old work-order creation. Priority change erases SLA; no explicit agency acknowledgment, funding/work-authorized records or transfer policy. |
| Administrator / web | Existing authorized account creation/status/reactivation/archive, role/org/barangay, audit/support views. | IMPLEMENTED — UNVERIFIED for live governance; Tanod provisioning implemented in Step 2; agency/routing configuration MISSING. Admin is not granted routine incident approval/closure by new routes. Tanod can now be provisioned independently; archival/activation/suspension and token revocation need real DB regression. |

### Confirmed defects and security findings

“Probe-confirmed” below means four direct controller/scope invocations with in-memory model/notification/audit stubs, no MongoDB, HTTP authentication or storage. “Source-confirmed” identifies an explicit reachable route/query/control; exploitability and deployed state remain untested. Severity is audit prioritization, not a formal CVSS score.

| ID / severity | Finding and evidence | Required outcome |
| --- | --- | --- |
| R2-01 / High at audit; corrected in Step 2 source and mocked tests | Removed broad same-barangay repair incident reads; generic scopes deny field roles and current relationship queries bind task/order IDs, organization, barangay and reverse references. | Live DB/storage and full Flutter acceptance remain unverified; see R2-T01/Step 2. Historical unsafe-scope probe below now intentionally fails its first assertion and must not be treated as the current expected result. |
| R2-02 / High at audit; corrected in Step 3 source/local tests | Global API and layered auth counters restored, failed-login protections retained; explicit proxy/IP policy and stored-role CAPTCHA gate implemented. | Deployment remains unverified: configure exact peers/Turnstile and measure BFF/NAT load; per-process stores do not enforce shared replica quotas. See Step 3/R2-T02. |
| R2-03 / High / P0 (Step 4 source guards; see current limitations above) | **Stale finalization:** `completeIncident` loads any submitted verified completion inspection owned by Secretary, not necessarily `incident.completionInspection`, does not require current agency completion and ignores URL incident binding. Probe closes an incident in `correction_required` using an older inspection and unrelated URL ID. | Match URL, current completion reference, current authorized stage/version and approved closure policy atomically. Reject stale, different-incident, correction/open-work and duplicate submissions. |
| R2-04 / High / P0 (Step 4 source guards; see current limitations above) | **Review type confusion:** `reviewInspection` accepts completion inspections and applies initial approval logic. Probe converts completed agency work back to `provider_assigned` / `ready_for_work`, replaces routing history and emits initial-route messages. `not_verified`/`unable_to_verify` do not block initial approval. | Separate initial/completion decisions, define approved findings gates; reject wrong type and preserve route/history. |
| R2-05 / High / P0 (Step 5 source correction; live acceptance pending) | **SLA loss:** `updateAgencyStatus` resets entire SLA on any changed priority. Probe changing low→high during work removes existing deadline after the start guard already passed. Same handler permits status skips and manual deadlines; it never sets startedAt on work start. | Approved priority/start/deadline-change policy, immutable running deadlines except audited authorized amendments, atomic validation after all proposed changes. |
| R2-06 / High / P0 (Step 4 source guards; see current limitations above) | **Parallel lifecycle bypass:** old `validateIncident` can still approve submitted reports without Inspection. Existing `incidentCanCreateWorkOrder` tests only provider_assigned and organization, ignoring agencyStatus/assessment/work authorization. Old provider completion review still closes directly. | One authoritative gated lifecycle across all entry points, preserving legacy records without retaining approval bypasses. |
| R2-07 / High / P0 (Step 4 source guards; see current limitations above) | **No stale-task guarantees:** new handlers use read/save across Inspection/Incident with an incremented but unmatched `version`; no unique active-task constraint. Start/submit/review do not bind all incident URL/current task/type conditions. Completion assignment can repeatedly replace current task; file processing in separate parallel calls can leave successful uploads orphaned when another fails. | Conditional writes/transaction or recovery/outbox design; idempotency, assignment history, cancellation and upload cleanup; race/fault tests. |
| R2-08 / Medium / P1 | **Staffing integration regression:** `userRoutes.js` removes provider repair-directory/mutation routes; `lunas_web/src/app/actions/repair-personnel.ts` still POSTs/PATCHes those URLs. New migration clears repairOrganization/team/accountType across selected repair accounts and invents a fallback barangay. | Restore scoped staffing contracts and independent repair/verifier identities. Do not run migration; review mapping/backup/dry-run with preserved references. |
| R2-09 / Medium / P2 | **Incomplete/unsafe export:** both new CSV routes fetch only 100 rows and only require a token (report pages require a permission). Backend row scopes still apply, so unrestricted cross-org export is not established. Quotes are escaped but leading spreadsheet formulas are not neutralized. Day bounds use UTC and rolling 1/7/30 days. | Explicit export permission, pagination/provenance, agreed local calendar intervals, filter validation, safe CSV cells and separate PDF. Test >100 rows and formula-leading user descriptions. |
| R2-10 / High / P0 (Step 6 URL guard implemented; privacy BLOCKED) | **Persisting upload/config contradiction:** `evidenceService.redactEvidence` throws 503 when privacy disabled, base Compose sets false; new inspection evidence uses this pipeline too. Legacy HTTPS citizen image input still bypasses managed bytes validation/private upload. | Resolve approved privacy/legacy compatibility scope; test citizen/inspection/repair multipart success/outage and migration-only URL handling. |
| R2-11 / High / P0 (Step 6 partial source/config corrections; recovery/live acceptance open) | **Remaining institutional/security/integrity risks:** Compose application uses DB root; scoped false-report review exposes global confirmedFindingsTotal; report number remains count-derived; audit failures tolerated and multi-document actions lack durable recovery. Step 3 corrects the platform-only CAPTCHA boundary at tested local boundaries. | Least privilege, approved aggregate visibility, unique concurrent numbering, recoverable side effects. Keep reporting-restriction policy pending; do not treat the CAPTCHA correction as closing these independent risks. |

Managed evidence still decodes/re-encodes, strips metadata, hashes stored bytes and uses private keys/signed reads. JWT access/refresh separation, account/token-version checks, citizen ownership, provider organization filters, input validators, archival and sanitized audit logging remain useful controls. New inspection list returns its own evidence objects without the same explicit signed projection used for incident images; verify readability/privacy/expiry rather than assuming stored URLs work. Error handling/readiness remain basic; `/health/ready` checks DB rather than email/storage/privacy readiness. No live backup restore, production DB grants, secret scan, penetration test or signed retrieval proof was produced.

### SLA, notification and reporting assessment

Defaults remain Critical 48h, High 72h, Medium 168h, Low 336h; configured combined five-minute scheduler, 24/12/6/2-hour reminders, initial overdue escalation, deduplication and terminal normalization remain in `lunas_backend/src/services/slaService.js`. Relevant existing mocked tests pass. No configured second-level escalation timing exists. Live scheduler was NOT RUN. Existing worker reassignment/correction deadline preservation does not validate the new agency path.

New routing does not initialize SLA. New agency status accepts priority and manual deadline with state `not_started`; the monitor selects any nonterminal incident with a deadline, without an external-processing pause contract. Closure writes closedAt but relies on later scheduler normalization rather than updating linked work-order/SLA outcome atomically. The old manual routing still starts SLA, producing competing timing semantics. Agency priority and Secretary closure now exist in code but remain **BLOCKED / POLICY PENDING as authority requirements**. Do not infer that their implementation resolves the institutional decision.

New assignment/submission/approval/agency-completion/correction/closure notifications persist through existing notification service. Citizen external display exists; stage-specific audiences, rejection vs clarification wording (nonapproval currently says clarification), unresolved-route notification accuracy, retries and deep links need integration checks. Push enrollment/receipt remains unverified and no mobile OneSignal enrollment was identified. History records new agency events, but no global coherent transition contract or complete audit coverage exists for every new task action.

Reports read stored incidents through scoped API date queries. Daily/weekly/monthly list and CSV now exist; operational PDF remains **MISSING**, alongside complete category/barangay/agency/maintenance/SLA reports and verified totals. Agency report route is not missing wholesale. Do not mistake CSV, screenshots or the confusion-matrix QA artifacts for operational PDF/reporting acceptance.

### Actual test execution — October 20

| Command / check | Actual result | Interpretation |
| --- | --- | --- |
| `cd lunas_backend; npm.cmd test -- --runInBand` | **FAILED:** 43 suites passed, 7 failed, 1 skipped; 368 tests passed, 2 failed, 39 skipped; 409 total. | Five failed suite loads due to missing local `nodemailer`: authController, server, emailDeliveryService, emailTemplates, registrationMfaService. Two executed assertion failures: incidentValidation queue filter changed; dagupan-seed-config still expects 42 accounts. These contract/test regressions do not themselves prove runtime queue/seed failure. Real account DB integration skipped. |
| `cd lunas_backend; npm.cmd run lint` | **PASSED**, exit 0. | Static lint only. |
| Four direct in-memory probes (reproduction below) | **PASSED assertions confirming defects** R2-01, R2-03, R2-04, R2-05. | No live API/auth or DB acceptance; no new permanent test files. Mock notificationTemplates warning is a stub artifact. |
| `cd lunas_web; npm.cmd run lint` | **BLOCKED/FAILED command:** eslint executable missing. | Installation/environment failure; not a lint-clean claim. |
| `cd lunas_web; npx.cmd --no-install tsc --noEmit` | **INCOMPLETE:** no output/completion during observation; interrupted. | No typecheck result. No network installation authorized by this command. |
| `cd lunas_web; npm.cmd run build` | **BLOCKED/FAILED command:** next executable missing. | Playwright and browser journeys NOT RUN because build prerequisite unavailable. |
| `cd lunas_mobile; flutter.bat analyze` | **INCOMPLETE:** no output/completion during observation; interrupted. | Flutter exists at `C:\src\flutter\bin\flutter.bat`; no new lockfile-denial diagnosis made. Mobile tests/device build NOT RUN. |
| `cd lunas_ai; python -m unittest test_privacy_scope` | **PASSED:** 5 tests. | AST-extracted handler/config checks, no loaded models or live inference. |
| `cd lunas_ai; python -m pytest -q test_category_models.py test_surface_drainage.py test_electrical_damage.py` | **BLOCKED/FAILED command:** No module named pytest. | Accuracy, actual classification and privacy latency UNKNOWN. |
| Docker/live scheduler/DB/storage/email/push/restore | **NOT RUN**; Docker not found by `Get-Command`. | No stack, deployment, live negative API or restore claims. |

To reproduce the isolated probes safely, run the following from `lunas_backend` with `node` (PowerShell: paste the JavaScript into a single-quoted here-string and pipe to `node`). All replaced model methods are process-local; this script never connects to MongoDB or writes files. It intentionally asserts unsafe current behavior, so it must be replaced by negative regression tests when repaired.

```javascript
const assert = require('node:assert/strict');
const { Types: { ObjectId } } = require('mongoose');
const Incident = require('./src/models/Incident');
const Inspection = require('./src/models/Inspection');
const User = require('./src/models/User');
require.cache[require.resolve('./src/utils/auditLogger')] = { exports: { createAuditLog: async () => null } };
require.cache[require.resolve('./src/services/notificationService')] = { exports: { createNotification: async () => null } };
const c = require('./src/controllers/tanodWorkflowController');
const { buildIncidentScope } = require('./src/services/jurisdictionService');
const secretary = new ObjectId(), inspectionId = new ObjectId(), incidentId = new ObjectId();
const base = () => ({ _id: incidentId, category: 'road', reportNumber: 'SYNTHETIC',
  status: 'tanod_verified', agencyStatus: 'work_completed',
  location: { address: { barangay: 'Poblacion Oeste' } }, statusHistory: [],
  save: async function () { return this; } });
const invoke = async (handler, req) => { let error;
  const res = { status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
  await handler(req, res, e => { error = e; }); if (error) throw error; return res; };
(async () => {
  const scope = buildIncidentScope({ role: 'repair_personnel', barangay: 'Poblacion Oeste' });
  assert.ok(scope.$or); assert.ok(!JSON.stringify(scope).includes('assignedTo'));
  let incident = base();
  const inspection = { _id: inspectionId, incident: incidentId, type: 'completion',
    status: 'submitted', result: 'verified', secretary, save: async () => {} };
  Inspection.findById = async () => inspection; Incident.findOne = async () => incident;
  User.find = () => ({ select: async () => [] });
  const user = { _id: secretary, role: 'barangay_official', barangay: 'Poblacion Oeste' };
  await invoke(c.reviewInspection, { params: { id: String(incidentId), inspectionId: String(inspectionId) }, body: { decision: 'approve' }, user });
  assert.equal(incident.status, 'provider_assigned'); assert.equal(incident.agencyStatus, 'ready_for_work');
  incident = base(); incident.status = 'provider_assigned'; incident.agencyStatus = 'correction_required';
  incident.completionInspection = new ObjectId(); inspection.status = 'submitted';
  Inspection.findOne = async () => inspection;
  await invoke(c.completeIncident, { params: { id: String(new ObjectId()) }, body: { inspectionId: String(inspectionId) }, user });
  assert.equal(incident.status, 'closed');
  incident = base(); incident.priority = 'low'; incident.agencyStatus = 'work_in_progress';
  incident.sla = { deadline: new Date('2026-10-21T00:00:00Z'), state: 'active' };
  await invoke(c.updateAgencyStatus, { params: { id: String(incidentId) },
    body: { status: 'work_in_progress', priority: 'high' },
    user: { _id: secretary, role: 'utility_provider', utilityCompany: 'Synthetic agency' } });
  assert.equal(incident.sla.deadline, undefined);
  console.log('4 unsafe behaviors confirmed with process-local stubs');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
```

### Exact remaining-work backlog and priorities

These tasks supersede conflicting statuses in the old DEV table. Each row gives existing implementation, exact backend/UI/database scope, security/dependencies and required acceptance tests. No application fix was made during this audit.

| Task / priority / status | Existing implementation → exact remaining task and affected files | Dependencies, security, tests and acceptance criteria |
| --- | --- | --- |
| R2-T01 / P0 / IMPLEMENTED — UNVERIFIED | Step 2 adds barangay_tanod, authorized provisioning, current-assignment incident scopes, independent mobile routes and protected inspection access; repair identities/history retained. See Step 2 implementation files and tests above. | Backend HTTP/model mocks and focused web fixtures pass; SDK-only route policy passes. Full Flutter, MongoDB/storage and legacy task rollout remain unverified. Do not rebuild these completed source changes. |
| R2-T02 / P0 / IMPLEMENTED — UNVERIFIED in deployed operation | Step 3 restores global/layered auth limits, trusted proxy/IP keys and persisted web-role CAPTCHA enforcement. Local middleware/controller/HTTP checks pass; existing native roles/session/RBAC retained. | Configure/review actual proxy peers and Turnstile; verify real traffic and shared-IP capacity. MemoryStore remains per-process; coordinate quotas before scaling. Do not rebuild completed source protections or claim production certification. |
| R2-T03 / P0 / PARTIALLY IMPLEMENTED (Step 4); live concurrency/recovery UNVERIFIED; closure BLOCKED | `tanodWorkflowController.js`, `Inspection.js`, `Incident.js`, `incidentTransitionService.js`, incident routes and web Tanod actions: bind task/type/current reference/incident/version, separate completion review, reject stale closure, enforce atomic assignment/review/complete. Add active-task constraint/history and retry-safe recovery. | Closure decision policy remains pending; implement stale/security guards without inventing who closes. In-memory reproductions become rejecting tests; concurrent completion/reassignment/correction and crash/retry tests preserve evidence/history and cannot close wrong/stale work. |
| R2-T04 / P0 / IMPLEMENTED — UNVERIFIED (Step 5); authority BLOCKED | Agency status controller, `slaService.js`, `workOrderService.js`, provider incident UI: prevent priority/deadline erasure, preserve existing active deadlines, normalize closure consistently across incident/order. Record approved priority/start/external timing/amendments. | Authorized SLA policy, R2-T03/07. Test priority change during work, missing/past/invalid deadlines, procurement, correction, reassignment, cron reminders/retry and final met/breached. No new SLA authority inferred from current agency controls. |
| R2-T05 / P0 / PARTIALLY IMPLEMENTED (Step 6); privacy BLOCKED; live acceptance UNVERIFIED | Existing evidence pipeline/default flags, `incidentController.js` legacy URL path, `docker-compose.yml`, DB bootstrap and `falseReportReviewController.js`: resolve privacy availability contract, least-privilege DB user, legacy submission validation and unauthorized aggregate exposure. Use safe unique numbering and durable audit/notification/storage recovery. | Privacy/aggregate mandate and isolated DB/store. Multipart citizen/inspection/repair success/outage tests, unauthorized signed retrieval, least-privilege grants, unique parallel report IDs, fault cleanup/outbox retry and restore drill. Preserve legacy reads/records. |
| R2-T06 / P1 / PARTIALLY IMPLEMENTED (Step 7 source features; live evidence/mobile/DB acceptance BLOCKED or UNVERIFIED) | Inspection controller/routes/model; web validation review/actions; mobile inspection model/service/screens: complete acknowledgment, initial reassignment, findings/photo validation, category correction preserving original, Secretary reject/clarify and resubmission. Add review/category/assignment event fields as needed. | R2-T01/03, Secretary/verifier authority. Invalid/not-verified/unable findings cannot silently authorize routing; photo-free/invalid uploads rejected under approved rules; former assignee denied; submitted findings appear in Secretary queue; clarification and rejection notifications accurate. |
| R2-T07 / P1 / NEEDS REVISION | Replace `CATEGORY_AGENCIES` with approved agency/asset/jurisdiction configuration and stable IDs; implement routing ambiguity/transfer resolution, not exceptions→reports redirect. Update `tanodWorkflowController.js`, `jurisdictionService.js`, Incident/routing master models, admin/Secretary web pages. | Formal agency participation and asset ownership, R2-T06. Tests cover unknown/conflicting ownership, inactive/unconfigured destination, no premature/duplicate route, scoped transfer and preserved routing history; no assumed DPWH participation. |
| R2-T08 / P1 / PARTIALLY IMPLEMENTED | Agency controller/model/provider UI: add acknowledgment/assessment, conditional external status/reference history and explicit authorized readiness. Gate ALL `createWorkOrder`/manual-route/legacy approval paths; do not implement procurement itself. | Approved readiness authority, R2-T03/07. Routine maintenance bypasses bidding; bidding completion alone cannot authorize; direct API cannot create/assign/start work while awaiting approval. Model audit fields identify actor/time/reason/reference. |
| R2-T09 / P1 / NEEDS REVISION | Restore organization-scoped repair staffing route/action contracts in `routes/userRoutes.js`, authorized account controller, web staffing console/actions; preserve mobile repair home and order acceptance/progress. Review `scripts/migrate-tanod-workflow.js` without running it; safe active reassignment and explicit worker accept/decline remain. | R2-T01/03, handoff policy. Negative org/assignment tests; new worker receives usable task, prior worker loses mutation access, progress/photos/SLA/history retained, stale requests rejected. Migration dry-run/rollback and fixture contract tests before any authorized data conversion. |
| R2-T10 / P2 / PARTIALLY IMPLEMENTED | Citizen serializer/mobile incident model/detail/timeline; notification service/routes and all stage UIs: responsible-agency/SLA/external projections, correct stage messages, signed inspection history evidence, push enrollment and retry delivery. | R2-T06–09, privacy/channel policy. End-to-end scoped timeline matches stored events; no private notes leak; signed photos readable only by authorized current users; actual push receipt/deep link demonstrated before claiming delivery. |
| R2-T11 / P2 / PARTIALLY IMPLEMENTED; PDF MISSING | Both web reports pages/export routes, `validation.server.ts`, backend reporting/date query validation: paginate complete exports, define local day/week/month, add category/barangay/agency/maintenance/SLA filters and PDF with provenance; explicit permissions and spreadsheet neutralization. | Authorized audiences and R2-T07 agency data. Tests include >100 reports, exact boundaries, malicious cell values, wrong role/org/barangay, accurate totals and printable PDF from stored data. |
| R2-T12 / P0 baseline then P2 operations / PARTIALLY IMPLEMENTED | Restore clean toolchain/dependency baseline; update incidentValidation and dagupan seed contracts after reviewing intended behavior, add dedicated inspection API journeys. Backend/web/mobile/AI test configs and deployment/backup scripts; no production changes. | Isolated services and writable SDK. `npm ci` from both locks, full Jest/lint/type/build/Playwright, Flutter analyze/test, prepared AI tests; record failed/skipped results. Then monitored health, signed storage/email/privacy/push readiness, CI and isolated restore with measured RPO/RTO. No release claim before real multi-role chain. |
| R2-T13 / P3 / NEEDS REVISION | Retired City Engineer routes/statuses/tests and older scope/component docs; inventory and safely migrate compatibility contracts after one authoritative lifecycle is settled. | R2-T03/07/08 and reviewed legacy data. No orphan actors/orders/evidence; remove obsolete claims/tests without deleting historical records. |

### Policy blockers and out-of-scope boundaries

The code changes did **not** resolve: (1) distinct Tanod mandate/account eligibility and Secretary approval powers; (2) agency participants, ownership/jurisdiction sources and dispute/transfer authority; (3) who sets priority; (4) SLA starting event, elapsed targets, manual deadline amendments and funding/bidding pauses; (5) human completion reviewer vs final closure official; (6) conditional external statuses and work authorization; (7) active reassignment/accountability; (8) excluded visual masking vs mandatory processing, evidence retention/legacy compatibility; (9) three-finding reporting restrictions/global count disclosure/appeals; (10) public agency/external/SLA information, export audiences, delivery channels and backup/audit retention policy. Treat these as BLOCKED / POLICY PENDING, even when a controller currently makes a choice.

Procurement execution, bid evaluation/awarding, budget allocation, contractor selection, automated repair acceptance/AI authority, SSIM acceptance, e-signatures and unrestricted role access remain OUT OF SCOPE. Existing face/plate redaction conflicts with excluded scope and needs an explicit decision, not silent removal during audit. No official agency jurisdiction, adoption or legal compliance is asserted.

### Next developer handoff

**Current state:** reuse existing reporting/auth/location/evidence, scoped provider/order/repair/history, account controls, notifications and SLA primitives. New Inspection/Tanod-style UI, Secretary review, category-based routing, agency status and CSV reports exist; do not implement them again from an old missing-feature row. They need the corrections above. No new full workflow is VERIFIED IMPLEMENTED.

**Single best next implementation task: R2-T07**, completing jurisdiction-aware agency routing while retaining Step 7 live evidence/mobile/DB and earlier privacy/recovery blockers; Step 5 preserves SLA timing with live acceptance/policy limits; Step 4 guards stale closure/type confusion with live concurrency/recovery and closure policy still open. R2-T01 and R2-T02 source are implemented in Steps 2/3 with stated mobile/live/deployment verification limits. Preserve role scopes/throttles; prepare isolated services for validation (R2-T12), fix finalization (R2-T03), preserve SLA (R2-T04), then resolve evidence/integrity risks (R2-T05). Broader workflow gates follow institutional decisions; do not run the account-conversion migration to make tests pass.

Inspect first: `lunas_backend/src/services/jurisdictionService.js`, `src/routes/incidentRoutes.js`, `src/controllers/tanodWorkflowController.js`, `src/models/Inspection.js`, `src/utils/accountPolicy.js`, `src/routes/userRoutes.js`, `src/controllers/workOrderController.js`; `lunas_mobile/lib/core/routes/app_router.dart`, `lib/features/auth/domain/auth_role_policy.dart`; `lunas_web/src/app/actions/tanod-workflow.ts`, `src/app/actions/repair-personnel.ts`. Prefix abbreviated backend paths with `lunas_backend/`.

Run backend `npm.cmd test -- --runInBand` and `npm.cmd run lint`, then new direct HTTP authorization/task/version tests with an explicitly isolated database. Run web lint/typecheck/build and Playwright; mobile analyze/test including separate role routing and existing repair regression; prepared AI handler/model tests. Preserve original records, organization/barangay/ownership/current-assignment boundaries, account revocation and authorized evidence. Update this current section with actual results after each assigned change; use the old audit only as historical context.

---

## Preserved previous audit — 2026-10-19 (historical)

**All sections 1–16 below describe the previous audit. Current overrides, including Tanod source, agency statuses, reporting, new security defects, branch/commit and test counts, are above. Historical task/status rows must not be read as current missing-feature claims.** Setup and architecture remain useful subject to current source/config verification.

## 1 — LUNAS Project Overview

**LUNAS: An AI-Assisted Urban Infrastructure Maintenance and Monitoring System with Automated SLA Management** targets Dagupan City, Pangasinan, Philippines. Flutter mobile, a Next.js web workspace, an Express/MongoDB API, private evidence storage and an assistive Flask AI service are present. This audit changes documentation only; it does not implement the revised workflow or establish official LGU/provider participation.

The approved target is citizen reporting → barangay queue → assigned Tanod field verification → separate Secretary approval/category confirmation → automatic responsible-agency routing → agency assessment → conditional external administrative progress → authorized work order → repair → human completion review/corrective work → authorized closure. Transparency applies at every stage within record scopes.

**Current conclusion:** substantial citizen, barangay review, provider, repair, account, evidence and SLA code exists, with useful passing backend tests. The revised six-role lifecycle is incomplete. No complete mobile/browser/database/storage report-to-resolution chain was verified. Tanod verification, automatic jurisdiction/ownership-aware routing, external-processing gates and operational PDF reporting are missing. Priority/SLA/closure authority requires institutional decisions.

This README is the maintained status reference for the revised scope supplied on 2026-10-19. [LUNAS_PROJECT_SCOPE.md](LUNAS_PROJECT_SCOPE.md), [LUNAS_CURRENT_PROJECT_SCOPE.md](LUNAS_CURRENT_PROJECT_SCOPE.md), component READMEs and Revision reports are historical/contextual evidence where they disagree with this target or current source. They are not proof of current operation. Recheck code rather than repeating their older defects or completion claims.

## 2 — Current Repository Snapshot

| Item | Observed state |
| --- | --- |
| Audit date | 2026-10-19, Asia/Shanghai; local source audit |
| Branch | `repair-personnel-creation` |
| Commit | `9ccd38ca9fbb9f867f693b431ab6f6eab75d6149` |
| Working tree at start | `git status --short` emitted no change entries; permission warnings prevented traversal of two ignored/local `.chapter3-local/fr01-fr07-pdf` package directories. Do not infer their contents were inspected. |
| Instructions | No root AGENTS.md found; read existing `lunas_web/AGENTS.md` (Next 16 local-docs rule). Root AGENTS.md added for future handoff. No product code changed. |
| Backend | Node/Express 4, Mongoose 8, JWT/bcrypt, express-validator, Multer/Sharp, node-cron, Winston, Jest/Supertest; Node 22 container |
| Web | Next.js 16.2.1, React 19.2.4, TypeScript, Tailwind 4, server actions/BFF, Playwright; dependencies declared, essential local executables absent |
| Mobile | Flutter/Dart (`^3.11.3` constraint), Riverpod/go_router, secure storage, image_picker, flutter_map/OpenStreetMap, geolocator and device geocoding; installed Dart reports 3.13.2 |
| AI | Flask, Ultralytics/PyTorch, OpenCV/Pillow, category model configuration and checkpoint assets, Gunicorn container; optional hazard advice, mandatory privacy dependency for new uploads in current code |
| Storage/database | MongoDB schema/index declarations; private S3 new-write path, RustFS S3-compatible local override; Supabase migration-only legacy reads |
| Operations | Compose/Dockerfiles, local-up scripts, AWS Terraform/deploy/backup/restore scaffold, Nginx and Netlify configuration present; not deployed by this audit |
| Absent target components | Tanod role/tasks/mobile screens, agency/jurisdiction routing master data and rule engine, routing-review/transfer queue, external administrative status/readiness model, operational PDF export |
| Verification limits | Partial backend install (nodemailer missing); web next/eslint/typescript missing; Flutter SDK lockfile access denied; Docker unavailable on PATH; pytest absent. No live MongoDB/storage/email/push/AI credentials or production data used; real DB suite skipped. |

Tracked source, route/model/service/client inventory, tests, Docker/environment templates and deployment scripts were examined. Real secret files and account passwords are intentionally omitted. Historical `qa_outputs/` artifacts were inventoried, not rerun or accepted as current model accuracy evidence. No full Git-history secret scan, device/browser validation, live deployment verification or full model-quality audit was performed.

## 3 — Revised Incident Workflow

| Stage | Target and approval gate | Current source / gap |
| --- | --- | --- |
| Citizen submission | Authenticated citizen confirms evidence, category, description and location; enters correct barangay queue | `createIncident` validates canonical barangay/city, records submitted and location integrity. Geographic containment remains unverified. |
| Field verification | Secretary assigns eligible Tanod; Tanod acknowledges, visits, records Verified / Not Verified / Unable to Verify with evidence | Entire Tanod task/result lifecycle absent. Repair personnel cannot substitute for Tanods. |
| Barangay decision | Secretary reviews findings and confirms/corrects category; approve/reject/clarify is separate from Tanod submission | Barangay validate/reject/duplicate exists; validation can run without a Tanod finding. Category correction and usable Secretary clarification loop missing. |
| Agency routing | After approval, category + ownership + jurisdiction select agency; ambiguous responsibility enters review | Manual provider choice follows Barangay priority. No routing rules/review queue or jurisdiction transfer. |
| Agency assessment | Authorized agency acknowledges and assesses responsibility, resources and readiness | Organization-scoped provider intake exists; no separate acknowledgment/assessment/readiness state. |
| External processing | Conditional manual transparency for funding/bidding/authorization performed outside LUNAS | No external-process statuses/references/history. No readiness guard to prevent premature work. |
| Maintenance | Agency authorizes work order; eligible worker accepts/declines, starts, adds progress/evidence; authorized reassignment retains history | Routing already creates a primary work order and starts SLA. Provider assignment auto-accepts the worker. New reassignment after start is refused except rework; legacy pending handoffs can resume. |
| Review/closure | Authorized reviewer accepts completion or requests correction; official closure uses approved authority | `reviewCompletedWork` accepts provider review and closes directly; correction returns to repair. Closure authority is policy pending. Retired City Engineer final-review code remains. |
| Transparency | Scoped timeline, agency, field/repair/external progress, SLA, notifications, audit and PDF throughout | Timeline/high-level repair/in-app notifications exist. Citizen agency/SLA presentation, Tanod/external stages and operational PDF are incomplete/absent. |

Proposed conditional external statuses (all currently MISSING): `Pending External Processing`, `Pending Funding / Approval`, `For Bidding`, `Bidding Completed`, `Awaiting Work Authorization`, `Work Authorized`, `Ready for Maintenance`. Each needs agency authorization, reason, timestamp and supporting reference; routine maintenance must bypass unnecessary bidding stages. Funding, bid evaluation, contracting and awarding remain outside LUNAS.

Current active happy-path source: `submitted → barangay_validated → prioritized → provider_assigned → repair_assigned → in_progress → repair_completed/provider_review → verified → resolved → closed`. Completion histories append several events in one operation. Barangay priority stores `not_started`; **routing** initializes the incident/work-order SLA deadline. Provider completion review performs closure. Rejection/duplicate stop SLA; provider correction uses `rework_required`. Old `city_confirmed`, `city_verification`, `provider_accepted` and city-correction paths remain for compatibility but the `city_engineer` role cannot sign in and has empty active scopes/permissions.

Positive and negative path assessment is source plus mocked backend tests: citizen submission/ownership, barangay scope/rejection/duplicate, manual route conflict, organization scope, assignment eligibility, progress/evidence and correction/closure have test coverage. The target Tanod/approval/automatic-routing/assessment/external-authorization chain cannot be exercised because its modules are missing. Clarification, wrong-jurisdiction transfer and real multi-document concurrency lack a usable verified end-to-end path.

## 4 — Core Roles and Permissions

| Target role | Platform / scope | Current mapping and authority |
| --- | --- | --- |
| Citizen | Mobile; own reports/profile/notifications | `citizen`; self-registration, own incident scope; cannot approve/route/repair/close |
| Barangay Tanod / Field Verifier | Mobile; assigned field inspections within assigned barangay | Missing role, provisioning, tasks, findings and mobile workspace |
| Repair and Maintenance Personnel | Mobile; assigned work in matching organization and optional barangay | `repair_personnel`; progress/evidence, no approval/closure; provider currently auto-accepts assignment |
| Barangay Secretary / Authorized Personnel | Web; assigned barangay reports and verification review | `barangay_official`; currently validates, rejects, marks duplicate, assigns priority and manually routes; Tanod review/category correction missing |
| Agency Officer | Web; own participating organization | Adapt `utility_provider` (including City Engineering) rather than creating roles for each provider. Current scope uses exact `utilityCompany` / `responsibleOrganization` strings. Agency assessment/authorization policy missing. |
| System Administrator | Web; account governance, audit/support | `admin`; normal incident/work-order scopes denied. Explicit false-report correction/review exception exists; this is not incident approval/closure authority. No automatic grant of agency decisions. |

City Engineering, authorized water/electricity organizations and other formally participating agencies (possibly DPWH) are **organizations**, not separate software roles. Seeded organization names are synthetic/configuration examples, not verified jurisdictions or participation agreements. Do not route every pothole to City Engineering or all water/electricity incidents to one provider. Current string scopes can be adapted with stable agency identifiers and a compatibility migration; retain existing isolation and references. `city_engineer` remains in the enum for history but is rejected by `canSignIn` and web `toViewer`.

API `protect` reloads account status/token version, route `authorize` gates roles, and query-level `buildIncidentScope`/`buildWorkOrderScope` enforce ownership, organization, barangay and assignment. UI hiding is supplementary. Declared MongoDB indexes and mocked authorization tests do not prove deployed isolation. Backend scope regressions must include direct unauthorized API and cross-organization/barangay tests.

## 5 — Overall Implementation Status

Exact feature statuses used below:

| Status | Meaning |
| --- | --- |
| VERIFIED IMPLEMENTED | Integrated at the explicitly stated tested boundary with successful relevant checks; never implies production operation |
| IMPLEMENTED — UNVERIFIED | Source exists; operational/client integration not sufficiently verified |
| PARTIALLY IMPLEMENTED | Required components, integration or behavior remain incomplete |
| MISSING | No identifiable implementation for the required behavior |
| NEEDS REVISION | Existing behavior conflicts with revised workflow or has a source-evidenced defect |
| BLOCKED / POLICY PENDING | Authorized institutional/product decision needed |
| OUT OF SCOPE | Deliberately excluded or replaced technology, not required missing functionality |
| UNKNOWN | Insufficient evidence to decide |

The summary uses evidence-based descriptions rather than completion percentages or overlapping feature counts. “Implemented” names code capabilities, **not end-to-end certification**. Only three narrow primitives in the detailed matrix are VERIFIED IMPLEMENTED; their tests are local/backend boundaries.

| Component | Implemented | Partial | Missing | Needs Revision | Blocked | Unverified |
| --- | --- | --- | --- | --- | --- | --- |
| Citizen Mobile | Reporting/auth/history source | AI advice/verification/SLA | Agency/external visibility | Reference race | — | All device workflows |
| Secretary Web | Review/reject/duplicate source | Separate approval gate | Tanod/clarify/category/PDF | Manual routing | Approval authority | All browser workflows |
| Tanod Mobile | — | — | Role and full workflow | — | Formal mandate | Device integration |
| Agency Web | Scoped intake/maintenance source | Generalized agency model | Assessment/transfer/readiness | Work-order timing | Priority/closure | Browser integration |
| Repair Mobile | Progress/evidence source | Accept/decline UX | — | In-progress reassignment | Handoff policy | Device workflow |
| Admin Web | Provision/status/archive/audit source | Health/agency config | Routing config/reports | — | Tanod permissions | Live provisioning |
| Backend APIs | Scoped current lifecycle source | Cross-document reliability | Target stages | Reference/auto-accept | Target authority | Real DB chain |
| Agency Routing | Manual route/history source | Concurrency/ownership | Rules/fallback/transfer | Automatic trigger | Jurisdictions | Real concurrent DB |
| External Status Tracking | — | — | Status/history/readiness | Premature order creation | SLA treatment | Full chain absent |
| SLA | Deadline calculation verified locally | Escalation | External-process timing | Ownership/start semantics | Targets/start/pauses | Live cron/delivery |
| Notifications | Recipient/read-state source | Push enrollment | Tanod/external events | Event audience coverage | Channel policy | Live push/receipts |
| Reporting / PDF | Dashboard aggregates source | Usable reporting | Operational PDF/reports | Retired-role analytics | Export privacy | Report output |
| Security | Scoped/token tests passed | Audit/attack coverage | Tanod restrictions | DB root privilege | Privacy/retention | Production/adversarial |
| AI and Integrations | Metadata/hash verified locally | Classification fallback | Tanod evidence | Mandatory redaction conflict | Privacy scope | Live model/S3/email |
| Deployment | Scaffolds/runbooks source | Reproducibility | Current clean-build proof | Base privacy defaults | Release/RPO/RTO | Docker/AWS/Netlify |

## 6 — Detailed Feature Audit

Every checklist item A–M has its own row. Evidence IDs expand to actual repository paths, functions, model and permission boundaries in the registry immediately after the matrix. Tests refer to the actual runs in section 11; passing related unit tests do not certify a client feature. Required behavior includes the revised stage gates in section 3. A source-present row remains unverified when clients or live integrations were not exercised.

### A. Citizen Mobile Application

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| A01 | Registration | Citizen-only sign-up; no self-selected privileged role. | IMPLEMENTED — UNVERIFIED | [E01](#e01); `lunas_backend/src/controllers/authController.js` (register/login/refresh/logout) | T1 auth suites blocked; token/middleware passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A02 | Email or OTP verification | Verify the registration email challenge before issuing the citizen session. | IMPLEMENTED — UNVERIFIED | [E01](#e01); `lunas_backend/src/controllers/authController.js` (register/login/refresh/logout) | T1 auth suites blocked; token/middleware passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A03 | Login and logout | Login and logout within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E01](#e01); `lunas_backend/src/controllers/authController.js` (register/login/refresh/logout) | T1 auth suites blocked; token/middleware passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A04 | Secure authentication | Authenticate and refresh safely; reject revoked, expired and disabled-account sessions. | IMPLEMENTED — UNVERIFIED | [E01](#e01); `lunas_backend/src/controllers/authController.js` (register/login/refresh/logout) | T1 auth suites blocked; token/middleware passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A05 | Account recovery | Account recovery within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E01](#e01); `lunas_backend/src/controllers/authController.js` (register/login/refresh/logout) | T1 auth suites blocked; token/middleware passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A06 | Citizen dashboard | Citizen dashboard within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A07 | Incident report creation | Confirm category, description, photo evidence, canonical barangay and incident pin before durable submission. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A08 | Category selection | Category selection within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A09 | AI-assisted category suggestion | Offer optional advisory category advice; citizen confirms and humans retain all decision authority. | PARTIALLY IMPLEMENTED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 aiService/evidenceService; mobile tests blocked | Category-scoped hazard analysis exists; demonstrate a usable optional category suggestion without changing the human selection. |
| A10 | Camera and image upload | Camera and image upload within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 evidence/storage/AI mocks passed; T6 handler-only | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A11 | Image validation | Decode and validate image type, dimensions and byte limits on the server. | IMPLEMENTED — UNVERIFIED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 evidence/storage/AI mocks passed; T6 handler-only | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A12 | Map integration | Map integration within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | Mobile checks blocked | Active map is flutter_map/OpenStreetMap; verify tiles and attribution on devices. |
| A13 | Current-location detection | Current-location detection within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | T1 location/canonical validators passed; device not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A14 | Manual incident pin placement | Manual incident pin placement within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | T1 location/canonical validators passed; device not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A15 | Location confirmation | Record citizen-confirmed incident location independently of current GPS or photo capture location. | IMPLEMENTED — UNVERIFIED | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | T1 location/canonical validators passed; device not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A16 | GPS discrepancy handling | Server recomputes a usable GPS comparison; significant discrepancy requires explanation, never automatic rejection. | IMPLEMENTED — UNVERIFIED | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | T1 location/canonical validators passed; device not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A17 | Canonical barangay selection | Choose a recognized Dagupan barangay and use it for the scoped intake queue. | IMPLEMENTED — UNVERIFIED | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | T1 location/canonical validators passed; device not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A18 | Report submission | Report submission within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A19 | Report reference number | Report reference number within the role and record scope, with backend enforcement and usable client integration. | NEEDS REVISION | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | No real concurrent-create database test run | Incident pre-validate uses countDocuments()+1 with a unique reportNumber; concurrent inserts may collide. |
| A20 | My Reports | My Reports within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A21 | Incident details | Incident details within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A22 | Incident timeline | Incident timeline within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A23 | Barangay verification status | Barangay verification status within the role and record scope, with backend enforcement and usable client integration. | PARTIALLY IMPLEMENTED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incidentController/incidentValidation; mobile blocked | Only the existing barangay decision/timeline is visible; no Tanod task or findings state. |
| A24 | Responsible agency information | Responsible agency information within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | Source inspection; no passing client integration evidence | Citizen serializer omits routing/responsible organization; add an authorized public agency summary. |
| A25 | External-process visibility | External-process visibility within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No implementation-specific tests found | No external-process state exists in the model or client. |
| A26 | Maintenance progress | Maintenance progress within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A27 | SLA status visibility | SLA status visibility within the role and record scope, with backend enforcement and usable client integration. | PARTIALLY IMPLEMENTED | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 SLA backend only; mobile blocked | Scoped incident SLA endpoint exists, but citizen detail serializer omits SLA and report_service does not establish an SLA display. |
| A28 | Notifications | Notifications within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A29 | Resolved report information | Resolved report information within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| A30 | Profile management | Profile management within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E01](#e01); `lunas_backend/src/controllers/authController.js` (register/login/refresh/logout) | T1 auth suites blocked; token/middleware passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |

### B. Barangay Secretary Web Application

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| B01 | Barangay-scoped dashboard | Barangay-scoped dashboard within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| B02 | Incoming citizen reports | Incoming citizen reports within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| B03 | Report review | Report review within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| B04 | Evidence and location review | Evidence and location review within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| B05 | Tanod directory | Tanod directory within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No implementation-specific tests found | No Tanod role, assignment schema/API, or secretary UI found. |
| B06 | Tanod assignment | Secretary assigns an eligible same-barangay verifier with an auditable task. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No implementation-specific tests found | No Tanod role, assignment schema/API, or secretary UI found. |
| B07 | Tanod reassignment | Authorized replacement preserves task/findings history and revokes the former assignment. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No implementation-specific tests found | No Tanod role, assignment schema/API, or secretary UI found. |
| B08 | Field-verification monitoring | Field-verification monitoring within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No implementation-specific tests found | No Tanod role, assignment schema/API, or secretary UI found. |
| B09 | Tanod findings review | Tanod findings review within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No implementation-specific tests found | No Tanod role, assignment schema/API, or secretary UI found. |
| B10 | Secretary approval | Review submitted field findings, confirm/correct category, then separately approve, reject or clarify. | NEEDS REVISION | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incidentValidation (mocked persistence) | Existing validate action can approve without any field verification; add a separate findings-review gate. |
| B11 | Report rejection | Report rejection within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| B12 | Clarification requests | Clarification requests within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | Legacy direct-controller tests do not prove an active route | Only the retired city_engineer route requests clarification; no usable secretary-to-citizen/Tanod response loop. |
| B13 | Category correction | Authorized Secretary can correct category before approval while preserving the original and decision history. | MISSING | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | Source inspection; no category-correction test found | Generic incident update allows notes only; no authorized category-correction action before approval. |
| B14 | Duplicate incident handling | Duplicate incident handling within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| B15 | Automatic agency routing trigger | Automatic agency routing trigger within the role and record scope, with backend enforcement and usable client integration. | NEEDS REVISION | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | T1 incidentController; no target routing test | Secretary manually chooses an organization after priority; approval does not run automatic ownership/jurisdiction routing. |
| B16 | Barangay incident history | Barangay incident history within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| B17 | Agency progress monitoring | Agency progress monitoring within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incident unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| B18 | Notifications | Notifications within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| B19 | Report generation | Report generation within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | Source search only | Queue/history are present; no operational PDF or report generator. |

### C. Barangay Tanod Mobile Application

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| C01 | Tanod login | Tanod login within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C02 | Administrator-provisioned account | Administrator-provisioned account within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C03 | Barangay-scoped permissions | Barangay-scoped permissions within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C04 | Assigned inspections | Assigned inspections within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C05 | Assignment acknowledgment | Assignment acknowledgment within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C06 | Incident details | Incident details within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C07 | Incident location map | Incident location map within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C08 | Physical verification workflow | Physical verification workflow within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C09 | Verified / Not Verified / Unable to Verify results | Verified / Not Verified / Unable to Verify results within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C10 | Verification evidence upload | Verification evidence upload within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C11 | Verification remarks | Verification remarks within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C12 | Verification submission | Verification submission within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C13 | Automatic notification to Secretary | Automatic notification to Secretary within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C14 | Assigned verification history | Assigned verification history within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C15 | Follow-up status visibility | Follow-up status visibility within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C16 | Notifications | Notifications within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |
| C17 | Profile management | Profile management within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests or usable Tanod workflow found | Implement Tanod as a scoped field-verifier role across schema, provisioning, API, and mobile; existing repair personnel are not Tanods. |

### D. Agency Officer Web Application

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| D01 | Agency-specific dashboard | Agency-specific dashboard within the role and record scope, with backend enforcement and usable client integration. | NEEDS REVISION | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 jurisdictionService/workOrderService; web not run | Retain utility_provider organization scopes/intake and generalize labels/data for participating agencies; formal jurisdictions are pending. |
| D02 | Organization-scoped incident access | Organization-scoped incident access within the role and record scope, with backend enforcement and usable client integration. | NEEDS REVISION | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 jurisdictionService/workOrderService; web not run | Retain utility_provider organization scopes/intake and generalize labels/data for participating agencies; formal jurisdictions are pending. |
| D03 | Routed incident intake | Routed incident intake within the role and record scope, with backend enforcement and usable client integration. | NEEDS REVISION | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 jurisdictionService/workOrderService; web not run | Retain utility_provider organization scopes/intake and generalize labels/data for participating agencies; formal jurisdictions are pending. |
| D04 | Agency acknowledgment | Assigned agency records receipt with actor and timestamp before assessment. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No target workflow tests found | No distinct agency assessment, transfer, external-status, or authorization gate; routed work order is created immediately. |
| D05 | Incident assessment | Agency assesses jurisdiction, responsibility, resources and routine/external maintenance readiness. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No target workflow tests found | No distinct agency assessment, transfer, external-status, or authorization gate; routed work order is created immediately. |
| D06 | Infrastructure category review | Infrastructure category review within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No target workflow tests found | No distinct agency assessment, transfer, external-status, or authorization gate; routed work order is created immediately. |
| D07 | Jurisdiction correction or transfer | Jurisdiction correction or transfer within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No target workflow tests found | No distinct agency assessment, transfer, external-status, or authorization gate; routed work order is created immediately. |
| D08 | Authorized incident prioritization | Authorized incident prioritization within the role and record scope, with backend enforcement and usable client integration. | BLOCKED / POLICY PENDING | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 backend review tests verify current code only | Current priority belongs to Barangay Official; provider review closes directly. Confirm authorized priority/review/closure policy before transferring authority. |
| D09 | SLA monitoring | SLA monitoring within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| D10 | Maintenance readiness assessment | Maintenance readiness assessment within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No target workflow tests found | No distinct agency assessment, transfer, external-status, or authorization gate; routed work order is created immediately. |
| D11 | External-processing classification | External-processing classification within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No target workflow tests found | No distinct agency assessment, transfer, external-status, or authorization gate; routed work order is created immediately. |
| D12 | Bidding status tracking | Bidding status tracking within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No target workflow tests found | No distinct agency assessment, transfer, external-status, or authorization gate; routed work order is created immediately. |
| D13 | Work authorization confirmation | Authorized agency records the authorization required before a work order can proceed. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No target workflow tests found | No distinct agency assessment, transfer, external-status, or authorization gate; routed work order is created immediately. |
| D14 | Work-order creation | Work-order creation within the role and record scope, with backend enforcement and usable client integration. | NEEDS REVISION | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | T1 incidentController/workOrderLifecycle; no real DB chain | routeIncident creates the primary work order before agency assessment/readiness; provider create action exists but normally receives an existing order. |
| D15 | Repair personnel assignment | Repair personnel assignment within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| D16 | Personnel reassignment | Personnel reassignment within the role and record scope, with backend enforcement and usable client integration. | NEEDS REVISION | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 workOrderReassignment passed | History and pre-start/rework reassignment exist; new in-progress reassignment returns 409. Legacy pending handoffs can resume. |
| D17 | Work-order monitoring | Work-order monitoring within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| D18 | Repair progress tracking | Repair progress tracking within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| D19 | Completion evidence review | Completion evidence review within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| D20 | Corrective work requests | Corrective work requests within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| D21 | Authorized final approval | Authorized final approval within the role and record scope, with backend enforcement and usable client integration. | BLOCKED / POLICY PENDING | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 backend review tests verify current code only | Current priority belongs to Barangay Official; provider review closes directly. Confirm authorized priority/review/closure policy before transferring authority. |
| D22 | Incident closure permissions | Incident closure permissions within the role and record scope, with backend enforcement and usable client integration. | BLOCKED / POLICY PENDING | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 backend review tests verify current code only | Current priority belongs to Barangay Official; provider review closes directly. Confirm authorized priority/review/closure policy before transferring authority. |
| D23 | Agency notifications | Agency notifications within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| D24 | Audit history | Audit history within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| D25 | Report generation | Report generation within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | Source search only | No agency operational reports/PDF workflow found. |

### E. Repair Personnel Mobile Application

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| E01 | Login | Login within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E01](#e01); `lunas_backend/src/controllers/authController.js` (register/login/refresh/logout) | T1 auth suites blocked; token/middleware passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E02 | Work-order assignment | Work-order assignment within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E03 | Accept / Decline | Assigned worker explicitly accepts or declines with reason before beginning repair. | PARTIALLY IMPLEMENTED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 workOrderReassignment/workOrderController; mobile blocked | API/service methods exist, but provider assignment immediately records accepted; active mobile detail exposes Start/Accept and Start, no decline control found. |
| E04 | Work-order details | Work-order details within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E05 | Navigation to incident location | Navigation to incident location within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E06 | Maintenance start | Maintenance start within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E07 | Maintenance progress | Maintenance progress within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E08 | Progress percentages or milestones | Progress percentages or milestones within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E09 | Repair notes | Repair notes within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E10 | Photo evidence | Photo evidence within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E11 | Completion evidence | Completion evidence within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E12 | Work-order reassignment | Work-order reassignment within the role and record scope, with backend enforcement and usable client integration. | NEEDS REVISION | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 reassignment tests explicitly reject new in-progress reassignment | Preserve progress/evidence/history; extend current pre-start/rework-only reassignment under an approved in-progress handoff policy. |
| E13 | Corrective work handling | Corrective work handling within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E14 | Maintenance completion date | Maintenance completion date within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E15 | Elapsed repair duration | Elapsed repair duration within the role and record scope, with backend enforcement and usable client integration. | PARTIALLY IMPLEMENTED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | Mobile test execution blocked | Timestamps and duration formatting exist; demonstrate elapsed repair duration in the active detail screen, separate from SLA remaining time. |
| E16 | Notifications | Notifications within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| E17 | Work-order history | Work-order history within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 work-order unit/controller tests passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |

### F. System Administrator Web Application

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| F01 | Secure administrative login | Secure administrative login within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E01](#e01); `lunas_backend/src/controllers/authController.js` (register/login/refresh/logout) | T1 auth suites blocked; token/middleware passed; client not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| F02 | Account provisioning | Account provisioning within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E09](#e09); `lunas_backend/src/controllers/authorizedAccountController.js` (createAuthorizedAccount/changeAccountStatus) | T1 account unit tests; real DB integration skipped | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| F03 | Role assignment | Role assignment within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E09](#e09); `lunas_backend/src/controllers/authorizedAccountController.js` (createAuthorizedAccount/changeAccountStatus) | T1 account unit tests; real DB integration skipped | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| F04 | Organization assignment | Organization assignment within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E09](#e09); `lunas_backend/src/controllers/authorizedAccountController.js` (createAuthorizedAccount/changeAccountStatus) | T1 account unit tests; real DB integration skipped | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| F05 | Barangay assignment | Barangay assignment within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E09](#e09); `lunas_backend/src/controllers/authorizedAccountController.js` (createAuthorizedAccount/changeAccountStatus) | T1 account unit tests; real DB integration skipped | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| F06 | Agency configuration | Agency configuration within the role and record scope, with backend enforcement and usable client integration. | PARTIALLY IMPLEMENTED | [E09](#e09); `lunas_backend/src/controllers/authorizedAccountController.js` (createAuthorizedAccount/changeAccountStatus) | T1 userController/repairPersonnelManagement; DB integration skipped | Account organization fields and provider directory exist; no stable agency/jurisdiction master-data entity or managed routing rules. |
| F07 | Account activation | Account activation within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E09](#e09); `lunas_backend/src/controllers/authorizedAccountController.js` (createAuthorizedAccount/changeAccountStatus) | T1 account unit tests; real DB integration skipped | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| F08 | Suspension and reactivation | Suspension and reactivation within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E09](#e09); `lunas_backend/src/controllers/authorizedAccountController.js` (createAuthorizedAccount/changeAccountStatus) | T1 account unit tests; real DB integration skipped | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| F09 | Account recovery | Account recovery within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E09](#e09); `lunas_backend/src/controllers/authorizedAccountController.js` (createAuthorizedAccount/changeAccountStatus) | T1 account unit tests; real DB integration skipped | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| F10 | Account archiving | Account archiving within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E09](#e09); `lunas_backend/src/controllers/authorizedAccountController.js` (createAuthorizedAccount/changeAccountStatus) | T1 account unit tests; real DB integration skipped | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| F11 | Routing configuration | Routing configuration within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | Source inspection only | No managed routing-policy UI/API or admin operational report export. |
| F12 | Access permissions | Access permissions within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E09](#e09); `lunas_backend/src/controllers/authorizedAccountController.js` (createAuthorizedAccount/changeAccountStatus) | T1 account unit tests; real DB integration skipped | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| F13 | Audit logs | Audit logs within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E09](#e09); `lunas_backend/src/controllers/authorizedAccountController.js` (createAuthorizedAccount/changeAccountStatus) | T1 account unit tests; real DB integration skipped | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| F14 | User activity records | User activity records within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E09](#e09); `lunas_backend/src/controllers/authorizedAccountController.js` (createAuthorizedAccount/changeAccountStatus) | T1 account unit tests; real DB integration skipped | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| F15 | System health monitoring | System health monitoring within the role and record scope, with backend enforcement and usable client integration. | PARTIALLY IMPLEMENTED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | T1 server suite blocked by nodemailer | API liveness/readiness and deployment probes exist; no complete admin integration-health dashboard or security alerting. |
| F16 | Operational reporting | Operational reporting within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | Source inspection only | No managed routing-policy UI/API or admin operational report export. |

### G. Automated Agency Routing

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| G01 | Category-to-agency mappings | Category-to-agency mappings across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No target routing integration tests found | Provider picker is manual; no asset ownership/jurisdiction rule engine, review queue, or post-routing transfer. |
| G02 | Jurisdiction-aware routing | Jurisdiction-aware routing across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No target routing integration tests found | Provider picker is manual; no asset ownership/jurisdiction rule engine, review queue, or post-routing transfer. |
| G03 | Organization ownership validation | Organization ownership validation across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | T1 route/unit tests; no authoritative agency integration | Route requires an active matching provider account, but does not prove asset ownership, coverage, or account activation status via canSignIn. |
| G04 | Routing after Secretary approval | Routing after Secretary approval across the relevant API, persistence and consumer boundaries. | NEEDS REVISION | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | T1 incidentController; target chain absent | Manual routing follows validation and priority; no Tanod findings gate or automatic trigger. |
| G05 | No premature routing | Route only after separate authorized barangay approval; no automatic approval from field submission. | NEEDS REVISION | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | T1 existing state guards; no target prerequisite test | Current route rejects reports before validation/priority, but does not require the missing Tanod/Secretary findings gate and prematurely creates a work order. |
| G06 | Incorrect routing recovery | Incorrect routing recovery across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No target routing integration tests found | Provider picker is manual; no asset ownership/jurisdiction rule engine, review queue, or post-routing transfer. |
| G07 | Routing history | Routing history across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | T1 current route/controller tests; target workflow absent | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| G08 | Agency notification | Agency notification across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | T1 current route/controller tests; target workflow absent | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| G09 | Unknown-jurisdiction fallback | Send uncertain or conflicting responsibility to an authorized routing-review queue. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No target routing integration tests found | Provider picker is manual; no asset ownership/jurisdiction rule engine, review queue, or post-routing transfer. |
| G10 | Duplicate routing prevention | Duplicate routing prevention across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | T1 current route/controller tests; target workflow absent | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| G11 | Concurrent approval protection | Concurrent approval protection across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | T1 mocked conflict cases; no real concurrent DB execution | Conditional incident writes and unique work-order incident linkage exist; multi-document routing uses compensation, not a transaction/outbox. |
| G12 | Backend-enforced organization isolation | Backend-enforced organization isolation across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | T1 current route/controller tests; target workflow absent | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |

### H. External Procurement Status Tracking

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| H01 | External-process status model | External-process status model across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No external-processing implementation/tests found | Add conditional external-progress records and an agency-controlled readiness gate; funding/bidding/awarding execution stays outside LUNAS. |
| H02 | Agency permissions | Agency permissions across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No external-processing implementation/tests found | Add conditional external-progress records and an agency-controlled readiness gate; funding/bidding/awarding execution stays outside LUNAS. |
| H03 | Pending approval status | Pending approval status across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No external-processing implementation/tests found | Add conditional external-progress records and an agency-controlled readiness gate; funding/bidding/awarding execution stays outside LUNAS. |
| H04 | Pending bidding status | Pending bidding status across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No external-processing implementation/tests found | Add conditional external-progress records and an agency-controlled readiness gate; funding/bidding/awarding execution stays outside LUNAS. |
| H05 | Bidding completion status | Bidding completion status across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No external-processing implementation/tests found | Add conditional external-progress records and an agency-controlled readiness gate; funding/bidding/awarding execution stays outside LUNAS. |
| H06 | Work authorization status | Work authorization status across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No external-processing implementation/tests found | Add conditional external-progress records and an agency-controlled readiness gate; funding/bidding/awarding execution stays outside LUNAS. |
| H07 | Maintenance-readiness transition | Maintenance-readiness transition across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No external-processing implementation/tests found | Add conditional external-progress records and an agency-controlled readiness gate; funding/bidding/awarding execution stays outside LUNAS. |
| H08 | Reason and timestamp tracking | Reason and timestamp tracking across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No external-processing implementation/tests found | Add conditional external-progress records and an agency-controlled readiness gate; funding/bidding/awarding execution stays outside LUNAS. |
| H09 | Supporting reference or document handling | Supporting reference or document handling across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No external-processing implementation/tests found | Add conditional external-progress records and an agency-controlled readiness gate; funding/bidding/awarding execution stays outside LUNAS. |
| H10 | Citizen-visible status updates | Citizen-visible status updates across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No external-processing implementation/tests found | Add conditional external-progress records and an agency-controlled readiness gate; funding/bidding/awarding execution stays outside LUNAS. |
| H11 | Audit history | Audit history across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No external-processing implementation/tests found | Add conditional external-progress records and an agency-controlled readiness gate; funding/bidding/awarding execution stays outside LUNAS. |
| H12 | Prevention of premature work-order creation | Prevention of premature work-order creation across the relevant API, persistence and consumer boundaries. | MISSING | [E08](#e08); `lunas_backend/src/controllers/incidentController.js` (routeIncident; no external-process model) | No external-processing implementation/tests found | Add conditional external-progress records and an agency-controlled readiness gate; funding/bidding/awarding execution stays outside LUNAS. |
| H13 | Integration with SLA monitoring | Integration with SLA monitoring across the relevant API, persistence and consumer boundaries. | BLOCKED / POLICY PENDING | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | No external-process SLA tests found | Decide whether external processing starts, pauses, or continues SLA; do not invent a pause policy. |

### I. Automated SLA Management

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| I01 | Priority levels | Priority levels across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 SLA unit/mocked scheduler tests passed | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| I02 | Authorized priority assignment | Authorized priority assignment across the relevant API, persistence and consumer boundaries. | BLOCKED / POLICY PENDING | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 current backend behavior only | Current Barangay priority stores not_started; routing initializes incident/work-order deadline. Confirm authority and start event. |
| I03 | Deadline calculation | Deadline calculation across the relevant API, persistence and consumer boundaries. | VERIFIED IMPLEMENTED | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 slaService/slaMonitoring passed (unit/mocked models) | Pure/backend policy boundary tested: 48/72/168/336 elapsed hours with environment overrides; live scheduling is unverified. |
| I04 | SLA start event | SLA start event across the relevant API, persistence and consumer boundaries. | BLOCKED / POLICY PENDING | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 current backend behavior only | Current Barangay priority stores not_started; routing initializes incident/work-order deadline. Confirm authority and start event. |
| I05 | SLA scheduler | SLA scheduler across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 SLA unit/mocked scheduler tests passed | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| I06 | Automated warning generation | Automated warning generation across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 SLA unit/mocked scheduler tests passed | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| I07 | Overdue notifications | Overdue notifications across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| I08 | Escalation rules | Escalation rules across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 slaMonitoring mocked delivery | Initial overdue level 1 and recipient rules exist; no approved successive institutional escalation policy. |
| I09 | SLA breach recording | SLA breach recording across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 SLA unit/mocked scheduler tests passed | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| I10 | Deadline persistence | Deadline persistence across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 SLA unit/mocked scheduler tests passed | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| I11 | Reassignment behavior | Reassignment behavior across the relevant API, persistence and consumer boundaries. | NEEDS REVISION | [E03](#e03); `lunas_backend/src/controllers/workOrderController.js` (assign/startWorkOrder/updateProgress/reviewCompletedWork) | T1 workOrderReassignment | Deadlines are retained, but in-progress reassignment is rejected; align with approved handoff semantics. |
| I12 | Corrective repair behavior | Corrective repair behavior across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 SLA unit/mocked scheduler tests passed | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| I13 | External-process handling | Apply the approved external-delay SLA policy without inventing pauses or changing deadlines silently. | BLOCKED / POLICY PENDING | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | No external-process timing test | No pause/extension/business-calendar model; policy decision precedes implementation. |
| I14 | Final SLA outcome recording | Final SLA outcome recording across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 SLA unit/mocked scheduler tests passed | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| I15 | Audit records | Audit records across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 SLA unit/mocked scheduler tests passed | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |

### J. Transparency and Reporting

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| J01 | Role-based incident timeline | Role-based incident timeline within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| J02 | Status history | Status history within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| J03 | Actor and timestamp recording | Actor and timestamp recording within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| J04 | Agency responsibility visibility | Agency responsibility visibility within the role and record scope, with backend enforcement and usable client integration. | PARTIALLY IMPLEMENTED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 serializers; clients not run | Officials see routing; citizen serializer omits it; agency labels/data need generalization. |
| J05 | Barangay verification updates | Barangay verification updates within the role and record scope, with backend enforcement and usable client integration. | PARTIALLY IMPLEMENTED | [E02](#e02); `lunas_backend/src/controllers/incidentController.js` (createIncident/validateIncident/serializers) | T1 incidentValidation; no Tanod tests | Barangay decision history exists; field findings and separate approval are missing. |
| J06 | Maintenance tracking | Maintenance tracking within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| J07 | External-process visibility | External-process visibility within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No target tests found | No external status or Tanod participant. |
| J08 | SLA information | SLA information within the role and record scope, with backend enforcement and usable client integration. | PARTIALLY IMPLEMENTED | [E07](#e07); `lunas_backend/src/services/slaService.js` (initializeIncidentSLA/startSLAMonitor) | T1 SLA tests; client checks blocked | Backend projections/web SLA exist; no demonstrated citizen SLA display. |
| J09 | Citizen notifications | Citizen notifications within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| J10 | Secretary notifications | Secretary notifications within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| J11 | Tanod notifications | Tanod notifications within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | No target tests found | No external status or Tanod participant. |
| J12 | Agency notifications | Agency notifications within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| J13 | Repair notifications | Repair notifications within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| J14 | Notification read/unread state | Notification read/unread state within the role and record scope, with backend enforcement and usable client integration. | IMPLEMENTED — UNVERIFIED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notification unit tests; no live delivery | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| J15 | Daily incident reports | Daily incident reports within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | T1 statsController tests do not establish usable reporting | Dashboard filters/aggregates do not constitute printable operational reports; analytics routes are gated to retired city_engineer. |
| J16 | Weekly incident reports | Weekly incident reports within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | T1 statsController tests do not establish usable reporting | Dashboard filters/aggregates do not constitute printable operational reports; analytics routes are gated to retired city_engineer. |
| J17 | Monthly incident reports | Monthly incident reports within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | T1 statsController tests do not establish usable reporting | Dashboard filters/aggregates do not constitute printable operational reports; analytics routes are gated to retired city_engineer. |
| J18 | Category-based reports | Category-based reports within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | T1 statsController tests do not establish usable reporting | Dashboard filters/aggregates do not constitute printable operational reports; analytics routes are gated to retired city_engineer. |
| J19 | Barangay-based reports | Barangay-based reports within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | T1 statsController tests do not establish usable reporting | Dashboard filters/aggregates do not constitute printable operational reports; analytics routes are gated to retired city_engineer. |
| J20 | Agency-based reports | Agency-based reports within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | T1 statsController tests do not establish usable reporting | Dashboard filters/aggregates do not constitute printable operational reports; analytics routes are gated to retired city_engineer. |
| J21 | Maintenance completion reports | Maintenance completion reports within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | T1 statsController tests do not establish usable reporting | Dashboard filters/aggregates do not constitute printable operational reports; analytics routes are gated to retired city_engineer. |
| J22 | SLA reports | SLA reports within the role and record scope, with backend enforcement and usable client integration. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | T1 statsController tests do not establish usable reporting | Dashboard filters/aggregates do not constitute printable operational reports; analytics routes are gated to retired city_engineer. |
| J23 | Printable PDF export | Generate scoped printable incident/maintenance/SLA reports with filters and provenance. | MISSING | [E10](#e10); `lunas_backend/src/routes/statsRoutes.js` (analytics retired-role gate; no PDF route) | T1 statsController tests do not establish usable reporting | Dashboard filters/aggregates do not constitute printable operational reports; analytics routes are gated to retired city_engineer. |

### K. AI, Evidence, Mapping, and Storage

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| K01 | AI model inference | AI model inference across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 evidence/storage/AI mocks passed; T6 handler-only | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| K02 | AI advisory classification | AI advisory classification across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 aiService/evidenceService; T6 handler-only | Category-specific inference provides hazard findings; verify optional category-suggestion UX. AI remains advisory. |
| K03 | Inference fallback | Inference fallback across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 evidenceService negative cases; no live inference | Hazard-analysis failures fall back to manual review, but evidence privacy detection remains a mandatory upload dependency. |
| K04 | Image file validation | Image file validation across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 evidence/storage/AI mocks passed; T6 handler-only | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| K05 | File size and MIME validation | File size and MIME validation across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 evidence/storage/AI mocks passed; T6 handler-only | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| K06 | Image metadata stripping | Remove EXIF/GPS and other source metadata while retaining valid normalized image evidence. | VERIFIED IMPLEMENTED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 evidenceService passed; real image bytes, mocked remote services | Evidence pipeline re-encodes images, strips metadata and hashes stored bytes; storage is mocked in these checks. |
| K07 | Evidence hashing | Store SHA-256 of the actual persisted evidence bytes. | VERIFIED IMPLEMENTED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 evidenceService passed; real image bytes, mocked remote services | Evidence pipeline re-encodes images, strips metadata and hashes stored bytes; storage is mocked in these checks. |
| K08 | Private evidence storage | Persist managed evidence privately and retrieve only after record authorization via short-lived access. | IMPLEMENTED — UNVERIFIED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 evidence/storage/AI mocks passed; T6 handler-only | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| K09 | Secure file retrieval | Secure file retrieval across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 evidence/storage/AI mocks passed; T6 handler-only | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| K10 | Google Maps integration | Google Maps integration across the relevant API, persistence and consumer boundaries. | OUT OF SCOPE | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | Source inspection; map device checks not run | Historical architecture only: active mobile maps use OpenStreetMap/flutter_map and device geocoding. Retain equivalent mapping capability. |
| K11 | Geocoding | Geocoding across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | T1 location/canonical validators passed; device not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| K12 | Canonical barangay list | Canonical barangay list across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | T1 location/canonical validators passed; device not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| K13 | GPS accuracy handling | GPS accuracy handling across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | T1 location/canonical validators passed; device not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| K14 | Manual pin placement | Manual pin placement across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | T1 location/canonical validators passed; device not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| K15 | Discrepancy explanations | Discrepancy explanations across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | T1 location/canonical validators passed; device not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| K16 | Location evidence integrity | Location evidence integrity across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E05](#e05); `lunas_backend/src/services/locationIntegrityService.js` (buildLocationIntegrity) | T1 location/canonical validators passed; device not run | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| K17 | Field-verification evidence | Field-verification evidence across the relevant API, persistence and consumer boundaries. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests | Repair evidence exists but no Tanod verification evidence model/API/client. |
| K18 | Repair-completion evidence | Repair-completion evidence across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 evidence/storage/AI mocks passed; T6 handler-only | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |

### L. Security and System Integrity

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| L01 | Authentication | Authentication across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L02 | Role-Based Access Control | Role-Based Access Control across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L03 | Organization-Based Access Control | Organization-Based Access Control across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L04 | Barangay isolation | Barangay isolation across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L05 | Citizen ownership checks | Citizen ownership checks across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L06 | Tanod assignment restrictions | Only the eligible current verifier may read and submit a scoped field task. | MISSING | [E06](#e06); `lunas_backend/src/utils/accountPolicy.js` (USER_ROLES; no Tanod role) | No Tanod tests | No Tanod role or tasks; deny-by-default unknown roles are not a Tanod authorization implementation. |
| L07 | Repair personnel assignment restrictions | Repair personnel assignment restrictions across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L08 | Backend authorization | Backend authorization across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L09 | Direct API access restrictions | Direct API access restrictions across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L10 | IDOR/BOLA protection | IDOR/BOLA protection across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L11 | Session expiration | Session expiration across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L12 | Token revocation | Token revocation across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L13 | Disabled-account access prevention | Disabled-account access prevention across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L14 | Rate limiting | Rate limiting across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L15 | CAPTCHA enforcement where applicable | CAPTCHA enforcement where applicable across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | Source-observed branch; authController suite could not load | Login CAPTCHA is conditional on caller-controlled optional platform=web; direct clients can omit or change platform. Enforce the approved privileged/web login policy server-side. |
| L16 | Server-side data validation | Server-side data validation across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L17 | Injection protection | Injection protection across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 validation/auth; server suite failed to load; web blocked | Typed validators, escaped search, React rendering, Helmet, explicit CORS, HttpOnly/SameSite cookies exist; no complete adversarial browser/API review run. |
| L18 | XSS protection | XSS protection across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 validation/auth; server suite failed to load; web blocked | Typed validators, escaped search, React rendering, Helmet, explicit CORS, HttpOnly/SameSite cookies exist; no complete adversarial browser/API review run. |
| L19 | CSRF/CORS configuration | CSRF/CORS configuration across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 validation/auth; server suite failed to load; web blocked | Typed validators, escaped search, React rendering, Helmet, explicit CORS, HttpOnly/SameSite cookies exist; no complete adversarial browser/API review run. |
| L20 | Mass-assignment prevention | Mass-assignment prevention across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L21 | Secure file uploads | Secure file uploads across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L22 | Audit logging | Audit logging across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 auditLogger/AuditLog passed; DB integration skipped | Sanitized append-style history exists; createAuditLog swallows persistence failures; no tamper evidence or atomic audit outbox. |
| L23 | Database permissions | Application database principal has only necessary privileges, with separately controlled administration. | NEEDS REVISION | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | Compose source inspection; no DB privilege test | Base Compose connects backend with MongoDB root credentials; use a least-privilege application principal. |
| L24 | Backup and restore procedures | Backup and restore procedures across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | Not executed (would access/change data) | Backup/restore shell scripts exist; no isolated restore drill, scheduled backup evidence, or approved RPO/RTO. |
| L25 | Security monitoring | Security monitoring across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | Static inspection only | Winston/audit logs and health probes exist; no demonstrated alerting or incident-response integration. |
| L26 | Availability and readiness checks | Availability and readiness checks across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L27 | Archiving rather than ordinary hard deletion of operational history | Archiving rather than ordinary hard deletion of operational history across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 scoped unit checks; no full adversarial integration | Implementation exists for the current workflow; run scoped positive/negative client and real-service checks before claiming end-to-end completion. |
| L28 | Protection of credentials and secrets | Protection of credentials and secrets across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E12](#e12); `lunas_backend/src/middleware/auth.js` (protect/authorize; see scoped services in registry) | T1 runtime/authTokens/auditLogger; live config not read | Runtime secret validation, server-only BFF config, audit sanitization, and AWS SSM scaffold exist; no full-history secret scan or deployed secret verification. |

### M. Architecture, Integration, and Deployment

| ID | Feature | Required Behavior | Status | Evidence | Tests | Gap / Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| M01 | Backend connectivity | Backend connectivity across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | See T1–T8; no production integration evidence | Source/configuration exists; live services, deployed indexes, and clean client builds were not verified. |
| M02 | Web-to-backend integration | Web-to-backend integration across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | See T1–T8; no production integration evidence | Source/configuration exists; live services, deployed indexes, and clean client builds were not verified. |
| M03 | Mobile-to-backend integration | Mobile-to-backend integration across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | See T1–T8; no production integration evidence | Source/configuration exists; live services, deployed indexes, and clean client builds were not verified. |
| M04 | AI inference integration | AI inference integration across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | See T1–T8; no production integration evidence | Source/configuration exists; live services, deployed indexes, and clean client builds were not verified. |
| M05 | MongoDB models and indexes | MongoDB models and indexes across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | See T1–T8; no production integration evidence | Source/configuration exists; live services, deployed indexes, and clean client builds were not verified. |
| M06 | Supabase evidence integration | Supabase evidence integration across the relevant API, persistence and consumer boundaries. | NEEDS REVISION | [E04](#e04); `lunas_backend/src/services/evidenceService.js` (processAndUploadEvidence/processAndUploadRepairEvidence) | T1 storageService mocks only | New writes use private S3; Supabase is migration-only. Update older component documentation and validate legacy reads separately. |
| M07 | Push notifications | Push notifications across the relevant API, persistence and consumer boundaries. | PARTIALLY IMPLEMENTED | [E13](#e13); `lunas_backend/src/services/notificationService.js` (createNotification/normalizeNotificationData) | T1 notificationService mocks; no push receipt | Optional OneSignal backend delivery exists; Flutter has no OneSignal SDK/enrollment workflow in active dependencies. |
| M08 | Docker configuration | Docker configuration across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | See T1–T8; no production integration evidence | Source/configuration exists; live services, deployed indexes, and clean client builds were not verified. |
| M09 | Environment variables | Environment variables across the relevant API, persistence and consumer boundaries. | NEEDS REVISION | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | Source contradiction plus T1 fail-closed test; Compose runtime not run | Base Compose defaults privacy redaction/AI disabled but redactEvidence throws when privacy disabled; ordinary multipart uploads fail with that configuration. |
| M10 | Health checks | Health checks across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | See T1–T8; no production integration evidence | Source/configuration exists; live services, deployed indexes, and clean client builds were not verified. |
| M11 | Production build configuration | Production build configuration across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | See T1–T8; no production integration evidence | Source/configuration exists; live services, deployed indexes, and clean client builds were not verified. |
| M12 | Error handling | Error handling across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | See T1–T8; no production integration evidence | Source/configuration exists; live services, deployed indexes, and clean client builds were not verified. |
| M13 | Logging | Logging across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | See T1–T8; no production integration evidence | Source/configuration exists; live services, deployed indexes, and clean client builds were not verified. |
| M14 | Deployment reproducibility | Deployment reproducibility across the relevant API, persistence and consumer boundaries. | IMPLEMENTED — UNVERIFIED | [E11](#e11); `docker-compose.yml` (backend/web/lunas-ai configuration) | See T1–T8; no production integration evidence | Source/configuration exists; live services, deployed indexes, and clean client builds were not verified. |

### Evidence registry

Tests listed here are repository-relative backend `*.test.js`, mobile `test/`, and web `tests/` files unless a complete path is shown. Evidence of absence is the inspected schema/route/client inventory and targeted search, not a claim about uninspected deployed systems. Line anchors are illustrative for this audited commit; symbols are the stable locator.

<a id="e01"></a>

**E01 — Authentication.** Citizen registration/email challenge, login/logout/refresh, recovery and profile APIs. protect rechecks canSignIn/tokenVersion. Web AES-GCM HttpOnly session; mobile secure storage. Auth/MFA/server suites could not load; authTokens and middleware tests passed.

[lunas_mobile/lib/features/auth/data/services/auth_service.dart](lunas_mobile/lib/features/auth/data/services/auth_service.dart); [lunas_mobile/lib/features/auth/presentation/controllers/auth_controller.dart](lunas_mobile/lib/features/auth/presentation/controllers/auth_controller.dart); [lunas_mobile/lib/core/storage/secure_session_store.dart](lunas_mobile/lib/core/storage/secure_session_store.dart); [lunas_backend/src/routes/authRoutes.js](lunas_backend/src/routes/authRoutes.js); [lunas_backend/src/controllers/authController.js](lunas_backend/src/controllers/authController.js); [lunas_backend/src/models/User.js](lunas_backend/src/models/User.js); [lunas_backend/src/middleware/auth.js](lunas_backend/src/middleware/auth.js); [lunas_backend/src/utils/authTokens.js](lunas_backend/src/utils/authTokens.js); [lunas_web/src/app/actions/auth.ts](lunas_web/src/app/actions/auth.ts); [lunas_web/src/lib/auth/session-crypto.ts](lunas_web/src/lib/auth/session-crypto.ts).

<a id="e02"></a>

**E02 — Incident review and citizen transparency.** createIncident, getPendingValidation, validateIncident, rejectIncident, markDuplicateIncident, serializeIncidentForCitizen/Official and buildIncidentScope. Relevant backend incidentController/incidentValidation/jurisdictionService tests passed with mocked persistence. Web location-integrity and mobile incident_report/report_timeline_display tests exist but were not run.

[lunas_mobile/lib/features/reporting/presentation/screens/new_citizen_report_screen.dart](lunas_mobile/lib/features/reporting/presentation/screens/new_citizen_report_screen.dart); [lunas_mobile/lib/features/reporting/presentation/screens/citizen_report_detail_screen.dart](lunas_mobile/lib/features/reporting/presentation/screens/citizen_report_detail_screen.dart); [lunas_mobile/lib/features/reporting/data/services/report_service.dart](lunas_mobile/lib/features/reporting/data/services/report_service.dart); [lunas_mobile/lib/features/reporting/presentation/widgets/report_status_timeline.dart](lunas_mobile/lib/features/reporting/presentation/widgets/report_status_timeline.dart); [lunas_web/src/app/actions/validation.ts](lunas_web/src/app/actions/validation.ts); [lunas_web/src/lib/validation.server.ts](lunas_web/src/lib/validation.server.ts); [lunas_backend/src/routes/incidentRoutes.js](lunas_backend/src/routes/incidentRoutes.js); [lunas_backend/src/controllers/incidentController.js](lunas_backend/src/controllers/incidentController.js); [lunas_backend/src/models/Incident.js](lunas_backend/src/models/Incident.js); [lunas_backend/src/services/incidentTransitionService.js](lunas_backend/src/services/incidentTransitionService.js); [lunas_backend/src/services/jurisdictionService.js](lunas_backend/src/services/jurisdictionService.js).

<a id="e03"></a>

**E03 — Agency and repair maintenance.** assign/reassign, acceptWorkOrder/declineWorkOrder/startWorkOrder, updateProgress, uploadRepairEvidence, reviewCompletedWork; buildWorkOrderScope requires organization and current assignment. Backend workOrderController/Lifecycle/Workflow/Handoff/Reassignment and workOrderService tests passed. New assignment is auto-accepted; new in-progress reassignment is denied. Legacy handoff acceptance is tested, not proof of new in-progress reassignment support.

[lunas_web/src/lib/work-orders.server.ts](lunas_web/src/lib/work-orders.server.ts); [lunas_web/src/app/actions/work-orders.ts](lunas_web/src/app/actions/work-orders.ts); [lunas_web/src/components/work-orders/provider-incident-detail.tsx](lunas_web/src/components/work-orders/provider-incident-detail.tsx); [lunas_mobile/lib/features/repair/data/services/repair_service.dart](lunas_mobile/lib/features/repair/data/services/repair_service.dart); [lunas_mobile/lib/features/repair/data/models/repair_models.dart](lunas_mobile/lib/features/repair/data/models/repair_models.dart); [lunas_mobile/lib/features/repair/presentation/screens/work_order_details_screen.dart](lunas_mobile/lib/features/repair/presentation/screens/work_order_details_screen.dart); [lunas_mobile/lib/features/repair/presentation/screens/update_repair_progress_screen.dart](lunas_mobile/lib/features/repair/presentation/screens/update_repair_progress_screen.dart); [lunas_backend/src/routes/workOrderRoutes.js](lunas_backend/src/routes/workOrderRoutes.js); [lunas_backend/src/controllers/workOrderController.js](lunas_backend/src/controllers/workOrderController.js); [lunas_backend/src/models/WorkOrder.js](lunas_backend/src/models/WorkOrder.js); [lunas_backend/src/services/workOrderService.js](lunas_backend/src/services/workOrderService.js).

<a id="e04"></a>

**E04 — Evidence and assistive AI.** processAndUploadEvidence/processAndUploadRepairEvidence, prepareEvidenceImage, SHA-256 checksum, S3 getEvidenceUrl/signing; advisoryOnly/requiresManualReview enforced. Backend upload/evidenceService/storageService/aiService tests passed. AI test_privacy_scope uses AST-extracted handlers/mocks: 5 passed, not model inference. Classification fallback does not bypass mandatory redactEvidence.

[lunas_mobile/lib/features/reporting/data/services/evidence_analysis_service.dart](lunas_mobile/lib/features/reporting/data/services/evidence_analysis_service.dart); [lunas_mobile/lib/features/reporting/presentation/screens/evidence_picker_screen.dart](lunas_mobile/lib/features/reporting/presentation/screens/evidence_picker_screen.dart); [lunas_backend/src/middleware/upload.js](lunas_backend/src/middleware/upload.js); [lunas_backend/src/utils/imageProcessor.js](lunas_backend/src/utils/imageProcessor.js); [lunas_backend/src/services/evidenceService.js](lunas_backend/src/services/evidenceService.js); [lunas_backend/src/services/storageService.js](lunas_backend/src/services/storageService.js); [lunas_backend/src/services/aiService.js](lunas_backend/src/services/aiService.js); [lunas_ai/src/api/routes.py](lunas_ai/src/api/routes.py); [lunas_ai/src/services/detection_service.py](lunas_ai/src/services/detection_service.py); [lunas_ai/src/services/privacy_service.py](lunas_ai/src/services/privacy_service.py); [lunas_ai/config.yaml](lunas_ai/config.yaml).

<a id="e05"></a>

**E05 — Location and barangay integrity.** flutter_map/OpenStreetMap, geolocator, device placemarkFromCoordinates; canonical barangay/city validation; buildLocationIntegrity recomputes distance, accuracy/age and explanations. Backend locationIntegrityService/dagupanBarangays/validation tests passed. Device GPS/geocoding and authoritative geographic containment are unverified; no authoritative boundary dataset found.

[lunas_mobile/lib/features/maps/presentation/widgets/lunas_street_map.dart](lunas_mobile/lib/features/maps/presentation/widgets/lunas_street_map.dart); [lunas_mobile/lib/features/maps/presentation/screens/map_picker_screen.dart](lunas_mobile/lib/features/maps/presentation/screens/map_picker_screen.dart); [lunas_mobile/lib/features/maps/data/services/location_service.dart](lunas_mobile/lib/features/maps/data/services/location_service.dart); [lunas_mobile/lib/features/reporting/presentation/screens/report_review_screen.dart](lunas_mobile/lib/features/reporting/presentation/screens/report_review_screen.dart); [lunas_backend/src/services/locationIntegrityService.js](lunas_backend/src/services/locationIntegrityService.js); [lunas_backend/src/data/dagupanBarangays.js](lunas_backend/src/data/dagupanBarangays.js); [lunas_backend/src/middleware/validation.js](lunas_backend/src/middleware/validation.js).

<a id="e06"></a>

**E06 — Tanod absence and role boundaries.** USER_ROLES includes citizen/repair_personnel/barangay_official/city_engineer/utility_provider/admin; city_engineer is retired by canSignIn. Mobile supports citizen/repair_personnel only. No Tanod directory, task, result enum, evidence or findings-review workflow was identified by role/model/route/client inventory and targeted source searches. No Tanod test coverage found.

[lunas_backend/src/utils/accountPolicy.js](lunas_backend/src/utils/accountPolicy.js); [lunas_backend/src/models/User.js](lunas_backend/src/models/User.js); [lunas_backend/src/models/Incident.js](lunas_backend/src/models/Incident.js); [lunas_backend/src/routes/incidentRoutes.js](lunas_backend/src/routes/incidentRoutes.js); [lunas_mobile/lib/features/auth/domain/auth_role_policy.dart](lunas_mobile/lib/features/auth/domain/auth_role_policy.dart); [lunas_mobile/lib/core/routes/app_router.dart](lunas_mobile/lib/core/routes/app_router.dart); [lunas_web/src/lib/permissions.ts](lunas_web/src/lib/permissions.ts).

<a id="e07"></a>

**E07 — SLA policy and monitoring.** getSLAHours/initializeIncidentSLA, getSlaProjection/getClosedSlaFields, runIncidentSlaCheck/runWorkOrderSlaCheck, normalizeTerminalSla, startSLAMonitor. Backend slaService/slaMonitoring/slaWorkOrder tests passed with mocks/fake time. Runtime polling requires SLA_AUTOMATION_ENABLED=true, default interval 5 minutes; base Compose enables it. No live clock/database/email/push monitoring proof.

[lunas_backend/src/services/slaService.js](lunas_backend/src/services/slaService.js); [lunas_backend/src/services/workOrderService.js](lunas_backend/src/services/workOrderService.js); [lunas_backend/src/controllers/incidentController.js](lunas_backend/src/controllers/incidentController.js); [lunas_backend/src/models/Incident.js](lunas_backend/src/models/Incident.js); [lunas_backend/src/models/WorkOrder.js](lunas_backend/src/models/WorkOrder.js); [lunas_backend/src/models/Notification.js](lunas_backend/src/models/Notification.js); [lunas_web/src/app/(protected)/sla/page.tsx](lunas_web/src/app/%28protected%29/sla/page.tsx).

<a id="e08"></a>

**E08 — Routing and missing external processing.** routeIncident (:1254) requires prioritized, active matching provider account and barangay scope; creates unique primary WorkOrder then conditionally updates Incident, compensating on failure. It starts SLA and notifies provider. No automatic category/asset/jurisdiction mapping, routing-review queue, agency assessment or external-process model found. WorkOrder incident unique index is declared; deployed index existence not verified.

[lunas_web/src/app/actions/validation.ts](lunas_web/src/app/actions/validation.ts); [lunas_web/src/lib/validation.server.ts](lunas_web/src/lib/validation.server.ts); [lunas_backend/src/controllers/incidentController.js](lunas_backend/src/controllers/incidentController.js); [lunas_backend/src/services/jurisdictionService.js](lunas_backend/src/services/jurisdictionService.js); [lunas_backend/src/models/Incident.js](lunas_backend/src/models/Incident.js); [lunas_backend/src/models/WorkOrder.js](lunas_backend/src/models/WorkOrder.js); [lunas_backend/src/routes/incidentRoutes.js](lunas_backend/src/routes/incidentRoutes.js).

<a id="e09"></a>

**E09 — Account governance.** Admin provisioning, role/barangay/organization assignment, activation/status/archive and provider-scoped repair staffing exist. Admin provisioning allowlist controls administrators. User/repairPersonnelManagement/accountActivation tests passed, but authorizedAccounts.integration skipped (no ACCOUNT_TEST_MONGODB_URI), activation email unverified. Tanod provisioning is absent; organizations remain strings.

[lunas_web/src/app/(protected)/admin/users/page.tsx](lunas_web/src/app/%28protected%29/admin/users/page.tsx); [lunas_web/src/app/actions/authorized-accounts.ts](lunas_web/src/app/actions/authorized-accounts.ts); [lunas_web/src/app/actions/repair-personnel.ts](lunas_web/src/app/actions/repair-personnel.ts); [lunas_backend/src/routes/userRoutes.js](lunas_backend/src/routes/userRoutes.js); [lunas_backend/src/controllers/authorizedAccountController.js](lunas_backend/src/controllers/authorizedAccountController.js); [lunas_backend/src/controllers/userController.js](lunas_backend/src/controllers/userController.js); [lunas_backend/src/middleware/accountValidation.js](lunas_backend/src/middleware/accountValidation.js); [lunas_backend/src/models/User.js](lunas_backend/src/models/User.js); [lunas_backend/src/utils/accountPolicy.js](lunas_backend/src/utils/accountPolicy.js).

<a id="e10"></a>

**E10 — Reporting and analytics gaps.** getDashboardStats scopes current dashboards; analytics and barangay-report endpoints require retired city_engineer. The reports route is a compatibility entry, not a PDF generator. Repository searches found only legal-page window.print(), not incident/maintenance/SLA PDF reports. statsController tests passed with mocked models; no report-export test found.

[lunas_backend/src/routes/statsRoutes.js](lunas_backend/src/routes/statsRoutes.js); [lunas_backend/src/controllers/statsController.js](lunas_backend/src/controllers/statsController.js); [lunas_web/src/lib/dashboard.server.ts](lunas_web/src/lib/dashboard.server.ts); [lunas_web/src/app/(protected)/reports/page.tsx](lunas_web/src/app/%28protected%29/reports/page.tsx); [lunas_web/src/app/(protected)/admin/[...segments]/page.tsx](lunas_web/src/app/%28protected%29/admin/%5B...segments%5D/page.tsx).

<a id="e11"></a>

**E11 — Architecture and operations.** Express/Mongoose, Next standalone, Flutter, Flask/Ultralytics, S3/RustFS; Mongo readiness and private service networking configured. AWS Terraform/deploy/backup and Netlify assets exist but were not applied. Base Compose uses Mongo root for application access and privacy defaults conflict with upload requirements. No tracked GitHub workflow found; Docker command unavailable on PATH.

[docker-compose.yml](docker-compose.yml); [docker-compose.local.yml](docker-compose.local.yml); [lunas_backend/src/server.js](lunas_backend/src/server.js); [lunas_backend/src/config/runtime.js](lunas_backend/src/config/runtime.js); [lunas_backend/Dockerfile](lunas_backend/Dockerfile); [lunas_web/Dockerfile](lunas_web/Dockerfile); [lunas_web/next.config.ts](lunas_web/next.config.ts); [lunas_web/src/app/api/health/route.ts](lunas_web/src/app/api/health/route.ts); [lunas_ai/Dockerfile](lunas_ai/Dockerfile); [infra/aws/terraform/main.tf](infra/aws/terraform/main.tf); [infra/aws/scripts/backup-mongodb.sh](infra/aws/scripts/backup-mongodb.sh); [infra/aws/scripts/restore-mongodb.sh](infra/aws/scripts/restore-mongodb.sh); [netlify.toml](netlify.toml).

<a id="e12"></a>

**E12 — Security and audit.** protect/authorize, query scopes, tokenVersion, payload allowlists, auth/rate limits and CAPTCHA exist. auditLogger sanitizes secrets but tolerates persistence failure. False-report getReview returns scoped and total findings; Admin has an explicit global review exception. Reporting restriction blocks after three active findings. Relevant backend unit tests passed; no penetration test, complete secret scan, database privilege verification or browser-origin attack test performed.

[lunas_backend/src/middleware/auth.js](lunas_backend/src/middleware/auth.js); [lunas_backend/src/middleware/validation.js](lunas_backend/src/middleware/validation.js); [lunas_backend/src/middleware/loginRateLimiter.js](lunas_backend/src/middleware/loginRateLimiter.js); [lunas_backend/src/services/captchaService.js](lunas_backend/src/services/captchaService.js); [lunas_backend/src/utils/auditLogger.js](lunas_backend/src/utils/auditLogger.js); [lunas_backend/src/models/AuditLog.js](lunas_backend/src/models/AuditLog.js); [lunas_backend/src/controllers/falseReportReviewController.js](lunas_backend/src/controllers/falseReportReviewController.js); [lunas_backend/src/services/reportingRestrictionService.js](lunas_backend/src/services/reportingRestrictionService.js); [lunas_backend/src/server.js](lunas_backend/src/server.js); [lunas_web/src/proxy.ts](lunas_web/src/proxy.ts); [lunas_web/src/lib/auth/dal.server.ts](lunas_web/src/lib/auth/dal.server.ts); [lunas_web/src/lib/auth/session-crypto.ts](lunas_web/src/lib/auth/session-crypto.ts).

<a id="e13"></a>

**E13 — Notifications.** Recipient-scoped list/read state, incident/work-order enrichment and optional OneSignal push exist. Repair notification routes now exist. SLA idempotency keys protect in-app duplicate delivery. sendBulkNotifications uses insertMany, not per-recipient push. No Flutter OneSignal SDK/device enrollment found; push and live delivery remain unverified. notificationController/notificationService tests passed; mobile notification_center and web notifications tests not run.

[lunas_backend/src/routes/notificationRoutes.js](lunas_backend/src/routes/notificationRoutes.js); [lunas_backend/src/controllers/notificationController.js](lunas_backend/src/controllers/notificationController.js); [lunas_backend/src/services/notificationService.js](lunas_backend/src/services/notificationService.js); [lunas_backend/src/models/Notification.js](lunas_backend/src/models/Notification.js); [lunas_mobile/lib/features/notifications/data/services/notification_service.dart](lunas_mobile/lib/features/notifications/data/services/notification_service.dart); [lunas_mobile/lib/core/routes/app_router.dart](lunas_mobile/lib/core/routes/app_router.dart); [lunas_web/src/app/actions/notifications.ts](lunas_web/src/app/actions/notifications.ts); [lunas_web/src/app/(protected)/notifications/page.tsx](lunas_web/src/app/%28protected%29/notifications/page.tsx).

### Excluded and legacy functionality

| Feature | Status | Current evidence / disposition |
| --- | --- | --- |
| Bidding execution, budget allocation, bid evaluation, contractor selection, contract awarding | OUT OF SCOPE | No required implementation; future external status recording must not implement procurement decisions. |
| Automatic final repair approval; AI-only priority; SSIM repair acceptance | OUT OF SCOPE | Current provider review is human; AI outputs force advisory/manual-review flags. No authorized automated final acceptance demonstrated. |
| Face/plate masking | OUT OF SCOPE | Contrary current behavior exists in `evidenceService.redactEvidence`, `imageProcessor.applyPrivacyRedactions` and AI privacy service. Mandatory dependency requires scope reconciliation; do not remove during audit. |
| Ed25519/e-signatures | OUT OF SCOPE | No required signature workflow; hashing is evidence integrity, not a digital signature. |
| Removed image-duplication features | OUT OF SCOPE | Active duplicate candidates compare category/location/time (`duplicateDetectionService`), not image duplication. Preserve separate human duplicate incident review. |
| Unrestricted cross-role access | OUT OF SCOPE | Do not restore retired city-wide/admin operational scopes to unblock new features. |
| Retired City Engineer APIs/statuses and compatibility routes | NEEDS REVISION | Role cannot sign in; old confirm/clarification/jurisdiction/final-review/analytics routes and direct-controller tests persist. Inventory legacy records before migration/removal. |
| `SLAConfig` / `SystemConfig` models | IMPLEMENTED — UNVERIFIED | Model declarations are not the runtime SLA policy; active defaults come from `slaService`/environment. |
| Reporting restrictions and appeals | BLOCKED / POLICY PENDING | Current `reportingRestrictionService` blocks new reports at three active findings; appeals/support code exists. Older “no automatic punishment” docs are stale. Confirm mandate, scope of counts and due process; preserve records during audit. |

## 7 — Existing Functionality That Must Be Preserved

Retain citizen-only registration with email challenge; activation/recovery separation; refresh rotation, token-version revocation and disabled-account checks; admin provisioning controls; canonical barangay/city validation; citizen ownership, barangay, provider and current-worker query scopes. Do not broaden access merely to accommodate the new role names.

Retain private evidence keys and authorized signed URLs, decoded-image validation, metadata stripping, stored-byte hashing, failed-upload cleanup, citizen-confirmed location and neutral GPS explanations. Keep AI advisory and human duplicate/rejection decisions. Resolve visual-redaction scope deliberately rather than silently weakening evidence privacy.

Retain provider intake and reachable `provider-incident-detail`/create action, staffing/eligibility, assignment and repair history, correction loops, completion evidence, timestamps, SLA calculations/terminal outcomes, idempotent in-app alerts, recipient read state, citizen-safe timelines and repair notification routes. Preserve historical identifiers, actors, timestamps, evidence and work-order links in migrations. These capabilities have code/test evidence, with live operation still unverified as recorded above.

## 8 — Required Revisions to Existing Features

| Area | Required adaptation / compatibility boundary |
| --- | --- |
| Barangay validation | Separate Tanod field submission from Secretary decision; add reject/clarify/category correction without overwriting original citizen evidence. |
| Tanod assignments | New task lifecycle, barangay/assignment authorization, acknowledgment/findings/evidence/history/reassignment; do not reuse repair employment identity as the Tanod role. |
| Direct agency routing | Replace manual provider selection with category/asset/ownership/jurisdiction rules after approval; authorized ambiguity review and transfers need traceable reasons. |
| Agency-specific permissions | Adapt existing provider workspace and stable organization scopes; migrate string identifiers safely and keep City Engineering organization-scoped. |
| SLA ownership | Decide priority authority/start/external delays; currently Barangay priority precedes route-time start. Preserve existing deadlines/history and terminal normalization. |
| Work-order ownership | Agency assessment and readiness must precede authorization/creation. Routing currently creates order immediately. Separate agency receipt from worker auto-acceptance. |
| Closure authority | Provider acceptance closes now; define authorized agency reviewer/official closure policy before migration. Never automatically transfer all retired City Engineer powers. |
| Status tracking | Add field-verification/agency/external/readiness records, histories and role-safe projections; keep old status mapping for existing data. |
| Notifications | New stage recipients/events and retry semantics; citizen/secretary/agency/repair updates plus Tanod channels, push enrollment and authorized deep links. |
| Database compatibility | Stable agency IDs, Tanod task references, external events, approved category/history, safe report numbering and transactional/outbox coordination. Validate actual indexes and migrate retired-role records with backup. |

## 9 — Missing Features

| Layer | Required gaps (not optional out-of-scope functionality) |
| --- | --- |
| Mobile | Tanod workspace and task/result/evidence/history/profile; citizen agency/external/SLA presentation; usable worker accept/decline choices. |
| Web | Tanod directory/task/findings review; Secretary clarification/category correction; agency acknowledgment/assessment/jurisdiction transfer/readiness; authorized routing review; external-progress UI; operational PDF reporting. |
| Backend | Tanod APIs/scopes, approval prerequisites, automatic jurisdiction-aware routing, ambiguity/transfer workflow, agency assessment, external statuses/references/readiness guard, operational exports. |
| Database | Tanod/task/result model, agency/asset/jurisdiction rule master data, external progress and authorization records; audited compatibility migration. |
| Security | Tanod-specific assignment/record restrictions and target-stage permission matrix; least-privilege DB user, verified new-stage negative API tests. |
| Integration | Mobile push enrollment/receipt demonstration, authoritative ownership/boundary data, complete client/API/MongoDB/S3/email/AI chain verification. |
| Reporting | Authorized daily/weekly/monthly/category/barangay/agency/maintenance/SLA reports and printable PDF export. Current dashboard aggregates are not report exports. |

## 10 — Security and RBAC Assessment

**Confidentiality:** citizen ownership and barangay/provider/current-worker query scoping, safe citizen serializers and private signed evidence paths have source and passing unit evidence. Live DB/browser isolation remains unverified. Exact organization strings are the current isolation key; agency renames or migration must preserve scopes. Mobile OneSignal enrollment is absent. Legacy evidence URL handling can return existing external URLs; audit historical private-object exposure separately. The create API also accepts legacy HTTPS `images[].url` without the managed image processing pipeline (`normalizeLegacyImages` and createIncidentValidation). This compatibility path does not establish file type, metadata, hashing, redaction or private storage for those remote bytes. Audit or restrict new legacy-URL submissions under an approved compatibility policy; do not claim all evidence is normalized/private. No live credential values were inspected or published.

`falseReportReviewController.getReview` exposes both `confirmedFindingsInScope` and global `confirmedFindingsTotal` to a scoped Barangay Official. This is a **source-observed cross-scope aggregate disclosure**, not a demonstrated arbitrary-record exploit. Admin review deliberately uses a global scope and correction authority. Confirm which roles may see global reporter aggregates and whether those restrictions are authorized. Ordinary rejection, GPS mismatch and duplicate status must not independently constitute fabricated-report findings.

**Login CAPTCHA boundary:** authController.login runs CAPTCHA only when the request body says `platform === web`; loginValidation makes platform optional and also accepts native platform values. This is a caller-controlled bypass of the web-only challenge, including direct attempts for privileged accounts. Password and rate-limit checks still apply. No authenticated exploit or live API check was performed; authController tests could not load. Enforce challenge policy at a trusted server/account boundary and test omitted/spoofed platform cases.

**Integrity:** controlled routes, validators/field allowlists, conditional state writes, worker version checks, unique primary-work-order schema and hashes/history are present. Backend unit checks exercise several stale-action/cross-scope/invalid-input cases. The report number is count-derived and vulnerable to concurrent collisions. Incident/work-order/evidence/notification/audit updates are not one transaction: routing has compensation, but process failure can leave partial records; completion commits the work order before incident update/notification and has no durable outbox. `createAuditLog` logs and returns null on database failure. Append-style application logs are not tamper-proof storage. No live race/rollback/fault-recovery test was run.

**Availability:** API `/health` tests process liveness; `/health/ready` checks MongoDB only. Storage, transactional email, AI privacy and notification outages are not readiness dependencies. Current `redactEvidence` rejects when privacy is disabled, while base Compose defaults both AI and privacy flags false: the default configuration cannot accept normal multipart evidence. This is confirmed by source and the tested fail-closed branch, not a live Compose reproduction. Required `nodemailer` missing from this local installation blocks server/auth suite loading. Runtime production configuration checks, explicit origins, rate limits and private networking exist; live release readiness is unverified.

| Safeguard / risk | Evidence level | Assessment / next verification |
| --- | --- | --- |
| Authentication/token revocation/disabled accounts | Passing middleware/authTokens/runtime unit checks; auth suite load failure | Useful safeguards; repair install and test complete route/session lifecycle. |
| RBAC/OBAC/barangay/citizen/repair assignment | Passing jurisdiction/workOrderService/controller mocks | Preserve deny-by-default; real DB/direct HTTP negative tests still required. Tanod restrictions absent. |
| CAPTCHA/rate limits | Passing captcha/loginRateLimiter unit tests; source routes | Production Turnstile/runtime checks exist, but optional caller-controlled platform can skip the challenge. Local bypass flags are development-only. Live enforcement not verified. |
| Upload validation/metadata/hash | Passing real-image pipeline and upload unit tests, mocked storage/AI | Validate signed retrieval, decompression/resource bounds and full multipart API on an isolated stack. |
| XSS/injection/mass assignment | Validators, escaped search, React rendering, dedicated mutation payloads | No comprehensive fuzzing/stored-XSS/NoSQL injection exercise performed. Do not label fully verified. |
| CSRF/CORS/session confidentiality | Explicit CORS; encrypted HttpOnly Secure-in-production SameSite=Lax cookie; server actions | No browser-origin attack suite executed; retain backend bearer enforcement and Next origin safeguards. |
| Audit/history/archive | Passing sanitizer/model/controller tests; TTL migration script | Ordinary incident delete route absent; user delete aliases archive. Exported unused deleteIncident remains legacy. Apply TTL migration only under separately authorized operations; no proof of deployed removal. |
| DB permissions | Compose source | Backend uses root MongoDB account; least privilege and restore drill required. |
| Backup/security monitoring | Scripts/logging/probes present | Restore, RPO/RTO, alerts, retention and security response are unverified/policy pending. |
| Credentials | Secret validation/server-only config/sanitization present | No full-history or deployed-bundle secret scan performed. Synthetic fixture credentials are not reproduced here. |

## 11 — Testing Results

All results below were produced during this audit. Initial `npm`/`npx` PowerShell entry points failed because script execution is disabled; reran using `.cmd` without changing host execution policy. No dependencies, application data, services or infrastructure were modified to force a pass. Test-created ignored logs/caches are not product changes.

| Test Area | Command / Method | Result | Evidence | Limitation |
| --- | --- | --- | --- | --- |
| T1 Backend unit/controller suite | In lunas_backend: `npm.cmd test -- --runInBand --coverage=false` | FAILED overall: 45 suites passed, 5 failed to load, 1 skipped; 370 tests passed, 39 skipped, 409 total | Jest exit 1, 36.013 s. Missing `nodemailer` in emailTemplates, emailDeliveryService, registrationMfaService, authController and server suites | Dependency is declared/locked; local install incomplete. Successful suites mostly mock persistence/services; no production proof or measured coverage run. |
| T1 real DB account integration | Existing authorizedAccounts.integration.test.js gated by ACCOUNT_TEST_MONGODB_URI | SKIPPED (part of T1) | 1 skipped suite; no isolated URI supplied | Suite uses a disposable test DB; never point at application/production data. Not executed here. |
| T2 Backend lint | In lunas_backend: `npm.cmd run lint` | PASSED, exit 0 | ESLint src/scripts completed without diagnostics | Static check only. |
| T3 Web lint/build | In lunas_web: `npm.cmd run lint`; `npm.cmd run build` | BLOCKED, exit 1 | `eslint` and `next` not recognized; expected local binaries absent | Web node_modules exists but is incomplete. No clean web build verified. |
| T4 Web type check | `npx.cmd --no-install tsc --noEmit --incremental false` | BLOCKED, exit 1 | Local TypeScript absent; npm attempted registry resolution and reported EACCES | No type-check result; do not install unrelated `tsc` package. Use project TypeScript after approved clean dependency setup. |
| T4 Web browser suite | Reviewed playwright.config.ts/tests/runner | NOT RUN | Existing runner builds/starts standalone web and uses local API fixtures | Missing web dependencies/browser verification. Fixtures would not prove live backend integration. |
| T5 Flutter tests/analyzer | `flutter.bat test`; `flutter.bat analyze`; retry via installed Dart + flutter_tools.snapshot with `--no-version-check test --no-pub` / `analyze --no-pub` | BLOCKED | Initial wrappers produced no test output and were interrupted. Direct tool reported cannot access C:/src/flutter/bin/cache/lockfile, exit 1 | SDK is outside writable workspace. No mobile test/analyzer/device result. Dart --version succeeded (3.13.2). |
| T6 AI lightweight checks | In lunas_ai: `python -m unittest test_privacy_scope` | PASSED: 5 tests, 0.180 s | unittest OK, exit 0 | AST-extracted handlers/config with mocks; no Flask server, detector or checkpoint inference. |
| T6 AI category/semantic checks | `python -m pytest -q test_category_models.py test_surface_drainage.py test_electrical_damage.py` | BLOCKED, exit 1 | Python reports No module named pytest | No current checkpoint correctness, accuracy, bias, licensing or Dagupan-field validation established. |
| T7 Compose/deployment | Read Dockerfiles, Compose, Terraform, deploy and backup/restore scripts; Get-Command docker | NOT RUN / BLOCKED runtime | Docker unavailable on PATH; no infrastructure actions performed | No container build, configured live services, deployment, backup or restore verification. |
| T8 Source/workflow negative review | Read route gates/scopes/models/client actions; inspect passing T1 conflict/scope/invalid-image/rework tests | PASSED for inspection; target E2E NOT RUN | Evidence registry E01–E13 | Source checks distinguish active vs retired paths; cannot prove real DB atomicity or full role journeys. |

Passing backend suites include incidentController/incidentValidation, workOrderController/Lifecycle/Workflow/Handoff/Reassignment, repairPersonnelManagement, jurisdictionService, workOrderService, locationIntegrityService, canonical barangays, upload/evidence/storage/AI, SLA calculations/monitoring, notifications, audit sanitization and support/appeal paths. Direct calls with mocked models to legacy City Engineer controllers can pass even though real authentication rejects that role. Do not treat such tests as an active integrated user journey.

Not run: revised complete lifecycle (missing stages), real browser/device-to-API chain, DB index/transaction/race enforcement, S3/legacy storage retrieval, email delivery, push receipts, live scheduler, authoritative jurisdiction, production availability/security scan. No screenshots, API captures or fabricated demonstration records were produced.

## 12 — Known Bugs and Integration Gaps

| ID | Current finding / reproduction method | Impact / affected components | Recommended action |
| --- | --- | --- | --- |
| BUG-01 | Base Compose sets PRIVACY_REDACTION_ENABLED=false and AI_SERVICE_ENABLED=false; evidenceService.redactEvidence throws when disabled (T1 tests fail-closed branch) | Normal new citizen/repair multipart evidence cannot use those defaults; source-confirmed configuration contradiction, live stack not run | Resolve excluded visual-redaction scope and implement a consistent tested evidence policy/configuration. |
| BUG-02 | Incident pre-validate calls countDocuments then count+1; reportNumber unique | Concurrent creation can conflict rather than yield a reliable reference; source risk, real DB race not run | Atomic sequence or collision-resistant reference, retry and concurrent insert tests. |
| BUG-03 | routeIncident creates WorkOrder and starts SLA immediately after manual route | Skips agency assessment/external readiness/work authorization; current code, not missing provider intake | Separate routing from authorized maintenance readiness; add conditional external path. |
| BUG-04 | assign records accepted and acceptedAt before worker action; active mobile detail has no decline action | Required worker accept/decline choice is not represented by the normal client path | Restore pending acceptance and reachable reasoned decline without losing work/history. |
| BUG-05 | assign guard rejects started/in_progress work; legacy pending handoffs can accept | Revised authorized in-progress reassignment unsupported; T1 explicitly tests rejection | Approve handoff policy, then preserve progress/evidence/deadline/history with version checks. |
| BUG-06 | reviewCompletedWork saves WorkOrder then Incident, availability, notification/audit separately | Crash/failure can leave divergent work/incident state or report error after commit; no real fault injection performed | Transaction/outbox/reconciliation and retry-safe side effects. Routing compensation alone is not full atomicity. |
| BUG-07 | Clarification/jurisdiction/analytics/final-review routes authorize retired city_engineer; canSignIn rejects it | No usable Secretary clarification, post-route correction or current analytics role path; direct-controller legacy tests can mislead | Migrate approved responsibilities without restoring obsolete city-wide authority. |
| BUG-08 | Citizen serializer has repair/status fields but omits routing and SLA; report model/client path does not establish their presentation | Citizen cannot see all required agency/SLA transparency in the current report detail | Add minimal authorized projections and active mobile rendering/tests. |
| BUG-09 | getReview sends global confirmedFindingsTotal to barangay-scoped reviewer | Cross-scope aggregate disclosure; organizational authorization unconfirmed | Scope/authorize global summary independently and test isolation. |
| BUG-10 | createIncident accepts HTTPS legacy evidence URLs without processing their remote bytes | Managed upload validation/hash/privacy/private-storage guarantees do not cover this input path; source observation, no live bypass exploit executed | Separate migration-only legacy reads from new submissions and test the authorized compatibility policy. |
| BUG-11 | Login CAPTCHA condition trusts optional request platform (authController.login, validation.loginValidation) | Direct callers can skip web CAPTCHA by changing/omitting platform; password/rate limits remain. Source finding, no live attempt | Enforce approved privileged/web challenge policy using a trusted server/account boundary; add direct-API negative tests. |
| ENV-01 | T1 missing nodemailer; T3/T4 missing web executables | Local server/auth tests and web validation blocked; package/lock declarations do exist | Reproduce with clean dependency install in an authorized build environment; distinguish install problems from business-code regressions. |
| ENV-02 | SDK lockfile access denied; Docker/pytest unavailable | Mobile, stack and broader AI checks blocked | Use writable/prepared SDK and test image; rerun before release claims. |

Previously reported issues rechecked: provider intake/create-action UI now exists; Compose BFF uses backend:5000 and supplies required session secret; canonical barangays are validated; repair notification routes exist; nearby incidents use official safe serialization; Compose now enables SLA automation and includes WebP; terminal SLA fields are normalized. **Do not repeat these as unresolved historical defects.** New in-progress reassignment is currently deliberately refused; legacy handoff recovery does not mean the target requirement is complete. Actual current live integration remains unverified.

## 13 — Development Roadmap

Tasks are pending recommendations, not changes implemented by this audit. Acceptance requires evidence at the affected boundary and README updates.

| Task ID | Priority | Required change | Affected components | Dependencies | Expected outcome | Acceptance criteria | Current status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEV-01 | P0 | Reproduce clean dependency/toolchain checks and baseline current lifecycle | Backend/web/mobile/AI/test environment | Prepared writable SDK, local isolated services | Trustworthy build/test baseline | npm ci succeeds from locks; lint/type/build/tests run; skipped/failed checks reported; no real user data | Pending; environment blocked |
| DEV-02 | P0 | Reconcile mandatory redaction with excluded scope and base Compose defaults | Evidence/AI/Compose/mobile submission | Approved evidence privacy scope | Safe available uploads with consistent policy | Multipart citizen/repair success and service-outage/disabled-mode tests; no unapproved raw-image publication | BLOCKED / POLICY PENDING |
| DEV-03 | P0 | Fix reference race and cross-document/side-effect recovery | Incident/WorkOrder/Notification/Audit/storage | Isolated MongoDB, transaction/outbox design | Stable references and retry-safe durable lifecycle | Concurrent submissions unique; injected crash/retry cannot strand or double-close orders; audit/notification retry evidence | Pending |
| DEV-04 | P0 | Restrict DB principal, CAPTCHA bypass and cross-scope findings aggregate | Compose/DB/RBAC/review API | Aggregate visibility authorization, DB migration plan | Least-privilege persistence and scoped disclosure | Application user lacks admin privileges; omitted/spoofed-platform challenge tests; cross-barangay/global-count negative tests; restore verified | Pending; aggregate policy pending |
| DEV-05 | P1 | Implement Tanod role/tasks/mobile and separate Secretary review/category/clarification | All clients/API/models/account provisioning | Formal Tanod/Secretary authority | Required field-verification gate | Assigned Tanod alone submits findings; submission never approves; Secretary approves/rejects/clarifies/corrects category; cross-scope/stale actions denied | MISSING |
| DEV-06 | P1 | Generalize provider to Agency Officer with stable organization compatibility | Web/API/users/work orders/data | Verified agency participants and scope | Reused organization-isolated agency workspace | Existing City Engineering/water/electricity records stay accessible only to correct org; migration preserves IDs/history; no per-agency role duplication | NEEDS REVISION |
| DEV-07 | P1 | Automatic routing and ambiguity/transfer review | Secretary/agency/API/rules/history | DEV-05/06, ownership/jurisdiction data | Direct correct agency intake | Only approved findings-reviewed reports route; unknown/conflicting ownership queues for review; no premature/duplicate route; concurrent approval tests | MISSING |
| DEV-08 | P1 | Agency acknowledgment/assessment, conditional external statuses and readiness/work-order authorization | Agency web/API/models | DEV-06/07; authorized work policy | No premature maintenance | Funding/bidding/authorization progress recorded with actor/time/reason/reference; routine work skips external path; creation blocked until authorized | MISSING |
| DEV-09 | P1 | Apply approved priority/SLA/closure authority and external timing | Agency/Secretary/SLA/review | Institutional decisions, DEV-08 | Explicit auditable ownership and terminal outcome | Tests for start/reassignment/corrective/external/closure; preserve old deadlines; no AI or Admin auto-approval | BLOCKED / POLICY PENDING |
| DEV-10 | P1 | Worker accept/decline and safe in-progress reassignment | Repair mobile/provider/API | Handoff policy; DEV-03 | Worker choice and continuity | Pending assignment has explicit accept/decline; authorized replacement retains evidence/progress/deadline; previous assignee loses access; stale action conflicts | PARTIALLY IMPLEMENTED |
| DEV-11 | P2 | Stage-aware transparency and notification delivery | All clients/serializers/notification service | DEV-05–10, visibility/channel policy | Scoped citizen/official status throughout | Agency/field/external/SLA summaries visible to allowed roles; private notes withheld; read state and deep links tested; push enrollment/receipt verified | PARTIALLY IMPLEMENTED |
| DEV-12 | P2 | Operational report filters and printable PDF | Web/API/reporting | Scope/privacy rules, agency data | Daily/weekly/monthly and domain reports | Scoped category/barangay/agency/maintenance/SLA outputs; PDF has actor/time/filter provenance; unauthorized export denied | MISSING |
| DEV-13 | P2 | Release operations, backup drill, integration readiness/alerting and CI | Infra/deploy/monitoring/test automation | DEV-01–04; RPO/RTO/release decision | Reproducible monitored deployment | Clean image builds; isolated restore succeeds; storage/email/privacy health known; HTTPS/CORS/indexes checked; pipeline retains test results | PARTIALLY IMPLEMENTED |
| DEV-14 | P3 | Migrate/retire unreachable city-role routes and reconcile old scope docs | Models/routes/tests/documentation | Reviewed legacy data and DEV-06/09 | Clear current contracts without data loss | Compatibility migration documented; no orphan historical actor/status; obsolete tests replaced with active route journeys | NEEDS REVISION |

## 14 — Pending Policy and Institutional Decisions

1. Which Secretary/designated official may approve reports, and what formally authorizes Tanod field verification, assignment and access to citizen evidence?
2. Which agencies formally participate, who owns each asset, and what authoritative city/national/provider/barangay jurisdiction data governs routing and disputes? DPWH participation is not assumed.
3. Who assigns final priority? Current code grants it to Barangay Official; do not transfer that authority automatically to every agency.
4. What starts SLA: submission, barangay approval, agency acknowledgment, assessment, authorization or current routing event? Are 48/72/168/336 continuous hours approved targets or proposals?
5. Does funding/bidding/external authorization pause SLA, continue it, or use a separate transparency clock? Who approves extensions/escalation and records reasons?
6. Who approves repair completion and official closure? Current provider review closes directly; historical City Engineer gate is retired.
7. Which external statuses/references are public, who confirms work authorization, and what distinguishes routine maintenance from externally processed work? Procurement remains external.
8. Which reassignment/handoff rules apply after work starts, including worker acceptance, evidence continuity and accountability?
9. How should excluded face/plate masking be reconciled with current mandatory visual redaction? What consent/retention/access/legacy evidence/legal-hold rules apply? This audit makes no legal-compliance claim.
10. Is the three-confirmed-findings reporting restriction authorized? Who may see cross-barangay totals, hear appeals/correct findings and restore reporting? Do not infer this from old “no automatic punishment” prose.
11. What notification channels, operational export audiences, backup RPO/RTO, audit retention and release evidence are mandatory? Synthetic fixtures establish no official adoption or policy.

## 15 — Development Setup

Use Node 22 as in Docker, npm with lockfiles, a local MongoDB `lunas_db`, compatible Flutter/Dart and Python runtime dependencies. Avoid real credentials in documentation, source and screenshots. Read [backend setup](lunas_backend/README.md), [web setup](lunas_web/README.md), [mobile setup](lunas_mobile/README.md), [AI setup](lunas_ai/README.md), [account provisioning](ACCOUNT_PROVISIONING.md), [Docker setup](DOCKER_SETUP.md), [deployment guide](DEPLOYMENT_GUIDE.md), [AWS runbook](infra/aws/README.md) and [Netlify/AWS guide](NETLIFY_AWS_DEPLOYMENT.md); reconcile their older workflow/storage/map/privacy claims against this audit.

### Individual services

1. Start an isolated local MongoDB database named `lunas_db`.
2. In `lunas_backend/`, run `npm ci`; copy `.env.example` to `.env`; configure the local MongoDB URI and unique distinct access/refresh JWT secrets, then `npm run dev`. API: `http://localhost:5000/api/v1`; liveness `/health`, database readiness `/health/ready`.
3. In `lunas_web/`, run `npm ci`; copy `.env.example` to `.env.local`; configure server-only `LUNAS_API_URL=http://localhost:5000/api/v1` and a unique high-entropy `LUNAS_SESSION_SECRET` (at least 32 characters); run `npm run dev` and open port 3000. Browser NEXT_PUBLIC values are separate build-time configuration. Production requires valid Turnstile and exact origins.
4. In `lunas_mobile/`, run `flutter pub get`, then `flutter run --dart-define=LUNAS_API_BASE_URL=http://10.0.2.2:5000/api/v1` for Android emulator development, or a reachable LAN/HTTPS API for a device. Production requires HTTPS; do not add a production cleartext exception. Active maps use OpenStreetMap and device geocoding, not a Google Maps key.
5. For AI, use the component's Python environment and requirements (`requirements.runtime.txt` for inference/container; full requirements for development). Run its documented service on port 5001 with checkpoint/configuration requirements satisfied. The CPU Docker image uses Gunicorn. Hazard inference is advisory; current evidence uploads still require available privacy detection regardless of advisory classification settings.

Private S3 evidence storage (or local S3-compatible RustFS), registration/activation/recovery email, GPS/maps, optional OneSignal push and AI have separate configuration. Supabase credentials are migration-only. Configure EMAIL_PROVIDER and approved delivery settings; never print keys. Do not claim upload availability by turning PRIVACY_REDACTION_ENABLED off: **current code rejects that mode**. Resolve BUG-01 and the scope decision before treating the base production stack as a working submission configuration.

### Docker Compose

For the existing local stack use `./scripts/local-up.sh -d` (shell) or the supplied `scripts/local-up.ps1` from an appropriate PowerShell environment. It prepares `.env.local` and combines `docker-compose.yml` with `docker-compose.local.yml`: MongoDB, private S3-compatible object store, backend, web and AI. See Docker guide for LAN/device and signed-object host settings. Web BFF must use `http://backend:5000/api/v1` inside Docker; device API and evidence URLs must use reachable host addresses. The historical service name `minio` now runs RustFS; bucket defaults to `lunas-local-evidence`. Local override enables AI/privacy and development CAPTCHA bypass. These are source instructions, not a successful stack run in this audit.

AWS-connected deployment uses root `.env.example` → `.env`, production S3/region/instance-role settings and base Compose without local storage override. Do not put permanent AWS keys in the repository. Review secret, HTTPS/CORS, DB least privilege, privacy and SLA settings before release. AWS Terraform is a scaffold gated by enable flags; no apply/deploy was run. Backups/restores require a separately authorized isolated target and a restore drill.

### Local Dagupan fixtures (optional, isolated data only)

The fixture design has 42 synthetic local accounts: 31 barangay officials, four organization providers and four matching repair accounts, plus Admin, City Engineering provider and citizen. [Local account directory](LOCAL_DAGUPAN_ACCOUNTS.md) contains controlled test identifiers; passwords are not repeated here. These are not official government or provider accounts. No seed command was executed by this audit.

```powershell
docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.local.yml exec -e ALLOW_DEMO_SEED=true -e DEMO_SEED_DOCKER=true backend npm run seed:dagupan
docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.local.yml exec -e ALLOW_DEMO_SEED=true -e DEMO_SEED_DOCKER=true backend npm run seed:web
```

`seed:dagupan` creates 31 submitted synthetic reports, one per canonical barangay, covering five mobile categories; coordinates are placeholders, not verified boundaries. Ordinary reruns preserve existing accounts/fixtures. `seed:web` creates 24 workflow snapshots and 10 linked orders; these are illustrative states, not actual approvals or evidence of workflow correctness. The seed scripts reject external Mongo hosts and non-local `lunas_db` use; Docker additionally requires the explicit seed flag.

Preserve the existing reset procedure for authorized disposable fixtures: backup first; `npm run seed:dagupan -- --replace` changes local fixture credentials/metadata, revokes their refresh tokens and replaces only marked `DEMO-QA-*`, `MOCK-WEB-*`, `DAGUPAN-LOCAL-*` fixtures and linked records, retaining non-fixture data and historical bucket objects. `npm run seed:web -- --refresh` refreshes web fixtures only. **These mutate data and are not audit verification commands.** Do not run against real records. City Engineering account conversion, account-retention and storage migrations likewise require separately reviewed backups/data authorization.

### Verification commands

Run each block from its component directory. In restricted Windows PowerShell use `npm.cmd`/`npx.cmd`; do not weaken host execution policy merely to run npm.

```text
# lunas_backend
npm ci
npm test -- --runInBand
npm run lint

# lunas_web
npm ci
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e

# lunas_mobile (writable Flutter SDK required)
flutter pub get
flutter analyze
flutter test

# lunas_ai (prepared test environment)
python -m unittest test_privacy_scope
python -m pytest -q test_category_models.py test_surface_drainage.py test_electrical_damage.py
```

Live SLA verification (`npm run test:sla:live`) and real DB account tests require their documented isolated test environment and must never be pointed at application data. Playwright builds/starts the standalone web server via `prepare-standalone.mjs`/`run-playwright.mjs`; its local API fixtures do not certify a real backend. Full acceptance additionally needs isolated multi-role mobile/browser/API/MongoDB/S3/evidence/delivery testing, including negative permissions, stale actions, rejection, clarification, incorrect routing, reassignment and correction.

## 16 — Next Developer / Codex Handoff

The verified state is **45 passing backend suites / 370 passing tests**, backend lint and five lightweight AI handler checks; the overall Jest command failed due to five missing-dependency suite loads and skipped real DB coverage. No full client or deployed workflow is certified. Major existing components to reuse are citizen reporting/auth, canonical locations, scoped review/provider/repair/account APIs, private evidence normalization/storage, correction/history, SLA monitoring logic and in-app notifications. New Tanod/agency assessment/routing/external authorization/reporting stages remain required.

Start with `incidentController.routeIncident/updateIncidentPriority/serializeIncidentForCitizen`, `workOrderController.assign/reviewCompletedWork`, `jurisdictionService`, `workOrderService`, `accountPolicy`, Incident/WorkOrder/User models, `evidenceService.redactEvidence`, Compose, web validation/work-order actions and the mobile role/router/repair detail. Evidence registry links identify these files. Current blockers are the upload-default contradiction and new legacy-URL evidence bypass, incomplete dependency/toolchains and pending institutional authority. Additional risks are count-based incident references, cross-document partial commits, DB root use and global findings aggregates.

Complete DEV-01–04 first; obtain policy decisions without inventing authority. Tanod/Secretary gate (DEV-05) and stable agency model (DEV-06) precede automatic routing (DEV-07); routing/agency assessment precedes conditional external readiness (DEV-08); approved timing/closure rules govern DEV-09. Preserve existing repair/history and scope behavior while adding worker choice/handoffs. Then complete transparency/notifications/PDF and release checks. The five immediate recommendations are DEV-01, DEV-02, DEV-03/04 integrity/security, DEV-05, and DEV-06/07 agency routing; policy dependencies may proceed in parallel with environment preparation.

Use section 15 commands and section 11 limitations to verify changes. Never rebuild provider intake or repair notifications merely because an old audit called them absent. Do not restore the obsolete “all incidents must pass through City Engineer” chain, Supabase-new-write architecture, Google-map requirement, auto-accepted worker assumption or automatic provider closure authority as approved scope. Existing legacy controller unit tests are not proof that retired-role endpoints are reachable.

For every future feature change, update the corresponding exact status and implementation paths, affected workflow/permissions, reproducible test command/results and limitations, known defects/blockers and roadmap priorities. Record useful historical context without treating old reports as current proof. Do not mark complete from a UI, model, endpoint or passing isolated unit test alone; do not infer production verification. Re-read code before relying on this README. Keep unresolved Secretary/Tanod mandate, agency jurisdictions, priority/SLA/external timing, closure and evidence/privacy/restriction decisions explicit until authorized.
