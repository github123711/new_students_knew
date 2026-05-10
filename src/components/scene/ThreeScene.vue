<template>
  <div ref="containerRef" class="three-container">
    <!-- 加载进度遮罩 -->
    <Transition name="fade">
      <div v-if="sceneStore.isLoading || !sceneStore.isReady" class="loading-overlay">
        <div class="loading-spinner" />
        <div class="loading-text">{{ sceneStore.loadProgressText }}</div>
        <div class="loading-bar">
          <div class="loading-bar-fill" :style="{ width: sceneStore.loadProgress + '%' }" />
        </div>
        <div v-if="sceneStore.loadError" class="load-error">
          ⚠️ {{ sceneStore.loadError }}
          <button class="btn-ghost" style="margin-top: 12px;" @click="initScene">重试</button>
        </div>
      </div>
    </Transition>

    <!-- 场景 HUD -->
    <template v-if="sceneStore.isReady">
      <!-- 摄像机模式切换 -->
      <div class="hud-top-right">
        <button
          class="mode-btn glass-card"
          :class="{ active: sceneStore.cameraMode === 'orbit' }"
          @click="sceneStore.setCameraMode('orbit')"
          title="环绕模式"
        >🔭 环绕</button>
        <button
          class="mode-btn glass-card"
          :class="{ active: sceneStore.cameraMode === 'walk' }"
          @click="sceneStore.setCameraMode('walk')"
          title="行走模式"
        >🚶 行走</button>
      </div>

      <!-- NPC 交互提示 -->
      <Transition name="slide-up">
        <div v-if="sceneStore.nearbyNpc" class="npc-prompt glass-card">
          <span>按 <kbd>E</kbd> 与 {{ sceneStore.nearbyNpc.name }} 对话</span>
        </div>
      </Transition>

      <!-- 行走模式键盘提示 -->
      <div v-if="sceneStore.cameraMode === 'walk'" class="walk-hint glass-card">
        WASD / 方向键移动 · 鼠标拖动转向 · 点击地面传送
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useSceneStore } from '@/stores/scene'
import { useTaskStore } from '@/stores/task'
import { fetchWithCache, blobToObjectUrl } from '@/utils/cache'

const props = defineProps({
  modelUrl: { type: String, default: '' },
})

const emit = defineEmits(['npc-interact'])

const containerRef = ref(null)
const sceneStore = useSceneStore()
const taskStore = useTaskStore()

// Three.js 核心对象（不放入响应式，避免 Vue 代理性能损耗）
let renderer, scene, camera, controls, animId
let walkKeys = {}  // 行走键盘状态

// ── 初始化场景 ─────────────────────────────────────────────
async function initScene() {
  if (!containerRef.value) return

  sceneStore.startLoading()

  try {
    // 1. 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    containerRef.value.appendChild(renderer.domElement)

    // 2. 场景与背景
    scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0a0e1a, 0.008)

    // 3. 相机
    camera = new THREE.PerspectiveCamera(
      60,
      containerRef.value.clientWidth / containerRef.value.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 5, 15)

    // 4. 环境光 + 方向光
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(10, 20, 10)
    scene.add(dirLight)

    // 5. OrbitControls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.maxPolarAngle = Math.PI / 2

    // 6. 加载模型（若有 URL 则加载 .splat/.ply，否则显示演示场景）
    if (props.modelUrl) {
      await loadGaussianSplat(props.modelUrl)
    } else {
      buildDemoScene()
      sceneStore.updateProgress(100)
    }

    // 7. 添加 NPC
    addNpcs()

    sceneStore.finishLoading()

    // 8. 启动渲染循环
    startRenderLoop()

    // 9. 事件监听
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    renderer.domElement.addEventListener('click', onSceneClick)
    renderer.domElement.addEventListener('keydown', (e) => e.preventDefault()) // 防止页面滚动

  } catch (err) {
    console.error('[ThreeScene] 初始化失败:', err)
    sceneStore.setLoadError(err)
  }
}

