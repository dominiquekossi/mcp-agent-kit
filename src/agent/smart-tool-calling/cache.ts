/**
 * Tool Result Cache
 */

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
}

interface CachedResult {
  result: any;
  timestamp: number;
  ttl: number;
}

/**
 * Simple in-memory cache for tool results
 */
export class ToolCache {
  private cache: Map<string, CachedResult> = new Map();
  private config: CacheConfig;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: CacheConfig) {
    this.config = config;

    // Setup automatic cleanup
    if (config.enabled && config.ttl > 0) {
      const cleanupFrequency = Math.min(300000, config.ttl / 2); // Every 5 min or TTL/2
      this.cleanupInterval = setInterval(() => {
        this.clearExpired();
      }, cleanupFrequency);

      // Don't keep process alive
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Get cached result
   */
  get(key: string): any | null {
    if (!this.config.enabled) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  /**
   * Set cached result
   */
  set(key: string, result: any, ttl?: number): void {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Check size limit
      if (this.cache.size >= this.config.maxSize) {
        // Remove oldest entry (simple LRU)
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }

      this.cache.set(key, {
        result,
        timestamp: Date.now(),
        ttl: ttl || this.config.ttl,
      });
    } catch (error) {
      console.warn('Failed to cache result:', error);
    }
  }

  /**
   * Generate cache key
   */
  generateKey(toolName: string, params: any): string {
    try {
      const paramsStr = JSON.stringify(params, Object.keys(params || {}).sort());
      return `${toolName}:${paramsStr}`;
    } catch (error) {
      console.warn('Failed to generate cache key:', error);
      return `${toolName}:${Date.now()}`;
    }
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      enabled: this.config.enabled,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}
