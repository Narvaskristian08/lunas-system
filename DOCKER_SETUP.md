# Docker development stack

The Compose file provides MongoDB, the Express API, Next.js web app, and the
optional Flask AI service. The running containers do not by themselves prove
the LUNAS workflow is ready: authentication secrets, storage, registration or
activation email, model files, and mobile device networking require
configuration. The [root README](./README.md) is the canonical local setup and
demo guide; product roles and transitions are defined in
[LUNAS_PROJECT_SCOPE.md](./LUNAS_PROJECT_SCOPE.md).

## Start MongoDB only

For host-run backend/web development, start the Compose database:

```bash
docker compose up -d mongodb
```

The default local URI is
`mongodb://admin:admin123@localhost:27017/lunas_db?authSource=admin`.
Replace the development credentials before exposing this database outside the
local machine.

## Start the Compose services

The root Compose file interpolates environment values from a root `.env` file.
Review `docker-compose.yml` and provide the required JWT, Turnstile,
registration delivery, storage, push, and web settings before starting the
full stack:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend web
```

The API health URL is `http://localhost:5000/health`; the web app is
`http://localhost:3000`; AI health, when enabled, is
`http://localhost:5001/api/v1/health`. MongoDB data is held in the Compose
volume. `docker compose down` stops services; removing volumes deletes local
database state.

The demo seeder intentionally accepts only a local hostname (`localhost`,
`127.0.0.1`, or `::1`) and database `lunas_db`. Run it from the host using a
local MongoDB URI as described in the root README; the container's internal
hostname `mongodb` is deliberately rejected by this guard.
