import http from './index'

/**
 * 认证相关 API
 */

/**
 * 登录接口
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ token: string, user: { id, username, role } }>}
 */
export function apiLogin(username, password) {
  return http.post('/auth/login', { username, password })
}

/**
 * 登出接口（让服务端使 token 失效）
 */
export function apiLogout() {
  return http.post('/auth/logout')
}

/**
 * 获取当前登录用户信息
 */
export function apiGetProfile() {
  return http.get('/auth/profile')
}
