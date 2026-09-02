# Security Review

Reviewed on 2026-09-01: every file under `src/`, `server/`, `docker/`, the
root config, and the dependency tree via `npm audit`. The review looked for
the OWASP Top 10 categories that apply to a client-side React app with a
health-check Express service, and for container hardening.

An earlier security review in this repository's history reported an OWASP
compliance table for a review that had not been performed. It was deleted
(commit e2b304f). This document records what was actually examined.

## Scope and threat model

Aine TODO is a single-user app whose data lives in one browser's
localStorage. There is no authentication, no server-side data, no database
and no user-to-user data flow. The realistic threats are:

1. Malicious content in a todo description executing in the page (XSS).
2. Tampered or foreign data under the app's localStorage key crashing or
   subverting the app.
3. Vulnerable dependencies, in the shipped bundle or in the developer's
   toolchain.
4. The Express service leaking information or accepting hostile input.
5. Container misconfiguration widening the blast radius of any of the above.

Out of scope because the features do not exist: authentication, sessions,
CSRF, authorisation, SQL or command injection, secrets management for
third-party services.

## Findings

| # | Area | Finding | Severity | Status |
| --- | --- | --- | --- | --- |
| 1 | Dependencies | `vite@4.5.14` carried one high and one moderate advisory (dev server file-serving and esbuild request-forwarding). Production dependencies had zero. | High (dev-only exposure) | **Remediated** |
| 2 | Stored data | Rehydration trusted any valid JSON under `aine-todos`. A tampered object, `null`, or a list of non-todos crashed the render. | Low | **Remediated** |
| 3 | XSS | Descriptions are rendered through React text nodes and attribute bindings, which escape. No `dangerouslySetInnerHTML`, no `innerHTML`, no `eval`. | None | **Pass**, regression test added |
| 4 | Server CORS | `cors()` with defaults allows any origin. Endpoints are public and read-only. | Low | Accepted, see recommendations |
| 5 | Security headers | Neither `serve` nor Express send CSP, `X-Content-Type-Options` or frame-ancestors headers. | Low | Accepted, see recommendations |
| 6 | Error handling | Error handler exposes `err.message` only when `NODE_ENV=development`; honours `err.status`. Covered by 6 tests. | None | **Pass** |
| 7 | Request bodies | `express.json()` default 100 kB limit; malformed JSON returns 400. | None | **Pass** |
| 8 | Static serving | `express.static` plus a fixed `sendFile` path; no user input reaches the filesystem. | None | **Pass** |
| 9 | Info disclosure | Health endpoints expose `environment` and `uptime`. | Info | Accepted |
| 10 | Input length | 500-character cap is an HTML `maxLength` attribute only; the API seam does not enforce it. | Low | Accepted, see recommendations |
| 11 | ID generation | `Math.random()` UUIDs. IDs are local and never used for authorisation. | Info | Accepted, see recommendations |
| 12 | Secrets | No secrets in the repo. `.env` is git- and docker-ignored; `.env.example` holds only ports and log level. | None | **Pass** |
| 13 | Containers | Multi-stage builds, non-root `appuser` (UID 1001) verified with `id` in both running containers, dev dependencies excluded from the server image, source maps off. | None | **Pass** |
| 14 | Supply chain | Base image `node:22-alpine` and globals `npm@11`, `serve@14` are pinned by major only, not digest or exact version. | Low | Accepted, see recommendations |

## Detail on remediated findings

### 1. Dependency advisories

`npm audit` before:

```
esbuild  moderate  GHSA-67mh-4wv8-2f99  dev server accepts requests from any website
vite     high      GHSA-g4jq-h2w9-997c and six further advisories, all in the dev server
                   (server.fs.deny bypasses, path traversal in optimized deps, launch-editor on Windows)
```

All affected code runs only in `vite dev` and `vite preview`; nothing from
these packages ships in `dist/`. `npm audit --omit=dev` reported zero
vulnerabilities before and after. The exposure was to the developer's machine
while the dev server was running, not to users.

Remediation: `vite` upgraded from 4.5.14 to 8.2.2 and `@vitejs/plugin-react`
from 4.7.0 to 6.1.1, which also aligns the app's Vite with the one Vitest 4
already depended on. After the upgrade `npm audit` reports zero
vulnerabilities at every severity. The full battery was re-run: 88 unit and
component tests, 100% coverage, 69 E2E runs, production build, Docker stack
to healthy, Lighthouse 100 on both form factors.

### 2. Untrusted data under the app's storage key

`App.jsx` parsed `localStorage.getItem('aine-todos')` and passed the result
straight to state. The corrupt-JSON path was handled (story 2.3), but valid
JSON of the wrong shape was not: `{}` or `null` or `[1, 2]` under that key
produced `todos.map is not a function` and a blank page until the user
cleared site data. Anything sharing the origin (another app on the same
host, a browser extension, the user in DevTools) can write that key.

Remediation: rehydration now requires an array and keeps only entries with a
string `id` and string `description`, matching architecture decision AD-4. A
non-array is treated as corrupt and takes the existing recovery path. Two
tests cover the new branches; coverage stays at 100%.

### 3. XSS

Evidence reviewed: every render of `todo.description` is a JSX text child or
an attribute value (`aria-label`), both escaped by React. `grep` for
`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`,
`document.write` across `src/` returns nothing. The server never reflects
request input into HTML.

A regression test now renders the description
`<img src=x onerror="window.__xss = 1"><script>window.__xss = 2</script>` and
asserts it appears as heading text, that no `img` or `script` element exists
in the document, and that the side-effect variable was never set.

## Recommendations for the next release

Ordered by the point at which they become necessary.

1. **When `/api/todos` becomes real:** restrict `cors()` to the frontend's
   origin from an environment variable, enforce the 500-character description
   limit and the AD-4 schema server-side, add `helmet` for baseline headers,
   and add rate limiting on write endpoints.
2. **Content Security Policy.** The app has no inline scripts and no
   third-party origins, so a strict policy is cheap: `default-src 'self'` with
   `style-src 'self'` (Tailwind is compiled, not injected). Add it via a
   `serve.json` for the frontend container and `helmet` for the API.
3. **Pin container inputs.** Reference `node:22-alpine` by digest and pin
   `npm` and `serve` to exact versions so a rebuild is reproducible.
4. **`crypto.randomUUID()`** instead of `Math.random()` for IDs. Not a
   security issue today, but it removes a question that will be asked when
   IDs cross a network.
5. **Automate the audit.** Run `npm audit --omit=dev --audit-level=high` in
   CI so the gap that this review closed cannot reopen silently.

## Method

Manual reading of all source and configuration; `npm audit` and
`npm audit --omit=dev`; `grep` for dangerous sinks; inspection of the running
containers (`id`, health endpoints, 404 behaviour); Lighthouse best-practices
audit as a secondary check on headers and console errors. No dynamic
application security testing tool was run; there is no attack surface beyond
three GET routes and one text input for it to exercise.
