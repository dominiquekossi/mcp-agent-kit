/**
 * Library Chatbot with Single Agent
 * Interactive CLI chatbot using Gemini agent for library management
 */

import { createChatbot } from "mcp-agent-kit";
import { geminiAgent } from "../agents/gemini-agent";
import * as readline from "readline";
import dotenv from "dotenv";

dotenv.config();

/**
 * Library Chatbot configured with Gemini agent
 * Maintains conversation history with maxHistory of 20 messages
 */
export const libraryChatbot = createChatbot({
  agent: geminiAgent,
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
 * Start an interactive chat session with the library chatbot
 * Provides a CLI interface for users to interact with the chatbot
 */
export async function startChatSession() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  console.log("║          Welcome to the Library Chatbot!                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\nI'm your friendly library assistant. I can help you:");
  console.log("  • Search for books and authors");
  console.log("  • Get book recommendations");
  console.log("  • Add new books to the catalog");
  console.log("  • Answer questions about the library");
  console.log("\nType 'exit' or 'quit' to end the conversation.\n");

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
      rl.close();
      process.exit(0);
      return;
    }

    // Skip empty inputs
    if (!userInput) {
      rl.prompt();
      return;
    }

    try {
      // Send message to chatbot and get response
      const response = await libraryChatbot.chat(userInput);

      console.log(`\nBot: ${response}\n`);
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
