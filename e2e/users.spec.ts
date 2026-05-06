import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

interface AuthUserMock {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  forcePasswordChange: boolean;
}

interface UserMock {
  id: string;
  username: string;
  roles: string[];
  status: string;
  statusLabel: string;
  forcePasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RoleMock {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserPayload {
  username: string;
  password: string;
  roleIds?: string[];
}

const AUTH_USER: AuthUserMock = {
  userId: "user-admin",
  username: "admin",
  roles: ["ADMIN"],
  permissions: ["user:view", "user:create", "user:reset-password"],
  forcePasswordChange: false,
};

const ROLES: RoleMock[] = [
  {
    id: "role-admin",
    name: "ADMIN",
    description: "系统管理员",
    isSystem: true,
    createdAt: "2026-01-01 10:00:00",
    updatedAt: "2026-01-01 10:00:00",
  },
  {
    id: "role-hr-user",
    name: "HR_USER",
    description: "人事专员",
    isSystem: true,
    createdAt: "2026-01-01 10:00:00",
    updatedAt: "2026-01-01 10:00:00",
  },
];

const USERS: UserMock[] = [
  {
    id: "user-1",
    username: "admin",
    roles: ["ADMIN"],
    status: "00000000-0000-0000-0000-000000000111",
    statusLabel: "激活",
    forcePasswordChange: false,
    createdAt: "2026-01-01 10:00:00",
    updatedAt: "2026-01-01 10:00:00",
  },
];

async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript((authUser: AuthUserMock) => {
    localStorage.setItem("accessToken", "test-access-token");
    localStorage.setItem("refreshToken", "test-refresh-token");
    localStorage.setItem("authUser", JSON.stringify(authUser));
  }, AUTH_USER);
}

async function mockUsersApi(
  page: Page,
): Promise<{ getLastPayload: () => CreateUserPayload | null }> {
  let lastPayload: CreateUserPayload | null = null;

  await page.route("**/api/roles", async (route: Route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        code: "SUCCESS",
        message: "OK",
        data: ROLES,
      }),
    });
  });

  await page.route("**/api/users", async (route: Route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          code: "SUCCESS",
          message: "OK",
          data: USERS,
        }),
      });
      return;
    }

    if (method === "POST") {
      lastPayload = route.request().postDataJSON() as CreateUserPayload;
      const selectedRoles = ROLES.filter((role: RoleMock) =>
        (lastPayload?.roleIds ?? []).includes(role.id),
      ).map((role: RoleMock) => role.name);

      const createdUser: UserMock = {
        id: `user-${USERS.length + 1}`,
        username: lastPayload.username,
        roles: selectedRoles,
        status: "00000000-0000-0000-0000-000000000111",
        statusLabel: "激活",
        forcePasswordChange: true,
        createdAt: "2026-04-21 09:00:00",
        updatedAt: "2026-04-21 09:00:00",
      };

      USERS.push(createdUser);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          code: "SUCCESS",
          message: "OK",
          data: createdUser,
        }),
      });
      return;
    }

    await route.fallback();
  });

  return {
    getLastPayload: (): CreateUserPayload | null => lastPayload,
  };
}

test.describe("用户管理页面", () => {
  test("支持使用穿梭框选择角色并新增用户", async ({ page }: { page: Page }): Promise<void> => {
    await seedAuth(page);
    const usersApi = await mockUsersApi(page);

    await page.goto("/users");

    await expect(page.locator(".users-card .header-row").first()).toContainText("账户管理");
    await expect(page.locator(".el-table__row").first()).toContainText("admin");

    await page.getByRole("button", { name: "新增用户" }).click();
    await expect(page.getByRole("heading", { name: "新增用户" })).toBeVisible();

    const createButton = page.getByRole("button", { name: "创建" });
    await expect(createButton).toBeDisabled();

    await page.getByPlaceholder("请输入用户名").fill("hr_bob");
    await page.getByPlaceholder("请输入密码（至少 6 位）").fill("Init123456");

    await expect(createButton).toBeEnabled();

    await expect(page.locator(".el-transfer")).toBeVisible();
    await expect(page.locator(".el-transfer-panel")).toHaveCount(2);

    await createButton.click();

    await expect(page.getByText("用户创建成功")).toBeVisible();
    await expect(page.getByText("hr_bob")).toBeVisible();

    await expect
      .poll(() => usersApi.getLastPayload())
      .toMatchObject({
        username: "hr_bob",
      });
  });
});
