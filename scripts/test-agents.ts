/**
 * Test script for AI Agents (Gemini and Groq)
 * Demonstrates agent capabilities with library management tools
 */

import { geminiAgent } from "../src/agents/gemini-agent";
import { groqAgent } from "../src/agents/groq-agent";
import dotenv from "dotenv";

dotenv.config();

async function testAgent(agentName: string, agent: any) {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log(`║         ${agentName} Agent Test Suite                    ║`);
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  console.log(
    "⚠️  Make sure the API server is running on http://localhost:3000"
  );
  console.log("   Run: npm run api\n");

  try {
    // Test 1: List books query
    console.log("=".repeat(60));
    console.log("TEST 1: List Books Query");
    console.log("=".repeat(60));
    console.log('Query: "What books do we have in the library?"\n');
    const response1 = await agent.chat("What books do we have in the library?");
    console.log(`✅ ${agentName} Response:`);
    console.log(response1.content);
    console.log();

    // Wait a bit between queries
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 2: Search for specific book
    console.log("=".repeat(60));
    console.log("TEST 2: Search for Specific Book");
    console.log("=".repeat(60));
    console.log('Query: "Can you search for books about science?"\n');
    const response2 = await agent.chat(
      "Can you search for books about science?"
    );
    console.log(`✅ ${agentName} Response:`);
    console.log(response2.content);
    console.log();

    // Wait a bit between queries
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 3: List authors
    console.log("=".repeat(60));
    console.log("TEST 3: List Authors Query");
    console.log("=".repeat(60));
    console.log('Query: "Who are the authors in our library?"\n');
    const response3 = await agent.chat("Who are the authors in our library?");
    console.log(`✅ ${agentName} Response:`);
    console.log(response3.content);
    console.log();

    // Wait a bit between queries
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 4: Get book details
    console.log("=".repeat(60));
    console.log("TEST 4: Get Book Details");
    console.log("=".repeat(60));
    console.log('Query: "Can you tell me about book ID 1?"\n');
    const response4 = await agent.chat("Can you tell me about book ID 1?");
    console.log(`✅ ${agentName} Response:`);
    console.log(response4.content);
    console.log();

    // Summary
    console.log("=".repeat(60));
    console.log(`✅ ${agentName} Agent Tests Completed Successfully!`);
    console.log("=".repeat(60));
    console.log("\nAgent Capabilities Demonstrated:");
    console.log("  ✓ Natural language understanding");
    console.log(
      "  ✓ Tool calling (search_books, list_authors, get_book_details)"
    );
    console.log("  ✓ Contextual responses");
    console.log("  ✓ Library management assistance");
    console.log("\nAgent Configuration:");
    console.log(`  Provider: ${agentName === "Gemini" ? "gemini" : "groq"}`);
    console.log(
      `  Model: ${
        agentName === "Gemini"
          ? "gemini-2.0-flash-exp"
          : "llama-3.3-70b-versatile"
      }`
    );
    console.log(
      "  Tools: search_books, get_book_details, add_book, list_authors"
    );
    console.log();
  } catch (error: any) {
    console.error(`\n❌ ${agentName} Agent Test Failed:`);
    console.error(`Error: ${error.message}`);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    if (error.code === "ECONNREFUSED") {
      console.error(
        "\n⚠️  Connection refused. Make sure the API server is running:"
      );
      console.error("   npm run api");
    }
    if (error.message?.includes("API key")) {
      console.error(
        `\n⚠️  API key issue. Make sure ${agentName.toUpperCase()}_API_KEY is set in .env file`
      );
    }
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const agentType = args[0]?.toLowerCase();

  if (!agentType || !["gemini", "groq"].includes(agentType)) {
    console.log("Usage: npm run agent:gemini  OR  npm run agent:groq");
    console.log("\nOr run directly:");
    console.log("  ts-node scripts/test-agents.ts gemini");
    console.log("  ts-node scripts/test-agents.ts groq");
    process.exit(1);
  }

  if (agentType === "gemini") {
    if (!process.env.GEMINI_API_KEY) {
      console.error(
        "❌ Error: GEMINI_API_KEY not found in environment variables"
      );
      console.error("Please set GEMINI_API_KEY in your .env file");
      process.exit(1);
    }
    await testAgent("Gemini", geminiAgent);
  } else if (agentType === "groq") {
    if (!process.env.GROQ_API_KEY) {
      console.error(
        "❌ Error: GROQ_API_KEY not found in environment variables"
      );
      console.error("Please set GROQ_API_KEY in your .env file");
      process.exit(1);
    }
    await testAgent("Groq", groqAgent);
  }
}

// Run the test
main();
