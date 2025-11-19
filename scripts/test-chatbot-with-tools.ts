/**
 * Chatbot Demo with Library Tools
 * Tests if tools are being called correctly
 */

import { createChatbot, createAgent, api } from "mcp-agent-kit";
import dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

async function runChatbotWithTools() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  console.log("║       Library Chatbot with Tools Demo                     ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  // Create agent with library tools
  const agent = createAgent({
    provider: "gemini",
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    system: `You are a helpful library assistant. You MUST use the available tools to search for books and authors. Always call the appropriate tool when users ask about books or authors.`,
    tools: [
      {
        name: "list_all_books",
        description: "List all books in the library database",
        parameters: {
          type: "object",
          properties: {},
        },
        handler: async () => {
          console.log("🔧 Tool called: list_all_books()");
          const response = await api.get(`${API_BASE_URL}/api/books`);
          return {
            success: true,
            count: response.data.length,
            books: response.data.map((b: any) => ({
              id: b.id,
              title: b.title,
              author: b.author?.name,
              year: b.publishedYear,
            })),
          };
        },
      },
      {
        name: "search_books_by_title",
        description: "Search for books by title keyword",
        parameters: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "Keyword to search in book titles",
            },
          },
          required: ["keyword"],
        },
        handler: async ({ keyword }) => {
          console.log(`🔧 Tool called: search_books_by_title("${keyword}")`);
          const response = await api.get(`${API_BASE_URL}/api/books`);
          const filtered = response.data.filter((b: any) =>
            b.title.toLowerCase().includes(keyword.toLowerCase())
          );
          return {
            success: true,
            count: filtered.length,
            books: filtered,
          };
        },
      },
    ],
  });

  // Create chatbot
  const chatbot = createChatbot({
    agent,
    system: `You are a friendly library assistant. When users ask about books, you MUST use the tools to get real data from the library database.`,
    maxHistory: 10,
  });

  const queries = [
    "List all books in the library",
    "Do you have any books with 'Harry' in the title?",
    "What books are available?",
  ];

  for (const query of queries) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`👤 You: ${query}`);
    console.log(`${"=".repeat(60)}`);

    try {
      const response = await chatbot.chat(query);
      console.log(`\n🤖 Bot: ${response}\n`);
    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}\n`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n✅ Demo completed!\n");
}

runChatbotWithTools().catch((error) => {
  console.error("Demo failed:", error);
  process.exit(1);
});
