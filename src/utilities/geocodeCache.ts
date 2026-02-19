/**
 * Simple in-memory cache for geocoding results
 * Can be upgraded to Redis later for production/scale
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

class GeocodeCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly ttl: number

  constructor(ttlMs: number = 24 * 60 * 60 * 1000) {
    // Default: 1 day TTL (coordinates/addresses don't change frequently)
    this.ttl = ttlMs
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries (call periodically if needed)
  cleanup(): number {
    const now = Date.now()
    let removed = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key)
        removed++
      }
    }

    return removed
  }

  size(): number {
    return this.cache.size
  }
}

// Export singleton instance
// For geocoding: coordinates/addresses are stable, use 24 hour cache
export const geocodeCache = new GeocodeCache(24 * 60 * 60 * 1000) // 24 hours

// Helper to create cache keys
export function createCacheKey(
  type: 'geocode' | 'reverse-geocode' | 'house-numbers',
  params: Record<string, any>,
): string {
  // Sort keys for consistent cache key generation
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join('|')
  return `${type}:${sortedParams}`
}
