<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-left">
        <template v-if="readerStore.isBookLoaded">
          <IconButton label="返回书架" @click="onBackToLibrary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </IconButton>
          <IconButton label="目录" @click="readerStore.toggleToc">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </IconButton>
          <span class="app-title">{{ readerStore.bookTitle }}</span>
        </template>
        <span v-else class="app-title">bireader</span>
      </div>
      <div class="header-right">
        <template v-if="readerStore.isBookLoaded">
          <IconButton label="翻译面板" @click="translationStore.togglePanel">
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              class="chevron-icon"
              :class="{ 'chevron-open': translationStore.isPanelOpen }"
            >
              <path d="M5 8l6 4-6 4"/><path d="M13 8l6 4-6 4"/>
            </svg>
          </IconButton>
        </template>
        <IconButton label="切换主题" @click="toggleTheme">
          <svg v-if="themeStore.theme === 'light'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </IconButton>
        <IconButton label="设置" @click="showSettings = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </IconButton>
      </div>
    </header>
    <div v-if="readerStore.isBookLoaded" class="main-body">
      <SidebarPanel :is-open="readerStore.isTocOpen" side="left">
        <TocSidebar />
      </SidebarPanel>
      <main class="reader-area" @click="onReaderClick" @mouseup="onTextSelect" @wheel="onWheel">
        <ReaderView />
      </main>
      <div
        v-if="translationStore.isPanelOpen"
        class="resize-handle"
        @mousedown="onResizeStart"
      />
      <SidebarPanel :is-open="translationStore.isPanelOpen" side="right" :width="translationStore.panelWidth">
        <TranslationPanel />
      </SidebarPanel>
    </div>
    <HomeView
      v-else
      @import="onImportEpub"
      @open-book="onOpenBook"
    />
    <SettingsDialog :visible="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup lang="ts">
import IconButton from '@/components/ui/IconButton.vue'
import SidebarPanel from '@/components/layout/SidebarPanel.vue'
import ReaderView from '@/components/reader/ReaderView.vue'
import TranslationPanel from '@/components/translator/TranslationPanel.vue'
import TocSidebar from '@/components/sidebar/TocSidebar.vue'
import SettingsDialog from '@/components/settings/SettingsDialog.vue'
import HomeView from '@/components/home/HomeView.vue'
import { ref } from 'vue'
import { useReaderStore } from '@/stores/reader'
import { useTranslationStore } from '@/stores/translation'
import { useThemeStore } from '@/stores/theme'
import { useLibraryStore } from '@/stores/library'
import { useBookmarkStore } from '@/stores/bookmarks'
import { useTheme } from '@/composables/useTheme'

const readerStore = useReaderStore()
const translationStore = useTranslationStore()
const themeStore = useThemeStore()
const libraryStore = useLibraryStore()
const bookmarkStore = useBookmarkStore()
const { toggleTheme } = useTheme()
const showSettings = ref(false)

let isResizing = false

function onResizeStart(e: MouseEvent) {
  isResizing = true
  const startX = e.clientX
  const startWidth = translationStore.panelWidth

  const onMove = (ev: MouseEvent) => {
    const delta = startX - ev.clientX
    const newWidth = Math.min(600, Math.max(260, startWidth + delta))
    translationStore.setPanelWidth(newWidth)
  }

  const onUp = () => {
    isResizing = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onWheel(e: WheelEvent) {
  if (!e.ctrlKey) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? -1 : 1
  const newSize = Math.min(32, Math.max(10, readerStore.fontSize + delta))
  readerStore.setFontSize(newSize)
}

function onReaderClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const paragraph = target.closest('[data-paragraph-id]')
  if (paragraph) {
    const id = paragraph.getAttribute('data-paragraph-id')
    readerStore.setActiveParagraph(id)
    const text = paragraph.textContent
    if (text) {
      readerStore.setSelectedText('')
      translationStore.openPanel()
    }
  }
}

function onTextSelect() {
  const selection = window.getSelection()
  const text = selection?.toString().trim()
  if (text) {
    readerStore.setSelectedText(text)
    readerStore.setActiveParagraph(null)
    translationStore.openPanel()
  }
}

async function onImportEpub() {
  const data = await window.api.openEpub()
  if (data) {
    readerStore.loadEpub(data, data.filePath)
    bookmarkStore.setBook(data.filePath)
    libraryStore.addBook(data.title, data.filePath)
    translationStore.closePanel()
  }
}

async function onOpenBook(book: { title: string; filePath: string }) {
  const data = await window.api.openEpubByPath(book.filePath)
  if (data) {
    readerStore.loadEpub(data, book.filePath)
    bookmarkStore.setBook(book.filePath)
    libraryStore.touchBook(book.filePath)
    translationStore.closePanel()
  }
}

function onBackToLibrary() {
  readerStore.backToLibrary()
  translationStore.closePanel()
}
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--space-md);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.app-header button,
.app-header select {
  -webkit-app-region: no-drag;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.app-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.5px;
}

.main-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.reader-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  contain: layout style;
}

.chevron-icon {
  transition: transform var(--transition-normal);
}

.chevron-open {
  transform: rotate(180deg);
}

.resize-handle {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background-color var(--transition-fast);
  flex-shrink: 0;
  margin-left: -2px;
  z-index: 10;
}

.resize-handle:hover {
  background: var(--color-primary);
}
</style>
