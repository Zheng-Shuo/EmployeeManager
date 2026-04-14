# EmployeeManager Project Memory

Last updated: 2026-04-13

## Maintenance Rules

- Read this file before broad codebase searches when starting a new complex task.
- Update this document when routes, Pinia stores, or shared foundation components materially change.
- Keep entries concise and factual so they remain cheap to load into context.

## Stack And Runtime

- Vue 3.5 + TypeScript + Vite 8
- Pinia for auth state
- Vue Router 5 for app navigation and route guards
- Element Plus for UI primitives and layout
- Axios for HTTP, with Vite proxy forwarding /api requests to `http://localhost:10086` in development
- Vitest for unit tests and Playwright for browser flows

## App Shell

- The authenticated shell is MainLayout, which composes AppHeader, AppSidebar, and RouterView.
- AppHeader shows brand and current route indicator. For detail routes (for example employee detail), route meta breadcrumbs are rendered in the header.
- Header dropdown actions emit intent only; account rename and normal password-change dialogs are mounted in MainLayout.
- AppSidebar is fixed-width navigation (no collapse mode) with active-item background highlighting.
- The top header is fixed to the viewport; the main content scrolls independently while the sidebar remains fixed within the app shell.
- Forced password change is rendered as a global non-closable modal in MainLayout when authUser.forcePasswordChange is true.

## Employee List View

- src/views/EmployeesView.vue is now a thin composition surface for the employee directory feature.
- The page composes src/components/employees/EmployeeFilters.vue, EmployeeTable.vue, and EmployeeCreateDialog.vue.
- Feature state and async behavior live in src/composables/useEmployeeList.ts, covering filter state, paginated queries, and create-then-reload flow.
- Employee filters run in change-to-search mode: status changes trigger immediate reload and keyword input triggers debounced reload.
- Employee detail interaction is route-based via src/views/EmployeeDetailView.vue (`/employees/:id`) instead of a drawer.
- The current employee flow supports keyword search, status filtering, refresh, pagination, creation, and detail viewing through getEmployees, createEmployee, and getEmployeeById.

## Routing

| Path           | Name            | Component                        | Notes                                                    |
| -------------- | --------------- | -------------------------------- | -------------------------------------------------------- |
| /login         | login           | src/views/LoginView.vue          | Public route. Authenticated users redirect to home.      |
| /403           | forbidden       | src/views/ForbiddenView.vue      | Public forbidden screen.                                 |
| /              | dashboard       | src/views/DashboardView.vue      | Wrapped by MainLayout and requires auth.                 |
| /employees     | employees       | src/views/EmployeesView.vue      | Requires employee:view.                                  |
| /employees/:id | employee-detail | src/views/EmployeeDetailView.vue | Requires employee:view. Route-based detail page.         |
| /organizations | organizations   | src/views/OrganizationsView.vue  | Requires org:view.                                       |
| /users         | users           | src/views/UsersView.vue          | Requires user:view.                                      |
| /roles         | roles           | src/views/RolesView.vue          | Requires role:view.                                      |
| /profile       | profile         | src/views/ProfileView.vue        | Requires auth. Current page is a mock profile editor UI. |

Guard behavior in src/router/guards.ts:

- Unauthenticated users redirect to /login with the original destination in redirect.
- forcePasswordChange no longer triggers route redirection; password enforcement is handled by MainLayout modal.
- Permission-protected routes rely on authStore.hasAnyPermission and redirect to /403 when access is denied.

Password change flow notes:

- src/components/account/ChangePasswordDialog.vue is shared for both forced and regular password change.
- In forced flow, dialog is non-closable and clears forcePasswordChange flag on success.
- In regular flow, users can open the same dialog from AppHeader dropdown.

## Pinia Store Dictionary

### auth store

File: src/stores/auth.ts

Responsibilities:

- Persist accessToken, refreshToken, and authUser in localStorage.
- Expose isAuthenticated, hasPermission, and hasAnyPermission.
- Handle login data initialization, token refresh updates, logout, and forced-password-change state clearing.

Persisted keys:

- accessToken
- refreshToken
- authUser

## API Layer

- Shared HTTP client lives in src/utils/request.ts.
- Authorization headers are attached from stored accessToken.
- A 401 response triggers refresh-token logic for non-refresh requests. Refresh failure falls back to logout.
- API modules are split by domain in src/api: auth, users, roles, employees, organizations, and positions.
- Shared request and response types live in src/api/types.ts.
- openapi.yaml is the contract source for backend endpoints and payload shapes. Keep manual TypeScript interfaces aligned with it.

## Permissions And Navigation

- Route-level permissions live in route meta.
- Sidebar visibility is permission-aware and driven by src/config/menu.ts.
- Prefer hasAnyPermission for multi-permission checks so route rules and menu rules stay consistent.

## Testing Baseline

- Unit test setup exists through vitest.config.ts with jsdom and Vue Test Utils.
- Browser test setup exists through playwright.config.ts and starts pnpm dev as the web server.
- Employee list coverage now includes src/**tests**/composables/useEmployeeList.spec.ts and e2e/employees.spec.ts.
- New business logic and meaningful UI flows should expand these suites rather than leaving the baseline unchanged.

## Repo-Specific Constraints

- ESLint requires explicit parameter and return types in many TypeScript paths.
- Router components are currently statically imported. Keep that pattern unless lint rules are adjusted.
- Prefer Element Plus components and native CSS or SCSS. Do not introduce Tailwind CSS.
- Only modify package.json version when the user explicitly asks to prepare a release.
