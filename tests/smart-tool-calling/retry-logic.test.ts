/**
 * Tests for RetryLogic
 */

import { RetryLogic } from "../../src/agent/smart-tool-calling/retry-logic";
import { AgentTool } from "../../src/types";

describe("RetryLogic", () => {
  describe("executeWithRetry", () => {
    it("should succeed on first attempt", async () => {
      const mockTool: AgentTool = {
        name: "test-tool",
        description: "Test tool",
        parameters: { type: "object", properties: {} },
        handler: jest.fn().mockResolvedValue({ result: "success" }),
      };

      const retryLogic = new RetryLogic({
        maxRetries: 3,
        timeout: 5000,
        debug: false,
      });

      const result = await retryLogic.executeWithRetry(mockTool, {});

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ result: "success" });
      expect(result.attempts).toBe(1);
      expect(mockTool.handler).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      let callCount = 0;
      const mockTool: AgentTool = {
        name: "test-tool",
        description: "Test tool",
        parameters: { type: "object", properties: {} },
        handler: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount < 3) {
            throw new Error("Temporary failure");
          }
          return Promise.resolve({ result: "success" });
        }),
      };

      const retryLogic = new RetryLogic({
        maxRetries: 3,
        timeout: 5000,
        debug: false,
      });

      const result = await retryLogic.executeWithRetry(mockTool, {});

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ result: "success" });
      expect(result.attempts).toBe(3);
      expect(mockTool.handler).toHaveBeenCalledTimes(3);
    });

    it("should fail after max retries", async () => {
      const mockTool: AgentTool = {
        name: "test-tool",
        description: "Test tool",
        parameters: { type: "object", properties: {} },
        handler: jest.fn().mockRejectedValue(new Error("Persistent failure")),
      };

      const retryLogic = new RetryLogic({
        maxRetries: 2,
        timeout: 5000,
        debug: false,
      });

      const result = await retryLogic.executeWithRetry(mockTool, {});

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Persistent failure");
      expect(result.attempts).toBe(3); // initial + 2 retries
      expect(mockTool.handler).toHaveBeenCalledTimes(3);
    });

    it("should timeout long-running tool calls", async () => {
      const mockTool: AgentTool = {
        name: "test-tool",
        description: "Test tool",
        parameters: { type: "object", properties: {} },
        handler: jest.fn().mockImplementation(() => {
          return new Promise((resolve) => setTimeout(resolve, 2000));
        }),
      };

      const retryLogic = new RetryLogic({
        maxRetries: 0,
        timeout: 100,
        debug: false,
      });

      const result = await retryLogic.executeWithRetry(mockTool, {});

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("timeout");
    });
  });
});
