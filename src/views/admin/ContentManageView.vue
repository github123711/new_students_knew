<template>
  <div class="content-manage scrollable-page">
    <NavBar />

    <div class="cm-content">
      <header class="cm-header">
        <h1 class="gradient-text">内容管理</h1>
        <p>编辑社团信息、上传图片/视频，所有改动保存在浏览器本地</p>
      </header>

      <!-- 操作栏 -->
      <div class="toolbar glass-card">
        <el-button type="primary" @click="addClub">+ 新增社团</el-button>
        <el-button @click="exportData">导出 JSON</el-button>
        <el-upload
          :show-file-list="false"
          accept="application/json"
          :before-upload="importData"
        >
          <el-button>导入 JSON</el-button>
        </el-upload>
        <el-button type="danger" plain @click="resetData">恢复默认</el-button>
        <span class="storage-tip">💡 数据保存在浏览器，导出 JSON 可备份/同步到代码库</span>
      </div>

      <!-- 社团列表 -->
      <div class="club-list">
        <div
          v-for="(club, idx) in clubs"
          :key="club.id"
          class="club-edit-card glass-card"
        >
          <div class="card-head">
            <h3>{{ club.name || '未命名社团' }}</h3>
            <el-button type="danger" size="small" plain @click="removeClub(idx)">删除</el-button>
          </div>

          <!-- 基本信息 -->
          <el-form label-width="90px" label-position="left">
            <el-form-item label="名称">
              <el-input v-model="club.name" />
            </el-form-item>
            <el-form-item label="类别">
              <el-input v-model="club.category" placeholder="科技 / 文艺 / 体育 / 艺术" />
            </el-form-item>
            <el-form-item label="简介">
              <el-input v-model="club.description" type="textarea" :rows="3" />
            </el-form-item>

            <div class="form-row">
              <el-form-item label="成员数">
                <el-input-number v-model="club.members" :min="0" />
              </el-form-item>
              <el-form-item label="成立年份">
                <el-input v-model="club.founded" />
              </el-form-item>
            </div>

            <el-form-item label="联系方式">
              <el-input v-model="club.contact" />
            </el-form-item>

            <el-form-item label="标签">
              <el-input
                :model-value="(club.tags || []).join(',')"
                @input="(v) => (club.tags = v.split(',').map((s) => s.trim()).filter(Boolean))"
                placeholder="用逗号分隔，如：Arduino,Python,机械设计"
              />
            </el-form-item>

            <!-- 封面图 -->
            <el-form-item label="封面图">
              <div class="cover-area">
                <div class="cover-preview" :style="getCoverStyle(club)" />
                <div class="cover-actions">
                  <el-upload
                    :show-file-list="false"
                    accept="image/*"
                    :before-upload="(f) => uploadImage(f, club, 'cover')"
                  >
                    <el-button size="small">上传图片</el-button>
                  </el-upload>
                  <el-button v-if="club.cover" size="small" plain @click="club.cover = ''">
                    清除
                  </el-button>
                </div>
              </div>
            </el-form-item>

            <!-- 详细介绍（详情页展示） -->
            <el-form-item label="详细介绍">
              <el-input
                v-model="club.detail"
                type="textarea"
                :rows="5"
                placeholder="详情页展示的长文本介绍"
              />
            </el-form-item>

            <!-- 媒体画廊 -->
            <el-form-item label="图片画廊">
              <div class="gallery-area">
                <div
                  v-for="(img, i) in club.gallery || []"
                  :key="i"
                  class="gallery-item"
                >
                  <img :src="img" />
                  <button class="del-btn" @click="removeGalleryItem(club, i)">×</button>
                </div>
                <el-upload
                  :show-file-list="false"
                  accept="image/*"
                  multiple
                  :before-upload="(f) => uploadImage(f, club, 'gallery')"
                >
                  <div class="upload-tile">+ 添加</div>
                </el-upload>
              </div>
            </el-form-item>

            <!-- 视频 -->
            <el-form-item label="视频">
              <div class="video-area">
                <div v-for="(v, i) in club.videos || []" :key="i" class="video-item">
                  <video :src="v" controls />
                  <el-button size="small" type="danger" plain @click="removeVideoItem(club, i)">
                    删除
                  </el-button>
                </div>
                <el-upload
                  :show-file-list="false"
                  accept="video/*"
                  :before-upload="(f) => uploadVideo(f, club)"
                >
                  <el-button size="small">+ 上传视频</el-button>
                </el-upload>
                <p class="size-warning">
                  ⚠️ 视频以 base64 存浏览器，建议 ≤ 10MB；大文件请改用外链 URL
                </p>
                <el-input
                  placeholder="或粘贴视频外链 URL，回车添加"
                  @keyup.enter="(e) => addVideoUrl(club, e.target)"
                />
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 保存按钮（吸底） -->
      <div class="save-bar">
        <el-button type="primary" size="large" @click="saveAll" :loading="saving">
          保存到本地浏览器
        </el-button>
        <span class="save-tip">{{ savedHint }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import NavBar from '@/components/common/NavBar.vue'
import defaultClubs from '@/data/clubs.json'

const STORAGE_KEY = 'ct_clubs_data'
const clubs = ref([])
const saving = ref(false)
const savedHint = ref('')

onMounted(() => {
  loadFromStorage()
})

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      clubs.value = JSON.parse(raw)
      return
    } catch {
      // fallthrough
    }
  }
  clubs.value = JSON.parse(JSON.stringify(defaultClubs))
}

