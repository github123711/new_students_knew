<template>
  <div class="home-view scrollable-page">
    <NavBar />

    <!-- 英雄区域 -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="gradient-text">云游三中</span>
        </h1>
        <p class="hero-subtitle">沉浸式 3D 校园漫游体验，探索校园的每一个角落</p>

        <div class="hero-actions">
          <RouterLink class="btn-primary" to="/tour">
            🎮 开始漫游
          </RouterLink>
          <RouterLink class="btn-ghost" to="/clubs">
            🌟 社团风采
          </RouterLink>
        </div>

        <!-- 快速导航卡片 -->
        <div class="quick-nav">
          <RouterLink
            v-for="card in navCards"
            :key="card.to"
            :to="card.to"
            class="quick-card glass-card"
          >
            <span class="quick-icon">{{ card.icon }}</span>
            <span class="quick-label">{{ card.label }}</span>
            <span class="quick-desc">{{ card.desc }}</span>
          </RouterLink>
        </div>
      </div>

      <!-- 装饰性粒子 -->
      <div class="hero-decoration">
        <div v-for="i in 6" :key="i" class="deco-circle" :style="getCircleStyle(i)" />
      </div>
    </section>

    <!-- 特色介绍 -->
    <section class="features">
      <h2 class="section-title gradient-text">探索精彩校园</h2>
      <div class="feature-grid">
        <div v-for="feat in features" :key="feat.title" class="feature-card glass-card">
          <div class="feat-icon">{{ feat.icon }}</div>
          <h3>{{ feat.title }}</h3>
          <p>{{ feat.desc }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import NavBar from '@/components/common/NavBar.vue'

const navCards = [
  { to: '/tour',        icon: '🏫', label: '3D 漫游',  desc: '实景校园漫游' },
  { to: '/clubs',       icon: '🎭', label: '社团风采', desc: '精彩社团活动' },
  { to: '/departments', icon: '🏛️', label: '部门介绍', desc: '认识各个部门' },
]

const features = [
  { icon: '🌐', title: '高斯溅射渲染', desc: '采用先进的 3DGS 技术，实现照片级真实感校园场景还原。' },
  { icon: '🎯', title: '任务探索系统', desc: '完成校园任务，与 NPC 互动，解锁更多校园故事和奖励。' },
  { icon: '🎵', title: '沉浸式体验',   desc: '配合背景音乐，在轻松的氛围中漫步探索这座美丽的校园。' },
  { icon: '📱', title: '跨平台支持',   desc: '桌面端和移动端均可流畅体验，无需安装任何额外插件。' },
]

function getCircleStyle(i) {
  const sizes  = [300, 200, 150, 250, 180, 120]
  const tops   = [10, 50, 20, 70, 40, 80]
  const lefts  = [10, 60, 30, 80, 50, 20]
  const opacities = [0.06, 0.04, 0.08, 0.03, 0.05, 0.07]
  return {
    width:   `${sizes[i - 1]}px`,
    height:  `${sizes[i - 1]}px`,
    top:     `${tops[i - 1]}%`,
    left:    `${lefts[i - 1]}%`,
    opacity: opacities[i - 1],
  }
}
</script>

<style scoped>
.home-view {
  min-height: 100%;
  padding-top: 80px; /* 为固定导航留出空间 */
}

/* ── 英雄区 ── */
.hero {
  position: relative;
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl) var(--spacing-xl);
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 800px;
}

.hero-title {
  font-size: clamp(48px, 8vw, 96px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: var(--spacing-lg);
}

.hero-subtitle {
  font-size: clamp(16px, 2vw, 20px);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-2xl);
}

.quick-nav {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-lg) var(--spacing-xl);
  text-decoration: none;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
  min-width: 140px;
}
.quick-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(79, 142, 247, 0.2);
}
.quick-icon  { font-size: 28px; }
.quick-label { font-size: 15px; font-weight: 600; color: var(--color-text-primary); }
.quick-desc  { font-size: 12px; color: var(--color-text-muted); }

/* 装饰圆 */
.hero-decoration { position: absolute; inset: 0; pointer-events: none; }
.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-primary), var(--color-accent));
  transform: translate(-50%, -50%);
  filter: blur(60px);
}

/* ── 特色区 ── */
.features {
  padding: var(--spacing-2xl) var(--spacing-xl);
  max-width: 1100px;
  margin: 0 auto;
}

.section-title {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-lg);
}

.feature-card {
  padding: var(--spacing-xl);
  text-align: center;
  transition: transform var(--transition-normal);
}
.feature-card:hover { transform: translateY(-4px); }
.feat-icon { font-size: 40px; margin-bottom: var(--spacing-md); }
.feature-card h3 { font-size: 16px; font-weight: 600; margin-bottom: var(--spacing-sm); }
.feature-card p  { font-size: 13px; color: var(--color-text-secondary); line-height: 1.7; }
</style>
