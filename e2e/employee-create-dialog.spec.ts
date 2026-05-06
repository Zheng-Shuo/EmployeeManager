import { expect, test } from "@playwright/test";
import type { Page, Request, Route } from "@playwright/test";

interface AuthUserMock {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  forcePasswordChange: boolean;
}

interface RegionMock {
  id: string;
  code: string;
  name: string;
  fullName: string;
  level: number;
  parentCode: string | null;
}

const AUTH_USER: AuthUserMock = {
  userId: "user-1",
  username: "admin",
  roles: ["ADMIN"],
  permissions: ["employee:view", "employee:create"],
  forcePasswordChange: false,
};

const ROOT_REGIONS: RegionMock[] = [
  {
    id: "region-110000",
    code: "110000",
    name: "北京市",
    fullName: "北京市",
    level: 1,
    parentCode: null,
  },
  {
    id: "region-130000",
    code: "130000",
    name: "河北省",
    fullName: "河北省",
    level: 1,
    parentCode: null,
  },
];

const REGION_CHILDREN: Record<string, RegionMock[]> = {
  "110000": [],
  "130000": [
    {
      id: "region-130100",
      code: "130100",
      name: "石家庄市",
      fullName: "河北省石家庄市",
      level: 2,
      parentCode: "130000",
    },
  ],
};

async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript((authUser: AuthUserMock) => {
    localStorage.setItem("accessToken", "test-access-token");
    localStorage.setItem("refreshToken", "test-refresh-token");
    localStorage.setItem("authUser", JSON.stringify(authUser));
  }, AUTH_USER);
}

async function mockEmployeesApi(page: Page): Promise<void> {
  await page.route("**/api/v1/employees?page=*&size=*", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        code: "SUCCESS",
        message: "OK",
        data: {
          items: [],
          page: 1,
          size: 10,
          total: 0,
          totalPages: 1,
        },
      }),
    });
  });
}

async function mockDialogDependencies(page: Page): Promise<void> {
  await page.route("**/api/v1/organizations?tree=true", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        code: "SUCCESS",
        message: "OK",
        data: [],
      }),
    });
  });

  await page.route("**/api/v1/ethnicities", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        code: "SUCCESS",
        message: "OK",
        data: [],
      }),
    });
  });

  await page.route("**/api/v1/regions*", async (route: Route) => {
    const url = new URL(route.request().url());
    const parentCode = url.searchParams.get("parentCode");
    const level = url.searchParams.get("level");

    const data = parentCode
      ? (REGION_CHILDREN[parentCode] ?? [])
      : level === "1"
        ? ROOT_REGIONS
        : [];

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        code: "SUCCESS",
        message: "OK",
        data,
      }),
    });
  });
}

test.describe("新增员工弹框", () => {
  test.beforeEach(async ({ page }: { page: Page }): Promise<void> => {
    await seedAuth(page);
    await mockEmployeesApi(page);
    await mockDialogDependencies(page);
  });

  test("籍贯宽度对齐、直辖市可选且关闭后会重置", async ({
    page,
  }: {
    page: Page;
  }): Promise<void> => {
    await page.goto("/employees");
    await page.getByRole("button", { name: "新增员工" }).click();

    const contactAddressInput = page.getByPlaceholder("请输入联系地址");
    await expect(contactAddressInput).toBeVisible();

    const widths = await page.locator(".employee-create-dialog").evaluate((dialog: Element) => {
      const formItems = Array.from(dialog.querySelectorAll(".el-form-item"));
      const getControlWidth = (label: string): number => {
        const matchedItem = formItems.find((item: Element) =>
          item.querySelector(".el-form-item__label")?.textContent?.includes(label),
        );
        const control = matchedItem?.querySelector(".el-input, .el-cascader");
        if (!(control instanceof HTMLElement)) {
          return 0;
        }
        return control.getBoundingClientRect().width;
      };

      return {
        employeeNo: getControlWidth("工号"),
        nativePlace: getControlWidth("籍贯"),
      };
    });

    expect(Math.abs(widths.employeeNo - widths.nativePlace)).toBeLessThan(2);

    const nativePlaceInput = page.locator(".employee-create-dialog .el-cascader input");
    await nativePlaceInput.click();

    const municipalityRequest = page.waitForRequest(
      (request: Request): boolean =>
        request.method() === "GET" && request.url().includes("/api/v1/regions?parentCode=110000"),
    );
    await page.getByRole("menuitem", { name: "北京市" }).click();
    await municipalityRequest;

    await expect(nativePlaceInput).toHaveValue("北京市");

    await contactAddressInput.fill("北京市东城区景山前街 4 号");
    await page.getByRole("button", { name: "取消" }).click();

    await page.getByRole("button", { name: "新增员工" }).click();

    const reopenedNativePlaceInput = page.locator(".employee-create-dialog .el-cascader input");
    await expect(reopenedNativePlaceInput).toHaveValue("");
    await expect(page.getByPlaceholder("请输入联系地址")).toHaveValue("");
  });
});
