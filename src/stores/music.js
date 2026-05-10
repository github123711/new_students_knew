import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 背景音乐播放器状态管理
 * 播放列表存放在 public/music/ 目录下
 */
export const useMusicStore = defineStore('music', () => {
  // ── State ──────────────────────────────────────────────
  const playlist = ref([
    {
      id: 1,
      title: '福州三中校歌',
      artist: '福州第三中学',
      src: `${import.meta.env.BASE_URL}music/${encodeURIComponent('福州三中校歌')}.mp3`,
    },
  ])

  const currentIndex = ref(0)
  const isPlaying = ref(false)
  const volume = ref(0.5)        // 0 ~ 1
  const currentTime = ref(0)     // 当前播放时间（秒）
  const duration = ref(0)        // 总时长（秒）

  // ── Computed ───────────────────────────────────────────
  const currentTrack = computed(() => playlist.value[currentIndex.value])
  const progress = computed(() =>
    duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
  )

  // ── Actions ────────────────────────────────────────────
  function play() { isPlaying.value = true }
  function pause() { isPlaying.value = false }
  function togglePlay() { isPlaying.value = !isPlaying.value }

  function next() {
    currentIndex.value = (currentIndex.value + 1) % playlist.value.length
    isPlaying.value = true
  }

  function prev() {
    currentIndex.value =
      (currentIndex.value - 1 + playlist.value.length) % playlist.value.length
    isPlaying.value = true
  }

  function setVolume(val) {
    volume.value = Math.max(0, Math.min(1, val))
  }

  function setCurrentTime(val) { currentTime.value = val }
  function setDuration(val) { duration.value = val }

  function selectTrack(index) {
    if (index >= 0 && index < playlist.value.length) {
      currentIndex.value = index
      isPlaying.value = true
    }
  }

  return {
    playlist,
    currentIndex,
    isPlaying,
    volume,
    currentTime,
    duration,
    currentTrack,
    progress,
    play,
    pause,
    togglePlay,
    next,
    prev,
    setVolume,
    setCurrentTime,
    setDuration,
    selectTrack,
  }
})
