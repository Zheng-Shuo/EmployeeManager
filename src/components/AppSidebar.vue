<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import {
  House,
  Notebook,
  OfficeBuilding,
  Setting,
  SetUp,
  Tickets,
  User,
} from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";

import { appMenuItems, type AppMenuItem } from "@/config/menu";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

function isMenuVisible(item: AppMenuItem): boolean {
  if (!item.permissions) {
    return true;
  }
  return authStore.hasAnyPermission(item.permissions);
}

function filterMenus(items: AppMenuItem[]): AppMenuItem[] {
  return items
    .filter((item: AppMenuItem) => isMenuVisible(item))
    .map((item: AppMenuItem) => {
      if (!item.children) {
        return item;
      }
      return {
        ...item,
        children: item.children.filter((child: AppMenuItem) => isMenuVisible(child)),
      };
    })
    .filter((item: AppMenuItem) => !item.children || item.children.length > 0);
}

const availableMenus = computed(() => filterMenus(appMenuItems));

const activeMenu = computed(() => {
  if (route.path.startsWith("/employees/")) {
    return "/employees";
  }
  return route.path;
});

const iconMap: Record<AppMenuItem["icon"], Component> = {
  house: House,
  users: User,
  office: OfficeBuilding,
  account: Tickets,
  shield: SetUp,
  setting: Setting,
  notebook: Notebook,
};

function resolveIcon(icon: AppMenuItem["icon"]): Component {
  return iconMap[icon];
}

function goTo(path: string): void {
  router.push(path);
}
</script>

<template>
  <el-menu :default-active="activeMenu" class="menu" @select="goTo">
    <template v-for="item in availableMenus" :key="item.key">
      <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.path">
        <template #title>
          <el-icon><component :is="resolveIcon(item.icon)" /></el-icon>
          <span>{{ item.label }}</span>
        </template>
        <el-menu-item v-for="child in item.children" :key="child.key" :index="child.path">
          <el-icon><component :is="resolveIcon(child.icon)" /></el-icon>
          <template #title>{{ child.label }}</template>
        </el-menu-item>
      </el-sub-menu>
      <el-menu-item v-else :index="item.path">
        <el-icon><component :is="resolveIcon(item.icon)" /></el-icon>
        <template #title>{{ item.label }}</template>
      </el-menu-item>
    </template>
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

:deep(.el-sub-menu) {
  margin: 0 10px 6px;
}

:deep(.el-sub-menu .el-sub-menu__title) {
  border-radius: 10px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

:deep(.el-sub-menu .el-sub-menu__title:hover) {
  background: #eef4ff;
}

:deep(.el-sub-menu .el-menu-item) {
  margin: 0 0 4px;
  min-width: unset;
  padding-left: 48px !important;
}
</style>
