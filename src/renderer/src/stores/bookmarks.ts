import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Bookmark {
  id: string
  text: string
  time: number
}

const STORAGE_KEY = 'bireader-bookmarks'

function loadAll(): Record<string, Bookmark[]> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch { return {} }
}

function saveAll(all: Record<string, Bookmark[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export const useBookmarkStore = defineStore('bookmarks', () => {
  const allBookmarks = ref<Record<string, Bookmark[]>>(loadAll())
  const currentKey = ref('')

  const bookmarks = computed(() => allBookmarks.value[currentKey.value] || [])

  function setBook(filePath: string) {
    currentKey.value = filePath
    if (!allBookmarks.value[filePath]) {
      allBookmarks.value[filePath] = []
    }
  }

  function toggle(id: string, text: string) {
    const list = allBookmarks.value[currentKey.value] || []
    const idx = list.findIndex(b => b.id === id)
    if (idx >= 0) {
      list.splice(idx, 1)
    } else {
      list.push({ id, text: text.slice(0, 60), time: Date.now() })
    }
    allBookmarks.value[currentKey.value] = list
    saveAll(allBookmarks.value)
  }

  function has(id: string): boolean {
    return (allBookmarks.value[currentKey.value] || []).some(b => b.id === id)
  }

  function remove(id: string) {
    const list = allBookmarks.value[currentKey.value]
    if (!list) return
    const idx = list.findIndex(b => b.id === id)
    if (idx >= 0) {
      list.splice(idx, 1)
      allBookmarks.value[currentKey.value] = list
      saveAll(allBookmarks.value)
    }
  }

  function clear() {
    allBookmarks.value[currentKey.value] = []
    saveAll(allBookmarks.value)
  }

  return { bookmarks, setBook, toggle, has, remove, clear }
})
