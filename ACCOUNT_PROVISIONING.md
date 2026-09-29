# Authorized personnel account provisioning

Citizen accounts may self-register. Personnel receive access only after their
responsible organization approves them offline and an authorized LUNAS
administrator provisions the approved role and jurisdiction.

For the authoritative role, platform, and incident/work-order workflow, see
[LUNAS_PROJECT_SCOPE.md](./LUNAS_PROJECT_SCOPE.md).

## Assessment before implementation

The existing Express/Mongoose backend already had six canonical roles, bcrypt
password hashing, citizen registration with email OTP, short-lived access tokens,
rotating refresh tokens, token-version revocation, password reset, audit logs,
and incident/work-order jurisdiction checks. Mobile registration explicitly sent
`citizen`. Utility providers already existed and remain organization-scoped.

User administration was partial: protected update/archive endpoints existed, but
there was no personnel creation or first-login activation endpoint, approval
metadata, or complete status lifecycle. The web administration route was a
placeholder; its unused console rendered mock records.

The audit found these conflicts, now addressed:

- Registration retries could overwrite an inactive, unverified personnel account.
  Retry and citizen OTP operations now require a citizen account.
- Generic admin updates could assign privileged roles without approval fields or
  a separate administrator-management restriction. The legacy update URL now uses
  the same approved-account validation and policy as the new URL.
- General user reads were not scoped to the requesting barangay official.
- Repair assignment access did not consider a worker's current organization or
  barangay after a transfer. Both now constrain access; historical assignments
  remain stored.
- Audit records had a one-year TTL index. The model no longer declares it, and an
  explicit migration removes it from existing databases.
- Development citizen OTP responses could expose codes. That option was removed.

There was no Pending Approval account model to remove. Organizational approval
and technical provisioning remain separate responsibilities.

## Workflow and screens

1. The responsible office verifies identity, position, office, role, and scope
   outside LUNAS.
2. An active administrator opens **Administration → Authorized accounts** at
   `/admin/users`, then **Create Authorized Account**.
3. The administrator records first/last name, email, phone, designation, office,
   role, applicable jurisdiction/provider/repair organization, optional personnel
   ID/team, approving authority, and approval reference or remarks.
4. The account is created as `pending_activation`, without a usable password or
   login session. Status is fixed at creation to prevent skipping password setup.
5. The email provider receives an expiring link to `/activate-account#token=…`.
   The administrator receives a delivery result, never the token or password.
6. The recipient sets a password. One conditional MongoDB update stores its bcrypt
   hash, consumes the token, marks the account active and verified, and invalidates
   prior sessions. Concurrent attempts cannot consume the same token twice.
7. The recipient signs in using the existing login flow. No session is issued by
   activation itself.
8. Administrators can view/edit approved account details, suspend, reactivate,
   deactivate, and resend pending activation links. Access changes require a
   confirmation dialog and a recorded reason. Edits revoke existing sessions.

The account list includes name/email, role, organization/jurisdiction, status,
search, pagination, and permitted actions. Approval details are restricted to
administrative account reads. `/admin/audit` displays account events and expandable
before/after changes. Existing LUNAS navigation, cards, forms, tables, and dialogs
are reused.

Statuses are Pending Activation, Active, Suspended, and Deactivated. Reactivating
an account that never completed activation returns it to Pending Activation; an
administrator must send a new activation email. Failed email delivery leaves the
account pending and recoverable. Resends rotate the token and have a one-minute
cooldown. Existing archived personnel can be reactivated through the audited
status endpoint. No account-management action hard-deletes records.

## Configuration and deployment

Add these values to the backend environment; examples are in
`lunas_backend/.env.example`:

```dotenv
ACCOUNT_ACTIVATION_APP_URL=https://your-web-app.example/activate-account
ACCOUNT_ACTIVATION_DELIVERY_URL=https://your-approved-email-provider.example/deliver
ACCOUNT_ACTIVATION_DELIVERY_TOKEN=your-provider-webhook-credential
ACCOUNT_ACTIVATION_EXPIRE_MINUTES=60
AUTHORIZED_ADMIN_PROVISIONER_IDS=
```

The activation lifetime is clamped to 10–1440 minutes. If the activation delivery
URL/token is omitted, the existing registration email delivery URL/token is used.
The provider must support this payload, deliver the link to the named recipient,
and keep credentials/links out of its own logs:

