# LUNAS

LUNAS is an urban-infrastructure reporting system for Dagupan City. The
currently implemented and documented scope is:

- **25% — Citizen reporting:** account access, evidence, category and location
  capture, report submission, My Reports, report details, and status history.
- **50% — Official validation and routing:** jurisdiction-scoped review,
  validate/reject/duplicate decisions, priority, jurisdiction, responsible
  organization routing, initial SLA deadlines, audit records, and persisted
  notifications.

The supported incident-decision workflow is:

```text
submitted
├── validated  → priority + jurisdiction + accountable organization + SLA start
├── rejected   → required citizen-visible reason
└── duplicate  → required reason + canonical incident reference
```

Work orders, repair assignment/progress, verification, closure, full analytics,
and production AI/redaction workflows are later milestones. Some legacy code
for those areas remains in the repository; it is not part of the verified 25%
or 50% acceptance flow.

## Documentation map

| Area | Purpose |
| --- | --- |
| [MILESTONE_25.md](./MILESTONE_25.md) | Citizen-reporting implementation boundary. |
| [MILESTONE_50.md](./MILESTONE_50.md) | Official-validation/routing contract and limitations. |
| [lunas_backend/README.md](./lunas_backend/README.md) | API setup, configuration, tests, and backend checklist. |
| [lunas_backend/API_ENDPOINTS.md](./lunas_backend/API_ENDPOINTS.md) | API endpoint reference and request examples. |
| [lunas_mobile/README.md](./lunas_mobile/README.md) | Flutter setup and mobile checklist. |
| [lunas_web/README.md](./lunas_web/README.md) | Web setup and browser checklist. |

The AI directory is deliberately not covered by this handoff or checklist.

## Repository layout

```text
lunas-system/
├── lunas_backend/  Node.js + Express + MongoDB API
├── lunas_mobile/   Flutter application
├── lunas_web/      Next.js command center
├── lunas_ai/       Out of scope for this documentation update
├── MILESTONE_25.md
├── MILESTONE_50.md
└── docker-compose.yml
```

## Prerequisites

Install these before running the complete supported flow:

- Node.js 20.9+ and npm 9+
- MongoDB 6+ (local or managed)
- Flutter SDK compatible with Dart 3.11+
- A Supabase project/private storage bucket for real evidence uploads
- A Google Maps key for the mobile map experience

Optional integrations:

- OneSignal credentials for push delivery; in-app notifications still persist
  without them.
- Password-reset delivery provider.

Do not commit secrets. Copy the supplied example environments and keep real
values in ignored local files.

## Local startup

### 1. Start MongoDB

Use a local MongoDB instance, or start the development database service:

```bash
docker compose up -d mongodb
```

The Compose stack is optional for this milestone. The local platform commands
below are the canonical development path because they expose the current
backend, web BFF, and mobile configuration explicitly.

### 2. Start the backend

```bash
cd lunas_backend
npm ci
cp .env.example .env
# Configure MONGODB_URI, JWT secrets, CORS_ORIGIN, and Supabase storage values.
npm run dev
```

The health endpoint is `http://localhost:5000/health` and the API base URL is
`http://localhost:5000/api/v1`.

### 3. Start the web application

```bash
cd lunas_web
npm ci
cp .env.example .env.local
# Set LUNAS_API_URL=http://localhost:5000/api/v1
# Set a unique, high-entropy LUNAS_SESSION_SECRET.
npm run dev
```

Open `http://localhost:3000`.

### 4. Start the mobile application

```bash
cd lunas_mobile
flutter pub get
flutter run --dart-define=LUNAS_API_BASE_URL=http://10.0.2.2:5000/api/v1
```

`10.0.2.2` is for an Android emulator. Use a reachable LAN/HTTPS backend URL
for a physical device or a platform-specific simulator.

## Accounts required for manual testing

Public registration creates **citizen** accounts only. Before testing 50%,
provision these verified, active accounts through the controlled administrative
process used by your deployment:

