/**
 * Tests for cache key generation.
 *
 * The original implementation passed the sorted keys as JSON.stringify's
 * replacer, which strips nested properties at every level — so different
 * calls collided and the cache returned another call's result.
 */

import { ToolCache } from "../../src/agent/smart-tool-calling/cache";

describe("ToolCache.generateKey", () => {
  it("keeps nested params distinct", () => {
    const paris = ToolCache.generateKey("forecast", {
      query: { city: "Paris", days: 3 },
    });
    const tokyo = ToolCache.generateKey("forecast", {
      query: { city: "Tokyo", days: 9 },
    });

    expect(paris).not.toBe(tokyo);
    expect(paris).toContain("Paris");
  });

  it("ignores key order at every depth", () => {
    const a = ToolCache.generateKey("t", {
      b: 2,
      a: 1,
      nested: { y: "two", x: "one" },
    });
    const b = ToolCache.generateKey("t", {
      a: 1,
      b: 2,
      nested: { x: "one", y: "two" },
    });

    expect(a).toBe(b);
  });

  it("distinguishes arrays by content and order", () => {
    const first = ToolCache.generateKey("t", { items: [1, 2, 3] });
    const second = ToolCache.generateKey("t", { items: [3, 2, 1] });
    const nestedObjects = ToolCache.generateKey("t", {
      items: [{ id: 1 }, { id: 2 }],
    });
    const nestedOther = ToolCache.generateKey("t", {
      items: [{ id: 1 }, { id: 3 }],
    });

    expect(first).not.toBe(second);
    expect(nestedObjects).not.toBe(nestedOther);
  });

  it("handles null, undefined and primitive params without throwing", () => {
    expect(() => ToolCache.generateKey("t", null)).not.toThrow();
    expect(() => ToolCache.generateKey("t", undefined)).not.toThrow();
    expect(() => ToolCache.generateKey("t", "text")).not.toThrow();
    expect(() => ToolCache.generateKey("t", 42)).not.toThrow();

    expect(ToolCache.generateKey("t", null)).not.toBe(
      ToolCache.generateKey("t", undefined)
    );
  });

  it("separates different tools with identical params", () => {
    const params = { city: "Paris" };
    expect(ToolCache.generateKey("weather", params)).not.toBe(
      ToolCache.generateKey("forecast", params)
    );
  });

  it("does not serve one call's result to a different call", () => {
    const cache = new ToolCache({ enabled: true, ttl: 60000, maxSize: 10 });

    cache.set(
      ToolCache.generateKey("forecast", { query: { city: "Paris", days: 3 } }),
      "Paris: 18C"
    );

    const tokyo = cache.get(
      ToolCache.generateKey("forecast", { query: { city: "Tokyo", days: 9 } })
    );

    expect(tokyo).toBeNull();
    cache.stopAutoCleanup();
  });
});
