import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 任务系统状态管理
 * 每个任务有唯一 id，包含标题、描述、完成条件、当前状态
 * status: 'locked' | 'active' | 'completed'
 */
export const useTaskStore = defineStore('task', () => {
  // ── State ──────────────────────────────────────────────
  const tasks = ref([
    {
      id: 'task_welcome',
      title: '欢迎来到三中！',
      description: '前往校门口与守门阿伯对话，开启你的校园之旅。',
      status: 'active',   // 初始任务直接激活
      rewardText: '解锁校园地图',
      npcId: 'npc_guard',
    },
    {
      id: 'task_library',
      title: '知识的殿堂',
      description: '参观图书馆，与图书管理员交流，了解馆藏资源。',
      status: 'locked',
      rewardText: '获得"书香少年"称号',
      npcId: 'npc_librarian',
      unlockedBy: 'task_welcome',
    },
    {
      id: 'task_lab',
      title: '科技探索者',
      description: '进入实验楼，找到物理实验室的老师并完成演示实验。',
      status: 'locked',
      rewardText: '获得"小科学家"徽章',
      npcId: 'npc_lab_teacher',
      unlockedBy: 'task_library',
    },
    {
      id: 'task_sports',
      title: '操场集结',
      description: '前往操场，参加体育老师组织的小型运动挑战。',
      status: 'locked',
      rewardText: '解锁社团风采页面',
      npcId: 'npc_pe_teacher',
      unlockedBy: 'task_welcome',
    },
  ])

  // 当前对话中的任务（NPC 触发后设置）
  const activeDialogTask = ref(null)

  // ── Computed ───────────────────────────────────────────
  const completedCount = computed(
    () => tasks.value.filter((t) => t.status === 'completed').length
  )
  const totalCount = computed(() => tasks.value.length)
  const activeTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'active')
  )
  const progressPercent = computed(() =>
    totalCount.value > 0
      ? Math.round((completedCount.value / totalCount.value) * 100)
      : 0
  )

  // ── Actions ────────────────────────────────────────────
  /**
   * 完成任务并解锁后续任务
   * @param {string} taskId
   */
  function completeTask(taskId) {
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task || task.status !== 'active') return

    task.status = 'completed'

    // 解锁以当前任务为前置条件的任务
    tasks.value.forEach((t) => {
      if (t.unlockedBy === taskId && t.status === 'locked') {
        t.status = 'active'
      }
    })
  }

  /**
   * 根据 NPC ID 获取对应的激活任务
   * @param {string} npcId
   * @returns {object|null}
   */
  function getTaskByNpc(npcId) {
    return tasks.value.find(
      (t) => t.npcId === npcId && t.status === 'active'
    ) || null
  }

  function openDialog(task) { activeDialogTask.value = task }
  function closeDialog() { activeDialogTask.value = null }

  return {
    tasks,
    activeDialogTask,
    completedCount,
    totalCount,
    activeTasks,
    progressPercent,
    completeTask,
    getTaskByNpc,
    openDialog,
    closeDialog,
  }
})
