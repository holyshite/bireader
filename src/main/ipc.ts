import { ipcMain, dialog } from 'electron'
import OpenAI from 'openai'
import { parseEpub } from './epub-parser'

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
})

export function setupIpcHandlers(): void {
  ipcMain.handle('open-epub', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'EPUB', extensions: ['epub'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    const epub = await parseEpub(filePath)
    return epub
  })

  ipcMain.handle('translate', async (_event, text: string) => {
    const detected = /[一-鿿]/.test(text) ? '中文' : '英文'
    const target = detected === '中文' ? '英文' : '中文'

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `你是一个专业翻译助手。请将以下${detected}文本翻译成${target}。只返回翻译结果，不要添加任何解释。保持原文的语气和风格。`
        },
        { role: 'user', content: text }
      ],
      model: 'deepseek-v4-pro',
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
      stream: false
    })

    return completion.choices[0].message.content ?? '翻译失败'
  })
}
