interface CacheEntry {
  result: string
  timestamp: number
}

const MAX_CACHE_SIZE = 200

export class TranslationCache {
  private cache = new Map<string, CacheEntry>()

  get(key: string): string | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    // LRU: move to end
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.result
  }

  set(key: string, result: string): void {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) this.cache.delete(oldest)
    }
    this.cache.set(key, { result, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }
}
