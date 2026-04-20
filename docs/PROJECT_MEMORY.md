# EmployeeManager Project Memory

Last updated: 2026-04-20

## Maintenance Rules

- Read this file before broad codebase searches when starting a new complex task.
- Update this document when routes, Pinia stores, or shared foundation components materially change.
- Keep entries concise and factual so they remain cheap to load into context.

## Stack And Runtime

- Vue 3.5 + TypeScript + Vite 8
- Pinia for auth state and dictionary cache
- Vue Router 5 for app navigation and route guards
- Element Plus for UI primitives and layout
- Axios for HTTP, with Vite proxy forwarding /api requests to `http://localhost:10086` in development
- Vitest for unit tests and Playwright for browser flows

## App Shell

- The authenticated shell is MainLayout, which composes AppHeader, AppSidebar, and RouterView.
- AppHeader shows brand and current route indicator. For detail routes (for example employee detail), route meta breadcrumbs are rendered in the header.
- Header dropdown actions emit intent only; account rename and normal password-change dialogs are mounted in MainLayout.
- AppSidebar is fixed-width navigation (no collapse mode) with active-item background highlighting. Supports nested el-sub-menu for grouped items (e.g. 系统管理).
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

| Path           | Name            | Component                        | Notes                                                        |
| -------------- | --------------- | -------------------------------- | ------------------------------------------------------------ |
| /login         | login           | src/views/LoginView.vue          | Public route. Authenticated users redirect to home.          |
| /403           | forbidden       | src/views/ForbiddenView.vue      | Public forbidden screen.                                     |
| /              | dashboard       | src/views/DashboardView.vue      | Wrapped by MainLayout and requires auth.                     |
| /employees     | employees       | src/views/EmployeesView.vue      | Requires employee:view.                                      |
| /employees/:id | employee-detail | src/views/EmployeeDetailView.vue | Requires employee:view. Route-based detail page.             |
| /organizations | organizations   | src/views/OrganizationsView.vue  | Requires org:view.                                           |
| /users         | users           | src/views/UsersView.vue          | Requires user:view.                                          |
| /roles         | roles           | src/views/RolesView.vue          | Requires role:view.                                          |
| /profile       | profile         | src/views/ProfileView.vue        | Requires auth. Current page is a mock profile editor UI.     |
| /dictionaries  | dictionaries    | src/views/DictionariesView.vue   | Requires dictionary:manage. Dictionary category + item CRUD. |

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

### dictionary store

File: src/stores/dictionary.ts

Responsibilities:

- Cache all dictionary categories with their items after login.
- Provide getItemsByCode(categoryCode) to get enabled, sorted items for a category.
- Provide getLabelByCode(categoryCode, itemCode) for code-to-label mapping (falls back to raw code).
- Provide getColorByCode(categoryCode, itemCode) for optional color tags.
- Provide getLabelById(categoryCode, itemId) for UUID-to-label mapping.
- Provide getColorById(categoryCode, itemId) for UUID-to-color mapping.
- Provide getDefaultItemId(categoryCode) to get the first enabled item's UUID.
- Support reload() for manual refresh after dictionary mutations.

## API Layer

- Shared HTTP client lives in src/utils/request.ts.
- Authorization headers are attached from stored accessToken.
- A 401 response triggers refresh-token logic for non-refresh requests. Refresh failure falls back to logout.
- API modules are split by domain in src/api: auth, users, roles, employees, organizations, positions, and dictionaries.
- Shared request and response types live in src/api/types.ts.
- openapi.yaml is the contract source for backend endpoints and payload shapes. Keep manual TypeScript interfaces aligned with it.

## Dictionary-Driven Architecture

- Employee status and org unit type values are no longer hardcoded enums. They are fetched from the backend Dictionary API and cached in the dictionary Pinia store.
- Dictionary categories are identified by code (e.g. "employee_status", "employment_type", "org_unit_type"). Each category contains sorted, enabled items with id (UUID)/code/label/color.
- The dictionary store is preloaded (fire-and-forget) on login in LoginView. Components consume it synchronously via getters.
- Components that previously used hardcoded EmployeeStatus or OrgUnitType options now compute options from dictionaryStore.getItemsByCode.
- Status and employmentType fields in API payloads use **UUID values** (dictionary item id), not code strings. Components use getLabelById/getColorById for display.
- Gender and UserStatus remain hardcoded enums since they are not dictionary-managed.

## Employee Assignment Architecture

- Employee-to-organization/position relationships are modeled as **assignments** (AssignmentInput for creation, EmployeeAssignmentDTO for display).
- Each assignment has orgUnitId, positionId, isPrimary flag, startDate, and endDate.
- EmployeeCreateDialog uses el-tree-select for org unit (loaded via getOrganizationTree) and el-select for position (loaded via getPositions filtered by orgUnitId).
- EmployeeDetailView displays assignments in an el-table instead of separate department/position tag lists.
- The old AssignDepartmentsRequest/AssignPositionsRequest patterns and their API functions (assignEmployeeDepartments, assignEmployeePositions) have been removed.

## Permissions And Navigation

- Route-level permissions live in route meta.
- Sidebar visibility is permission-aware and driven by src/config/menu.ts. Menu supports nested groups (children) for submenu rendering.
- Prefer hasAnyPermission for multi-permission checks so route rules and menu rules stay consistent.
- The "系统管理" submenu groups 账户管理 (user:view), 角色权限 (role:view), and 数据字典 (dictionary:manage).

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