function saveAll() {
  saving.value = true
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clubs.value))
    ElMessage.success('已保存')
    savedHint.value = `保存于 ${new Date().toLocaleTimeString()}`
  } catch (e) {
    ElMessage.error('保存失败：' + (e.message || '可能是数据过大'))
  } finally {
    saving.value = false
  }
}

function addClub() {
  const maxId = clubs.value.reduce((m, c) => Math.max(m, c.id || 0), 0)
  clubs.value.unshift({
    id: maxId + 1,
    name: '新社团',
    category: '科技',
    cover: '',
    description: '',
    detail: '',
    members: 0,
    founded: String(new Date().getFullYear()),
    tags: [],
    contact: '',
    gallery: [],
    videos: [],
  })
}

async function removeClub(idx) {
  try {
    await ElMessageBox.confirm(`确定删除「${clubs.value[idx].name}」？`, '确认删除', {
      type: 'warning',
    })
    clubs.value.splice(idx, 1)
  } catch {
    /* cancelled */
  }
}

async function resetData() {
  try {
    await ElMessageBox.confirm('将丢弃所有本地修改，恢复为默认数据？', '危险操作', {
      type: 'warning',
    })
    clubs.value = JSON.parse(JSON.stringify(defaultClubs))
    localStorage.removeItem(STORAGE_KEY)
    ElMessage.success('已恢复默认')
  } catch {
    /* cancelled */
  }
}

function exportData() {
  const blob = new Blob([JSON.stringify(clubs.value, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clubs-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (!Array.isArray(data)) throw new Error('文件格式不正确')
      clubs.value = data
      ElMessage.success('导入成功，记得点击保存')
    } catch (err) {
      ElMessage.error('导入失败：' + err.message)
    }
  }
  reader.readAsText(file)
  return false
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadImage(file, club, target) {
  const MAX = 5 * 1024 * 1024
  if (file.size > MAX) {
    ElMessage.warning('图片超过 5MB，建议压缩后再上传')
  }
  try {
    const dataUrl = await fileToBase64(file)
    if (target === 'cover') {
      club.cover = dataUrl
    } else if (target === 'gallery') {
      if (!club.gallery) club.gallery = []
      club.gallery.push(dataUrl)
    }
    ElMessage.success('已添加，记得点击保存')
  } catch {
    ElMessage.error('读取文件失败')
  }
  return false
}

async function uploadVideo(file, club) {
  const MAX = 20 * 1024 * 1024
  if (file.size > MAX) {
    ElMessage.warning('视频较大，可能保存失败，建议改用外链 URL')
  }
  try {
    const dataUrl = await fileToBase64(file)
    if (!club.videos) club.videos = []
    club.videos.push(dataUrl)
    ElMessage.success('已添加，记得点击保存')
  } catch {
    ElMessage.error('读取文件失败')
  }
  return false
}

function addVideoUrl(club, inputEl) {
  const url = inputEl.value.trim()
  if (!url) return
  if (!club.videos) club.videos = []
  club.videos.push(url)
  inputEl.value = ''
  ElMessage.success('已添加')
}

function removeGalleryItem(club, i) {
  club.gallery.splice(i, 1)
}

function removeVideoItem(club, i) {
  club.videos.splice(i, 1)
}

const gradientPalette = [
  ['#4f8ef7', '#a78bfa'],
  ['#34d399', '#4f8ef7'],
  ['#fbbf24', '#f87171'],
  ['#a78bfa', '#f87171'],
  ['#4f8ef7', '#34d399'],
  ['#f87171', '#fbbf24'],
]
function getCoverStyle(club) {
  if (club.cover) {
    return {
      backgroundImage: `url(${club.cover})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  const idx = ((club.id || 1) - 1) % gradientPalette.length
  const [c1, c2] = gradientPalette[idx]
  return { background: `linear-gradient(135deg, ${c1}, ${c2})` }
}
</script>

<style scoped>
.content-manage { min-height: 100%; }

.cm-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 100px var(--spacing-xl) 120px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.cm-header { text-align: center; }
.cm-header h1 { font-size: 36px; font-weight: 800; }
.cm-header p { margin-top: 8px; color: var(--color-text-secondary); }

.toolbar {
  padding: var(--spacing-md);
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  flex-wrap: wrap;
}
.storage-tip {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-text-muted);
}

.club-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.club-edit-card {
  padding: var(--spacing-lg);
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}
.card-head h3 { font-size: 18px; font-weight: 700; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

/* 封面区 */
.cover-area {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}
.cover-preview {
  width: 160px;
  height: 100px;
  border-radius: var(--radius-md);
  background: var(--glass-bg-strong);
  flex-shrink: 0;
}
.cover-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

/* 画廊 */
.gallery-area {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.gallery-item {
  width: 100px;
  height: 100px;
  position: relative;
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.del-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}
.upload-tile {
  width: 100px;
  height: 100px;
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 12px;
  background: var(--glass-bg-strong);
}
.upload-tile:hover { color: var(--color-text-primary); }

/* 视频 */
.video-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;
}
.video-item {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}
.video-item video {
  width: 240px;
  border-radius: var(--radius-sm);
}
.size-warning {
  font-size: 11px;
  color: var(--color-text-muted);
  margin: 0;
}

/* 吸底保存条 */
.save-bar {
  position: sticky;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(12px);
}
.save-tip {
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
