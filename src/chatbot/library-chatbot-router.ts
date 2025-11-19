/**
 * Library Chatbot with LLM Router
 * Interactive CLI chatbot using LLM Router for intelligent routing between Gemini and Groq
 */

import { createChatbot } from "mcp-agent-kit";
import { libraryRouter } from "../router/llm-router";
import * as readline from "readline";
import dotenv from "dotenv";

dotenv.config();

/**
 * Library Chatbot configured with LLM Router
 * Automatically routes queries to the best LLM (Gemini or Groq) based on query characteristics
 * Maintains conversation history with maxHistory of 20 messages
 */
export const libraryChatbotWithRouter = createChatbot({
  router: libraryRouter,
  system: `You are a friendly library assistant chatbot. You help users:
- Find books and authors
- Get recommendations
- Add new books to the catalog
- Answer questions about the library

Always maintain context from previous messages and provide helpful,
conversational responses. Be warm, friendly, and professional.`,
  maxHistory: 20,
});

/**
 * Start an interactive chat session with the library chatbot (router version)
 * Provides a CLI interface for users to interact with the chatbot
 * This version uses the LLM Router to intelligently select between Gemini and Groq
 */
export async function startChatSession() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  console.log("║     Welcome to the Library Chatbot (Router Edition)!      ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(
    "\nI'm your friendly library assistant with intelligent routing."
  );
  console.log("I automatically choose the best AI model for your query:");
  console.log("  • Short queries → Gemini (fast responses)");
  console.log("  • Complex/detailed queries → Groq (in-depth analysis)");
  console.log("\nI can help you:");
  console.log("  • Search for books and authors");
  console.log("  • Get book recommendations");
  console.log("  • Add new books to the catalog");
  console.log("  • Answer questions about the library");
  console.log("\nType 'exit' or 'quit' to end the conversation.");
  console.log("Type 'stats' to see router statistics.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "You: ",
  });

  rl.prompt();

  rl.on("line", async (input: string) => {
    const userInput = input.trim();

    // Check for exit commands
    if (
      userInput.toLowerCase() === "exit" ||
      userInput.toLowerCase() === "quit"
    ) {
      console.log("\n👋 Thank you for using the Library Chatbot. Goodbye!\n");

      // Display final statistics
      const stats = libraryRouter.getStats();
      console.log("=== Final Router Statistics ===");
      console.log(`Total Queries: ${stats.totalQueries || 0}`);
      console.log(`Successful: ${stats.successful || 0}`);
      console.log(`Failed: ${stats.failed || 0}`);
      if (stats.agentUsage) {
        console.log("\nAgent Usage:");
        Object.entries(stats.agentUsage).forEach(([agent, count]) => {
          console.log(`  ${agent}: ${count} queries`);
        });
      }
      console.log();

      rl.close();
      process.exit(0);
      return;
    }

    // Check for stats command
    if (userInput.toLowerCase() === "stats") {
      const stats = libraryRouter.getStats();
      console.log("\n=== Router Statistics ===");
      console.log(`Total Queries: ${stats.totalQueries || 0}`);
      console.log(`Successful: ${stats.successful || 0}`);
      console.log(`Failed: ${stats.failed || 0}`);
      if (stats.agentUsage) {
        console.log("\nAgent Usage:");
        Object.entries(stats.agentUsage).forEach(([agent, count]) => {
          console.log(`  ${agent}: ${count} queries`);
        });
      }

      const agents = libraryRouter.listAgents();
      console.log("\nAvailable Agents:");
      agents.forEach((agent: string) => {
        console.log(`  - ${agent}`);
      });
      console.log();

      rl.prompt();
      return;
    }

    // Skip empty inputs
    if (!userInput) {
      rl.prompt();
      return;
    }

    try {
      // Send message to chatbot and get response
      // The router will automatically select the best LLM
      const response = await libraryChatbotWithRouter.chat(userInput);

      console.log(`\nBot: ${response.content}`);

      // Show which agent was used (if available in response)
      if (response.agent) {
        console.log(`[Routed to: ${response.agent}]`);
      }
      console.log();
    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}\n`);
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log("\n👋 Thank you for using the Library Chatbot. Goodbye!\n");
    process.exit(0);
  });
}

// Start the chat session if this file is run directly
if (require.main === module) {
  startChatSession().catch((error) => {
    console.error("Failed to start chat session:", error);
    process.exit(1);
  });
}
