# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: todos.spec.js >> Todo App E2E Tests >> should add a todo and display it in list
- Location: e2e/todos.spec.js:14:3

# Error details

```
Error: Channel closed
```

```
Error: locator.fill: Target page, context or browser has been closed
Call log:
  - waiting for getByPlaceholder(/enter.*description/i)

```

```
Error: browserContext.close: Target page, context or browser has been closed
```