import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 3D 场景状态管理
 * - 管理模型加载进度、用户位置、镜头状态等
 */
export const useSceneStore = defineStore('scene', () => {
  // ── State ──────────────────────────────────────────────
  // 模型加载状态
  const isLoading = ref(false)
  const loadProgress = ref(0)       // 0 ~ 100
  const loadError = ref(null)

  // 场景就绪标志（模型加载完成后置 true）
  const isReady = ref(false)

  // 用户在 3D 世界中的位置（Three.js 坐标系）
  const playerPosition = ref({ x: 0, y: 0, z: 0 })

  // 镜头模式：'orbit'（环绕）| 'walk'（第一人称行走）
  const cameraMode = ref('orbit')

  // 当前靠近的 NPC 信息，null 表示无
  const nearbyNpc = ref(null)

  // 模型文件下载 URL（由后端接口返回）
  const modelUrl = ref('')

  // ── Computed ───────────────────────────────────────────
  const loadProgressText = computed(() =>
    isLoading.value ? `加载中 ${loadProgress.value}%` : isReady.value ? '加载完成' : '未开始'
  )

  // ── Actions ────────────────────────────────────────────
  function startLoading() {
    isLoading.value = true
    loadProgress.value = 0
    loadError.value = null
    isReady.value = false
  }

  function updateProgress(percent) {
    loadProgress.value = Math.min(100, Math.round(percent))
  }

  function finishLoading() {
    isLoading.value = false
    loadProgress.value = 100
    isReady.value = true
  }

  function setLoadError(err) {
    isLoading.value = false
    loadError.value = err?.message || '模型加载失败'
  }

  function setPlayerPosition(x, y, z) {
    playerPosition.value = { x, y, z }
  }

  function setCameraMode(mode) {
    if (['orbit', 'walk'].includes(mode)) {
      cameraMode.value = mode
    }
  }

  function setNearbyNpc(npc) { nearbyNpc.value = npc }
  function clearNearbyNpc() { nearbyNpc.value = null }

  function setModelUrl(url) { modelUrl.value = url }

  return {
    isLoading,
    loadProgress,
    loadError,
    isReady,
    playerPosition,
    cameraMode,
    nearbyNpc,
    modelUrl,
    loadProgressText,
    startLoading,
    updateProgress,
    finishLoading,
    setLoadError,
    setPlayerPosition,
    setCameraMode,
    setNearbyNpc,
    clearNearbyNpc,
    setModelUrl,
  }
})
