import OpenAI from 'openai'
import { getConfig, getApiKey } from './config'

export interface TranslatorAdapter {
  translate(text: string, from: string, to: string): Promise<string>
}

class OpenAICompatibleTranslator implements TranslatorAdapter {
  private getClient(): OpenAI {
    const config = getConfig()
    return new OpenAI({
      baseURL: config.baseUrl,
      apiKey: getApiKey()
    })
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    const config = getConfig()
    const completion = await this.getClient().chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `你是一个专业翻译助手。请将以下${from}文本翻译成${to}。只返回翻译结果，不要添加任何解释。保持原文的语气和风格。`
        },
        { role: 'user', content: text }
      ],
      model: config.model,
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
      stream: false
    })

    return completion.choices[0].message.content ?? '翻译失败'
  }
}

let translator: TranslatorAdapter = new OpenAICompatibleTranslator()

export function getTranslator(): TranslatorAdapter {
  return translator
}
