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
        :class="`level-${item.level}`"
        href="#"
        @click.prevent="scrollTo(item.id)"
      >
        {{ item.title }}
      </a>
      <p v-if="readerStore.toc.length === 0" class="toc-empty">暂无目录</p>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useReaderStore } from '@/stores/reader'

const readerStore = useReaderStore()

function scrollTo(id: string) {
  const el = document.querySelector(`[data-paragraph-id="${id}"]`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<style scoped>
.toc-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toc-header {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.toc-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.toc-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm);
}

.toc-item {
  display: block;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-fast),
              color var(--transition-fast);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toc-item:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.toc-item.level-2 { padding-left: var(--space-lg); }
.toc-item.level-3 { padding-left: var(--space-xl); }

.toc-empty {
  padding: var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-align: center;
}
</style>
