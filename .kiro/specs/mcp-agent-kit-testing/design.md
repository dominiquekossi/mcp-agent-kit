# Design Document

## Overview

Este projeto demonstra o uso prático do pacote mcp-agent-kit através de uma aplicação real de livraria. A arquitetura consiste em três camadas principais:

1. **API REST Layer** - Express.js com Prisma ORM e SQLite para gerenciar livros e autores
2. **MCP Integration Layer** - MCP Server que expõe tools e resources via stdio e WebSocket
3. **AI Layer** - AI Agents (Gemini/Groq), LLM Router e Chatbot que interagem com a API

**Funcionalidades do mcp-agent-kit demonstradas:**
- ✅ AI Agents com múltiplos providers (Gemini, Groq)
- ✅ MCP Server com tools e resources
- ✅ MCP Server com stdio e WebSocket transport
- ✅ LLM Router para roteamento inteligente entre LLMs
- ✅ Chatbot com memória conversacional
- ✅ API Helpers para requisições HTTP com retry/timeout

O projeto serve como exemplo de referência para desenvolvedores que desejam integrar o mcp-agent-kit em aplicações reais.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Chatbot    │  │ Gemini Agent │  │  Groq Agent  │      │
│  │  (Memory)    │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                    MCP Integration Layer                      │
│                           │                                  │
│                  ┌────────▼────────┐                         │
│                  │   MCP Server    │                         │
│                  │  (mcp-agent-kit)│                         │
│                  └────────┬────────┘                         │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐          │
│    │ Books   │      │ Authors │      │ Search  │          │
│    │ Tools   │      │ Tools   │      │ Tools   │          │
│    └────┬────┘      └────┬────┘      └────┬────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────┐
│                      API REST Layer                          │
│         │                  │                  │              │
│    ┌────▼────────────────────────────────────▼────┐         │
│    │         Express.js REST API                  │         │
│    │  /api/books  |  /api/authors                 │         │
│    └────────────────────┬─────────────────────────┘         │
│                         │                                    │
│                    ┌────▼────┐                               │
│                    │ Prisma  │                               │
│                    │  ORM    │                               │
│                    └────┬────┘                               │
│                         │                                    │
│                    ┌────▼────┐                               │
│                    │ SQLite  │                               │
│                    │   DB    │                               │
│                    └─────────┘                               │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Layer (Prisma + SQLite)

**Schema Definition:**

```prisma
model Author {
  id        Int      @id @default(autoincrement())
  name      String
  bio       String?
  books     Book[]
  createdAt DateTime @default(now())
}

model Book {
  id            Int      @id @default(autoincrement())
  title         String
  description   String?
  publishedYear Int?
  authorId      Int
  author        Author   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt     DateTime @default(now())
}
```

**Prisma Client Interface:**

```typescript
// src/db/client.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export interface BookCreateInput {
  title: string;
  description?: string;
  publishedYear?: number;
  authorId: number;
}

export interface AuthorCreateInput {
  name: string;
  bio?: string;
}
```

### 2. API REST Layer (Express)

**API Routes:**

```typescript
// src/api/routes/books.ts
router.get('/api/books', listBooks);           // List all books
router.get('/api/books/:id', getBook);         // Get book by ID
router.post('/api/books', createBook);         // Create new book
router.put('/api/books/:id', updateBook);      // Update book
router.delete('/api/books/:id', deleteBook);   // Delete book

// src/api/routes/authors.ts
router.get('/api/authors', listAuthors);       // List all authors
router.get('/api/authors/:id', getAuthor);     // Get author by ID
router.get('/api/authors/:id/books', getAuthorBooks); // Get author's books
router.post('/api/authors', createAuthor);     // Create new author
router.put('/api/authors/:id', updateAuthor);  // Update author
router.delete('/api/authors/:id', deleteAuthor); // Delete author
```

**Controller Interface:**

```typescript
// src/api/controllers/books.controller.ts
export interface BookController {
  listBooks(req: Request, res: Response): Promise<void>;
  getBook(req: Request, res: Response): Promise<void>;
  createBook(req: Request, res: Response): Promise<void>;
  updateBook(req: Request, res: Response): Promise<void>;
  deleteBook(req: Request, res: Response): Promise<void>;
}
```

**Server Configuration:**

```typescript
// src/api/server.ts
import express from 'express';
import cors from 'cors';
import { bookRoutes } from './routes/books';
import { authorRoutes } from './routes/authors';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', bookRoutes);
app.use('/api', authorRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT);
```

