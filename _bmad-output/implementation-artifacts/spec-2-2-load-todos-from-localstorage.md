---
title: 'Load todos from localStorage on app start'
type: 'feature'
created: '09-01-2026'
status: 'done'
baseline_commit: 'a3c9546'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 2-1 saves todos but 2-2 restores them on page load. Without restore, users lose todos on refresh.

**Approach:** In App component, on mount, check if localStorage has "aine-todos" key. If it exists and is valid JSON, hydrate todos state with the saved data. Otherwise, start with empty array.

## Boundaries & Constraints

**Always:**
- On app mount, load todos from localStorage "aine-todos" key
- If key doesn't exist, start with empty array []
- If JSON is invalid, fall back to empty array (story 2-3 handles errors)
- Load happens once on mount, before render

**Never:**
- Do not add UI for manual restore
- Do not sync during session (only on mount)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First load, no saved todos | localStorage empty | Start with empty array | N/A |
| Page refresh, todos exist | localStorage has "aine-todos" | Todos loaded and displayed on mount | N/A |
| Page refresh after multiple changes | localStorage has updated todos | All changes preserved, correct state displayed | N/A |

</frozen-after-approval>

## Code Map

- `src/App.jsx` -- Add useEffect on mount to load todos from localStorage

## Tasks & Acceptance

**Execution:**
- [x] `src/App.jsx` -- Add useEffect on mount that reads localStorage "aine-todos", parses JSON, sets todos state -- Restore on app start

**Acceptance Criteria:**
- Given a user adds todos and refreshes the page, when page loads, then todos are restored from localStorage
- Given localStorage is empty, when app loads, then todos start as empty array
- Given todos were modified multiple times, when page loads, then all saved changes are present