// ── 演示场景（无模型文件时的占位场景）─────────────────────
function buildDemoScene() {
  // 地面
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshLambertMaterial({ color: 0x1a3a2a })
  )
  ground.rotation.x = -Math.PI / 2
  ground.userData.isGround = true
  scene.add(ground)

  // 建筑体块
  const buildings = [
    { x: -8, z: -10, w: 6, h: 12, d: 4, color: 0x2a3a5a },
    { x:  8, z: -10, w: 6, h: 8,  d: 4, color: 0x3a2a5a },
    { x:  0, z: -15, w: 10, h: 16, d: 6, color: 0x2a4a6a },
  ]
  buildings.forEach(({ x, z, w, h, d, color }) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color })
    )
    mesh.position.set(x, h / 2, z)
    scene.add(mesh)
  })

  // 粒子星空
  const starGeo = new THREE.BufferGeometry()
  const starPositions = new Float32Array(3000)
  for (let i = 0; i < 3000; i++) {
    starPositions[i] = (Math.random() - 0.5) * 400
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 })))
}

// ── 加载高斯溅射模型 ─────────────────────────────────────
async function loadGaussianSplat(url) {
  // 下载并缓存模型文件
  const blob = await fetchWithCache(url, 'model-campus', (p) => {
    sceneStore.updateProgress(p * 0.9) // 前 90% 是下载
  })
  const objectUrl = blobToObjectUrl(blob)

  // 根据文件格式选择解析方式
  // 注意：Three.js 原生不支持 .splat，需要第三方库（如 @mkkellogg/gaussian-splats-3d）
  // 此处保留接口，方便后续接入
  if (url.endsWith('.ply')) {
    const { PLYLoader } = await import('three/examples/jsm/loaders/PLYLoader.js')
    const loader = new PLYLoader()
    await new Promise((resolve, reject) => {
      loader.load(
        objectUrl,
        (geometry) => {
          geometry.computeVertexNormals()
          const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({ vertexColors: true })
          )
          scene.add(mesh)
          sceneStore.updateProgress(100)
          resolve()
        },
        (evt) => sceneStore.updateProgress(90 + (evt.loaded / evt.total) * 10),
        reject
      )
    })
  } else {
    // .splat 格式：需要专用渲染器，此处暂显示提示
    console.warn('[ThreeScene] .splat 格式需要接入 gaussian-splats-3d 库')
    buildDemoScene()
    sceneStore.updateProgress(100)
  }

  URL.revokeObjectURL(objectUrl)
}

// ── NPC 定义与添加 ────────────────────────────────────────
const NPC_DEFS = [
  { id: 'npc_guard',     name: '守门阿伯', position: { x: 0, z: 8 },   color: 0xf4a261 },
  { id: 'npc_librarian', name: '图书管理员', position: { x: -6, z: -5 }, color: 0x4f8ef7 },
  { id: 'npc_lab_teacher', name: '物理老师', position: { x: 8, z: -8 },  color: 0x34d399 },
  { id: 'npc_pe_teacher',  name: '体育老师', position: { x: 0, z: 3 },   color: 0xfbbf24 },
]

const npcMeshes = []

function addNpcs() {
  NPC_DEFS.forEach((def) => {
    const group = new THREE.Group()

    // 身体
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.8, 4, 8),
      new THREE.MeshLambertMaterial({ color: def.color })
    )
    body.position.y = 0.9
    group.add(body)

    // 名牌（用点精灵代替文字，简化实现）
    const spriteGeo = new THREE.BufferGeometry()
    spriteGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 2.2, 0]), 3))
    const sprite = new THREE.Points(spriteGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 }))
    group.add(sprite)

    group.position.set(def.position.x, 0, def.position.z)
    group.userData = { npcId: def.id, npcName: def.name, isNpc: true }
    scene.add(group)
    npcMeshes.push(group)
  })
}

// ── 渲染循环 ─────────────────────────────────────────────
function startRenderLoop() {
  function tick() {
    animId = requestAnimationFrame(tick)
    controls.update()

    if (sceneStore.cameraMode === 'walk') {
      handleWalkMovement()
    }

    // 检测玩家与 NPC 的距离
    checkNpcProximity()

    renderer.render(scene, camera)
  }
  tick()
}

