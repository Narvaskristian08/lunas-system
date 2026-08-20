# LUNAS 75% Milestone: Work Orders, Assignment, and Repair Progress

This document defines the implemented 75% maintenance-operation boundary. It
extends the citizen reporting and official validation/routing workflows in
[MILESTONE_25.md](./MILESTONE_25.md) and
[MILESTONE_50.md](./MILESTONE_50.md).

## Supported workflow

```text
validated + routed incident
  → unassigned work order (0%)
  → assigned / pending acceptance
  → accepted
  → in_progress
  → completed at 100% (ready for formal completion / verification)
```

Repair progress is **not** system-development progress. The only individual
repair values are 0, 25, 50, 75, and 100 percent:

| Progress | Server-controlled stage |
| --- | --- |
| 0% | assigned |
| 25% | site preparation |
| 50% | main repair |
| 75% | finishing |
| 100% | ready for completion |

At 100%, the work order is ready for the later formal completion and
verification process. The incident is not verified or closed.

## What is implemented

- One primary work order per validated, routed incident, created at 0% without
  conflating creation and staffing.
- Scoped official work-order monitoring, search, filters, pagination, detail,
  assignment history, SLA state, and secure field-evidence viewing.
- Repair-personnel eligibility based on active account, repair role,
  responsible organization, applicable barangay, and lightweight availability.
- Append-oriented assignment history, reassignment with required reason,
  acceptance, required-reason decline, and notifications.
- Controlled lifecycle transitions and optimistic version/state guards that
  return HTTP 409 for stale or conflicting assignment/progress actions.
- Explicit start work, discrete no-regression repair progress, notes, optional
  one-shot repair coordinates, and multipart JPG/PNG field evidence.
- Repair evidence is re-encoded, stripped of EXIF metadata, checksummed,
  stored privately under a work-order-specific key, and shown with signed URLs
  only to authorized users.
- Incident synchronization for citizen-visible assigned, in-progress, and
  100%-awaiting-verification states without exposing personnel contacts or
  internal reassignment/SLA notes.
- Backend SLA projection (deadline, remaining time, approaching, overdue) and
  scheduler-invokable, duplicate-safe work-order SLA notifications.

## Authorization

| Role | 75% access |
| --- | --- |
| Citizen | Safe high-level repair state/progress only on own reports. |
| Barangay official | Create/manage work orders only in configured barangay. |
| City engineer / administrator | City-wide work-order operations. |
| Utility provider | Only work orders routed to configured organization. |
| Repair personnel | Only own active/current assignments; accept, decline, start, progress, and upload evidence. |

The backend is the source of truth for role, ownership, organization, and
jurisdiction checks. UI visibility is never treated as authorization.

## SLA operation

SLA deadlines continue to originate from the centralized priority settings:
`SLA_CRITICAL`, `SLA_HIGH`, `SLA_MEDIUM`, and `SLA_LOW`. The warning
threshold is `SLA_APPROACHING_THRESHOLD_HOURS` (24 by default).

`runWorkOrderSlaCheck` can be invoked by a deployment scheduler. The existing
in-process cron monitor remains opt-in through `SLA_AUTOMATION_ENABLED=true`;
when disabled, no scheduled run is claimed. Each work order gets at most one
approaching-deadline and one overdue notification/event.

## Deferred to 100%

This milestone intentionally does not implement formal completion package
submission, before/after comparison, SSIM, AI repair recommendation, official
verification approval/rejection, additional-work requests, rework/reopen,
closure, or final resolution analytics.

The legacy `/work-orders/:id/complete` and `/work-orders/:id/verify`
endpoints are not registered in the 75% API.

## Verification

Run the available checks:

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

A live MongoDB and private storage configuration are still required to execute
the full cross-account acceptance flow and upload real field evidence.
