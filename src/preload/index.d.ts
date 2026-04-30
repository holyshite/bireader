interface EpubData {
  paragraphs: { id: string; text: string }[]
  toc: { id: string; title: string; level: number }[]
  title: string
}

export interface ElectronAPI {
  translate: (text: string) => Promise<string>
  openEpub: () => Promise<EpubData | null>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
