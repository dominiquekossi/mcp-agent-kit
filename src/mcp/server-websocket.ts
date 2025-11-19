import { createMCPServer, api } from "mcp-agent-kit";
import * as dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const MCP_SERVER_PORT = parseInt(process.env.MCP_SERVER_PORT || "8080", 10);

const mcpServerWS = createMCPServer({
  name: "library-mcp-server-ws",
  version: "1.0.0",
  description:
    "MCP Server for Library API (WebSocket) - provides tools to manage books and authors",
  port: MCP_SERVER_PORT,
  tools: [
    // ==================== BOOKS TOOLS ====================
    {
      name: "list_books",
      description: "List all books in the library",
      inputSchema: {
        type: "object",
        properties: {},
      },
      handler: async () => {
        try {
          const response = await api.get(`${API_BASE_URL}/api/books`);
          return {
            success: true,
            books: response.data,
            count: response.data.length,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Failed to list books",
          };
        }
      },
    },
    {
      name: "get_book",
      description: "Get a specific book by ID",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "number",
            description: "Book ID",
          },
        },
        required: ["id"],
      },
      handler: async ({ id }: { id: number }) => {
        try {
          const response = await api.get(`${API_BASE_URL}/api/books/${id}`);
          return {
            success: true,
            book: response.data,
          };
        } catch (error: any) {
          if (error.response?.status === 404) {
            return {
              success: false,
              error: `Book with ID ${id} not found`,
            };
          }
          return {
            success: false,
            error: error.message || "Failed to get book",
          };
        }
      },
    },
    {
      name: "create_book",
      description: "Create a new book in the library",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Book title",
          },
          description: {
            type: "string",
            description: "Book description",
          },
          publishedYear: {
            type: "number",
            description: "Year the book was published",
          },
          authorId: {
            type: "number",
            description: "ID of the author",
          },
        },
        required: ["title", "authorId"],
      },
      handler: async (params: {
        title: string;
        description?: string;
        publishedYear?: number;
        authorId: number;
      }) => {
        try {
          const response = await api.post(`${API_BASE_URL}/api/books`, params);
          return {
            success: true,
            book: response.data,
            message: "Book created successfully",
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Failed to create book",
          };
        }
      },
    },
    {
      name: "update_book",
      description: "Update an existing book",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "number",
            description: "Book ID",
          },
          title: {
            type: "string",
            description: "Book title",
          },
          description: {
            type: "string",
            description: "Book description",
          },
          publishedYear: {
            type: "number",
            description: "Year the book was published",
          },
          authorId: {
            type: "number",
            description: "ID of the author",
          },
        },
        required: ["id"],
      },
      handler: async ({
        id,
        ...data
      }: {
        id: number;
        title?: string;
        description?: string;
        publishedYear?: number;
        authorId?: number;
      }) => {
        try {
          const response = await api.put(
            `${API_BASE_URL}/api/books/${id}`,
            data
          );
          return {
            success: true,
            book: response.data,
            message: "Book updated successfully",
          };
        } catch (error: any) {
          if (error.response?.status === 404) {
            return {
              success: false,
              error: `Book with ID ${id} not found`,
            };
          }
          return {
            success: false,
            error: error.message || "Failed to update book",
          };
        }
      },
    },
    {
      name: "delete_book",
      description: "Delete a book from the library",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "number",
            description: "Book ID",
          },
        },
        required: ["id"],
      },
      handler: async ({ id }: { id: number }) => {
        try {
          await api.delete(`${API_BASE_URL}/api/books/${id}`);
          return {
            success: true,
            message: `Book with ID ${id} deleted successfully`,
          };
        } catch (error: any) {
          if (error.response?.status === 404) {
            return {
              success: false,
              error: `Book with ID ${id} not found`,
            };
          }
          return {
            success: false,
            error: error.message || "Failed to delete book",
          };
        }
      },
    },

    // ==================== AUTHORS TOOLS ====================
    {
      name: "list_authors",
      description: "List all authors in the library",
      inputSchema: {
        type: "object",
        properties: {},
      },
      handler: async () => {
        try {
          const response = await api.get(`${API_BASE_URL}/api/authors`);
          return {
            success: true,
            authors: response.data,
            count: response.data.length,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Failed to list authors",
          };
        }
      },
    },
    {
      name: "create_author",
      description: "Create a new author in the library",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Author name",
          },
          bio: {
            type: "string",
            description: "Author biography",
          },
        },
        required: ["name"],
      },
      handler: async (params: { name: string; bio?: string }) => {
        try {
          const response = await api.post(
            `${API_BASE_URL}/api/authors`,
            params
          );
          return {
            success: true,
            author: response.data,
            message: "Author created successfully",
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Failed to create author",
          };
        }
      },
    },
    {
      name: "get_author_books",
      description: "Get all books by a specific author",
      inputSchema: {
        type: "object",
        properties: {
          authorId: {
            type: "number",
            description: "Author ID",
          },
        },
        required: ["authorId"],
      },
      handler: async ({ authorId }: { authorId: number }) => {
        try {
          const response = await api.get(
            `${API_BASE_URL}/api/authors/${authorId}/books`
          );
          return {
            success: true,
            books: response.data,
            count: response.data.length,
          };
        } catch (error: any) {
          if (error.response?.status === 404) {
            return {
              success: false,
              error: `Author with ID ${authorId} not found`,
            };
          }
          return {
            success: false,
            error: error.message || "Failed to get author books",
          };
        }
      },
    },
  ],
  resources: [
    {
      uri: "library://stats",
      name: "Library Statistics",
      description:
        "Get current library statistics including total books and authors",
      mimeType: "application/json",
      handler: async () => {
        try {
          const [booksResponse, authorsResponse] = await Promise.all([
            api.get(`${API_BASE_URL}/api/books`),
            api.get(`${API_BASE_URL}/api/authors`),
          ]);

          const stats = {
            totalBooks: booksResponse.data.length,
            totalAuthors: authorsResponse.data.length,
            timestamp: new Date().toISOString(),
            status: "active",
          };

          return JSON.stringify(stats, null, 2);
        } catch (error: any) {
          return JSON.stringify(
            {
              error: error.message || "Failed to fetch library statistics",
              timestamp: new Date().toISOString(),
            },
            null,
            2
          );
        }
      },
    },
    {
      uri: "library://catalog",
      name: "Full Library Catalog",
      description: "Get complete library catalog with all books and authors",
      mimeType: "application/json",
      handler: async () => {
        try {
          const [booksResponse, authorsResponse] = await Promise.all([
            api.get(`${API_BASE_URL}/api/books`),
            api.get(`${API_BASE_URL}/api/authors`),
          ]);

          const catalog = {
            books: booksResponse.data,
            authors: authorsResponse.data,
            metadata: {
              totalBooks: booksResponse.data.length,
              totalAuthors: authorsResponse.data.length,
              generatedAt: new Date().toISOString(),
            },
          };

          return JSON.stringify(catalog, null, 2);
        } catch (error: any) {
          return JSON.stringify(
            {
              error: error.message || "Failed to fetch library catalog",
              timestamp: new Date().toISOString(),
            },
            null,
            2
          );
        }
      },
    },
  ],
});

// Start the MCP server in WebSocket mode
async function startServer() {
  try {
    console.log("Starting Library MCP Server (WebSocket mode)...");
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`WebSocket Port: ${MCP_SERVER_PORT}`);
    console.log(`WebSocket URL: ws://localhost:${MCP_SERVER_PORT}`);
    console.log("Server ready. Waiting for WebSocket connections...\n");

    await mcpServerWS.start("websocket");
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}

startServer();
