<template>
  <button
    class="base-btn"
    :class="[variant, size]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  disabled?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  border: none;
  border-radius: var(--border-radius-sm);
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast),
              color var(--transition-fast),
              box-shadow var(--transition-fast);
  white-space: nowrap;
  user-select: none;
}

.base-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.sm { padding: 4px 10px; height: 28px; }
.md { padding: 6px 14px; height: 34px; }

/* Variants */
.primary {
  background: var(--color-primary);
  color: #fff;
}
.primary:hover:not(:disabled) { background: var(--color-primary-hover); }

.secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
.secondary:hover:not(:disabled) { background: var(--color-surface-hover); }

.ghost {
  background: transparent;
  color: var(--color-text-secondary);
}
.ghost:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text);
}
</style>
