<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { Picture } from "@element-plus/icons-vue";
import type {
  FormInstance,
  FormRules,
  UploadInstance,
  UploadRawFile,
  UploadUserFile,
} from "element-plus";

import { getOrganizationTree } from "@/api/organizations";
import { getPositions } from "@/api/positions";
import type {
  AssignmentInput,
  CreateEmployeeRequest,
  DictionaryItemDTO,
  Gender,
  OrgUnitTreeNode,
  PositionDTO,
} from "@/api/types";
import { useDictionaryStore } from "@/stores/dictionary";

interface CreateEmployeeDialogPayload {
  data: CreateEmployeeRequest;
  photoFile: File | null;
  attachmentFiles: File[];
}

interface Props {
  submitting: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [payload: CreateEmployeeDialogPayload];
}>();
const visible = defineModel<boolean>("visible", { required: true });

const formRef = ref<FormInstance>();
const photoUploadRef = ref<UploadInstance>();
const attachmentsUploadRef = ref<UploadInstance>();
const photoPreviewUrl = ref<string>("");
const photoFile = ref<File | null>(null);
const attachmentFiles = ref<File[]>([]);
const attachmentFileList = ref<UploadUserFile[]>([]);

// ── API-driven option data ──
const orgTree = ref<OrgUnitTreeNode[]>([]);
const orgTreeLoading = ref(false);
const positionList = ref<PositionDTO[]>([]);
const positionsLoading = ref(false);

// ── Assignment fields ──
const selectedOrgUnitId = ref<string | null>(null);
const selectedPositionId = ref<string | null>(null);

// ── Age as string for controlled input ──
const ageInput = ref<string>("");

const form = reactive<CreateEmployeeRequest>({
  employeeNo: null,
  idCardNo: null,
  age: null,
  name: "",
  gender: null,
  birthDate: null,
  phone: null,
  email: null,
  address: null,
  hireDate: null,
  status: null,
  ethnicity: null,
  politicalStatus: null,
  employmentType: null,
});

const dictionaryStore = useDictionaryStore();

const statusOptions = computed(() =>
  dictionaryStore.getItemsByCode("employee_status").map((item: DictionaryItemDTO) => ({
    label: item.label,
    value: item.id,
  })),
);

const employmentTypeOptions = computed(() =>
  dictionaryStore.getItemsByCode("employment_type").map((item: DictionaryItemDTO) => ({
    label: item.label,
    value: item.id,
  })),
);

const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: "男", value: "MALE" },
  { label: "女", value: "FEMALE" },
];

// ── ID card validation ──
const ID_CARD_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const ID_CARD_CHECK_CODES = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];

function validateIdCard(idCard: string): boolean {
  if (!/^\d{17}[\dXx]$/.test(idCard)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += Number(idCard[i]) * (ID_CARD_WEIGHTS[i] as number);
  }
  return idCard[17]!.toUpperCase() === ID_CARD_CHECK_CODES[sum % 11];
}

