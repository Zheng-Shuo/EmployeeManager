<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import { Peoples } from "@icon-park/vue-next";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";

interface HeaderBreadcrumbItem {
  label: string;
  path?: string;
}

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const nowText = ref("");
const emit = defineEmits<{
  openUpdateUsername: [];
  openChangePassword: [];
}>();

const pageTitle = computed(() => String(route.meta.title ?? "概览"));
const breadcrumbs = computed<HeaderBreadcrumbItem[]>(() => {
  const metaBreadcrumbs = route.meta.breadcrumbs as HeaderBreadcrumbItem[] | undefined;
  if (metaBreadcrumbs && metaBreadcrumbs.length > 0) {
    return metaBreadcrumbs;
  }
  return [{ label: pageTitle.value }];
});
const currentUserName = computed(() => authStore.user?.username ?? "未登录");
const currentRoleName = computed(() => authStore.user?.roles.at(0) ?? "访客");
const userInitial = computed(() => currentUserName.value.slice(0, 1).toUpperCase());

function updateNowText(): void {
  nowText.value = new Intl.DateTimeFormat("zh-CN", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

let timer: number | null = null;

onMounted(() => {
  updateNowText();
  timer = window.setInterval(updateNowText, 1000);
});

onUnmounted(() => {
  if (timer !== null) {
    window.clearInterval(timer);
  }
});

async function handleLogout(): Promise<void> {
  await authStore.logout();
  await router.push("/login");
  ElMessage.success("已退出登录");
}

function openChangePassword(): void {
  emit("openChangePassword");
}

function openUpdateUsername(): void {
  emit("openUpdateUsername");
}

function navigateTo(path: string | undefined): void {
  if (!path) {
    return;
  }
  void router.push(path);
}
</script>

<template>
  <div class="app-header">
    <div class="left-zone">
      <Peoples
        class="brand-icon"
        theme="outline"
        size="20"
        :stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        :fill="['#0f172a', '#e2e8f0']"
      />
      <span class="brand-name">人事管理系统</span>
      <span class="divider">|</span>
      <el-breadcrumb separator="/" class="header-breadcrumb">
        <el-breadcrumb-item v-for="item in breadcrumbs" :key="`${item.label}-${item.path ?? ''}`">
          <a v-if="item.path" class="breadcrumb-link" @click.prevent="navigateTo(item.path)">
            {{ item.label }}
          </a>
          <span v-else class="page-title">{{ item.label }}</span>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="right-zone">
      <el-tag effect="light" type="info" class="clock-tag">{{ nowText }}</el-tag>

      <el-dropdown trigger="click">
        <div class="user-trigger">
          <el-avatar class="user-avatar" size="small">{{ userInitial }}</el-avatar>
          <div class="user-meta">
            <span class="user-name">{{ currentUserName }}</span>
            <span class="user-role">{{ currentRoleName }}</span>
          </div>
          <el-icon class="arrow-icon"><ArrowDown /></el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="openUpdateUsername">修改账号</el-dropdown-item>
            <el-dropdown-item @click="openChangePassword">修改密码</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped>
.app-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.left-zone {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-icon {
  display: block;
}

.brand-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.divider {
  color: #cbd5e1;
}

.page-title {
  font-size: 16px;
  font-weight: 700;
  color: #475569;
}

.header-breadcrumb {
  font-size: 16px;
}

.breadcrumb-link {
  color: #2563eb;
}

.right-zone {
  display: flex;
  align-items: center;
  gap: 14px;
}

.clock-tag {
  font-size: 12px;
}

.user-trigger {
  cursor: pointer;
  color: #0f172a;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #dbe4ef;
  background: rgba(255, 255, 255, 0.9);
}

.user-avatar {
  background: linear-gradient(145deg, #22d3ee, #38bdf8);
  color: #0f172a;
  font-weight: 700;
}

.user-meta {
  display: grid;
  gap: 1px;
}

.user-name {
  font-size: 13px;
  color: #0f172a;
  line-height: 1.1;
}

.user-role {
  font-size: 11px;
  color: #64748b;
  line-height: 1.1;
}

.arrow-icon {
  color: #64748b;
}

@media (max-width: 960px) {
  .clock-tag,
  .user-role {
    display: none;
  }
}
</style>
