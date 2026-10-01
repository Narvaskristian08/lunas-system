# LUNAS Web

Browser workspace for **Admin, Barangay Official, City Engineer, and Utility
Provider**. The current role authority and workflow are defined in the
[project scope](../LUNAS_PROJECT_SCOPE.md).

## Run locally

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Configure `LUNAS_API_URL` for the Express API and a unique,
high-entropy `LUNAS_SESSION_SECRET`. Open `http://localhost:3000`. The Next.js
server-side session keeps backend tokens out of browser JavaScript. Backend
configuration remains authoritative.

`LUNAS_API_URL` is private server runtime configuration. In Docker it must use
`http://backend:5000/api/v1`; never use host `localhost` to address the backend
container. `NEXT_PUBLIC_API_URL` is a separate build-time, browser-facing URL.
Production startup fails when `LUNAS_API_URL` or a non-placeholder
`LUNAS_SESSION_SECRET` of at least 32 characters is missing.

The Docker image uses Next.js standalone output and starts `server.js`
directly. Playwright uses the same standalone server via
`scripts/prepare-standalone.mjs`, which stages public/static assets before
`scripts/run-playwright.mjs` starts and reliably stops that server. This avoids
the unsupported `next start`/standalone combination and orphaned test servers.

## Role workspaces

| Role | Web responsibility |
| --- | --- |
| Admin | Authorized account provisioning/lifecycle and audit/system administration. No normal incident decision queue. |
| Barangay Official | Report review limited to the account's assigned barangay; initial validate/reject/duplicate decisions. |
| City Engineer | Citywide engineering review, manual priority/SLA, Utility Provider routing, and final repair verification. |
| Utility Provider | Organization-scoped incident and work-order management, Repair Personnel assignment, and completion review. |

Citizen and Repair Personnel are mobile roles; they cannot enter a government
web workspace. Navigation hiding is backed by role checks in the server data
access layer and by API authorization.

## Workflow screens

- `/validation-routing` gives Barangay Officials submitted reports and City
  Engineers Barangay-validated reports, with role-specific decision controls.
- `/work-orders` gives Utility Providers organization-scoped work-order
  management and City Engineers the provider-accepted final-verification queue.
- `/admin/users` and `/admin/audit` are administrative screens, not incident
  workflow screens.
- Notifications are loaded and changed through the authenticated API.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

The end-to-end tests require a browser install and a running web server/API
configuration as specified in `playwright.config.ts`. Passing static checks
does not prove live account provisioning, private evidence storage, or the
complete incident handoff. See the [root demo guide](../README.md).
