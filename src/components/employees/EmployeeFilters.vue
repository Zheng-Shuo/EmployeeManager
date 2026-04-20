<script setup lang="ts">
import { computed } from "vue";

import type { DictionaryItemDTO } from "@/api/types";
import { useDictionaryStore } from "@/stores/dictionary";

interface Props {
  loading: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  refresh: [];
  reset: [];
}>();

const keyword = defineModel<string>("keyword", { required: true });
const status = defineModel<string>("status", { required: true });

const dictionaryStore = useDictionaryStore();
const statusOptions = computed(() =>
  dictionaryStore.getItemsByCode("employee_status").map((item: DictionaryItemDTO) => ({
    label: item.label,
    value: item.id,
  })),
);

function handleReset(): void {
  emit("reset");
}

function handleRefresh(): void {
  emit("refresh");
}
</script>

<template>
  <el-card shadow="never" class="filters-card">
    <el-form label-position="top" class="filters-grid" @submit.prevent>
      <el-form-item label="关键字" class="field field-keyword">
        <el-input v-model="keyword" clearable placeholder="按姓名或工号搜索" />
      </el-form-item>

      <el-form-item label="员工状态" class="field field-status">
        <el-select v-model="status" placeholder="全部状态" clearable>
          <el-option
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <div class="actions">
        <el-button :disabled="props.loading" @click="handleReset">重置</el-button>
        <el-button text :disabled="props.loading" @click="handleRefresh">刷新</el-button>
      </div>
    </el-form>
  </el-card>
</template>

<style scoped>
.filters-card {
  border-radius: 14px;
  border-color: #dce5f2;
}

.filters-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1.5fr) minmax(220px, 0.8fr) auto;
  align-items: end;
}

.field {
  margin-bottom: 0;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-bottom: 2px;
}

@media (max-width: 900px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
