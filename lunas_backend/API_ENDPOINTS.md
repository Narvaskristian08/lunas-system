> Step 14 compatibility notice (2026-10-20): the tables below describe the historical API and are not authority to enable a workflow. Use the [current registered route inventory](../qa_outputs/legacy_compatibility_20261020/route_inventory.md) and [current root handoff](../README.md) for exact registration, consumers, roles, scopes and policy blocks. The retired `city_engineer` role cannot authenticate. Legacy validate/priority/manual-route, new work-order creation and final closure refuse requests; provider acceptance cannot close an incident. Current approval requires assigned Tanod initial findings followed by an independent Secretary decision. New maintenance authorization, SLA-start/amendment and export audiences remain policy pending. No endpoint or historical record was deleted. The old Tanod migration now refuses before environment/database access.

# LUNAS API v1 Route Catalog

Base URL: `http://localhost:5000/api/v1`. Routes marked authenticated require
an active access token. Role and record scope are enforced by the API. The
[project scope](../LUNAS_PROJECT_SCOPE.md) is authoritative for business
semantics; validation middleware defines the exact request constraints.

## Authentication — `/auth`

| Method | Path | Access / purpose |
| --- | --- | --- |
| POST | `/register` | Public Citizen registration only. |
| POST | `/register/verify` | Public registration verification. |
| POST | `/register/resend` | Public registration verification resend. |
| POST | `/activate-account` | Public one-time activation for an Admin-provisioned account. |
| POST | `/login`, `/refresh`, `/logout` | Login, refresh, and authenticated session revocation. |
| POST | `/forgot-password`, `/reset-password` | Password recovery. |
| GET | `/me` | Authenticated current profile. |
| PUT / PATCH | `/profile` | Authenticated self-profile fields only. |
| PUT | `/change-password` | Authenticated password change. |

## Incident reports — `/incidents`

| Method | Path | Access / purpose |
| --- | --- | --- |
| GET | `/` | Authenticated; results use role/ownership scope. |
| POST | `/` | Citizen; submit report, location, and evidence. Initial state is `submitted`. |
| GET | `/my` | Citizen; own reports only. |
| GET | `/pending-validation` | Barangay Official's `submitted` queue or City Engineer's `barangay_validated` queue. |
| GET | `/nearby` | City Engineer, Utility Provider, or Repair Personnel; scoped report lookup. |
| GET | `/:id` | Authenticated, record-scoped report detail. |
| GET | `/:id/history`, `/:id/sla` | Authenticated, record-scoped history/SLA data. |
| GET | `/:id/duplicate-candidates` | Official review roles; advisory candidate records only. |
| PUT | `/:id` | Barangay Official, City Engineer, or Utility Provider; permitted non-workflow notes/fields only. Direct state and priority edits are rejected. |
| POST | `/:id/validate` | Barangay Official; initial validation and handoff to City Engineering. |
| POST | `/:id/reject` | Barangay Official; required Citizen-visible reason. |
| POST | `/:id/mark-duplicate` | Barangay Official; required reason and canonical incident. Human decision only. |
| POST | `/:id/confirm` | City Engineer; confirms a Barangay-validated report. |
| POST | `/:id/clarification` | City Engineer; returns a Barangay-validated report with reason. |
| PATCH | `/:id/priority` | City Engineer; manual priority and configured SLA deadline. |
| PATCH | `/:id/jurisdiction` | City Engineer; controlled jurisdiction confirmation/correction. |
| POST | `/:id/route` | City Engineer; routes a prioritized incident to an active Utility Provider organization. |
| POST | `/:id/work-orders` | Assigned Utility Provider; creates the primary work order after routing. |

## Work orders — `/work-orders`

