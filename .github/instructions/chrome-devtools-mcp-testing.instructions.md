---
description: "Use when running UI or interaction validation with chrome-devtools-mcp in EmployeeManager. Enforces test account autofill and combined functional plus visual verification workflow."
---

# Chrome DevTools MCP Testing Rules

- For every login form encountered during chrome-devtools-mcp validation, always autofill and use the system test account credentials:
  - Username: admin
  - Password: 5kuslvhe9n
- Do not stop at functional checks. During chrome-devtools-mcp validation, always verify both behavior and presentation.
- Functional validation must cover key user interactions and expected outcomes, including critical success and obvious failure paths.
- UI validation must include:
  - Layout and component structure are rendered as expected
  - Styles are applied correctly, including spacing, typography, colors, and component states
  - No obvious visual regressions such as broken alignment, overlap, clipping, or missing styles
- Capture screenshots for key pages and states, then compare against visual baselines.
- If no baseline exists for a key page, create one and clearly state that a new baseline was established.
- During validation, also check browser console and related network requests for runtime warnings/errors and API status anomalies.
- If the local dev server or target page is unavailable, state what could not be verified and why.
