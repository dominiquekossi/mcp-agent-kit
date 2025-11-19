/**
 * Complete Demo Script
 * Runs a comprehensive demonstration of all mcp-agent-kit features
 */

import dotenv from "dotenv";
import { api } from "mcp-agent-kit";

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

async function checkAPIServer() {
  try {
    await api.get(`${API_BASE_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function runDemo() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     mcp-agent-kit Complete Demo - Library Management      ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  console.log("This demo showcases all features of mcp-agent-kit:");
  console.log("  1. API Helpers (HTTP requests with retry/timeout)");
  console.log("  2. MCP Server (tools and resources)");
  console.log("  3. AI Agents (Gemini and Groq)");
  console.log("  4. LLM Router (intelligent routing)");
  console.log("  5. Chatbot (conversational AI)\n");

  // Check if API server is running
  console.log("Checking API server status...");
  const isAPIRunning = await checkAPIServer();

  if (!isAPIRunning) {
    console.error("❌ API server is not running!");
    console.error("\nPlease start the API server first:");
    console.error("  npm run api");
    console.error("\nThen run this demo again:");
    console.error("  npm run demo");
    process.exit(1);
  }

  console.log("✅ API server is running\n");

  // Check API keys
  console.log("Checking API keys...");
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const hasGroqKey = !!process.env.GROQ_API_KEY;

  if (!hasGeminiKey) {
    console.warn(
      "⚠️  GEMINI_API_KEY not found - Gemini agent tests will be skipped"
    );
  } else {
    console.log("✅ GEMINI_API_KEY found");
  }

  if (!hasGroqKey) {
    console.warn(
      "⚠️  GROQ_API_KEY not found - Groq agent tests will be skipped"
    );
  } else {
    console.log("✅ GROQ_API_KEY found");
  }
  console.log();

  console.log("=".repeat(60));
  console.log("Starting Demo...");
  console.log("=".repeat(60));
  console.log();

  try {
    // Demo 1: API Helpers
    console.log("\n" + "█".repeat(60));
    console.log("█  DEMO 1: API Helpers (mcp-agent-kit API module)");
    console.log("█".repeat(60) + "\n");

    console.log(
      "Demonstrating HTTP requests with mcp-agent-kit API helpers...\n"
    );

    // Get all books
    console.log("1. GET request - Fetching all books...");
    const books = await api.get(`${API_BASE_URL}/api/books`);
    console.log(`   ✅ Found ${books.data.length} books\n`);

    // Get all authors
    console.log("2. GET request - Fetching all authors...");
    const authors = await api.get(`${API_BASE_URL}/api/authors`);
    console.log(`   ✅ Found ${authors.data.length} authors\n`);

    // Create a book
    console.log("3. POST request - Creating a new book...");
    const newBook = await api.post(`${API_BASE_URL}/api/books`, {
      title: "Demo Book - mcp-agent-kit",
      description: "Created during the complete demo",
      publishedYear: 2024,
      authorId: authors.data.length > 0 ? authors.data[0].id : 1,
    });
    console.log(`   ✅ Book created with ID ${newBook.data.id}\n`);

    // Update the book
    console.log("4. PUT request - Updating the book...");
    const updated = await api.put(
      `${API_BASE_URL}/api/books/${newBook.data.id}`,
      {
        title: "Demo Book - Updated",
      }
    );
    console.log(`   ✅ Book updated: "${updated.data.title}"\n`);

    // Request with retry
    console.log("5. GET with retry - Fetching book with retry enabled...");
    const bookWithRetry = await api.request({
      name: "get-book-retry",
      url: `${API_BASE_URL}/api/books/${newBook.data.id}`,
      method: "GET",
      timeout: 5000,
      retries: 3,
    });
    console.log(`   ✅ Retrieved: "${bookWithRetry.data.title}"\n`);

    // Delete the book
    console.log("6. DELETE request - Deleting the book...");
    await api.delete(`${API_BASE_URL}/api/books/${newBook.data.id}`);
    console.log(`   ✅ Book deleted\n`);

    console.log("✅ API Helpers Demo Complete!");

    // Demo 2: MCP Server Tools
    console.log("\n" + "█".repeat(60));
    console.log("█  DEMO 2: MCP Server Tools & Resources");
    console.log("█".repeat(60) + "\n");

    console.log(
      "The MCP Server exposes library operations as tools and resources.\n"
    );
    console.log("Available Tools:");
    console.log("  • list_books - List all books");
    console.log("  • get_book - Get book by ID");
    console.log("  • create_book - Create new book");
    console.log("  • update_book - Update book");
    console.log("  • delete_book - Delete book");
    console.log("  • list_authors - List all authors");
    console.log("  • create_author - Create new author");
    console.log("  • get_author_books - Get books by author\n");

    console.log("Available Resources:");
    console.log("  • library://stats - Library statistics");
    console.log("  • library://catalog - Full catalog\n");

    console.log("MCP Server Modes:");
    console.log("  • stdio transport: npm run mcp:stdio");
    console.log("  • WebSocket transport: npm run mcp:ws (port 8080)\n");

    console.log("✅ MCP Server Demo Complete!");

    // Demo 3: AI Agents
    if (hasGeminiKey || hasGroqKey) {
      console.log("\n" + "█".repeat(60));
      console.log("█  DEMO 3: AI Agents (Gemini & Groq)");
      console.log("█".repeat(60) + "\n");

      console.log(
        "AI Agents use LLMs to interact with the library in natural language.\n"
      );

      if (hasGeminiKey) {
        console.log("Testing Gemini Agent...");
        const { geminiAgent } = await import("../src/agents/gemini-agent");
        const geminiResponse = await geminiAgent.chat(
          "How many books are in the library?"
        );
        console.log(`✅ Gemini: ${geminiResponse.content}\n`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (hasGroqKey) {
        console.log("Testing Groq Agent...");
        const { groqAgent } = await import("../src/agents/groq-agent");
        const groqResponse = await groqAgent.chat(
          "List the authors in our library"
        );
        console.log(`✅ Groq: ${groqResponse.content}\n`);
      }

      console.log("✅ AI Agents Demo Complete!");
    } else {
      console.log("\n" + "█".repeat(60));
      console.log("█  DEMO 3: AI Agents - SKIPPED (No API keys)");
      console.log("█".repeat(60) + "\n");
    }

    // Demo 4: LLM Router
    if (hasGeminiKey && hasGroqKey) {
      console.log("\n" + "█".repeat(60));
      console.log("█  DEMO 4: LLM Router (Intelligent Routing)");
      console.log("█".repeat(60) + "\n");

      console.log(
        "The LLM Router intelligently routes queries to the best LLM:\n"
      );
      console.log("Routing Rules:");
      console.log("  • Short queries (< 100 chars) → Gemini");
      console.log("  • Complex/detailed queries → Groq");
      console.log("  • Default → Gemini\n");

      const { queryLibrary } = await import("../src/router/llm-router");

      console.log("Test 1: Short query (should use Gemini)");
      await queryLibrary("List books");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("\nTest 2: Complex query (should use Groq)");
      await queryLibrary(
        "Can you explain in detail how the library system works?"
      );

      console.log("\n✅ LLM Router Demo Complete!");
    } else {
      console.log("\n" + "█".repeat(60));
      console.log("█  DEMO 4: LLM Router - SKIPPED (Need both API keys)");
      console.log("█".repeat(60) + "\n");
    }

    // Demo 5: Chatbot
    console.log("\n" + "█".repeat(60));
    console.log("█  DEMO 5: Chatbot (Conversational AI)");
    console.log("█".repeat(60) + "\n");

    console.log(
      "The Chatbot maintains conversation history for contextual responses.\n"
    );
    console.log("Features:");
    console.log("  • Conversation memory (maxHistory: 20)");
    console.log("  • Context-aware responses");
    console.log("  • Natural language interaction");
    console.log("  • Can use single agent or router\n");

    console.log("To start the chatbot:");
    console.log("  npm run chatbot         # Single agent (Gemini)");
    console.log("  npm run chatbot:router  # With LLM Router\n");

    console.log("✅ Chatbot Demo Complete!");

    // Final Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Complete Demo Finished Successfully!");
    console.log("=".repeat(60));
    console.log("\nmcp-agent-kit Features Demonstrated:");
    console.log("  ✅ API Helpers - HTTP requests with retry/timeout");
    console.log("  ✅ MCP Server - Tools and resources via stdio/WebSocket");
    console.log("  ✅ AI Agents - Gemini and Groq integration");
    console.log("  ✅ LLM Router - Intelligent query routing");
    console.log("  ✅ Chatbot - Conversational AI with memory");
    console.log("\nNext Steps:");
    console.log(
      "  • Run individual tests: npm run api, npm run agent:gemini, etc."
    );
    console.log("  • Start the chatbot: npm run chatbot");
    console.log("  • Explore the code in src/ directory");
    console.log("  • Read the README.md for detailed documentation");
    console.log();
  } catch (error: any) {
    console.error("\n❌ Demo Failed:");
    console.error(`Error: ${error.message}`);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the demo
runDemo();
