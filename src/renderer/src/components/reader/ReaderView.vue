<template>
  <div class="reader-view" :style="{ fontSize: readerStore.fontSize + 'px' }">
    <div class="reader-content">
      <div
        v-for="p in readerStore.content"
        :key="p.id"
        :data-paragraph-id="p.id"
        class="paragraph-row"
        :class="{
          active: readerStore.activeParagraphId === p.id,
          heading: p.type === 'heading',
          toc: p.type === 'toc'
        }"
      >
        <button
          class="bookmark-btn"
          :class="{ bookmarked: bookmarkStore.has(p.id) }"
          :title="bookmarkStore.has(p.id) ? '取消书签' : '添加书签'"
          @click.stop="bookmarkStore.toggle(p.id, p.text)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" :fill="bookmarkStore.has(p.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <p class="paragraph-text">{{ p.text }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useReaderStore } from '@/stores/reader'
import { useBookmarkStore } from '@/stores/bookmarks'

const readerStore = useReaderStore()
const bookmarkStore = useBookmarkStore()
</script>

<style scoped>
.reader-view {
  height: 100%;
  padding: var(--space-2xl) var(--space-xl);
}

.reader-content {
  max-width: 680px;
  margin: 0 auto;
}

.paragraph-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  margin-bottom: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  content-visibility: auto;
  contain-intrinsic-size: auto 40px;
}

.paragraph-row:hover {
  background: var(--color-surface-hover);
}

.paragraph-row.active {
  background: var(--color-primary-light);
}

.paragraph-row.heading {
  margin-top: var(--space-lg);
  margin-bottom: var(--space-xs);
}

.paragraph-row.heading:first-child {
  margin-top: 0;
}

.paragraph-row.heading .paragraph-text {
  font-family: var(--font-sans);
  font-size: 1.5em;
  font-weight: 700;
  line-height: var(--line-height-heading);
  letter-spacing: 0.02em;
}

.paragraph-row.toc {
  margin-bottom: 0;
}

.paragraph-row.toc .paragraph-text {
  font-family: var(--font-sans);
  font-size: 0.75em;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.paragraph-text {
  font-family: var(--font-serif);
  line-height: var(--line-height-base);
  color: var(--color-text);
  flex: 1;
  user-select: text;
}

.bookmark-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast), color var(--transition-fast);
}

.paragraph-row:hover .bookmark-btn {
  opacity: 1;
}

.bookmark-btn.bookmarked {
  opacity: 1;
  color: var(--color-accent);
}

.bookmark-btn:hover {
  color: var(--color-accent);
}
</style>
