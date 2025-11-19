/**
 * Test script for Library API endpoints
 * Tests all CRUD operations for books and authors
 */

import {
  getAllBooks,
  createBook,
  updateBook,
  deleteBook,
  getAllAuthors,
  getAuthorBooks,
  getBookWithRetry,
} from "../src/utils/api-client";

async function testAPI() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              Library API Test Suite                       ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  console.log(
    "⚠️  Make sure the API server is running on http://localhost:3000"
  );
  console.log("   Run: npm run api\n");

  try {
    // Test 1: List all books
    console.log("=".repeat(60));
    console.log("TEST 1: List All Books (GET /api/books)");
    console.log("=".repeat(60));
    const books = await getAllBooks();
    console.log(`✅ Success: Found ${books.length} books`);
    if (books.length > 0) {
      console.log(
        `   First book: "${books[0].title}" by Author ID ${books[0].authorId}`
      );
    }
    console.log();

    // Test 2: List all authors
    console.log("=".repeat(60));
    console.log("TEST 2: List All Authors (GET /api/authors)");
    console.log("=".repeat(60));
    const authors = await getAllAuthors();
    console.log(`✅ Success: Found ${authors.length} authors`);
    if (authors.length > 0) {
      console.log(`   First author: "${authors[0].name}"`);
    }
    console.log();

    // Test 3: Create a new book
    console.log("=".repeat(60));
    console.log("TEST 3: Create New Book (POST /api/books)");
    console.log("=".repeat(60));
    const newBookData = {
      title: "Test Book - API Demo",
      description: "A test book created by the API test script",
      publishedYear: 2024,
      authorId: authors.length > 0 ? authors[0].id : 1,
    };
    console.log(`Creating book: "${newBookData.title}"`);
    const newBook = await createBook(newBookData);
    console.log(`✅ Success: Book created with ID ${newBook.id}`);
    console.log(`   Title: "${newBook.title}"`);
    console.log(`   Author ID: ${newBook.authorId}`);
    console.log();

    // Test 4: Get book with retry (demonstrates retry/timeout features)
    console.log("=".repeat(60));
    console.log("TEST 4: Get Book with Retry (GET /api/books/:id)");
    console.log("=".repeat(60));
    console.log(`Fetching book ID ${newBook.id} with retry enabled...`);
    const fetchedBook = await getBookWithRetry(newBook.id);
    console.log(`✅ Success: Retrieved book "${fetchedBook.title}"`);
    console.log();

    // Test 5: Update the book
    console.log("=".repeat(60));
    console.log("TEST 5: Update Book (PUT /api/books/:id)");
    console.log("=".repeat(60));
    const updates = {
      title: "Test Book - Updated Title",
      description: "This book has been updated by the test script",
    };
    console.log(`Updating book ID ${newBook.id}...`);
    const updatedBook = await updateBook(newBook.id, updates);
    console.log(`✅ Success: Book updated`);
    console.log(`   New title: "${updatedBook.title}"`);
    console.log(`   New description: "${updatedBook.description}"`);
    console.log();

    // Test 6: Get author's books
    console.log("=".repeat(60));
    console.log("TEST 6: Get Author's Books (GET /api/authors/:id/books)");
    console.log("=".repeat(60));
    const authorId = authors.length > 0 ? authors[0].id : 1;
    console.log(`Fetching books by author ID ${authorId}...`);
    const authorBooks = await getAuthorBooks(authorId);
    console.log(`✅ Success: Found ${authorBooks.length} books by this author`);
    if (authorBooks.length > 0) {
      console.log(
        `   Books: ${authorBooks.map((b: any) => `"${b.title}"`).join(", ")}`
      );
    }
    console.log();

    // Test 7: Delete the test book
    console.log("=".repeat(60));
    console.log("TEST 7: Delete Book (DELETE /api/books/:id)");
    console.log("=".repeat(60));
    console.log(`Deleting book ID ${newBook.id}...`);
    await deleteBook(newBook.id);
    console.log(`✅ Success: Book deleted`);
    console.log();

    // Summary
    console.log("=".repeat(60));
    console.log("✅ All API Tests Passed Successfully!");
    console.log("=".repeat(60));
    console.log("\nAPI Endpoints Tested:");
    console.log("  ✓ GET    /api/books");
    console.log("  ✓ GET    /api/books/:id");
    console.log("  ✓ POST   /api/books");
    console.log("  ✓ PUT    /api/books/:id");
    console.log("  ✓ DELETE /api/books/:id");
    console.log("  ✓ GET    /api/authors");
    console.log("  ✓ GET    /api/authors/:id/books");
    console.log("\nmcp-agent-kit API Features Demonstrated:");
    console.log("  ✓ api.get() - Simple GET requests");
    console.log("  ✓ api.post() - POST requests with body");
    console.log("  ✓ api.put() - PUT requests for updates");
    console.log("  ✓ api.delete() - DELETE requests");
    console.log("  ✓ api.request() - Advanced requests with retry/timeout");
    console.log();
  } catch (error: any) {
    console.error("\n❌ API Test Failed:");
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
testAPI();
