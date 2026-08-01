# LUNAS web integration notes

The shared web screens currently use typed, centralized mock services. They are intentionally not connected to FastAPI, PostgreSQL, S3, Google Maps, or Firebase yet. The interface never stores a password or authentication token in browser persistence.

## Preview assumptions

- The demo sign-in uses a signed, HttpOnly, eight-hour local session cookie.
- Demo password for the seeded authorized accounts is `LunasDemo!2026`.
- `carlo.mendoza@lunas.gov.ph` opens the System Administrator workspace. The other seeded user emails are in `src/lib/mock-data.ts`.
- The role preview control in the user menu exists only to verify permission-driven UI. Remove it when real administrative role management is connected.
- Dashboard charts, map markers, incident rows, notifications, and account metadata are realistic fixtures dated August 1, 2026.
- Profile images, support attachments, notifications, and form submissions simulate validation and progress but do not persist after a refresh.
- Notification deletion/archive is omitted because the business rule was not confirmed. Read/unread actions are implemented.
- Legal copy is clearly marked for legal review and must not be published as approved policy.
- Maintenance restoration estimates are rendered only when the service supplies one.

## FastAPI endpoints still required

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Validate credentials, account status, rate limits, and issue the production session/JWT. |
| `POST` | `/api/v1/auth/logout` | Revoke the active session and clear the session cookie. |
| `POST` | `/api/v1/auth/forgot-password` | Accept a recovery request with the same neutral response for known and unknown accounts. |
| `POST` | `/api/v1/auth/reset-password` | Validate reset token and password policy, then reset the password. |
| `POST` | `/api/v1/auth/verify` | Validate an account verification code or link token. |
| `POST` | `/api/v1/auth/verification/resend` | Resend verification with an authoritative cooldown value. |
| `GET` | `/api/v1/users/me` | Return the narrow viewer/profile DTO, role, organization, status, and effective permissions. |
| `PATCH` | `/api/v1/users/me` | Update only permitted personal profile fields. |
| `POST` | `/api/v1/users/me/avatar-upload` | Validate the image and return an S3 upload boundary or perform the upload. |
| `POST` | `/api/v1/users/me/change-password` | Validate the current password, update it, and return session-revocation policy. |
| `GET` | `/api/v1/dashboard/summary` | Return the role-scoped metrics, alerts, activity, map clusters, and priority records. |
| `GET` | `/api/v1/notifications` | Search, filter, sort, and paginate only notifications visible to the viewer. |
| `GET` | `/api/v1/notifications/{id}` | Return a permission-filtered notification detail DTO. |
| `PATCH` | `/api/v1/notifications/{id}/read` | Mark one notification read/unread. |
| `POST` | `/api/v1/notifications/read-batch` | Mark selected or all matching notifications as read. |
| `POST` | `/api/v1/support/tickets` | Create a support ticket with optional related record metadata. |
| `POST` | `/api/v1/support/tickets/attachment-upload` | Validate and upload support evidence to S3. |
| `GET` | `/api/v1/system/status` | Return full, service-specific, or read-only maintenance state and optional restoration estimate. |

## Authorization contract

The permission map in `src/lib/permissions.ts` drives navigation and presentation only. FastAPI must re-check authentication, role, effective permissions, organization scope, and record-level access for every request. Inaccessible related records should return a safe unavailable/restricted result instead of their title or contents.

Production session handling should replace the local mock gateway. Prefer an HttpOnly, `Secure`, `SameSite=Lax` cookie or an equivalently protected BFF session; do not expose JWTs to UI components or local storage. Preserve only validated relative return paths during sign-in and session-expiry redirects.
