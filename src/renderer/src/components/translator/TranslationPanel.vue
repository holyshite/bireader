<template>
  <div class="translation-panel">
    <div class="panel-header">
      <h3 class="panel-title">翻译</h3>
      <IconButton label="关闭" @click="translationStore.closePanel">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </IconButton>
    </div>
    <div class="panel-body">
      <div v-if="!translationKey" class="empty-state">
        <p class="empty-hint">点击段落或选中文本以查看翻译</p>
      </div>
      <template v-else>
        <div class="source-section">
          <div class="section-label">原文</div>
          <p class="source-text">
            <span
              v-for="(s, i) in sentences"
              :key="i"
              class="sentence"
              :class="{ selected: selectedSentence === i }"
              @click="selectSentence(i)"
            >{{ s }}</span>
          </p>
        </div>
        <div class="divider" />
        <div class="result-section">
          <div class="section-label">翻译</div>
          <LoadingSpinner v-if="entry?.loading" text="翻译中..." />
          <div v-else-if="entry?.error" class="error-msg">{{ entry.error }}</div>
          <div v-else-if="entry?.text" class="translation-text">
            <p>{{ entry.text }}</p>
            <div class="translation-actions">
              <BaseButton variant="ghost" size="sm" @click="copyTranslation">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                复制
              </BaseButton>
              <BaseButton variant="ghost" size="sm" :disabled="analyzing" @click="doAnalyze">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {{ analyzing ? '分析中...' : '分析' }}
              </BaseButton>
            </div>
          </div>
        </div>
        <template v-if="analysis !== null">
          <div class="divider" />
          <div class="analysis-section">
            <div class="section-label">翻译分析</div>
            <LoadingSpinner v-if="analyzing" text="分析中..." />
            <div v-else-if="analysisError" class="error-msg">{{ analysisError }}</div>
            <div v-else-if="analysis" class="analysis-text">{{ analysis }}</div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import IconButton from '@/components/ui/IconButton.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useReaderStore } from '@/stores/reader'
import { useTranslationStore } from '@/stores/translation'
import { useDebounce } from '@/composables/useDebounce'
import { TranslationCache } from '@/services/cache'

const readerStore = useReaderStore()
const translationStore = useTranslationStore()
const cache = new TranslationCache()

const analyzing = ref(false)
const analysis = ref<string | null>(null)
const analysisError = ref<string | null>(null)
const selectedSentence = ref(-1)

const sentences = computed(() => {
  return sourceText.value.split(/(?<=[.!?。！？\n])\s*/g).filter(s => s.trim())
})

function selectSentence(i: number) {
  selectedSentence.value = selectedSentence.value === i ? -1 : i
}

const translationKey = computed(() => {
  if (readerStore.selectedText) return `sel:${readerStore.selectedText}`
  if (readerStore.activeParagraphId) {
    const p = readerStore.content.find(c => c.id === readerStore.activeParagraphId)
    return p ? `p:${p.id}` : null
  }
  return null
})

const sourceText = computed(() => {
  if (readerStore.selectedText) return readerStore.selectedText
  if (readerStore.activeParagraphId) {
    const p = readerStore.content.find(c => c.id === readerStore.activeParagraphId)
    return p?.text ?? ''
  }
  return ''
})

const entry = computed(() => {
  if (!translationKey.value) return undefined
  return translationStore.getTranslation(translationKey.value)
})

const doTranslate = useDebounce(async (key: string, text: string) => {
  const cached = cache.get(key)
  if (cached) {
    translationStore.setResult(key, cached)
    return
  }
  translationStore.setLoading(key)
  try {
    const result = await window.api.translate(text)
    cache.set(key, result)
    translationStore.setResult(key, result)
  } catch (err) {
    translationStore.setError(key, err instanceof Error ? err.message : '翻译失败')
  }
}, 500)

watch(translationKey, (newKey) => {
  analysis.value = null
  analysisError.value = null
  selectedSentence.value = -1
  if (newKey && sourceText.value) {
    const existing = translationStore.getTranslation(newKey)
    if (!existing || existing.error) {
      doTranslate(newKey, sourceText.value)
    }
  }
}, { immediate: true })

async function copyTranslation() {
  if (entry.value?.text) {
    await navigator.clipboard.writeText(entry.value.text)
  }
}

async function doAnalyze() {
  if (!entry.value?.text) return
  const analyzeSource = selectedSentence.value >= 0
    ? sentences.value[selectedSentence.value]
    : sourceText.value
  analyzing.value = true
  analysisError.value = null
  analysis.value = null
  try {
    const result = await window.api.analyze(analyzeSource, entry.value.text)
    analysis.value = result
  } catch (err) {
    analysisError.value = err instanceof Error ? err.message : '分析失败'
  } finally {
    analyzing.value = false
  }
}
</script>

<style scoped>
.translation-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.panel-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.empty-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-align: center;
}

.source-section, .result-section {
  margin-bottom: var(--space-md);
}

.section-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-sm);
}

.source-text {
  font-family: var(--font-serif);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
  user-select: text;
}

.sentence {
  border-radius: 2px;
  transition: background-color var(--transition-fast);
  cursor: pointer;
}

.sentence:hover {
  background: var(--color-primary-light);
}

.sentence.selected {
  background: var(--color-primary-light);
  outline: 1px solid var(--color-primary);
}

.divider {
  height: 1px;
  background: var(--color-border-light);
  margin: var(--space-md) 0;
}

.translation-text {
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  line-height: var(--line-height-base);
  user-select: text;
  white-space: pre-wrap;
}

.translation-actions {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
}

.analysis-section {
  margin-bottom: var(--space-md);
}

.analysis-text {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.6;
  white-space: pre-wrap;
}

.error-msg {
  font-size: var(--font-size-sm);
  color: #d9534f;
  padding: var(--space-sm);
  background: #fdf0ef;
  border-radius: var(--border-radius-sm);
}

[data-theme='dark'] .error-msg {
  background: #3d1f1e;
}
</style>
