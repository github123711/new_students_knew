/**
 * 文件缓存工具
 * 使用 Cache API（Service Worker 级别的缓存）将模型/贴图文件缓存到本地
 * 避免每次打开页面都重新下载大文件
 */

const CACHE_NAME = 'cloud-tour-assets-v1'

/**
 * 从缓存获取文件，未命中则从 URL 下载并缓存
 * @param {string} url 文件下载地址（如 R2 预签名 URL）
 * @param {string} cacheKey 缓存键（稳定的标识，不含签名参数）
 * @param {(progress: number) => void} [onProgress] 下载进度回调 (0~100)
 * @returns {Promise<Blob>}
 */
export async function fetchWithCache(url, cacheKey, onProgress) {
  // Cache API 仅在 HTTPS 或 localhost 下可用
  if ('caches' in window) {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(cacheKey)
    if (cached) {
      return cached.blob()
    }
  }

  // 未命中缓存：使用 fetch + ReadableStream 跟踪进度
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`文件下载失败: ${response.status} ${response.statusText}`)
  }

  const contentLength = response.headers.get('Content-Length')
  const total = contentLength ? parseInt(contentLength, 10) : 0
  let loaded = 0
  const chunks = []

  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    if (onProgress && total > 0) {
      onProgress(Math.round((loaded / total) * 100))
    }
  }

  const blob = new Blob(chunks)

  // 写入缓存
  if ('caches' in window) {
    const cache = await caches.open(CACHE_NAME)
    // 用固定 cacheKey 存储，避免预签名 URL 过期后缓存失效
    await cache.put(cacheKey, new Response(blob.slice()))
  }

  return blob
}

/**
 * 清除所有本地缓存（管理员操作或版本升级时使用）
 */
export async function clearAllCache() {
  if ('caches' in window) {
    await caches.delete(CACHE_NAME)
  }
}

/**
 * 将 Blob 转换为 Object URL（用完后记得 revokeObjectURL）
 * @param {Blob} blob
 * @returns {string}
 */
export function blobToObjectUrl(blob) {
  return URL.createObjectURL(blob)
}
