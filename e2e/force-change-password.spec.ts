import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const MOCK_AUTH_USER = {
  userId: "user-1",
  username: "admin",
  roles: ["ADMIN"],
  permissions: ["user:view"],
};

async function mockLoginApi(page: Page, forcePasswordChange: boolean): Promise<void> {
  await page.route("**/api/auth/login", (route: Route) => {
    void route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        code: "SUCCESS",
        message: "OK",
        data: {
          accessToken: "fake-access-token",
          refreshToken: "fake-refresh-token",
          ...MOCK_AUTH_USER,
          forcePasswordChange,
        },
      }),
    });
  });
}

async function mockChangePasswordApi(page: Page): Promise<void> {
  await page.route("**/api/auth/password", (route: Route) => {
    void route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, code: "SUCCESS", message: "OK", data: null }),
    });
  });
}

async function loginAs(page: Page, forcePasswordChange: boolean): Promise<void> {
  await mockLoginApi(page, forcePasswordChange);
  await page.goto("/login");
  await page.locator('input[placeholder="请输入用户名"]').fill("admin");
  await page.locator('input[placeholder="请输入密码"]').fill("password123");
  await page.locator('button:has-text("登录")').click();
}

test.describe("强制修改密码流程", () => {
  test.beforeEach(async ({ page }: { page: Page }): Promise<void> => {
    await page.goto("/login");
    await page.evaluate((): void => localStorage.clear());
  });

  test("登录后 forcePasswordChange 为 true 时弹出强制改密模态", async ({
    page,
  }: {
    page: Page;
  }): Promise<void> => {
    await loginAs(page, true);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("dialog", { name: "首次登录请先修改密码" })).toBeVisible();
    await expect(page.getByText("为保障账户安全，你需要先完成密码修改。")).toBeVisible();
  });

  test("forcePasswordChange 为 false 时登录后跳转到首页", async ({
    page,
  }: {
    page: Page;
  }): Promise<void> => {
    await loginAs(page, false);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("dialog", { name: "首次登录请先修改密码" })).toHaveCount(0);
  });

  test("普通修改密码场景可从右上角菜单打开并关闭", async ({
    page,
  }: {
    page: Page;
  }): Promise<void> => {
    await loginAs(page, false);
    await expect(page).toHaveURL(/\/$/);

    await page.locator(".user-trigger").click();
    await page.getByRole("menuitem", { name: "修改密码" }).click();

    await expect(page.getByRole("dialog", { name: "修改密码" })).toBeVisible();
    await page.getByRole("button", { name: "取消" }).click();
    await expect(page.getByRole("dialog", { name: "修改密码" })).toHaveCount(0);
  });

  test("已登录且 forcePasswordChange 为 true 时直接访问首页仍弹出强制改密模态", async ({
    page,
  }: {
    page: Page;
  }): Promise<void> => {
    await loginAs(page, true);
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("dialog", { name: "首次登录请先修改密码" })).toBeVisible();
  });

  test("完整流程：登录 → 强制改密 → 留在首页并关闭弹窗", async ({
    page,
  }: {
    page: Page;
  }): Promise<void> => {
    await loginAs(page, true);
    await expect(page).toHaveURL(/\/$/);

    await mockChangePasswordApi(page);

    await page.locator('input[type="password"]').nth(0).fill("oldPass123");
    await page.locator('input[type="password"]').nth(1).fill("password");
    await page.locator('input[type="password"]').nth(2).fill("password");
    await page.locator('button:has-text("确认修改")').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("dialog", { name: "首次登录请先修改密码" })).toHaveCount(0);
  });
});
