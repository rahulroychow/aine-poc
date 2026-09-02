---
title: 'Create a new todo'
type: 'feature'
created: '09-01-2026'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'e6168cf'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users can see an empty todo list but have no way to add todos. Story 1-1 created the display foundation; story 1-2 enables the first user action.

**Approach:** Add a form component (TodoForm) with an input field and submit button. On submit, create a new todo with a unique ID and timestamp, add it to the App state, and immediately display it in the list. Form resets after submission. No persistence yet (that's story 2-1).

## Boundaries & Constraints

**Always:**
- Input field must be visible and accessible when the app loads
- On submit, a new todo is created with: id (UUID), description, completed (false), createdAt (ISO timestamp)
- New todo appears immediately in the list (optimistic update)
- Form input field clears after successful submission
- Empty/whitespace-only submissions are rejected (no blank todos)
- Acceptance criteria from story 1-1 remain satisfied (empty state, responsive layout, <1s load)

**Ask First:**
- If form placement should be different (below list vs. above list), confirm before finalizing

**Never:**
- Do not implement persistence to localStorage; that's story 2-1
- Do not add validation beyond empty-check (no length limits, categories, tags yet)
- Do not create a separate page or modal for form; keep it in-line on the main view

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| User enters valid description | Input: "Buy milk" | Form submits, todo added to list, form clears, empty state disappears if first todo | N/A |
| User enters whitespace only | Input: "   " | Form does not submit, input remains, no todo created | N/A |
| User submits empty field | Input: "" | Form does not submit, input remains, no todo created | N/A |
| User adds multiple todos | Sequential valid inputs | Each todo appears in list with unique ID, incrementing timestamps | N/A |
| Large description text | Input: 500+ character string | Todo renders with description, text wraps or truncates appropriately | N/A |
| Form has no interference with display | App starts with todos | Form visible above/below list, todos still display correctly | N/A |

</frozen-after-approval>

## Code Map

- `src/App.jsx` -- Update to include TodoForm component and handleAddTodo callback
- `src/components/TodoForm.jsx` -- New component with input field, submit button, validation
- `src/components/TodoList.jsx` -- No changes; existing component displays todos from App state
- `src/api/todoApi.js` -- Implement createTodo() function (returns todo object with generated ID, timestamp)
- `src/utils/generateId.js` -- New utility to generate UUID for todos
- `src/index.css` -- Minimal updates if needed for form styling (use existing Tailwind classes)

## Tasks & Acceptance

**Execution:**
- [x] `src/components/TodoForm.jsx` -- Create form component with input field, submit button, validation -- Enables user input
- [x] `src/api/todoApi.js` -- Implement createTodo(description) function returning {id, description, completed: false, createdAt} -- API contract
- [x] `src/utils/generateId.js` -- Create UUID generator utility -- Ensures unique todo IDs
- [x] `src/App.jsx` -- Add TodoForm component, implement handleAddTodo callback, update todos state -- Integrates form with state
- [x] `src/index.css` -- Add form styling (input, button, spacing) using Tailwind classes -- Professional appearance

**Acceptance Criteria:**
- Given the TodoForm is rendered, when user types a description and clicks submit, then a new todo is created with unique ID and timestamp
- Given a new todo is added, when the submission completes, then the form input clears and the todo appears in the list
- Given todos previously existed and user adds a new todo, when the empty state was showing, then the empty state disappears and the new todo displays
- Given user enters only whitespace or empty input, when they click submit, then no todo is created and the form remains
- Given multiple todos exist from previous submissions, when user adds a new todo, then the new todo has a unique ID distinct from all existing todos
- Given the form is visible on the page, when the page loads or todos are displayed, then the form does not interfere with the todo list layout

## Verification

**Commands:**
- `npm run dev` -- dev server runs without errors; form is visible
- `npm run build` -- production build succeeds

**Manual checks:**
- Open app, see form with input field and button above/below empty state message
- Type "Buy milk" → click Add → form clears, todo appears in list with description "Buy milk"
- Type only spaces → click Add → error message "Please enter a todo description" appears
- Add 3 todos sequentially → each gets unique ID, all appear in list
- Inspect React DevTools: App state todos array contains newly created objects with correct shape
- No console errors or warnings

## Suggested Review Order

**Form Component & Input Handling**

- Form component with input validation, error display, loading state, and accessibility
  [`src/components/TodoForm.jsx:1-80`](../../../src/components/TodoForm.jsx#L1)

**App State Integration**

- App component handleAddTodo callback with error handling and form state management
  [`src/App.jsx:1-40`](../../../src/App.jsx#L1)

**API & Utilities**

- UUID generator utility for unique todo IDs
  [`src/utils/generateId.js`](../../../src/utils/generateId.js)

- Updated createTodo function with timestamp generation
  [`src/api/todoApi.js:1-20`](../../../src/api/todoApi.js#L1)
