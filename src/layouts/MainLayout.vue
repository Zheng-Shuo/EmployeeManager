<script setup lang="ts">
import { computed } from "vue";
import { ref } from "vue";

import ChangePasswordDialog from "@/components/account/ChangePasswordDialog.vue";
import UpdateUsernameDialog from "@/components/account/UpdateUsernameDialog.vue";
import AppHeader from "@/components/AppHeader.vue";
import AppSidebar from "@/components/AppSidebar.vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const usernameDialogVisible = ref(false);
const changePasswordDialogVisible = ref(false);
const forcePasswordDialogVisible = computed<boolean>({
  get: () => Boolean(authStore.user?.forcePasswordChange),
  set: () => {
    // 强制改密场景由业务状态控制，此处不允许手动关闭。
  },
});
</script>

<template>
  <el-container class="layout-root">
    <el-header class="layout-header">
      <AppHeader
        @open-update-username="usernameDialogVisible = true"
        @open-change-password="changePasswordDialogVisible = true"
      />
    </el-header>

    <el-container class="layout-body">
      <el-aside class="layout-sidebar" width="220px">
        <AppSidebar />
      </el-aside>

      <el-main class="layout-main">
        <RouterView />
      </el-main>
    </el-container>

    <UpdateUsernameDialog
      v-if="authStore.user"
      v-model:visible="usernameDialogVisible"
      :current-username="authStore.user.username"
      :user-id="authStore.user.userId"
    />
    <ChangePasswordDialog v-model:visible="changePasswordDialogVisible" />
    <ChangePasswordDialog v-model:visible="forcePasswordDialogVisible" force />
  </el-container>
</template>

<style scoped>
.layout-root {
  height: 100dvh;
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 0%, rgba(16, 185, 129, 0.12) 0, transparent 30%),
    radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.1) 0, transparent 26%),
    linear-gradient(160deg, #f7fafc 0%, #eef2f7 100%);
}

.layout-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 64px;
  border-bottom: 1px solid #dbe4ef;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(8px);
  padding: 0;
}

.layout-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.layout-sidebar {
  border-right: 1px solid #dbe4ef;
  background: rgba(255, 255, 255, 0.7);
  overflow: hidden;
}

.layout-main {
  padding: 16px;
  min-height: 0;
  overflow-y: auto;
}
</style>
