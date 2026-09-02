# Docker

Two images, one network, four compose files.

```
docker/
├── app.Dockerfile        Frontend: Vite build served by `serve` on :3000
├── server.Dockerfile     Backend: Express on :5000
├── compose.yml           Base stack — always included
├── compose.dev.yml       Development overlay
├── compose.test.yml      Test/CI overlay
└── compose.prod.yml      Production overlay
```

Both images build from the **repo root** (`context: ..`), so the Dockerfiles can
copy `package.json`, `src/` and `server/`. What gets excluded from that context
is set by `/.dockerignore` at the root, not here.

> **Unverified.** These files have not been built or run — Docker was not
> installed on the machine they were authored on. The application and its test
> suites are verified; this stack is not. Expect to shake out issues on the
> first `docker compose build`.

---

## Running

```bash
# Base stack
docker compose -f docker/compose.yml up --build

# With an overlay — base first, overlay second
docker compose -f docker/compose.yml -f docker/compose.dev.yml  up
docker compose -f docker/compose.yml -f docker/compose.prod.yml up -d
docker compose -f docker/compose.yml -f docker/compose.test.yml up --abort-on-container-exit
```

Or via the Makefile at the repo root:

```bash
make build   # build both images
make up      # base stack, detached
make dev     # development overlay, attached
make prod    # production overlay, detached
make logs    # follow both services
make ps      # status + health
make down    # stop and remove
```

`make help` lists everything.

| | App | Server |
| --- | --- | --- |
| URL | http://localhost:3000 | http://localhost:5000 |
| Container port | 3000 | 5000 |
| Host port | `$APP_PORT` (default 3000) | `$SERVER_PORT` (default 5000) |

---

## Overlays

Compose merges files left to right; the base is always first.

| Overlay | Changes |
| --- | --- |
| `compose.dev.yml` | `NODE_ENV=development`, `LOG_LEVEL=debug`, `restart: "no"` so a crash surfaces instead of looping. |
| `compose.test.yml` | `NODE_ENV=test`, `restart: "no"` to fail fast. Set `APP_PORT` / `SERVER_PORT` in the CI job to keep parallel runs off the same host ports. |
| `compose.prod.yml` | `restart: always`, CPU/memory limits and reservations, JSON log driver with 10 MB × 3 rotation. |

---

## Configuration

Copy the template and edit:

```bash
cp .env.example .env
```

| Variable | Default | Effect |
| --- | --- | --- |
| `NODE_ENV` | `production` | Selects the environment; the server echoes it from `/health` and only leaks error detail in `development`. |
| `APP_PORT` | `3000` | Host port for the frontend. |
| `SERVER_PORT` | `5000` | Host port for the server. |
| `LOG_LEVEL` | `info` | Server log verbosity. |

Overlays set `NODE_ENV` explicitly, so it is not read from `.env` when one is
applied.

---

## Health checks

Both containers declare a `HEALTHCHECK`, and `app` waits on
`server: condition: service_healthy` before starting — so `docker compose up`
brings them up in order.

```bash
docker compose -f docker/compose.yml ps      # STATUS column shows (healthy)
curl http://localhost:5000/health
```

The server exposes three endpoints, split so an orchestrator can treat restart
and traffic-routing as separate decisions:

| Endpoint | Answers | Response |
| --- | --- | --- |
| `GET /health/live` | Is the process up? Restart it if not. | `{ status, environment }` |
| `GET /health/ready` | Should it receive traffic? | `{ status, environment, uptime }` |
| `GET /health` | Combined summary — used by the container `HEALTHCHECK`. | `{ status, environment, uptime }` |

`curl` is installed explicitly in both runtime stages; `node:18-alpine` does not
ship it, and the `HEALTHCHECK` commands depend on it.

Readiness is currently shallow — it reports uptime, not the state of any
downstream dependency, because there are none yet. Deepen it when a database
arrives.

---

## Logs

```bash
docker compose -f docker/compose.yml logs -f          # both services
docker compose -f docker/compose.yml logs -f server   # one service
docker compose -f docker/compose.yml logs --tail=50 -t
```

Under `compose.prod.yml`, the JSON file driver caps logs at 10 MB × 3 files per
container.

---

## Image layout

Both Dockerfiles are two-stage: build (or dependency install) in the first
stage, copy only the result into a clean `node:18-alpine` runtime. Build tools
and dev dependencies never reach the shipped image.

Both run as a non-root user (`appuser`, UID 1001) created in the runtime stage,
with the copied files chowned to it.

**`app.Dockerfile`** — runs `npm ci && npm run build`, then copies just `dist/`
into the runtime stage and serves it with `serve`.

**`server.Dockerfile`** — installs production dependencies only
(`npm ci --omit=dev`), then copies `node_modules`, `package.json` and `server/`.
It deliberately does **not** copy `dist/`: the server is API-only in this stack,
and `server/app.js` skips static serving when the bundle is absent, answering
unknown routes with a JSON 404.

---

## Troubleshooting

**Port already in use** — override the host port:

```bash
APP_PORT=3001 SERVER_PORT=5001 docker compose -f docker/compose.yml up
```

**`app` never starts** — it waits for `server` to report healthy. Check the
server first: `docker compose -f docker/compose.yml logs server`.

**Health check always failing** — exec in and try it by hand:

```bash
docker compose -f docker/compose.yml exec server curl -v http://localhost:5000/health
```

**Stale build** — the context is the repo root, so a changed `.dockerignore`
invalidates differently than you might expect:

```bash
docker compose -f docker/compose.yml build --no-cache
```
