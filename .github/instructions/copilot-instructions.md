# EmployeeManager Copilot Instructions

- Start complex tasks by reading docs/PROJECT_MEMORY.md before broad codebase searches. Treat it as the primary context source for architecture, routes, Pinia state, and shared UI structure.
- Update docs/PROJECT_MEMORY.md whenever you add or materially change a route, a Pinia store, or a reusable foundation component that affects multiple screens.
- When code changes touch UI, validate the running result with Chrome DevTools MCP instead of relying on code inspection alone. Check rendered DOM, console warnings or errors, and network activity for related API calls.
- Before recommending a commit after feature work, make sure the relevant local tests were run or explicitly state that they were not run. Use pnpm test:unit for unit coverage and pnpm test:e2e for browser flows when UI behavior changed.
- Do not change package.json version or create a release tag unless the user explicitly asks to prepare a new release.
