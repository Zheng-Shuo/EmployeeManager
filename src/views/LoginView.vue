<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";

import { login } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { useDictionaryStore } from "@/stores/dictionary";
import { useEthnicityStore } from "@/stores/ethnicity";

interface LoginForm {
  username: string;
  password: string;
}

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const dictionaryStore = useDictionaryStore();
const ethnicityStore = useEthnicityStore();
const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive<LoginForm>({
  username: "",
  password: "",
});

const rules: FormRules<LoginForm> = {
  username: [
    {
      required: true,
      message: "请输入用户名",
      trigger: "blur",
    },
  ],
  password: [
    {
      required: true,
      message: "请输入密码",
      trigger: "blur",
    },
    {
      min: 6,
      message: "密码长度至少 6 位",
      trigger: "blur",
    },
  ],
};

async function handleLogin(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const response = await login({
      username: form.username,
      password: form.password,
    });

    authStore.setLoginData(response.data);
    void dictionaryStore.loadAll();
    void ethnicityStore.loadAll();

    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.push(redirect);
    ElMessage.success("登录成功");
  } catch {
    // Errors are handled by request interceptor.
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="panel">
      <h1 class="title">员工管理系统</h1>
      <p class="subtitle">请输入账号信息登录系统</p>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" clearable />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-button type="primary" class="submit" :loading="loading" @click="handleLogin">
          登录
        </el-button>
      </el-form>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.16) 0, transparent 35%),
    radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.14) 0, transparent 32%),
    linear-gradient(145deg, #f8fafc 0%, #edf2f7 100%);
}

.panel {
  width: min(440px, 100%);
  border-radius: 18px;
  border: 1px solid #d9e2ec;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.1);
  padding: 26px;
}

.title {
  margin: 0;
  font-size: 28px;
  color: #0f172a;
}

.subtitle {
  margin: 8px 0 20px;
  color: #64748b;
}

.submit {
  width: 100%;
}
</style>
