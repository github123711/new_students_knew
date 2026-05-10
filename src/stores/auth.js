import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const HARDCODED_ACCOUNTS = [
  { username: 'fzszxxbtest', password: 'test001ABC', role: 'admin', id: 1 },
]

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('ct_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('ct_user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const username = computed(() => user.value?.username || '游客')

  async function login(inputUsername, inputPassword) {
    const matched = HARDCODED_ACCOUNTS.find(
      (a) => a.username === inputUsername && a.password === inputPassword
    )
    if (!matched) {
      const err = new Error('用户名或密码错误')
      err.response = { data: { message: '用户名或密码错误' } }
      throw err
    }

    const fakeToken = `local-${matched.username}-${Date.now()}`
    const userInfo = { id: matched.id, username: matched.username, role: matched.role }

    token.value = fakeToken
    user.value = userInfo
    localStorage.setItem('ct_token', fakeToken)
    localStorage.setItem('ct_user', JSON.stringify(userInfo))
  }

  async function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('ct_token')
    localStorage.removeItem('ct_user')
  }

  return { token, user, isLoggedIn, isAdmin, username, login, logout }
})
