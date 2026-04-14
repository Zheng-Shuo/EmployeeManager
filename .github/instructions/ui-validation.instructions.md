---
description: "Use when creating or modifying Vue pages or UI components in EmployeeManager. Requires Chrome DevTools MCP validation of DOM rendering, console output, and network behavior against a running local dev server."
applyTo: "src/**/*.vue"
---

# UI Validation Workflow

- Do not stop at code generation for UI tasks. Validate the rendered result in a running local development server with Chrome DevTools MCP.
- Inspect the DOM tree to confirm the expected Element Plus structure, text, and state-driven visibility are present.
- Check the browser console for Vue warnings, runtime errors, and hydration or reactivity issues.
- Check the network panel for API requests related to the changed screen, including request path, status, and obvious contract mismatches.
- If the local server is unavailable, state that validation is blocked and say what remains unverified.
