<template>
  <div class="home">
    <div class="home-inner">
      <h1 class="home-title">bireader</h1>
      <p class="home-subtitle">AI 双语阅读器</p>

      <!-- Empty state -->
      <div v-if="libraryStore.books.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <p class="empty-text">还没有导入书籍</p>
        <BaseButton variant="primary" @click="onImport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
          </svg>
          导入 EPUB
        </BaseButton>
      </div>

      <!-- Library -->
      <div v-else class="library">
        <div class="library-header">
          <span class="library-count">{{ libraryStore.books.length }} 本书</span>
          <BaseButton variant="secondary" size="sm" @click="onImport">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            导入
          </BaseButton>
        </div>
        <div class="book-grid">
          <div
            v-for="book in libraryStore.books"
            :key="book.filePath"
            class="book-card"
            @click="openBook(book)"
          >
            <div class="book-cover">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div class="book-info">
              <span class="book-title">{{ book.title }}</span>
              <span class="book-time">{{ formatTime(book.lastRead) }}</span>
            </div>
            <button class="book-remove" @click.stop="libraryStore.removeBook(book.filePath)" title="移除">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import { useLibraryStore } from '@/stores/library'

const libraryStore = useLibraryStore()
const emit = defineEmits<{
  openBook: [book: { title: string; filePath: string }]
  import: []
}>()

function onImport() {
  emit('import')
}

function openBook(book: { title: string; filePath: string }) {
  emit('openBook', book)
}

function formatTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  if (diff < 3600000) return '刚刚'
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  return new Date(ts).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.home {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: var(--space-2xl);
}

.home-inner {
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.home-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}

.home-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-2xl);
}

.empty-state {
  padding: var(--space-2xl) 0;
}

.empty-icon {
  margin-bottom: var(--space-md);
}

.empty-text {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin-bottom: var(--space-lg);
}

.library {
  width: 100%;
}

.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
  padding: 0 var(--space-xs);
}

.library-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.book-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.book-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  text-align: left;
}

.book-card:hover {
  background: var(--color-surface-hover);
}

.book-cover {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light);
  border-radius: var(--border-radius-sm);
  color: var(--color-primary);
  flex-shrink: 0;
}

.book-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.book-title {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-time {
  font-size: 12px;
  color: var(--color-text-muted);
}

.book-remove {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.book-card:hover .book-remove {
  opacity: 1;
}

.book-remove:hover {
  color: #d9534f;
  background: #fdf0ef;
}
</style>