// ── 行走模式移动 ──────────────────────────────────────────
function handleWalkMovement() {
  const speed = 0.06
  const dir = new THREE.Vector3()
  camera.getWorldDirection(dir)
  dir.y = 0
  dir.normalize()

  const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize()

  if (walkKeys['KeyW'] || walkKeys['ArrowUp'])    camera.position.addScaledVector(dir, speed)
  if (walkKeys['KeyS'] || walkKeys['ArrowDown'])  camera.position.addScaledVector(dir, -speed)
  if (walkKeys['KeyA'] || walkKeys['ArrowLeft'])  camera.position.addScaledVector(right, -speed)
  if (walkKeys['KeyD'] || walkKeys['ArrowRight']) camera.position.addScaledVector(right, speed)

  // 锁定 Y 轴高度（贴地行走）
  camera.position.y = 1.7

  // 更新 store 中的玩家位置
  sceneStore.setPlayerPosition(
    camera.position.x,
    camera.position.y,
    camera.position.z
  )
}

// ── NPC 距离检测 ──────────────────────────────────────────
const NPC_INTERACT_DIST = 3.5

function checkNpcProximity() {
  let found = null
  for (const npc of npcMeshes) {
    const dist = camera.position.distanceTo(npc.position)
    if (dist < NPC_INTERACT_DIST) {
      found = { id: npc.userData.npcId, name: npc.userData.npcName }
      break
    }
  }
  if (found?.id !== sceneStore.nearbyNpc?.id) {
    found ? sceneStore.setNearbyNpc(found) : sceneStore.clearNearbyNpc()
  }
}

// ── 事件处理 ─────────────────────────────────────────────
function onKeyDown(e) {
  walkKeys[e.code] = true
  // 按 E 触发 NPC 交互
  if (e.code === 'KeyE' && sceneStore.nearbyNpc) {
    emit('npc-interact', sceneStore.nearbyNpc)
  }
}
function onKeyUp(e) { walkKeys[e.code] = false }

function onSceneClick(e) {
  if (sceneStore.cameraMode !== 'walk') return
  // 射线检测地面点击，实现传送
  const rect = renderer.domElement.getBoundingClientRect()
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  )
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)
  const grounds = scene.children.filter((c) => c.userData.isGround)
  const hits = raycaster.intersectObjects(grounds, true)
  if (hits.length > 0) {
    const pt = hits[0].point
    camera.position.set(pt.x, 1.7, pt.z)
  }
}

function onResize() {
  if (!containerRef.value) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

// ── 切换摄像机模式 ────────────────────────────────────────
watch(
  () => sceneStore.cameraMode,
  (mode) => {
    if (!controls) return
    if (mode === 'orbit') {
      controls.enabled = true
      controls.enableRotate = true
    } else {
      controls.enabled = false
    }
  }
)

// ── 生命周期 ─────────────────────────────────────────────
onMounted(initScene)

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  renderer?.dispose()
  controls?.dispose()
  // 移除 canvas
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>
.three-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0e1a;
}

/* 加载层 */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  background: rgba(10, 14, 26, 0.9);
  z-index: 10;
}
.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--glass-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text {
  font-size: 15px;
  color: var(--color-text-secondary);
}
.loading-bar {
  width: 240px;
  height: 4px;
  background: var(--glass-bg-strong);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.loading-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transition: width 0.3s ease;
}
.load-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--color-danger);
  font-size: 14px;
}

/* HUD */
.hud-top-right {
  position: absolute;
  top: 80px;
  right: var(--spacing-md);
  z-index: var(--z-hud);
  display: flex;
  gap: var(--spacing-sm);
}
.mode-btn {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--glass-bg);
  transition: all var(--transition-fast);
}
.mode-btn.active {
  color: var(--color-text-primary);
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
}

.npc-prompt {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-hud);
  padding: 10px 24px;
  font-size: 14px;
  white-space: nowrap;
}
kbd {
  display: inline-block;
  padding: 1px 6px;
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.walk-hint {
  position: absolute;
  bottom: var(--spacing-md);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-hud);
  padding: 8px 20px;
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}
</style>