```json
{
  "type": "account_activation",
  "recipient": { "email": "person@example.test", "firstName": "Ana" },
  "activationUrl": "https://your-web-app.example/activate-account#token=<one-time-token>",
  "expiresAt": "<ISO timestamp>"
}
```

An HTTP success means the provider accepted the request; LUNAS does not claim
mailbox receipt. Real provider delivery requires deployment configuration and
has not been tested against a live mailbox. Production activation URLs require
HTTPS. Development allows HTTP only on localhost/127.0.0.1. The token is carried
in a URL fragment, then removed from browser history, so it is not sent in the
page request URL or referrer.

`AUTHORIZED_ADMIN_PROVISIONER_IDS` is a comma-separated list of **existing admin
MongoDB user IDs** permitted to create, elevate, edit, suspend, reactivate,
deactivate, or archive other administrators. The default empty list denies those
actions. It does not elevate any user into an admin. All active admins can manage
ordinary authorized personnel. Administrators cannot change their own access.
The initial administrator must be bootstrapped by the deployment operator through
its controlled offline process; public registration cannot create one. The
existing demo seed remains restricted to its local demo database.

Before deploying to an existing database, stop old backend instances that still
declare the TTL index and run this idempotent migration against the intended
`MONGODB_URI`:

```bash
cd lunas_backend
npm run migrate:account-retention
```

The migration removes only the ascending timestamp TTL index on `auditlogs`.
It does not delete data or modify users, incidents, or work orders. It cannot
recover audit records already expired before the migration. It was verified on
an isolated local database, including a second no-op run; it has not been run
against a deployment database.

User fields are additive and require no backfill. Existing `isActive` and
`isArchived` flags remain supported; legacy status is derived until a lifecycle
change writes `accountStatus`. Existing passwords remain valid. Repair personnel
may have citywide scope within their assigned organization, consistent with the
existing work-order policy; barangay officials must have a recognized barangay.

## API contract

