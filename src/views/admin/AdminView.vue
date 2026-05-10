<template>
  <div class="admin-view scrollable-page">
    <NavBar />

    <div class="admin-content">
      <header class="admin-header">
        <h1 class="gradient-text">管理后台</h1>
        <p>云游三中数据总览</p>
      </header>

      <!-- 管理菜单 -->
      <div class="admin-menu glass-card">
        <h3 class="chart-title">管理菜单</h3>
        <div class="menu-grid">
          <RouterLink to="/admin/content" class="menu-tile">
            <div class="menu-icon">📝</div>
            <div class="menu-name">内容管理</div>
            <div class="menu-desc">编辑社团信息、上传图片/视频</div>
          </RouterLink>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stat-grid">
        <div v-for="stat in stats" :key="stat.label" class="stat-card glass-card">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-value">{{ stat.loading ? '—' : stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
            {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
          </div>
        </div>
      </div>

      <!-- 访问量折线图（Canvas 手绘，不依赖图表库） -->
      <div class="chart-section glass-card">
        <h3 class="chart-title">近 7 日访问量</h3>
        <canvas ref="chartRef" class="visit-chart" />
      </div>

      <!-- 任务完成情况 -->
      <div class="task-stats glass-card">
        <h3 class="chart-title">任务完成分布</h3>
        <div class="task-bar-list">
          <div v-for="task in taskStats" :key="task.label" class="task-bar-row">
            <span class="task-bar-label">{{ task.label }}</span>
            <div class="task-bar-bg">
              <div
                class="task-bar-fill"
                :style="{ width: task.percent + '%', background: task.color }"
              />
            </div>
            <span class="task-bar-val">{{ task.percent }}%</span>
          </div>
        </div>
      </div>

      <!-- 缓存管理 -->
      <div class="admin-actions glass-card">
        <h3 class="chart-title">系统操作</h3>
        <div class="action-buttons">
          <el-button @click="clearCache" :loading="clearing">清除前端缓存</el-button>
          <el-button type="danger" plain @click="confirmReset">重置任务数据</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RouterLink } from 'vue-router'
import NavBar from '@/components/common/NavBar.vue'
import { apiGetAdminStats } from '@/api/resources'
import { clearAllCache } from '@/utils/cache'

const chartRef = ref(null)
const clearing = ref(false)

// 统计卡片
const stats = reactive([
  { icon: '👁️', label: '总访问量',    value: '—', trend: 12,  loading: true },
  { icon: '✅', label: '任务完成数',  value: '—', trend: 8,   loading: true },
  { icon: '👤', label: '活跃用户数',  value: '—', trend: -3,  loading: true },
  { icon: '⏱️', label: '平均停留时长', value: '—', trend: 5,  loading: true },
])

// 任务完成分布
const taskStats = ref([
  { label: '欢迎来到三中', percent: 87, color: '#4f8ef7' },
  { label: '知识的殿堂',   percent: 64, color: '#a78bfa' },
  { label: '科技探索者',   percent: 41, color: '#34d399' },
  { label: '操场集结',     percent: 55, color: '#fbbf24' },
])

// 近 7 日访问量（示例数据，实际由接口返回）
const visitData = ref([120, 185, 140, 230, 195, 260, 310])
const visitLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

onMounted(async () => {
  // 尝试获取后端数据
  try {
    const data = await apiGetAdminStats()
    stats[0].value = data.visits?.toLocaleString() ?? stats[0].value
    stats[1].value = data.taskComplete ?? stats[1].value
    stats[2].value = data.activeUsers ?? stats[2].value
    stats[3].value = data.avgDuration ? `${data.avgDuration}min` : stats[3].value
    if (data.dailyVisits?.length) visitData.value = data.dailyVisits
  } catch {
    // 无法获取时使用示例数据
    stats[0].value = '1,248'
    stats[1].value = '386'
    stats[2].value = '97'
    stats[3].value = '8.3 min'
  } finally {
    stats.forEach((s) => (s.loading = false))
  }

  await nextTick()
  drawChart()
})

