import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TocItem {
  id: string
  title: string
  level: number
}

export const useReaderStore = defineStore('reader', () => {
  const content = ref<{ id: string; text: string }[]>([])
  const toc = ref<TocItem[]>([])
  const selectedText = ref('')
  const activeParagraphId = ref<string | null>(null)
  const fontSize = ref(17)
  const isTocOpen = ref(true)
  const bookTitle = ref('bireader')
  const isBookLoaded = ref(false)
  const currentFilePath = ref('')

  function setContent(paragraphs: { id: string; text: string }[]) {
    content.value = paragraphs
  }

  function setToc(items: TocItem[]) {
    toc.value = items
  }

  function setBookTitle(title: string) {
    bookTitle.value = title
  }

  function loadEpub(data: { paragraphs: { id: string; text: string }[]; toc: TocItem[]; title: string }, filePath?: string) {
    content.value = data.paragraphs
    toc.value = data.toc
    bookTitle.value = data.title
    isBookLoaded.value = true
    if (filePath) currentFilePath.value = filePath
  }

  function backToLibrary() {
    isBookLoaded.value = false
    content.value = []
    toc.value = []
    currentFilePath.value = ''
  }

  function setSelectedText(text: string) {
    selectedText.value = text
  }

  function setActiveParagraph(id: string | null) {
    activeParagraphId.value = id
  }

  function setFontSize(size: number) {
    fontSize.value = size
  }

  function toggleToc() {
    isTocOpen.value = !isTocOpen.value
  }

  return {
    content,
    toc,
    selectedText,
    activeParagraphId,
    fontSize,
    isTocOpen,
    bookTitle,
    isBookLoaded,
    currentFilePath,
    setContent,
    setToc,
    setBookTitle,
    loadEpub,
    backToLibrary,
    setSelectedText,
    setActiveParagraph,
    setFontSize,
    toggleToc
  }
})