All paths below are relative to `/api/v1`. Except activation, every new endpoint
requires an authenticated active `admin`; administrator targets additionally
require the configured allowlist.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/users/authorized` | Personnel list; search, role, status, page, limit; permitted role/scope options |
| POST | `/users/authorized` | Provision an offline-approved account and attempt activation email delivery |
| GET | `/users/authorized/:id` | Safe account details and approval metadata |
| PUT | `/users/authorized/:id` | Replace approved profile/assignment fields, with current `version` |
| PATCH | `/users/authorized/:id/status` | Set `active`, `suspended`, or `deactivated`, with `reason` and `version` |
| POST | `/users/authorized/:id/activation` | Resend/rotate activation link, with current `version` |
| POST | `/auth/activate-account` | Public, rate-limited token/password submission |
| PUT | `/users/:id` | Compatibility URL for the same controlled approved-account update |
| PATCH / DELETE | `/users/:id/archive` / `/users/:id` | Existing non-deleting archive; administrator-target restriction enforced |

A create payload:

```json
{
  "firstName": "Ana",
  "lastName": "Santos",
  "email": "ana@example.test",
  "phone": "09123456789",
  "position": "Barangay official",
  "organization": "Barangay Pantal",
  "role": "barangay_official",
  "barangay": "Pantal",
  "approvalAuthority": "Responsible superior",
  "approvalReference": "Offline authorization REF-001"
}
```

An edit uses the same fields without `email`, plus the `version` from the latest
account response. Optional fields: `personnelId`, `repairTeam`; role-specific
fields: `repairOrganization`, `utilityCompany`, `barangay`. Unknown fields,
client-authored passwords/status/verification during creation, missing approval,
invalid roles, and invalid/irrelevant assignments are rejected. Stale updates
return 409. Email is immutable in this workflow. Citizen-to-personnel conversion
is intentionally not supported through the generic user update URL.

The public registration, login, refresh, reset, and profile APIs remain in place.
Citizen registration cannot reserve or overwrite a personnel identity. Pending,
suspended, deactivated, and archived accounts cannot use protected endpoints;
password reset does not activate them. Self-profile updates continue to allow
only the existing personal fields, ignoring crafted role/jurisdiction fields.
Tokens and passwords are omitted from account responses and audit data. Normal
authentication still returns the access/refresh tokens required by existing
clients; the web keeps those in its encrypted HttpOnly BFF session.

## Audit events

`authorized_account_created` records the initial role, jurisdiction, status,
offline approval metadata, actor, and target. Further events:

- `account_activation_sent` (provider delivery result only)
- `account_activation_completed`
- `account_suspended`, `account_reactivated`, `account_deactivated`
- `role_changed`, `account_jurisdiction_changed`
- existing `user_updated`, `user_archived`, and denied-access audit events

Events retain actor/target IDs, timestamps, and applicable old/new values.
Password hashes, activation/reset tokens, OTPs, and related secret keys are
redacted. The existing audit writer is best-effort: database failures are logged
and do not roll back an account change. This implementation does not add a
transactional audit outbox or tamper-proof external archive.

## Validation

The backend integration suite uses real Express routes, JWT authorization,
Mongoose models, and an isolated local MongoDB database. Email HTTP calls are
stubbed; no real messages are sent. It covers all 15 requested acceptance cases:

| Cases | Verified behavior |
| --- | --- |
| 1 | Citizen registration and email OTP still activate a citizen |
| 2–4 | Every privileged role is rejected by public registration |
| 5 | All non-admin roles are denied provisioning and admin directory access |
| 6–7 | Approved personnel provisioning creates Pending Activation |
| 8 | Password hashing, expiry, rotation, replay rejection, and concurrent single use |
| 9–10 | Activated official retains role permissions and barangay scope |
| 11 | Crafted self-profile updates cannot elevate role or alter jurisdiction |
| 12 | Suspension/deactivation reject login, access, and refresh; old sessions stay revoked |
| 13 | Deactivation/transfer retain user references, incident actions, and work orders |
| 14 | Creation, activation, status, role, and jurisdiction audit records persist |
| 15 | Safe account serializers, secret redaction, no plaintext password storage or token disclosure |

Additional cases cover admin allowlisting, invalid/mass-assigned input, stale
updates, failed delivery, pending-account deactivation/reactivation, repair
transfers, and idempotent retention migration.

To rerun against a dedicated local MongoDB server (no database name or credentials
in this test URI):

```bash
cd lunas_backend
ACCOUNT_TEST_MONGODB_URI=mongodb://127.0.0.1:27129 npm test -- --runInBand --coverage=false
npm run lint
```

The suite generates a unique `lunas_accounts_test_*` database and drops only that
database after the run. Without the URI, integration tests are skipped.

Browser tests exercise the real Next.js pages and server actions with a local
API fixture. They cover creation, detail display, confirmation/required reason,
deactivation, narrow-screen overflow, citizen screen denial, and activation URL
fragment/password setup. They complement the real-database backend tests.

```bash
cd lunas_web
npm run lint
npm run build
ACCOUNT_UI_TESTS=true PLAYWRIGHT_PORT=3118 \
  LUNAS_API_URL=http://127.0.0.1:5119/api/v1 \
  LUNAS_SESSION_SECRET=isolated-browser-test-secret \
  npm run test:e2e
```

Use a dedicated test port. These tests do not reuse a running web server when
`ACCOUNT_UI_TESTS=true`. Production email delivery, production migration, and
mobile runtime testing remain deployment checks. The account-provisioning
feature did not change the mobile registration flow; see the current project
scope for Citizen and Repair Personnel platform responsibilities.

## Files and architecture boundaries

Backend additions: `utils/accountPolicy.js`, `middleware/accountValidation.js`,
`controllers/authorizedAccountController.js`, `services/accountActivationService.js`,
`scripts/remove-audit-ttl.js`, and `controllers/authorizedAccounts.integration.test.js`.

Backend modifications: User/AuditLog models; auth/user/audit controllers; auth/user
routes; auth/error middleware; existing audit sanitizer and barangay validator;
registration/reset delivery; work-order scope/controller; related regression
tests; package migration script and environment example.

Web additions: `/admin/users`, `/activate-account`, account server actions/shared
types, activation form, and account browser tests. Modifications: existing admin
console, `/admin` redirect, admin navigation/permissions, auth actions, audit
view/types, confirmation loading text, and configurable Playwright test port.

The existing project stores organizations/provider names as strings, not a
registry table. Role-specific required fields and length/type rules are enforced,
but LUNAS cannot certify that a named office/employer exists. Barangay values reuse
the repository's existing list. The approving authority is recorded text because
it may be external to LUNAS. This adds no online personnel application, public
privileged registration, document-verification, procurement, utility subsystem,
new role hierarchy, or new login MFA infrastructure.
