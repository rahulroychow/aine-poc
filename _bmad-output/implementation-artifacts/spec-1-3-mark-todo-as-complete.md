---
title: 'Mark todo as complete'
type: 'feature'
created: '09-01-2026'
status: 'done'
review_loop_iteration: 0
baseline_commit: '3e48900'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users can create todos but have no way to mark them complete. Story 1-3 enables the core todo completion action.

**Approach:** Add onClick handler to the read-only checkbox in TodoList. On click, call updateTodo() to toggle the completed status. Visual feedback: strikethrough on description, "Done" badge appears for completed todos. No persistence yet (that's story 2-1).

## Boundaries & Constraints

**Always:**
- Checkbox must be clickable (remove readOnly attribute)
- Clicking checkbox toggles completed: true ↔ false
- Visual feedback: completed todos show strikethrough + "Done" badge
- Completed todos remain in list (not deleted)
- Stories 1-1 and 1-2 acceptance criteria remain satisfied
- No persistence to localStorage in this story

**Ask First:**
- N/A

**Never:**
- Do not implement undo or history
- Do not add due dates, priorities, or other metadata
- Do not implement persistence; that's story 2-1

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| User clicks checkbox on active todo | Todo: completed=false | Checkbox becomes checked, description gets strikethrough, "Done" badge appears | N/A |
| User clicks checkbox on completed todo | Todo: completed=true | Checkbox becomes unchecked, strikethrough removed, "Done" badge disappears | N/A |
| Toggle multiple times | Sequential clicks | Each toggle works correctly, state stays in sync | N/A |
| Multiple todos mixed states | Some complete, some active | Both display correctly with appropriate visual indicators | N/A |

</frozen-after-approval>

## Code Map

- `src/components/TodoList.jsx` -- Update checkbox: remove readOnly, add onClick handler, call updateTodo
- `src/api/todoApi.js` -- Implement updateTodo(id, updates) function returning updated todo object
- `src/App.jsx` -- Add handleToggleTodo callback to pass down to TodoList

## Tasks & Acceptance

**Execution:**
- [x] `src/api/todoApi.js` -- Implement updateTodo(id, updates) function -- API contract for state changes
- [x] `src/App.jsx` -- Add handleToggleTodo callback, pass to TodoList component -- Integrates toggle with state
- [x] `src/components/TodoList.jsx` -- Remove readOnly from checkbox, add onClick handler, call updateTodo -- Enables interaction

**Acceptance Criteria:**
- Given a todo is active (completed=false), when user clicks checkbox, then todo becomes completed (completed=true) with strikethrough and "Done" badge
- Given a todo is completed, when user clicks checkbox again, then todo becomes active with strikethrough removed and "Done" badge hidden
- Given multiple todos exist with mixed states, when user toggles one, then only that todo's state changes
- Given user toggles a todo multiple times, then state remains in sync and visual indicators update each time

## Verification

**Commands:**
- `npm run build` succeeds
- `npm run dev` runs without errors

**Manual checks:**
- Click checkbox on any active todo → strikethrough appears, "Done" badge shows
- Click again → strikethrough removed, "Done" badge disappears
- Multiple todos toggle independently
- No console errors
