<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <RouterView />
</template>

<style>
html,
body,
#app {
  margin: 0;
  width: 100%;
  height: 100%;
}

/* 全局隐藏滚动条但保留滚动能力 */
*,
*::before,
*::after {
  scrollbar-width: none;
}

*::-webkit-scrollbar {
  display: none;
}
</style>
