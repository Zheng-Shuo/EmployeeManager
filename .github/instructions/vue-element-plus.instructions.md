---
description: "Use when editing Vue pages, layouts, components, router modules, Pinia stores, or API modules in EmployeeManager. Enforces Vue 3 Composition API, Element Plus UI, and OpenAPI-aligned TypeScript contracts."
applyTo:
  - "src/**/*.vue"
  - "src/**/*.ts"
---

# Vue 3 And Element Plus Rules

- Use Vue 3 Composition API only. In single-file components, prefer script setup with lang=ts.
- Build interactive UI with Element Plus components first. Prefer el-form, el-table, el-dialog, el-drawer, el-card, el-menu, and related primitives before introducing custom markup.
- Do not introduce Tailwind CSS. If Element Plus cannot cover a visual detail, add the smallest necessary native CSS or SCSS alongside the component.
- Keep network code aligned with openapi.yaml. Requests and responses should stay strongly typed in TypeScript and follow the shared API contracts in src/api/types.ts.
- Reuse the shared request client in src/utils/request.ts instead of creating ad hoc fetch wrappers.
- Match the repository's TypeScript strictness: add explicit parameter and return types where the lint rules expect them.
