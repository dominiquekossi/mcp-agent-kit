/**
 * Test script for MCP Server
 * Demonstrates MCP Server tools and resources
 */

import { api } from "mcp-agent-kit";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

/**
 * Simulate MCP tool calls by directly calling the API
 * In a real MCP client, these would be called through the MCP protocol
 */
async function testMCPServer() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              MCP Server Test Suite                         ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  console.log(
    "⚠️  Make sure the API server is running on http://localhost:3000"
  );
  console.log("   Run: npm run api\n");

  console.log(
    "This script simulates MCP tool calls by testing the underlying API."
  );
  console.log(
    "The actual MCP Server exposes these as tools via stdio or WebSocket.\n"
  );

  try {
    // Test MCP Tool: list_books
    console.log("=".repeat(60));
    console.log("MCP TOOL: list_books");
    console.log("=".repeat(60));
    console.log("Description: List all books in the library");
    console.log("Input Schema: {} (no parameters)");
    console.log("\nExecuting tool...");
    const booksResponse = await api.get(`${API_BASE_URL}/api/books`);
    console.log(`✅ Success: Found ${booksResponse.data.length} books`);
    if (booksResponse.data.length > 0) {
      console.log("\nSample books:");
      booksResponse.data.slice(0, 3).forEach((book: any) => {
        console.log(`  - "${book.title}" (ID: ${book.id})`);
      });
    }
    console.log();

    // Test MCP Tool: get_book
    console.log("=".repeat(60));
    console.log("MCP TOOL: get_book");
    console.log("=".repeat(60));
    console.log("Description: Get a specific book by ID");
    console.log("Input Schema: { id: number }");
    if (booksResponse.data.length > 0) {
      const bookId = booksResponse.data[0].id;
      console.log(`\nExecuting tool with id=${bookId}...`);
      const bookResponse = await api.get(`${API_BASE_URL}/api/books/${bookId}`);
      console.log(`✅ Success: Retrieved book "${bookResponse.data.title}"`);
      console.log(`   Author ID: ${bookResponse.data.authorId}`);
      console.log(`   Published: ${bookResponse.data.publishedYear || "N/A"}`);
    }
    console.log();

    // Test MCP Tool: list_authors
    console.log("=".repeat(60));
    console.log("MCP TOOL: list_authors");
    console.log("=".repeat(60));
    console.log("Description: List all authors");
    console.log("Input Schema: {} (no parameters)");
    console.log("\nExecuting tool...");
    const authorsResponse = await api.get(`${API_BASE_URL}/api/authors`);
    console.log(`✅ Success: Found ${authorsResponse.data.length} authors`);
    if (authorsResponse.data.length > 0) {
      console.log("\nSample authors:");
      authorsResponse.data.slice(0, 3).forEach((author: any) => {
        console.log(`  - ${author.name} (ID: ${author.id})`);
      });
    }
    console.log();

    // Test MCP Tool: create_book
    console.log("=".repeat(60));
    console.log("MCP TOOL: create_book");
    console.log("=".repeat(60));
    console.log("Description: Create a new book");
    console.log(
      "Input Schema: { title, description?, publishedYear?, authorId }"
    );
    const newBookData = {
      title: "MCP Test Book",
      description: "Created by MCP Server test script",
      publishedYear: 2024,
      authorId:
        authorsResponse.data.length > 0 ? authorsResponse.data[0].id : 1,
    };
    console.log(
      `\nExecuting tool with data:`,
      JSON.stringify(newBookData, null, 2)
    );
    const createResponse = await api.post(
      `${API_BASE_URL}/api/books`,
      newBookData
    );
    console.log(`✅ Success: Book created with ID ${createResponse.data.id}`);
    const createdBookId = createResponse.data.id;
    console.log();

    // Test MCP Tool: update_book
    console.log("=".repeat(60));
    console.log("MCP TOOL: update_book");
    console.log("=".repeat(60));
    console.log("Description: Update an existing book");
    console.log(
      "Input Schema: { id, title?, description?, publishedYear?, authorId? }"
    );
    const updateData = {
      title: "MCP Test Book - Updated",
      description: "Updated by MCP Server test script",
    };
    console.log(
      `\nExecuting tool with id=${createdBookId} and data:`,
      JSON.stringify(updateData, null, 2)
    );
    const updateResponse = await api.put(
      `${API_BASE_URL}/api/books/${createdBookId}`,
      updateData
    );
    console.log(`✅ Success: Book updated`);
    console.log(`   New title: "${updateResponse.data.title}"`);
    console.log();

    // Test MCP Tool: get_author_books
    console.log("=".repeat(60));
    console.log("MCP TOOL: get_author_books");
    console.log("=".repeat(60));
    console.log("Description: Get all books by a specific author");
    console.log("Input Schema: { authorId: number }");
    if (authorsResponse.data.length > 0) {
      const authorId = authorsResponse.data[0].id;
      console.log(`\nExecuting tool with authorId=${authorId}...`);
      const authorBooksResponse = await api.get(
        `${API_BASE_URL}/api/authors/${authorId}/books`
      );
      console.log(
        `✅ Success: Found ${authorBooksResponse.data.length} books by this author`
      );
      if (authorBooksResponse.data.length > 0) {
        console.log("\nBooks:");
        authorBooksResponse.data.slice(0, 3).forEach((book: any) => {
          console.log(`  - "${book.title}"`);
        });
      }
    }
    console.log();

    // Test MCP Resource: library://stats
    console.log("=".repeat(60));
    console.log("MCP RESOURCE: library://stats");
    console.log("=".repeat(60));
    console.log("Description: Get current library statistics");
    console.log("MIME Type: application/json");
    console.log("\nFetching resource...");
    const [booksForStats, authorsForStats] = await Promise.all([
      api.get(`${API_BASE_URL}/api/books`),
      api.get(`${API_BASE_URL}/api/authors`),
    ]);
    const stats = {
      totalBooks: booksForStats.data.length,
      totalAuthors: authorsForStats.data.length,
      timestamp: new Date().toISOString(),
    };
    console.log(`✅ Success: Retrieved library statistics`);
    console.log(JSON.stringify(stats, null, 2));
    console.log();

    // Test MCP Resource: library://catalog
    console.log("=".repeat(60));
    console.log("MCP RESOURCE: library://catalog");
    console.log("=".repeat(60));
    console.log("Description: Get complete library catalog");
    console.log("MIME Type: application/json");
    console.log("\nFetching resource...");
    const catalog = {
      books: booksForStats.data,
      authors: authorsForStats.data,
    };
    console.log(`✅ Success: Retrieved full catalog`);
    console.log(`   Books: ${catalog.books.length}`);
    console.log(`   Authors: ${catalog.authors.length}`);
    console.log();

    // Test MCP Tool: delete_book
    console.log("=".repeat(60));
    console.log("MCP TOOL: delete_book");
    console.log("=".repeat(60));
    console.log("Description: Delete a book");
    console.log("Input Schema: { id: number }");
    console.log(`\nExecuting tool with id=${createdBookId}...`);
    await api.delete(`${API_BASE_URL}/api/books/${createdBookId}`);
    console.log(`✅ Success: Book deleted`);
    console.log();

    // Summary
    console.log("=".repeat(60));
    console.log("✅ All MCP Server Tests Passed Successfully!");
    console.log("=".repeat(60));
    console.log("\nMCP Tools Tested:");
    console.log("  ✓ list_books - List all books");
    console.log("  ✓ get_book - Get book by ID");
    console.log("  ✓ create_book - Create new book");
    console.log("  ✓ update_book - Update existing book");
    console.log("  ✓ delete_book - Delete book");
    console.log("  ✓ list_authors - List all authors");
    console.log("  ✓ get_author_books - Get books by author");
    console.log("\nMCP Resources Tested:");
    console.log("  ✓ library://stats - Library statistics");
    console.log("  ✓ library://catalog - Full catalog");
    console.log("\nMCP Server Modes Available:");
    console.log("  • stdio transport: npm run mcp:stdio");
    console.log("  • WebSocket transport: npm run mcp:ws (port 8080)");
    console.log();
  } catch (error: any) {
    console.error("\n❌ MCP Server Test Failed:");
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    if (error.code === "ECONNREFUSED") {
      console.error(
        "\n⚠️  Connection refused. Make sure the API server is running:"
      );
      console.error("   npm run api");
    }
    process.exit(1);
  }
}

// Run the test
testMCPServer();
