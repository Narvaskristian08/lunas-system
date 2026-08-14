# LUNAS 25% Milestone: Citizen Reporting Foundation

This document describes the historical first milestone, not the full product
roadmap. The 50% validation/routing extension is documented separately in
[MILESTONE_50.md](./MILESTONE_50.md). The repository contains models and
screens intended for later phases; their presence does not mean repair,
verification, closure, or analytics workflows are ready for production use.

## Supported citizen path

1. Create a citizen account or sign in.
2. Restore the session securely and show only citizen navigation.
3. Choose or capture one evidence image.
4. Confirm a supported category, GPS/map location, barangay, and description.
5. Review and submit the report.
6. Open **My Reports**, then a report detail and its server-authored status
   history.
7. Sign out and lose access to protected mobile/web routes.

Public registration always creates a `citizen` account. Official accounts are
not self-assignable, and the backend remains the authorization source of truth.

## Backend contract

The REST base URL is `http://localhost:5000/api/v1` by default.

| Area | Endpoint | Notes |
| --- | --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | Short-lived access tokens and rotating, hashed refresh tokens. |
| Account | `GET /auth/me`, `GET/PATCH /users/me` | Self-service profile only. |
| Password reset | `POST /auth/forgot-password`, `POST /auth/reset-password` | Delivery occurs only when a provider boundary is configured. |
| Categories | `GET /categories` | Uses active category records or the established incident category enum. |
| Reports | `POST /incidents`, `GET /incidents/my`, `GET /incidents/:id`, `GET /incidents/:id/history` | Citizen reads are ownership-protected. |

`POST /incidents` accepts `multipart/form-data` with `category`,
`description`, a JSON `location` field, and one to five `evidence` images.
The initial status is always `submitted`; its initial history entry and audit
events are created on the server. The server also returns advisory possible-
duplicate candidates based on matching category, recent time window, and
nearby coordinates. It never automatically rejects a report as a duplicate.

## Evidence, AI, and privacy truthfully represented

The backend decodes evidence with Sharp, applies modest dimensions/file-size
checks, re-encodes it to strip EXIF metadata, calculates a checksum, and stores
it with a non-predictable object key. Evidence URLs are signed for private
Supabase buckets.

No approved face/license-plate detector or hazard-classification model is
present in this repository. Consequently, the mobile app:

- keeps manual category selection available;
- labels automated quality scoring, hazard suggestion, and privacy redaction
  as unavailable rather than showing fabricated results; and
- asks the citizen to review evidence for private information before upload.

When citizen evidence is attached, the multipart API requires an explicit
`privacyAcknowledged=true` confirmation and records that acknowledgement in
safe evidence/audit metadata. This is a consent boundary, not a claim that
the image was automatically redacted.

The server persists this truthful privacy-processing state. Adding a real
model/provider is required before LUNAS can claim that faces or plates were
redacted or that a hazard category was inferred.

## Configuration

Copy `lunas_backend/.env.example` to `lunas_backend/.env` and provide, at a
minimum:

- `MONGODB_URI`
- a long random `JWT_SECRET` and a distinct `JWT_REFRESH_SECRET`
- `CORS_ORIGIN` containing each allowed browser origin
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
  `SUPABASE_STORAGE_BUCKET` to submit real evidence

Optional integrations are intentionally opt-in:

- `PASSWORD_RESET_APP_URL` plus `PASSWORD_RESET_DELIVERY_URL` for email/reset
  link delivery;
- `AI_EVIDENCE_ANALYSIS_ENABLED=true` and a deployed, model-backed AI service;
- private-bucket URL expiry and evidence quality thresholds described in the
  backend example environment file.

For mobile, pass the API base URL at runtime instead of committing it:

```bash
flutter run --dart-define=LUNAS_API_BASE_URL=http://10.0.2.2:5000/api/v1
```

For web, set a server-only `LUNAS_API_URL` (for Docker this can be
`http://backend:5000/api/v1`) and a long random `LUNAS_SESSION_SECRET`. The
web BFF keeps backend tokens in an encrypted, HttpOnly cookie rather than in
browser JavaScript.

## Local development

```bash
# terminal 1
cd lunas_backend
npm install
cp .env.example .env
npm run dev

# terminal 2
cd lunas_mobile
flutter pub get
flutter run --dart-define=LUNAS_API_BASE_URL=http://10.0.2.2:5000/api/v1

# terminal 3
cd lunas_web
npm ci
LUNAS_API_URL=http://localhost:5000/api/v1 \
LUNAS_SESSION_SECRET=replace-with-a-long-random-value \
npm run dev
```

MongoDB and configured Supabase storage are required for the complete evidence
submission path. A real mobile device should use the machine's reachable LAN or
HTTPS API address instead of Android emulator address `10.0.2.2`.

## Explicitly deferred

At the time of the 25% checkpoint, official validation/rejection and
jurisdiction routing were deferred. Those capabilities are now described in
the 50% milestone document. Work-order creation and assignment, repair progress
and evidence, verification/closure, full analytics, and production
AI/redaction-model integration remain later work.
