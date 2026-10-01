# Docker development stack

The Compose file provides MongoDB, the Express API, Next.js web app, and the
optional Flask AI service. The running containers do not by themselves prove
the LUNAS workflow is ready: authentication secrets, storage, registration or
activation email, model files, and mobile device networking require
configuration. The [root README](./README.md) is the canonical local setup and
demo guide; product roles and transitions are defined in
[LUNAS_PROJECT_SCOPE.md](./LUNAS_PROJECT_SCOPE.md).

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
docker compose up -d --build
docker compose ps
docker compose logs -f backend web
```

The API health URL is `http://localhost:5000/health`; the web app is
`http://localhost:3000`. AI and MongoDB are private Compose services and do not
publish host ports. MongoDB data is held in the Compose volume.
`docker compose down` stops services; removing volumes deletes local
database state.

The demo seeder intentionally accepts only a local hostname (`localhost`,
`127.0.0.1`, or `::1`) and database `lunas_db`. Run it from the host using a
local MongoDB URI as described in the root README; the container's internal
hostname `mongodb` is deliberately rejected by this guard.
