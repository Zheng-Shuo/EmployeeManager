import { computed, reactive, ref } from "vue";
import type { ComputedRef, Ref } from "vue";

import { createEmployee, createEmployeeMultipart, getEmployees } from "@/api/employees";
import type { CreateEmployeeRequest, EmployeeDTO, EmployeeStatus } from "@/api/types";

interface EmployeeFilters {
  keyword: string;
  status: EmployeeStatus | "";
}

interface EmployeePagination {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

interface UseEmployeeListResult {
  employees: Ref<EmployeeDTO[]>;
  filters: EmployeeFilters;
  hasFilters: ComputedRef<boolean>;
  loading: Ref<boolean>;
  creating: Ref<boolean>;
  pagination: EmployeePagination;
  createAndReloadEmployee: (
    payload: CreateEmployeeRequest,
    photoFile?: File | null,
    attachmentFiles?: File[],
  ) => Promise<void>;
  handlePageChange: (page: number) => Promise<void>;
  handleReset: () => Promise<void>;
  handleSearch: () => Promise<void>;
  handleSizeChange: (size: number) => Promise<void>;
  loadEmployees: () => Promise<void>;
}

export function useEmployeeList(): UseEmployeeListResult {
  const filters = reactive<EmployeeFilters>({
    keyword: "",
    status: "",
  });
  const pagination = reactive<EmployeePagination>({
    page: DEFAULT_PAGE,
    size: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const employees = ref<EmployeeDTO[]>([]);
  const loading = ref(false);
  const creating = ref(false);

  const hasFilters = computed<boolean>(
    () => Boolean(filters.keyword.trim()) || Boolean(filters.status),
  );

  async function loadEmployees(): Promise<void> {
    loading.value = true;
    try {
      const response = await getEmployees({
        page: pagination.page,
        size: pagination.size,
        keyword: filters.keyword.trim() || undefined,
        status: filters.status || undefined,
      });
      employees.value = response.data.items;
      pagination.page = response.data.page;
      pagination.size = response.data.size;
      pagination.total = response.data.total;
      pagination.totalPages = response.data.totalPages;
    } finally {
      loading.value = false;
    }
  }

  async function handleSearch(): Promise<void> {
    pagination.page = DEFAULT_PAGE;
    await loadEmployees();
  }

  async function handleReset(): Promise<void> {
    filters.keyword = "";
    filters.status = "";
    pagination.page = DEFAULT_PAGE;
    await loadEmployees();
  }

  async function handlePageChange(page: number): Promise<void> {
    pagination.page = page;
    await loadEmployees();
  }

  async function handleSizeChange(size: number): Promise<void> {
    pagination.page = DEFAULT_PAGE;
    pagination.size = size;
    await loadEmployees();
  }

  async function createAndReloadEmployee(
    payload: CreateEmployeeRequest,
    photoFile?: File | null,
    attachmentFiles: File[] = [],
  ): Promise<void> {
    creating.value = true;
    try {
      if (photoFile || attachmentFiles.length > 0) {
        await createEmployeeMultipart({
          data: payload,
          photoFile,
          attachmentFiles,
        });
      } else {
        await createEmployee(payload);
      }
      pagination.page = DEFAULT_PAGE;
      await loadEmployees();
    } finally {
      creating.value = false;
    }
  }

  return {
    employees,
    filters,
    hasFilters,
    loading,
    creating,
    pagination,
    createAndReloadEmployee,
    handlePageChange,
    handleReset,
    handleSearch,
    handleSizeChange,
    loadEmployees,
  };
}
