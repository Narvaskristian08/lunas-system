# LUNAS Revision 6 — SLA monitoring validation

Validated October 2, 2026. The six roles, City priority authority, incident
transition graph, geographic checks, privacy behavior, and Revision 5 security
configuration are preserved.

## Verified findings before implementation

- The original disabled-by-default finding was accurate: the runtime required
  `SLA_AUTOMATION_ENABLED === 'true'`, the backend example explicitly set false,
  and Compose did not pass the flag. No deployed environment was inspected.
- Deadlines already started at City prioritization, using Critical 48, High 72,
  Medium 168, and Low 336 elapsed hours. Submission and Barangay validation did
  not start SLA. Work-order creation copied the incident deadline; reassignment,
  repair completion, Provider review, and corrective work did not reset it.
- Two separate cron jobs checked overdue status hourly and reminders every
  thirty minutes. Repeated startup calls could register additional jobs.
- Incident reminders used a count for the 24/12/6/2-hour thresholds, without a
  per-recipient concurrency guarantee. Incident overdue state was saved before
  notification delivery; notification failures could leave an overdue incident
  ineligible for further delivery attempts. Work-order delivery markers were
  also saved before delivery, leaving a similar failure/crash gap.
- Incident overdue marking did not update `sla.state`. Incident SLA APIs and
  dashboard counts used persisted flags, while work-order responses calculated
  deadlines live. Incident and work-order schema status enums also differed.
- City final approval always marked work-order SLA `met`, regardless of the
  deadline, and did not normalize incident SLA. Work-order serializers and the
  SLA endpoint additionally forced verified work to `met`.
- `SLAConfig` exists as a model but has no runtime consumer or seeded escalation
  schedule in this repository. Existing code establishes initial overdue
  escalation and City Engineer recipients at level 2, but supplies no promotion
  trigger or interval for level 2. No new interval or recipient was introduced.

## Implemented behavior

Compose and the root/backend environment examples enable the scheduler.
An absent runtime flag still disables it; existing private `.env` files were
not changed. `SLA_POLL_INTERVAL_MINUTES=5` runs one combined check at startup
and at five-minute cron boundaries. The setting accepts integers 1-59; use a
divisor of 60 for uniform spacing. Invalid enabled-scheduler configuration fails
before server startup.

Repeated starts reuse one task, and overlapping callbacks in one process are
skipped. Database errors are caught per monitoring branch and delivery failures
per record. Subsequent callbacks keep running. Deployments should designate one
enabled API process; there is no distributed lease.

Incident reminders retain 24, 12, 6, and 2 hours. A poll can catch up multiple
thresholds. Each threshold has an explicit acknowledgment; old reminder counters
are carried forward. Work orders retain a 24-hour approaching warning and one
overdue warning. The shared approaching threshold calculation is used by API
filters, summaries, projections, and monitoring. At the exact deadline the
record remains approaching; it becomes overdue after the deadline passes,
preserving the original boundary behavior.

Initial overdue escalation remains level 1. Assigned incidents notify the
selected Utility Provider; unrouted prioritized incidents notify active,
nonarchived City Engineers. The existing Barangay fallback is retained for
submitted/clarification records with historical SLA data. Existing escalation
levels of 2 or more also include active City Engineers. Work-order recipients
remain the current assignee and unique assigning/creating officials.

Every SLA notification has a key containing the record, original deadline,
threshold/type/stage, and recipient. A MongoDB partial unique index enforces
idempotency across jobs and replicas. Backend startup explicitly creates the
index when scheduling is enabled, including deployments with `autoIndex=false`.
Duplicate insertion returns the existing notification and does not repeat push
delivery. Delivery acknowledgment follows successful in-app persistence;
failures and crashes before acknowledgment can retry without duplicating
already persisted notifications. Optional OneSignal delivery remains best effort.

Repair completion and Provider acceptance keep SLA running, including throughout
Provider review, City verification, and corrective work. API projections and
dashboard overdue counts use current deadlines instead of waiting for the next
poll. Notification reminders now say “within” their threshold rather than
claiming an exact number of remaining hours.

Rejection and duplicate decisions persist `cancelled` with `isOverdue=false`.
City closure uses the same closure timestamp on both records and records `met`
when closure is at or before the deadline, or `breached` when it is later.
Terminal SLA has no current approaching/overdue flag or running countdown.
Deadlines, start times, repair completion/readiness timestamps, review history,
and actual completion fields are preserved. The scheduler also reconciles
historical terminal incident/work-order SLA fields using recorded closure,
verification, or terminal history timestamps.

## Exact changed files

