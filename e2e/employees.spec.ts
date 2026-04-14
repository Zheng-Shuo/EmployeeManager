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
  gender: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  hireDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const AUTH_USER: AuthUserMock = {
  userId: "user-1",
  username: "admin",
  roles: ["ADMIN"],
  permissions: ["employee:view", "employee:create"],
  forcePasswordChange: false,
};

const EMPLOYEES: EmployeeMock[] = [
  {
    id: "employee-1",
    employeeNo: "EMP-001",
    name: "张三",
    gender: "男",
    birthDate: "1990-01-01",
    phone: "13800000001",
    email: "zhangsan@example.com",
    address: "上海市浦东新区",
    hireDate: "2023-05-01",
    status: "ACTIVE",
    createdAt: "2026-01-01 10:00:00",
    updatedAt: "2026-04-10 10:00:00",
  },
  {
    id: "employee-2",
    employeeNo: "EMP-002",
    name: "李四",
    gender: "女",
    birthDate: "1992-02-02",
    phone: "13800000002",
    email: "lisi@example.com",
    address: "杭州市西湖区",
    hireDate: "2024-02-01",
    status: "RETIRED",
    createdAt: "2026-01-01 10:00:00",
    updatedAt: "2026-04-09 10:00:00",
  },
  {
    id: "employee-3",
    employeeNo: "EMP-003",
    name: "王五",
    gender: "男",
    birthDate: null,
    phone: null,
    email: null,
    address: null,
    hireDate: null,
    status: "DISABLED",
    createdAt: "2026-01-01 10:00:00",
    updatedAt: "2026-04-08 10:00:00",
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
  await page.route("**/api/employees", async (route: Route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    const payload = route.request().postDataJSON() as {
      employeeNo: string;
      name: string;
      gender?: string | null;
      birthDate?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      hireDate?: string | null;
      status?: string;
    };

    const createdEmployee = {
      id: `employee-${EMPLOYEES.length + 1}`,
      employeeNo: payload.employeeNo,
      name: payload.name,
      gender: payload.gender ?? null,
      birthDate: payload.birthDate ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      address: payload.address ?? null,
      hireDate: payload.hireDate ?? null,
      status: payload.status ?? "ACTIVE",
      createdAt: "2026-04-13 09:00:00",
      updatedAt: "2026-04-13 09:00:00",
    };

    EMPLOYEES.unshift(createdEmployee);

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        code: "SUCCESS",
        message: "OK",
        data: createdEmployee,
      }),
    });
  });

  await page.route("**/api/employees?**", async (route: Route) => {
    const url = new URL(route.request().url());
    const keyword = (url.searchParams.get("keyword") ?? "").trim();
    const status = url.searchParams.get("status");
    const pageValue = Number(url.searchParams.get("page") ?? "1");
    const sizeValue = Number(url.searchParams.get("size") ?? "10");

    const filteredItems = EMPLOYEES.filter((employee: EmployeeMock) => {
      const matchesKeyword =
        keyword.length === 0 ||
        employee.name.includes(keyword) ||
        employee.employeeNo.includes(keyword);
      const matchesStatus = !status || employee.status === status;
      return matchesKeyword && matchesStatus;
    });

    const pageStart = (pageValue - 1) * sizeValue;
    const pageItems = filteredItems.slice(pageStart, pageStart + sizeValue);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        code: "SUCCESS",
        message: "OK",
        data: {
          items: pageItems,
          page: pageValue,
          size: sizeValue,
          total: filteredItems.length,
          totalPages: Math.max(1, Math.ceil(filteredItems.length / sizeValue)),
        },
      }),
    });
  });

  await page.route("**/api/employees/*", async (route: Route) => {
    const employeeId = route.request().url().split("/").pop();
    const employee = EMPLOYEES.find((item: EmployeeMock) => item.id === employeeId);

    await route.fulfill({
      status: employee ? 200 : 404,
      contentType: "application/json",
      body: JSON.stringify(
        employee
          ? {
              success: true,
              code: "SUCCESS",
              message: "OK",
              data: {
                ...employee,
                departments: [{ id: "org-1", name: "研发中心", type: "DEPARTMENT" }],
                positions: [{ id: "position-1", name: "前端工程师" }],
              },
            }
          : {
              success: false,
              code: "EMPLOYEE_404_NOT_FOUND",
              message: "资源不存在",
              data: null,
            },
      ),
    });
  });
}

test.describe("员工列表页面", () => {
  test.beforeEach(async ({ page }: { page: Page }): Promise<void> => {
    await seedAuth(page);
    await mockEmployeesApi(page);
  });

  test("支持列表加载、关键字筛选和详情页跳转", async ({ page }: { page: Page }): Promise<void> => {
    await page.goto("/employees");

    await expect(page.locator(".page-title").first()).toHaveText("员工列表");
    await expect(page.getByText("张三")).toBeVisible();
    await expect(page.getByText("李四")).toBeVisible();

    await page.getByPlaceholder("按姓名或工号搜索").fill("EMP-002");

    await expect(page.getByText("李四")).toBeVisible();
    await expect(page.getByText("张三")).toBeHidden();

    await page.getByRole("button", { name: "编辑" }).click();

    await expect(page).toHaveURL(/\/employees\/employee-2/);
    await expect(page.getByRole("link", { name: "员工列表" })).toBeVisible();
    await expect(page.locator(".page-title").first()).toHaveText("员工详情");
    await expect(page.getByText("研发中心")).toBeVisible();
    await expect(page.getByText("前端工程师")).toBeVisible();
  });

  test("支持弹窗新增员工并刷新列表", async ({ page }: { page: Page }): Promise<void> => {
    await page.goto("/employees");

    await page.getByRole("button", { name: "新增员工" }).click();
    await expect(page.getByRole("heading", { name: "新增员工" })).toBeVisible();

    await page.getByPlaceholder("请输入工号").fill("EMP-099");
    await page.getByPlaceholder("请输入姓名").fill("赵六");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByText("员工创建成功")).toBeVisible();
    await expect(page.getByText("赵六")).toBeVisible();
  });

  test("支持状态筛选和重置", async ({ page }: { page: Page }): Promise<void> => {
    await page.goto("/employees");

    await page.locator(".field-status .el-select").click();
    await page.locator(".el-select-dropdown__item").filter({ hasText: "退休" }).click();

    await expect(page.getByText("李四")).toBeVisible();
    await expect(page.getByText("张三")).toBeHidden();

    await page.getByRole("button", { name: "重置" }).click();
    await expect(page.getByText("张三")).toBeVisible();
  });
});
