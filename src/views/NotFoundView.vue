<template>
  <div class="not-found">
    <div class="nf-content glass-card">
      <div class="nf-code gradient-text">404</div>
      <h2>页面不存在</h2>
      <p>你访问的页面已消失在校园的某个角落…</p>
      <RouterLink class="btn-primary" to="/">返回首页</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}
.nf-content {
  text-align: center;
  padding: var(--spacing-2xl);
  max-width: 400px;
}
.nf-code {
  font-size: 96px;
  font-weight: 900;
  line-height: 1;
  margin-bottom: var(--spacing-md);
}
h2 {
  font-size: 24px;
  margin-bottom: var(--spacing-sm);
}
p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}
</style>
