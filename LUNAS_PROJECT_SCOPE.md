# LUNAS Project Scope

**Current source of truth — updated 2026-09-29.** This document defines LUNAS's
six user-facing roles, platforms, authority boundaries, account governance,
incident and work-order lifecycles, handoffs, and user-facing workflow. It
supersedes earlier milestone, screen inventory, workflow, and role documents.
Implementations and future Codex sessions must follow this scope. Setup guides
may describe how to run a component, but must not redefine product authority.

## Product boundary

LUNAS manages the digital flow for reporting and repairing infrastructure
incidents. It does not verify government employment, approve budgets, conduct
procurement or bidding, select contractors, award contracts, or issue funds.
Government/organizational endorsement happens outside LUNAS; LUNAS records and
enforces the resulting authorized account, role, and scope.

## Roles, platform, and scope

There are exactly six user-facing roles:

| Role | Platform | Record scope and authority |
| --- | --- | --- |
| Citizen | Mobile | Self-registration; create reports; read only own reports and permitted status/reason details. No operational decisions. |
| Repair Personnel | Mobile | Organization and assignment scoped; accept/decline assigned tasks, perform repairs, send progress and evidence, and submit completion. |
| Admin | Web | Authorized personnel account lifecycle, role/scope assignment, and audit/system administration. Outside the incident decision chain. |
| Barangay Official | Web | Only the account's assigned barangay; first review, validate, reject with a reason, or mark duplicate with a reason and canonical report. No priority, provider routing, repair, or final verification. |
| City Engineer | Web | Citywide engineering decisions; review Barangay-validated reports, confirm, assign manual priority/SLA, select a Utility Provider, and perform final government verification. |
| Utility Provider | Web | Only incidents/work orders routed to the account's organization; create/manage work orders, assign eligible same-organization Repair Personnel, review their completion, request corrective work, and forward accepted work for City Engineering verification. |

No Admin, Barangay Official, City Engineer, Utility Provider, or Repair
Personnel public self-registration is allowed. No Citizen government web
workspace or Repair Personnel government web workspace is allowed. Frontend
navigation follows this split; backend authorization and record scope remain
authoritative.

## Account governance

| Account | Creation/provisioning | Required scope |
| --- | --- | --- |
| Citizen | Public self-registration; activates/verifies as configured. | Citizen role only. |
| Admin | Controlled deployment bootstrap for the initial administrator; subsequent accounts through an authorized Admin after offline approval. | System account administration. Additional Admin management follows the configured provisioner allowlist. |
| Barangay Official | Authorized Admin after offline endorsement. | One assigned barangay. |
| City Engineer | Authorized Admin after offline endorsement. | Citywide engineering scope. |
| Utility Provider | Authorized Admin after organization authorization. | Utility organization/company. |
| Repair Personnel | Authorized Admin after organization authorization. | Repair organization; work access additionally requires an eligible active assignment. |

The account workflow records who provisioned/changed an account and the
approval reference supplied by the authorized administrator. LUNAS does not
validate a person's employment with an external government body. Admins cannot
change their own role or scope. The local-only demo seed is a deployment/testing
bootstrap exception; it must remain restricted to the named local demo database
and must never be presented as public registration.

## Incident lifecycle

The normal path is sequential:

```text
submitted
  → barangay_validated
  → city_confirmed
  → prioritized
  → provider_assigned
  → repair_assigned
  → in_progress
  → repair_completed
  → provider_review
  → provider_accepted
  → city_verification
  → verified
  → resolved
  → closed
```

State meanings and decision owners:

| State | Meaning / next decision owner |
| --- | --- |
| `submitted` | Citizen report received; Barangay Official review. |
| `barangay_validated` | Initial local review passed and forwarded; City Engineer review. |
| `city_confirmed` | City Engineer confirmed the incident; City Engineer assigns priority. |
| `prioritized` | Human priority recorded and configured SLA deadline calculated; City Engineer selects provider. |
| `provider_assigned` | City Engineer routed to an active Utility Provider organization; provider creates the primary work order. |
| `repair_assigned` | Provider assigned eligible Repair Personnel. |
| `in_progress` | Assigned worker accepted and started work. |
| `repair_completed` | Repair Personnel submitted completion and final evidence; this does not resolve the incident. |
| `provider_review` | Utility Provider reviews progress, completion, and evidence. |
| `rework_required` | Provider requested a reasoned correction; Repair Personnel continues and resubmits. |
| `provider_accepted` | Utility Provider accepted the repair and handed it to City Engineering. |
| `city_verification` | City Engineer performs final government review. |
| `city_correction_required` | City Engineer returned completion with a reason; Utility Provider coordinates another repair cycle. |
| `verified` | City Engineer approved the evidence and repair. |
| `resolved` / `closed` | Official result after City Engineering approval; visible to the reporting Citizen. |
| `clarification_required` | City Engineer returned a Barangay-validated report with a reason; Barangay Official reviews and resubmits it. |
| `rejected` | Barangay Official rejected a submitted report with a Citizen-visible reason. |
| `duplicate` | Barangay Official made a human duplicate decision with a reason and canonical report. |

Clarification is an explicit return to the Barangay Official, not a hidden
skip. Rejection and duplicate handling are terminal report decisions. Duplicate
candidate matching (when available) is an advisory system suggestion only; it
does not use image similarity and never changes a report without a human
decision.

The City Engineer confirms an incident before assigning priority. Priority is
always human-assigned. The SLA deadline is calculated from configured priority
rules and recorded with its actor and timestamp. A stored deadline or displayed
overdue projection does not by itself mean a scheduled notification/escalation
worker is enabled.

