import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem('bireader-theme')
  const theme = ref<'light' | 'dark'>(saved === 'dark' ? 'dark' : 'light')

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('bireader-theme', theme.value)
  }

  return { theme, toggle }
})