- one citizen;
- one city engineer or administrator; and optionally
- one barangay official whose configured barangay matches the citizen report.

Utility-provider accounts need a configured `utilityCompany`. They may read
only incidents routed to that organization; their mobile/work-order workspace
is not part of the current milestone.

## System acceptance checklist

Use this checklist after services and test accounts are available. Do not mark
the milestone complete until every applicable item passes.

### 25% — citizen reporting

- [ ] Citizen can register, sign in, restore a session, and sign out.
- [ ] Public registration cannot self-assign an official role.
- [ ] Citizen can select a category, enter a valid description, and choose a
      valid barangay/location.
- [ ] Citizen can attach allowed JPG/PNG evidence and acknowledge the privacy
      notice.
- [ ] Submitted report persists with status `submitted` and appears in **My
      Reports**.
- [ ] Report detail shows only the citizen's own report, safe evidence URL,
      location, and server-authored timeline.
- [ ] A citizen cannot read another citizen's report by changing the ID.

### 50% — official validation and routing

- [ ] Official sign-in opens the appropriate protected workspace.
- [ ] Pending Validation contains only `submitted` reports in the official's
      server-authorized jurisdiction.
- [ ] Search, category, barangay, date, duplicate, sorting, and pagination
      filters return server-scoped results.
- [ ] Official can review signed evidence, location/map link, report history,
      advisory duplicate candidates, and SLA state.
- [ ] Validating a report requires a valid priority and records jurisdiction,
      routing, validator, timestamp, history, audit event, notification, and
      SLA deadline.
- [ ] Rejecting a report without a reason fails; a valid rejection persists and
      the citizen sees the permitted reason.
- [ ] Marking duplicate requires a reason and canonical report; self-reference
      and circular references fail safely.
- [ ] Priority, jurisdiction, and route updates apply only to validated reports
      and create audit/history metadata.
- [ ] A stale second decision returns HTTP `409` and the UI refreshes rather
      than overwriting the first decision.
- [ ] A citizen receives HTTP `403` for official decision endpoints.
- [ ] A barangay official cannot retrieve or decide a report outside their
      barangay.
- [ ] Work-order creation cannot be used to bypass validation for a submitted
      report.

### Platform regression checks

- [ ] Backend automated tests and lint pass.
- [ ] Web lint and production build pass.
- [ ] Mobile `flutter analyze` and `flutter test` pass on a Flutter-enabled
      machine.
- [ ] Test a browser and a physical/emulated mobile device against the same
      backend account data.
- [ ] Confirm no secrets, storage keys, internal notes, or another citizen's
      personal data appear in client responses.

## Automated verification

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

At the latest handoff, backend tests, backend lint, web lint, web production
build, JavaScript syntax checks, and `git diff --check` passed. Flutter/Dart
was not installed in the implementation environment, so mobile analysis and
tests must be run locally before formal acceptance.

## Security and privacy notes

- The API, not the UI, enforces role and jurisdiction scope.
- Backend access tokens are short-lived; web token pairs stay in an encrypted
  HttpOnly BFF session rather than browser JavaScript.
- Evidence is processed/stored privately and exposed through signed URLs.
- Citizen timelines omit internal reviewer/routing notes; permitted decision
  reasons are exposed through dedicated safe fields.
- No approved AI hazard or face/plate-redaction model is bundled. Do not claim
  automatic classification or redaction during testing.

## External configuration still required

- MongoDB for persistence and live concurrency testing.
- Supabase storage for evidence upload and signed URLs.
- Maps credentials for full map functionality.
- OneSignal credentials for push delivery.
- Authoritative jurisdiction boundaries and organization registry, if the
  deployment needs automated geographic/provider validation.

## Support and scope

For exact API payloads, use the backend endpoint reference. For role and test
details specific to a client, use that platform's README. Keep future repair
and AI work separate from the 25%/50% acceptance checklist.
