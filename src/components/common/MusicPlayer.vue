<template>
  <div class="music-player glass-card" :class="{ collapsed: isCollapsed }">
    <!-- 折叠/展开按钮 -->
    <button class="collapse-btn" @click="isCollapsed = !isCollapsed" :title="isCollapsed ? '展开播放器' : '收起播放器'">
      <span class="collapse-icon">{{ isCollapsed ? '♪' : '×' }}</span>
    </button>

    <template v-if="!isCollapsed">
      <!-- 曲目信息 -->
      <div class="track-info">
        <div class="disc" :class="{ spinning: musicStore.isPlaying }">🎵</div>
        <div class="track-meta">
          <div class="track-title">{{ musicStore.currentTrack?.title || '暂无曲目' }}</div>
          <div class="track-artist">{{ musicStore.currentTrack?.artist || '-' }}</div>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="progress-bar" @click="seek">
        <div class="progress-fill" :style="{ width: musicStore.progress + '%' }" />
      </div>
      <div class="time-info">
        <span>{{ formatTime(musicStore.currentTime) }}</span>
        <span>{{ formatTime(musicStore.duration) }}</span>
      </div>

      <!-- 控制按钮 -->
      <div class="controls">
        <button class="ctrl-btn" @click="musicStore.prev()" title="上一曲">⏮</button>
        <button class="ctrl-btn play-btn" @click="musicStore.togglePlay()" :title="musicStore.isPlaying ? '暂停' : '播放'">
          {{ musicStore.isPlaying ? '⏸' : '▶' }}
        </button>
        <button class="ctrl-btn" @click="musicStore.next()" title="下一曲">⏭</button>
      </div>

      <!-- 音量调节 -->
      <div class="volume-row">
        <span class="vol-icon">{{ musicStore.volume === 0 ? '🔇' : '🔊' }}</span>
        <input
          type="range"
          class="vol-slider"
          min="0" max="1" step="0.01"
          :value="musicStore.volume"
          @input="musicStore.setVolume(+$event.target.value)"
        />
      </div>
    </template>

    <!-- 隐藏的 audio 元素，由组件控制 -->
    <audio
      ref="audioRef"
      :src="musicStore.currentTrack?.src"
      :volume="musicStore.volume"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onMetaLoaded"
      @ended="musicStore.next()"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useMusicStore } from '@/stores/music'

const musicStore = useMusicStore()
const audioRef = ref(null)
const isCollapsed = ref(false)

// 监听播放状态，同步到 audio 元素
watch(
  () => musicStore.isPlaying,
  (playing) => {
    if (!audioRef.value) return
    playing ? audioRef.value.play().catch(() => {}) : audioRef.value.pause()
  }
)

// 切换曲目时重新加载并播放
watch(
  () => musicStore.currentIndex,
  () => {
    if (!audioRef.value) return
    audioRef.value.load()
    if (musicStore.isPlaying) {
      audioRef.value.play().catch(() => {})
    }
  }
)

// 同步音量
watch(
  () => musicStore.volume,
  (vol) => {
    if (audioRef.value) audioRef.value.volume = vol
  }
)

function onTimeUpdate() {
  musicStore.setCurrentTime(audioRef.value?.currentTime || 0)
}

function onMetaLoaded() {
  musicStore.setDuration(audioRef.value?.duration || 0)
}

// 点击进度条跳转
function seek(event) {
  if (!audioRef.value || !musicStore.duration) return
  const rect = event.currentTarget.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  const newTime = ratio * musicStore.duration
  audioRef.value.currentTime = newTime
  musicStore.setCurrentTime(newTime)
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

onMounted(() => {
  if (audioRef.value) audioRef.value.volume = musicStore.volume
})
</script>

<style scoped>
.music-player {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: var(--z-music);
  width: 240px;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  transition: width var(--transition-normal), padding var(--transition-normal);
}

.music-player.collapsed {
  width: 48px;
  padding: 10px;
  align-items: center;
}

.collapse-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: var(--glass-bg-strong);
  border-radius: 50%;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.music-player.collapsed .collapse-btn {
  position: static;
  width: 28px;
  height: 28px;
  font-size: 16px;
}

/* 曲目信息 */
.track-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding-right: 20px;
}
.disc {
  font-size: 24px;
  flex-shrink: 0;
  transition: transform 0.1s;
}
.disc.spinning {
  animation: spin 4s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.track-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.track-artist {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* 进度条 */
.progress-bar {
  height: 3px;
  background: var(--glass-bg-strong);
  border-radius: var(--radius-full);
  cursor: pointer;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  border-radius: var(--radius-full);
  transition: width 0.5s linear;
}
.time-info {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--color-text-muted);
}

/* 控制按钮 */
.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
}
.ctrl-btn {
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background var(--transition-fast);
}
.ctrl-btn:hover { color: var(--color-text-primary); background: var(--glass-bg-strong); }
.play-btn {
  font-size: 20px;
  color: var(--color-primary-light);
}

/* 音量 */
.volume-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
.vol-icon { font-size: 14px; }
.vol-slider {
  flex: 1;
  height: 3px;
  accent-color: var(--color-primary);
  cursor: pointer;
}
</style>
