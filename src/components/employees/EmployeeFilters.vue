<script setup lang="ts">
import { computed } from "vue";
import { RefreshRight } from "@element-plus/icons-vue";

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
const gender = defineModel<string>("gender", { required: true });
const employmentType = defineModel<string>("employmentType", { required: true });

const dictionaryStore = useDictionaryStore();
const statusOptions = computed(() =>
  dictionaryStore.getItemsByName("员工状态").map((item: DictionaryItemDTO) => ({
    label: item.label,
    value: item.id,
  })),
);
const employmentTypeOptions = computed(() =>
  dictionaryStore.getItemsByName("用工形式").map((item: DictionaryItemDTO) => ({
    label: item.label,
    value: item.id,
  })),
);
const genderOptions = [
  { label: "男", value: "MALE" },
  { label: "女", value: "FEMALE" },
];

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

      <el-form-item label="性别" class="field field-gender">
        <el-select v-model="gender" placeholder="全部性别" clearable>
          <el-option
            v-for="option in genderOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="用工形式" class="field field-employment-type">
        <el-select v-model="employmentType" placeholder="全部用工形式" clearable>
          <el-option
            v-for="option in employmentTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <div class="actions">
        <el-button :disabled="props.loading" @click="handleReset">重置</el-button>
        <el-button text :disabled="props.loading" @click="handleRefresh">
          <el-icon><RefreshRight /></el-icon>
        </el-button>
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
  grid-template-columns:
    minmax(0, 1.4fr) minmax(180px, 0.8fr) minmax(180px, 0.7fr) minmax(180px, 0.8fr)
    auto;
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
