/**
 * AI Response Cache
 * LRU cache with TTL for fast repeated queries
 */

interface CacheEntry {
  response: string
  timestamp: number
  hits: number
}

interface CacheConfig {
  maxSize: number
  ttlMs: number
}

class AICache {
  private cache: Map<string, CacheEntry> = new Map()
  private config: CacheConfig = {
    maxSize: 500,      // Max 500 entries
    ttlMs: 5 * 60 * 1000  // 5 minutes TTL
  }

  /**
   * Generate cache key from messages
   */
  private generateKey(messages: { role: string; content: string }[], system?: string): string {
    const content = messages.map(m => `${m.role}:${m.content}`).join('|')
    const key = system ? `${system.slice(0, 100)}::${content}` : content
    // Simple hash
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  /**
   * Get cached response if exists and not expired
   */
  get(messages: { role: string; content: string }[], system?: string): string | null {
    const key = this.generateKey(messages, system)
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttlMs) {
      this.cache.delete(key)
      return null
    }
    
    // Update hits
    entry.hits++
    return entry.response
  }

  /**
   * Store response in cache
   */
  set(messages: { role: string; content: string }[], system: string | undefined, response: string): void {
    const key = this.generateKey(messages, system)
    
    // LRU eviction if at max size
    if (this.cache.size >= this.config.maxSize) {
      // Delete oldest entry
      const oldest = this.cache.keys().next().value
      if (oldest) this.cache.delete(oldest)
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      hits: 1
    })
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    let totalHits = 0
    this.cache.forEach(entry => {
      totalHits += entry.hits
    })
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0
    }
  }

  /**
   * Clear expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let removed = 0
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.config.ttlMs) {
        this.cache.delete(key)
        removed++
      }
    })
    
    return removed
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }
}

// Singleton instance
export const aiCache = new AICache()

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    aiCache.cleanup()
  }, 5 * 60 * 1000)
}
