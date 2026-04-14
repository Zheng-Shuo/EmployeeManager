import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

interface AuthUserMock {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  forcePasswordChange: boolean;
}

const AUTH_USER: AuthUserMock = {
  userId: "user-1",
  username: "admin",
  roles: ["ADMIN"],
  permissions: ["employee:view", "user:view", "role:view", "org:view"],
  forcePasswordChange: false,
};

async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript((authUser: AuthUserMock) => {
    localStorage.setItem("accessToken", "test-access-token");
    localStorage.setItem("refreshToken", "test-refresh-token");
    localStorage.setItem("authUser", JSON.stringify(authUser));
  }, AUTH_USER);
}

test.describe("个人信息页面", () => {
  test.beforeEach(async ({ page }: { page: Page }): Promise<void> => {
    await seedAuth(page);
  });

  test("可从右上角菜单打开修改账号弹窗并提交", async ({ page }: { page: Page }): Promise<void> => {
    await page.route("**/api/users/*/username", (route: Route) => {
      void route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          code: "SUCCESS",
          message: "OK",
          data: {
            ...AUTH_USER,
            username: "new-admin",
          },
        }),
      });
    });

    await page.goto("/");

    await page.locator(".user-trigger").click();
    await page.getByRole("menuitem", { name: "修改账号" }).click();

    await expect(page.getByRole("dialog", { name: "修改账号" })).toBeVisible();
    await page.getByPlaceholder("请输入新账号").fill("new-admin");
    await page.getByRole("button", { name: "确认修改" }).click();

    await expect(page.getByText("账号修改成功")).toBeVisible();
    await expect(page.locator(".user-name")).toContainText("new-admin");
  });
});
