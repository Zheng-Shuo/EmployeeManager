<script setup lang="ts">
import { onBeforeUnmount, reactive, ref, watch } from "vue";
import type {
  FormInstance,
  FormRules,
  UploadInstance,
  UploadRawFile,
  UploadUserFile,
} from "element-plus";

import type { CreateEmployeeRequest, EmployeeStatus, Gender } from "@/api/types";

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
const orgUnitIdsInput = ref<string>("");
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
  status: "ACTIVE",
  orgUnitIds: [],
  primaryOrgUnitId: null,
});

const statusOptions: Array<{ label: string; value: EmployeeStatus }> = [
  { label: "在职", value: "ACTIVE" },
  { label: "停用", value: "DISABLED" },
  { label: "离职", value: "RESIGNED" },
  { label: "退休", value: "RETIRED" },
];

const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: "男", value: "MALE" },
  { label: "女", value: "FEMALE" },
];

const rules: FormRules<CreateEmployeeRequest> = {
  employeeNo: [{ required: true, message: "请输入工号", trigger: "blur" }],
  name: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  email: [{ type: "email", message: "请输入正确的邮箱格式", trigger: "blur" }],
};

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value;
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
  form.status = "ACTIVE";
  form.orgUnitIds = [];
  form.primaryOrgUnitId = null;
  orgUnitIdsInput.value = "";

  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value);
    photoPreviewUrl.value = "";
  }
  photoFile.value = null;
  attachmentFiles.value = [];
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
  attachmentFiles.value = fileList
    .map((item: UploadUserFile) => item.raw as File | undefined)
    .filter((item: File | undefined): item is File => Boolean(item));
}

function handleAttachmentsRemove(_: UploadUserFile, fileList: UploadUserFile[]): void {
  attachmentFiles.value = fileList
    .map((item: UploadUserFile) => item.raw as File | undefined)
    .filter((item: File | undefined): item is File => Boolean(item));
}

function parseOrgUnitIds(value: string): string[] {
  return value
    .split(/[，,\s]+/)
    .map((item: string) => item.trim())
    .filter((item: string) => item.length > 0);
}

watch(visible, (nextVisible: boolean): void => {
  if (!nextVisible) {
    resetForm();
  }
});

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }

  const orgUnitIds = parseOrgUnitIds(orgUnitIdsInput.value);

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
      status: form.status,
      orgUnitIds,
      primaryOrgUnitId: form.primaryOrgUnitId?.trim() || null,
    },
    photoFile: photoFile.value,
    attachmentFiles: attachmentFiles.value,
  });
}
</script>

<template>
  <el-dialog v-model="visible" title="新增员工" width="860px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-row :gutter="16" class="upload-row">
        <el-col :xs="24" :md="8">
          <el-form-item label="一寸照片">
            <el-upload
              ref="photoUploadRef"
              class="photo-upload"
              drag
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :limit="1"
              :on-change="handlePhotoChange"
            >
              <img
                v-if="photoPreviewUrl"
                :src="photoPreviewUrl"
                alt="员工照片预览"
                class="photo-preview"
              />
              <div v-else class="photo-placeholder">
                <div class="placeholder-title">一寸照片</div>
                <div class="placeholder-sub">点击或拖拽上传</div>
              </div>
            </el-upload>
            <el-button
              v-if="photoFile"
              type="danger"
              text
              class="clear-photo-btn"
              @click="clearPhoto"
            >
              移除照片
            </el-button>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="16">
          <el-form-item label="员工附件（可多选）">
            <el-upload
              ref="attachmentsUploadRef"
              class="attachments-upload"
              drag
              multiple
              :auto-upload="false"
              :on-change="handleAttachmentsChange"
              :on-remove="handleAttachmentsRemove"
            >
              <el-icon class="el-icon--upload"><i class="el-icon-upload" /></el-icon>
              <div class="el-upload__text">将文件拖拽到此处，或 <em>点击上传</em></div>
            </el-upload>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="14">
        <el-col :xs="24" :md="12">
          <el-form-item label="工号" prop="employeeNo">
            <el-input v-model="form.employeeNo" placeholder="请输入工号" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入姓名" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="14">
        <el-col :xs="24" :md="12">
          <el-form-item label="证件号">
            <el-input v-model="form.idCardNo" placeholder="请输入证件号" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="年龄">
            <el-input-number
              v-model="form.age"
              :min="0"
              :max="150"
              class="full-width"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="14">
        <el-col :xs="24" :md="12">
          <el-form-item label="性别">
            <el-select v-model="form.gender" placeholder="请选择性别" class="full-width" clearable>
              <el-option
                v-for="option in genderOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="状态">
            <el-select v-model="form.status" placeholder="请选择状态" class="full-width">
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

      <el-row :gutter="14">
        <el-col :xs="24" :md="12">
          <el-form-item label="出生日期">
            <el-date-picker
              v-model="form.birthDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择出生日期"
              class="full-width"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="入职日期">
            <el-date-picker
              v-model="form.hireDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择入职日期"
              class="full-width"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="14">
        <el-col :xs="24" :md="12">
          <el-form-item label="手机号">
            <el-input v-model="form.phone" placeholder="请输入手机号" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="14">
        <el-col :xs="24" :md="12">
          <el-form-item label="组织 ID 列表">
            <el-input v-model="orgUnitIdsInput" placeholder="多个组织 ID 使用逗号分隔" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="主组织 ID">
            <el-input v-model="form.primaryOrgUnitId" placeholder="请输入主组织 ID" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="联系地址">
        <el-input v-model="form.address" type="textarea" :rows="2" placeholder="请输入联系地址" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="props.submitting" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.full-width {
  width: 100%;
}

.upload-row {
  margin-bottom: 6px;
}

.photo-upload :deep(.el-upload-dragger) {
  width: 126px;
  height: 176px;
  padding: 0;
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.placeholder-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.placeholder-sub {
  margin-top: 6px;
  font-size: 12px;
}

.clear-photo-btn {
  margin-top: 6px;
}

.attachments-upload :deep(.el-upload-dragger) {
  width: 100%;
}
</style>
