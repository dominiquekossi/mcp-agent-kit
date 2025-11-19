/**
 * Gemini AI Agent for Library Management
 * Uses Google's Gemini Flash 2.0 model to interact with the library API
 */

import { createAgent } from "mcp-agent-kit";
import { api } from "mcp-agent-kit";
import dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

/**
 * Gemini Agent configured with library management tools
 */
export const geminiAgent = createAgent({
  provider: "gemini",
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  system: `You are a helpful library assistant. You can help users find books, 
get information about authors, and manage the library catalog. 
Always be friendly and provide detailed information when available.
When users ask about books or authors, use the available tools to search and retrieve information.
When adding books, make sure to get all necessary information from the user.`,
  tools: [
    {
      name: "search_books",
      description: "Search for books in the library by title or keyword",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query to find books by title",
          },
        },
        required: ["query"],
      },
      handler: async ({ query }) => {
        try {
          const response = await api.get(`${API_BASE_URL}/api/books`);
          const books = response.data;

          // Filter books by query
          const filteredBooks = books.filter(
            (book: any) =>
              book.title.toLowerCase().includes(query.toLowerCase()) ||
              (book.description &&
                book.description.toLowerCase().includes(query.toLowerCase()))
          );

          return {
            success: true,
            count: filteredBooks.length,
            books: filteredBooks,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Failed to search books",
          };
        }
      },
    },
    {
      name: "get_book_details",
      description: "Get detailed information about a specific book by its ID",
      parameters: {
        type: "object",
        properties: {
          bookId: {
            type: "number",
            description: "The unique ID of the book",
          },
        },
        required: ["bookId"],
      },
      handler: async ({ bookId }) => {
        try {
          const response = await api.get(`${API_BASE_URL}/api/books/${bookId}`);
          return {
            success: true,
            book: response.data,
          };
        } catch (error: any) {
          if (error.response?.status === 404) {
            return {
              success: false,
              error: `Book with ID ${bookId} not found`,
            };
          }
          return {
            success: false,
            error: error.message || "Failed to get book details",
          };
        }
      },
    },
    {
      name: "add_book",
      description: "Add a new book to the library catalog",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title of the book",
          },
          description: {
            type: "string",
            description: "A brief description of the book",
          },
          publishedYear: {
            type: "number",
            description: "The year the book was published",
          },
          authorId: {
            type: "number",
            description: "The ID of the author who wrote the book",
          },
        },
        required: ["title", "authorId"],
      },
      handler: async (params) => {
        try {
          const response = await api.post(`${API_BASE_URL}/api/books`, params);
          return {
            success: true,
            message: "Book added successfully",
            book: response.data,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Failed to add book",
          };
        }
      },
    },
    {
      name: "list_authors",
      description: "List all authors in the library",
      parameters: {
        type: "object",
        properties: {},
      },
      handler: async () => {
        try {
          const response = await api.get(`${API_BASE_URL}/api/authors`);
          return {
            success: true,
            count: response.data.length,
            authors: response.data,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Failed to list authors",
          };
        }
      },
    },
  ],
});