function extractInfoFromIdCard(
  idCard: string,
): { gender: Gender; birthDate: string; age: number } | null {
  if (!validateIdCard(idCard)) {
    return null;
  }
  const birthStr = idCard.substring(6, 14);
  const year = Number(birthStr.substring(0, 4));
  const month = Number(birthStr.substring(4, 6));
  const day = Number(birthStr.substring(6, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const birthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const gender: Gender = Number(idCard[16]) % 2 === 1 ? "MALE" : "FEMALE";
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }
  return { gender, birthDate, age };
}

// Auto-extract gender, birthDate, age from ID card
watch(
  () => form.idCardNo,
  (newVal: string | null | undefined): void => {
    if (!newVal || newVal.length !== 18) {
      return;
    }
    const info = extractInfoFromIdCard(newVal);
    if (info) {
      form.gender = info.gender;
      form.birthDate = info.birthDate;
      form.age = info.age;
      ageInput.value = String(info.age);
    }
  },
);

function handleAgeInput(value: string): void {
  const cleaned = value.replace(/\D/g, "");
  ageInput.value = cleaned;
  if (cleaned === "") {
    form.age = null;
  } else {
    form.age = Number(cleaned);
  }
}

// ── Form valid check for submit button ──
const isFormValid = computed((): boolean => {
  const idCard = form.idCardNo?.trim() ?? "";
  return (
    form.name.trim().length > 0 &&
    idCard.length === 18 &&
    validateIdCard(idCard) &&
    !!form.gender &&
    form.age != null &&
    (form.age as number) >= 1 &&
    (form.age as number) <= 150 &&
    !!form.birthDate &&
    !!form.hireDate &&
    !!form.employmentType
  );
});

const rules: FormRules<CreateEmployeeRequest> = {
  name: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  idCardNo: [
    { required: true, message: "请输入身份证号", trigger: "blur" },
    {
      validator: (
        _rule: unknown,
        value: string | null,
        callback: (error?: Error) => void,
      ): void => {
        if (!value) {
          callback();
          return;
        }
        if (value.length !== 18) {
          callback(new Error("身份证号必须为18位"));
          return;
        }
        if (!validateIdCard(value)) {
          callback(new Error("身份证号校验不通过"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  gender: [{ required: true, message: "请选择性别", trigger: "change" }],
  age: [
    {
      required: true,
      validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void): void => {
        if (form.age === null || form.age === undefined) {
          callback(new Error("请输入年龄"));
          return;
        }
        if (form.age < 1 || form.age > 150) {
          callback(new Error("年龄范围 1-150"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  birthDate: [{ required: true, message: "请选择出生日期", trigger: "change" }],
  hireDate: [{ required: true, message: "请选择入职日期", trigger: "change" }],
  employmentType: [{ required: true, message: "请选择雇佣类型", trigger: "change" }],
};

async function loadOrgTree(): Promise<void> {
  orgTreeLoading.value = true;
  try {
    const response = await getOrganizationTree();
    orgTree.value = response.data;
  } finally {
    orgTreeLoading.value = false;
  }
}

async function loadPositions(orgUnitId: string): Promise<void> {
  positionsLoading.value = true;
  try {
    const response = await getPositions({ orgUnitId });
    positionList.value = response.data;
  } finally {
    positionsLoading.value = false;
  }
}

// When org unit changes, reload positions
watch(selectedOrgUnitId, (nextOrgId: string | null): void => {
  selectedPositionId.value = null;
  positionList.value = [];
  if (nextOrgId) {
    void loadPositions(nextOrgId);
  }
});

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + "KB";
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

function getFileExtension(name: string): string {
  const ext = name.split(".").pop();
  return ext ? ext.toUpperCase() : "";
}

function setDefaultValues(): void {
  const defaultStatus = dictionaryStore.getDefaultItemId("employee_status");
  if (defaultStatus) {
    form.status = defaultStatus;
  }
  const defaultEmploymentType = dictionaryStore.getDefaultItemId("employment_type");
  if (defaultEmploymentType) {
    form.employmentType = defaultEmploymentType;
  }
}

function resetForm(): void {
  form.employeeNo = null;
  form.idCardNo = null;
  form.age = null;
  form.name = "";
  form.gender = null;
  form.birthDate = null;
  form.phone = null;
  form.email = null;
  form.address = null;
  form.hireDate = null;
  form.status = null;
  form.ethnicity = null;
  form.politicalStatus = null;
  form.employmentType = null;
  selectedOrgUnitId.value = null;
  selectedPositionId.value = null;
  positionList.value = [];
  ageInput.value = "";

  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value);
    photoPreviewUrl.value = "";
  }
  photoFile.value = null;
  attachmentFiles.value = [];
  attachmentFileList.value = [];
  photoUploadRef.value?.clearFiles();
  attachmentsUploadRef.value?.clearFiles();
  formRef.value?.clearValidate();
}

onBeforeUnmount((): void => {
  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value);
  }
});

function handlePhotoChange(file: UploadUserFile): void {
  const raw = file.raw as UploadRawFile | undefined;
  if (!raw) {
    return;
  }

  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value);
  }

  photoFile.value = raw as File;
  photoPreviewUrl.value = URL.createObjectURL(raw);
}

function clearPhoto(): void {
  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value);
    photoPreviewUrl.value = "";
  }
  photoFile.value = null;
  photoUploadRef.value?.clearFiles();
}

function handleAttachmentsChange(_: UploadUserFile, fileList: UploadUserFile[]): void {
  attachmentFileList.value = [...fileList];
  attachmentFiles.value = fileList
    .map((item: UploadUserFile) => item.raw as File | undefined)
    .filter((item: File | undefined): item is File => Boolean(item));
}

function handleAttachmentsRemove(_: UploadUserFile, fileList: UploadUserFile[]): void {
  attachmentFileList.value = [...fileList];
  attachmentFiles.value = fileList
    .map((item: UploadUserFile) => item.raw as File | undefined)
    .filter((item: File | undefined): item is File => Boolean(item));
}

function removeAttachment(file: UploadUserFile): void {
  if (file.raw) {
    attachmentsUploadRef.value?.handleRemove(file.raw);
  }
}

watch(visible, (nextVisible: boolean): void => {
  if (nextVisible) {
    void loadOrgTree();
    setDefaultValues();
  } else {
    resetForm();
  }
});

function buildAssignments(): AssignmentInput[] | undefined {
  if (!selectedOrgUnitId.value) {
    return undefined;
  }
  return [
    {
      orgUnitId: selectedOrgUnitId.value,
      positionId: selectedPositionId.value || null,
      isPrimary: true,
      startDate: normalizeDate(form.hireDate) ?? new Date().toISOString().slice(0, 10),
    },
  ];
}

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }

  const assignments = buildAssignments();

  emit("submit", {
    data: {
      ...form,
      employeeNo: form.employeeNo?.trim() || null,
      idCardNo: form.idCardNo?.trim() || null,
      age: form.age ?? null,
      name: form.name.trim(),
      gender: form.gender || null,
      birthDate: normalizeDate(form.birthDate),
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      address: form.address?.trim() || null,
      hireDate: normalizeDate(form.hireDate),
      status: form.status || null,
      ethnicity: form.ethnicity?.trim() || null,
      politicalStatus: form.politicalStatus?.trim() || null,
      employmentType: form.employmentType || null,
      assignments,
    },
    photoFile: photoFile.value,
    attachmentFiles: attachmentFiles.value,
  });
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="新增员工"
    width="min(720px, calc(100vw - 32px))"
    align-center
    class="employee-create-dialog"
    destroy-on-close
  >
    <template #header>
      <div class="dialog-header">
        <h3 class="dialog-title">新增员工</h3>
        <p class="dialog-subtitle">请填写员工基本信息，带 * 号为必填项</p>
      </div>
    </template>

    <div class="dialog-scroll-region">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <!-- 基本信息 -->
        <div class="form-section first-section">
          <div class="section-title">基本信息</div>
          <div class="basic-info-layout">
            <div class="photo-area">
              <el-upload
                ref="photoUploadRef"
                class="photo-upload"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/*"
                :limit="1"
                :on-change="handlePhotoChange"
              >
                <div class="photo-card">
                  <img
                    v-if="photoPreviewUrl"
                    :src="photoPreviewUrl"
                    alt="员工照片预览"
                    class="photo-preview"
                  />
                  <div v-else class="photo-placeholder">
                    <el-icon :size="32" color="#c0c4cc"><Picture /></el-icon>
                    <span class="photo-label">上传照片</span>
                  </div>
                </div>
              </el-upload>
              <el-button v-if="photoFile" type="danger" text size="small" @click="clearPhoto">
                移除
              </el-button>
            </div>

            <div class="info-fields">
              <el-row :gutter="16">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="姓名" prop="name">
                    <el-input v-model="form.name" placeholder="请输入姓名" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item label="身份证号" prop="idCardNo">
                    <el-input v-model="form.idCardNo" placeholder="请输入18位身份证号" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="性别" prop="gender">
                    <el-select
                      v-model="form.gender"
                      placeholder="请选择性别"
                      class="full-width"
                      clearable
                    >
                      <el-option
                        v-for="option in genderOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item label="年龄" prop="age">
                    <el-input
                      :model-value="ageInput"
                      placeholder="请输入年龄"
                      @input="handleAgeInput"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="出生日期" prop="birthDate">
                    <el-date-picker
                      v-model="form.birthDate"
                      type="date"
                      value-format="YYYY-MM-DD"
                      placeholder="请选择出生日期"
                      class="full-width"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item label="民族">
                    <el-input v-model="form.ethnicity" placeholder="请输入民族" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="工号">
                    <el-input v-model="form.employeeNo" placeholder="请输入工号" />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>

        <!-- 岗位信息 -->
        <div class="form-section">
          <div class="section-title">岗位信息</div>
          <el-row :gutter="16">
            <el-col :xs="24" :sm="8">
              <el-form-item label="部门">
                <el-tree-select
                  v-model="selectedOrgUnitId"
                  :data="orgTree"
                  :loading="orgTreeLoading"
                  :props="{ label: 'name', value: 'id', children: 'children' }"
                  placeholder="请选择部门"
                  check-strictly
                  filterable
                  clearable
                  class="full-width"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-form-item label="职位">
                <el-select
                  v-model="selectedPositionId"
                  :loading="positionsLoading"
                  :disabled="!selectedOrgUnitId"
                  placeholder="请先选择部门"
                  filterable
                  clearable
                  class="full-width"
                >
                  <el-option
                    v-for="pos in positionList"
                    :key="pos.id"
                    :label="pos.name"
                    :value="pos.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-form-item label="员工状态">
                <el-select
                  v-model="form.status"
                  placeholder="请选择员工状态"
                  class="full-width"
                  clearable
                >
                  <el-option
                    v-for="option in statusOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :xs="24" :sm="8">
              <el-form-item label="入职日期" prop="hireDate">
                <el-date-picker
                  v-model="form.hireDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="请选择入职日期"
                  class="full-width"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-form-item label="雇佣类型" prop="employmentType">
                <el-select
                  v-model="form.employmentType"
                  placeholder="请选择雇佣类型"
                  class="full-width"
                >
                  <el-option
                    v-for="option in employmentTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-form-item label="政治面貌">
                <el-input v-model="form.politicalStatus" placeholder="请输入政治面貌" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="24">
              <el-form-item label="工作地点">
                <el-input v-model="form.address" placeholder="请输入工作地址" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 联系方式 -->
        <div class="form-section">
          <div class="section-title">联系方式</div>
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="手机号">
                <el-input v-model="form.phone" placeholder="请输入手机号" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="工作邮箱" prop="email">
                <el-input v-model="form.email" placeholder="请输入工作邮箱" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 附件材料 -->
        <div class="form-section last-section">
          <div class="section-title">附件材料</div>
          <div class="attachments-area">
            <el-upload
              ref="attachmentsUploadRef"
              class="attachments-upload"
              drag
              multiple
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleAttachmentsChange"
              :on-remove="handleAttachmentsRemove"
            >
              <div class="upload-content">
                <el-icon :size="24" color="#909399"><i class="el-icon-paperclip" /></el-icon>
                <div class="upload-text">拖拽文件至此处，或 <em>点击上传</em></div>
                <div class="upload-hint">支持 PDF、Word、图片等格式，单个文件不超过 20MB</div>
              </div>
            </el-upload>
            <div v-if="attachmentFileList.length > 0" class="custom-file-list">
              <div
                v-for="file in attachmentFileList"
                :key="file.uid ?? file.name"
                class="file-item"
              >
                <div class="file-info">
                  <span class="file-ext-badge">{{ getFileExtension(file.name) }}</span>
                  <span class="file-name">{{ file.name }}</span>
                </div>
                <div class="file-actions">
                  <span class="file-size">{{ file.raw ? formatFileSize(file.raw.size) : "" }}</span>
                  <span class="file-remove" @click.stop="removeAttachment(file)">×</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="props.submitting"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          保存并提交
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.full-width {
  width: 100%;
}

:deep(.full-width.el-date-editor) {
  width: 100%;
}

/* ── Dialog 容器 ── */
:deep(.employee-create-dialog) {
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px) !important;
  margin: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
}

:deep(.employee-create-dialog .el-dialog__header) {
  padding: 24px 28px 0;
  margin-right: 0;
}

:deep(.employee-create-dialog .el-dialog__body) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0 28px;
  display: flex;
  flex-direction: column;
}

:deep(.employee-create-dialog .el-dialog__footer) {
  flex-shrink: 0;
  padding: 16px 28px 24px;
  border-top: 1px solid #f0f0f0;
}

/* ── Header ── */
.dialog-header {
  padding-right: 24px;
}

.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.4;
}

