<template>
  <div class="reader-view" :style="{ fontSize: readerStore.fontSize + 'px' }">
    <div class="reader-content">
      <p
        v-for="p in readerStore.content"
        :key="p.id"
        :data-paragraph-id="p.id"
        class="paragraph"
        :class="{ active: readerStore.activeParagraphId === p.id }"
      >
        {{ p.text }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useReaderStore } from '@/stores/reader'

const readerStore = useReaderStore()
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

.paragraph {
  font-family: var(--font-serif);
  line-height: var(--line-height-base);
  color: var(--color-text);
  padding: var(--space-xs) var(--space-sm);
  margin-bottom: var(--space-sm);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  user-select: text;
}

.paragraph:hover {
  background: var(--color-surface-hover);
}

.paragraph.active {
  background: var(--color-primary-light);
}
</style>
