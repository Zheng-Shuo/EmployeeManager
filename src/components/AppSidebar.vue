<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import { House, OfficeBuilding, SetUp, Tickets, User } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";

import { appMenuItems, type AppMenuItem } from "@/config/menu";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const availableMenus = computed(() =>
  appMenuItems.filter(
    (item: AppMenuItem): boolean =>
      !item.permissions || authStore.hasAnyPermission(item.permissions),
  ),
);

const activeMenu = computed(() => {
  if (route.path.startsWith("/employees/")) {
    return "/employees";
  }
  return route.path;
});

function resolveIcon(icon: AppMenuItem["icon"]): Component {
  const iconMap = {
    house: House,
    users: User,
    office: OfficeBuilding,
    account: Tickets,
    shield: SetUp,
  };

  return iconMap[icon];
}

function goTo(path: string): void {
  router.push(path);
}
</script>

<template>
  <el-menu :default-active="activeMenu" class="menu" @select="goTo">
    <el-menu-item v-for="item in availableMenus" :key="item.key" :index="item.path">
      <el-icon>
        <component :is="resolveIcon(item.icon)" />
      </el-icon>
      <template #title>{{ item.label }}</template>
    </el-menu-item>
  </el-menu>
</template>

<style scoped>
.menu {
  border-right: 0;
  background: transparent;
  min-height: 100%;
  padding-top: 8px;
  box-sizing: border-box;
}

:deep(.el-menu-item) {
  border-radius: 10px;
  margin: 0 10px 6px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

:deep(.el-menu-item:first-child) {
  margin-top: 0;
}

:deep(.el-menu-item:hover) {
  background: #eef4ff;
}

:deep(.el-menu-item.is-active) {
  background: #e0edff;
  color: #1d4ed8;
}

:deep(.el-menu-item .el-menu-tooltip__trigger) {
  width: 100%;
}
</style>
