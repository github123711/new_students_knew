import http from './index'

/**
 * 文件资源相关 API
 * 后端返回 Cloudflare R2 预签名下载地址
 */

/**
 * 获取高斯溅射模型文件的下载 URL
 * @param {string} modelName 模型名称/ID
 * @returns {Promise<{ url: string, expires: number }>}
 */
export function apiGetModelUrl(modelName) {
  return http.get('/resources/model', { params: { name: modelName } })
}

/**
 * 获取贴图文件的下载 URL
 * @param {string} textureName
 */
export function apiGetTextureUrl(textureName) {
  return http.get('/resources/texture', { params: { name: textureName } })
}

/**
 * 获取管理员统计数据
 * @returns {Promise<{ visits: number, taskComplete: number, activeUsers: number, dailyVisits: Array }>}
 */
export function apiGetAdminStats() {
  return http.get('/admin/stats')
}
