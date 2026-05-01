import { ipcMain, dialog } from 'electron'
import { parseEpub } from './epub-parser'
import { parsePdf } from './pdf-parser'
import { getConfig, saveConfig } from './config'
import { getTranslator } from './translator-service'

async function parseFile(filePath: string) {
  if (filePath.toLowerCase().endsWith('.pdf')) {
    return parsePdf(filePath, '')
  }
  return parseEpub(filePath)
}

export function setupIpcHandlers(): void {
  ipcMain.handle('open-epub', async () => {
    const result = await dialog.showOpenDialog({
      filters: [
        { name: 'Supported Files', extensions: ['epub', 'pdf'] },
        { name: 'EPUB', extensions: ['epub'] },
        { name: 'PDF', extensions: ['pdf'] }
      ],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    return { ...(await parseFile(filePath)), filePath }
  })

  ipcMain.handle('open-epub-by-path', async (_event, filePath: string) => {
    return { ...(await parseFile(filePath)), filePath }
  })

  ipcMain.handle('get-config', () => {
    return getConfig()
  })

  ipcMain.handle('save-config', (_event, config: { apiKey?: string; baseUrl?: string; model?: string }) => {
    saveConfig(config)
  })

  ipcMain.handle('translate', async (_event, text: string) => {
    const detected = /[一-鿿]/.test(text) ? '中文' : '英文'
    const target = detected === '中文' ? '英文' : '中文'
    return getTranslator().translate(text, detected, target)
  })

  ipcMain.handle('analyze', async (_event, text: string, translation: string) => {
    const detected = /[一-鿿]/.test(text) ? '中文' : '英文'
    const target = detected === '中文' ? '英文' : '中文'
    return getTranslator().analyze(text, translation, detected, target)
  })
}
