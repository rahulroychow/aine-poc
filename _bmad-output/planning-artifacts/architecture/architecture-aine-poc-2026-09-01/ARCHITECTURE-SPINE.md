---
title: "Aine POC: Architecture Spine"
status: final
created: 2026-09-01
updated: 2026-09-01
---

# Aine POC — Architecture Spine

## Paradigm

**Component-driven React with unidirectional data flow.** State lives in React components (or Context for shared state). Changes flow down via props; user actions flow up via callbacks. localStorage is the single source of truth for persistence; the UI is derived from it.

## Major Boundaries

```
┌─────────────────────────────────┐
│   React UI Layer                │
│  (Components, event handlers)   │
└──────────────┬──────────────────┘
               │ calls
┌──────────────▼──────────────────┐
│  API / Data Layer               │
│  (Mock API, localStorage bridge)│
└──────────────┬──────────────────┘
               │ reads/writes
┌──────────────▼──────────────────┐
│  localStorage                   │
│  (Persistent todo data)         │
└─────────────────────────────────┘
```

## Architecture Decisions

### AD-1: State Management Paradigm
**Binds:** React component state is the single source of truth for the UI. No Redux, Zustand, Context, or external state manager.

**Prevents:** Divergence on where state lives (a component managing its own todo list vs. a global store managing it).

**Rule:** Each component owns the state it displays. Lift state to the nearest common parent (App.jsx manages the todo list; TodoItem manages its own edit state if needed). No application-wide store.

---

### AD-2: Data Ownership & Persistence
**Binds:** localStorage is the single source of truth. UI state is always derived from localStorage data; localStorage is never overridden by cached/in-memory state.

**Prevents:** Stale data, divergence between what the UI shows and what's persisted.

**Rule:** Every mutation (create, complete, delete) first updates localStorage, then updates the UI to reflect it. On page load, hydrate the UI from localStorage.

---

### AD-3: API Layer Interface
**Binds:** A mock API layer sits between the React UI and localStorage, exposing a simple async CRUD interface:
- `getTodos()` → Promise<Todo[]>
- `createTodo(description: string)` → Promise<Todo>
- `updateTodo(id: string, updates: Partial<Todo>)` → Promise<Todo>
- `deleteTodo(id: string)` → Promise<void>

**Prevents:** Components directly manipulating localStorage; tight coupling between UI logic and persistence logic.

**Rule:** All data reads/writes go through the API layer. Components never call `localStorage.getItem()` or `localStorage.setItem()` directly.

[ASSUMPTION: Mock API returns data instantly (no simulated latency); confirm if latency simulation is desired.]

---

### AD-4: Data Schema (localStorage)
**Binds:** All todos stored in localStorage under a single key `"aine-todos"` as a JSON object:
```json
{
  "todos": {
    "<uuid>": {
      "id": "<uuid>",
      "description": "<string>",
      "completed": <boolean>,
      "createdAt": "<ISO 8601 timestamp>"
    },
    ...
  }
}
```

**Prevents:** Inconsistent todo shapes, multiple storage keys, data corruption on malformed JSON.

**Rule:** The API layer owns serialization/deserialization. Components work only with the Todo object shape above.

---

### AD-5: Responsive Design
**Binds:** Single React codebase with CSS media queries for responsive layout. No separate mobile app.

**Prevents:** Code duplication, divergent UX between desktop and mobile.

**Rule:** Breakpoints at 640px (mobile), 1024px (tablet/desktop). All interactive elements are touch-friendly (48px+ tap targets on mobile).

[ASSUMPTION: Plain CSS with breakpoints; confirm if a CSS framework (Tailwind, shadcn) is preferred.]

---

### AD-6: Error Handling
**Binds:** API layer catches localStorage errors (quota exceeded, corrupted data) and surfaces them via promise rejection. UI handles rejections gracefully.

**Prevents:** Silent failures, data loss, unclear error states.

**Rule:** 
- localStorage quota exceeded: Clear oldest todos, retry operation, show user message.
- Corrupted data: Reset to empty list, log to console, show recovery message.
- All API errors propagate to the calling component as promise rejections.

---

### AD-7: Component Structure
**Binds:** At minimum: `<App />` (root, manages todo list state), `<TodoList />` (renders list), `<TodoItem />` (renders single todo, delete/complete buttons), `<TodoForm />` (input and create).

**Prevents:** Monolithic components, unclear responsibility.

**Rule:** Each component has a single, clear responsibility. Props flow down; callbacks flow up. No prop drilling beyond 2 levels; use Context for widely-shared state if needed.

[ASSUMPTION: This structure; confirm if you envision a different component tree.]

---

## Deferred

- **Build tool:** Vite (assumed; confirm if preference differs).
- **Error message copy & tone:** Handled in UX design.
- **Performance targets:** Ad-hoc optimization after implementation; no pre-emptive caching or indexed queries needed for initial scope.

---

## Assumptions

- React + Vite + component state only (no Context, Redux, Zustand).
- Tailwind CSS for styling.
- Mock API is synchronous (instant returns, no latency simulation).
- Responsive design via Tailwind breakpoints, single codebase.
- No authentication, no multi-user, no cloud sync.

---

## Next

Distill this spine into **Epics & Stories** (`bmad-create-epics-and-stories`), breaking each AD and feature into implementable tasks.
