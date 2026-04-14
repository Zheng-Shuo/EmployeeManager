<script setup lang="ts">
import { reactive } from "vue";
import { ElMessage } from "element-plus";

import { useAuthStore } from "@/stores/auth";

interface ProfileForm {
  username: string;
  displayName: string;
  phone: string;
  email: string;
  remark: string;
}

const authStore = useAuthStore();
const form = reactive<ProfileForm>({
  username: authStore.user?.username ?? "",
  displayName: "",
  phone: "",
  email: "",
  remark: "",
});

function handleSave(): void {
  ElMessage.success("个人信息保存成功（演示页面，暂未接入后端接口）");
}
</script>

<template>
  <section class="profile-page">
    <el-card shadow="never" class="profile-card">
      <template #header>
        <div class="header-row">
          <div>
            <h2 class="page-title">个人信息</h2>
            <p class="page-subtitle">你可以在这里维护基础资料，当前为演示界面。</p>
          </div>
        </div>
      </template>

      <el-form label-position="top" :model="form" class="profile-form">
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="登录账号">
              <el-input v-model="form.username" disabled />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="姓名">
              <el-input v-model="form.displayName" placeholder="请输入姓名" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="手机号">
              <el-input v-model="form.phone" placeholder="请输入手机号" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="请输入邮箱" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="请输入备注"
          />
        </el-form-item>

        <el-button type="primary" @click="handleSave">保存修改</el-button>
      </el-form>
    </el-card>
  </section>
</template>

<style scoped>
.profile-page {
  display: grid;
}

.profile-card {
  border-radius: 14px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #64748b;
}

.profile-form {
  max-width: 860px;
}
</style>
