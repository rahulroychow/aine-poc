---
title: 'Save todos to localStorage when they change'
type: 'feature'
created: '09-01-2026'
status: 'done'
baseline_commit: 'a3c9546'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Todos disappear on page refresh. Story 2-1 persists todos to localStorage so they survive sessions.

**Approach:** In App component, add useEffect to watch todos state. Whenever todos change (add, toggle, delete), save to localStorage under key "aine-todos" as JSON.

## Boundaries & Constraints

**Always:**
- Save to localStorage after every todo change (create, toggle, delete)
- Use key "aine-todos" with JSON.stringify(todos)
- Persist within same session (page refresh)
- No cloud sync or multi-device sync

**Never:**
- Do not implement undo/history
- Do not add UI for manual save/load buttons

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| User adds a todo | todos state updated | Saved to localStorage immediately | N/A |
| User toggles completion | todos[0].completed toggled | Updated todo saved to localStorage | N/A |
| User deletes a todo | todo removed from state | localStorage updated with remaining todos | N/A |

</frozen-after-approval>

## Code Map

- `src/App.jsx` -- Add useEffect to watch todos state and save to localStorage

## Tasks & Acceptance

**Execution:**
- [ ] `src/App.jsx` -- Add useEffect with todos dependency, JSON.stringify and save to localStorage -- Persist on every change

**Acceptance Criteria:**
- Given a user adds a todo, when the add completes, then localStorage contains the new todo in "aine-todos" key
- Given a user toggles a todo, when toggle completes, then localStorage is updated with the new completion status
- Given a user deletes a todo, when delete completes, then localStorage is updated without that todo
