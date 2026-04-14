<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import type { AxiosError } from "axios";
import { ElMessage } from "element-plus";

import type { ApiResponse, CreateEmployeeRequest } from "@/api/types";
import EmployeeCreateDialog from "@/components/employees/EmployeeCreateDialog.vue";
import EmployeeFilters from "@/components/employees/EmployeeFilters.vue";
import EmployeeTable from "@/components/employees/EmployeeTable.vue";
import { useEmployeeList } from "@/composables/useEmployeeList";

const {
  employees,
  filters,
  loading,
  creating,
  pagination,
  createAndReloadEmployee,
  handlePageChange,
  handleSearch,
  handleSizeChange,
  loadEmployees,
} = useEmployeeList();
const createDialogVisible = ref(false);
const skipFilterWatch = ref(false);
let keywordTimer: number | null = null;

interface CreateEmployeeDialogPayload {
  data: CreateEmployeeRequest;
  photoFile: File | null;
  attachmentFiles: File[];
}

function triggerSearchByFilter(useDebounce: boolean): void {
  if (keywordTimer !== null) {
    window.clearTimeout(keywordTimer);
    keywordTimer = null;
  }

  if (useDebounce) {
    keywordTimer = window.setTimeout((): void => {
      void handleSearch();
      keywordTimer = null;
    }, 320);
    return;
  }

  void handleSearch();
}

function handleFilterReset(): void {
  skipFilterWatch.value = true;
  filters.keyword = "";
  filters.status = "";
  skipFilterWatch.value = false;
  triggerSearchByFilter(false);
}

async function handleCreate(payload: CreateEmployeeDialogPayload): Promise<void> {
  try {
    await createAndReloadEmployee(payload.data, payload.photoFile, payload.attachmentFiles);
    createDialogVisible.value = false;
    ElMessage.success("员工创建成功");
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse<null>>;
    const status = axiosError.response?.status;
    if (status === 409) {
      ElMessage.error("员工工号已存在，请更换后重试");
      return;
    }
    if (status === 422) {
      ElMessage.error("提交数据校验失败，请检查后重试");
      return;
    }
    ElMessage.error("创建员工失败，请稍后重试");
  }
}

onMounted((): void => {
  void loadEmployees();
});

onUnmounted((): void => {
  if (keywordTimer !== null) {
    window.clearTimeout(keywordTimer);
  }
});

watch(
  () => filters.keyword,
  (): void => {
    if (skipFilterWatch.value) {
      return;
    }
    triggerSearchByFilter(true);
  },
);

watch(
  () => filters.status,
  (): void => {
    if (skipFilterWatch.value) {
      return;
    }
    triggerSearchByFilter(false);
  },
);
</script>

<template>
  <section class="employee-page">
    <EmployeeFilters
      v-model:keyword="filters.keyword"
      v-model:status="filters.status"
      :loading="loading"
      @refresh="loadEmployees"
      @reset="handleFilterReset"
    />

    <div class="table-region">
      <EmployeeTable
        :employees="employees"
        :loading="loading"
        :page="pagination.page"
        :size="pagination.size"
        :total="pagination.total"
        @create="createDialogVisible = true"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <EmployeeCreateDialog
      v-model:visible="createDialogVisible"
      :submitting="creating"
      @submit="handleCreate"
    />
  </section>
</template>

<style scoped>
.employee-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-region {
  flex: 1;
  min-height: 0;
}
</style>
