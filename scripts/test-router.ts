/**
 * Test script for LLM Router
 * Demonstrates intelligent routing between Gemini and Groq based on query characteristics
 */

import { queryLibrary } from "../src/router/llm-router";

async function testRouter() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         LLM Router Demo - Library Management              ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  console.log(
    "This demo shows how the LLM Router intelligently routes queries:"
  );
  console.log("  • Short queries (< 100 chars) → Gemini");
  console.log("  • Complex/detailed queries → Groq");
  console.log("  • Default → Gemini\n");

  try {
    // Test 1: Short query (should route to Gemini)
    console.log("\n" + "=".repeat(60));
    console.log("TEST 1: Short Query (Expected: Gemini)");
    console.log("=".repeat(60));
    await queryLibrary("List all books");

    // Wait a bit between queries
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 2: Complex query (should route to Groq)
    console.log("\n" + "=".repeat(60));
    console.log("TEST 2: Complex Query (Expected: Groq)");
    console.log("=".repeat(60));
    await queryLibrary(
      "Can you explain in detail the relationship between authors and books in our library system?"
    );

    // Wait a bit between queries
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 3: Medium query with "detailed" keyword (should route to Groq)
    console.log("\n" + "=".repeat(60));
    console.log("TEST 3: Query with 'detailed' keyword (Expected: Groq)");
    console.log("=".repeat(60));
    await queryLibrary("Give me a detailed overview of all authors");

    // Wait a bit between queries
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 4: Default routing (should route to Gemini)
    console.log("\n" + "=".repeat(60));
    console.log("TEST 4: Default Routing (Expected: Gemini)");
    console.log("=".repeat(60));
    await queryLibrary(
      "What books do we have in the library about science fiction?"
    );

    console.log("\n" + "=".repeat(60));
    console.log("✅ Router Demo Completed Successfully!");
    console.log("=".repeat(60) + "\n");
  } catch (error: any) {
    console.error("\n❌ Router Demo Failed:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testRouter();
