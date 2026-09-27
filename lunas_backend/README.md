# LUNAS Backend API

Backend service for the LUNAS urban-infrastructure reporting system. It is the
authorization and workflow source of truth for the completed 25% citizen
reporting foundation and 50% official validation/routing milestone.

> **Current handoff scope:** citizen account access, secure evidence-backed
> incident reporting, report tracking, official validation/rejection/duplicate
> decisions, jurisdiction/routing, SLA deadline initialization, notifications,
> and audit history. Repair operations and AI model capabilities are not part
> of the accepted scope yet.

Read the milestone records before planning later work:

- [25% Citizen Reporting Foundation](../MILESTONE_25.md)
- [50% Official Validation and Incident Routing](../MILESTONE_50.md)
- [Detailed endpoint reference](./API_ENDPOINTS.md)

## Contents

- [What is implemented](#what-is-implemented)
- [Requirements](#requirements)
- [Setup and run](#setup-and-run)
- [Configuration](#configuration)
- [Development commands](#development-commands)
- [Roles and access scope](#roles-and-access-scope)
- [Workflow and API overview](#workflow-and-api-overview)
- [Manual acceptance checklist](#manual-acceptance-checklist)
- [Security and privacy boundaries](#security-and-privacy-boundaries)
- [External dependencies and known limits](#external-dependencies-and-known-limits)
- [Deferred work](#deferred-work)
- [Troubleshooting](#troubleshooting)

## What is implemented

### 25% — citizen reporting foundation

- Public registration creates **citizen** accounts only; roles cannot be
  self-assigned. Email OTP verification is required before activation or
  session issuance.
- JWT access tokens, rotating refresh tokens, logout/session invalidation,
  password change, and optional password-reset delivery.
- Web login uses a backend-verified Cloudflare Turnstile challenge. Account
  removal is a recoverable, audited archive that revokes existing sessions.
- Administrators can read the sanitized, server-generated security trail from
  `GET /audit-logs`. CAPTCHA, MFA, login, and account-archive outcomes are
  connected to this trail without retaining submitted secrets or OTP values.
- Category lookup and multipart citizen report submission with one to five
  JPG/PNG evidence files.
- Server-side image decoding, quality checks, JPEG re-encoding to remove EXIF
  metadata, checksums, non-predictable object keys, and private signed URLs.
- Ownership-protected **My Reports**, report detail, and status-history reads.
- Advisory possible-duplicate suggestions. They never change a report state
  automatically.

### 50% — official validation and routing

- Server-scoped official queue with pagination, search, category, barangay,
  date, duplicate-candidate, and safe sort filters.
- Scoped report review: evidence, location, status history, advisory duplicate
  candidates, routing, and SLA data.
- One controlled decision from `submitted` to `validated`, `rejected`, or
  `duplicate`. Competing/stale decisions receive **HTTP 409**.
- Validation records priority, jurisdiction, accountable organization, and SLA
  start. Rejection and duplicate decisions require a citizen-visible reason.
- Priority, jurisdiction, and routing updates for validated reports, each with
  audit metadata and route history where applicable.
- Persisted in-app notifications for the reporting citizen; optional push
  delivery when OneSignal is configured.
- Audit records for validation, rejection, duplicate, priority, jurisdiction,
  and routing actions.

### 75% — work orders, assignment, and repair progress

- A validated, routed incident creates one unassigned 0% primary work order.
- Assignment eligibility checks active repair-personnel role, repair
  organization, availability, and applicable jurisdiction; historical
  assignments are retained for decline and reassignment.
- Repair personnel can accept or decline an assignment, explicitly start work,
  submit only 25/50/75/100 forward progress, add notes, attach private field
  evidence, and mark repair at 100% ready for verification.
- Work-order list/detail, dashboard summary, timeline, evidence, SLA
  approaching/overdue state, notifications, audit events, and server-side
  ownership/scope checks are implemented.
- The scheduler-invokable SLA checker is duplicate-safe. In-process cron stays
  opt-in through the SLA automation environment setting.

At this milestone, a work order completed at 100% is ready for later formal
completion and verification. It is never automatically verified or closed.

## Requirements

- Node.js **18+** and npm **9+**
- MongoDB **6+** locally or a reachable MongoDB Atlas deployment
- A Supabase project and private Storage bucket for real evidence upload and
  signed evidence URLs
- An image file that satisfies the configured evidence rules for end-to-end
  submission testing

Optional integrations:

- OneSignal credentials for push notifications
- An approved password-reset delivery webhook/provider
- An approved AI service and model only if automated analysis is deliberately
  enabled; it is disabled by default and not required for this milestone

## Setup and run

1. Install dependencies and create a local configuration file.

   ```bash
   cd lunas_backend
   npm install
   cp .env.example .env
   ```

2. Edit `.env`. At minimum, configure MongoDB, unique JWT secrets, allowed web
   origins, and Supabase Storage credentials if you will submit evidence. See
   [Configuration](#configuration).

3. Start MongoDB if using a local installation, then start the API.

   ```bash
   npm run dev
   ```

   The API listens on `http://localhost:5000` by default. The REST base URL is
   `http://localhost:5000/api/v1`.

4. Confirm the process is healthy.

   ```bash
   curl http://localhost:5000/health
   ```

   The endpoint responds with an `OK` status, current timestamp, uptime, and
   environment. It does not prove that Supabase upload, email, maps, or push
   notifications are configured.

### Platform connection notes

- The web BFF should use server-only `LUNAS_API_URL`, normally
  `http://localhost:5000/api/v1` locally or `http://backend:5000/api/v1` in
  Docker.
- Flutter should receive its API URL at runtime, for example Android emulator:

  ```bash
  flutter run --dart-define=LUNAS_API_BASE_URL=http://10.0.2.2:5000/api/v1
  ```

  A physical device needs your machine's reachable LAN/HTTPS address instead
  of `10.0.2.2`.

## Configuration

Copy `.env.example`; it is the complete variable template. Never commit the
completed `.env` file or expose service-role credentials to web/mobile clients.

| Group | Variables | Required use |
| --- | --- | --- |
| Server | `NODE_ENV`, `PORT`, `API_VERSION` | Process configuration. |
| Database | `MONGODB_URI` | Required for persistent API operation. |
| Auth | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRE`, `JWT_REFRESH_EXPIRE`, `MAX_REFRESH_TOKENS_PER_USER` | Use distinct, high-entropy production secrets. |
| Auth protection | `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX_REQUESTS` | Login/registration/reset rate limits. |
| Web login CAPTCHA | `TURNSTILE_SECRET_KEY`, `TURNSTILE_ALLOWED_HOSTNAMES`, `TURNSTILE_TIMEOUT_MS` | Server-side Turnstile validation. The browser site key is configured in `lunas_web`. |
| Registration MFA | `REGISTRATION_MFA_SECRET`, `REGISTRATION_MFA_EXPIRE_MINUTES`, `REGISTRATION_MFA_RESEND_SECONDS`, `REGISTRATION_MFA_DELIVERY_URL`, `REGISTRATION_MFA_DELIVERY_TOKEN`, `REGISTRATION_MFA_DELIVERY_TIMEOUT_MS`, `REGISTRATION_MFA_EXPOSE_CODE` | Required email-code verification for public mobile registration. Never expose the code outside isolated local QA. |
| Password reset (optional) | `PASSWORD_RESET_EXPIRE_MINUTES`, `PASSWORD_RESET_APP_URL`, `PASSWORD_RESET_DELIVERY_URL`, `PASSWORD_RESET_DELIVERY_TIMEOUT_MS` | Reset links are delivered only when both URL settings are configured. |
| Evidence storage | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `SUPABASE_STORAGE_PUBLIC`, `EVIDENCE_SIGNED_URL_EXPIRE_SECONDS` | Required for real private evidence upload/read. Keep `SUPABASE_STORAGE_PUBLIC=false` unless a public bucket is intentionally approved. |
| Evidence limits | `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES`, `ALLOWED_IMAGE_FORMATS`, `MIN_IMAGE_WIDTH`, `MIN_IMAGE_HEIGHT`, `EVIDENCE_MAX_WIDTH`, `EVIDENCE_JPEG_QUALITY` | Upload acceptance and image processing. |
| SLA foundation | `SLA_CRITICAL`, `SLA_HIGH`, `SLA_MEDIUM`, `SLA_LOW` | Validation initializes a deadline from these hour values. Defaults: 48, 72, 168, and 336. |
| Later SLA automation | `SLA_AUTOMATION_ENABLED` | Leave `false` for the 50% milestone. The pre-existing reminder/escalation scheduler is not accepted workflow scope. |
| Browser access | `CORS_ORIGIN` | Comma-separated allowed browser origins. Native mobile/server requests do not send an Origin header. |
| General protection | `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE` | API throttling and pagination limits. |
| Push (optional) | `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `ONESIGNAL_USER_AUTH_KEY` | In-app notifications persist without these values; push delivery does not. |
| AI (disabled by default) | `AI_SERVICE_URL`, `AI_SERVICE_TIMEOUT`, `AI_SERVICE_ENABLED`, `AI_EVIDENCE_ANALYSIS_ENABLED` | Do not enable without a real approved model and validation plan. |
| Duplicate hints | `DUPLICATE_WINDOW_HOURS`, `DUPLICATE_RADIUS_METERS` | Advisory matching only; never performs an automatic decision. |
| Local demo seed (optional) | `ALLOW_DEMO_SEED`, `DEMO_SEED_PASSWORD` | Manual presentation-only seed. It runs only against local MongoDB database `lunas_demo`; leave disabled otherwise. |

`SUPABASE_ANON_KEY`, `GOOGLE_MAPS_API_KEY`, and SMTP placeholders remain in
the template for existing platform integrations. They are not substitutes for
the service-role storage credentials required by the server's evidence path.

## Development commands

Run commands from `lunas_backend/`.

| Purpose | Command |
| --- | --- |
| Start production-style server | `npm start` |
| Start development server with reload | `npm run dev` |
| Run backend tests | `npm test` |
| Run tests without coverage noise | `npm test -- --runInBand --silent` |
| Run ESLint | `npm run lint` |
| Load local presentation data | `ALLOW_DEMO_SEED=true npm run seed:demo` |

The test suite exercises authentication, controlled incident transitions,
jurisdiction scope, SLA initialization, evidence behavior, validation
middleware, and the submitted-incident work-order gate. It does **not** replace
the cross-account, real-storage manual checks below.

## Roles and access scope

| Role | Current backend access |
| --- | --- |
| `citizen` | Create and read only their own reports/history; see permitted rejection/duplicate reason; never official actions. |
| `barangay_official` | Review and decide reports only in their configured `barangay`; may keep accountable routing within that barangay. |
| `city_engineer` | City-wide review, validation, jurisdiction confirmation, and routing. |
| `admin` | City-wide validation and administrative account management. |
| `utility_provider` | Can read only incidents already routed to the exact configured `utilityCompany`; provider repair flow is later work. |
| `repair_personnel` | Not granted incident-review access in the 25%/50% workflow. |

Public `POST /auth/register` always creates a citizen. Provision official
accounts through an authenticated administrator using `PUT /users/:id` or by
an approved secure administrative setup process. A barangay official needs a
matching `barangay`; a utility provider needs a matching `utilityCompany`.

### Local presentation accounts and reports

For a local 25%/50% presentation only, `npm run seed:demo` can create
fictional, server-backed data without a mobile report submission. It is not a
production account-provisioning method.

Before running it, set `NODE_ENV=development` and set `MONGODB_URI` to a local
database named `lunas_demo`. Use one of these local connection strings:

```dotenv
# Local MongoDB without authentication
MONGODB_URI=mongodb://localhost:27017/lunas_demo

# This repository's `docker compose up -d mongodb` service
# MONGODB_URI=mongodb://admin:admin123@localhost:27017/lunas_demo?authSource=admin
```

Then run:

```bash
ALLOW_DEMO_SEED=true npm run seed:demo
```

The command refuses production mode, non-local MongoDB URI hosts, any database
other than local `lunas_demo`, and runs without the explicit
`ALLOW_DEMO_SEED=true` opt-in. It only resets its own `demo.*@lunas.test` accounts and
`LUNAS-DEMO-*` reports; it never clears the database.

Use either of these web logins after seeding:

| Account | Role | Password |
| --- | --- | --- |
| `demo.engineer@lunas.test` | City Engineer | `LunasDemo2026!` by default |
| `demo.admin@lunas.test` | Administrator | `LunasDemo2026!` by default |

Set `DEMO_SEED_PASSWORD` before seeding if a different local-only password is
needed. The seed creates three submitted reports for live decisions, including
one advisory duplicate candidate, plus one validated, one rejected, and one
duplicate report so the official dashboard has visible counters. The records
are fictional and have no evidence, AI result, work order, repair, or closure
data. Re-run the seed to restore its initial state after a demonstration.

## Workflow and API overview

All protected endpoints use:

```http
Authorization: Bearer <access-token>
```

Success responses use `{ "success": true, "data": ... }`; errors use
`{ "success": false, "message": ... }`. Paginated responses additionally
include `pagination`.

### Citizen reporting flow

```text
register/login → POST /incidents → submitted → My Reports/detail/history
```

`POST /incidents` is `multipart/form-data`. It accepts category, optional
subcategory, 10–2,000 character description, a JSON `location`, explicit
`privacyAcknowledged=true`, and one to five evidence files. The client cannot
choose priority, starting status, or an AI outcome. The server always starts a
new report at `submitted`.

Primary endpoints:

| Method | Endpoint | Access | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Public | Creates a citizen account only. |
| `POST` | `/auth/login` | Public | Returns a session for ordinary roles or starts privileged MFA. |
| `POST` | `/auth/login/verify` | Public | Consumes a privileged login OTP and returns a session. |
| `POST` | `/auth/login/resend` | Public | Rotates and resends a privileged login OTP. |
| `POST` | `/auth/refresh` | Public with refresh token | Rotates the refresh token. |
| `POST` | `/auth/logout` | Private | Revokes active sessions. |
| `GET` | `/auth/me` | Private | Current account. |
| `GET` | `/categories` | Public | Reportable categories. |
| `POST` | `/incidents` | Citizen/Admin | Submit a report with evidence. |
| `GET` | `/incidents/my` | Citizen | Own reports only. |
| `GET` | `/incidents/:id` | Scoped private | Safe report detail. |
| `GET` | `/incidents/:id/history` | Scoped private | Server-authored status history. |
| `GET` | `/notifications` | Private | Own persisted notifications. |

### Official validation and routing flow

```text
submitted
├── validated  → priority + jurisdiction + accountable organization + SLA start
├── rejected   → required citizen-visible reason
└── duplicate  → required reason + canonical report
```

The decision update is conditional on `status: submitted`, so only the first
valid decision wins. A second decision must receive HTTP `409`; it must never
overwrite the first reviewer’s outcome.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/incidents/pending-validation` | Server-scoped submitted queue. |
| `GET` | `/stats/validation-summary` | Server-scoped pending/validated/rejected/duplicate counts. |
| `GET` | `/incidents/:id/duplicate-candidates` | Advisory duplicate candidates only. |
| `GET` | `/incidents/:id/sla` | SLA foundation/read model. |
| `POST` | `/incidents/:id/validate` | Validate with required priority and optional jurisdiction/routing. |
| `POST` | `/incidents/:id/reject` | Reject with required reason. |
| `POST` | `/incidents/:id/mark-duplicate` | Mark duplicate with canonical report and reason. |
| `PATCH` | `/incidents/:id/priority` | Reprioritize a validated report. |
| `PATCH` | `/incidents/:id/jurisdiction` | Correct a validated jurisdiction. |
| `POST` | `/incidents/:id/route` | Set accountable organization/role and append route history. |
| `PUT` | `/incidents/:id` | Update a non-workflow official note only. |

The pending queue supports `page`, `limit`, `search`, `category`, `barangay`,
`hasDuplicateCandidate`, `sortBy`, `from`, and `to`. Full request and response
payloads, including validation, rejection, duplicate, priority, jurisdiction,
and route examples, are in [API_ENDPOINTS.md](./API_ENDPOINTS.md).

### SLA behavior in this milestone

Validation starts an active SLA using the selected priority. Updating priority
recalculates its deadline. Defaults are:

| Priority | Default deadline |
| --- | --- |
| `critical` | 48 hours |
| `high` | 72 hours |
| `medium` | 168 hours (7 days) |
| `low` | 336 hours (14 days) |

`SLA_AUTOMATION_ENABLED=false` is intentional: this milestone establishes and
displays deadlines; it does not claim approved reminder, escalation, repair,
or closure automation.

## Manual acceptance checklist

Run this against a clean local/staging MongoDB database and configured private
Supabase bucket. Use at least these accounts:

- citizen A and citizen B
- a barangay official assigned to Barangay A
- a barangay official assigned to a different Barangay B
- city engineer or administrator
- optional utility provider with an exact `utilityCompany` name

Record report IDs, timestamps, account roles, and unexpected responses for
each failed item. Do not use production personal evidence for testing.

For a quick local web demonstration, the guarded `seed:demo` command creates
the City Engineer/Admin and fictional report set described above. It is useful
for the 50% queue and dashboard, but it does not replace evidence, storage,
notification, or cross-account acceptance testing.

### Environment and service readiness

- [ ] `npm install` completes without dependency errors.
- [ ] `npm test -- --runInBand --silent` passes.
- [ ] `npm run lint` passes.
- [ ] `GET /health` returns HTTP 200 and the expected environment.
- [ ] MongoDB is reachable and a test report remains after an API restart.
- [ ] Supabase bucket exists, uses the intended privacy policy, and the server
      service-role credentials can upload/delete a test image.
- [ ] Browser origin(s) in `CORS_ORIGIN` can call the API; an unlisted browser
      origin is denied.
- [ ] `.env` and service-role/JWT secrets are not committed or exposed in
      browser/mobile configuration.

### 25% citizen reporting

- [ ] Register a new account, verify that no session is returned before the
      email code, complete the code challenge, and confirm the resulting role
      is `citizen`.
- [ ] Confirm web login rejects a missing, invalid, expired, or reused CAPTCHA
      token before checking credentials.
- [ ] Archive a test user and confirm its database record remains while all
      previous access and refresh tokens are rejected.
- [ ] Log in, call `GET /auth/me`, refresh the session once, then verify the
      old refresh token cannot be reused.
- [ ] Log out and confirm previous access/refresh tokens no longer authorize
      protected requests.
- [ ] Fetch `GET /categories`; confirm the citizen UI has manual category
      selection when AI is unavailable.
- [ ] Submit a valid multipart report with a supported category, valid location
      including barangay, `privacyAcknowledged=true`, and one evidence image.
- [ ] Confirm the response starts at `submitted`, includes a report number and
      advisory duplicate count, and ignores client-supplied priority/status/AI
      fields.
- [ ] Confirm uploaded evidence is readable through a safe signed URL but the
      citizen API response contains no storage key or Supabase service secret.
- [ ] Reject invalid evidence cases: missing acknowledgement, unsupported MIME
      type, excessive file size, too-small image, malformed location, and
      insufficient description.
- [ ] Confirm citizen A sees the report in `GET /incidents/my`, detail, and
      history; citizen B receives no access to citizen A’s report ID.
- [ ] Submit a nearby, same-category report and confirm it may appear as an
      advisory duplicate candidate only—neither report changes status by itself.

### 50% validation and routing

- [ ] Sign in as the Barangay A official and confirm the pending queue contains
      only `submitted` Barangay A reports.
- [ ] Confirm the Barangay B official cannot view, read, or decide the Barangay
      A report by changing an ID or query parameter.
- [ ] Confirm the city engineer/admin can review the same report city-wide.
- [ ] Exercise queue pagination, search, category, date, duplicate-candidate,
      and allowed sort filters; verify the result is server-scoped rather than
      merely hidden in the client.
- [ ] Read report detail, history, duplicate candidates, and SLA. Confirm
      official detail has operational fields while citizen detail does not leak
      internal notes, reviewer identity, storage keys, or other users’ data.
- [ ] Validate one submitted report with a permitted priority, jurisdiction,
      and complete routing object. Confirm `validated`, a history entry,
      priority metadata, route history, audit event, and active SLA deadline.
- [ ] Validate another report with optional jurisdiction/routing omitted and
      confirm only authorized server defaults are applied.
- [ ] Attempt a partial routing object and confirm validation rejects it rather
      than storing mismatched organization/role data.
- [ ] Reprioritize a validated report. Confirm its SLA deadline changes and an
      audit/status-history record exists.
- [ ] Correct jurisdiction and route a validated report. Confirm the updates
      are authorized, auditable, and route history is appended rather than
      overwritten.
- [ ] Reject a submitted report with a valid reason. Confirm the reporting
      citizen sees `rejected` and that permitted reason, but not internal notes.
- [ ] Mark a submitted report duplicate using a scoped canonical report and a
      valid reason. Confirm both records remain, the citizen sees `duplicate`,
      and the duplicate reason is visible without canonical reporter details.
- [ ] Attempt duplicate self-reference and a circular duplicate chain; confirm
      both are rejected.
- [ ] Send two decision requests for the same submitted report at nearly the
      same time. Confirm one succeeds and the other returns HTTP `409`.
- [ ] Confirm a citizen and utility provider cannot call decision endpoints.
- [ ] Route a validated report to the exact optional utility-provider company,
      then confirm that provider can read that routed report but cannot see
      unrelated or still-submitted reports.
- [ ] Confirm validation/rejection/duplicate events create a persisted citizen
      notification; verify OneSignal delivery only if real credentials are set.
- [ ] Confirm validation-summary counts match the official’s server scope.

### Guardrails and later-work boundaries

- [ ] Attempt `PUT /incidents/:id` with `status`, `priority`, rejection, or
      duplicate fields. Confirm only non-workflow notes are allowed.
- [ ] Attempt work-order creation for a `submitted` report. Confirm it returns
      HTTP `409` and does not bypass validation.
- [ ] Keep `SLA_AUTOMATION_ENABLED=false` during milestone acceptance; do not
      mark reminder/escalation automation as tested or production-ready.
- [ ] Verify no screen or API claim says evidence was automatically redacted or
      AI-classified unless a real approved model was separately installed and
      tested.

## Security and privacy boundaries

- Access is enforced in backend queries and mutations, not only by UI route
  guards. Scope combines report ownership/jurisdiction/organization with the
  requested filter to reduce IDOR exposure.
- Authentication uses short-lived JWT access tokens and rotating hashed refresh
  tokens. Logout/password changes invalidate sessions through token versioning.
- Public registration cannot create officials, administrators, repair staff, or
  utility-provider accounts, and it cannot issue a session until the email OTP
  challenge succeeds.
- Web CAPTCHA tokens are validated by the backend. Archived users are inactive,
  hidden from ordinary user lists, and have all sessions revoked.
- Audit details are recursively sanitized before persistence. Only admins can
  read audit records; there is no audit-update or audit-delete API.
- Helmet, CORS allow-listing, API/auth rate limits, request validation, and
  image type/dimension limits are active server protections.
- Evidence is re-encoded to strip EXIF metadata before storage. Private buckets
  use expiring signed URLs; persistent response payloads do not expose storage
  keys to citizens.
- The system records a reporter privacy acknowledgement. It does **not** claim
  face/license-plate redaction without an approved real model.
- Official notes and reviewer/organization details are not returned in citizen
  incident/timeline responses. Rejection/duplicate reasons are intentionally
  citizen-visible.

## External dependencies and known limits

| Dependency/limit | Current behavior |
| --- | --- |
| MongoDB | Required for real persistence and cross-account concurrency testing. |
| Supabase Storage | Required for real evidence submission and signed evidence URLs. Ensure bucket policies are tested with non-public evidence. |
| OneSignal | Optional. Database notifications remain the durable record when push credentials are absent. |
| Maps/geographic boundaries | A map key can improve clients, but no authoritative Dagupan boundary dataset is bundled or fabricated. Jurisdiction is manually confirmed and audited. |
| Organization registry | Not included. City engineers/admins manually enter the accountable organization; provider visibility requires an exact `utilityCompany` match. |
| AI/redaction models | Not included/approved in this milestone. AI fields remain unavailable unless a deployed, tested model is explicitly enabled. |
| SLA automation | Work-order approaching/overdue checks are implemented as an invokable service. The in-process cron monitor is opt-in; configure an external scheduler or set the explicit automation flag. |

## Deferred work

The following are outside the verified 75% handoff:

- formal completion submission package and before/after comparison
- SSIM or AI-assisted repair verification recommendation
- official repair verification approval/rejection and additional-work request
- rework/reopen workflow, final incident closure, and final analytics
- full organizational staffing/scheduling and authoritative organization registry
- authoritative jurisdiction/boundary and organization-registry integrations
- production AI hazard classification and privacy-redaction models

Do not describe these as delivered until their dedicated milestone, real
integrations, cross-role testing, and acceptance checks are complete.

## Troubleshooting

### MongoDB connection fails

- Confirm `MONGODB_URI` points to a running/reachable MongoDB instance.
- For Atlas, check IP allow-listing, database user credentials, and TLS URI.
- Restart after editing `.env`; environment variables are read at process start.

### Evidence upload or signed URL fails

- Confirm `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
  `SUPABASE_STORAGE_BUCKET` are set in the backend process.
- Confirm the bucket exists and the service role has upload/delete/sign access.
- Check evidence MIME, dimensions, size, and `privacyAcknowledged=true`.
- Keep evidence private unless a deliberate privacy review approves a public
  bucket; use the signed URL expiry setting for normal access.

### Browser requests are blocked by CORS

- Add the exact web origin (scheme, host, and port) to comma-separated
  `CORS_ORIGIN` and restart the backend.
- Do not use `*` with credentialed browser sessions.

### A decision is rejected or returns 409

- HTTP `409` means the report is no longer `submitted` or a concurrent decision
  already succeeded. Refresh the report; do not retry blindly.
- Confirm the official has the required role and configured barangay/city scope.
- A barangay official cannot route an incident to an arbitrary provider or a
  different barangay.

### Push/password-reset delivery does not arrive

- In-app notifications and generic reset responses still work without a
  provider. Delivery requires the corresponding OneSignal or approved reset
  delivery variables to be configured.
- Do not log tokens, reset links, or provider credentials while diagnosing.

## License and project context

LUNAS is a capstone research project for the College of Information Technology,
PHINMA University of Pangasinan. Treat this backend as an academic project
handoff until production security, privacy, service ownership, and operational
acceptance requirements are independently approved.
