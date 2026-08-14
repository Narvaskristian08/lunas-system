# LUNAS Web

The LUNAS web application is the browser workspace for authenticated accounts.
It provides the web-facing parts of the completed 25% and 50% milestones:

- **25% citizen-reporting foundation:** real backend sign-in, encrypted
  server-side session handling, protected routes, account/profile management,
  and a citizen dashboard that shows only the signed-in citizen's reports and
  their server-authored status.
- **50% official validation and routing:** a live, jurisdiction-scoped command
  center where authorized officials review submitted reports and make one
  controlled decision: validate and route, reject, or mark duplicate.

The web app is a Next.js BFF (backend-for-frontend), not a mock-data preview.
It talks to the existing Express API from the server, so backend access and
refresh tokens are never placed in browser JavaScript, local storage, or
session storage.

> **Current boundary:** citizens submit reports from the mobile application.
> The web app displays their real report status. Work orders, repair progress,
> repair verification/closure, provider operations, SLA escalation automation,
> full analytics, and an approved AI/redaction integration are later
> milestones.

For the complete cross-platform milestone contract, read
[MILESTONE_25.md](../MILESTONE_25.md) and
[MILESTONE_50.md](../MILESTONE_50.md).

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
| `utility_provider` | Account/dashboard boundary only; no provider operation workspace is presented. | Routed-record access belongs to the API; provider repair work is later scope. |
| `repair_personnel` | Account/dashboard boundary only; no repair workspace is presented. | No validation queue. |

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

### Data-protection expectations

- Do not add access/refresh tokens to `localStorage`, `sessionStorage`, URL
  parameters, analytics events, browser logs, or client-side state.
- Do not replace server-side authorization with a frontend role check.
- Do not expose private storage object keys, reporter identity, canonical
  report details, or internal official notes to a citizen.
- Use the API's signed evidence URLs; do not construct storage URLs in the
  browser.
- Treat evidence, precise locations, account information, reset tokens, and
  verification codes as sensitive data.

## Requirements

- Node.js **20.9.0 or later** (required by the installed Next.js version).
- npm (the committed `package-lock.json` is used by `npm ci`).
- A reachable LUNAS Express backend with MongoDB configured.
- Test accounts created by an administrator; this web app does not provide
  demo credentials or role switching.
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
the backend.

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
| `/incidents`, `/incidents/:id` | Compatibility redirects to the validation routes. | Same as destination |

Several older routes intentionally show a **Milestone Unavailable** boundary,
including `/reports`, `/notifications`, `/work-orders`, `/repairs`, `/sla`,
and later operations screens. They are not evidence that those workflows are
implemented. Do not use them as acceptance-test substitutes for
`/validation-routing`.

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

The queue passes `page`, `limit`, `search`, `category`, `barangay`,
`hasDuplicateCandidate`, `sortBy`, `from`, and `to` to the backend. The
complete public contract and payload examples are in
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
  engineer or administrator, and a utility-provider/repair account.
- [ ] Test reports exist: one submitted report in Barangay A, one submitted
  report in Barangay B, two similar submitted reports for duplicate testing,
  and one report with private evidence if evidence storage is configured.
- [ ] No tester is using a real resident's sensitive report or image.

### Browser: authentication, sessions, and profile

- [ ] Open `/login`; confirm no seeded/demo credentials or role-preview
  controls are displayed.
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

### Browser: citizen outcome checks (25% + 50%)

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
- [ ] Confirm utility-provider and repair-personnel accounts see the truthful
  later-workspace boundary, not an invented validation queue or sample data.

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

The following are intentionally not complete in the web platform at the 50%
milestone:

- Citizen report creation/evidence capture in the browser (the 25% submission
  flow is mobile).
- Work-order creation, assignment, repair-personnel operations, repair
  evidence/progress, completion, verification, and closure.
- A utility-provider repair workspace or provider queue in the browser.
- Live notifications center, full analytics, and SLA reminder/escalation UI.
- Automated SLA escalation. The SLA deadline is initialized on validation;
  backend automation remains explicitly opt-in and later scope.
- Authoritative geographic boundaries, organization registry validation, and
  map-provider enhancements.
- Approved AI hazard classification or face/license-plate redaction. The app
  does not claim automatic AI classification or image redaction.
- End-to-end browser automation for authenticated, multi-role validation
  scenarios. Those need stable test identities and live test infrastructure.

Older compatibility/stub routes remain in the source tree, but they are not a
claim that those later workflows are ready. Keep acceptance testing focused on
the supported routes and state machine documented above.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Login reports that LUNAS is unavailable | Confirm the backend is running, `LUNAS_API_URL` is reachable from the Next.js server, and its API path resolves to `/api/v1`. |
| Production build/session fails with secret error | Set a non-empty, high-entropy `LUNAS_SESSION_SECRET`; restart all web instances using the same intended secret. |
| Browser repeatedly returns to login | Check the encrypted cookie is not blocked, the system clock is accurate, the refresh token is valid, and the proxy can reach `/auth/refresh`. |
| Official sees no reports | Confirm there are `submitted` reports in that account's backend scope and verify the official's barangay/role assignment in the backend. |
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
| `tests/shared-screens.spec.ts` | Current Playwright public/protected-route smoke coverage. |
