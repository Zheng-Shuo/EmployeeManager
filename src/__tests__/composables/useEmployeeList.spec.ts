import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEmployeeList } from "@/composables/useEmployeeList";
import { createEmployee, createEmployeeMultipart, getEmployees } from "@/api/employees";
import type { EmployeeDTO } from "@/api/types";

vi.mock("@/api/employees", () => ({
  createEmployee: vi.fn(),
  createEmployeeMultipart: vi.fn(),
  getEmployees: vi.fn(),
}));

const mockedGetEmployees = vi.mocked(getEmployees);
const mockedCreateEmployee = vi.mocked(createEmployee);
const mockedCreateEmployeeMultipart = vi.mocked(createEmployeeMultipart);

function makeEmployee(overrides: Partial<EmployeeDTO> = {}): EmployeeDTO {
  return {
    id: "employee-1",
    employeeNo: "EMP-001",
    idCardNo: "110101199001011234",
    age: 35,
    name: "张三",
    gender: "MALE",
    birthDate: "1990-01-01",
    phone: "13800000000",
    email: "zhangsan@example.com",
    workAddress: "上海市浦东新区",
    contactAddress: "上海市徐汇区",
    hireDate: "2024-01-10",
    status: "00000000-0000-0000-0000-000000000111",
    ethnicity: "汉族",
    politicalStatus: "群众",
    education: "00000000-0000-0000-0000-000000000311",
    nativePlace: "310101",
    employmentType: "00000000-0000-0000-0000-000000000211",
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
    mockedCreateEmployeeMultipart.mockResolvedValue({
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
      gender: undefined,
      employmentType: undefined,
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
      gender: undefined,
      employmentType: undefined,
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
      gender: undefined,
      employmentType: undefined,
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
      gender: undefined,
      employmentType: undefined,
    });
    expect(employeeList.pagination.size).toBe(10);
  });

  it("creates employee and reloads list from first page", async (): Promise<void> => {
    const employeeList = useEmployeeList();
    employeeList.pagination.page = 3;

    await employeeList.createAndReloadEmployee({
      employeeNo: "EMP-009",
      idCardNo: "310101199205152345",
      age: 32,
      name: "赵六",
      gender: "FEMALE",
      birthDate: "1992-05-15",
      workAddress: "北京市朝阳区酒仙桥路 1 号",
      contactAddress: "北京市东城区东华门街道 8 号",
      hireDate: "2026-04-01",
      employmentType: "00000000-0000-0000-0000-000000000211",
      status: "00000000-0000-0000-0000-000000000111",
    });

    expect(mockedCreateEmployee).toHaveBeenCalledWith({
      employeeNo: "EMP-009",
      idCardNo: "310101199205152345",
      age: 32,
      name: "赵六",
      gender: "FEMALE",
      birthDate: "1992-05-15",
      workAddress: "北京市朝阳区酒仙桥路 1 号",
      contactAddress: "北京市东城区东华门街道 8 号",
      hireDate: "2026-04-01",
      employmentType: "00000000-0000-0000-0000-000000000211",
      status: "00000000-0000-0000-0000-000000000111",
    });
    expect(employeeList.pagination.page).toBe(1);
    expect(mockedGetEmployees).toHaveBeenLastCalledWith({
      page: 1,
      size: 10,
      keyword: undefined,
      status: undefined,
      gender: undefined,
      employmentType: undefined,
    });
    expect(employeeList.creating.value).toBe(false);
  });
});
