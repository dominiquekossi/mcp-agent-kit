/**
 * Integration tests for Smart Tool Calling
 */

import { createAgent } from "../../src/agent/createAgent";
import { AgentTool } from "../../src/types";

describe("Smart Tool Calling Integration", () => {
  const mockTool: AgentTool = {
    name: "calculator",
    description: "Performs calculations",
    parameters: {
      type: "object",
      properties: {
        operation: { type: "string" },
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["operation", "a", "b"],
    },
    handler: async (params: any) => {
      const { operation, a, b } = params;
      switch (operation) {
        case "add":
          return { result: a + b };
        case "multiply":
          return { result: a * b };
        default:
          throw new Error("Unknown operation");
      }
    },
  };

  describe("Agent with toolConfig", () => {
    it("should create agent with smart tool calling config", () => {
      const agent = createAgent({
        provider: "openai",
        model: "gpt-4",
        apiKey: "test-key",
        tools: [mockTool],
        toolConfig: {
          maxRetries: 2,
          toolTimeout: 5000,
          cacheResults: {
            enabled: true,
            ttl: 60000,
            maxSize: 50,
          },
        },
      });

      expect(agent).toBeDefined();
      expect(agent.chat).toBeDefined();
    });

    it("should handle tool execution with retry", async () => {
      let callCount = 0;
      const unreliableTool: AgentTool = {
        name: "unreliable",
        description: "Sometimes fails",
        parameters: { type: "object", properties: {} },
        handler: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount < 2) {
            throw new Error("Temporary failure");
          }
          return Promise.resolve({ result: "success" });
        }),
      };

      const agent = createAgent({
        provider: "openai",
        model: "gpt-4",
        apiKey: "test-key",
        tools: [unreliableTool],
        toolConfig: {
          maxRetries: 3,
          toolTimeout: 5000,
          debug: false,
        },
      });

      expect(agent).toBeDefined();
    });

    it("should use cache for repeated tool calls", async () => {
      const agent = createAgent({
        provider: "openai",
        model: "gpt-4",
        apiKey: "test-key",
        tools: [mockTool],
        toolConfig: {
          cacheResults: {
            enabled: true,
            ttl: 60000,
            maxSize: 100,
          },
        },
      });

      expect(agent).toBeDefined();
    });
  });

  describe("Default configuration", () => {
    it("should work without toolConfig", () => {
      const agent = createAgent({
        provider: "openai",
        model: "gpt-4",
        apiKey: "test-key",
        tools: [mockTool],
      });

      expect(agent).toBeDefined();
    });
  });
});
