# LUNAS

LUNAS manages infrastructure reports from Citizen submission through Barangay
review, Utility Provider routing, repair, and responsible-provider verification. The current product definition is
[LUNAS_PROJECT_SCOPE.md](./LUNAS_PROJECT_SCOPE.md); it supersedes older
milestone and screen inventory documents.

## Repository

| Directory | Purpose |
| --- | --- |
| `lunas_backend/` | Express API, MongoDB models, role/scope enforcement, workflow and account services. |
| `lunas_web/` | Web workspace for Admin, Barangay Official, and Utility Provider (including City Engineering). |
| `lunas_mobile/` | Flutter app for Citizen and Repair Personnel. |
| `lunas_ai/` | Optional assistive evidence analysis service. AI is not a decision-maker. |

## Local setup

Prerequisites: Node.js/npm, MongoDB, Flutter for mobile, and configured
environment values for the integrations you want to use. Never commit real
secrets.

1. Start a local MongoDB database named `lunas_db`.
2. In `lunas_backend/`, run `npm ci`, copy `.env.example` to `.env`, configure
   the local MongoDB URI and unique JWT secrets, then run `npm run dev`.
3. In `lunas_web/`, run `npm ci`, copy `.env.example` to `.env.local`, then run
   `npm run dev`. The local API URL is `http://localhost:5000/api/v1`.
4. In `lunas_mobile/`, run `flutter pub get`, then start the app with a reachable
   backend URL, for example
   `flutter run --dart-define=LUNAS_API_BASE_URL=http://10.0.2.2:5000/api/v1`
   for an Android emulator.

See the [backend](./lunas_backend/README.md), [web](./lunas_web/README.md), and
[mobile](./lunas_mobile/README.md) setup notes for component-specific config.
Private S3 evidence storage, registration/activation email, Maps, optional push,
and AI service behavior depend on real deployment configuration. Supabase
storage credentials are migration-only after the AWS cutover.

The AWS deployment runbook is in [infra/aws/README.md](./infra/aws/README.md).
The deployed web BFF reaches the API privately over Docker networking, while
the Flutter client uses `--dart-define=LUNAS_API_BASE_URL=...` to target the
same public API path. Use HTTPS and a stable domain before production release.

## Docker Compose

For a complete local stack without AWS credentials, run
`./scripts/local-up.sh -d`. It creates `.env.local`, starts MongoDB, a local
S3-compatible object store,
the backend, web dashboard, and AI service, and stores evidence in the local
private `lunas-local-evidence` bucket. The web BFF reaches the API over the
private Compose hostname `backend:5000`; device-facing URLs use the host LAN
address. See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for LAN/mobile setup and
[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production guidance.

For an AWS-connected deployment, copy the root `.env.example` to `.env`, use
the production S3 settings, and run the base Compose file without the local
object-store override. The production backend uses the EC2 instance role and
keeps evidence in the private AWS bucket.

## Local Dagupan accounts and fixtures

The former six `demo.*@lunas.test` accounts are replaced by 42 local test
accounts: one official for each of the 31 canonical Dagupan barangays, four
organization providers and four matching repair accounts, plus admin, a City Engineering provider account, and citizen. See [local account directory](LOCAL_DAGUPAN_ACCOUNTS.md)
for identifiers, category coverage, and login details. These are synthetic test
identities, not official government or utility accounts.

```powershell
docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.local.yml exec -e ALLOW_DEMO_SEED=true -e DEMO_SEED_DOCKER=true backend npm run seed:dagupan
docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.local.yml exec -e ALLOW_DEMO_SEED=true -e DEMO_SEED_DOCKER=true backend npm run seed:web
```

`seed:dagupan` creates 31 synthetic submitted reports, one for each barangay,
with category coverage across all five mobile categories. Coordinates are test
placeholders, not verified barangay locations. Existing accounts and fixtures
are preserved on ordinary reruns. Use `seed:dagupan` for accounts and barangay
fixtures, and `seed:web` for workflow snapshots.

To replace legacy/local fixtures, back up the database first, then append
`-- --replace` to `npm run seed:dagupan`. Replacement updates local account
passwords and metadata, revokes their refresh tokens, removes only explicitly
marked `DEMO-QA-*`, `MOCK-WEB-*`, and `DAGUPAN-LOCAL-*` synthetic fixtures and
their linked work orders/notifications, and recreates the barangay submissions.
Legacy account IDs are retained so reports outside the fixture set keep valid
references. Historical evidence objects remain in the local bucket for backup
recovery. Non-fixture reports are preserved. Both seeders refuse external
MongoDB hosts and any database other than local `lunas_db`.

`seed:web` adds 24 synthetic workflow snapshots and 10 linked work orders.
Water fixtures route to DCWD/Pamana; drainage and municipal fixtures
route to the City Engineering maintenance provider; electrical fixtures use
DECORP. These snapshots support queue testing and are not real approvals.
Use `npm run seed:web -- --refresh` to refresh only web fixtures.

For the real workflow, submit a new citizen report and carry it through
Barangay validation/priority/routing, provider assignment, mobile repair,
and responsible-provider verification. Registration still requires working email delivery and storage.

## Verification commands

```bash
cd lunas_backend && npm test && npm run lint
cd ../lunas_web && npm run lint && npx tsc --noEmit && npm run build && npm run test:e2e
cd ../lunas_mobile && flutter analyze && flutter test
```

See [account provisioning](./ACCOUNT_PROVISIONING.md) for controlled authorized
personnel creation, activation delivery, and deployment notes.


## Current image privacy scope (Revision 9)

New incident and repair evidence is normalized, privacy-detected, and visually
redacted before private storage. Face and license-plate regions are blurred by the
backend using normalized boxes returned by the AI service. The backend fails closed
when privacy processing is unavailable, so a new unredacted image is not persisted.
EXIF/GPS metadata stripping remains separate from visual redaction. Historical privacy
fields are retained for compatibility; legacy images may still report `not_available`.

## Revision 8: report location integrity

Incident pins are citizen-confirmed. Delayed reports, earlier photos, GPS selection, and manual map pins remain supported. GPS comparison is advisory and cannot establish photo capture location. Unavailable, stale, or inaccurate GPS does not make a report suspicious. Significant discrepancies require an explanation, not automatic rejection. Canonical barangay selection remains mandatory; geographic jurisdiction is unverified until suitable authoritative boundaries are integrated. Human verification remains required.

Documented false-report findings and corrections are separate from rejection and duplicate decisions. Authorized reviewers see only findings within their existing incident scope. No automatic punishment or account score is applied. See [Revision 8 implementation and verification report](REVISION_8_LOCATION_INTEGRITY_REPORT.md) for the policy, API contract, audit findings, changed files, and verification limits.

## City Engineering provider conversion

City Engineering uses the organization-scoped Utility Provider workspace. Barangay
Officials validate, prioritize, and route reports; each responsible provider
verifies its own completed repairs. Existing City Engineer accounts require the
`migrate:city-provider` migration described in [the project scope](LUNAS_PROJECT_SCOPE.md).
