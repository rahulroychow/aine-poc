# Deferred Work

Issues identified during review but deferred for later focus.

## From Story 1-1: Display todo list on app load

- source_spec: `spec-1-1-display-todo-list-on-app-load.md`
  summary: Add automated testing framework (Jest/Vitest + React Testing Library)
  evidence: All acceptance criteria currently require manual verification via browser inspection. For production-quality code, stories should include unit and E2E tests to automate verification. Deferred for learning MVP; recommended for Epic 2 or future refactor story.

- source_spec: `spec-1-1-display-todo-list-on-app-load.md`
  summary: Implement performance monitoring and CI/CD integration
  evidence: Performance threshold (1000ms) is logged to console only. For production, should integrate with monitoring/analytics and CI performance budgets. Deferred for later DevOps/observability epic.

- source_spec: `spec-1-1-display-todo-list-on-app-load.md`
  summary: Add browser compatibility and polyfill support for older browsers
  evidence: Code uses modern JS (performance.now, optional chaining) without IE 9 fallbacks. Not required for learning MVP; defer to platform support expansion if needed.

- source_spec: `spec-1-1-display-todo-list-on-app-load.md`
  summary: Polish empty state UX (remove duplicate text and add loading spinner)
  evidence: Empty state shows "No todos yet" in both heading and paragraph. Loading screen shows only text, no spinner. Minor UX improvement; defer to UI polish story.
