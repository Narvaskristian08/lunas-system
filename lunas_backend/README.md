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
