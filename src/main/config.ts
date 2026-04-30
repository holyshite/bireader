import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

interface AppConfig {
  apiKey: string
  baseUrl: string
  model: string
}

const DEFAULT_CONFIG: AppConfig = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-v4-flash'
}

let configPath: string

export function initConfig(): void {
  configPath = join(app.getPath('userData'), 'config.json')
  if (!existsSync(configPath)) {
    mkdirSync(dirname(configPath), { recursive: true })
    writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8')
  }
}

function readConfig(): AppConfig {
  const raw = readFileSync(configPath, 'utf-8')
  return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
}

function writeConfig(config: AppConfig): void {
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

export function getConfig(): { baseUrl: string; model: string; hasKey: boolean } {
  const config = readConfig()
  return {
    baseUrl: config.baseUrl,
    model: config.model,
    hasKey: config.apiKey.length > 0
  }
}

export function saveConfig(partial: { apiKey?: string; baseUrl?: string; model?: string }): void {
  const config = readConfig()
  if (partial.apiKey !== undefined) config.apiKey = partial.apiKey
  if (partial.baseUrl !== undefined) config.baseUrl = partial.baseUrl
  if (partial.model !== undefined) config.model = partial.model
  writeConfig(config)
}

export function getApiKey(): string {
  return readConfig().apiKey
}
