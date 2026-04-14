<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";

import { changePassword } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const router = useRouter();
const authStore = useAuthStore();
const formRef = ref<FormInstance>();
const loading = ref(false);
const isForceFlow = computed<boolean>(() => Boolean(authStore.user?.forcePasswordChange));
const pageTitle = computed<string>(() => (isForceFlow.value ? "首次登录请先修改密码" : "修改密码"));
const pageTip = computed<string>(() =>
  isForceFlow.value
    ? "为保障账户安全，你需要先完成密码修改，再重新登录系统。"
    : "为保障账号安全，建议定期更新密码并妥善保管。",
);
const form = reactive<PasswordForm>({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const rules: FormRules<PasswordForm> = {
  oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "新密码至少 6 位", trigger: "blur" },
  ],
  confirmPassword: [{ required: true, message: "请确认新密码", trigger: "blur" }],
};

async function submit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }

  if (form.confirmPassword !== form.newPassword) {
    ElMessage.error("两次输入的新密码不一致");
    return;
  }

  loading.value = true;
  try {
    await changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });

    if (isForceFlow.value) {
      authStore.clearForcePasswordChange();
      authStore.clearAuth();
      ElMessage.success("密码修改成功，请使用新密码重新登录");
      await router.replace("/login");
      return;
    }

    ElMessage.success("密码修改成功");
    if (window.history.length > 1) {
      await router.back();
      return;
    }
    await router.push("/");
  } catch {
    // Interceptor handles API errors.
  } finally {
    loading.value = false;
  }
}

function handleBack(): void {
  if (window.history.length > 1) {
    void router.back();
    return;
  }
  void router.push("/");
}
</script>

<template>
  <main class="password-page">
    <section class="password-card">
      <el-page-header
        :class="['password-header', { 'password-header--force': isForceFlow }]"
        title="人事管理系统"
        :content="pageTitle"
        @back="handleBack"
      />
      <el-alert
        class="password-alert"
        :type="isForceFlow ? 'warning' : 'info'"
        :closable="false"
        :title="pageTip"
      />
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submit"
      >
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="form.oldPassword" type="password" show-password clearable />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="form.newPassword" type="password" show-password clearable />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            show-password
            clearable
            @keyup.enter="submit"
          />
        </el-form-item>

        <el-button type="primary" :loading="loading" @click="submit">确认修改</el-button>
      </el-form>
    </section>
  </main>
</template>

<style scoped>
.password-page {
  min-height: 100vh;
  display: grid;
  align-items: center;
  justify-items: center;
  padding: 24px 16px;
  overflow-y: auto;
  background: linear-gradient(145deg, #f8fafc 0%, #eef2f7 100%);
}

.password-card {
  width: min(460px, 100%);
  border-radius: 16px;
  border: 1px solid #d9e2ec;
  background: #fff;
  padding: 24px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
}

.password-header {
  margin-bottom: 12px;
}

:deep(.password-header--force .el-page-header__left) {
  display: none;
}

.password-alert {
  margin-bottom: 16px;
}
</style>
