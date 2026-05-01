import OpenAI from 'openai'
import { getConfig, getApiKey } from './config'

export interface TranslatorAdapter {
  translate(text: string, from: string, to: string): Promise<string>
  analyze(text: string, translation: string, from: string, to: string): Promise<string>
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

  async analyze(text: string, translation: string, from: string, to: string): Promise<string> {
    const config = getConfig()
    const completion = await this.getClient().chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `你是一个语言学分析专家。用户会将一段${from}原文及其${to}翻译发给你。请分析翻译中的关键词汇、语法结构、文化背景和翻译技巧，重点解释为什么某些词要这样翻译（而不是其他意思）。用简洁的中文回答，分段列出要点，每条不超过两句话。`
        },
        {
          role: 'user',
          content: `原文：${text}\n\n译文：${translation}\n\n请分析这个翻译。`
        }
      ],
      model: config.model,
      stream: false
    })

    return completion.choices[0].message.content ?? '分析失败'
  }
}

let translator: TranslatorAdapter = new OpenAICompatibleTranslator()

export function getTranslator(): TranslatorAdapter {
  return translator
}
