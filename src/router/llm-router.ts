/**
 * LLM Router for Library Management
 * Routes queries to the most appropriate LLM based on query characteristics
 */

import { createLLMRouter } from "mcp-agent-kit";
import { geminiAgent } from "../agents/gemini-agent";
import { groqAgent } from "../agents/groq-agent";
import dotenv from "dotenv";

dotenv.config();

/**
 * Library Router Configuration
 * Routes queries intelligently between Gemini and Groq based on:
 * - Query length (short queries to Gemini)
 * - Query complexity (complex/detailed queries to Groq)
 * - Default fallback to Gemini
 */
export const libraryRouter = createLLMRouter({
  agents: {
    gemini: geminiAgent,
    groq: groqAgent,
  },
  rules: [
    {
      // Use Gemini for quick queries (short inputs < 100 characters)
      name: "short-query-gemini",
      when: (input: string) => input.length < 100,
      use: "gemini",
    },
    {
      // Use Groq for complex queries or detailed explanations
      name: "complex-query-groq",
      when: (input: string) => {
        const lowerInput = input.toLowerCase();
        return (
          lowerInput.includes("complex") ||
          lowerInput.includes("detailed") ||
          lowerInput.includes("explain") ||
          lowerInput.includes("analyze") ||
          lowerInput.includes("compare")
        );
      },
      use: "groq",
    },
    {
      // Default to Gemini for all other queries
      name: "default-gemini",
      default: true,
      use: "gemini",
    },
  ],
  fallback: "gemini",
  retryAttempts: 3,
  logLevel: "info",
});

/**
 * Query the library using the LLM Router
 * Automatically routes to the best LLM based on query characteristics
 *
 * @param userInput - The user's query or request
 * @returns Promise with the response from the selected LLM
 */
export async function queryLibrary(userInput: string) {
  console.log("\n=== Library Query ===");
  console.log(`Input: "${userInput}"`);
  console.log(`Input length: ${userInput.length} characters\n`);

  try {
    // Route the query to the appropriate LLM
    const response = await libraryRouter.route(userInput);

    console.log("\n=== Response ===");
    console.log(`Selected Agent: ${response.agent || "unknown"}`);
    console.log(`Response: ${response.content}\n`);

    // Get and display router statistics
    const stats = libraryRouter.getStats();
    console.log("=== Router Statistics ===");
    console.log(`Total Queries: ${stats.totalQueries || 0}`);
    console.log(`Successful: ${stats.successful || 0}`);
    console.log(`Failed: ${stats.failed || 0}`);
    if (stats.agentUsage) {
      console.log("\nAgent Usage:");
      Object.entries(stats.agentUsage).forEach(([agent, count]) => {
        console.log(`  ${agent}: ${count} queries`);
      });
    }

    // List available agents
    const agents = libraryRouter.listAgents();
    console.log("\n=== Available Agents ===");
    agents.forEach((agent: string) => {
      console.log(`  - ${agent}`);
    });
    console.log();

    return response;
  } catch (error: any) {
    console.error("\n=== Error ===");
    console.error(`Failed to process query: ${error.message}`);
    throw error;
  }
}
