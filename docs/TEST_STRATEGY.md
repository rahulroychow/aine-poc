# Test Strategy: Stories to Tests

The training brief asked for unit, integration and E2E scenarios to be defined
as part of each story. In this project the stories were written first and the
tests afterwards, so this document is the retrospective mapping. Every test
named below exists and passes on the current tree.

Layers:

- **Unit**: pure functions and the API seam (`src/utils`, `src/api`) under Vitest/node.
- **Component**: `TodoForm`, `TodoList` rendered in isolation with React Testing Library.
- **Integration (frontend)**: `App` rendered with the real components and a stateful localStorage double.
- **Integration (server)**: Express app under supertest.
- **E2E**: Playwright against the dev server, Chromium + Firefox + WebKit.
- **Accessibility**: axe-core WCAG 2.1 A/AA per UI state, plus keyboard, focus and reflow checks.

Run everything with `npm run test:all`.

## Epic 1: Todo List Interface and Core CRUD

### Story 1.1: Display todo list on app load

| Acceptance criterion | Layer | Test |
| --- | --- | --- |
| Empty state message on first load | Component | TodoList: shows the empty state when there are no todos |
| Empty state message on first load | E2E | shows the empty state on first load |
| Todos displayed with description and status | Component | TodoList: renders one row per todo; labels the controls with the todo description |
| Todos displayed with description and status | Integration | App: restores previously saved todos; restores completion state |
| Responsive across mobile, tablet, desktop | E2E | works on a mobile viewport |
| Responsive across mobile, tablet, desktop | Accessibility | content reflows at 320px without horizontal scrolling |
| Page loads in under 1 second | Performance | Lighthouse: FCP 0.3 s desktop, 1.2 s throttled mobile (`QA_PERFORMANCE.md`) |

### Story 1.2: Create a new todo

| Acceptance criterion | Layer | Test |
| --- | --- | --- |
| Input reflects typing | Component | TodoForm: tracks the character count against the 500 limit |
| Empty submit creates nothing | Component | TodoForm: rejects an empty submit with an error and does not call the handler; rejects a whitespace-only submit |
| Empty submit creates nothing | E2E | rejects an empty submission; rejects a whitespace-only submission |
| New todo appears, input clears | Component | TodoForm: submits the typed description; clears the input after a successful submit |
| New todo appears, input clears | E2E | adds a todo and lists it |
| Enter submits | Component | TodoForm: submits on Enter |
| Enter submits | E2E | adds a todo with the Enter key |
| Unique id and timestamp | Unit | createTodo: returns a todo with id, description, completed and createdAt; assigns a distinct id per todo. generateId: matches the UUID v4 shape; distinct on every call |
| Empty state disappears | Component | TodoList: replaces the empty state once a todo exists |
| Newest first (ordering decision) | Integration | App: puts the newest todo first |
| Newest first (ordering decision) | E2E | lists the newest todo first |
| Failure path | Integration | App: alerts and leaves the list unchanged when creation fails |
| Failure path | Component | TodoForm: surfaces an error and keeps the text when the handler rejects |

### Story 1.3: Mark todo as complete

| Acceptance criterion | Layer | Test |
| --- | --- | --- |
| Toggle changes status immediately, visually distinct | Component | TodoList: strikes through a completed todo and badges it Done |
| Toggle changes status immediately, visually distinct | Integration | App: marks a todo done |
| Toggle changes status immediately, visually distinct | E2E | marks a todo complete |
| Toggle back reverts | Integration | App: toggles back to active |
| Toggle back reverts | E2E | toggles a todo back to active |
| Other todos unchanged | Integration | App: completes only the targeted todo, leaving its siblings alone |
| Other todos unchanged | E2E | tracks several todos independently |
| Mixed states distinguishable | Component | TodoList: leaves an active todo unchecked, unstruck and unbadged |
| Mixed states distinguishable | Accessibility | mixed complete and active todos have no WCAG A/AA violations |
| API merge semantics | Unit | updateTodo: applies the update; preserves fields the update did not mention; falls back to id + updates for an unknown id |
| Failure path | Integration | App: alerts and leaves the todo untouched when the update fails |