## Work-order lifecycle

The Utility Provider can create one primary work order only after City
Engineering routes the incident to that provider's active organization. It
selects eligible active Repair Personnel whose repair organization matches and
whose optional barangay restriction allows the work location.

```text
pending/unassigned
  → pending assignment
  → accepted
  → in_progress
  → completed (final evidence required)
  → provider review
  → provider_accepted
  → City Engineer final review
  → verified
```

An assignment can be declined and returned to the Utility Provider for
reassignment. Provider review can instead set `rework_required` with a reason
and instructions; the assigned Repair Personnel receives the correction,
continues the work, updates progress, and submits final evidence again. If City Engineering returns
work, the work order enters `city_correction_required`; the Utility Provider
must coordinate it back to Repair Personnel before another completion review.
Only City Engineering can make the final verified/resolved decision.

`completed`, `provider_accepted`, `verified`, and `closed` are distinct
business outcomes. Repair progress at 100% is not verification or resolution.
Final post-maintenance evidence is required in the same request that records
100% progress. Progress/history and review decisions retain actor, role,
timestamp, state, and applicable reason or instructions.

## Handoff responsibilities

| From → to | Handoff |
| --- | --- |
| Citizen → Barangay Official | Submit report, location, and evidence into the assigned barangay queue. |
| Barangay Official → City Engineer | Validate and record reviewer/time/history. Reject or mark duplicate only with recorded reason. |
| City Engineer → Utility Provider | Confirm, manually prioritize, calculate/store SLA, select provider organization, and record routing. |
| Utility Provider → Repair Personnel | Create work order and assign an eligible same-organization worker. |
| Repair Personnel → Utility Provider | Submit repair progress and final evidence; completion awaits provider review. |
| Utility Provider → Repair Personnel | Record correction reason/instructions and coordinate corrective work. |
| Utility Provider → City Engineer | Accept completed work and submit it for final government review. |
| City Engineer → Utility Provider | Return unacceptable work with a reason for provider-coordinated correction. |
| City Engineer → Citizen | Verify/resolve/close and expose the permitted final status and timeline. |

## User experience by role

- **Citizen mobile:** register/login, submit supported incident details, evidence
  and location, view own reports, status, history, clarification/rejection
  reasons where applicable, and final resolved result.
- **Repair Personnel mobile:** assigned work orders, assignment response,
  instructions, start/progress, notes/evidence, final completion evidence, and
  correction instructions/history.
- **Barangay Official web:** assigned-barangay queue, evidence/location/history
  review, validate, reject with reason, and human duplicate decision.
- **City Engineer web:** citywide Barangay-validated queue, confirmation,
  clarification return, manual priority/SLA, active provider selection,
  provider-accepted queue, final verification, and reasoned return.
- **Utility Provider web:** organization-scoped routed incidents and work
  orders, eligible Repair Personnel assignment/reassignment, progress review,
  completion review, correction coordination, and provider acceptance.
- **Admin web:** authorized account lifecycle and audit/system functions; no
  normal incident decision queue.

## AI, evidence, and privacy boundary

Automatic face blurring, license-plate masking, visual redaction, privacy-detection
models, and image anonymization are excluded from the current LUNAS scope. Evidence
validation, safe decoding/re-encoding, EXIF/GPS metadata stripping, SHA-256 checksums,
private storage, signed URLs, access controls, and required acknowledgements remain in
scope. Metadata stripping does not anonymize visible image content. Historical privacy
fields are retained for compatibility; new uploads record `not_available`,
`applied=false`, and `isPrivacyMasked=false`.

AI analysis, if enabled and connected, is advisory evidence support. It cannot
validate, confirm, prioritize, route, assign, accept repair, verify, or close an
incident. Duplicate suggestions are based on configured report/location
criteria, not image duplicate detection. Do not claim face/license-plate
redaction, automatic image masking, tamper-proof evidence, digital signatures,
SSIM/image alignment, AI repair verification, automatic GIS jurisdiction, or
automatic provider selection unless a separately requested feature is
implemented and runtime-verified. Evidence storage/signing and AI availability
depend on environment configuration.

## Authorization and history requirements

The API enforces both role and record scope. Barangay Officials are constrained
to their assigned barangay; Utility Providers to their organization; Repair
Personnel to their active assignment and organization; Citizens to their own
reports; City Engineers to citywide operational workflows; Admins to
administration. Hiding a link in the UI is never the security boundary.

Major decisions and handoffs record the actor, role, action/state, timestamp,
and applicable reason, notes, provider/assignee, priority/SLA, and evidence
reference. Public Citizen serializers expose only the Citizen's own reports
and explicitly permitted status/reason/evidence fields, not internal notes or
other users' data.

## Runtime and acceptance status

Source implementation is not proof that deployment integrations work. Confirm
actual MongoDB, private evidence storage, email activation delivery, map
configuration, optional push delivery, and any enabled AI service in the
target environment. Do not claim end-to-end completion until the full path in
the handoff table has been exercised using real role-scoped accounts and the
same persisted incident. Known implementation limits and any split-write
consistency risk must be called out in release/demo reports; check the current
test results and deployment configuration before each demonstration.

## Related technical guides

- [Account provisioning](./ACCOUNT_PROVISIONING.md)
- [Backend setup and API catalog](./lunas_backend/README.md)
- [Mobile setup](./lunas_mobile/README.md)
- [Web setup](./lunas_web/README.md)
- [AI service setup](./lunas_ai/README.md)
