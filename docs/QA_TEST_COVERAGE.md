# Test Coverage Report

Measured on 2026-09-01 with Vitest 4.1 and the V8 coverage provider.
Thresholds in `vitest.config.js` are pinned at 100% on all four metrics, so
`npm run test:coverage` fails the moment any path stops being exercised.

## Numbers

| Metric | Covered | Percentage |
| --- | --- | --- |
| Statements | 144 / 144 | 100% |
| Branches | 67 / 67 | 100% |
| Functions | 39 / 39 | 100% |
| Lines | 137 / 137 | 100% |

| Suite | Runner | Count |
| --- | --- | --- |
| Unit and component (jsdom) | Vitest | 65 |
| Server integration (node) | Vitest + supertest | 23 |
| End-to-end, per browser | Playwright | 23 (13 journeys, 10 accessibility) |
| End-to-end, total runs | Playwright, 3 engines | 69 |

The training target was 70%.

## What is excluded and why

| File | Reason |
| --- | --- |
| `src/main.jsx` | Mounts React into the DOM and logs a load-time metric. No branch a unit test could meaningfully assert; the mount is exercised by every E2E test. |
| `server/server.js` | Binds a port and wires signal handlers. The behaviour it wraps is `server/app.js`, which is fully covered. The bootstrap is exercised by the Docker health checks. |

Nothing else is excluded. Test files, `e2e/`, and config are outside the
measured set by default.

## Is it meaningful?

100% line coverage says every line ran, not that every line was checked. The
AI-assisted gap analysis looked for tests that execute code without
constraining it. What was found and changed:

- **The localStorage double did not store.** Early persistence tests passed
  because the mock's `getItem` returned null regardless of what had been set.
  Lines were covered; nothing was proven. The double in `src/test/setup.js`
  now keeps state, which is what made the quota-exceeded, SecurityError and
  corrupt-JSON paths testable at all.
- **A suite that contributed zero tests.** `TodoForm`'s tests lived in a `.js`
  file containing JSX and failed to parse. Vitest reported green because the
  file produced no tests. Renamed to `.jsx`; the suite now has 13 tests.
- **Guards unreachable through the UI.** `App.jsx` returns early when asked
  to toggle an id it does not know. No click can produce that, so
  `App.guards.test.jsx` drives the handler directly. Without it the branch
  would be a coverage hole or, worse, deleted as dead code.
- **Test scaffolding in production.** A `window.__todoStore` global had been
  added so tests could reach the API seam's store. Replaced with a
  module-level store and an exported `__resetStore()`.

Added in this review pass:

- **Schema validation on rehydrate** (two tests): valid JSON that is not a
  list is treated as corrupt; list entries without the todo shape are dropped.
- **XSS regression** (one test): a hostile description renders as inert text.

## Where the tests are thin

- **Message wording.** Story 2.3 specifies exact recovery messages. The tests
  assert that an alert fired and match on a keyword, not the full string.
- **Interaction timing.** The stories' under-100 ms targets are not asserted.
  Lighthouse's 0 ms Total Blocking Time is the indirect evidence.
- **Ordering across reload.** E2E asserts newest-first after creation and that
  todos survive a reload, but not the combination with several todos.
- **Screen readers.** axe covers roughly a third to a half of WCAG. No
  assistive-technology walkthrough has been done.
- **Mutation testing** has not been run. It is the right next step for
  deciding whether 100% line coverage is 100% assertion strength.

## Layout

Tests sit next to the code they cover: `todoApi.js` beside
`todoApi.test.js`. Two Vitest projects keep the React code in jsdom and the
Express code in node. `e2e/` belongs to Playwright and is excluded from both.
The full story-to-test mapping is in `TEST_STRATEGY.md`.

## Reproduce

```bash
npm run test:coverage     # unit + component + server, fails below 100%
npm run test:e2e          # 23 tests × 3 browsers
npm run test:all          # both
open coverage/index.html  # HTML report
```
