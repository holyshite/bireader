import { contextBridge, ipcRenderer } from 'electron'

const api = {
  translate: (text: string): Promise<string> => ipcRenderer.invoke('translate', text),
  openEpub: (): Promise<{
    paragraphs: { id: string; text: string }[]
    toc: { id: string; title: string; level: number }[]
    title: string
  } | null> => ipcRenderer.invoke('open-epub')
}

contextBridge.exposeInMainWorld('api', api)