### 3. MCP Server Layer

**MCP Server Configuration (stdio):**

```typescript
// src/mcp/server-stdio.ts
import { createMCPServer, api } from 'mcp-agent-kit';

const API_BASE_URL = 'http://localhost:3000/api';

const mcpServer = createMCPServer({
  name: 'library-mcp-server',
  version: '1.0.0',
  description: 'MCP Server for Library API',
  tools: [
    // Books tools
    {
      name: 'list_books',
      description: 'List all books in the library',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const response = await api.get(`${API_BASE_URL}/books`);
        return response.data;
      },
    },
    {
      name: 'get_book',
      description: 'Get a specific book by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Book ID' },
        },
        required: ['id'],
      },
      handler: async ({ id }) => {
        const response = await api.get(`${API_BASE_URL}/books/${id}`);
        return response.data;
      },
    },
    {
      name: 'create_book',
      description: 'Create a new book',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Book title' },
          description: { type: 'string', description: 'Book description' },
          publishedYear: { type: 'number', description: 'Year published' },
          authorId: { type: 'number', description: 'Author ID' },
        },
        required: ['title', 'authorId'],
      },
      handler: async (params) => {
        const response = await api.post(`${API_BASE_URL}/books`, params);
        return response.data;
      },
    },
    {
      name: 'update_book',
      description: 'Update an existing book',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Book ID' },
          title: { type: 'string', description: 'Book title' },
          description: { type: 'string', description: 'Book description' },
          publishedYear: { type: 'number', description: 'Year published' },
          authorId: { type: 'number', description: 'Author ID' },
        },
        required: ['id'],
      },
      handler: async ({ id, ...data }) => {
        const response = await api.put(`${API_BASE_URL}/books/${id}`, data);
        return response.data;
      },
    },
    {
      name: 'delete_book',
      description: 'Delete a book',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Book ID' },
        },
        required: ['id'],
      },
      handler: async ({ id }) => {
        const response = await api.delete(`${API_BASE_URL}/books/${id}`);
        return response.data;
      },
    },
    // Authors tools (similar structure)
    {
      name: 'list_authors',
      description: 'List all authors',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        const response = await api.get(`${API_BASE_URL}/authors`);
        return response.data;
      },
    },
    {
      name: 'create_author',
      description: 'Create a new author',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Author name' },
          bio: { type: 'string', description: 'Author biography' },
        },
        required: ['name'],
      },
      handler: async (params) => {
        const response = await api.post(`${API_BASE_URL}/authors`, params);
        return response.data;
      },
    },
    {
      name: 'get_author_books',
      description: 'Get all books by a specific author',
      inputSchema: {
        type: 'object',
        properties: {
          authorId: { type: 'number', description: 'Author ID' },
        },
        required: ['authorId'],
      },
      handler: async ({ authorId }) => {
        const response = await api.get(`${API_BASE_URL}/authors/${authorId}/books`);
        return response.data;
      },
    },
  ],
  resources: [
    {
      uri: 'library://stats',
      name: 'Library Statistics',
      description: 'Get current library statistics',
      mimeType: 'application/json',
      handler: async () => {
        const [books, authors] = await Promise.all([
          api.get(`${API_BASE_URL}/books`),
          api.get(`${API_BASE_URL}/authors`),
        ]);
        return JSON.stringify({
          totalBooks: books.data.length,
          totalAuthors: authors.data.length,
          timestamp: new Date().toISOString(),
        });
      },
    },
    {
      uri: 'library://catalog',
      name: 'Full Library Catalog',
      description: 'Get complete library catalog with all books and authors',
      mimeType: 'application/json',
      handler: async () => {
        const [books, authors] = await Promise.all([
          api.get(`${API_BASE_URL}/books`),
          api.get(`${API_BASE_URL}/authors`),
        ]);
        return JSON.stringify({ books: books.data, authors: authors.data });
      },
    },
  ],
});

// Start server in stdio mode (default)
await mcpServer.start();
```

**MCP Server with WebSocket:**

```typescript
// src/mcp/server-websocket.ts
import { createMCPServer } from 'mcp-agent-kit';

const mcpServerWS = createMCPServer({
  name: 'library-mcp-server-ws',
  port: 8080,
  tools: [/* same tools as stdio version */],
  resources: [/* same resources as stdio version */],
});

// Start server in WebSocket mode
await mcpServerWS.start('websocket');
console.log('MCP Server running on WebSocket at ws://localhost:8080');
```

