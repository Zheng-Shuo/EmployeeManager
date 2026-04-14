<template>
  <section class="dashboard">
    <el-card shadow="never" class="card">
      <el-empty description="请选择左侧菜单开始操作">
        <template #description>
          <p class="desc">当前页面为默认占位区，系统功能将根据你的权限展示在左侧菜单中。</p>
        </template>
      </el-empty>
    </el-card>
  </section>
</template>

<style scoped>
.dashboard {
  min-height: calc(100vh - 124px);
}

.card {
  border-radius: 14px;
  border-color: #dce5f2;
  background: rgba(255, 255, 255, 0.8);
}

.desc {
  color: #475569;
}
</style>
