/**
 * Content caching system for RepostAI to reduce API costs and improve response times.
 * Implements LRU cache with TTL support and cache invalidation strategies.
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
  size: number; // Estimated size in bytes
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
  maxSize: number;
  evictions: number;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  defaultTTL: number; // Default TTL in milliseconds
  enableCompression?: boolean;
  enableStats?: boolean;
}

/**
 * LRU Cache with TTL support for content storage
 */
export class ContentCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = []; // LRU tracking
  private stats: CacheStats;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 100 * 1024 * 1024, // 100MB default
      defaultTTL: config.defaultTTL || 3600000, // 1 hour default
      enableCompression: config.enableCompression ?? false,
      enableStats: config.enableStats ?? true,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      totalSize: 0,
      maxSize: this.config.maxSize,
      evictions: 0,
    };
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.updateStats('miss');
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.delete(key);
      this.updateStats('miss');
      return null;
    }

    // Update access order (LRU)
    this.updateAccessOrder(key);

    // Increment hit count
    entry.hits++;

    this.updateStats('hit');

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const size = this.estimateSize(value);
    const entryTTL = ttl || this.config.defaultTTL;

    // Evict if necessary to make space
    while (this.stats.totalSize + size > this.config.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.stats.totalSize -= oldEntry.size;
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: entryTTL,
      hits: 0,
      size,
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);

    this.stats.totalSize += size;
    this.stats.totalEntries = this.cache.size;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.stats.totalSize -= entry.size;
    this.stats.totalEntries = this.cache.size;

    // Remove from access order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats.totalSize = 0;
    this.stats.totalEntries = 0;
  }

  /**
   * Check if entry has expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
    this.stats.evictions++;
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: string): void {
    // Remove from current position
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: T): number {
    const json = JSON.stringify(value);
    return new Blob([json]).size;
  }

  /**
   * Update cache statistics
   */
  private updateStats(type: 'hit' | 'miss'): void {
    if (!this.config.enableStats) {
      return;
    }

    if (type === 'hit') {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache size information
   */
  getSizeInfo(): { current: number; max: number; percentage: number } {
    return {
      current: this.stats.totalSize,
      max: this.config.maxSize,
      percentage: (this.stats.totalSize / this.config.maxSize) * 100,
    };
  }
}

/**
 * Content-specific cache key generator
 */
export class CacheKeyGenerator {
  /**
   * Generate cache key for original content
   */
  static forContent(content: string, platform?: string): string {
    const hash = this.simpleHash(content);
    return platform ? `content:${platform}:${hash}` : `content:${hash}`;
  }

  /**
   * Generate cache key for generated variations
   */
  static forVariations(content: string, tone: string, platform: string): string {
    const contentHash = this.simpleHash(content);
    return `variations:${platform}:${tone}:${contentHash}`;
  }

  /**
   * Generate cache key for analytics
   */
  static forAnalytics(contentId: string, metric: string): string {
    return `analytics:${contentId}:${metric}`;
  }

  /**
   * Generate cache key for user data
   */
  static forUser(userId: string, dataType: string): string {
    return `user:${userId}:${dataType}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Global content cache instance
 */
export const globalContentCache = new ContentCache({
  maxSize: 50 * 1024 * 1024, // 50MB
  defaultTTL: 1800000, // 30 minutes
  enableStats: true,
});

/**
 * Cache decorator for function results
 */
export function cached(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = globalContentCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      globalContentCache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Warm up cache with frequently accessed data
 */
export async function warmupCache(
  entries: Array<{ key: string; value: any; ttl?: number }>
): Promise<void> {
  for (const entry of entries) {
    globalContentCache.set(entry.key, entry.value, entry.ttl);
  }
}
