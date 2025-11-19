/**
 * API Client Module
 *
 * Demonstrates the use of mcp-agent-kit API helpers for making HTTP requests
 * with features like retry, timeout, and query parameters.
 */

import { api } from "mcp-agent-kit";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

/**
 * Get all books from the library
 * Demonstrates: api.get() for simple GET requests
 */
export async function getAllBooks() {
  const response = await api.get(`${API_BASE_URL}/books`);
  return response.data;
}

/**
 * Create a new book in the library
 * Demonstrates: api.post() for POST requests with body
 */
export async function createBook(bookData: {
  title: string;
  description?: string;
  publishedYear?: number;
  authorId: number;
}) {
  const response = await api.post(`${API_BASE_URL}/books`, bookData, {
    name: "create-book",
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

/**
 * Get a book by ID with retry and timeout configuration
 * Demonstrates: api.request() with timeout and retry options
 */
export async function getBookWithRetry(bookId: number) {
  const response = await api.request({
    name: "get-book-with-retry",
    url: `${API_BASE_URL}/books/${bookId}`,
    method: "GET",
    timeout: 5000, // 5 seconds timeout
    retries: 3, // 3 retry attempts
  });
  return response.data;
}

/**
 * Update an existing book
 * Demonstrates: api.put() for PUT requests
 */
export async function updateBook(
  bookId: number,
  updates: {
    title?: string;
    description?: string;
    publishedYear?: number;
    authorId?: number;
  }
) {
  const response = await api.put(`${API_BASE_URL}/books/${bookId}`, updates, {
    name: "update-book",
  });
  return response.data;
}

/**
 * Delete a book from the library
 * Demonstrates: api.delete() for DELETE requests
 */
export async function deleteBook(bookId: number) {
  const response = await api.delete(`${API_BASE_URL}/books/${bookId}`, {
    name: "delete-book",
  });
  return response.data;
}

/**
 * Search books with query parameters
 * Demonstrates: api.request() with query parameters
 */
export async function searchBooks(query: string, limit: number = 10) {
  const response = await api.request({
    name: "search-books",
    url: `${API_BASE_URL}/books`,
    method: "GET",
    query: { search: query, limit: limit },
  });
  return response.data;
}

/**
 * Get all authors from the library
 * Additional helper function for completeness
 */
export async function getAllAuthors() {
  const response = await api.get(`${API_BASE_URL}/authors`);
  return response.data;
}

/**
 * Get books by a specific author
 * Additional helper function demonstrating path parameters
 */
export async function getAuthorBooks(authorId: number) {
  const response = await api.get(`${API_BASE_URL}/authors/${authorId}/books`);
  return response.data;
}
