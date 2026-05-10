<template>
  <div class="tour-view">
    <NavBar />

    <!-- 任务面板（左侧悬浮） -->
    <Transition name="slide-up">
      <div v-if="taskPanelOpen" class="task-panel glass-card">
        <div class="task-panel-header">
          <h3>任务进度</h3>
          <span class="task-progress-badge">{{ taskStore.completedCount }}/{{ taskStore.totalCount }}</span>
          <button class="close-btn" @click="taskPanelOpen = false">×</button>
        </div>

        <!-- 进度条 -->
        <div class="task-progress-bar">
          <div class="task-progress-fill" :style="{ width: taskStore.progressPercent + '%' }" />
        </div>

        <!-- 任务列表 -->
        <div class="task-list">
          <div
            v-for="task in taskStore.tasks"
            :key="task.id"
            class="task-item"
            :class="task.status"
          >
            <div class="task-status-dot" />
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-desc">{{ task.description }}</div>
              <div v-if="task.status === 'completed'" class="task-reward">
                🎁 {{ task.rewardText }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 任务按钮 -->
    <button
      class="task-toggle-btn glass-card"
      @click="taskPanelOpen = !taskPanelOpen"
      title="任务面板"
    >
      📋 任务 ({{ taskStore.activeTasks.length }})
    </button>

    <!-- Three.js 场景 -->
    <ThreeScene :model-url="sceneStore.modelUrl" @npc-interact="handleNpcInteract" />

    <!-- NPC 对话弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentTask ? currentTask.title : '对话'"
      width="480px"
      :close-on-click-modal="false"
    >
      <template v-if="dialogNpc">
        <p class="dialog-npc-name">{{ dialogNpc.name }}</p>
        <p v-if="currentTask" class="dialog-task-desc">{{ currentTask.description }}</p>
        <p v-else class="dialog-no-task">{{ dialogNpc.name }} 目前没有任务给你，先完成其他任务吧！</p>
      </template>

      <template #footer>
        <template v-if="currentTask">
          <el-button @click="dialogVisible = false">先去看看</el-button>
          <el-button type="primary" @click="acceptTask">接受任务并完成</el-button>
        </template>
        <template v-else>
          <el-button type="primary" @click="dialogVisible = false">好的</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import NavBar from '@/components/common/NavBar.vue'
import ThreeScene from '@/components/scene/ThreeScene.vue'
import { useSceneStore } from '@/stores/scene'
import { useTaskStore } from '@/stores/task'
import { apiGetModelUrl } from '@/api/resources'
import { useAuthStore } from '@/stores/auth'

const sceneStore = useSceneStore()
const taskStore  = useTaskStore()
const authStore  = useAuthStore()

const taskPanelOpen = ref(false)
const dialogVisible = ref(false)
const dialogNpc = ref(null)
const currentTask = ref(null)

// 获取模型 URL（需要登录态）
onMounted(async () => {
  if (authStore.isLoggedIn) {
    try {
      const res = await apiGetModelUrl('campus')
      sceneStore.setModelUrl(res.url)
    } catch {
      // 获取失败时使用演示场景（ThreeScene 内部处理）
    }
  }
})

function handleNpcInteract(npc) {
  dialogNpc.value = npc
  currentTask.value = taskStore.getTaskByNpc(npc.id)
  dialogVisible.value = true
}

function acceptTask() {
  if (!currentTask.value) return
  taskStore.completeTask(currentTask.value.id)
  ElMessage.success(`任务完成：${currentTask.value.title}！获得：${currentTask.value.rewardText}`)
  dialogVisible.value = false
  currentTask.value = null
}
</script>

<style scoped>
.tour-view {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
}

/* 任务面板 */
.task-panel {
  position: fixed;
  left: 20px;
  top: 80px;
  z-index: var(--z-hud);
  width: 300px;
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-panel-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  flex-shrink: 0;
}
.task-panel-header h3 { flex: 1; font-size: 15px; font-weight: 700; }
.task-progress-badge {
  padding: 2px 10px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 700;
}
.close-btn {
  border: none;
  background: none;
  color: var(--color-text-muted);
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
}

.task-progress-bar {
  height: 4px;
  background: var(--glass-bg-strong);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--spacing-md);
  flex-shrink: 0;
}
.task-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transition: width 0.5s ease;
}

.task-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.task-item {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  background: var(--glass-bg);
  transition: opacity var(--transition-fast);
}
.task-item.locked { opacity: 0.4; }
.task-item.completed .task-status-dot { background: var(--color-success); }
.task-item.active   .task-status-dot { background: var(--color-primary); animation: pulse 2s ease infinite; }
.task-item.locked   .task-status-dot { background: var(--color-text-muted); }

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(79, 142, 247, 0.4); }
  50%       { opacity: 0.8; box-shadow: 0 0 0 6px rgba(79, 142, 247, 0); }
}

.task-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}
.task-title { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.task-desc  { font-size: 11px; color: var(--color-text-muted); line-height: 1.5; }
.task-reward {
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-success);
}

/* 任务切换按钮 */
.task-toggle-btn {
  position: fixed;
  left: 20px;
  bottom: 80px;
  z-index: var(--z-hud);
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  border-radius: var(--radius-full);
}

/* 对话弹窗 */
.dialog-npc-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary-light);
  margin-bottom: var(--spacing-sm);
}
.dialog-task-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.8;
}
.dialog-no-task {
  font-size: 14px;
  color: var(--color-text-muted);
}
</style>
