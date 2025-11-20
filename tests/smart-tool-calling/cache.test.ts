/**
 * Tests for ToolCache
 */

import { ToolCache } from "../../src/agent/smart-tool-calling/cache";

describe("ToolCache", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("get and set", () => {
    it("should store and retrieve values", () => {
      const cache = new ToolCache({
        enabled: true,
        ttl: 5000,
        maxSize: 10,
      });

      cache.set("key1", { data: "value1" });
      const result = cache.get("key1");

      expect(result).toEqual({ data: "value1" });
    });

    it("should return null for non-existent keys", () => {
      const cache = new ToolCache({
        enabled: true,
        ttl: 5000,
        maxSize: 10,
      });

      const result = cache.get("nonexistent");

      expect(result).toBeNull();
    });

    it("should not cache when disabled", () => {
      const cache = new ToolCache({
        enabled: false,
        ttl: 5000,
        maxSize: 10,
      });

      cache.set("key1", { data: "value1" });
      const result = cache.get("key1");

      expect(result).toBeNull();
    });
  });

  describe("TTL expiration", () => {
    it("should expire entries after TTL", () => {
      jest.useFakeTimers();

      const cache = new ToolCache({
        enabled: true,
        ttl: 1000,
        maxSize: 10,
      });

      cache.set("key1", { data: "value1" });

      // Before expiration
      expect(cache.get("key1")).toEqual({ data: "value1" });

      // After expiration
      jest.advanceTimersByTime(1001);
      expect(cache.get("key1")).toBeNull();

      jest.useRealTimers();
    });
  });

  describe("has", () => {
    it("should return true for existing non-expired keys", () => {
      const cache = new ToolCache({
        enabled: true,
        ttl: 5000,
        maxSize: 10,
      });

      cache.set("key1", { data: "value1" });

      expect(cache.has("key1")).toBe(true);
    });

    it("should return false for non-existent keys", () => {
      const cache = new ToolCache({
        enabled: true,
        ttl: 5000,
        maxSize: 10,
      });

      expect(cache.has("nonexistent")).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      const cache = new ToolCache({
        enabled: true,
        ttl: 5000,
        maxSize: 10,
      });

      cache.set("key1", { data: "value1" });
      cache.set("key2", { data: "value2" });

      cache.clear();

      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBeNull();
    });
  });

  describe("getStats", () => {
    it("should return cache statistics", () => {
      const cache = new ToolCache({
        enabled: true,
        ttl: 5000,
        maxSize: 10,
      });

      cache.set("key1", { data: "value1" });
      cache.get("key1");
      cache.get("key1");

      const stats = cache.getStats();

      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(10);
      expect(stats.totalHits).toBe(2);
      expect(stats.enabled).toBe(true);
    });
  });

  describe("generateKey", () => {
    it("should generate consistent keys for same inputs", () => {
      const key1 = ToolCache.generateKey("tool1", { a: 1, b: 2 });
      const key2 = ToolCache.generateKey("tool1", { a: 1, b: 2 });

      expect(key1).toBe(key2);
    });

    it("should generate different keys for different inputs", () => {
      const key1 = ToolCache.generateKey("tool1", { a: 1 });
      const key2 = ToolCache.generateKey("tool1", { a: 2 });

      expect(key1).not.toBe(key2);
    });
  });

  describe("eviction", () => {
    it("should evict LRU entry when cache is full", () => {
      const cache = new ToolCache({
        enabled: true,
        ttl: 5000,
        maxSize: 2,
      });

      cache.set("key1", { data: "value1" });
      cache.set("key2", { data: "value2" });
      cache.set("key3", { data: "value3" }); // Should evict key1

      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(true);
      expect(cache.has("key3")).toBe(true);
    });
  });
});
