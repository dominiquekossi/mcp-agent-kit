/**
 * Example: Smart Tool Calling with Retry and Caching
 *
 * This example demonstrates how to use the smart tool calling features:
 * - Automatic retry on tool execution failures
 * - Timeout support for long-running tools
 * - Caching of tool results
 */

import { createAgent } from "../src";

// Create an agent with smart tool calling enabled
const agent = createAgent({
  provider: "openai",
  model: "gpt-4-turbo-preview",
  toolConfig: {
    // Force the model to use tools when available
    forceToolUse: true,

    // Retry up to 3 times on failure
    maxRetries: 3,

    // What to do when tool is not called: 'retry', 'error', 'warn', or 'allow'
    onToolNotCalled: "retry",

    // Timeout for tool execution (30 seconds)
    toolTimeout: 30000,

    // Enable caching of tool results
    cacheResults: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 100,
    },

    // Enable debug logging
    debug: true,
  },
  tools: [
    {
      name: "get_weather",
      description: "Get the current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA",
          },
        },
        required: ["location"],
      },
      handler: async (params: { location: string }) => {
        console.log(`Fetching weather for ${params.location}...`);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return {
          location: params.location,
          temperature: 72,
          condition: "Sunny",
        };
      },
    },
    {
      name: "calculate",
      description: "Perform a mathematical calculation",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "The mathematical expression to evaluate",
          },
        },
        required: ["expression"],
      },
      handler: async (params: { expression: string }) => {
        console.log(`Calculating: ${params.expression}`);

        // Simple eval (don't use in production!)
        try {
          const result = eval(params.expression);
          return { result };
        } catch (error) {
          throw new Error(`Invalid expression: ${params.expression}`);
        }
      },
    },
  ],
});

async function main() {
  console.log("=== Smart Tool Calling Example ===\n");

  // Example 1: Execute a tool directly with retry and caching
  console.log("1. Direct tool execution with retry:");
  try {
    const result = await agent.executeTool("get_weather", {
      location: "San Francisco, CA",
    });
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  }

  console.log("\n2. Execute same tool again (should hit cache):");
  try {
    const result = await agent.executeTool("get_weather", {
      location: "San Francisco, CA",
    });
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  }

  console.log("\n3. Execute calculation tool:");
  try {
    const result = await agent.executeTool("calculate", {
      expression: "2 + 2 * 3",
    });
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  }

  console.log("\n4. Chat with agent (tools will be available):");
  const response = await agent.chat("What is the weather in New York?");
  console.log("Response:", response.content);
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