### Story 1.4: Delete a todo

| Acceptance criterion | Layer | Test |
| --- | --- | --- |
| Removed immediately, no confirmation | Component | TodoList: calls onDeleteTodo with the todo id |
| Removed immediately, no confirmation | E2E | deletes a todo |
| Other todos unchanged | Integration | App: deletes only the targeted todo |
| Other todos unchanged | Component | TodoList: targets only the clicked row when several todos are listed |
| Empty state reappears after last delete | Integration | App: removes the todo and restores the empty state |
| Completed todo fully removed | Unit | deleteTodo: removes the todo; leaves the other todos alone; is a no-op for an unknown id |
| Failure path | Integration | App: alerts and keeps the todo when the delete fails |

## Epic 2: Persistent Todo Storage

### Story 2.1: Save todos to localStorage when they change

| Acceptance criterion | Layer | Test |
| --- | --- | --- |
| Written under `aine-todos` with schema on create | Integration | App: persists the new todo to storage |
| Completion persisted | Integration | App: persists the completion state |
| Completion persisted | E2E | keeps completion state across a page reload |
| Deletion persisted | Integration | App: removes the todo and restores the empty state (asserts storage) |
| Valid JSON matching in-memory state | E2E | keeps todos across a page reload |

### Story 2.2: Load todos from localStorage on app start

| Acceptance criterion | Layer | Test |
| --- | --- | --- |
| Saved todos restored on refresh, same order and state | Integration | App: restores previously saved todos; restores completion state |
| Saved todos restored on refresh, same order and state | E2E | keeps todos across a page reload; keeps completion state across a page reload |
| Empty storage shows empty state, no errors | Integration | App: shows the empty state when storage is empty |
| Empty storage shows empty state, no errors | E2E | shows the empty state on first load |

### Story 2.3: Handle localStorage errors gracefully

| Acceptance criterion | Layer | Test |
| --- | --- | --- |
| Quota exceeded: shed oldest, retry, message | Integration | App: sheds the oldest todos and warns when the quota is exceeded |
| Quota exceeded even after shedding: memory only | Integration | App: falls back to in-memory state when even the reduced list will not fit |
| Corrupt JSON: reset and message | Integration | App: resets to an empty list when the stored JSON is corrupt |
| Storage unavailable: memory only, message | Integration | App: warns when storage is blocked by a SecurityError; warns when storage reports access denied without a SecurityError name |
| Read failure: start empty | Integration | App: warns and starts empty when storage reports a quota failure on read; warns and starts empty on any other read failure |
| Any save error caught, app continues | Integration | App: warns on any other write failure |
| Unknown todo id on toggle (guard) | Integration | App (guards): logs and returns without calling the update API |

## Server (orchestration, not a story)

| Behaviour | Layer | Test |
| --- | --- | --- |
| Liveness, readiness, combined health | Server integration | health endpoints: 5 tests |
| Reserved todos route states persistence mode | Server integration | GET /api/todos: reports that persistence is client-side for this release |
| JSON 404 without a bundle; SPA fallback with one | Server integration | without a frontend bundle: 2 tests; with a frontend bundle: 4 tests |
| Error handler status and detail leakage | Server integration | errorHandler: 6 tests |

## Cross-cutting accessibility

Seven axe audits (empty, populated, completed, mixed, validation error, 375 px,
320 px) plus keyboard reachability, visible focus indicator and 320 px reflow.
All in `e2e/accessibility.spec.js`, run on all three engines.

## Known gaps

- Story 2.3's exact message strings are not asserted; the tests check that an
  alert fires and what the list looks like afterwards.
- The under-100 ms interaction targets in stories 1.2 to 1.4 are not measured;
  Lighthouse reports Total Blocking Time of 0 ms, which is indirect evidence.
- No screen-reader walkthrough. axe covers roughly a third to a half of WCAG.
