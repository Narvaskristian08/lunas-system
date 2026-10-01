# Deployment notes

This is infrastructure guidance, not a separate product/workflow definition.
Use [LUNAS_PROJECT_SCOPE.md](./LUNAS_PROJECT_SCOPE.md) for roles, record
authority, account governance, and incident/work-order transitions.

## Services and configuration

- Run the Express API with a supported Node.js runtime and a protected MongoDB
  deployment. Restrict MongoDB network access to the API and use an
  application-specific database user.
- Deploy the Next.js web BFF with a unique high-entropy `LUNAS_SESSION_SECRET`,
  the correct `LUNAS_API_URL`, secure production cookies, and an exact CORS
  allowlist on the API.
- Build the Flutter app with a reachable HTTPS API URL. Do not bundle backend,
  storage service-role, or email-delivery secrets into the client.
- Keep private evidence storage private. The API issues authorized signed
  retrieval URLs; do not make the evidence bucket public.
- Configure registration/activation email, Maps, optional push, and AI only if
  used. Check `lunas_backend/.env.example`, `lunas_web/.env.example`, and
  `lunas_ai/.env.example` for the current variable names.
- Bootstrap the first Admin through a controlled deployment process. Public
  registration creates Citizens only. Provision other authorized personnel
  after external approval using the Admin account process.

## Docker Compose deployment

The default Compose deployment contains MongoDB, the Express API, the Next.js
BFF, and the advisory AI service. MongoDB and AI are private to the Compose
network. Web and API ports bind to `127.0.0.1` unless their bind-address
variables are deliberately changed for an approved reverse proxy or firewall.
The optional mongo-express service is available only with the `dev` profile.

1. Copy `.env.example` to `.env` at the repository root.
2. Replace every `replace_...`/`your_...` value. At minimum Compose requires:
   `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`, `JWT_SECRET`,
   `JWT_REFRESH_SECRET`, `LUNAS_SESSION_SECRET`, `TURNSTILE_SECRET_KEY`,
   `TURNSTILE_ALLOWED_HOSTNAMES`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, and
   `CORS_ORIGIN`.
3. Use distinct, randomly generated values of at least 32 characters for the
   JWT access, JWT refresh, web session, and registration MFA secrets. MongoDB
   credentials used by this Compose file must be URL-safe.
4. Validate and start the deployment:

```bash
docker compose config --quiet
docker compose build
docker compose up -d
docker compose ps
```

The BFF uses the private runtime URL
`LUNAS_API_URL=http://backend:5000/api/v1`. `NEXT_PUBLIC_API_URL` is a separate
browser-facing build variable and must never be set to a Docker-only hostname.
The web service runs `.next/standalone/server.js`, not `next start`.

Readiness checks are dependency-aware: MongoDB authenticates before becoming
healthy, the API requires a live MongoDB connection at `/health/ready`, and the
web check at `/api/health` verifies that its internal API route can reach the
backend. Compose dependency conditions replace fixed startup sleeps.

For local database inspection only:

```bash
docker compose --profile dev up -d mongo-express
```

Do not enable that profile on a public host. To stop the stack without deleting
database volumes, run `docker compose down`. Do not add `-v` unless permanent
database removal is intentional.

## Required and optional integrations

- Required for core container startup: MongoDB, distinct JWT secrets, the web
  session secret, internal BFF API URL, and Turnstile configuration.
- Required for real incident evidence: private Supabase storage credentials.
- Required for citizen registration and personnel activation: the configured
  delivery webhook/provider and its token.
- Optional/degradable: AI inference, OneSignal push, password-reset delivery,
  and Maps. Set `AI_SERVICE_ENABLED=false` and
  `AI_EVIDENCE_ANALYSIS_ENABLED=false` when the AI container/models are not
  deployed; reports remain subject to manual review.

The AI image excludes model weights and mounts `lunas_ai/models` at runtime.
Production operators must provision approved weights there before claiming AI
availability. A healthy AI process does not prove every model is loaded.

## Troubleshooting

- `LUNAS_SESSION_SECRET must be configured`: generate a new deployment-only
  secret; do not reuse either JWT secret.
- Web reports backend `unreachable`: verify `backend` is healthy and that the
  web runtime uses `http://backend:5000/api/v1`, not localhost.
- Backend remains unhealthy: inspect MongoDB authentication and ensure the root
  username/password match the URL-safe values used to construct `MONGODB_URI`.
- Login CAPTCHA fails: verify the public/secret Turnstile key pair and exact
  public hostname allowlist. Dummy keys are local QA only.
- Browser CORS fails: add the exact public web origin to `CORS_ORIGIN`; do not
  add Docker service hostnames as browser origins.

## Operational checks

Before a release or demonstration, verify service health, login/refresh,
account activation delivery, evidence upload and signed retrieval, role/scope
enforcement, the full persisted incident handoff, notification configuration,
backup/restore, and audit retention against the target environment. A health
endpoint or a successful build alone does not prove end-to-end operation.

Priority-to-SLA deadline calculation is implemented in the API. Check
`SLA_AUTOMATION_ENABLED` and the deployed scheduler before claiming scheduled
reminders or escalations. AI output remains advisory even when inference runs.

## Local-only data

The synthetic seed is guarded to localhost and database `lunas_db`. Never point
it at a shared or production database. The full local sequence and role demo
accounts are listed in the [root README](./README.md).
