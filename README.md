# Aine TODO

A small, single-user todo app: add a task, tick it off, delete it. Tasks
survive a refresh. That is the whole product, and it is deliberate — the scope
is kept narrow so the foundation stays easy to read and extend.

Built with React + Vite on the frontend and a small Express service that
currently exposes health endpoints and reserves the API surface for a future
server-backed store.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Run the tests:

```bash
npm test             # unit + component (Vitest)
npm run test:e2e     # end-to-end (Playwright, starts the dev server itself)
```

First E2E run only:

```bash
npx playwright install
```

---

## What it does

| Capability | Behaviour |
| --- | --- |
| Add | Type a description, press Enter or click **Add**. Empty and whitespace-only input is rejected with an inline error. Descriptions cap at 500 characters. |
| Complete | Tick the checkbox. Completed todos are struck through and badged **Done**. |
| Delete | Click the bin icon on any row. |
| Persist | Todos are written to `localStorage` on every change and restored on load. |
| Recover | Corrupt stored JSON, a blocked storage API, and an exceeded quota each get their own handled path rather than a blank screen. |

Not in this version: accounts, sync, priorities, due dates, reminders. The
architecture does not preclude them.

---

## Layout

```
aine-poc/
├── src/                      React app
│   ├── App.jsx               State, persistence, handlers
│   ├── App.test.jsx          Integration tests through the real UI
│   ├── App.guards.test.jsx   Guards unreachable via the real UI
│   ├── main.jsx              DOM bootstrap
│   ├── index.css             Tailwind entrypoint
│   ├── api/                  Todo API seam (+ tests)
│   ├── components/           TodoForm, TodoList (+ tests)
│   ├── utils/                generateId (+ tests)
│   └── test/setup.js         jsdom + localStorage test doubles
│
├── server/                   Express service
│   ├── app.js                The app — routes, health, error handling
│   ├── app.test.js           Supertest coverage of the above
│   └── server.js             Port binding and graceful shutdown
│
├── e2e/todos.spec.js         Playwright journeys
│
├── docker/                   Images and stack definition — see docker/README.md
│   ├── app.Dockerfile
│   ├── server.Dockerfile
│   ├── compose.yml           Base stack
│   └── compose.{dev,test,prod}.yml
│
├── _bmad/                    BMad tooling (installed framework)
├── _bmad-output/             PRD, architecture spine, epics, story specs
│
├── Makefile                  Docker shortcuts
├── vite.config.js
├── vitest.config.js
└── playwright.config.js
```

Tests sit next to the code they cover (`todoApi.js` / `todoApi.test.js`) rather
than in a parallel `__tests__` tree, so a file and its tests move together.

---

## Testing

Unit and component tests run under Vitest in two projects — the React code in
jsdom, the Express code in node — configured in `vitest.config.js`.

```bash
npm test                  # single run
npm run test:watch        # watch mode
npm run test:coverage     # coverage report; fails below 100%
npm run test:e2e          # Playwright, all three browsers
npm run test:all          # coverage + e2e
```

### Coverage

Coverage thresholds are pinned at **100%** for lines, branches, functions and
statements, so `npm run test:coverage` fails if any path stops being exercised.

Measured on the current tree:

```
Statements   : 100% ( 141/141 )
Branches     : 100% ( 61/61 )
Functions    : 100% ( 38/38 )
Lines        : 100% ( 134/134 )
```

85 unit/component tests, plus 13 end-to-end journeys × 3 browsers = 39 E2E runs.

Two files are excluded, both deliberately:

- `src/main.jsx` — mounts React into the DOM; no branching logic to assert.
- `server/server.js` — binds a port. The behaviour it wraps lives in
  `server/app.js`, which is covered.

An HTML report lands in `coverage/` after a coverage run.

### End-to-end

Playwright drives Chromium, Firefox and WebKit against the dev server, which it
starts and stops itself. Selectors go through accessible roles and names
(`getByRole('checkbox', { name: 'Mark "Buy milk" as complete' })`) rather than
CSS classes, so they survive restyling and assert the accessibility tree along
the way.

---

## Docker

```bash
docker compose -f docker/compose.yml up --build
```

App on `:3000`, server on `:5000`. Full detail — overlays, health checks, and
the reasoning behind the image layout — is in **[docker/README.md](docker/README.md)**.

`make help` lists the shortcuts.

---

## Architecture notes

**State lives in `App.jsx`.** `todos` is the single source of truth; `TodoForm`
and `TodoList` are presentational and talk upward through callbacks. Adding a
feature means extending App's state and passing it down, not introducing a
second store.

**Persistence is a `useEffect` on `todos`.** Every change writes the whole array
to `localStorage` under `aine-todos`. Cheap at this size, and it keeps the write
path in one place. The quota-exceeded path sheds the oldest half of the list and
retries once before falling back to memory-only.

**`src/api/todoApi.js` is a seam, not a client.** It keeps an in-memory record so
`updateTodo` merges against the stored todo the way a server would, which means
swapping in a real HTTP client later does not change any call site. It is
currently the only place that would need to change.

**The server is scaffolding.** It serves health endpoints for orchestration and
reserves `/api/todos`. Todos are still client-side; the endpoint says so in its
response rather than pretending otherwise.

Fuller reasoning lives in `_bmad-output/planning-artifacts/`.

---

## Known gaps

- **No server-side persistence.** Todos live in one browser's `localStorage`;
  clearing site data loses them, and nothing syncs across devices.
- **No accessibility or performance test suite.** The app uses semantic roles
  and ARIA labels throughout, and the E2E tests exercise them, but neither an
  axe-core audit nor a Lighthouse run has been done. Treat WCAG conformance and
  performance as unmeasured.
- **No authentication.** Single user, no access control.
- **Health checks are shallow.** `/health/ready` reports process uptime; it does
  not check any downstream dependency, because there are none yet.
