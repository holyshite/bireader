<template>
  <aside
    class="sidebar-panel"
    :class="{
      collapsed: !isOpen,
      'side-left': side === 'left',
      'side-right': side === 'right'
    }"
    :style="side === 'right' && isOpen ? { width: width + 'px', minWidth: width + 'px' } : {}"
  >
    <div class="panel-inner">
      <slot />
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
  side: 'left' | 'right'
  width?: number
}>()
</script>

<style scoped>
.sidebar-panel {
  overflow: hidden;
  background: var(--color-surface);
  border-color: var(--color-border);
  transition: width var(--transition-normal),
              min-width var(--transition-normal),
              opacity var(--transition-normal),
              border-width var(--transition-normal);
}

.side-left {
  border-right: 1px solid var(--color-border);
}

.side-right {
  border-left: 1px solid var(--color-border);
}

.sidebar-panel:not(.collapsed) {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
}

.side-right:not(.collapsed) {
  width: var(--translation-panel-width);
  min-width: var(--translation-panel-width);
}

.sidebar-panel.collapsed {
  width: 0;
  min-width: 0;
  border-width: 0;
  opacity: 0;
}

.panel-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
