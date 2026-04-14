<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";

import { getUsers, resetUserPassword } from "@/api/users";
import type { UserDTO } from "@/api/types";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const loading = ref(false);
const users = ref<UserDTO[]>([]);

async function loadUsers(): Promise<void> {
  loading.value = true;
  try {
    const response = await getUsers();
    users.value = response.data;
  } finally {
    loading.value = false;
  }
}

async function handleResetPassword(user: UserDTO): Promise<void> {
  const response = await resetUserPassword(user.id);
  await ElMessageBox.alert(
    `用户 ${user.username} 的临时密码为：${response.data.temporaryPassword}`,
    "重置成功",
    {
      confirmButtonText: "我已记录",
      type: "success",
    },
  );
}

onMounted(() => {
  if (!authStore.hasPermission("user:view")) {
    return;
  }
  loadUsers();
});
</script>

<template>
  <el-card shadow="never" class="users-card">
    <template #header>
      <div class="header-row">
        <span>账户管理</span>
      </div>
    </template>

    <el-table :data="users" v-loading="loading" stripe>
      <el-table-column
        prop="username"
        label="用户名"
        min-width="180"
        header-align="center"
        align="center"
      />
      <el-table-column label="角色" min-width="220" header-align="center" align="center">
        <template #default="scope">
          <el-tag v-for="role in scope.row.roles" :key="role" size="small" class="tag" type="info">
            {{ role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="status"
        label="状态"
        width="120"
        header-align="center"
        align="center"
      />
      <el-table-column label="操作" width="180" header-align="center" align="center">
        <template #default="scope">
          <el-button
            v-if="authStore.hasPermission('user:reset-password')"
            type="primary"
            text
            @click="handleResetPassword(scope.row)"
          >
            重置密码
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped>
.users-card {
  border-radius: 14px;
}

.header-row {
  font-weight: 700;
  color: #0f172a;
}

.tag {
  margin-right: 6px;
}
</style>
