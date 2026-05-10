<template>
  <div class="departments-view scrollable-page">
    <NavBar />

    <div class="page-content">
      <header class="page-header">
        <h1 class="gradient-text">部门介绍</h1>
        <p>了解学校各职能部门，让你的校园生活更有方向</p>
      </header>

      <div class="dept-grid">
        <div
          v-for="dept in departments"
          :key="dept.id"
          class="dept-card glass-card"
          :style="{ '--dept-color': dept.color }"
        >
          <div class="dept-icon">{{ dept.icon }}</div>
          <h3 class="dept-name">{{ dept.name }}</h3>
          <p class="dept-desc">{{ dept.description }}</p>

          <div class="dept-responsibilities">
            <span
              v-for="resp in dept.responsibilities"
              :key="resp"
              class="resp-tag"
            >{{ resp }}</span>
          </div>

          <div class="dept-info">
            <div class="dept-info-row">
              <span class="dept-info-icon">👤</span>
              <span>{{ dept.head }}</span>
            </div>
            <div class="dept-info-row">
              <span class="dept-info-icon">📍</span>
              <span>{{ dept.location }}</span>
            </div>
            <div class="dept-info-row">
              <span class="dept-info-icon">📞</span>
              <span>{{ dept.phone }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import NavBar from '@/components/common/NavBar.vue'
import departmentsData from '@/data/departments.json'

const departments = departmentsData
</script>

<style scoped>
.departments-view { min-height: 100%; }

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

.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

.dept-card {
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}
.dept-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--dept-color);
  border-radius: 4px 0 0 4px;
}
.dept-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.dept-icon {
  font-size: 40px;
  margin-bottom: var(--spacing-md);
}
.dept-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--dept-color);
  margin-bottom: var(--spacing-sm);
}
.dept-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.8;
  margin-bottom: var(--spacing-md);
}

.dept-responsibilities {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}
.resp-tag {
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  color: var(--dept-color);
  background: color-mix(in srgb, var(--dept-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--dept-color) 30%, transparent);
}

.dept-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--glass-border);
}
.dept-info-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  font-size: 12px;
  color: var(--color-text-secondary);
}
.dept-info-icon { flex-shrink: 0; }
</style>
