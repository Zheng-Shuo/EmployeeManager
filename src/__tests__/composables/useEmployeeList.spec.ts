import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEmployeeList } from "@/composables/useEmployeeList";
import { createEmployee, getEmployees } from "@/api/employees";
import type { EmployeeDTO } from "@/api/types";

vi.mock("@/api/employees", () => ({
  createEmployee: vi.fn(),
  getEmployees: vi.fn(),
}));

const mockedGetEmployees = vi.mocked(getEmployees);
const mockedCreateEmployee = vi.mocked(createEmployee);

function makeEmployee(overrides: Partial<EmployeeDTO> = {}): EmployeeDTO {
  return {
    id: "employee-1",
    employeeNo: "EMP-001",
    name: "张三",
    gender: "男",
    birthDate: "1990-01-01",
    phone: "13800000000",
    email: "zhangsan@example.com",
    address: "上海市",
    hireDate: "2024-01-10",
    status: "ACTIVE",
    createdAt: "2026-01-01 10:00:00",
    updatedAt: "2026-01-02 10:00:00",
    ...overrides,
  };
}

describe("useEmployeeList", () => {
  beforeEach((): void => {
    vi.clearAllMocks();
    mockedGetEmployees.mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "OK",
      data: {
        items: [makeEmployee()],
        page: 1,
        size: 10,
        total: 1,
        totalPages: 1,
      },
    });
    mockedCreateEmployee.mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "OK",
      data: makeEmployee(),
    });
  });

  it("loads employees with default pagination", async (): Promise<void> => {
    const employeeList = useEmployeeList();

    await employeeList.loadEmployees();

    expect(mockedGetEmployees).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      keyword: undefined,
      status: undefined,
    });
    expect(employeeList.employees.value).toHaveLength(1);
    expect(employeeList.pagination.total).toBe(1);
  });

  it("searches with trimmed keyword and selected status", async (): Promise<void> => {
    const employeeList = useEmployeeList();
    employeeList.pagination.page = 3;
    employeeList.filters.keyword = " EMP-001 ";
    employeeList.filters.status = "ACTIVE";

    await employeeList.handleSearch();

    expect(mockedGetEmployees).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      keyword: "EMP-001",
      status: "ACTIVE",
    });
    expect(employeeList.pagination.page).toBe(1);
  });

  it("clears filters on reset and reloads the list", async (): Promise<void> => {
    const employeeList = useEmployeeList();
    employeeList.filters.keyword = "张三";
    employeeList.filters.status = "DISABLED";

    await employeeList.handleReset();

    expect(employeeList.filters.keyword).toBe("");
    expect(employeeList.filters.status).toBe("");
    expect(mockedGetEmployees).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      keyword: undefined,
      status: undefined,
    });
  });

  it("resets to first page when page size changes", async (): Promise<void> => {
    const employeeList = useEmployeeList();
    employeeList.pagination.page = 2;

    await employeeList.handleSizeChange(20);

    expect(mockedGetEmployees).toHaveBeenCalledWith({
      page: 1,
      size: 20,
      keyword: undefined,
      status: undefined,
    });
    expect(employeeList.pagination.size).toBe(10);
  });

  it("creates employee and reloads list from first page", async (): Promise<void> => {
    const employeeList = useEmployeeList();
    employeeList.pagination.page = 3;

    await employeeList.createAndReloadEmployee({
      employeeNo: "EMP-009",
      name: "赵六",
      status: "ACTIVE",
    });

    expect(mockedCreateEmployee).toHaveBeenCalledWith({
      employeeNo: "EMP-009",
      name: "赵六",
      status: "ACTIVE",
    });
    expect(employeeList.pagination.page).toBe(1);
    expect(mockedGetEmployees).toHaveBeenLastCalledWith({
      page: 1,
      size: 10,
      keyword: undefined,
      status: undefined,
    });
    expect(employeeList.creating.value).toBe(false);
  });
});
