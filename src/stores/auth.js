import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiLogin, apiLogout } from '@/api/auth'

/**
 * 认证状态管理
 * - token 持久化到 localStorage，页面刷新后自动恢复登录态
 * - isAdmin 由后端返回的 role 字段决定
 */
export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────
  const token = ref(localStorage.getItem('ct_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('ct_user') || 'null'))

  // ── Computed ───────────────────────────────────────────
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const username = computed(() => user.value?.username || '游客')

  // ── Actions ────────────────────────────────────────────
  /**
   * 登录
   * @param {string} username
   * @param {string} password
   * @returns {Promise<void>}
   */
  async function login(username, password) {
    const data = await apiLogin(username, password)
    token.value = data.token
    user.value = data.user
    // 持久化到本地存储
    localStorage.setItem('ct_token', data.token)
    localStorage.setItem('ct_user', JSON.stringify(data.user))
  }

  /**
   * 登出：清空状态与本地存储
   */
  async function logout() {
    try {
      await apiLogout()
    } catch {
      // 即使接口失败也执行本地清除
    } finally {
      token.value = ''
      user.value = null
      localStorage.removeItem('ct_token')
      localStorage.removeItem('ct_user')
    }
  }

  return { token, user, isLoggedIn, isAdmin, username, login, logout }
})
