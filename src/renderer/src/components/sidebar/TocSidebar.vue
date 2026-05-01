<template>
  <div class="toc-sidebar">
    <div class="toc-header">
      <h3 class="toc-title">目录</h3>
    </div>
    <nav class="toc-list">
      <a
        v-for="item in readerStore.toc"
        :key="item.id"
        class="toc-item"
        :class="[`level-${item.level}`, { active: item.id === activeTocId }]"
        href="#"
        @click.prevent="scrollTo(item.id)"
      >
        {{ item.title }}
      </a>
      <p v-if="readerStore.toc.length === 0" class="toc-empty">暂无目录</p>
    </nav>
    <div v-if="bookmarkStore.bookmarks.length > 0" class="bookmark-section">
      <div class="bookmark-header">
        <span class="bookmark-title">书签</span>
        <span class="bookmark-count">{{ bookmarkStore.bookmarks.length }}</span>
        <button class="bookmark-clear" @click="bookmarkStore.clear()">清空</button>
      </div>
      <div class="bookmark-list">
        <div
          v-for="bm in bookmarkStore.bookmarks"
          :key="bm.id"
          class="bookmark-item"
          @click="scrollTo(bm.id)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="bm-icon">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="bm-text">{{ bm.text }}</span>
          <button class="bm-remove" @click.stop="bookmarkStore.remove(bm.id)" title="删除">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useReaderStore } from '@/stores/reader'
import { useBookmarkStore } from '@/stores/bookmarks'

const readerStore = useReaderStore()
const bookmarkStore = useBookmarkStore()
const activeTocId = ref('')

function updateActiveToc() {
  const container = document.querySelector('.reader-area')
  if (!container || readerStore.toc.length === 0) return

  const scrollTop = container.scrollTop
  const containerHeight = container.clientHeight
  const viewTop = scrollTop + containerHeight * 0.2

  let bestId = ''
  let bestDist = Infinity

  for (const entry of readerStore.toc) {
    const el = document.querySelector(`[data-paragraph-id="${entry.id}"]`)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const elTop = rect.top - containerRect.top + scrollTop
    const dist = elTop - viewTop

    if (dist <= 0 && Math.abs(dist) < bestDist) {
      bestDist = Math.abs(dist)
      bestId = entry.id
    }
  }

  if (bestId) activeTocId.value = bestId
}

let scrollTimer: ReturnType<typeof setTimeout> | null = null

function onScroll() {
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(updateActiveToc, 100)
}

onMounted(() => {
  const container = document.querySelector('.reader-area')
  if (container) {
    container.addEventListener('scroll', onScroll, { passive: true })
  }
})

watch(() => readerStore.content.length, () => {
  setTimeout(updateActiveToc, 500)
})

onUnmounted(() => {
  const container = document.querySelector('.reader-area')
  if (container) {
    container.removeEventListener('scroll', onScroll)
  }
})

function scrollTo(id: string) {
  const target = document.querySelector(`[data-paragraph-id="${id}"]`) as HTMLElement | null
  if (!target) return

  const container = document.querySelector('.reader-area') as HTMLElement
  if (!container) return

  // Temporarily render all paragraphs for accurate scroll calculation
  const allRows = container.querySelectorAll('.paragraph-row') as NodeListOf<HTMLElement>
  allRows.forEach(r => { r.style.contentVisibility = 'visible' })

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => {
        allRows.forEach(r => { r.style.contentVisibility = '' })
      }, 800)
    })
  })
}
</script>

<style scoped>
.toc-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toc-header {
  padding: 8px var(--space-md);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.toc-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.toc-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.toc-item {
  display: block;
  padding: 5px 10px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: 4px;
  transition: background-color var(--transition-fast),
              color var(--transition-fast);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toc-item:hover,
.toc-item.active {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.toc-item.active {
  font-weight: 500;
  color: var(--color-primary);
}

.toc-item.level-2 { padding-left: 20px; }
.toc-item.level-3 { padding-left: 30px; }

.toc-empty {
  padding: 16px;
  font-size: 13px;
  color: var(--color-text-muted);
  text-align: center;
}

.bookmark-section {
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
  max-height: 40%;
  display: flex;
  flex-direction: column;
}

.bookmark-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px var(--space-md);
  flex-shrink: 0;
}

.bookmark-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.bookmark-count {
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-surface-hover);
  padding: 1px 6px;
  border-radius: 8px;
}

.bookmark-clear {
  margin-left: auto;
  font-size: 11px;
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
}

.bookmark-clear:hover {
  color: #d9534f;
  background: #fdf0ef;
}

.bookmark-list {
  overflow-y: auto;
  padding: 0 4px 4px;
}

.bookmark-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.bookmark-item:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.bm-icon {
  flex-shrink: 0;
  color: var(--color-accent);
}

.bm-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bm-remove {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 3px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.bookmark-item:hover .bm-remove {
  opacity: 1;
}

.bm-remove:hover {
  color: #d9534f;
  background: #fdf0ef;
}
</style>
