<template>
  <div class="clubs-view scrollable-page">
    <NavBar />

    <div class="page-content">
      <!-- 页头 -->
      <header class="page-header">
        <h1 class="gradient-text">社团风采</h1>
        <p>发现你的热情所在，加入志同道合的团队</p>
      </header>

      <!-- 分类筛选 -->
      <div class="filter-bar">
        <button
          v-for="cat in categories"
          :key="cat"
          class="filter-btn"
          :class="{ active: activeCategory === cat }"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <!-- 社团卡片网格 -->
      <Transition name="fade" mode="out-in">
        <div class="clubs-grid" :key="activeCategory">
          <div
            v-for="club in filteredClubs"
            :key="club.id"
            class="club-card glass-card"
            @click="openDetail(club)"
          >
            <!-- 封面图（暂用渐变色占位） -->
            <div class="club-cover" :style="getCoverStyle(club)">
              <div class="club-category-badge">{{ club.category }}</div>
            </div>

            <div class="club-body">
              <h3 class="club-name">{{ club.name }}</h3>
              <p class="club-desc">{{ club.description }}</p>

              <div class="club-tags">
                <span v-for="tag in club.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>

              <div class="club-meta">
                <span>👥 {{ club.members }} 人</span>
                <span>📅 成立于 {{ club.founded }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="selectedClub?.name"
      width="520px"
      destroy-on-close
    >
      <template v-if="selectedClub">
        <div class="detail-cover" :style="getCoverStyle(selectedClub)" />
        <p class="detail-desc">{{ selectedClub.description }}</p>
        <div class="detail-info">
          <div><strong>类别：</strong>{{ selectedClub.category }}</div>
          <div><strong>成员：</strong>{{ selectedClub.members }} 人</div>
          <div><strong>成立：</strong>{{ selectedClub.founded }} 年</div>
          <div><strong>联系：</strong>{{ selectedClub.contact }}</div>
        </div>
        <div class="club-tags" style="margin-top: 12px;">
          <span v-for="tag in selectedClub.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import clubsData from '@/data/clubs.json'

const clubs = ref(clubsData)
const activeCategory = ref('全部')
const dialogVisible = ref(false)
const selectedClub = ref(null)

// 从数据中提取所有分类
const categories = computed(() => {
  const cats = [...new Set(clubs.value.map((c) => c.category))]
  return ['全部', ...cats]
})

const filteredClubs = computed(() =>
  activeCategory.value === '全部'
    ? clubs.value
    : clubs.value.filter((c) => c.category === activeCategory.value)
)

function openDetail(club) {
  selectedClub.value = club
  dialogVisible.value = true
}

// 根据社团名生成确定性渐变颜色
const gradientPalette = [
  ['#4f8ef7', '#a78bfa'],
  ['#34d399', '#4f8ef7'],
  ['#fbbf24', '#f87171'],
  ['#a78bfa', '#f87171'],
  ['#4f8ef7', '#34d399'],
  ['#f87171', '#fbbf24'],
]
function getCoverStyle(club) {
  const idx = (club.id - 1) % gradientPalette.length
  const [c1, c2] = gradientPalette[idx]
  return { background: `linear-gradient(135deg, ${c1}, ${c2})` }
}
</script>

<style scoped>
.clubs-view { min-height: 100%; }

.page-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 100px var(--spacing-xl) var(--spacing-2xl);
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}
.page-header h1 { font-size: 48px; font-weight: 800; }
.page-header p  { margin-top: var(--spacing-sm); color: var(--color-text-secondary); }

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: var(--spacing-xl);
}
.filter-btn {
  padding: 6px 18px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all var(--transition-fast);
}
.filter-btn:hover,
.filter-btn.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-color: transparent;
  color: #fff;
}

/* 网格 */
.clubs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.club-card {
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}
.club-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.club-cover {
  height: 160px;
  position: relative;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  margin: -1px -1px 0; /* 覆盖 glass-card 的 border */
}
.club-category-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-full);
  font-size: 12px;
  color: #fff;
  font-weight: 600;
}

.club-body { padding: var(--spacing-md); }
.club-name {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}
.club-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.club-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}
.tag {
  padding: 2px 10px;
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  font-size: 11px;
  color: var(--color-text-secondary);
}

.club-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 12px;
  color: var(--color-text-muted);
}

/* 详情弹窗 */
.detail-cover {
  height: 200px;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}
.detail-desc {
  color: var(--color-text-secondary);
  line-height: 1.8;
  margin-bottom: var(--spacing-md);
}
.detail-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
  font-size: 13px;
}
.detail-info strong { color: var(--color-text-primary); }
</style>
