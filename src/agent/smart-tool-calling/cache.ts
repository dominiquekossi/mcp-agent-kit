/**
 * Tool Result Caching for Smart Tool Calling
 */

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  debug?: boolean;
}

interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  hits: number;
}

/**
 * Serialize any value to a stable string: object keys are sorted at every
 * depth, so two structurally equal params always produce the same string and
 * two different ones never collide. Handles null, primitives and arrays.
 */
function stableStringify(value: any): string {
  if (value === undefined) {
    return 'undefined';
  }

  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  const keys = Object.keys(value).sort();
  const body = keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',');

  return `{${body}}`;
}

/**
 * ToolCache class handles caching of tool results with TTL and auto-cleanup
 */
export class ToolCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private config: CacheConfig) {
    if (config.enabled) {
      this.startAutoCleanup();
    }
  }

  /**
   * Get cached result if available and not expired
   */
  get<T = any>(key: string): T | null {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit counter
    entry.hits++;

    return entry.value as T;
  }

  /**
   * Set cache entry
   */
  set<T = any>(key: string, value: T): void {
    if (!this.config.enabled) {
      return;
    }

    // Check if cache is full
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.config.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      totalHits,
      enabled: this.config.enabled,
    };
  }

  /**
   * Generate cache key from tool name and parameters.
   *
   * Uses a recursive stable serialization so that key ordering never affects
   * the key, and nested values are always part of it. Passing the sorted keys
   * as the second argument of JSON.stringify would treat them as a replacer
   * list, which strips nested properties at every level and makes different
   * calls collide on the same entry.
   */
  static generateKey(toolName: string, params: any): string {
    return `${toolName}:${stableStringify(params)}`;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    // Find the oldest entry (LRU)
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startAutoCleanup(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);

    // Never hold the event loop open just for cache cleanup: a CLI that
    // creates an agent should still be able to exit on its own.
    if (typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref();
    }

    // Ensure cleanup runs on process exit
    if (typeof process !== "undefined") {
      process.on("beforeExit", () => {
        this.stopAutoCleanup();
      });
    }
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.config.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0 && this.config.debug) {
      console.log(
        `[ToolCache] Cleaned up ${keysToDelete.length} expired entries`
      );
    }
  }
}
