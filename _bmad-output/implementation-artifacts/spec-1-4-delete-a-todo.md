---
title: 'Delete a todo'
type: 'feature'
created: '09-01-2026'
status: 'done'
review_loop_iteration: 0
baseline_commit: '6fd015d'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users can create and complete todos but cannot remove them. Story 1-4 enables the final core CRUD action.

**Approach:** Add delete button to each todo item in TodoList. On click, call deleteTodo() to remove the todo from the App state. Deletion is immediate and permanent (no undo). Visual feedback: button shows as trash/delete icon with hover state.

## Boundaries & Constraints

**Always:**
- Each todo item has a delete button (icon or text)
- Clicking delete removes todo immediately from list and state
- Deletion is permanent (no undo or confirmation dialog required per spec)
- Deletion works regardless of completion status (completed or active)
- If last todo deleted, empty state reappears
- All prior acceptance criteria (1-1, 1-2, 1-3) remain satisfied

**Ask First:**
- N/A

**Never:**
- Do not implement undo or trash/recovery
- Do not add confirmation dialogs
- Do not persist deletions yet; that's story 2-1

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| User clicks delete on active todo | Todo: description="Buy milk" | Todo removed from list immediately | N/A |
| User clicks delete on completed todo | Todo: completed=true | Todo removed from list immediately | N/A |
| Delete last remaining todo | 1 todo in list | Todo removed, empty state message reappears | N/A |
| Delete multiple todos sequentially | 5 todos → delete 1,2,3 → 2 remain | Each delete works independently, remaining todos display correctly | N/A |

</frozen-after-approval>

## Code Map

- `src/components/TodoList.jsx` -- Add delete button to each todo item, call onDeleteTodo callback
- `src/api/todoApi.js` -- Implement deleteTodo(id) function returning void
- `src/App.jsx` -- Add handleDeleteTodo callback to remove todo from state

## Tasks & Acceptance

**Execution:**
- [x] `src/api/todoApi.js` -- Implement deleteTodo(id) function -- API contract for deletion
- [x] `src/App.jsx` -- Add handleDeleteTodo callback, pass to TodoList -- Integrates deletion with state
- [x] `src/components/TodoList.jsx` -- Add delete button, call onDeleteTodo on click -- Enables user interaction

**Acceptance Criteria:**
- Given a todo exists, when user clicks delete button, then todo is removed from list immediately
- Given multiple todos exist, when user deletes one, then only that todo is removed (others remain)
- Given the last todo is deleted, when deletion completes, then empty state message reappears
- Given todos of mixed completion states exist, when user deletes any todo, then deletion works regardless of completion status

## Verification

**Commands:**
- `npm run build` succeeds
- `npm run dev` runs without errors

**Manual checks:**
- Click delete button on any todo → todo disappears from list immediately
- Multiple todos → delete one → others remain unchanged
- Delete last remaining todo → empty state message appears
- No console errors
