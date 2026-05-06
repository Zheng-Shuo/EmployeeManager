---
description: "Use when editing Vue pages, layouts, components, router modules, Pinia stores, or API modules in EmployeeManager. Enforces Vue 3 Composition API, Element Plus UI, and OpenAPI-aligned TypeScript contracts."
applyTo:
  - "src/**/*.vue"
  - "src/**/*.ts"
---

# Vue 3 And Element Plus Rules

- Use Vue 3 Composition API only. In single-file components, prefer script setup with lang=ts.
- Build interactive UI with Element Plus components first. Prefer el-form, el-table, el-dialog, el-drawer, el-card, el-menu, and related primitives before introducing custom markup.
- Before writing any Element Plus related code, check the official documentation first: https://element-plus.org/zh-CN/component/overview
- Prefer concise implementations that use Element Plus built-in component behavior, states, and APIs directly instead of reimplementing features the library already provides.
- Do not modify or override Element Plus internal styles unless strictly necessary. Prefer built-in props, slots, ConfigProvider, and CSS variables for visual adjustments.
- Avoid direct overrides targeting Element Plus internal class selectors such as .el-\* and avoid !important unless there is no viable alternative.
- If an internal override is necessary, keep it minimal, scoped, and documented with a short reason near the style block.
- Do not introduce Tailwind CSS. If Element Plus cannot cover a visual detail, add the smallest necessary native CSS or SCSS alongside the component.
- For any form submission screen, submit buttons must be disabled by default and become clickable only when all required form validations pass.
- During in-flight submission requests, prefer Element Plus button loading states and other built-in feedback mechanisms instead of adding excessive custom control logic.
- Prefer this form flow: el-form rules + validate before submit + a simple canSubmit state controlling button disabled status.
- For modal interactions, prefer Element Plus dialog capabilities first and follow the official dialog documentation before implementation.
- Modal dialogs must remain vertically centered in the viewport and should not visually drift with page scrolling.
- If modal content is long, keep dialog header and footer fixed and make only the dialog body scrollable.
- Prefer built-in dialog options such as align-center and lock-scroll before adding custom behavior.
- Keep network code aligned with openapi.yaml. Requests and responses should stay strongly typed in TypeScript and follow the shared API contracts in src/api/types.ts.
- Reuse the shared request client in src/utils/request.ts instead of creating ad hoc fetch wrappers.
- Match the repository's TypeScript strictness: add explicit parameter and return types where the lint rules expect them.
