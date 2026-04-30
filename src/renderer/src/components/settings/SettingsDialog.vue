<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-overlay" @click.self="$emit('close')">
      <div class="dialog">
        <h2 class="dialog-title">API 设置</h2>
        <div v-if="showSuccess" class="toast">已保存</div>
        <div class="form">
          <label class="field">
            <span class="field-label">API Key</span>
            <input
              v-model="form.apiKey"
              type="password"
              class="input"
              :placeholder="hasExistingKey ? '已设置 (留空则不修改)' : '请输入 API Key'"
            />
          </label>
          <label class="field">
            <span class="field-label">Base URL</span>
            <input v-model="form.baseUrl" type="text" class="input" placeholder="https://api.deepseek.com" />
          </label>
          <label class="field">
            <span class="field-label">Model</span>
            <input v-model="form.model" type="text" class="input" placeholder="deepseek-v4-pro" />
          </label>
        </div>
        <div class="dialog-actions">
          <BaseButton variant="secondary" @click="$emit('close')">取消</BaseButton>
          <BaseButton variant="primary" :disabled="saving" @click="onSave">
            {{ saving ? '保存中...' : '保存' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const form = ref({ apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-pro' })
const hasExistingKey = ref(false)
const saving = ref(false)
const showSuccess = ref(false)

watch(() => props.visible, async (v) => {
  if (v) {
    showSuccess.value = false
    const config = await window.api.getConfig()
    form.value.baseUrl = config.baseUrl
    form.value.model = config.model
    form.value.apiKey = ''
    hasExistingKey.value = config.hasKey
  }
})

async function onSave() {
  saving.value = true
  const payload: { apiKey?: string; baseUrl?: string; model?: string } = {
    baseUrl: form.value.baseUrl,
    model: form.value.model
  }
  if (form.value.apiKey) {
    payload.apiKey = form.value.apiKey
  }
  await window.api.saveConfig(payload)
  saving.value = false
  form.value.apiKey = ''
  hasExistingKey.value = true
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
    emit('close')
  }, 1200)
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--color-surface);
  border-radius: var(--border-radius);
  padding: var(--space-xl);
  width: 420px;
  max-width: 90vw;
  box-shadow: var(--shadow-lg);
}

.dialog-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-lg);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.field-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.input {
  height: 36px;
  padding: 0 var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--font-size-base);
  font-family: var(--font-mono);
  outline: none;
  transition: border-color var(--transition-fast);
}

.input:focus {
  border-color: var(--color-primary);
}

.input::placeholder {
  color: var(--color-text-muted);
  font-family: var(--font-sans);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

.toast {
  background: var(--color-primary);
  color: #fff;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  text-align: center;
  margin-bottom: var(--space-md);
  animation: toast-in 0.25s ease;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