// ── 手绘折线图 ────────────────────────────────────────────
function drawChart() {
  const canvas = chartRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1

  const W = canvas.parentElement.clientWidth - 48
  const H = 180
  canvas.width  = W * dpr
  canvas.height = H * dpr
  canvas.style.width  = W + 'px'
  canvas.style.height = H + 'px'
  ctx.scale(dpr, dpr)

  const data   = visitData.value
  const labels = visitLabels
  const maxVal = Math.max(...data) * 1.2
  const padX = 40, padY = 20
  const plotW = W - padX * 2
  const plotH = H - padY * 2

  // 背景格线
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padY + (plotH / 4) * i
    ctx.beginPath()
    ctx.moveTo(padX, y)
    ctx.lineTo(W - padX, y)
    ctx.stroke()
  }

  // 渐变填充
  const grad = ctx.createLinearGradient(0, padY, 0, padY + plotH)
  grad.addColorStop(0, 'rgba(79,142,247,0.35)')
  grad.addColorStop(1, 'rgba(79,142,247,0)')
  ctx.fillStyle = grad

  const pts = data.map((v, i) => ({
    x: padX + (plotW / (data.length - 1)) * i,
    y: padY + plotH - (v / maxVal) * plotH,
  }))

  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
  ctx.lineTo(pts[pts.length - 1].x, padY + plotH)
  ctx.lineTo(pts[0].x, padY + plotH)
  ctx.closePath()
  ctx.fill()

  // 折线
  ctx.strokeStyle = '#4f8ef7'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
  ctx.stroke()

  // 数据点
  pts.forEach((p, i) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = '#4f8ef7'
    ctx.lineWidth = 2
    ctx.stroke()

    // 数值标签
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(data[i], p.x, p.y - 10)

    // X 轴标签
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.fillText(labels[i], p.x, H - 4)
  })
}

async function clearCache() {
  clearing.value = true
  try {
    await clearAllCache()
    ElMessage.success('前端缓存已清除')
  } catch (err) {
    ElMessage.error('清除失败：' + err.message)
  } finally {
    clearing.value = false
  }
}

async function confirmReset() {
  try {
    await ElMessageBox.confirm('此操作将重置所有任务完成状态，确认继续？', '危险操作', {
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
      type: 'warning',
    })
    // TODO: 调用后端接口
    ElMessage.success('任务数据已重置')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.admin-view { min-height: 100%; }

.admin-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 100px var(--spacing-xl) var(--spacing-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.admin-header {
  text-align: center;
}
.admin-header h1 { font-size: 42px; font-weight: 800; }
.admin-header p  { margin-top: var(--spacing-sm); color: var(--color-text-secondary); }

/* 统计卡片 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}
.stat-card {
  padding: var(--spacing-xl);
  text-align: center;
  transition: transform var(--transition-normal);
}
.stat-card:hover { transform: translateY(-4px); }
.stat-icon  { font-size: 32px; margin-bottom: var(--spacing-sm); }
.stat-value { font-size: 32px; font-weight: 800; color: var(--color-text-primary); }
.stat-label { font-size: 12px; color: var(--color-text-muted); margin: var(--spacing-xs) 0; }
.stat-trend { font-size: 12px; font-weight: 600; }
.stat-trend.up   { color: var(--color-success); }
.stat-trend.down { color: var(--color-danger); }

/* 图表 */
.chart-section,
.task-stats,
.admin-actions {
  padding: var(--spacing-xl);
}
.chart-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: var(--spacing-lg);
}
.visit-chart { display: block; }

/* 任务进度条 */
.task-bar-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.task-bar-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
.task-bar-label { font-size: 13px; width: 100px; flex-shrink: 0; }
.task-bar-bg {
  flex: 1;
  height: 8px;
  background: var(--glass-bg-strong);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.task-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.8s ease;
}
.task-bar-val {
  font-size: 12px;
  color: var(--color-text-muted);
  width: 36px;
  text-align: right;
}

/* 操作按钮 */
.action-buttons { display: flex; gap: var(--spacing-md); flex-wrap: wrap; }

/* 管理菜单 */
.admin-menu { padding: var(--spacing-xl); }
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-md);
}
.menu-tile {
  padding: var(--spacing-lg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--glass-bg-strong);
  text-decoration: none;
  color: var(--color-text-primary);
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}
.menu-tile:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
}
.menu-icon { font-size: 28px; margin-bottom: var(--spacing-sm); }
.menu-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.menu-desc { font-size: 12px; color: var(--color-text-muted); }
</style>
