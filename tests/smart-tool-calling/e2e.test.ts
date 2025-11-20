/**
 * End-to-End tests for Smart Tool Calling
 * Tests the complete integration with the existing agent structure
 */

import { createAgent } from "../../src/agent/createAgent";
import { AgentTool } from "../../src/types";

describe("Smart Tool Calling E2E", () => {
  const agents: any[] = [];

  // Track agents for cleanup
  const trackAgent = (agent: any) => {
    agents.push(agent);
    return agent;
  };

  // Clean up all agents after each test
  afterEach(() => {
    agents.forEach((agent) => {
      if (agent.cleanup) {
        agent.cleanup();
      }
    });
    agents.length = 0;
  });

  // Final cleanup
  afterAll((done) => {
    // Give a small delay for any pending operations
    setTimeout(() => {
      done();
    }, 100);
  });

  // Mock tools that simulate real-world scenarios
  const weatherTool: AgentTool = {
    name: "get_weather",
    description: "Get current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name" },
        units: { type: "string", enum: ["celsius", "fahrenheit"] },
      },
      required: ["location"],
    },
    handler: async (params: any) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        location: params.location,
        temperature: 22,
        units: params.units || "celsius",
        condition: "sunny",
      };
    },
  };

  const calculatorTool: AgentTool = {
    name: "calculate",
    description: "Perform mathematical calculations",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["add", "subtract", "multiply", "divide"],
        },
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["operation", "a", "b"],
    },
    handler: async (params: any) => {
      const { operation, a, b } = params;
      let result: number;
      switch (operation) {
        case "add":
          result = a + b;
          break;
        case "subtract":
          result = a - b;
          break;
        case "multiply":
          result = a * b;
          break;
        case "divide":
          if (b === 0) throw new Error("Division by zero");
          result = a / b;
          break;
        default:
          throw new Error("Unknown operation");
      }
      return { result, operation, a, b };
    },
  };

  // Unreliable tool that fails sometimes (for retry testing)
  let failureCount = 0;
  const unreliableTool: AgentTool = {
    name: "unreliable_api",
    description: "An API that sometimes fails",
    parameters: {
      type: "object",
      properties: {
        data: { type: "string" },
      },
      required: ["data"],
    },
    handler: async (params: any) => {
      failureCount++;
      // Fail on first 2 attempts, succeed on 3rd
      if (failureCount < 3) {
        throw new Error("Temporary network error");
      }
      return { success: true, data: params.data, attempts: failureCount };
    },
  };

  beforeEach(() => {
    failureCount = 0;
  });

  describe("Basic Integration", () => {
    it("should create agent with smart tool calling and execute tools", async () => {
      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          tools: [weatherTool, calculatorTool],
          toolConfig: {
            maxRetries: 2,
            toolTimeout: 5000,
            cacheResults: {
              enabled: true,
              ttl: 60000,
              maxSize: 100,
            },
            debug: false,
          },
        })
      );

      // Test tool execution
      const weatherResult = await agent.executeTool("get_weather", {
        location: "London",
        units: "celsius",
      });

      expect(weatherResult).toEqual({
        location: "London",
        temperature: 22,
        units: "celsius",
        condition: "sunny",
      });

      const calcResult = await agent.executeTool("calculate", {
        operation: "add",
        a: 5,
        b: 3,
      });

      expect(calcResult).toEqual({
        result: 8,
        operation: "add",
        a: 5,
        b: 3,
      });
    });

    it("should work with minimal configuration", async () => {
      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          tools: [calculatorTool],
        })
      );

      const result = await agent.executeTool("calculate", {
        operation: "multiply",
        a: 4,
        b: 7,
      });

      expect(result.result).toBe(28);
    });
  });

  describe("Retry Logic Integration", () => {
    it("should retry failed tool calls and eventually succeed", async () => {
      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          tools: [unreliableTool],
          toolConfig: {
            maxRetries: 3,
            toolTimeout: 5000,
            debug: false,
          },
        })
      );

      const result = await agent.executeTool("unreliable_api", {
        data: "test-data",
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });

    it("should fail after max retries exceeded", async () => {
      failureCount = 0;
      const alwaysFailTool: AgentTool = {
        name: "always_fail",
        description: "Always fails",
        parameters: { type: "object", properties: {} },
        handler: async () => {
          throw new Error("Persistent error");
        },
      };

      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          tools: [alwaysFailTool],
          toolConfig: {
            maxRetries: 2,
            toolTimeout: 5000,
          },
        })
      );

      await expect(agent.executeTool("always_fail", {})).rejects.toThrow(
        "Persistent error"
      );
    });
  });

  describe("Cache Integration", () => {
    it("should cache tool results and return cached values", async () => {
      let callCount = 0;
      const countingTool: AgentTool = {
        name: "counting_tool",
        description: "Counts how many times it's called",
        parameters: {
          type: "object",
          properties: {
            input: { type: "string" },
          },
          required: ["input"],
        },
        handler: async (params: any) => {
          callCount++;
          return { count: callCount, input: params.input };
        },
      };

      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          tools: [countingTool],
          toolConfig: {
            cacheResults: {
              enabled: true,
              ttl: 60000,
              maxSize: 100,
            },
          },
        })
      );

      // First call - should execute
      const result1 = await agent.executeTool("counting_tool", {
        input: "test",
      });
      expect(result1.count).toBe(1);

      // Second call with same params - should use cache
      const result2 = await agent.executeTool("counting_tool", {
        input: "test",
      });
      expect(result2.count).toBe(1); // Same count, from cache

      // Third call with different params - should execute
      const result3 = await agent.executeTool("counting_tool", {
        input: "different",
      });
      expect(result3.count).toBe(2); // New execution
    });

    it("should work when cache is disabled", async () => {
      let callCount = 0;
      const countingTool: AgentTool = {
        name: "counting_tool",
        description: "Counts calls",
        parameters: {
          type: "object",
          properties: {
            input: { type: "string" },
          },
        },
        handler: async (params: any) => {
          callCount++;
          return { count: callCount };
        },
      };

      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          tools: [countingTool],
          toolConfig: {
            cacheResults: {
              enabled: false,
              ttl: 60000,
              maxSize: 100,
            },
          },
        })
      );

      const result1 = await agent.executeTool("counting_tool", {
        input: "test",
      });
      expect(result1.count).toBe(1);

      const result2 = await agent.executeTool("counting_tool", {
        input: "test",
      });
      expect(result2.count).toBe(2); // No cache, new execution
    });
  });

  describe("Error Handling", () => {
    it("should handle tool not found error", async () => {
      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          tools: [calculatorTool],
        })
      );

      await expect(agent.executeTool("nonexistent_tool", {})).rejects.toThrow(
        "Tool not found: nonexistent_tool"
      );
    });

    it("should handle tool execution errors", async () => {
      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          tools: [calculatorTool],
          toolConfig: {
            maxRetries: 1,
            toolTimeout: 5000,
          },
        })
      );

      await expect(
        agent.executeTool("calculate", {
          operation: "divide",
          a: 10,
          b: 0,
        })
      ).rejects.toThrow("Division by zero");
    });
  });

  describe("Timeout Handling", () => {
    it("should timeout slow tool calls", async () => {
      const slowTool: AgentTool = {
        name: "slow_tool",
        description: "Takes too long",
        parameters: { type: "object", properties: {} },
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return { result: "done" };
        },
      };

      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          tools: [slowTool],
          toolConfig: {
            maxRetries: 0,
            toolTimeout: 100,
          },
        })
      );

      await expect(agent.executeTool("slow_tool", {})).rejects.toThrow(
        "timeout"
      );
    });
  });

  describe("Multiple Tools Scenario", () => {
    it("should handle multiple different tools in sequence", async () => {
      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          tools: [weatherTool, calculatorTool],
          toolConfig: {
            maxRetries: 2,
            toolTimeout: 5000,
            cacheResults: {
              enabled: true,
              ttl: 60000,
              maxSize: 50,
            },
          },
        })
      );

      // Execute multiple tools
      const weather = await agent.executeTool("get_weather", {
        location: "Paris",
      });
      expect(weather.location).toBe("Paris");

      const calc1 = await agent.executeTool("calculate", {
        operation: "add",
        a: 10,
        b: 20,
      });
      expect(calc1.result).toBe(30);

      const calc2 = await agent.executeTool("calculate", {
        operation: "multiply",
        a: 5,
        b: 6,
      });
      expect(calc2.result).toBe(30);

      // Cached call
      const weatherCached = await agent.executeTool("get_weather", {
        location: "Paris",
      });
      expect(weatherCached).toEqual(weather);
    });
  });

  describe("Backward Compatibility", () => {
    it("should work without toolConfig (legacy mode)", async () => {
      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          tools: [calculatorTool],
        })
      );

      const result = await agent.executeTool("calculate", {
        operation: "subtract",
        a: 100,
        b: 42,
      });

      expect(result.result).toBe(58);
    });

    it("should maintain agent.chat() functionality", async () => {
      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          system: "You are a helpful assistant",
          toolConfig: {
            maxRetries: 2,
          },
        })
      );

      expect(agent.chat).toBeDefined();
      expect(typeof agent.chat).toBe("function");
    });

    it("should maintain agent.execute() functionality", async () => {
      const agent = trackAgent(
        createAgent({
          provider: "openai",
          model: "gpt-4",
          apiKey: "test-key",
          toolConfig: {
            maxRetries: 2,
          },
        })
      );

      expect(agent.execute).toBeDefined();
      expect(typeof agent.execute).toBe("function");
    });
  });
});
