<template>
  <div class="login-view">
    <div class="login-box glass-card">
      <!-- Logo & 标题 -->
      <div class="login-header">
        <div class="login-logo">🏫</div>
        <h1 class="login-title gradient-text">云游三中</h1>
        <p class="login-subtitle">登录以解锁完整漫游体验</p>
      </div>

      <!-- 表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          :loading="loading"
          style="width: 100%; margin-top: 8px;"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
      </el-form>

      <p class="login-footer">
        还没有账号？请联系学校管理员开通
      </p>
    </div>

    <!-- 装饰背景 -->
    <div class="login-bg-deco" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({ username: '', password: '' })

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码',   trigger: 'blur' }],
}

async function handleLogin() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return // 校验失败，Element Plus 会自动显示错误
  }

  loading.value = true
  try {
    await authStore.login(form.username, form.password)
    ElMessage.success('登录成功，欢迎回来！')
    // 跳转到来源页面或首页
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    // 错误由 api/index.js 的响应拦截器统一弹出，这里只做状态复位
    form.password = ''
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
}

.login-box {
  width: 100%;
  max-width: 420px;
  padding: var(--spacing-2xl) var(--spacing-xl);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.login-logo {
  font-size: 56px;
  margin-bottom: var(--spacing-md);
}

.login-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: var(--spacing-sm);
}

.login-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.login-footer {
  text-align: center;
  margin-top: var(--spacing-lg);
  font-size: 12px;
  color: var(--color-text-muted);
}

/* Element Plus 在暗色背景下的覆盖样式 */
:deep(.el-form-item__label) {
  color: var(--color-text-secondary) !important;
  font-size: 13px;
}
:deep(.el-input__wrapper) {
  background: var(--glass-bg-strong) !important;
  border-color: var(--glass-border) !important;
  box-shadow: none !important;
}
:deep(.el-input__inner) {
  color: var(--color-text-primary) !important;
  background: transparent !important;
}
:deep(.el-input__inner::placeholder) {
  color: var(--color-text-muted) !important;
}

/* 装饰背景 */
.login-bg-deco {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 30% 40%, rgba(79, 142, 247, 0.12), transparent),
    radial-gradient(ellipse 50% 60% at 70% 60%, rgba(167, 139, 250, 0.10), transparent);
  pointer-events: none;
}
</style>
