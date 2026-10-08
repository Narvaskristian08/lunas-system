# LUNAS

LUNAS manages infrastructure reports from Citizen submission through Barangay
review, City Engineering decisions, Utility Provider repair, and final City
Engineering verification. The current product definition is
[LUNAS_PROJECT_SCOPE.md](./LUNAS_PROJECT_SCOPE.md); it supersedes older
milestone and screen inventory documents.

## Repository

| Directory | Purpose |
| --- | --- |
| `lunas_backend/` | Express API, MongoDB models, role/scope enforcement, workflow and account services. |
| `lunas_web/` | Web workspace for Admin, Barangay Official, City Engineer, and Utility Provider. |
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

## Local end-to-end demonstration

The synthetic seed is explicitly local-only. Set `MONGODB_URI` to a local
MongoDB host and database `lunas_db`, configure the backend `.env`, then run:

```bash
cd lunas_backend
ALLOW_DEMO_SEED=true npm run seed:demo
```

The seed refuses non-local MongoDB hosts and any database other than
`lunas_db`. It creates six synthetic role accounts and three synthetic
`submitted` reports; it does not create fake repair outcomes or pre-approve an
incident. The shared demo password is `LunasDemo2026!` unless
`DEMO_SEED_PASSWORD` is configured. Emails:

| Role | Demo email |
| --- | --- |
| Admin | `demo.admin@lunas.test` |
| Barangay Official (Poblacion Oeste) | `demo.barangay@lunas.test` |
| City Engineer | `demo.engineer@lunas.test` |
| Utility Provider (Dagupan Water District) | `demo.utility@lunas.test` |
| Repair Personnel (Dagupan Water District) | `demo.repair@lunas.test` |
| Citizen | `demo.citizen@lunas.test` |

Run the API and web app, then use report `DEMO-QA-001` (a synthetic water-leak
report in Poblacion Oeste) to demonstrate, in order: Barangay validation → City
Engineering confirmation → manual priority/SLA → provider routing → provider
work-order creation and Repair Personnel assignment → mobile acceptance/start,
progress and completion evidence → Utility Provider review → City Engineering
final verification → Citizen's resolved status. Sign in separately as each
role; each server enforces its own scope. Use the web Admin account only for
account/audit administration. Full runtime acceptance still depends on working
database, evidence storage, login/registration config, and device/browser
accessibility to the backend.

`DEMO-QA-001` is a workflow-only shortcut whose Citizen is seeded. To exercise
the full account-creation acceptance path, use **Create Account** in the mobile
app with a fresh email, complete the delivered email code, sign in, and submit a
new report with evidence and location. Then carry that same report through the
role handoffs above. This requires a working registration email provider and
private evidence storage; seed data or direct database edits do not substitute
for Citizen registration.

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
