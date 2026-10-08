# Docker development stack

The Compose file provides MongoDB, the Express API, Next.js web app, and the
optional Flask AI service. The running containers do not by themselves prove
the LUNAS workflow is ready: authentication secrets, storage, registration or
activation email, model files, and mobile device networking require
configuration. The [root README](./README.md) is the canonical local setup and
demo guide; product roles and transitions are defined in
[LUNAS_PROJECT_SCOPE.md](./LUNAS_PROJECT_SCOPE.md).

## Fully local stack

The local stack includes an S3-compatible RustFS object store (exposed under
the Compose service name `minio`), so AWS access keys are not required for
local development. The helper creates a local `.env.local` with
development-only secrets and starts MongoDB, object storage, the backend, web
dashboard, and AI service:

```bash
./scripts/local-up.sh -d
docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.local.yml ps
```

The API is available at `http://localhost:5000`, the web dashboard at
`http://localhost:3000`, and the local object-store console at
`http://localhost:9001`.
Evidence is stored in the private `lunas-local-evidence` bucket. Do not use
these local credentials or the local S3 endpoint in production.

For a phone or another computer on the same LAN, set `BACKEND_BIND_ADDRESS`
and `WEB_BIND_ADDRESS` to `0.0.0.0`, set `CORS_ORIGIN` to the web origin, and
run the mobile client with the host computer's LAN address:

```bash
flutter run \
  --dart-define=LUNAS_API_BASE_URL=http://<computer-LAN-IP>:5000/api/v1
```

The AI API stays private to the Compose network. Toggle it with
`AI_SERVICE_ENABLED`, `AI_EVIDENCE_ANALYSIS_ENABLED`, and
`PRIVACY_REDACTION_ENABLED` in `.env.local`; restart Compose after changing
these values.

## Database development

The Compose MongoDB service is intentionally private and is consumed by the
containerized backend through the `mongodb` service hostname. Start the core
stack with:

```bash
docker compose up -d mongodb backend web
```

For a backend running directly on the host, use a separately installed local
MongoDB instance and `mongodb://localhost:27017/lunas_db`. Do not publish the
Compose database unless an explicit, loopback-only development override is in
place.

## Start the Compose services

The root Compose file interpolates environment values from a root `.env` file.
Review `docker-compose.yml` and provide the required JWT, Turnstile,
registration delivery, storage, push, and web settings before starting the
full stack:

```bash
docker compose --env-file .env.local \
  -f docker-compose.yml -f docker-compose.local.yml \
  up -d --build
docker compose --env-file .env.local \
  -f docker-compose.yml -f docker-compose.local.yml ps
docker compose --env-file .env.local \
  -f docker-compose.yml -f docker-compose.local.yml logs -f backend web lunas-ai
```

The API health URL is `http://localhost:5000/health`; the web app is
`http://localhost:3000`. AI, MongoDB, and the S3 API are private Compose
services; only the local object-store console is published for inspection.
MongoDB and object-store data are held in Compose volumes.
`docker compose down` stops services; removing volumes deletes local
database state.

The demo seeder intentionally accepts only a local hostname (`localhost`,
`127.0.0.1`, or `::1`) and database `lunas_db`. Run it from the host using a
local MongoDB URI as described in the root README; the container's internal
hostname `mongodb` is deliberately rejected by this guard.
