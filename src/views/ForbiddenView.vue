<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

function goBackHome(): void {
  router.push("/");
}
</script>

<template>
  <main class="forbidden-page">
    <el-result icon="warning" title="403" sub-title="你没有访问该页面的权限">
      <template #extra>
        <el-button type="primary" @click="goBackHome">返回首页</el-button>
      </template>
    </el-result>
  </main>
</template>

<style scoped>
.forbidden-page {
  min-height: calc(100vh - 64px);
  display: grid;
  place-items: center;
}
</style>
