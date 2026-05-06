import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

interface AuthUserMock {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  forcePasswordChange: boolean;
}

interface EmployeeMock {
  id: string;
  employeeNo: string;
  name: string;
  gender: "MALE" | "FEMALE";
  age: number;
  idCardNo: string;
  phone: string;
  email: string;
  hireDate: string;
  status: string;
  employmentType: string;
  createdAt: string;
  updatedAt: string;
}

const AUTH_USER: AuthUserMock = {
  userId: "user-1",
  username: "admin",
  roles: ["ADMIN"],
  permissions: ["employee:view", "user:view"],
  forcePasswordChange: false,
};

const EMPLOYEES: EmployeeMock[] = [
  {
    id: "employee-1",
    employeeNo: "EMP-001",
    name: "张三",
    gender: "MALE",
    age: 32,
    idCardNo: "310101199402021234",
    phone: "13800000001",
    email: "zhangsan@example.com",
    hireDate: "2023-05-01",
    status: "00000000-0000-0000-0000-000000000111",
    employmentType: "00000000-0000-0000-0000-000000000211",
    createdAt: "2026-01-01 10:00:00",
    updatedAt: "2026-04-10 10:00:00",
  },
];

async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript((authUser: AuthUserMock) => {
    localStorage.setItem("accessToken", "test-access-token");
    localStorage.setItem("refreshToken", "test-refresh-token");
    localStorage.setItem("authUser", JSON.stringify(authUser));
  }, AUTH_USER);
}

async function mockEmployeesApi(page: Page): Promise<void> {
  await page.route("**/api/employees?**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        code: "SUCCESS",
        message: "OK",
        data: {
          items: EMPLOYEES,
          page: 1,
          size: 10,
          total: EMPLOYEES.length,
          totalPages: 1,
        },
      }),
    });
  });
}

test.describe("功能配置页面", () => {
  test("支持配置员工列表列显隐和顺序", async ({ page }: { page: Page }): Promise<void> => {
    await seedAuth(page);
    await mockEmployeesApi(page);

    await page.goto("/feature-config");

    await expect(page.locator(".title")).toContainText("功能配置");

    const idCardRow = page.locator(".el-table__row", { hasText: "身份证号" }).first();
    await idCardRow.locator(".el-switch").click();

    const statusRow = page.locator(".el-table__row", { hasText: "状态" }).first();
    await statusRow.getByRole("button", { name: "上移" }).click();

    await page.getByRole("button", { name: "保存配置" }).click();
    await expect(page.getByText("配置已保存")).toBeVisible();

    await page.goto("/employees");

    const headers = await page
      .locator(".employee-table .el-table__header th .cell")
      .allTextContents();

    expect(headers).not.toContain("身份证号");
    expect(headers.indexOf("状态")).toBeGreaterThan(-1);
    expect(headers.indexOf("入职日期")).toBeGreaterThan(-1);
    expect(headers.indexOf("状态")).toBeLessThan(headers.indexOf("入职日期"));
  });
});
