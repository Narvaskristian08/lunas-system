# LUNAS Backend API

Express and MongoDB API for authentication, account provisioning, incident
workflow, work orders, and notifications. It is the enforcement point for the
current roles, platform boundaries, state changes, and record scopes in the
[project scope](../LUNAS_PROJECT_SCOPE.md).

## Run locally

```bash
npm ci
cp .env.example .env
# Configure a local MONGODB_URI and unique JWT secrets.
npm run dev
```

The local health route is `http://localhost:5000/health`; the versioned API is
`http://localhost:5000/api/v1`. Keep local secrets out of source control.
Private evidence storage, activation email, Maps, optional push, and AI
inference require their matching environment configuration. A health response
does not establish that those integrations are available.

`/health` is process liveness. `/health/ready` returns success only while the
MongoDB connection required by durable workflows is connected. Production
startup rejects missing or placeholder JWT secrets, reused access/refresh
secrets, an invalid MongoDB URI, and missing Turnstile configuration.

## Enforcement summary

- Citizens self-register as `citizen` and can read only their own reports.
- Admin provisions authorized accounts after external approval; role/scope
  changes, activation, and account lifecycle are recorded.
- Barangay Officials can review only reports in their assigned barangay.
- City Engineers can review citywide incidents and make manual priority,
  provider-routing, and final-verification decisions.
- Utility Providers can manage work orders only for their organization.
- Repair Personnel can use only eligible work assigned to them in their
  organization and optional barangay scope.
- Direct state editing and incident deletion are not exposed. Workflow changes
  use controlled endpoints, conditional state guards, and append-only history.
- AI output and duplicate candidates are advisory; only the authorized human
  decision changes an incident's business state.

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for the current route catalog and
role gates. Request validation and exact payload constraints live beside the
routes in `src/middleware/validation.js` and
`src/middleware/accountValidation.js`.

## Local synthetic demo

```bash
ALLOW_DEMO_SEED=true npm run seed:demo
```

The script requires a local MongoDB host and database named `lunas_db`. It
creates six synthetic role accounts and three synthetic submitted reports.
Re-seeding removes only records in the `demo.*@lunas.test` and `DEMO-QA-`
namespaces, including their related work orders and notifications. It does not
create synthetic repair outcomes. See the [root demo guide](../README.md) for
credentials and the handoff sequence.

## Verification

```bash
npm test
npm run lint
```

Some integration paths require configured MongoDB/storage/email services;
automated tests and lint do not replace a runtime demonstration of the full
Citizen → government → provider → repair → government → Citizen path.


## Current image privacy scope (Revision 7)

Automatic face blurring, license-plate masking, visual redaction, privacy-detection
models, and image anonymization are excluded from the current LUNAS scope. Evidence
validation, safe decoding/re-encoding, EXIF/GPS metadata stripping, SHA-256 checksums,
private storage, signed URLs, access controls, and required acknowledgements remain in
scope. Metadata stripping does not anonymize visible image content. Historical privacy
fields are retained for compatibility; new uploads record `not_available`,
`applied=false`, and `isPrivacyMasked=false`.

## Location integrity and documented review (Revision 8)

New incident creation requires `locationIntegrity: { confirmed: true, pinSource: "gps" | "map_pin" | "manual" }`. Multipart callers JSON-encode this field. An optional transient `gps` contains `coordinates: [longitude, latitude]`, `accuracyMeters`, and ISO `capturedAt`. Never log or retain this raw fix. The server recomputes Haversine distance and ignores client distance, discrepancy flags, threshold, jurisdiction verification, and confirmation timestamps. Optional `explanation` contains `reason` (`photo_taken_earlier`, `gps_inaccurate`, `reporting_elsewhere`, or `other`) and at most 500 characters of `text`; `other` requires at least 10 characters. An explanation is mandatory only for a significant discrepancy. Manual selection without GPS is supported. New submissions from older mobile builds need the updated confirmation payload; deploy backend and client together.

`GET /incidents/location-policy` returns authenticated policy settings. Defaults: `LOCATION_DISCREPANCY_METERS=500`, `LOCATION_MAX_ACCURACY_METERS=100`, `LOCATION_MAX_AGE_SECONDS=120`. All must be positive finite numbers or defaults apply. A fresh, usable fix is discrepant only if `max(0, distance - accuracy) > threshold`. These are configurable operational starting values, not a validated fraud rule. Accuracy beyond the maximum, fixes older than the maximum age, or fixes over five seconds in the future are inconclusive. Current GPS does not establish the photo location. Only minimum summaries are stored; raw current coordinates are neither stored nor serialized. Canonical barangay names do not verify geographic containment.

`GET/POST /incidents/:id/false-report-review` is restricted to scoped Barangay Officials and City Engineers. POST requires `finding` (`confirmed_fabrication` or `corrected`), a 20-2000 character `reason`, an `evidenceReference` of 1-500 characters, and nonnegative integer `expectedVersion`. A new fabrication finding requires a separately rejected incident. A correction requires an active finding. Atomic version checks append actor, timestamp, reason, and reference to incident review history, preserving prior entries. Repeat counts use only active explicit findings in caller scope; there is no historical backfill or automatic account action. Regular incident serializers and operational map results omit these restricted records. Review history is the durable audit record, separate from ordinary incident status history.

Evidence processing, EXIF removal, private storage, duplicate category/location/time hints, lifecycle ownership, and all six roles remain unchanged. Automatic visual privacy masking remains outside scope. See the [full Revision 8 report](../REVISION_8_LOCATION_INTEGRITY_REPORT.md).
