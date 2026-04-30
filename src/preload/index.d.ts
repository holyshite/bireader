interface EpubData {
  paragraphs: { id: string; text: string }[]
  toc: { id: string; title: string; level: number }[]
  title: string
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
  openEpub: () => Promise<EpubData | null>
  getConfig: () => Promise<AppConfig>
  saveConfig: (config: SaveConfigInput) => Promise<void>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
