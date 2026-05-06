<script setup lang="ts">
import { computed } from "vue";
import { ElMessage } from "element-plus";

import type { EmployeeListColumnConfigItem } from "@/composables/useEmployeeListColumnsConfig";
import { useEmployeeListColumnsConfig } from "@/composables/useEmployeeListColumnsConfig";

const { columns, moveColumnUp, moveColumnDown, setColumnVisible, save, reset } =
  useEmployeeListColumnsConfig();

const visibleCount = computed<number>(
  () => columns.value.filter((item: EmployeeListColumnConfigItem) => item.visible).length,
);

function handleSave(): void {
  save();
  ElMessage.success("配置已保存");
}

function handleReset(): void {
  reset();
  ElMessage.success("已恢复默认配置");
}

function updateVisible(key: EmployeeListColumnConfigItem["key"], value: boolean): void {
  setColumnVisible(key, value);
}
</script>

<template>
  <el-card shadow="never" class="config-card">
    <template #header>
      <div class="header-row">
        <div>
          <div class="title">功能配置</div>
          <div class="subtitle">员工列表列配置（显隐与展示顺序）</div>
        </div>
        <el-tag type="info" effect="light"
          >当前显示 {{ visibleCount }}/{{ columns.length }} 列</el-tag
        >
      </div>
    </template>

    <el-table :data="columns" border stripe>
      <el-table-column type="index" label="#" width="60" align="center" />
      <el-table-column prop="label" label="列名" min-width="220" />
      <el-table-column label="显示" width="120" align="center">
        <template #default="scope">
          <el-switch
            :model-value="scope.row.visible"
            @update:model-value="(value: boolean) => updateVisible(scope.row.key, value)"
          />
        </template>
      </el-table-column>
      <el-table-column label="顺序" width="180" align="center">
        <template #default="scope">
          <div class="order-actions">
            <el-button text :disabled="scope.$index === 0" @click="moveColumnUp(scope.row.key)">
              上移
            </el-button>
            <el-button
              text
              :disabled="scope.$index === columns.length - 1"
              @click="moveColumnDown(scope.row.key)"
            >
              下移
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="footer-actions">
      <el-button @click="handleReset">恢复默认</el-button>
      <el-button type="primary" @click="handleSave">保存配置</el-button>
    </div>
  </el-card>
</template>

<style scoped>
.config-card {
  border-radius: 14px;
  border-color: #dce5f2;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.order-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.footer-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