### 4. AI Agents Layer

**Gemini Agent:**

```typescript
// src/agents/gemini-agent.ts
import { createAgent } from 'mcp-agent-kit';
import { api } from 'mcp-agent-kit';

const API_BASE_URL = 'http://localhost:3000/api';

export const geminiAgent = createAgent({
  provider: 'gemini',
  model: 'gemini-2.0-flash-exp',
  apiKey: process.env.GEMINI_API_KEY,
  system: `You are a helpful library assistant. You can help users find books, 
           get information about authors, and manage the library catalog. 
           Always be friendly and provide detailed information when available.`,
  tools: [
    {
      name: 'search_books',
      description: 'Search for books in the library',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
      handler: async ({ query }) => {
        const response = await api.get(`${API_BASE_URL}/books`);
        const books = response.data;
        return books.filter(book => 
          book.title.toLowerCase().includes(query.toLowerCase())
        );
      },
    },
    {
      name: 'get_book_details',
      description: 'Get detailed information about a specific book',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'number', description: 'Book ID' },
        },
        required: ['bookId'],
      },
      handler: async ({ bookId }) => {
        const response = await api.get(`${API_BASE_URL}/books/${bookId}`);
        return response.data;
      },
    },
    {
      name: 'add_book',
      description: 'Add a new book to the library',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          publishedYear: { type: 'number' },
          authorId: { type: 'number' },
        },
        required: ['title', 'authorId'],
      },
      handler: async (params) => {
        const response = await api.post(`${API_BASE_URL}/books`, params);
        return response.data;
      },
    },
    {
      name: 'list_authors',
      description: 'List all authors in the library',
      parameters: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const response = await api.get(`${API_BASE_URL}/authors`);
        return response.data;
      },
    },
  ],
});
```

**Groq Agent:**

```typescript
// src/agents/groq-agent.ts
import { createAgent } from 'mcp-agent-kit';

// Similar structure to Gemini agent but with Groq provider
export const groqAgent = createAgent({
  provider: 'groq',
  model: 'mixtral-8x7b-32768',
  apiKey: process.env.GROQ_API_KEY,
  system: `You are a helpful library assistant...`,
  tools: [/* same tools as Gemini agent */],
});
```

### 5. LLM Router Layer

**Router Configuration:**

```typescript
// src/router/llm-router.ts
import { createLLMRouter } from 'mcp-agent-kit';

export const libraryRouter = createLLMRouter({
  rules: [
    {
      // Use Gemini for quick queries (short inputs)
      when: (input) => input.length < 100,
      use: {
        provider: 'gemini',
        model: 'gemini-2.0-flash-exp',
        apiKey: process.env.GEMINI_API_KEY,
      },
    },
    {
      // Use Groq for complex queries or code-related questions
      when: (input) => 
        input.toLowerCase().includes('complex') ||
        input.toLowerCase().includes('detailed') ||
        input.toLowerCase().includes('explain'),
      use: {
        provider: 'groq',
        model: 'mixtral-8x7b-32768',
        apiKey: process.env.GROQ_API_KEY,
      },
    },
    {
      // Default to Gemini for all other queries
      default: true,
      use: {
        provider: 'gemini',
        model: 'gemini-2.0-flash-exp',
        apiKey: process.env.GEMINI_API_KEY,
      },
    },
  ],
  fallback: {
    provider: 'gemini',
    model: 'gemini-2.0-flash-exp',
    apiKey: process.env.GEMINI_API_KEY,
  },
  retryAttempts: 3,
  logLevel: 'info',
});

// Usage example
async function queryLibrary(userInput: string) {
  const response = await libraryRouter.route(userInput);
  console.log('Response:', response.content);
  
  // Get router statistics
  const stats = libraryRouter.getStats();
  console.log('Router stats:', stats);
  
  // List available agents
  const agents = libraryRouter.listAgents();
  console.log('Available agents:', agents);
}
```

### 6. Chatbot Layer

**Chatbot Configuration:**

```typescript
// src/chatbot/library-chatbot.ts
import { createChatbot } from 'mcp-agent-kit';
import { geminiAgent } from '../agents/gemini-agent';

export const libraryChatbot = createChatbot({
  agent: geminiAgent,
  system: `You are a friendly library assistant chatbot. You help users:
           - Find books and authors
           - Get recommendations
           - Add new books to the catalog
           - Answer questions about the library
           
           Always maintain context from previous messages and provide helpful,
           conversational responses.`,
  maxHistory: 20,
});

// Interactive CLI interface
export async function startChatSession() {
  console.log('Library Chatbot started! Type "exit" to quit.\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = () => {
    readline.question('You: ', async (input: string) => {
      if (input.toLowerCase() === 'exit') {
        console.log('Goodbye!');
        readline.close();
        return;
      }

      const response = await libraryChatbot.chat(input);
      console.log(`Bot: ${response.content}\n`);
      askQuestion();
    });
  };

  askQuestion();
}
```

