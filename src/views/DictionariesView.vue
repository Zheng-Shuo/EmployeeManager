<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";

import {
  createDictionary,
  createDictionaryItem,
  deleteDictionary,
  deleteDictionaryItem,
  getDictionaries,
  getDictionaryById,
  updateDictionary,
  updateDictionaryItem,
} from "@/api/dictionaries";
import type {
  CreateCategoryRequest,
  CreateItemRequest,
  DictionaryCategoryDTO,
  DictionaryCategoryDetailDTO,
  DictionaryItemDTO,
  UpdateCategoryRequest,
  UpdateItemRequest,
} from "@/api/types";
import { useDictionaryStore } from "@/stores/dictionary";

const dictionaryStore = useDictionaryStore();

// ── Category list state ────────────────────────────────────────────
const categories = ref<DictionaryCategoryDTO[]>([]);
const categoriesLoading = ref(false);
const selectedCategoryId = ref<string>("");

// ── Category detail state ──────────────────────────────────────────
const categoryDetail = ref<DictionaryCategoryDetailDTO | null>(null);
const detailLoading = ref(false);

// ── Category dialog state ──────────────────────────────────────────
const categoryDialogVisible = ref(false);
const categoryDialogMode = ref<"create" | "edit">("create");
const categorySubmitting = ref(false);
const categoryFormRef = ref<FormInstance>();
const categoryForm = reactive<CreateCategoryRequest>({
  code: "",
  name: "",
  description: "",
  orgUnitId: null,
});

const categoryFormRules: FormRules<CreateCategoryRequest> = {
  code: [{ required: true, message: "请输入编码", trigger: "blur" }],
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
};

// ── Item dialog state ──────────────────────────────────────────────
const itemDialogVisible = ref(false);
const itemDialogMode = ref<"create" | "edit">("create");
const itemSubmitting = ref(false);
const itemFormRef = ref<FormInstance>();
const editingItemId = ref<string>("");
const itemForm = reactive<CreateItemRequest>({
  code: "",
  label: "",
  sortOrder: 0,
  isDefault: false,
  isEnabled: true,
  color: null,
});

const itemFormRules: FormRules<CreateItemRequest> = {
  code: [{ required: true, message: "请输入编码", trigger: "blur" }],
  label: [{ required: true, message: "请输入显示名称", trigger: "blur" }],
};

// ── Computed ───────────────────────────────────────────────────────
const selectedCategory = computed<DictionaryCategoryDTO | null>(
  () =>
    categories.value.find((c: DictionaryCategoryDTO) => c.id === selectedCategoryId.value) ?? null,
);

const items = computed<DictionaryItemDTO[]>(() => categoryDetail.value?.items ?? []);

const isSystemCategory = computed<boolean>(() => selectedCategory.value?.isSystem === true);

// ── Category list ──────────────────────────────────────────────────
async function loadCategories(): Promise<void> {
  categoriesLoading.value = true;
  try {
    const response = await getDictionaries();
    categories.value = response.data;
    if (categories.value.length > 0 && !selectedCategoryId.value) {
      selectedCategoryId.value = categories.value[0]!.id;
    }
  } finally {
    categoriesLoading.value = false;
  }
}

async function loadCategoryDetail(): Promise<void> {
  if (!selectedCategoryId.value) {
    categoryDetail.value = null;
    return;
  }
  detailLoading.value = true;
  try {
    const response = await getDictionaryById(selectedCategoryId.value);
    categoryDetail.value = response.data;
  } finally {
    detailLoading.value = false;
  }
}

function handleCategorySelect(id: string): void {
  selectedCategoryId.value = id;
}

watch(selectedCategoryId, (): void => {
  void loadCategoryDetail();
});

// ── Category CRUD ──────────────────────────────────────────────────
function openCreateCategory(): void {
  categoryDialogMode.value = "create";
  categoryForm.code = "";
  categoryForm.name = "";
  categoryForm.description = "";
  categoryForm.orgUnitId = null;
  categoryDialogVisible.value = true;
}

function openEditCategory(): void {
  if (!selectedCategory.value) {
    return;
  }
  categoryDialogMode.value = "edit";
  categoryForm.code = selectedCategory.value.code;
  categoryForm.name = selectedCategory.value.name;
  categoryForm.description = selectedCategory.value.description ?? "";
  categoryForm.orgUnitId = selectedCategory.value.orgUnitId ?? null;
  categoryDialogVisible.value = true;
}

