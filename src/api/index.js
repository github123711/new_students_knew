import axios from 'axios'
import { ElMessage } from 'element-plus'

/**
 * Axios 实例配置
 * baseURL 从环境变量读取，方便区分开发/生产环境
 * 开发环境通过 vite.config.js 的 proxy 转发到后端
 */
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── 请求拦截器：自动携带 Token ─────────────────────────────
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('ct_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── 响应拦截器：统一错误处理 ──────────────────────────────
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const msg = error.response?.data?.message || error.message

    if (status === 401) {
      // Token 过期或未授权：清除登录态并跳转登录页
      localStorage.removeItem('ct_token')
      localStorage.removeItem('ct_user')
      // 避免循环依赖，直接操作 location
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      }
    } else if (status === 403) {
      ElMessage.error('权限不足')
    } else if (status === 404) {
      ElMessage.error('资源不存在')
    } else if (status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (msg) {
      ElMessage.error(msg)
    }

    return Promise.reject(error)
  }
)

export default http
