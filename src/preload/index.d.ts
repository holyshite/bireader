interface EpubData {
  paragraphs: { id: string; text: string; type: 'heading' | 'text' | 'toc' }[]
  toc: { id: string; title: string; level: number }[]
  title: string
  filePath: string
}

interface AppConfig {
  baseUrl: string
  model: string
  hasKey: boolean
}

interface SaveConfigInput {
  apiKey?: string
  baseUrl?: string
  model?: string
}

export interface ElectronAPI {
  translate: (text: string) => Promise<string>
  analyze: (text: string, translation: string) => Promise<string>
  openEpub: () => Promise<EpubData | null>
  openEpubByPath: (filePath: string) => Promise<EpubData | null>
  getConfig: () => Promise<AppConfig>
  saveConfig: (config: SaveConfigInput) => Promise<void>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
