import { watch, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

export function useTheme() {
  const themeStore = useThemeStore()

  function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme)
  }

  onMounted(() => {
    applyTheme(themeStore.theme)
  })

  watch(() => themeStore.theme, (newTheme) => {
    applyTheme(newTheme)
  })

  function toggleTheme() {
    themeStore.toggle()
  }

  return {
    theme: themeStore.theme,
    toggleTheme
  }
}
