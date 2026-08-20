# LUNAS Web

The LUNAS web application is the browser workspace for authenticated accounts.
It provides the web-facing parts of the completed 25%, 50%, and 75%
milestones:

- **25% citizen-reporting foundation:** real backend sign-in, encrypted
  server-side session handling, protected routes, account/profile management,
  and a citizen dashboard that shows only the signed-in citizen's reports and
  their server-authored status.
- **50% official validation and routing:** a live, jurisdiction-scoped command
  center where authorized officials review submitted reports and make one
  controlled decision: validate and route, reject, or mark duplicate.
- **75% maintenance operations:** a real work-order command center for
  authorized officials and providers, plus the repair-personnel assignment,
  progress, field-evidence, and backend-SLA workflow. A repair at 100% is
  ready for later formal completion and verification; it is not closed here.

The web app is a Next.js BFF (backend-for-frontend), not a mock-data preview.
It talks to the existing Express API from the server, so backend access and
refresh tokens are never placed in browser JavaScript, local storage, or
session storage. For a local presentation, the backend can seed fictional
records into MongoDB; those remain real server-backed records, not browser
fixtures.

> **Current boundary:** citizens submit reports from the mobile application.
> The web app displays their real report status and repair progress. Formal
> repair completion packages, verification approval/rejection, rework, closure,
> automated SLA escalation, full analytics, and an approved AI/redaction
> integration remain later scope.

For the complete cross-platform milestone contract, read
[MILESTONE_25.md](../MILESTONE_25.md),
[MILESTONE_50.md](../MILESTONE_50.md), and
[MILESTONE_75.md](../MILESTONE_75.md).

## Contents

