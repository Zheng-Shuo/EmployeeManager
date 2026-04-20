<script setup lang="ts">
import { useRouter } from "vue-router";

import type { EmployeeDTO } from "@/api/types";
import { useDictionaryStore } from "@/stores/dictionary";

interface Props {
  employees: EmployeeDTO[];
  loading: boolean;
  page: number;
  size: number;
  total: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  create: [];
  pageChange: [page: number];
  sizeChange: [size: number];
}>();
const router = useRouter();
const dictionaryStore = useDictionaryStore();

interface StatusPresentation {
  label: string;
  type: "danger" | "info" | "primary" | "success" | "warning";
  color: string | null;
}

function formatText(value?: string | null): string {
  return value && value.trim() ? value : "--";
}

function getStatusPresentation(status: string): StatusPresentation {
  const label = dictionaryStore.getLabelById("employee_status", status);
  const color = dictionaryStore.getColorById("employee_status", status);
  return { label, type: "info", color };
}

function openDetail(employee: EmployeeDTO): void {
  void router.push(`/employees/${employee.id}`);
}

function handleCurrentChange(page: number): void {
  emit("pageChange", page);
}

function handleSizeChange(size: number): void {
  emit("sizeChange", size);
}

function handleCreate(): void {
  emit("create");
}

function handleRowClick(row: EmployeeDTO): void {
  openDetail(row);
}
</script>

<template>
  <el-card shadow="never" class="table-card">
    <template #header>
      <div class="table-header">
        <div>
          <div class="title">员工档案</div>
          <div class="subtitle">支持按工号、姓名和状态筛选当前员工清单</div>
        </div>
        <div class="right-actions">
          <div class="summary">共 {{ props.total }} 条记录</div>
          <el-button type="primary" @click="handleCreate">新增员工</el-button>
        </div>
      </div>
    </template>

    <div class="table-content">
      <el-table
        :data="props.employees"
        v-loading="props.loading"
        stripe
        class="employee-table"
        height="100%"
        @row-click="handleRowClick"
      >
        <el-table-column
          prop="employeeNo"
          label="工号"
          min-width="130"
          header-align="center"
          align="center"
        />
        <el-table-column
          prop="name"
          label="姓名"
          min-width="140"
          header-align="center"
          align="center"
        />
        <el-table-column label="联系方式" min-width="220" header-align="center" align="center">
          <template #default="scope">
            <div class="contact-cell">
              <span>{{ formatText(scope.row.phone) }}</span>
              <span class="muted">{{ formatText(scope.row.email) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="hireDate"
          label="入职日期"
          min-width="120"
          header-align="center"
          align="center"
        >
          <template #default="scope">
            {{ formatText(scope.row.hireDate) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" header-align="center" align="center">
          <template #default="scope">
            <el-tag :type="getStatusPresentation(scope.row.status).type" effect="light">
              {{ getStatusPresentation(scope.row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="updatedAt"
          label="最后更新"
          min-width="180"
          header-align="center"
          align="center"
        />
        <el-table-column
          label="操作"
          width="120"
          fixed="right"
          header-align="center"
          align="center"
        >
          <template #default="scope">
            <el-button text type="primary" @click.stop="openDetail(scope.row)">编辑</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无员工数据" />
        </template>
      </el-table>
    </div>

    <div class="pagination-wrap">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next"
        :current-page="props.page"
        :page-size="props.size"
        :page-sizes="[10, 20, 50]"
        :total="props.total"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>
  </el-card>
</template>

<style scoped>
.table-card {
  border-radius: 14px;
  border-color: #dce5f2;
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.subtitle,
.summary,
.muted {
  color: #64748b;
}

.subtitle,
.summary {
  font-size: 13px;
}

.contact-cell {
  display: grid;
  gap: 2px;
}

.employee-table {
  height: 100%;
  cursor: pointer;
}

.table-content {
  flex: 1;
  min-height: 0;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

@media (max-width: 900px) {
  .table-header,
  .pagination-wrap {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
