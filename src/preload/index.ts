import { contextBridge, ipcRenderer } from 'electron'

const api = {
  translate: (text: string): Promise<string> => ipcRenderer.invoke('translate', text),
  openEpub: (): Promise<{
    paragraphs: { id: string; text: string; type: string }[]
    toc: { id: string; title: string; level: number }[]
    title: string
    filePath: string
  } | null> => ipcRenderer.invoke('open-epub'),
  openEpubByPath: (filePath: string): Promise<{
    paragraphs: { id: string; text: string; type: string }[]
    toc: { id: string; title: string; level: number }[]
    title: string
    filePath: string
  } | null> => ipcRenderer.invoke('open-epub-by-path', filePath),
  getConfig: (): Promise<{ baseUrl: string; model: string; hasKey: boolean }> =>
    ipcRenderer.invoke('get-config'),
  saveConfig: (config: { apiKey?: string; baseUrl?: string; model?: string }): Promise<void> =>
    ipcRenderer.invoke('save-config', config)
}

contextBridge.exposeInMainWorld('api', api)