| Method | Path | Access / purpose |
| --- | --- | --- |
| GET | `/` | City Engineer, Utility Provider, Repair Personnel; result scope follows role and assignment. |
| POST | `/` | Utility Provider; compatibility create route. Prefer the nested incident route above. |
| GET | `/my` | Repair Personnel; assigned work only. |
| GET | `/approaching-deadline`, `/overdue` | City Engineer, Utility Provider, Repair Personnel; scoped views. |
| GET | `/:id` | City Engineer, owning Utility Provider, or assigned Repair Personnel. |
| GET | `/:id/assignments`, `/:id/eligible-personnel` | Owning Utility Provider. |
| POST | `/:id/assign`, `/:id/reassign` | Owning Utility Provider; reassign requires a reason. |
| POST | `/:id/accept`, `/:id/decline`, `/:id/start` | Assigned Repair Personnel. Decline requires a reason. |
| POST | `/:id/progress` | Assigned Repair Personnel; progress update, optional evidence, and required final evidence at 100%. |
| POST | `/:id/evidence` | Assigned Repair Personnel; supporting evidence during active work. |
| GET | `/:id/progress`, `/:id/sla` | City Engineer, owning Utility Provider, or assigned Repair Personnel. |
| POST | `/:id/provider-review` | Owning Utility Provider; accepts completion or requests correction with reason/instructions. |
| POST | `/:id/coordinate-correction` | Owning Utility Provider; sends City-returned work into corrective repair. |
| POST | `/:id/final-review` | City Engineer; approves final verification or returns work with reason. |

## Authorized accounts and users — `/users`

| Method | Path | Access / purpose |
| --- | --- | --- |
| GET / POST | `/authorized` | Admin; list or provision an offline-approved authorized account. |
| GET / PUT | `/authorized/:id` | Admin; inspect/update permitted approved account fields. |
| PATCH | `/authorized/:id/status` | Admin; audited activation status lifecycle. |
| POST | `/authorized/:id/activation` | Admin; resend/rotate an activation link. |
| GET | `/repair-personnel` | Utility Provider; eligible/visible personnel in the provider scope. |
| GET | `/utility-providers` | City Engineer; active provider organizations available for routing. |
| GET / PATCH / PUT | `/me` | Authenticated self-profile only. |
| PATCH | `/:id/archive` | Admin; compatibility archival workflow, does not hard-delete. |
| PUT | `/:id` | Admin compatibility alias for the controlled account update. |
| DELETE | `/:id` | Admin compatibility alias for archival; does not delete the record. |

## Other authenticated resources

| Method | Path | Access / purpose |
| --- | --- | --- |
| GET | `/notifications` and `/notifications/:id` | Authenticated user's own notification records. |
| PUT | `/notifications/read-all`, `/notifications/:id/read` | Mark own notifications read. |
| DELETE | `/notifications/:id` | Delete own notification. |
| GET | `/stats/dashboard` | Barangay Official, City Engineer, Utility Provider, Repair Personnel; role-aware aggregates. |
| GET | `/stats/validation-summary` | Barangay Official or City Engineer; stage- and scope-aware summary. |
| GET | `/stats/analytics` | City Engineer. |
| GET | `/dashboard/work-orders-summary` | City Engineer, Utility Provider, Repair Personnel; scoped work-order summary. |
| GET | `/categories` | Public supported report categories. |
| GET | `/audit-logs` | Admin only. |

## Transition contract

Incident decisions are separate requests and cannot be skipped: Barangay
validation → City Engineering confirmation → manual priority/SLA → provider
routing → provider work order → Repair Personnel assignment/progress → provider
completion review → City Engineering final review. Rejection, duplicate,
clarification, provider correction, and City-returned correction are explicit
reasoned outcomes. A stale competing decision returns a conflict instead of
silently overwriting history.

The principal status distinctions are `repair_completed`, `provider_accepted`,
`verified`, `resolved`, and `closed`. Repair completion is not incident
resolution. Incident deletion and a generic status-transition endpoint are not
exposed.

SLA priority/deadline calculation is separate from any scheduled reminders or
escalations. Review `.env.example` and deployment configuration before claiming
that a background scheduler or optional integration is active.
