# LUNAS Project Scope

**Current source of truth ? updated 2026-10-17.** This scope supersedes earlier
milestone and workflow documents. City Engineering is a Utility Provider
organization, not a separate citywide decision role.

## Product boundary

LUNAS records infrastructure reports, review, provider routing, assignment,
repair evidence, and completion decisions. Budget approval, procurement,
contracting, and funding decisions happen outside LUNAS. This role conversion
does not implement a funding-approval workflow or authorize spending.

## Roles, platform, and scope

| Role | Platform | Authority |
| --- | --- | --- |
| Citizen | Mobile | Self-register; submit reports; read own reports and permitted history. |
| Barangay Official | Web | Review within assigned barangay; validate, reject, or mark duplicate with reasons; select priority and route validated reports to an active provider. |
| Utility Provider | Web | Read only reports routed to its organization; manage same-organization repair personnel and work orders; review repairs, request correction, or verify and resolve. |
| Repair Personnel | Mobile | Accept/decline eligible assignments, start repairs, submit progress and required final evidence. |
| Admin | Web | Provision endorsed personnel accounts, manage account lifecycle, and audit the system. No incident decisions. |

City Engineering, DPWH, DECORP, and Pamana/DCWD are organizations using the
same `utility_provider` role. Each has independent organization scope. City
Engineering cannot see or approve other organizations' work merely because it
is a government office. Provider organization names do not establish an agency
partnership or confirm asset ownership.

`city_engineer` is a retired account role retained in historical schemas only.
It cannot sign in or be newly provisioned. Existing accounts must be converted
with the migration below. Historical actors and decisions remain intact.

## Account governance

Only Citizens self-register. Authorized Admins provision other roles after
offline endorsement, recording the approval reference. Provider accounts require
an organization (`utilityCompany`); repair personnel require a matching repair
organization. Providers manage only personnel in their organization. Admins
cannot change their own role or scope; additional administrator provisioning
continues to require the configured allowlist.

## Incident lifecycle

```text
submitted ? barangay_validated ? prioritized ? provider_assigned
  ? repair_assigned ? in_progress ? repair_completed ? provider_review
  ? verified ? resolved ? closed
```

Barangay validation and priority/provider routing are separate recorded actions.
A stale decision returns a conflict. Priority is human-selected; the existing
repair SLA starts on provider routing. Routing currently creates the primary
unassigned work order. Budget readiness, provider referral acceptance, and
separate assessment deadlines are future work, not implied by this conversion.

Barangay rejection and duplicate decisions require reasons; duplicate decisions
also require the canonical report. Provider correction follows
`provider_review ? rework_required ? in_progress`, followed by another completion
submission and review. Final provider approval records verified, resolved, and
closed history events and notifies the citizen. No separate City Engineering
confirmation or government verification is required.

## Work-order lifecycle

```text
pending/unassigned ? pending assignment ? accepted ? in_progress
  ? completed (awaiting provider review) ? verified
```

Providers assign eligible active personnel in the same organization. Personnel
may decline with a reason. Progress is append-only at the supported milestones;
100% requires final evidence in the same submission and does not close a report.
Only the responsible provider may verify completion. A correction requires a
reason/instructions and another repair/review cycle. City Engineering uses this
same workflow for its own municipal maintenance work.

DPWH is provisionable as a provider organization. Automatic ownership-based
routing and City Engineering-to-DPWH referral acceptance are not implemented by
this conversion; do not infer national-road ownership from category alone.

## Migration and deployment

Run `npm run migrate:city-provider` inside `lunas_backend` with the target
`MONGODB_URI` for a dry run. Add `-- --apply` to convert existing City Engineer
accounts to the `Dagupan City Engineering Office` provider organization and
revoke their sessions. Re-running is safe. Account IDs and historical actor
roles are preserved, and conversion provenance is stored in `role_migrations`.

The migration returns pending City-confirmation records to the Barangay routing
queue, provider-accepted/final-verification records to responsible-provider
review, and City correction records to corrective work. It does not approve or
close existing repairs. Deploy the backend and web together, run the migration,
and require converted users to sign in again.

## AI, evidence, and privacy boundary

New incident and repair evidence is normalized, privacy-detected, and visually
redacted before private storage. Face and license-plate regions are blurred by the
backend using normalized boxes returned by the AI service. The backend fails closed
when privacy processing is unavailable, so a new unredacted image is not persisted.
EXIF/GPS metadata stripping remains separate from visual redaction. Historical privacy
fields are retained for compatibility; legacy images may still report `not_available`.

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
reports; City Engineering provider accounts to their own organization; Admins to
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
the lifecycle has been exercised using real role-scoped accounts and the
same persisted incident. Known implementation limits and any split-write
consistency risk must be called out in release/demo reports; check the current
test results and deployment configuration before each demonstration.

## Related technical guides

- [Account provisioning](./ACCOUNT_PROVISIONING.md)
- [Backend setup and API catalog](./lunas_backend/README.md)
- [Mobile setup](./lunas_mobile/README.md)
- [Web setup](./lunas_web/README.md)
- [AI service setup](./lunas_ai/README.md)