.dialog-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #8c8c8c;
}

/* ── 滚动区域 ── */
.dialog-scroll-region {
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 20px 0 4px;
}

/* ── 表单分区 ── */
.form-section {
  padding: 20px 0;
  border-top: 1px solid #f0f0f0;
}

.form-section.first-section {
  border-top: none;
  padding-top: 0;
}

.form-section.last-section {
  padding-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
}

/* ── 基本信息（照片 + 字段）── */
.basic-info-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.photo-area {
  flex-shrink: 0;
  /* align photo card top edge with the input boxes (skip label height) */
  padding-top: 24px;
}

.info-fields {
  flex: 1;
  min-width: 0;
}

.photo-card {
  width: 100px;
  height: 130px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
  overflow: hidden;
  background: #fafafa;
}

.photo-card:hover {
  border-color: #409eff;
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  color: #bfbfbf;
}

.photo-label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}

.photo-upload :deep(.el-upload) {
  border: none;
  background: none;
}

/* ── 附件上传（文件列表在虚线框内）── */
.attachments-area {
  border: 1px dashed #d9d9d9;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.attachments-area:hover {
  border-color: #409eff;
}

.attachments-upload {
  width: 100%;
}

.attachments-upload :deep(.el-upload) {
  width: 100%;
}

.attachments-upload :deep(.el-upload-dragger) {
  width: 100%;
  padding: 20px;
  border: none;
  border-radius: 0;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.upload-text {
  font-size: 13px;
  color: #595959;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
  cursor: pointer;
}

.upload-hint {
  font-size: 12px;
  color: #bfbfbf;
}

/* ── 自定义文件列表（虚线框内）── */
.custom-file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 12px 12px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.file-item:hover {
  background: #f5f5f5;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.file-ext-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 24px;
  padding: 0 6px;
  border-radius: 4px;
  background: #e6e8eb;
  color: #595959;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.file-name {
  font-size: 13px;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.file-size {
  font-size: 12px;
  color: #8c8c8c;
}

.file-remove {
  cursor: pointer;
  font-size: 16px;
  color: #bfbfbf;
  line-height: 1;
  transition: color 0.2s;
}

.file-remove:hover {
  color: #f56c6c;
}

/* ── Footer ── */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* ── 表单项间距微调 ── */
:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  font-size: 13px;
  color: #595959;
  padding-bottom: 4px !important;
}

/* ── 响应式 ── */
@media (max-width: 640px) {
  .basic-info-layout {
    flex-direction: column;
    align-items: center;
  }

  .photo-area {
    padding-top: 0;
  }

  .dialog-scroll-region {
    max-height: calc(100vh - 200px);
    padding: 16px 0 4px;
  }

  :deep(.employee-create-dialog .el-dialog__header) {
    padding: 20px 20px 0;
  }

  :deep(.employee-create-dialog .el-dialog__body) {
    padding: 0 20px;
  }

  :deep(.employee-create-dialog .el-dialog__footer) {
    padding: 12px 20px 20px;
  }
}
</style>
