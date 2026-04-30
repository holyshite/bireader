import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface Bookmark {
  id: string
  text: string
  time: number
}

export const useBookmarkStore = defineStore('bookmarks', () => {
  const saved = localStorage.getItem('bireader-bookmarks')
  const bookmarks = ref<Bookmark[]>(saved ? JSON.parse(saved) : [])

  watch(bookmarks, (val) => {
    localStorage.setItem('bireader-bookmarks', JSON.stringify(val))
  }, { deep: true })

  function toggle(id: string, text: string) {
    const idx = bookmarks.value.findIndex(b => b.id === id)
    if (idx >= 0) {
      bookmarks.value.splice(idx, 1)
    } else {
      bookmarks.value.push({ id, text: text.slice(0, 60), time: Date.now() })
    }
  }

  function has(id: string): boolean {
    return bookmarks.value.some(b => b.id === id)
  }

  function remove(id: string) {
    const idx = bookmarks.value.findIndex(b => b.id === id)
    if (idx >= 0) bookmarks.value.splice(idx, 1)
  }

  function clear() {
    bookmarks.value = []
  }

  return { bookmarks, toggle, has, remove, clear }
})
