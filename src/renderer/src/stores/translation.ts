import { defineStore } from 'pinia'
import { ref } from 'vue'

interface TranslationEntry {
  text: string
  loading: boolean
  error: string | null
}

export const useTranslationStore = defineStore('translation', () => {
  const translations = ref<Record<string, TranslationEntry>>({})
  const isPanelOpen = ref(false)
  const savedWidth = localStorage.getItem('bireader-panel-width')
  const panelWidth = ref(savedWidth ? Number(savedWidth) : 380)

  function getTranslation(key: string): TranslationEntry | undefined {
    return translations.value[key]
  }

  function setLoading(key: string) {
    translations.value[key] = { text: '', loading: true, error: null }
  }

  function setResult(key: string, result: string) {
    translations.value[key] = { text: result, loading: false, error: null }
  }

  function setError(key: string, error: string) {
    translations.value[key] = { text: '', loading: false, error }
  }

  function togglePanel() {
    isPanelOpen.value = !isPanelOpen.value
  }

  function openPanel() {
    isPanelOpen.value = true
  }

  function closePanel() {
    isPanelOpen.value = false
  }

  function setPanelWidth(width: number) {
    panelWidth.value = width
    localStorage.setItem('bireader-panel-width', String(width))
  }

  return {
    translations,
    isPanelOpen,
    panelWidth,
    getTranslation,
    setLoading,
    setResult,
    setError,
    togglePanel,
    openPanel,
    closePanel,
    setPanelWidth
  }
})
