<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";

import { updateUsername } from "@/api/users";
import { useAuthStore } from "@/stores/auth";

interface Props {
  currentUsername: string;
  userId: string;
}

const props = defineProps<Props>();
const visible = defineModel<boolean>("visible", { required: true });
const authStore = useAuthStore();
const loading = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  newUsername: "",
});

const rules: FormRules<typeof form> = {
  newUsername: [
    { required: true, message: "请输入新账号", trigger: "blur" },
    { min: 3, message: "账号长度至少 3 位", trigger: "blur" },
  ],
};

watch(
  visible,
  (nextVisible: boolean): void => {
    if (nextVisible) {
      form.newUsername = props.currentUsername;
      formRef.value?.clearValidate();
    }
  },
  { immediate: true },
);

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const response = await updateUsername(props.userId, {
      newUsername: form.newUsername.trim(),
    });
    authStore.updateUsername(response.data.username);
    ElMessage.success("账号修改成功");
    visible.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="修改账号" width="460px">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="当前账号">
        <el-input :model-value="props.currentUsername" disabled />
      </el-form-item>
      <el-form-item label="新账号" prop="newUsername">
        <el-input v-model="form.newUsername" clearable placeholder="请输入新账号" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确认修改</el-button>
    </template>
  </el-dialog>
</template>
