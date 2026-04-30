import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface BookEntry {
  title: string
  filePath: string
  lastRead: number
}

export const useLibraryStore = defineStore('library', () => {
  const saved = localStorage.getItem('bireader-library')
  const books = ref<BookEntry[]>(saved ? JSON.parse(saved) : [])

  watch(books, (val) => {
    localStorage.setItem('bireader-library', JSON.stringify(val))
  }, { deep: true })

  function addBook(title: string, filePath: string) {
    const existing = books.value.find(b => b.filePath === filePath)
    if (existing) {
      existing.lastRead = Date.now()
      existing.title = title
    } else {
      books.value.unshift({ title, filePath, lastRead: Date.now() })
    }
  }

  function removeBook(filePath: string) {
    books.value = books.value.filter(b => b.filePath !== filePath)
  }

  function touchBook(filePath: string) {
    const book = books.value.find(b => b.filePath === filePath)
    if (book) book.lastRead = Date.now()
  }

  return { books, addBook, removeBook, touchBook }
})
