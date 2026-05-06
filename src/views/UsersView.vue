<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules, TransferDataItem } from "element-plus";
import type { AxiosError } from "axios";

import { getRoles } from "@/api/roles";
import { createUser, getUsers, resetUserPassword } from "@/api/users";
import type { CreateUserRequest, RoleDTO, UserDTO } from "@/api/types";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const loading = ref(false);
const users = ref<UserDTO[]>([]);
const creating = ref(false);
const createDialogVisible = ref(false);
const roleTransferData = ref<TransferDataItem[]>([]);
const createFormRef = ref<FormInstance>();

const createForm = reactive<CreateUserRequest>({
  username: "",
  password: "",
  roleIds: [],
});

const createFormRules: FormRules<CreateUserRequest> = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void): void => {
        if (value.trim().length === 0) {
          callback(new Error("用户名不能为空"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度至少 6 位", trigger: "blur" },
  ],
};

const canCreateUser = computed<boolean>(() => authStore.hasPermission("user:create"));
const canOperateUsers = computed<boolean>(() => authStore.hasPermission("user:reset-password"));
const isCreateFormReady = computed<boolean>(() => {
  const username = createForm.username.trim();
  const password = createForm.password;
  return username.length > 0 && password.length >= 6;
});

async function loadUsers(): Promise<void> {
  loading.value = true;
  try {
    const response = await getUsers();
    users.value = response.data;
  } finally {
    loading.value = false;
  }
}

function buildTransferItems(roles: RoleDTO[]): TransferDataItem[] {
  return roles.map((role: RoleDTO) => ({
    key: role.id,
    label: `${role.name}${role.description ? `（${role.description}）` : ""}`,
    disabled: false,
  }));
}

function resetCreateForm(): void {
  createForm.username = "";
  createForm.password = "";
  createForm.roleIds = [];
  createFormRef.value?.clearValidate();
}

async function loadRolesForTransfer(): Promise<void> {
  const response = await getRoles();
  roleTransferData.value = buildTransferItems(response.data);
}

async function openCreateDialog(): Promise<void> {
  if (!canCreateUser.value) {
    return;
  }
  if (roleTransferData.value.length === 0) {
    await loadRolesForTransfer();
  }
  createDialogVisible.value = true;
}

async function handleCreateUser(): Promise<void> {
  const valid = await createFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }

  creating.value = true;
  try {
    const roleIds = (createForm.roleIds ?? []).map((id: string | number) => String(id));
    const payload: CreateUserRequest = {
      username: createForm.username.trim(),
      password: createForm.password,
    };
    if (roleIds.length > 0) {
      payload.roleIds = roleIds;
    }

    await createUser(payload);
    ElMessage.success("用户创建成功");
    createDialogVisible.value = false;
    resetCreateForm();
    await loadUsers();
  } catch (error) {
    const requestError = error as AxiosError<{ code?: string; message?: string }>;
    const responseCode = requestError.response?.data?.code;

    if (responseCode === "USER_409_USERNAME_EXISTS") {
      ElMessage.error("用户名已存在，请更换后重试");
      return;
    }

    ElMessage.error(requestError.response?.data?.message ?? "创建用户失败，请稍后重试");
  } finally {
    creating.value = false;
  }
}

async function handleResetPassword(user: UserDTO): Promise<void> {
  const response = await resetUserPassword(user.id);
  await ElMessageBox.alert(`用户 ${user.username}：${response.data.message}`, "重置成功", {
    confirmButtonText: "我已记录",
    type: "success",
  });
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
        <el-button v-if="canCreateUser" type="primary" @click="openCreateDialog">
          新增用户
        </el-button>
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
        prop="statusLabel"
        label="状态"
        width="120"
        header-align="center"
        align="center"
      />
      <el-table-column
        v-if="canOperateUsers"
        label="操作"
        width="180"
        header-align="center"
        align="center"
      >
        <template #default="scope">
          <el-button type="primary" text @click="handleResetPassword(scope.row)">
            重置密码
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="createDialogVisible"
      title="新增用户"
      width="640px"
      append-to-body
      align-center
      :lock-scroll="true"
      destroy-on-close
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="createForm.password"
            type="password"
            show-password
            placeholder="请输入密码（至少 6 位）"
          />
        </el-form-item>

        <el-form-item label="角色分配">
          <el-transfer
            v-model="createForm.roleIds"
            :data="roleTransferData"
            filterable
            :titles="['可选角色', '已选角色']"
            filter-placeholder="请输入角色名搜索"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-actions">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="creating"
            :disabled="!isCreateFormReady || creating"
            @click="handleCreateUser"
          >
            创建
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.users-card {
  border-radius: 14px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  color: #0f172a;
}

.tag {
  margin-right: 6px;
}
</style>