| File | Change |
| --- | --- |
| `.env.example` | Compose scheduler enablement and polling example. |
| `docker-compose.yml` | Pass enabled scheduler, polling setting, and existing warning threshold. |
| `DEPLOYMENT_GUIDE.md` | Deployment flags, replica ownership, index guarantee, behavior, live-check instructions. |
| `REVISION_6_SLA_REPORT.md` | This audit and validation report. |
| `lunas_backend/.env.example` | Enabled monitoring and documented polling/replica behavior. |
| `lunas_backend/package.json` | Add `test:sla:live`. |
| `lunas_backend/src/server.js` | Validate interval and create required notification index before enabled monitoring. |
| `lunas_backend/src/services/slaService.js` | Combined resilient scheduler, threshold acknowledgments, retryable delivery, idempotency keys, terminal reconciliation. |
| `lunas_backend/src/services/workOrderService.js` | Shared warning threshold, terminal projections, deadline-based closure fields. |
| `lunas_backend/src/services/notificationService.js` | Duplicate-key delivery handling and accurate reminder wording. |
| `lunas_backend/src/models/Incident.js` | Consistent SLA states, acknowledgment/closure fields, shared status calculation. |
| `lunas_backend/src/models/WorkOrder.js` | Historical breach/cancellation states and closure timestamp. |
| `lunas_backend/src/models/Notification.js` | Optional idempotency key and partial unique index. |
| `lunas_backend/src/controllers/incidentController.js` | Live SLA projections and cancellation on rejection/duplicate. |
| `lunas_backend/src/controllers/workOrderController.js` | Consistent filters/projections and closure SLA on both records. |
| `lunas_backend/src/controllers/statsController.js` | Deadline-based scoped overdue count excluding terminal incidents. |
| `lunas_backend/src/services/slaService.test.js` | All priority deadlines and start timestamps. |
| `lunas_backend/src/services/slaWorkOrder.test.js` | Delivery acknowledgment and concurrent-run behavior. |
| `lunas_backend/src/services/slaMonitoring.test.js` | Controlled-clock threshold, escalation, retry, scheduler, migration, and terminal tests. |
| `lunas_backend/src/services/notificationService.test.js` | Duplicate notification and persistence failure behavior. |
| `lunas_backend/src/controllers/incidentController.test.js` | Actual City prioritization handler for all priorities; live incident SLA API. |
| `lunas_backend/src/controllers/incidentValidation.test.js` | Successful rejection/duplicate cancellation. |
| `lunas_backend/src/controllers/workOrderHandoff.test.js` | Deadline preservation, Provider versus City completion, timely/late closure, terminal API output. |
| `lunas_backend/src/controllers/statsController.test.js` | Current-clock overdue calculation with Citizen scope. |
| `lunas_backend/scripts/verify-sla-scheduler.js` | Real-clock MongoDB integration verification using a disposable database. |

## Validation results

| Check | Result |
| --- | --- |
| Backend `npm test -- --runInBand --silent` | 35 suites passed; 189 tests passed; 1 suite / 32 tests skipped. |
| Backend `npm run lint` | Passed, including the live verification script. |
| Web `npm run lint` | Passed. |
| Web `npm run test:e2e` | Production Next.js build and TypeScript passed; browser tests: 3 passed, 3 skipped. |
| Backend `npm run test:sla:live` | Passed against local MongoDB with the real clock and actual recurring node-cron callback. |
| `git diff --check` | Passed. |

The real scheduled integration check passed twice. Its initial synchronous check
was deliberately disabled, so warnings and escalation had to be created by a
recurring cron callback. It verified overdue incidents in City verification,
overdue Provider-accepted work, a pre-deadline incident warning, real unique-index
enforcement, parallel retries after acknowledgment removal, recovery from a
forced MongoDB notification validation failure, and terminal normalization that
preserved the original deadline and actual repair completion time. The script
removed its own generated database after verification.

Existing backend tests for authorization, provisioning, reassignment, incident
review, evidence, privacy, jurisdiction, and other prior-revision behavior passed.
This is automated regression evidence, not an assertion that every Revision 1-5
feature received live end-to-end verification.

## Remaining limits

- Live scheduled execution was verified locally, not in a deployed Compose
  environment. Docker is unavailable on this host, so container production
  builds and Compose runtime verification could not run. The JavaScript backend
  has no separate application build script; the web production build passed.
- The pre-existing skipped backend suite and authorized-account browser cases
  remain skipped; those fixtures/integration environments were not supplied.
- OneSignal push delivery was intentionally disabled in the live test. In-app
  persistence is verified; external push delivery is not.
- No second-stage timing policy exists in the repository. Initial escalation is
  operational; automatic promotion beyond it requires an approved trigger.
- Historical closed records lacking all closure/verification/history timestamps
  cannot be reliably classified as timely or breached. Their terminal workflow
  status excludes them from monitoring/counts; reconciliation does not fabricate
  a closure time.
- Historical overdue incidents had no durable notification acknowledgment.
  Their overdue alert may be retried once during rollout to recover previously
  lost delivery; the new key prevents further duplication. Historical reminder
  counters and work-order warning markers are preserved.
