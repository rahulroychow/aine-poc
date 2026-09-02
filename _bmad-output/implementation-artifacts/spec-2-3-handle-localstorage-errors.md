---
title: 'Handle localStorage errors gracefully'
type: 'feature'
created: '09-01-2026'
status: 'done'
baseline_commit: 'a3c9546'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** localStorage can fail (quota exceeded, corrupted data, disabled). Story 2-3 handles errors gracefully.

**Approach:** Wrap all localStorage operations in try-catch. On quota exceeded: clear oldest todos and retry. On corrupted data: reset to empty array. On access denied: fall back to in-memory only. Show user-friendly messages.

## Boundaries & Constraints

**Always:**
- Catch and handle all localStorage errors
- Quota exceeded: clear oldest todos, retry save, show message
- Corrupted JSON: reset to empty array, show message
- Access denied: continue with in-memory only, show message
- Never crash or lose user's current work

**Never:**
- Do not implement complex recovery strategies
- Do not require user interaction to recover

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| localStorage quota exceeded | User adds todo after quota filled | Oldest todos cleared, new todo saved, user notified | Show message |
| Corrupted JSON in localStorage | Load triggers on mount | Invalid JSON caught, empty state used, message shown | Reset to empty |
| localStorage disabled | Private browsing mode | All saves skipped, app works in-memory only | Fall back gracefully |

</frozen-after-approval>

## Code Map

- `src/App.jsx` -- Wrap localStorage saves in try-catch with error handling
- `src/App.jsx` -- Wrap localStorage loads in try-catch with fallback

## Tasks & Acceptance

**Execution:**
- [x] `src/App.jsx` -- Add try-catch to save operation, handle quota exceeded and other errors -- Graceful error handling
- [x] `src/App.jsx` -- Add try-catch to load operation, handle corrupted data and access errors -- Graceful recovery

**Acceptance Criteria:**
- Given localStorage quota is exceeded, when user tries to save, then oldest todos are cleared and new todo is saved
- Given localStorage contains corrupted JSON, when app loads, then error is caught and empty array is used
- Given localStorage is not accessible, when app loads, then app continues with in-memory storage and shows message
