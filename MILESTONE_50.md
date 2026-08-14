# LUNAS 50% Milestone: Official Validation and Incident Routing

This document describes the implemented 50% milestone. It extends the citizen
reporting foundation documented in [MILESTONE_25.md](./MILESTONE_25.md).
The repository still contains pre-existing future-work models and endpoints;
they are outside this milestone's verified workflow and are not a claim that
repair operations are accepted or ready for production.

## Supported workflow

```text
submitted
├── validated  (priority + jurisdiction + accountable organization + SLA start)
├── rejected   (required citizen-visible reason)
└── duplicate  (required reason + canonical incident)
```

Only one of these decisions can be made. The backend performs a conditional
`submitted`-state update, so a stale competing decision receives HTTP `409`
instead of overwriting the earlier official decision. Routing identifies the
organization accountable for later action; it does not create a work order or
assign repair personnel. The pre-existing work-order creation endpoint also
now refuses a `submitted` incident, so it cannot bypass the validation gate.

## What is implemented

- A server-scoped pending-validation queue, pagination, search, category,
  barangay, date, duplicate-candidate, and safe sorting filters.
- Official report review with processed/signed evidence URLs, location,
  timeline, advisory duplicate candidates, current routing, and SLA data.
- Validate, reject, and mark-duplicate actions with request validation,
  controlled status changes, status-history entries, audit events, and
  persisted in-app notifications.
- Priority, jurisdiction, and accountable-organization routing persistence.
  Route history is appended rather than destructively overwritten.
- Central SLA initialization when an incident is validated or its priority is
  changed. Defaults are configurable through `SLA_CRITICAL`, `SLA_HIGH`,
  `SLA_MEDIUM`, and `SLA_LOW` (hours). Critical defaults to 48 hours, the
  configurable end of the proposal's 24–48 hour range.
- Protected mobile and web official validation workspaces backed by the same
  API; neither relies on production mock data.

## Authorization and jurisdiction rules

The API is the authorization source of truth. Every read and mutation combines
the requested incident filter with the caller's server-side scope.

| Account role | 50% access |
| --- | --- |
| Citizen | Own reports, history, permitted rejection/duplicate reason; never official actions. |
| Barangay official | Only reports in the assigned barangay; may confirm that barangay and retain its barangay route. |
| City engineer | City-wide validation, jurisdiction confirmation, and routing. |
| Administrator | City-wide validation, jurisdiction confirmation, and routing. |
| Utility provider | Only incidents already routed to its configured organization through the general incident scope; provider repair workflow is later work. |

No Dagupan boundary dataset is fabricated. Jurisdiction is a manual,
auditable confirmation using the report's barangay/address as the default.

## API contract

All endpoints are under `/api/v1` and require an access token unless noted.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/incidents/pending-validation` | Submitted reports in the current official's scope. |
| GET | `/incidents/:id` | Scoped review detail. |
| GET | `/incidents/:id/history` | Scoped status history. |
| GET | `/incidents/:id/duplicate-candidates` | Scoped advisory candidates. |
| GET | `/incidents/:id/sla` | Scoped SLA foundation. |
| POST | `/incidents/:id/validate` | Validate with a required priority; it always persists jurisdiction and routing, using safe defaults only when both optional payload objects are omitted. |
| POST | `/incidents/:id/reject` | Reject with required reason and optional internal notes. |
| POST | `/incidents/:id/mark-duplicate` | Mark duplicate with canonical incident and required reason. |
| PATCH | `/incidents/:id/priority` | Change priority of a validated incident. |
| PATCH | `/incidents/:id/jurisdiction` | Correct jurisdiction of a validated incident. |
| POST | `/incidents/:id/route` | Route a validated incident to an accountable organization. |
| GET | `/stats/validation-summary` | Scoped pending/validated/rejected/duplicate counts. |

The queue accepts `page`, `limit`, `search`, `category`, `barangay`,
`hasDuplicateCandidate`, `sortBy`, `from`, and `to`. The full request and
response examples are in [lunas_backend/API_ENDPOINTS.md](./lunas_backend/API_ENDPOINTS.md).

## Notifications and audit behaviour

The system persists an in-app notification for the reporting citizen when an
incident is validated, rejected, or marked duplicate. It persists a routing
notification for eligible members of the responsible organization. If OneSignal
credentials are configured, the existing provider attempts push delivery; the
database notification remains the durable application record and no push
delivery is claimed without a provider configuration.

Validation, rejection, duplicate, priority, jurisdiction, and routing actions
write an immutable audit record. The incident status history also records the
actor role, timestamp, and safe action metadata.

## Citizen-visible outcome

Citizen report/detail responses now carry real `validated`, `rejected`, and
`duplicate` statuses and server-authored timeline entries. A citizen can see
the permitted rejection or duplicate reason, but never a canonical report's
reporter identity, private evidence key, internal notes, or other account data.

## External dependencies and deliberately honest limits

- MongoDB is required for end-to-end persistence and live concurrency testing.
- Supabase Storage (or the configured storage provider) is required for real
  private evidence upload and signed evidence URLs.
- A Maps key can improve map rendering, but no fake map or geographic boundary
  data is used when it is unavailable.
- OneSignal credentials are optional; persisted in-app notifications work
  independently of push delivery.
- There is no authoritative organization registry in this repository. City
  engineers and administrators can manually confirm a responsible organization;
  provider notifications are delivered only to active user accounts whose
  configured `utilityCompany` exactly matches that route.
- No approved AI hazard or face/plate-redaction model is bundled, so LUNAS does
  not claim automatic classification or redaction.
- `SLA_AUTOMATION_ENABLED` defaults to `false`: it is an explicit opt-in for
  the pre-existing reminder/escalation scheduler, which is not part of this
  milestone's SLA foundation.

## Deferred to 75% and 100%

This milestone did not extend or verify work-order creation, repair-personnel
assignment, accept/decline, repair progress and percentage tracking, repair
evidence, completion submission, repair verification, closure, escalation
automation, or full analytics. Pre-existing future-work endpoint/controller
code remains in the repository for later milestones, but is not part of the
50% acceptance workflow.

## Local verification

```bash
cd lunas_backend
npm test -- --runInBand
npm run lint

cd ../lunas_web
npm run lint
npm run build

cd ../lunas_mobile
flutter pub get
flutter analyze
flutter test
```

Use the backend `.env.example` as the configuration template. Mobile receives
its API URL with `--dart-define=LUNAS_API_BASE_URL=…`; web requires
server-only `LUNAS_API_URL` and a high-entropy `LUNAS_SESSION_SECRET`.

## Verification status at handoff

Backend unit/service coverage passes with the controlled-transition,
authorization, jurisdiction, routing, SLA, and submitted-work-order-gate
tests. Web lint and production build pass. The Flutter/Dart SDK is not present
in this workspace, so mobile dependency resolution, analysis, and tests still
need to run in a Flutter-enabled environment. A full cross-account acceptance
scenario also needs a configured MongoDB instance and private evidence-storage
credentials; it was not simulated with fabricated production data.
