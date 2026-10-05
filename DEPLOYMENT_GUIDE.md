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
- Keep private S3 evidence storage private. The API issues authorized signed
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

## AWS EC2 + S3 deployment

The AWS target is deliberately split into two EC2 roles for the capstone:

- An application instance runs the Express API, the internal Python AI service,
  and an HTTPS reverse proxy. Ports 5000 and 5001 remain private.
- A separate database instance runs MongoDB on encrypted EBS with no public
  MongoDB ingress. Allow TCP 27017 only from the application security group.
- Evidence is stored in a private S3 bucket. The EC2 instance role receives
  only the required bucket/prefix permissions; no long-lived AWS keys belong
  in `.env` or client applications.
- Use Systems Manager Session Manager for administration instead of opening
  SSH to the internet. Send application and host logs to CloudWatch with a
  retention period and budget appropriate for the capstone.

The repository does not apply AWS resources automatically. The operator must
create the account, configure the region and DNS, review the security groups,
set the S3 bucket policy, and explicitly run the chosen infrastructure tooling.
The first deployment should be a single application instance and a single
database instance; high availability and a load balancer are later scaling
steps.

### S3 storage migration

Set `STORAGE_PROVIDER=s3`, `AWS_REGION`, and `S3_EVIDENCE_BUCKET`. New evidence
is privacy-processed and uploaded to S3 before the incident or work-order record
is persisted. URLs are generated on demand with the configured
`EVIDENCE_SIGNED_URL_EXPIRE_SECONDS` value.

Historical objects can be copied without changing their MongoDB keys:

```bash
cd lunas_backend
npm run migrate:storage -- --dry-run
npm run migrate:storage -- --apply
```

The migration is dry-run by default. It requires the Supabase service-role
credentials only for the migration process, preserves object keys, writes a
SHA-256 object metadata value, and verifies that value after each copy. Keep
`SUPABASE_MIGRATION_READ_ENABLED=true` only during the verification window;
disable it and remove the credentials after the cutover is accepted.

### MongoDB migration and rollback

Take a full `mongodump` before migration, restore it to the private database
instance, and verify collection counts, indexes, users, audit records, and the
partial unique notification index. Do not expose MongoDB publicly. Keep the old
deployment available until the AWS database and S3 objects pass the end-to-end
workflow checks.

If new writes have reached AWS, a rollback is not only a DNS change: pause
writes and reconcile the AWS database/object delta before returning to the old
deployment. Test this procedure before declaring cutover complete.

## Required and optional integrations

- Required for core container startup: MongoDB, distinct JWT secrets, the web
  session secret, internal BFF API URL, and Turnstile configuration.
- Required for real incident evidence: private S3 bucket access through the
  EC2 instance role. Supabase credentials are migration-only.
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

The API starts SLA at City prioritization and preserves that deadline through
repair, Provider review, corrective work, and City verification. Compose and both
environment examples now enable its in-process scheduler. AI output remains
advisory even when inference runs.

### SLA scheduler

- `SLA_AUTOMATION_ENABLED=true` enables monitoring after MongoDB connects. An
  unset flag or any value other than `true` disables it. Set it explicitly to
  `false` in tests, development sessions without monitoring, and API replicas
  that are not the designated scheduler. Existing `.env` files are not rewritten;
  remove a previous `false` override when enabling a deployed instance.
- `SLA_POLL_INTERVAL_MINUTES=5` checks incidents and work orders at five-minute
  boundaries and once at startup. Valid values are integers 1-59; this is a cron
  minute step, so choose a divisor of 60 for uniform spacing. Jobs use elapsed
  UTC timestamps; no business-hour calculations or pauses are introduced.
- Enable exactly one API process/replica per deployment. Repeated startup calls
  reuse the task; overlapping ticks in that process are skipped. Concurrent
  replica execution is protected against duplicate in-app notifications by a
  unique notification index, but there is no distributed scheduler lease.
- Startup creates the partial unique `idempotencyKey` notification index even
  if Mongoose automatic indexes are disabled. The database account must be able
  to create that index; startup fails instead of running without this guarantee.
- Deadline policy remains Critical 48, High 72, Medium 168, Low 336 elapsed hours.
  Keep the existing `SLA_*` environment overrides at these approved values.
  `SLA_APPROACHING_THRESHOLD_HOURS=24` remains the work-order warning threshold.
- Incident reminders retain 24/12/6/2 hours before the deadline. Overdue incidents
  enter the existing initial escalation stage. The assigned Utility Provider is
  notified; unrouted prioritized incidents notify active City Engineers. Work
  orders notify their current assignee and unique assigning/creating officials.
  Existing escalation level 2 includes active City Engineers, but the repository
  defines no time trigger for promotion to level 2; none is invented here.
- Repair completion and Provider acceptance do not stop SLA. City closure stores
  `met` or `breached` on both records based on the original deadline and closure
  timestamp. Rejection/duplicate store `cancelled`. Terminal records are no
  longer currently overdue; historical breach and deadlines remain available.
- Failed database operations and in-app deliveries are retried on later polls.
  Durable per-recipient keys prevent duplicate notifications after concurrent
  execution or a crash before delivery acknowledgment. Push delivery remains
  best effort through the existing notification service.

Run `npm run test:sla:live` from `lunas_backend` against a local MongoDB server.
Optionally set `SLA_TEST_MONGODB_URI` to an isolated test server. This check does
not load `.env`, disables OneSignal, generates and removes its own disposable
database, and waits up to 90 seconds for a real recurring cron callback. It
checks scheduled warning/escalation delivery, real unique-index idempotency,
concurrent retries, notification persistence failure recovery, and closure
normalization. This is local integration evidence; verify logs and persisted
alerts in the deployed environment before claiming deployment verification.
See [Revision 6 validation report](./REVISION_6_SLA_REPORT.md) for findings and
remaining limitations.

## Local-only data

The synthetic seed is guarded to localhost and database `lunas_db`. Never point
it at a shared or production database. The full local sequence and role demo
accounts are listed in the [root README](./README.md).
