<template>
  <main class="home-view">
    <section class="home-card">
      <h1 class="title">Employee Manager</h1>
      <p class="description">前端基建已就绪，可开始接入员工管理业务页面。</p>
    </section>
  </main>
</template>

<style scoped>
.home-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fb 0%, #eef3ff 100%);
}

.home-card {
  width: min(680px, 100%);
  background: #ffffff;
  border: 1px solid #e7ebf5;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.title {
  margin: 0;
  color: #111827;
  font-size: 28px;
  line-height: 1.2;
}

.description {
  margin: 12px 0 0;
  color: #475569;
  line-height: 1.6;
}
</style>