- [Supported capabilities](#supported-capabilities)
- [Roles and access boundaries](#roles-and-access-boundaries)
- [Architecture and security](#architecture-and-security)
- [Requirements](#requirements)
- [Configuration](#configuration)
- [Run locally](#run-locally)
- [Routes and API integration](#routes-and-api-integration)
- [Testing checklist](#testing-checklist)
- [Automated checks](#automated-checks)
- [Deployment notes](#deployment-notes)
- [Known limits and deferred work](#known-limits-and-deferred-work)
- [Troubleshooting](#troubleshooting)

## Supported capabilities

### Authentication and account access

- Sign in against `POST /api/v1/auth/login` using an authorized live account.
- Store the returned backend access/refresh token pair only inside the
  encrypted, HttpOnly `lunas_session` cookie.
- Refresh a rotating access token server-side before expiry through
  `POST /api/v1/auth/refresh`.
- Safely redirect anonymous, invalid, or expired sessions to sign-in/session
  expiry routes. Return paths are restricted to validated relative paths.
- Sign out through the backend when reachable and always remove the local BFF
  session.
- View and update the supported profile fields; change a password; and use
  password recovery when its backend delivery boundary is configured.
- Online account verification is not enabled in the current release. The
  `/verify-account` page says so directly and does not claim to send a code.
- Show role-aware navigation without using hidden UI controls as authorization.

### Citizen status workspace (25%)

- `/dashboard` shows only reports owned by the signed-in citizen.
- The dashboard displays real server statuses, including `submitted`,
  `validated`, `rejected`, and `duplicate` when they are returned by the API.
- Citizens never receive the official validation queue or official decision
  controls in the web UI.

### Official validation command center (50%)

Authorized officials use `/validation-routing` and
`/validation-routing/:id` to:

- Load submitted reports only from their backend-enforced scope.
- Search, filter by category/barangay/date/duplicate-candidate state, sort,
  and paginate the server-backed queue.
- Review report details, signed evidence URLs, supplied location, safe status
  history, advisory duplicate candidates, current jurisdiction/routing, and
  SLA information.
- Validate a report with priority, confirmed barangay, responsibility,
  accountable organization, optional routing reason, and optional internal
  notes.
- Reject a report with a required reason.
- Mark a report as a duplicate with a required canonical report and reason.
- Confirm every decision in the browser before it is sent.
- Handle a stale competing decision truthfully: the API returns `409` and the
  screen refreshes rather than silently overwriting another official's work.

Validation starts the configured SLA deadline. Routing records accountability
only; it does **not** create a work order or assign repair personnel.

### Work-order command center (75%)

Authorized operational roles use `/work-orders`, `/work-orders/:id`, and
`/sla` to work from the server-backed maintenance queue. The primary path is:

```text
validated + routed incident → create unassigned work order (0%)
  → assign / pending acceptance → accepted → in progress
  → 25% site preparation → 50% main repair → 75% finishing
  → 100% ready for formal completion / verification
```

- Create one work order from a validated, routed incident; creation does not
  silently assign personnel.
- Search, filter, sort, paginate, and inspect scoped work orders using real
  API results, including priority, organization, current assignee,
  assignment/progress state, and backend-calculated SLA state.
- Assign an eligible repair person, or reassign with a required reason, while
  retaining the assignment history returned by the API.
- Let only the assigned repair person accept or decline (with a reason), start
  work, report the allowed discrete progress values, add notes, and upload
  JPG/PNG repair evidence.
- Display signed citizen and repair evidence URLs, an append-oriented timeline,
  SLA deadline/remaining time, and safe unavailable, empty, and conflict
  states. A stale transition is refreshed after the API's `409` response.

The server controls the repair lifecycle and stages: `0` assigned, `25` site
preparation, `50` main repair, `75` finishing, and `100` ready for completion.
The UI intentionally has no verification, approval, rejection, rework, or
closure control at this milestone.

## Roles and access boundaries

The permission map in `src/lib/permissions.ts` controls browser presentation
(navigation and available controls). The Express API is authoritative and
re-checks the role, jurisdiction/organization scope, and record access on
every request.

| Backend role | Web behavior in this release | Backend scope that must be tested |
| --- | --- | --- |
| `citizen` | Dashboard, profile, help; no official review route or action controls. | Own reports only. |
| `barangay_official` | Dashboard and official validation/review screens. | Assigned barangay only. |
| `city_engineer` | Dashboard and official validation/review screens. | City-wide. |
| `admin` | Dashboard and official validation/review screens. | City-wide. |
| `utility_provider` | Dashboard plus scoped work-order and SLA command-center views; may create, assign, and reassign only records routed to its organization. | Routed organization only. |
| `repair_personnel` | Dashboard plus own-assignment work orders; may accept, decline, start, report allowed repair progress, and upload repair evidence. | Own active/current assignments only; no validation queue or official assignment controls. |

No geographic boundary data is fabricated. Officials manually confirm the
report's barangay/jurisdiction, and that choice is auditable in the backend.

## Architecture and security

```text
Browser
  └─ encrypted HttpOnly `lunas_session` cookie
       └─ Next.js Proxy + Server Components/Server Actions
            └─ Authorization: Bearer <access token>
                 └─ Express API (`LUNAS_API_URL`)
                      ├─ MongoDB / incident state, audit records, notifications
                      └─ configured private evidence storage / signed URLs
```

### Session handling

- `src/app/actions/auth.ts` signs in through the API and creates the encrypted
  BFF session cookie.
- `src/proxy.ts` protects the application routes and refreshes a token when it
  is close to expiry. A refresh outage is treated as a safe unavailable state,
  not an implicit sign-out.
- `src/lib/auth/session-crypto.ts` uses AES-256-GCM and an environment-specific
  `LUNAS_SESSION_SECRET`. Cookies are `HttpOnly`, `SameSite=Lax`, high
  priority, and `Secure` in production.
- `src/lib/api/backend.server.ts` is server-only. Browser components do not
  receive token material.

### Validation handling

- `src/lib/validation.server.ts` normalizes only safe API response fields for
  the queue and detail views.
- `src/app/actions/validation.ts` validates the presentation input, requires
  `reports.validate`, then sends the decision server-side.
- The backend controls the state transition:

  ```text
  submitted → validated | rejected | duplicate
  ```

  It uses a conditional submitted-state update, so one report cannot receive
  two conflicting decisions.

### Work-order handling

- `src/lib/work-orders.server.ts` normalizes only the work-order fields needed
  by each queue/detail screen and gets signed evidence URLs from the API; it
  does not fabricate repair records in the browser.
- `src/app/actions/work-orders.ts` requires a server-side permission and
  backend role before every mutation. It uses the nested incident endpoint for
  work-order creation and the work-order endpoints for assignment, repair
  transitions, and multipart evidence upload.
- The API remains authoritative for incident state, assignment ownership,
  organization/jurisdiction scope, discrete progress values, no-regression
  rules, evidence validation/storage, SLA state, and stale-update conflicts.
- Client controls are only affordances. A hidden or modified browser request
  cannot grant a role or bypass the backend state machine.

### Data-protection expectations

- Do not add access/refresh tokens to `localStorage`, `sessionStorage`, URL
  parameters, analytics events, browser logs, or client-side state.
- Do not replace server-side authorization with a frontend role check.
- Do not expose private storage object keys, reporter identity, canonical
  report details, or internal official notes to a citizen.
- Use the API's signed evidence URLs; do not construct storage URLs in the
  browser.
- Do not surface repair-personnel contacts, internal reassignment reasons,
  repair evidence, or internal SLA notes in a citizen-facing view.
- Treat evidence, precise locations, account information, reset tokens, and
  verification codes as sensitive data.

## Requirements

- Node.js **20.9.0 or later** (required by the installed Next.js version).
- npm (the committed `package-lock.json` is used by `npm ci`).
- A reachable LUNAS Express backend with MongoDB configured.
- Test accounts created by an administrator, or the guarded local backend
  seed described below. The browser never pre-fills credentials or offers role
  switching.
- Supabase Storage or the configured private evidence provider when testing
  actual evidence/signed URLs.
- Chromium installed for Playwright end-to-end checks.

## Configuration

Copy the template before starting the application:

```bash
cd lunas_web
cp .env.example .env.local
```

Set the following values in `.env.local`:

```dotenv
# Server-only Express API base. Either form is accepted:
# http://localhost:5000 or http://localhost:5000/api/v1
LUNAS_API_URL=http://localhost:5000/api/v1

# Required in production. Use a long, unique, high-entropy secret per environment.
LUNAS_SESSION_SECRET=replace-with-a-long-random-secret

# Optional: redirect protected pages to /maintenance while enabled.
LUNAS_MAINTENANCE_MODE=
```

Notes:

- `LUNAS_API_URL` is deliberately server-only. In Docker, point it at the
  backend service hostname, for example `http://backend:5000/api/v1`, rather
  than the web application's own address.
- The URL helper adds `/api/v1` when it is omitted.
- `LUNAS_SESSION_SECRET` is mandatory in production. Changing it invalidates
  existing BFF sessions, which is appropriate during secret rotation.
- `LUNAS_MAINTENANCE_MODE=full` redirects protected web routes to the
  maintenance page. Remove it or leave it blank to restore access.
- `NEXT_PUBLIC_API_URL` is only a compatibility fallback for any future
  browser-facing integration. Do not use it to expose privileged backend
  endpoints or token handling.
- Keep `.env.local` out of source control. Configure the equivalent secrets in
  the deployment platform instead.

The backend itself needs its own `.env` configuration, including MongoDB,
JWT/refresh-token secrets, CORS origins, and private evidence-storage
credentials. See [the backend README](../lunas_backend/README.md).

## Run locally

Start the API first. Its normal local URL is
`http://localhost:5000/api/v1`.

```bash
# terminal 1
cd lunas_backend
cp .env.example .env
npm install
npm run dev
```

### Optional local 50% demonstration data

To show the official dashboard and review flow without creating reports on a
mobile device, use the backend's guarded local seed before starting the web
app. In `lunas_backend/.env`, set `NODE_ENV=development` and use a local
database named `lunas_demo`:

```dotenv
# Local MongoDB without authentication
MONGODB_URI=mongodb://localhost:27017/lunas_demo

# This repository's `docker compose up -d mongodb` service
# MONGODB_URI=mongodb://admin:admin123@localhost:27017/lunas_demo?authSource=admin
```

Then run:

```bash
cd lunas_backend
ALLOW_DEMO_SEED=true npm run seed:demo
```

The seed is blocked for production, non-local MongoDB URI hosts, and databases
other than local `lunas_demo`. It creates only fictional records and may be
re-run to restore them. Sign in at the normal web login form with either:

| Account | Role | Password |
| --- | --- | --- |
| `demo.engineer@lunas.test` | City Engineer | `LunasDemo2026!` by default |
| `demo.admin@lunas.test` | Administrator | `LunasDemo2026!` by default |

Set `DEMO_SEED_PASSWORD` before running the seed if you changed the local
password. The web app does not display these credentials or change roles for
you. The data includes three submitted reports for live decisions, one
advisory duplicate candidate, and one of each decided status for the dashboard
summary. It intentionally has no real citizen details or evidence images.

Then start the web application:

```bash
# terminal 2
cd lunas_web
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root redirects into
the authenticated application flow; sign in with a real account created in
the backend or the local-only seeded account above.

For a production-like local run:

```bash
cd lunas_web
npm run build
npm run start
```

`npm run build` validates the production bundle but does not require the API
to be running. Runtime sign-in, dashboards, report review, and decisions do
require the API and its datastore.

## Routes and API integration

### Primary routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/login` | Live sign-in form. | Public |
| `/forgot-password`, `/reset-password` | Account recovery when supported by the backend. | Public |
| `/verify-account` | Explains that online verification is not available in this release. | Public |
| `/privacy`, `/terms`, `/maintenance` | Public legal/maintenance states. | Public |
| `/dashboard` | Real citizen or official summary. | Authenticated account with dashboard access |
| `/profile`, `/profile/edit`, `/profile/change-password` | Account self-service. | Authenticated account |
| `/help` | Support guidance without a fake ticket workflow. | Authenticated account |
| `/validation-routing` | Pending validation queue. | Barangay official, city engineer, administrator |
| `/validation-routing/:id` | Official report review and decision screen. | Same, plus API record scope |
| `/work-orders` | Scoped maintenance queue with real filters, pagination, and dashboard summary. | Barangay official, city engineer, utility provider, repair personnel, administrator; API scope applies |
| `/work-orders/:id` | Work-order detail, timeline, SLA, evidence, and role-specific action controls. | Same, plus API record/assignment scope |
| `/sla` | SLA-focused view of the live work-order queue. | Same as `/work-orders` |
| `/incidents`, `/incidents/:id` | Compatibility redirects to the validation routes. | Same as destination |

`/repairs`, `/maintenance-coordination`, and their legacy detail paths redirect
to the supported work-order command center. Older `/reports` and
`/notifications` routes still retain their explicit unavailable boundary; they
are not evidence of an implemented report workspace or notification center.

### API calls used by the web platform

All API calls are made by the Next.js server using `LUNAS_API_URL`. The
following endpoints must retain the documented response envelope and scoped
behavior:

| Area | API endpoints used |
| --- | --- |
| Authentication | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Viewer/profile | `GET /users/me` (with `/auth/me` compatibility fallback), `PATCH /users/me` (with `/auth/profile` fallback), `PUT /auth/change-password` |
| Account recovery | `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Citizen dashboard | `GET /incidents/my` (with scoped `/incidents` fallback) |
| Official dashboard | `GET /stats/validation-summary`, `GET /incidents/pending-validation?limit=5` |
| Validation queue/detail | `GET /incidents/pending-validation`, `GET /incidents/:id`, `GET /incidents/:id/history`, `GET /incidents/:id/duplicate-candidates`, `GET /incidents/:id/sla` |
| Controlled decisions | `POST /incidents/:id/validate`, `POST /incidents/:id/reject`, `POST /incidents/:id/mark-duplicate` |
| Work-order queue/detail | `GET /work-orders`, `GET /work-orders/:id`, `GET /work-orders/:id/assignments`, `GET /work-orders/:id/progress`, `GET /work-orders/:id/sla`, `GET /dashboard/work-orders-summary` |
| Work-order staffing | `GET /work-orders/:id/eligible-personnel`, `POST /work-orders/:id/assign`, `POST /work-orders/:id/reassign` |
| Repair-assignment actions | `POST /work-orders/:id/accept`, `POST /work-orders/:id/decline`, `POST /work-orders/:id/start`, `POST /work-orders/:id/progress`, `POST /work-orders/:id/evidence` |
| Work-order creation | `POST /incidents/:id/work-orders` from a validated, routed incident (the compatibility `POST /work-orders` route is not used by the web flow). |

The validation queue passes `page`, `limit`, `search`, `category`, `barangay`,
`hasDuplicateCandidate`, `sortBy`, `from`, and `to`. The work-order queue
passes its documented `page`, `limit`, `search`, `status`, `priority`,
`assignmentStatus`, `progress`, `slaState`, `personnel`, `organization`,
`category`, and `sortBy` filters. The complete public contract and payload
examples are in
[lunas_backend/API_ENDPOINTS.md](../lunas_backend/API_ENDPOINTS.md).

## Testing checklist

Use live, non-production test accounts and a test database/storage bucket.
Do not test decisions against real public reports unless that is explicitly
authorized.

### Before testing

- [ ] Backend, MongoDB, and private evidence storage are configured and
  healthy.
- [ ] `LUNAS_API_URL` reaches the intended API from the web process.
- [ ] A unique production-quality `LUNAS_SESSION_SECRET` is configured for
  non-local environments.
- [ ] The backend's `CORS_ORIGIN` includes the web origin where applicable.
- [ ] Test accounts exist for: one citizen, one barangay official assigned to
  Barangay A, another barangay official assigned to Barangay B, one city
  engineer or administrator, and a utility-provider/repair account. For a
  local presentation, `ALLOW_DEMO_SEED=true npm run seed:demo` creates a city
  engineer, administrator, Pantal official, and fictional reporters instead.
- [ ] Test reports exist: one submitted report in Barangay A, one submitted
  report in Barangay B, two similar submitted reports for duplicate testing,
  and one report with private evidence if evidence storage is configured. The
  local seed supplies fictional queue/dashboard records but intentionally no
  evidence image.
- [ ] No tester is using a real resident's sensitive report or image.

### Browser: authentication, sessions, and profile

- [ ] Open `/login`; confirm local demo credentials are not pre-filled and no
  role-preview controls are displayed.
- [ ] Submit empty and invalid credentials; confirm useful field feedback is
  shown without revealing whether an account exists.
- [ ] Sign in with each authorized test account and confirm the dashboard
  displays that account's real role/organization context.
- [ ] Visit a protected URL while signed out, for example
  `/validation-routing`; confirm it redirects to `/login` with a safe `next`
  value.
- [ ] Attempt a malicious/external `next` URL; confirm the application does
  not redirect away from LUNAS after sign-in.
- [ ] Sign out, refresh the page, and confirm protected pages remain
  inaccessible.
- [ ] In browser developer tools, confirm no backend access token or refresh
  token is in `localStorage`, `sessionStorage`, rendered HTML, or client-side
  network payloads. The `lunas_session` cookie should be HttpOnly.
- [ ] With a short-lived access token/refresh token configuration, keep a
  session active until a refresh occurs; confirm the user remains signed in
  and the refreshed cookie is set without exposing tokens to JavaScript.
- [ ] Temporarily make the refresh API unavailable; confirm the application
  shows a safe unavailable/session state rather than treating the user as a
  different account.
- [ ] Update an allowed profile field, refresh, and confirm the API persisted
  it. Change the password with a valid current password and confirm the
  expected post-change session behavior.
- [ ] Set `LUNAS_MAINTENANCE_MODE=full`, restart the web app, and confirm
  protected routes redirect to `/maintenance`; remove it and confirm normal
  access returns.

### Browser: citizen outcome checks (25% + 50% + 75%)

- [ ] Sign in as the citizen and confirm the dashboard lists only reports
  submitted by that citizen.
- [ ] Confirm a submitted report displays as `Submitted` before an official
  decision.
- [ ] After an official validates a report, refresh the citizen dashboard and
  confirm it displays the server-provided validated/being-handled state.
- [ ] After an official rejects a report, confirm the citizen's API/mobile
  view exposes the permitted rejection reason but not internal official notes.
- [ ] After an official marks a report duplicate, confirm the citizen's
  API/mobile view exposes the permitted duplicate reason but not the canonical
  reporter's identity, private evidence, or internal notes.
- [ ] After a work order is assigned, started, and progressed, refresh the
  citizen-safe view and confirm it exposes only the permitted high-level
  repair state/progress, not staff details, internal notes, evidence, or SLA
  internals.
- [ ] Directly open `/validation-routing` as a citizen; confirm the web app
  denies access and the API also rejects any attempted official action.

### Browser: official queue and review

- [ ] Sign in as the Barangay A official. Confirm `/validation-routing` shows
  submitted reports in Barangay A and does not reveal Barangay B reports.
- [ ] Sign in as the Barangay B official and verify the inverse scope.
- [ ] Sign in as a city engineer/administrator and confirm the queue can show
  both test barangays.
- [ ] Check search, category, barangay, date, possible-duplicate, sorting,
  pagination, and clear-filter behavior. Confirm the query changes results
  from the server rather than filtering a fabricated local list.
- [ ] Open a queue row and confirm report number, category, description,
  location, history, current routing, and SLA fields match the backend record.
- [ ] When evidence exists, open the signed evidence URL and confirm the image
  loads only for an authorized review session. Confirm no raw storage key is
  displayed.
- [ ] Confirm the location link uses the report's actual coordinates when
  available and clearly indicates unavailable location data when it is not.
- [ ] Confirm duplicate candidates are described as advisory; no report is
  automatically marked duplicate.
- [ ] Confirm utility-provider and repair-personnel accounts cannot open the
  official validation queue, but can use only their scoped live work-order
  workspace—not an invented queue or sample data.

### Browser: controlled decisions

- [ ] On a submitted report, choose **Validate**. Confirm priority, barangay,
  responsibility, and responsible organization are required before submission.
- [ ] Validate a report with each available priority as appropriate. Confirm
  the confirmation dialog describes the effect, the decision succeeds once,
  the report leaves the pending queue, and the dashboard counts refresh.
- [ ] Verify through the API/detail response that validation persisted the
  selected priority, jurisdiction, accountable organization, status history,
  and an active SLA deadline.
- [ ] On a fresh submitted report, choose **Reject**. Leave the reason blank
  and confirm submission is blocked; then provide a reason, confirm the
  dialog, and verify the report moves to `rejected` exactly once.
- [ ] On one of the similar reports, choose **Duplicate**. Confirm a canonical
  report and reason are required, then verify the report moves to `duplicate`
  and preserves the canonical reference.
- [ ] Attempt to set a report as its own canonical duplicate. Confirm the
  backend rejects it.
- [ ] Open the same submitted report in two authorized browser sessions. Make
  a different decision in each. Confirm exactly one succeeds and the stale
  session receives the conflict message/refresh rather than overwriting the
  first decision.
- [ ] Refresh the detail and queue after every decision. Confirm no duplicate
  status-history/audit entries were created by refreshes or double-clicks.

### Browser: work orders, assignment, and repair progress

- [ ] With an authorized official/provider, open a validated and routed
  incident detail. Create its work order once and confirm a duplicate create
  receives the backend's safe conflict/error rather than creating a second
  record.
- [ ] Open `/work-orders` and verify search, priority, assignment, progress,
  SLA, sorting, pagination, clear-filter, loading, empty, and API-error
  states use server results. Check that scope does not expand through query
  parameters.
- [ ] Open `/sla` and confirm the displayed deadline, remaining time,
  approaching, and overdue state come from the backend projection rather than
  a browser-calculated authoritative status.
- [ ] On an unassigned work order, confirm only backend-eligible active repair
  personnel are shown. Assign one person; confirm the row/detail reflect
  pending acceptance and the assignment timeline is preserved.
- [ ] Reassign an active/pending assignment. Confirm a reason is required and
  the previous assignment is retained as history rather than overwritten.
- [ ] Sign in as the selected repair person. Confirm only own scoped work
  orders are visible. Accept or decline an assignment; verify decline requires
  a reason and that an official can subsequently reassign it.
- [ ] Start an accepted work order, then submit only 25%, 50%, 75%, and 100%
  progress. Confirm the displayed stages are site preparation, main repair,
  finishing, and ready for completion. Confirm progress cannot regress.
- [ ] At 100%, require a meaningful repair note and confirm the UI says ready
  for formal completion/verification. It must not present a verify, reject,
  rework, or close action.
- [ ] Upload one or more JPEG/PNG repair images. Confirm the signed image is
  visible to authorized operational users, raw storage keys are absent, and
  invalid MIME types/extensions, more than five files, and files over 10 MB
  are rejected before or by the API.
- [ ] Open the same work order in two sessions and perform competing
  assignment/progress actions. Confirm the stale action reports a conflict and
  refreshes instead of overwriting the newer server state.

### API and authorization checks

Use an API client with test tokens for these checks. Record status code,
response body, and affected database/audit record for the acceptance log.

- [ ] `GET /incidents/pending-validation` returns only submitted incidents in
  the caller's server-side scope; query parameters cannot broaden that scope.
- [ ] `GET /incidents/:id`, `/history`, `/duplicate-candidates`, and `/sla`
  do not reveal out-of-scope reports. Verify the safe `404`/authorization
  response expected by the backend contract.
- [ ] `POST /incidents/:id/validate` rejects missing/invalid priority,
  incomplete jurisdiction/routing data, or an already decided report.
- [ ] A successful validate request returns the validated record and starts
  the configured SLA deadline. A second decision against the same report
  returns HTTP `409`.
- [ ] `POST /incidents/:id/reject` rejects a missing reason and persists a
  valid reason without exposing internal notes to the citizen.
- [ ] `POST /incidents/:id/mark-duplicate` rejects missing canonical ID,
  missing reason, self-reference, and circular duplicate chains.
- [ ] `PATCH /incidents/:id/priority`,
  `PATCH /incidents/:id/jurisdiction`, and `POST /incidents/:id/route`
  enforce their validated-state and role/scope requirements.
- [ ] A generic incident update cannot bypass the official state machine by
  changing `status`, `priority`, rejection fields, or duplicate fields.
- [ ] `GET /stats/validation-summary` returns counts scoped to the caller.
- [ ] Review the affected audit/notification records in the authorized test
  environment. Validate, reject, duplicate, priority, jurisdiction, and route
  actions must be traceable; citizen notifications must not disclose internal
  data.
- [ ] Confirm citizen, provider, repair, or wrong-barangay tokens cannot make
  an official decision even if a browser request is modified manually.
- [ ] `POST /incidents/:id/work-orders` accepts only a validated, routed
  incident in the caller's server scope, creates one initial unassigned 0%
  work order, and safely rejects a duplicate or invalid lifecycle request.
- [ ] `GET /work-orders`, detail, assignments, progress, SLA, and summary
  endpoints enforce role, organization, barangay, and own-assignment scope.
- [ ] Assignment/reassignment accepts only eligible active repair personnel;
  reassignment records its required reason and does not erase history.
- [ ] Repair-personnel tokens can act only on their own current assignment.
  Verify accept, decline, start, progress, and evidence endpoints reject an
  unassigned or wrong-user request.
- [ ] Progress accepts only the documented discrete non-regressing sequence
  and returns `409` for stale/conflicting transitions. A 100% transition must
  leave the incident/work order awaiting later verification, not closed.
- [ ] Repair-evidence upload enforces JPEG/PNG, count/size limits, private
  storage, metadata stripping/checksum behavior, and authorized signed URLs.
- [ ] `GET /dashboard/work-orders-summary` and each work-order SLA response
  return only the caller's scoped counts/statuses. Confirm no scheduled SLA
  action is implied unless backend automation is explicitly enabled.

### Browser quality and recovery

- [ ] Test the sign-in, dashboard, queue, and review screens at narrow mobile
  width, tablet width, and desktop width; verify there is no horizontal page
  overflow and key controls remain usable by keyboard.
- [ ] Check empty queue, no-filter-result, no-evidence, no-location, and API
  unavailable states. They must be clear and must not display placeholder
  production records.
- [ ] Test a backend `401`, `403`, `404`, `409`, and `503` response where
  practical. Confirm the response is safe, understandable, and does not leak
  backend tokens or private report data.

## Automated checks

Run these from `lunas_web` after configuration changes or before handoff:

```bash
npm ci
npm run lint
npm run build
```

The current Playwright coverage checks public authentication states and
anonymous protected-route redirects. It needs the standalone production build
and a Chromium browser:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

`test:e2e` starts the production web app on port `3100` through the committed
Playwright configuration. It does not replace the cross-account
manual acceptance checklist above; live validation decisions need a configured
backend, MongoDB, private storage, and role-scoped test records.

## Deployment notes

- Run `npm run build` in CI and deploy the Next.js standalone output produced
  by the configured `output: "standalone"` build.
- Set `NODE_ENV=production`, `LUNAS_API_URL`, and a unique
  `LUNAS_SESSION_SECRET` as deployment secrets. Do not bake them into the
  repository or browser bundle.
- Use HTTPS in production so the session cookie is marked `Secure`.
- Point `LUNAS_API_URL` at a private/reachable backend service address. It is
  a server-to-server call, not a browser CORS workaround.
- Configure backend CORS, cookie/domain policy, reverse-proxy headers, and
  allowed web origin consistently with the deployed web URL.
- The provided `Dockerfile` is the standalone deployment template and uses a
  supported Node 20 Alpine image. Pass runtime environment values
  through the platform secret store or an env file; do not commit them in the
  image.
- Rotate `LUNAS_SESSION_SECRET` deliberately. Existing web sessions will be
  invalidated and users will need to sign in again.

## Known limits and deferred work

The following are intentionally not complete in the web platform at the 75%
milestone:

- Citizen report creation/evidence capture in the browser (the 25% submission
  flow is mobile).
- Formal repair-completion package submission, before/after comparison, SSIM,
  AI repair recommendations, official verification approval/rejection,
  additional-work requests, rework/reopen, closure, and final-resolution
  analytics. A 100% repair remains ready for later verification.
- Live notifications center, full analytics, and SLA reminder/escalation UI.
- Automated SLA escalation. The web displays the backend's SLA projection;
  any backend scheduler remains explicitly opt-in through deployment
  configuration.
- Authoritative geographic boundaries, organization registry validation, and
  map-provider enhancements.
- Approved AI hazard classification or face/license-plate redaction. The app
  does not claim automatic AI classification or image redaction.
- End-to-end browser automation for authenticated, multi-role validation
  scenarios. Those need stable test identities and live test infrastructure.

Older compatibility routes redirect to the supported work-order command
center where applicable. Keep acceptance testing focused on the supported
routes and state machine documented above.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Login reports that LUNAS is unavailable | Confirm the backend is running, `LUNAS_API_URL` is reachable from the Next.js server, and its API path resolves to `/api/v1`. |
| Production build/session fails with secret error | Set a non-empty, high-entropy `LUNAS_SESSION_SECRET`; restart all web instances using the same intended secret. |
| Browser repeatedly returns to login | Check the encrypted cookie is not blocked, the system clock is accurate, the refresh token is valid, and the proxy can reach `/auth/refresh`. |
| Official sees no reports | Confirm there are `submitted` reports in that account's backend scope and verify the official's barangay/role assignment in the backend. For the local demo, run the guarded backend seed against `lunas_demo`, then sign in as the seeded city engineer/admin. |
| Evidence does not load | Check the private storage configuration and signed URL generation in the backend. Do not make the bucket public as a workaround. |
| A decision conflicts | This is expected when another official already decided the report. Refresh/reload the record and do not retry a different decision blindly. |
| Playwright cannot launch Chromium | Run `npx playwright install chromium`, then rebuild before `npm run test:e2e`. |

## Important source locations

| Location | Responsibility |
| --- | --- |
| `src/proxy.ts` | Protected-route gate and server-side token refresh. |
| `src/lib/auth/` | Encrypted session cookie, viewer lookup, and access checks. |
| `src/lib/api/backend.server.ts` | Server-only authenticated API client. |
| `src/lib/dashboard.server.ts` | Real citizen/official dashboard data loading. |
| `src/lib/validation.server.ts` | Validation queue/detail response normalization and queries. |
| `src/app/actions/validation.ts` | Server actions for validate, reject, and mark duplicate. |
| `src/components/validation/` | Queue filters, pagination, review, confirmation, and conflict UI. |
| `src/app/(protected)/validation-routing/` | Official command-center routes. |
| `src/lib/work-orders.server.ts` | Server-only work-order queue/detail/SLA normalization and backend queries. |
| `src/lib/work-order-progress.ts` | Shared 0/25/50/75/100 repair-stage map. |
| `src/app/actions/work-orders.ts` | Server actions for creation, assignment, repair progress, and evidence. |
| `src/components/work-orders/` | Work-order queue, detail, timeline, SLA, evidence, and action UI. |
| `src/app/(protected)/work-orders/`, `src/app/(protected)/sla/` | Live maintenance command-center routes. |
| `tests/shared-screens.spec.ts` | Current Playwright public/protected-route smoke coverage. |
