<template>
  <nav class="navbar glass-card">
    <RouterLink class="navbar-brand gradient-text" to="/">云游三中</RouterLink>

    <div class="navbar-links">
      <RouterLink class="nav-link" to="/tour">3D 漫游</RouterLink>
      <RouterLink class="nav-link" to="/clubs">社团风采</RouterLink>
      <RouterLink class="nav-link" to="/departments">部门介绍</RouterLink>
      <RouterLink v-if="authStore.isAdmin" class="nav-link" to="/admin">管理后台</RouterLink>
    </div>

    <div class="navbar-actions">
      <template v-if="authStore.isLoggedIn">
        <span class="nav-username">{{ authStore.username }}</span>
        <button class="btn-ghost" @click="handleLogout" :disabled="loggingOut">
          {{ loggingOut ? '退出中...' : '退出登录' }}
        </button>
      </template>
      <template v-else>
        <RouterLink class="btn-primary" to="/login">登录</RouterLink>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const router = useRouter()
const loggingOut = ref(false)

async function handleLogout() {
  loggingOut.value = true
  try {
    await authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } finally {
    loggingOut.value = false
  }
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-nav);
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  padding: 12px 28px;
  border-radius: var(--radius-xl);
  width: calc(100% - 48px);
  max-width: 960px;
}

.navbar-brand {
  font-size: 18px;
  font-weight: 700;
  text-decoration: none;
  flex-shrink: 0;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex: 1;
}

.nav-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: color var(--transition-fast);
}
.nav-link:hover,
.nav-link.router-link-active {
  color: var(--color-text-primary);
}
.nav-link.router-link-active {
  font-weight: 600;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.nav-username {
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