async function handleCategorySubmit(): Promise<void> {
  const valid = await categoryFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }

  categorySubmitting.value = true;
  try {
    if (categoryDialogMode.value === "create") {
      await createDictionary({
        code: categoryForm.code.trim(),
        name: categoryForm.name.trim(),
        description: categoryForm.description?.trim() || null,
        orgUnitId: categoryForm.orgUnitId || null,
      });
      ElMessage.success("分类创建成功");
    } else {
      const payload: UpdateCategoryRequest = {
        name: categoryForm.name.trim(),
        description: categoryForm.description?.trim() || null,
      };
      await updateDictionary(selectedCategoryId.value, payload);
      ElMessage.success("分类更新成功");
    }
    categoryDialogVisible.value = false;
    await loadCategories();
    await loadCategoryDetail();
    void dictionaryStore.reload();
  } catch {
    // Errors handled by request interceptor.
  } finally {
    categorySubmitting.value = false;
  }
}

async function handleDeleteCategory(): Promise<void> {
  if (!selectedCategory.value) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定删除分类「${selectedCategory.value.name}」？该操作将级联删除所有字典项。`,
      "删除确认",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }

  try {
    await deleteDictionary(selectedCategoryId.value);
    ElMessage.success("分类已删除");
    selectedCategoryId.value = "";
    categoryDetail.value = null;
    await loadCategories();
    void dictionaryStore.reload();
  } catch {
    // Errors handled by request interceptor.
  }
}

// ── Item CRUD ──────────────────────────────────────────────────────
function openCreateItem(): void {
  itemDialogMode.value = "create";
  editingItemId.value = "";
  itemForm.code = "";
  itemForm.label = "";
  itemForm.sortOrder = 0;
  itemForm.isDefault = false;
  itemForm.isEnabled = true;
  itemForm.color = null;
  itemDialogVisible.value = true;
}

function openEditItem(item: DictionaryItemDTO): void {
  itemDialogMode.value = "edit";
  editingItemId.value = item.id;
  itemForm.code = item.code;
  itemForm.label = item.label;
  itemForm.sortOrder = item.sortOrder;
  itemForm.isDefault = item.isDefault;
  itemForm.isEnabled = item.isEnabled;
  itemForm.color = item.color ?? null;
  itemDialogVisible.value = true;
}

async function handleItemSubmit(): Promise<void> {
  const valid = await itemFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }

  itemSubmitting.value = true;
  try {
    if (itemDialogMode.value === "create") {
      const payload: CreateItemRequest = {
        code: itemForm.code.trim(),
        label: itemForm.label.trim(),
        sortOrder: itemForm.sortOrder,
        isDefault: itemForm.isDefault,
        isEnabled: itemForm.isEnabled,
        color: itemForm.color || null,
      };
      await createDictionaryItem(selectedCategoryId.value, payload);
      ElMessage.success("字典项添加成功");
    } else {
      const payload: UpdateItemRequest = {
        label: itemForm.label.trim(),
        sortOrder: itemForm.sortOrder,
        isDefault: itemForm.isDefault,
        isEnabled: itemForm.isEnabled,
        color: itemForm.color || null,
      };
      await updateDictionaryItem(selectedCategoryId.value, editingItemId.value, payload);
      ElMessage.success("字典项更新成功");
    }
    itemDialogVisible.value = false;
    await loadCategoryDetail();
    void dictionaryStore.reload();
  } catch {
    // Errors handled by request interceptor.
  } finally {
    itemSubmitting.value = false;
  }
}

async function handleDeleteItem(item: DictionaryItemDTO): Promise<void> {
  const action = item.isEnabled ? "禁用" : "删除";
  try {
    await ElMessageBox.confirm(
      `确定${action}字典项「${item.label}」？${item.isEnabled ? "首次删除将禁用该项，再次删除才会永久移除。" : "该操作不可恢复。"}`,
      `${action}确认`,
      { type: "warning", confirmButtonText: action, cancelButtonText: "取消" },
    );
  } catch {
    return;
  }

  try {
    await deleteDictionaryItem(selectedCategoryId.value, item.id);
    ElMessage.success(`字典项已${action}`);
    await loadCategoryDetail();
    void dictionaryStore.reload();
  } catch {
    // Errors handled by request interceptor.
  }
}

// ── Init ────────────────────────────────────────────────────────
onMounted((): void => {
  void loadCategories();
});
</script>

<template>
  <section class="dict-page">
    <!-- 左栏：分类列表 -->
    <el-card shadow="never" class="category-panel">
      <template #header>
        <div class="panel-header">
          <span class="panel-title">字典分类</span>
          <el-button type="primary" size="small" @click="openCreateCategory">新增</el-button>
        </div>
      </template>

      <div v-loading="categoriesLoading" class="category-list">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          :class="{ active: cat.id === selectedCategoryId }"
          @click="handleCategorySelect(cat.id)"
        >
          <div class="category-name">
            {{ cat.name }}
            <el-tag v-if="cat.isSystem" size="small" type="info" class="system-tag">系统</el-tag>
          </div>
          <div class="category-code">{{ cat.code }}</div>
        </div>
        <el-empty v-if="categories.length === 0 && !categoriesLoading" description="暂无字典分类" />
      </div>
    </el-card>

    <!-- 右栏：字典项列表 -->
    <el-card shadow="never" class="items-panel">
      <template #header>
        <div class="panel-header">
          <div>
            <span class="panel-title">{{ selectedCategory?.name ?? "字典项" }}</span>
            <span v-if="selectedCategory" class="panel-subtitle"
              >（{{ selectedCategory.code }}）</span
            >
          </div>
          <div v-if="selectedCategory" class="panel-actions">
            <el-button size="small" :disabled="isSystemCategory" @click="openEditCategory">
              编辑分类
            </el-button>
            <el-button
              size="small"
              type="danger"
              :disabled="isSystemCategory"
              @click="handleDeleteCategory"
            >
              删除分类
            </el-button>
            <el-button type="primary" size="small" @click="openCreateItem">新增字典项</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="detailLoading" :data="items" stripe border>
        <el-table-column prop="code" label="编码" min-width="140" />
        <el-table-column prop="label" label="显示名称" min-width="140" />
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column label="默认" width="80" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.isDefault" size="small" type="success">是</el-tag>
            <span v-else class="muted">否</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isEnabled ? 'success' : 'info'" size="small">
              {{ scope.row.isEnabled ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签颜色" width="100" align="center">
          <template #default="scope">
            <div
              v-if="scope.row.color"
              class="color-swatch"
              :style="{ background: scope.row.color }"
            />
            <span v-else class="muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="scope">
            <el-button text type="primary" size="small" @click="openEditItem(scope.row)"
              >编辑</el-button
            >
            <el-button text type="danger" size="small" @click="handleDeleteItem(scope.row)">
              {{ scope.row.isEnabled ? "禁用" : "删除" }}
            </el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty v-if="selectedCategory" description="当前分类暂无字典项" />
          <el-empty v-else description="请先选择一个字典分类" />
        </template>
      </el-table>
    </el-card>

    <!-- 分类编辑对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="categoryDialogMode === 'create' ? '新增字典分类' : '编辑字典分类'"
      width="480px"
      destroy-on-close
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryFormRules"
        label-position="top"
      >
        <el-form-item label="编码" prop="code">
          <el-input
            v-model="categoryForm.code"
            :disabled="categoryDialogMode === 'edit'"
            placeholder="如 employee_status"
            clearable
          />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="如 员工状态" clearable />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="2"
            placeholder="可选描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="categorySubmitting" @click="handleCategorySubmit">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 字典项编辑对话框 -->
    <el-dialog
      v-model="itemDialogVisible"
      :title="itemDialogMode === 'create' ? '新增字典项' : '编辑字典项'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="itemFormRef" :model="itemForm" :rules="itemFormRules" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="编码" prop="code">
              <el-input
                v-model="itemForm.code"
                :disabled="itemDialogMode === 'edit'"
                placeholder="如 ACTIVE"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示名称" prop="label">
              <el-input v-model="itemForm.label" placeholder="如 在职" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="排序">
              <el-input-number
                v-model="itemForm.sortOrder"
                :min="0"
                controls-position="right"
                class="full-width"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="默认值">
              <el-switch v-model="itemForm.isDefault" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="启用">
              <el-switch v-model="itemForm.isEnabled" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="标签颜色">
          <div class="color-field">
            <el-color-picker v-model="itemForm.color" show-alpha />
            <el-input
              v-model="itemForm.color"
              placeholder="#52c41a（可选）"
              clearable
              class="color-input"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="itemSubmitting" @click="handleItemSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.dict-page {
  height: 100%;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
}

.category-panel,
.items-panel {
  border-radius: 14px;
  display: flex;
  flex-direction: column;
}

.category-panel :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
}

.items-panel :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.panel-subtitle {
  font-size: 13px;
  color: #64748b;
  margin-left: 4px;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.category-item:hover {
  background: #f0f5ff;
}

.category-item.active {
  background: #e0edff;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.category-code {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.system-tag {
  transform: scale(0.85);
}

.muted {
  color: #94a3b8;
}

.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  display: inline-block;
}

.color-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-input {
  flex: 1;
}

.full-width {
  width: 100%;
}

@media (max-width: 900px) {
  .dict-page {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
}
</style>
