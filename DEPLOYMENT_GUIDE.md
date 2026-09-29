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
