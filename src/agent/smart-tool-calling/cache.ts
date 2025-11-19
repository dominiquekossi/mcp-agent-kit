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

  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * Generate a cache key from tool name and parameters
   * @param toolName Name of the tool
   * @param params Tool parameters
   * @returns Cache key
   */
  generateKey(toolName: string, params: any): string {
    if (this.config.key) {
      return this.config.key(toolName, params);
    }

    // Default key generation: toolName + JSON stringified params
    const paramsStr = JSON.stringify(params, Object.keys(params).sort());
    return `${toolName}:${paramsStr}`;
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

    // Check max size
    if (this.config.maxSize && this.cache.size >= this.config.maxSize) {
      // Remove oldest entry
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
