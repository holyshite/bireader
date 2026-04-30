<template>
  <button
    class="icon-btn"
    :aria-label="label"
    :title="label"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  label: string
}>()

defineEmits<{
  click: []
}>()
</script>

<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--border-radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color var(--transition-fast),
              color var(--transition-fast);
}

.icon-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}
</style>
