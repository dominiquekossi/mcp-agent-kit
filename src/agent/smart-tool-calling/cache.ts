/**
 * Tool Cache
 * Caches tool call results to avoid redundant calls
 */

import { CachedResult, CacheConfig } from "./config";

/**
 * Simple in-memory cache for tool results
 */
export class ToolCache {
  private cache: Map<string, CachedResult> = new Map();
  private config: CacheConfig;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: CacheConfig) {
    this.config = config;

    // Setup automatic cleanup if cache is enabled
    if (config.enabled && config.ttl > 0) {
      // Run cleanup every 5 minutes or half the TTL, whichever is smaller
      const cleanupFrequency = Math.min(300000, config.ttl / 2);
      this.cleanupInterval = setInterval(() => {
        this.clearExpired();
      }, cleanupFrequency);

      // Prevent the interval from keeping the process alive
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Destroy the cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.clear();
  }

  /**
   * Generate a cache key from tool name and parameters
   * @param toolName Name of the tool
   * @param params Tool parameters
   * @returns Cache key
   */
  generateKey(toolName: string, params: any): string {
    try {
      if (this.config.key) {
        return this.config.key(toolName, params);
      }

      // Default key generation: toolName + JSON stringified params
      const paramsStr = JSON.stringify(params, Object.keys(params).sort());
      return `${toolName}:${paramsStr}`;
    } catch (error) {
      // Fallback to simple key if JSON.stringify fails
      console.warn(`Failed to generate cache key for tool ${toolName}:`, error);
      return `${toolName}:${Date.now()}`;
    }
  }

  /**
   * Get a cached result
   * @param key Cache key
   * @returns Cached result or null if not found or expired
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
   * Set a cached result
   * @param key Cache key
   * @param result Result to cache
   * @param ttl Time to live in milliseconds (optional, uses config default)
   */
  set(key: string, result: any, ttl?: number): void {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Check max size
      if (this.config.maxSize && this.cache.size >= this.config.maxSize) {
        // Remove oldest entry (LRU-like behavior)
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
      console.warn(`Failed to cache result for key ${key}:`, error);
    }
  }

  /**
   * Check if a key exists in cache and is not expired
   * @param key Cache key
   * @returns True if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear all cached results
   */
  clear(): void {
    this.cache.clear();
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
   * Get cache statistics
   * @returns Cache stats
   */
  getStats(): {
    size: number;
    maxSize: number;
    enabled: boolean;
    ttl: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize || 0,
      enabled: this.config.enabled,
      ttl: this.config.ttl,
    };
  }

  /**
   * Delete a specific cache entry
   * @param key Cache key
   * @returns True if entry was deleted
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Get all cache keys
   * @returns Array of cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}
