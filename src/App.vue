<template>
  <div id="app-root">
    <!-- 全局背景：渐变 + 可替换背景图 -->
    <div class="app-bg" :style="bgStyle" />

    <!-- 路由视图（页面过渡动画） -->
    <RouterView v-slot="{ Component, route }">
      <Transition :name="route.meta.transition || 'fade'" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>

    <!-- 音乐播放器（固定右下角，始终显示） -->
    <MusicPlayer />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import MusicPlayer from '@/components/common/MusicPlayer.vue'

/**
 * 支持自定义背景图：将图片 URL 存入 localStorage 的 ct_bg 键即可替换
 * 默认使用深色渐变，不依赖外部资源
 */
const customBg = localStorage.getItem('ct_bg')
const bgStyle = computed(() =>
  customBg
    ? { backgroundImage: `url(${customBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}
)
</script>

<style scoped>
#app-root {
  position: relative;
  height: 100%;
  overflow: hidden;
}

/* 默认渐变背景 */
.app-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: linear-gradient(
    135deg,
    #0a0e1a 0%,
    #0d1b3e 40%,
    #0e1628 70%,
    #0a0e1a 100%
  );
}

/* 有自定义背景图时叠加半透明遮罩，保证文字可读性 */
.app-bg:has(+ *) {
  /* CSS :has 暂不全兼容，备用方案在 JS 侧控制 */
}
</style>
