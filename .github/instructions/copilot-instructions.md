# EmployeeManager Copilot Instructions

- Start complex tasks by reading docs/PROJECT_MEMORY.md before broad codebase searches. Treat it as the primary context source for architecture, routes, Pinia state, and shared UI structure.
- Update docs/PROJECT_MEMORY.md whenever you add or materially change a route, a Pinia store, or a reusable foundation component that affects multiple screens.
- When code changes touch UI, validate the running result with Chrome DevTools MCP instead of relying on code inspection alone. Check rendered DOM, console warnings or errors, and network activity for related API calls.
- For UI implementation, prioritize Element Plus components first. Before writing any Element Plus related code, check the official documentation and prefer the library's existing capabilities over custom reimplementation: https://element-plus.org/zh-CN/component/overview
- Avoid overriding Element Plus internal component styles unless strictly necessary. Prefer component props, slots, built-in APIs, and CSS variables before any internal style override.
- If an internal Element Plus style override is unavoidable, keep the scope local to the current component and document the reason in code comments or task notes. Do not introduce broad global overrides.
- For any screen with form submission, keep the submit action disabled by default and enable it only after all required form validation passes.
- During submission, prefer the component library's built-in loading state for submit actions instead of adding unnecessary custom control logic. Keep implementations concise and use Element Plus capabilities before building equivalent behavior manually.
- For modal dialogs, keep the dialog vertically centered in the viewport. When content overflows, keep header and footer fixed, allow only the content area to scroll, and avoid page-scroll-driven dialog movement.
- Before recommending a commit after feature work, make sure the relevant local tests were run or explicitly state that they were not run. Use pnpm test:unit for unit coverage and pnpm test:e2e for browser flows when UI behavior changed.
- Do not change package.json version or create a release tag unless the user explicitly asks to prepare a new release.