**Chatbot with Router:**

```typescript
// src/chatbot/library-chatbot-router.ts
import { createChatbot } from 'mcp-agent-kit';
import { libraryRouter } from '../router/llm-router';

export const libraryChatbotWithRouter = createChatbot({
  router: libraryRouter,
  system: `You are a friendly library assistant chatbot...`,
  maxHistory: 20,
});

// This chatbot will automatically route queries to the best LLM
// based on the router rules (Gemini for quick queries, Groq for complex ones)
```

### 7. API Helpers Demonstration

**Using mcp-agent-kit API module:**

```typescript
// src/utils/api-client.ts
import { api } from 'mcp-agent-kit';

const API_BASE_URL = 'http://localhost:3000/api';

// Simple GET request
export async function getAllBooks() {
  const response = await api.get(`${API_BASE_URL}/books`);
  return response.data;
}

// POST request with body
export async function createBook(bookData: any) {
  const response = await api.post(
    `${API_BASE_URL}/books`,
    bookData,
    {
      name: 'create-book',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return response.data;
}

// Request with retry and timeout
export async function getBookWithRetry(bookId: number) {
  const response = await api.request({
    name: 'get-book-with-retry',
    url: `${API_BASE_URL}/books/${bookId}`,
    method: 'GET',
    timeout: 5000,      // 5 seconds timeout
    retries: 3,         // 3 retry attempts
  });
  return response.data;
}

// PUT request
export async function updateBook(bookId: number, updates: any) {
  const response = await api.put(
    `${API_BASE_URL}/books/${bookId}`,
    updates,
    { name: 'update-book' }
  );
  return response.data;
}

// DELETE request
export async function deleteBook(bookId: number) {
  const response = await api.delete(
    `${API_BASE_URL}/books/${bookId}`,
    { name: 'delete-book' }
  );
  return response.data;
}

// Request with query parameters
export async function searchBooks(query: string) {
  const response = await api.request({
    name: 'search-books',
    url: `${API_BASE_URL}/books`,
    method: 'GET',
    query: { search: query, limit: 10 },
  });
  return response.data;
}
```

## Data Models

### Book Model

```typescript
interface Book {
  id: number;
  title: string;
  description: string | null;
  publishedYear: number | null;
  authorId: number;
  author?: Author;
  createdAt: Date;
}
```

### Author Model

```typescript
interface Author {
  id: number;
  name: string;
  bio: string | null;
  books?: Book[];
  createdAt: Date;
}
```

### API Response Models

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

## Error Handling

### API Layer Error Handling

```typescript
// src/api/middleware/error-handler.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
  ) {
    super(message);
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  console.error('Unexpected error:', err);
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};
```

### MCP Server Error Handling

```typescript
// MCP tools should catch and format errors appropriately
handler: async (params) => {
  try {
    const response = await api.get(`${API_BASE_URL}/books/${params.id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return { error: 'Book not found' };
    }
    throw error;
  }
}
```

### Agent Error Handling

```typescript
// src/agents/utils/error-handler.ts
export async function safeAgentCall<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('Agent error:', error);
    return fallback;
  }
}
```

## Testing Strategy

### 1. Manual Testing Scripts

**Test API Endpoints:**

```typescript
// scripts/test-api.ts
async function testAPI() {
  console.log('Testing API endpoints...\n');
  
  // Test list books
  const books = await api.get('http://localhost:3000/api/books');
  console.log('✓ List books:', books.data.length, 'books found');
  
  // Test create book
  const newBook = await api.post('http://localhost:3000/api/books', {
    title: 'Test Book',
    authorId: 1,
  });
  console.log('✓ Create book:', newBook.data.title);
  
  // Test update book
  const updated = await api.put(`http://localhost:3000/api/books/${newBook.data.id}`, {
    title: 'Updated Test Book',
  });
  console.log('✓ Update book:', updated.data.title);
  
  // Test delete book
  await api.delete(`http://localhost:3000/api/books/${newBook.data.id}`);
  console.log('✓ Delete book: success');
}
```

**Test MCP Server:**

```typescript
// scripts/test-mcp.ts
async function testMCPServer() {
  console.log('Testing MCP Server tools...\n');
  
  // Start MCP server and test tools
  // This would typically be done through an MCP client
}
```

**Test AI Agents:**

```typescript
// scripts/test-agents.ts
async function testAgents() {
  console.log('Testing AI Agents...\n');
  
  // Test Gemini agent
  const geminiResponse = await geminiAgent.chat('List all books in the library');
  console.log('Gemini:', geminiResponse.content);
  
  // Test Groq agent
  const groqResponse = await groqAgent.chat('Who are the authors in the library?');
  console.log('Groq:', groqResponse.content);
}
```

### 2. Integration Testing

Test complete workflows:
- User asks chatbot about books → Agent uses tools → API returns data
- User requests to add a book → Agent creates book → Database updated
- User searches for author → Agent queries API → Returns author's books

### 3. Validation Testing

- Validate all API endpoints return correct status codes
- Validate MCP tools execute without errors
- Validate agents can successfully call all tools
- Validate chatbot maintains conversation context

## Configuration

### Environment Variables

```bash
# .env
# Database
DATABASE_URL="file:./dev.db"

