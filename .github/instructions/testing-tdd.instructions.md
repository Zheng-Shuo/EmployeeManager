---
description: "Use when adding or changing business logic, Pinia stores, router guards, API data mapping, forms, dialogs, or page interactions in EmployeeManager. Requires Vitest and Playwright coverage updates."
applyTo:
  - "src/**/*.vue"
  - "src/**/*.ts"
  - "e2e/**/*.ts"
---

# Testing And Verification Rules

- Core logic such as utility functions, Pinia stores, router guards, and API data transformation must have Vitest unit coverage.
- Core page flows and complex component interactions such as form validation, route redirects, modal behavior, and permission-driven rendering must have Playwright coverage as component or end-to-end tests.
- Every feature change should include test updates in the same task. Do not leave test coverage as follow-up work unless the user explicitly accepts that tradeoff.
- Before suggesting a git commit, remind the user to run the relevant test suite and make it clear whether pnpm test:unit, pnpm test:e2e, or both are expected.
- Prefer focused tests around changed behavior instead of broad snapshot-style coverage.
