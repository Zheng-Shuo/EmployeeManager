<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";

import { changePassword } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";

interface Props {
  force?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  force: false,
});
const visible = defineModel<boolean>("visible", { required: true });
const emit = defineEmits<{
  success: [];
}>();

const authStore = useAuthStore();
const loading = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const titleText = computed<string>(() => (props.force ? "首次登录请先修改密码" : "修改密码"));
const tipText = computed<string>(() =>
  props.force
    ? "为保障账户安全，你需要先完成密码修改。"
    : "为保障账号安全，建议定期更新密码并妥善保管。",
);

const rules: FormRules<typeof form> = {
  oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "新密码至少 6 位", trigger: "blur" },
  ],
  confirmPassword: [{ required: true, message: "请确认新密码", trigger: "blur" }],
};

watch(visible, (nextVisible: boolean): void => {
  if (!nextVisible) {
    form.oldPassword = "";
    form.newPassword = "";
    form.confirmPassword = "";
    formRef.value?.clearValidate();
  }
});

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (form.newPassword !== form.confirmPassword) {
    ElMessage.error("两次输入的新密码不一致");
    return;
  }

  loading.value = true;
  try {
    await changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });

    if (props.force) {
      authStore.clearForcePasswordChange();
      ElMessage.success("密码修改成功");
    } else {
      ElMessage.success("密码修改成功");
    }

    visible.value = false;
    emit("success");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="titleText"
    width="500px"
    :close-on-click-modal="!props.force"
    :close-on-press-escape="!props.force"
    :show-close="!props.force"
  >
    <el-alert
      class="dialog-tip"
      :type="props.force ? 'warning' : 'info'"
      :closable="false"
      :title="tipText"
    />

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
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
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button v-if="!props.force" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-tip {
  margin-bottom: 16px;
}
</style>