# API
PORT=3000
API_BASE_URL="http://localhost:3000"

# LLM Providers
GEMINI_API_KEY="your-gemini-api-key"
GROQ_API_KEY="your-groq-api-key"

# Logging
LOG_LEVEL="info"
```

### Package Dependencies

```json
{
  "dependencies": {
    "mcp-agent-kit": "^1.0.0",
    "@prisma/client": "^5.0.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/node": "^20.0.0"
  }
}
```

## Project Structure

```
library-mcp-demo/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed data
│   └── dev.db                 # SQLite database
├── src/
│   ├── api/
│   │   ├── server.ts          # Express server
│   │   ├── routes/
│   │   │   ├── books.ts       # Book routes
│   │   │   └── authors.ts     # Author routes
│   │   ├── controllers/
│   │   │   ├── books.controller.ts
│   │   │   └── authors.controller.ts
│   │   └── middleware/
│   │       └── error-handler.ts
│   ├── mcp/
│   │   ├── server-stdio.ts    # MCP Server (stdio mode)
│   │   └── server-websocket.ts # MCP Server (WebSocket mode)
│   ├── agents/
│   │   ├── gemini-agent.ts    # Gemini agent
│   │   ├── groq-agent.ts      # Groq agent
│   │   └── utils/
│   │       └── error-handler.ts
│   ├── router/
│   │   └── llm-router.ts      # LLM Router configuration
│   ├── chatbot/
│   │   ├── library-chatbot.ts # Chatbot with single agent
│   │   └── library-chatbot-router.ts # Chatbot with router
│   ├── utils/
│   │   └── api-client.ts      # API helpers demonstration
│   └── db/
│       └── client.ts          # Prisma client
├── scripts/
│   ├── test-api.ts            # API testing script
│   ├── test-mcp.ts            # MCP testing script
│   ├── test-agents.ts         # Agents testing script
│   ├── test-router.ts         # Router testing script
│   └── demo-all.ts            # Complete demo script
├── .env                       # Environment variables
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Deployment Considerations

### Local Development

1. Install dependencies: `npm install`
2. Setup database: `npx prisma migrate dev`
3. Seed data: `npm run seed`
4. Start API: `npm run api`
5. Start MCP Server (stdio): `npm run mcp:stdio` (in separate terminal)
6. Start MCP Server (WebSocket): `npm run mcp:ws` (alternative)
7. Test agents: `npm run agent:gemini` or `npm run agent:groq`
8. Test router: `npm run router`
9. Start chatbot: `npm run chatbot`
10. Start chatbot with router: `npm run chatbot:router`
11. Run complete demo: `npm run demo`

### Production Considerations

- Use PostgreSQL instead of SQLite for production
- Add authentication/authorization to API endpoints
- Implement rate limiting for API and LLM calls
- Add comprehensive logging and monitoring
- Use environment-specific configurations
- Implement proper error tracking (e.g., Sentry)
- Add API documentation (e.g., Swagger/OpenAPI)

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Input Validation**: Validate all user inputs in API endpoints
3. **SQL Injection**: Use Prisma's parameterized queries (built-in protection)
4. **CORS**: Configure CORS appropriately for production
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Error Messages**: Don't expose sensitive information in error messages
