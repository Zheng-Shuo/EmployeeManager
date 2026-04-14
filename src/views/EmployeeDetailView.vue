<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getEmployeeById } from "@/api/employees";
import type { EmployeeAttachmentDTO, EmployeeDetailDTO } from "@/api/types";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const employee = ref<EmployeeDetailDTO | null>(null);

function formatText(value?: string | null): string {
  return value && value.trim() ? value : "--";
}

function formatGender(value?: string | null): string {
  if (!value) {
    return "--";
  }

  const mapping: Record<string, string> = {
    MALE: "男",
    FEMALE: "女",
    男: "男",
    女: "女",
  };

  return mapping[value] ?? value;
}

function resolveFileUrl(path?: string | null): string {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${normalizedPath}`;
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function openAttachment(attachment: EmployeeAttachmentDTO): void {
  const url = resolveFileUrl(attachment.filePath);
  if (!url) {
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

async function loadDetail(): Promise<void> {
  const employeeId = String(route.params.id ?? "").trim();
  if (!employeeId) {
    await router.replace("/employees");
    return;
  }

  loading.value = true;
  try {
    const response = await getEmployeeById(employeeId);
    employee.value = response.data;
  } finally {
    loading.value = false;
  }
}

onMounted((): void => {
  void loadDetail();
});
</script>

<template>
  <section class="detail-page">
    <el-card shadow="never" class="detail-card">
      <el-skeleton :loading="loading" animated :rows="10">
        <template #default>
          <div v-if="employee" class="detail-content">
            <el-row :gutter="16" class="media-section">
              <el-col :xs="24" :md="8">
                <div class="photo-panel">
                  <el-image
                    v-if="employee.photoPath"
                    :src="resolveFileUrl(employee.photoPath)"
                    fit="cover"
                    class="photo-image"
                  />
                  <div v-else class="photo-placeholder">暂无照片</div>
                </div>
              </el-col>
              <el-col :xs="24" :md="16">
                <el-alert
                  title="员工附件会在下方列表展示，可直接点击下载。"
                  type="info"
                  :closable="false"
                />
              </el-col>
            </el-row>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="工号">{{ employee.employeeNo }}</el-descriptions-item>
              <el-descriptions-item label="证件号">{{
                formatText(employee.idCardNo)
              }}</el-descriptions-item>
              <el-descriptions-item label="姓名">{{ employee.name }}</el-descriptions-item>
              <el-descriptions-item label="年龄">{{ employee.age ?? "--" }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{
                formatGender(employee.gender)
              }}</el-descriptions-item>
              <el-descriptions-item label="状态">{{ employee.status }}</el-descriptions-item>
              <el-descriptions-item label="手机">{{
                formatText(employee.phone)
              }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{
                formatText(employee.email)
              }}</el-descriptions-item>
              <el-descriptions-item label="出生日期">{{
                formatText(employee.birthDate)
              }}</el-descriptions-item>
              <el-descriptions-item label="入职日期">{{
                formatText(employee.hireDate)
              }}</el-descriptions-item>
              <el-descriptions-item label="联系地址" :span="2">
                {{ formatText(employee.address) }}
              </el-descriptions-item>
              <el-descriptions-item label="所属部门" :span="2">
                <div class="tag-list">
                  <el-tag
                    v-for="department in employee.departments"
                    :key="department.id"
                    effect="light"
                    type="success"
                  >
                    {{ department.name }}
                  </el-tag>
                  <span v-if="employee.departments.length === 0">--</span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="职位" :span="2">
                <div class="tag-list">
                  <el-tag
                    v-for="position in employee.positions"
                    :key="position.id"
                    effect="light"
                    type="info"
                  >
                    {{ position.name }}
                  </el-tag>
                  <span v-if="employee.positions.length === 0">--</span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="员工附件" :span="2">
                <div v-if="(employee.attachments ?? []).length > 0" class="attachments-wrap">
                  <el-table :data="employee.attachments" size="small" border>
                    <el-table-column prop="originalName" label="文件名" min-width="240" />
                    <el-table-column label="大小" width="120">
                      <template #default="scope">
                        {{ formatFileSize(scope.row.fileSize) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="uploadedAt" label="上传时间" min-width="180" />
                    <el-table-column label="操作" width="120">
                      <template #default="scope">
                        <el-button text type="primary" @click="openAttachment(scope.row)">
                          下载
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <span v-else>--</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <el-empty v-else description="未查询到员工详情" />
        </template>
      </el-skeleton>
    </el-card>
  </section>
</template>

<style scoped>
.detail-page {
  display: grid;
}

.detail-card {
  border-radius: 14px;
}

.detail-content {
  display: grid;
  gap: 16px;
}

.media-section {
  margin-bottom: 4px;
}

.photo-panel {
  width: 120px;
  height: 168px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
}

.photo-image {
  width: 100%;
  height: 100%;
}

.photo-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attachments-wrap {
  width: 100%;
}
</style>
