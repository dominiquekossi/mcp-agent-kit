# Library MCP Demo - mcp-agent-kit Testing Project

> A complete demonstration of mcp-agent-kit features through a real-world library management application

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748.svg)](https://www.prisma.io/)

This project is a comprehensive demonstration of the **mcp-agent-kit** package, showcasing all its features through a functional library management system. It includes a REST API, MCP Server, AI Agents, LLM Router, and Chatbots working together to manage books and authors.

## 🎯 Project Overview

This application demonstrates:

- 🔌 **MCP Server** with stdio and WebSocket transports
- 🤖 **AI Agents** using Gemini and Groq providers
- 🧠 **LLM Router** for intelligent routing between models
- 💬 **Chatbots** with conversation memory
- 🌐 **API Helpers** with retry and timeout capabilities
- 📚 **REST API** with Express and Prisma ORM
- 🗄️ **SQLite Database** for data persistence

## 🏗️ Architecture

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
│                  ┌────────▼────────┐                         │
│                  │   MCP Server    │                         │
│                  │  (mcp-agent-kit)│                         │
│                  └────────┬────────┘                         │
│         ┌─────────────────┼─────────────────┐               │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐          │
│    │ Books   │      │ Authors │      │Resources│          │
│    │ Tools   │      │ Tools   │      │         │          │
│    └────┬────┘      └────┬────┘      └────┬────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────┐
│                      API REST Layer                          │
│    ┌────▼────────────────────────────────────▼────┐         │
│    │         Express.js REST API                  │         │
│    │  /api/books  |  /api/authors                 │         │
│    └────────────────────┬─────────────────────────┘         │
│                    ┌────▼────┐                               │
│                    │ Prisma  │                               │
│                    │  ORM    │                               │
│                    └────┬────┘                               │
│                    ┌────▼────┐                               │
│                    │ SQLite  │                               │
│                    └─────────┘                               │
└──────────────────────────────────────────────────────────────┘
```

## ✨ mcp-agent-kit Features Demonstrated

This project showcases ALL major features of mcp-agent-kit:

- ✅ **AI Agents** with multiple providers (Gemini Flash 2.0, Groq)
- ✅ **MCP Server** with tools and resources
- ✅ **MCP Server** with stdio transport (default)
- ✅ **MCP Server** with WebSocket transport
- ✅ **LLM Router** for intelligent routing between LLMs
- ✅ **Chatbot** with conversation memory
- ✅ **Chatbot** with router integration
- ✅ **API Helpers** for HTTP requests with retry/timeout
- ✅ **Tool Registration** for function calling
- ✅ **Resource Registration** for data exposure

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- API keys for:
  - **Gemini API** (get from [Google AI Studio](https://makersuite.google.com/app/apikey))
  - **Groq API** (get from [Groq Console](https://console.groq.com/))

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or navigate to the project
cd library-mcp-demo

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your API keys:

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# API Configuration
PORT=3000
API_BASE_URL="http://localhost:3000"

# LLM Provider API Keys
GEMINI_API_KEY="your-gemini-api-key-here"
GROQ_API_KEY="your-groq-api-key-here"

# Logging
LOG_LEVEL="info"
```

### 3. Database Setup

```bash
# Run Prisma migrations to create the database
npx prisma migrate dev --name init

# Seed the database with sample data
npm run seed
```

This will create a SQLite database with sample books and authors.

### 4. Start the API Server

```bash
# Start the Express REST API
npm run api
```

The API will be available at `http://localhost:3000`

### 5. Try the Components

Open new terminal windows for each component:

```bash
# Test the MCP Server (stdio mode)
npm run mcp:stdio

# Test the MCP Server (WebSocket mode)
npm run mcp:ws

# Test the Gemini Agent
npm run agent:gemini

# Test the Groq Agent
npm run agent:groq

# Test the LLM Router
npm run router

# Start the Chatbot (single agent)
npm run chatbot

# Start the Chatbot with Router
npm run chatbot:router

# Run complete demonstration
npm run demo
```

## 📚 Project Structure

```
library-mcp-demo/
├── prisma/
│   ├── schema.prisma          # Database schema (Book, Author models)
│   ├── seed.ts                # Sample data seeding script
│   ├── migrations/            # Database migrations
│   └── dev.db                 # SQLite database file
├── src/
│   ├── api/                   # REST API Layer
│   │   ├── server.ts          # Express server setup
│   │   ├── routes/
│   │   │   ├── books.ts       # Book endpoints
│   │   │   └── authors.ts     # Author endpoints
│   │   ├── controllers/
│   │   │   ├── books.controller.ts
│   │   │   └── authors.controller.ts
│   │   └── middleware/
│   │       └── error-handler.ts
│   ├── mcp/                   # MCP Server Layer
│   │   ├── server-stdio.ts    # MCP Server (stdio transport)
│   │   └── server-websocket.ts # MCP Server (WebSocket transport)
│   ├── agents/                # AI Agents Layer
│   │   ├── gemini-agent.ts    # Gemini Flash 2.0 agent
│   │   ├── groq-agent.ts      # Groq agent
│   │   └── utils/
│   │       └── error-handler.ts
│   ├── router/                # LLM Router Layer
│   │   └── llm-router.ts      # Intelligent routing configuration
│   ├── chatbot/               # Chatbot Layer
│   │   ├── library-chatbot.ts # Chatbot with single agent
│   │   └── library-chatbot-router.ts # Chatbot with router
│   ├── utils/                 # Utilities
│   │   └── api-client.ts      # API helpers demonstration
│   └── db/
│       └── client.ts          # Prisma client instance
├── scripts/                   # Demo & Test Scripts
│   ├── test-api.ts            # Test REST API endpoints
│   ├── test-mcp.ts            # Test MCP Server
│   ├── test-agents.ts         # Test AI Agents
│   ├── test-router.ts         # Test LLM Router
│   └── demo-all.ts            # Complete demonstration
├── .env                       # Environment variables
├── .env.example               # Environment template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## 📖 API Documentation

### REST API Endpoints

The Express API provides full CRUD operations for books and authors.

#### Books Endpoints

**List all books**

```bash
GET /api/books

# Example with curl
curl http://localhost:3000/api/books

# Response
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "description": "A classic American novel",
    "publishedYear": 1925,
    "authorId": 1,
    "author": {
      "id": 1,
      "name": "F. Scott Fitzgerald"
    }
  }
]
```

**Get a specific book**

```bash
GET /api/books/:id

# Example
curl http://localhost:3000/api/books/1

# Response
{
  "id": 1,
  "title": "The Great Gatsby",
  "description": "A classic American novel",
  "publishedYear": 1925,
  "authorId": 1,
  "author": {
    "id": 1,
    "name": "F. Scott Fitzgerald",
    "bio": "American novelist"
  }
}
```

**Create a new book**

```bash
POST /api/books
Content-Type: application/json

# Example
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Book",
    "description": "A great new book",
    "publishedYear": 2024,
    "authorId": 1
  }'

# Response
{
  "id": 6,
  "title": "New Book",
  "description": "A great new book",
  "publishedYear": 2024,
  "authorId": 1,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Update a book**

```bash
PUT /api/books/:id
Content-Type: application/json

# Example
curl -X PUT http://localhost:3000/api/books/6 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Book Title",
    "publishedYear": 2025
  }'

# Response
{
  "id": 6,
  "title": "Updated Book Title",
  "description": "A great new book",
  "publishedYear": 2025,
  "authorId": 1
}
```

**Delete a book**

```bash
DELETE /api/books/:id

# Example
curl -X DELETE http://localhost:3000/api/books/6

# Response
{
  "success": true,
  "message": "Book deleted successfully"
}
```

#### Authors Endpoints

**List all authors**

```bash
GET /api/authors

# Example
curl http://localhost:3000/api/authors

# Response
[
  {
    "id": 1,
    "name": "F. Scott Fitzgerald",
    "bio": "American novelist",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Get a specific author**

```bash
GET /api/authors/:id

# Example
curl http://localhost:3000/api/authors/1
```

**Get all books by an author**

```bash
GET /api/authors/:id/books

# Example
curl http://localhost:3000/api/authors/1/books

# Response
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "publishedYear": 1925
  },
  {
    "id": 2,
    "title": "Tender Is the Night",
    "publishedYear": 1934
  }
]
```

**Create a new author**

```bash
POST /api/authors
Content-Type: application/json

# Example
curl -X POST http://localhost:3000/api/authors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Austen",
    "bio": "English novelist known for romantic fiction"
  }'
```

**Update an author**

```bash
PUT /api/authors/:id
Content-Type: application/json

# Example
curl -X PUT http://localhost:3000/api/authors/1 \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Updated biography"
  }'
```

**Delete an author**

```bash
DELETE /api/authors/:id

# Example
curl -X DELETE http://localhost:3000/api/authors/1
```

## 🎨 Usage Examples

### 1. MCP Server (stdio transport)

The MCP Server exposes library operations as tools that can be called by MCP clients.

**File:** `src/mcp/server-stdio.ts`

```typescript
import { createMCPServer, api } from "mcp-agent-kit";

const API_BASE_URL = "http://localhost:3000/api";

const mcpServer = createMCPServer({
  name: "library-mcp-server",
  version: "1.0.0",
  description: "MCP Server for Library API",
  tools: [
    {
      name: "list_books",
      description: "List all books in the library",
      inputSchema: { type: "object", properties: {} },
      handler: async () => {
        const response = await api.get(`${API_BASE_URL}/books`);
        return response.data;
      },
    },
    {
      name: "create_book",
      description: "Create a new book",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          authorId: { type: "number" },
        },
        required: ["title", "authorId"],
      },
      handler: async (params) => {
        const response = await api.post(`${API_BASE_URL}/books`, params);
        return response.data;
      },
    },
  ],
  resources: [
    {
      uri: "library://stats",
      name: "Library Statistics",
      description: "Get current library statistics",
      mimeType: "application/json",
      handler: async () => {
        const [books, authors] = await Promise.all([
          api.get(`${API_BASE_URL}/books`),
          api.get(`${API_BASE_URL}/authors`),
        ]);
        return JSON.stringify({
          totalBooks: books.data.length,
          totalAuthors: authors.data.length,
        });
      },
    },
  ],
});

await mcpServer.start(); // Starts in stdio mode
```

**Run it:**

```bash
npm run mcp:stdio
```

### 2. MCP Server (WebSocket transport)

Same functionality but accessible via WebSocket for remote connections.

**File:** `src/mcp/server-websocket.ts`

```typescript
import { createMCPServer } from "mcp-agent-kit";

const mcpServerWS = createMCPServer({
  name: "library-mcp-server-ws",
  port: 8080,
  tools: [
    /* same tools */
  ],
  resources: [
    /* same resources */
  ],
});

await mcpServerWS.start("websocket");
console.log("MCP Server running on ws://localhost:8080");
```

**Run it:**

```bash
npm run mcp:ws
```

### 3. AI Agent with Gemini

An intelligent agent that can interact with the library API using natural language.

**File:** `src/agents/gemini-agent.ts`

```typescript
import { createAgent } from "mcp-agent-kit";
import { api } from "mcp-agent-kit";

const API_BASE_URL = "http://localhost:3000/api";

export const geminiAgent = createAgent({
  provider: "gemini",
  model: "gemini-2.0-flash-exp",
  apiKey: process.env.GEMINI_API_KEY,
  system: `You are a helpful library assistant. You can help users find books, 
           get information about authors, and manage the library catalog.`,
  tools: [
    {
      name: "search_books",
      description: "Search for books in the library",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
      },
      handler: async ({ query }) => {
        const response = await api.get(`${API_BASE_URL}/books`);
        const books = response.data;
        return books.filter((book) =>
          book.title.toLowerCase().includes(query.toLowerCase())
        );
      },
    },
    {
      name: "add_book",
      description: "Add a new book to the library",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          authorId: { type: "number" },
        },
        required: ["title", "authorId"],
      },
      handler: async (params) => {
        const response = await api.post(`${API_BASE_URL}/books`, params);
        return response.data;
      },
    },
  ],
});

// Usage
const response = await geminiAgent.chat("What books do we have about gatsby?");
console.log(response.content);
```

**Run it:**

```bash
npm run agent:gemini
```

### 4. AI Agent with Groq

Alternative agent using Groq for comparison.

**File:** `src/agents/groq-agent.ts`

```typescript
import { createAgent } from "mcp-agent-kit";

export const groqAgent = createAgent({
  provider: "groq",
  model: "mixtral-8x7b-32768",
  apiKey: process.env.GROQ_API_KEY,
  system: `You are a helpful library assistant...`,
  tools: [
    /* same tools as Gemini agent */
  ],
});
```

**Run it:**

```bash
npm run agent:groq
```

### 5. LLM Router

Intelligently routes queries to the best LLM based on rules.

**File:** `src/router/llm-router.ts`

```typescript
import { createLLMRouter } from "mcp-agent-kit";

export const libraryRouter = createLLMRouter({
  rules: [
    {
      // Use Gemini for quick queries
      when: (input) => input.length < 100,
      use: {
        provider: "gemini",
        model: "gemini-2.0-flash-exp",
        apiKey: process.env.GEMINI_API_KEY,
      },
    },
    {
      // Use Groq for complex queries
      when: (input) =>
        input.toLowerCase().includes("complex") ||
        input.toLowerCase().includes("detailed"),
      use: {
        provider: "groq",
        model: "mixtral-8x7b-32768",
        apiKey: process.env.GROQ_API_KEY,
      },
    },
    {
      // Default to Gemini
      default: true,
      use: {
        provider: "gemini",
        model: "gemini-2.0-flash-exp",
        apiKey: process.env.GEMINI_API_KEY,
      },
    },
  ],
  fallback: {
    provider: "gemini",
    model: "gemini-2.0-flash-exp",
    apiKey: process.env.GEMINI_API_KEY,
  },
  retryAttempts: 3,
});

// Usage
const response = await libraryRouter.route("List all books");
console.log("Response:", response.content);

// Get statistics
const stats = libraryRouter.getStats();
console.log("Router stats:", stats);
```

**Run it:**

```bash
npm run router
```

### 6. Chatbot with Memory

A conversational interface with context retention.

**File:** `src/chatbot/library-chatbot.ts`

```typescript
import { createChatbot } from "mcp-agent-kit";
import { geminiAgent } from "../agents/gemini-agent";

export const libraryChatbot = createChatbot({
  agent: geminiAgent,
  system: `You are a friendly library assistant chatbot. You help users:
           - Find books and authors
           - Get recommendations
           - Add new books to the catalog
           
           Always maintain context from previous messages.`,
  maxHistory: 20,
});

// Interactive CLI
export async function startChatSession() {
  console.log('Library Chatbot started! Type "exit" to quit.\n');

  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = () => {
    readline.question("You: ", async (input: string) => {
      if (input.toLowerCase() === "exit") {
        console.log("Goodbye!");
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

**Run it:**

```bash
npm run chatbot
```

**Example conversation:**

```
You: Hi, what books do you have?
Bot: I can help you find books! Let me check our catalog...

You: Do you have anything by Fitzgerald?
Bot: Yes! We have "The Great Gatsby" by F. Scott Fitzgerald...

You: Tell me more about that book
Bot: "The Great Gatsby" was published in 1925...
```

### 7. Chatbot with Router

Chatbot that uses the LLM Router for intelligent model selection.

**File:** `src/chatbot/library-chatbot-router.ts`

```typescript
import { createChatbot } from "mcp-agent-kit";
import { libraryRouter } from "../router/llm-router";

export const libraryChatbotWithRouter = createChatbot({
  router: libraryRouter,
  system: `You are a friendly library assistant chatbot...`,
  maxHistory: 20,
});

// This chatbot automatically routes to the best LLM
// based on query complexity
```

**Run it:**

```bash
npm run chatbot:router
```

### 8. API Helpers

Demonstrates HTTP requests with retry and timeout capabilities.

**File:** `src/utils/api-client.ts`

```typescript
import { api } from "mcp-agent-kit";

const API_BASE_URL = "http://localhost:3000/api";

// Simple GET request
export async function getAllBooks() {
  const response = await api.get(`${API_BASE_URL}/books`);
  return response.data;
}

// POST request
export async function createBook(bookData: any) {
  const response = await api.post(`${API_BASE_URL}/books`, bookData, {
    name: "create-book",
  });
  return response.data;
}

// Request with retry and timeout
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

// PUT request
export async function updateBook(bookId: number, updates: any) {
  const response = await api.put(`${API_BASE_URL}/books/${bookId}`, updates, {
    name: "update-book",
  });
  return response.data;
}

// DELETE request
export async function deleteBook(bookId: number) {
  const response = await api.delete(`${API_BASE_URL}/books/${bookId}`, {
    name: "delete-book",
  });
  return response.data;
}

// Request with query parameters
export async function searchBooks(query: string) {
  const response = await api.request({
    name: "search-books",
    url: `${API_BASE_URL}/books`,
    method: "GET",
    query: { search: query, limit: 10 },
  });
  return response.data;
}
```

## 🧪 Testing Scripts

The project includes several test scripts to verify functionality:

### Test API Endpoints

**File:** `scripts/test-api.ts`

```bash
npm run test:api
```

Tests all REST API endpoints (GET, POST, PUT, DELETE) for books and authors.

### Test MCP Server

**File:** `scripts/test-mcp.ts`

```bash
npm run test:mcp
```

Tests MCP Server tools and resources.

### Test AI Agents

**File:** `scripts/test-agents.ts`

```bash
npm run test:agents
```

Tests both Gemini and Groq agents with sample queries.

### Test LLM Router

**File:** `scripts/test-router.ts`

```bash
npm run test:router
```

Tests the router with different query types to verify routing logic.

### Complete Demo

**File:** `scripts/demo-all.ts`

```bash
npm run demo
```

Runs a complete demonstration of all features in sequence.

## 📝 Available NPM Scripts

```json
{
  "scripts": {
    "api": "ts-node src/api/server.ts",
    "mcp:st-node src/mcp/server-st
    "mcp:ws": ode src/mcp/socket.ts",
  :geminode scripts/test-agents.ts gemini",
--- "agent: "ts-node sc/test-agents.ts
    "router": "ts-node scripts/router.ts
## Cochatbot": "ts-nntribrc/chatbot/uting-chatbot
   "chatbot:"ts-nodchatbot/liby-chatbot-rout
Co  "ntri": "tbunode prisma/seed.tions are welcome! Please feel free to submit a Pull Request.
"demo": "ts-nscripts/demo-
1   "test:api": ". Fork the rpts/test-api.tsepository
2   "test. Create y-node scripts/test-mcour fe
    "tesature ts": "ts-branch ripts/test-age(`git ",
    "checkoutter": "ts-node scripts -b ferouter.ts"
  }
}
ature/amazing-feature`)

## 🗄️ Database Schema3. Commit your changes (`git commit -m 'Add amazing feature'`)

The project4. Push toma with SQL the branch  persistence.

**File:**(`git pa/schema.prismaush origin feature/amazing-feature`)
5. Open a Pull Request
`prisma
datasdb {
   = "sqlite"
---     = env("DSE_URL")
}

geneclient {
  provider = "ent-js"


## Li Author {
  id        Intcense@id @defautoincrement())
  name      St
bio       String?
  bo  Book
M createdAIT © [Domin@default(now())
}

moiqu Book {
  id            Int      @id @e Kossi]autoincrement(h)
  title  ttps://String
  description   String?
github.shedYear Int?
  aucomrId      Int
  /dominiq      Auueor   @relatkossi)ds: [autId], references: onDelete: C
createdAt    e @deow())
}
```

e Data

Theeed script

- 3 authors (F. S--ald, Geol, Jane Au
  books with rels to authors

## 🔧 Configuratio Acknowledgments

- Builtironment Variables
  with [TypeScript](https://www.typescriptlang.org/)
- eate a `.env` file with theUses [MCng variables:

`P SDK](https://github.com/modelcontextprotocol/sdk)

# Database- Powered by OpenAI, Anthropic, Google, and Ollama

URL="file:./pr"

## I Configuration

API_BASE_URL="httplhost:3000"

LLM Provider API Keysquired)
GEMIEY="yopi-key-here"
GROQ_API_KEY="yo## Supporti-key-here"

#tional)
LOG_LEVEL= debug | infarn | error

```

ing API Keys

**G API Key:**
sit [GoogAI Studio](httakersuite./app/api
2.  in with your Goount
3. Cle API Key"
4. Copkey tov` file

**Groq API K
- EVisit mail: housole](httpsessoudomle.groq.com/)inique@gmail.com
2. Sign up or log in
3. - Issute to API Keys secties: [GitHub Issues](https://github.com/dominiquekossi/mcp-agent-kit/issues)
- Discate a newussions:
5. Copy the [Gy toitHub D.env` fileiscussions](https://github.com/dominiquekossi/mcp-agent-kit/discussions)

---


## 🧪 TesMade by ipts

The project includes severadevelopers, ts to verify each comfor dev


npm run te### Test Ael Endpoiopers
``
Tests all RESpoints (GET, POST, PUT,books and auth# Test MCP Ser
`pm run test:mcp
```

Testr tools and resources.st AI Agents
npm run tes`
Tests bothni and Groq agenwith sample qries.

### Teter

````bashm run test:router
`he router's inouting capabil

### Run Complete De
```bashts/demo-all.ts"


## 🗄️ Danpm se Schema

Thedemo`t uses Prisma with for data persis
Runs test:agents":a complee scripts/monstraents.ttion all featurst-mcp.tses.
: File:** `prisma/  "test:risma`
isma
datasob e"

generator client {  url      {DATABASE_
  provider = "prisma--js"
})
  nao       Sme      String
  i  Int
  author   d    DateTime @defau    ow())
}
```atarejudice"

## onfiguratio
3 Authors*. Scott Fitzgng classics likld"The Great , George O1984", "rwelAusten
- **5nvironment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | SQLite database path | No | `file:./prisma/dev.db` |
| `PORT` | API server port | No | `3000` |
| `API_BASE_URL` | Base URL for API | No | `http://localhost:3000` |
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `GROQ_API_KEY` | Groq API key | Yes | - |
| `LOG_LEVEL` | Logging level | No | `info` |

### Getting API Keys

**Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key to your `.env` file

**Groq API Key:**
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

## 🐛 Troubleshooting

### Issue: "Cannot find module 'mcp-agent-kit'"

**Solution:**
```bash
npm install
````

### Issue: "GEMINI_API_KEY is not defined"

**Solution:**
Make sure you have created a `.env` file with your API keys:

```bash
cp .env.example .env
# Edit .env and add your keys
```

### Issue: "Database does not exist"

**Solution:**

```bash
npx prisma migrate dev --name init
npm run seed
```

### Issue: "Port 3000 is already in use"

**Solution:**
Change the port in your `.env` file:

```bash
PORT=3001
```

### Issue: API requests failing in MCP Server

**Solution:**
Make sure the API server is running:

```bash
npm run api
```

Then in a separate terminal, run the MCP server or agents.

### Issue: "Rate limit exceeded" from LLM providers

**Solution:**

- Check your API key quotas
- Add delays between requests
- Use the router's retry mechanism

### Issue: Chatbot not remembering context

**Solution:**

- Check that `maxHistory` is set appropriately
- Verify the chatbot instance is not being recreated
- Use `bot.getHistory()` to inspect conversation history

## 🎯 Key Features Demonstrated

This project showcases the following mcp-agent-kit capabilities:

1. **MCP Server Creation** - Both stdio and WebSocket transports
2. **Tool Registration** - Exposing API operations as MCP tools
3. **Resource Registration** - Providing data through MCP resources
4. **AI Agent Creation** - Using Gemini and Groq providers
5. **Tool Calling** - Agents executing functions to interact with APIs
6. **LLM Router** - Intelligent routing based on query characteristics
7. **Chatbot with Memory** - Conversation history management
8. **API Helpers** - HTTP requests with retry and timeout
9. **Error Handling** - Graceful error management across all layers
10. **Type Safety** - Full TypeScript support throughout

## 📚 Learning Path

If you're new to mcp-agent-kit, follow this learning path:

1. **Start with the API** - Run `npm run api` and test endpoints with curl
2. **Try an Agent** - Run `npm run agent:gemini` to see AI interaction
3. **Explore MCP Server** - Run `npm run mcp:stdio` to see tool exposure
4. **Test the Router** - Run `npm run router` to see intelligent routing
5. **Use the Chatbot** - Run `npm run chatbot` for conversational AI
6. **Review the Code** - Examine each file to understand implementation
7. **Modify and Experiment** - Add your own tools, agents, or routes

## 🤝 Contributing

This is a demonstration project. Feel free to:

- Fork and modify for your own use cases
- Report issues or suggest improvements
- Share your own mcp-agent-kit examples

## 📄 License

MIT License - feel free to use this project as a template for your owns.

## 🙏 Ackedgm

The seed eate
###\*mcp-agent SampIn @relationg package thn(fieldtk[]l this possibleauthorId], reme ences: [id],@dnDelete: Cefcade)
**Prisma** - Forcreateaulllent ORM

- \*\*Expret(the robustramework
- **Gooni** - For the powerful AI capabilities
- **Groq** - For fast inference

## 📞 Support

For questions about:

- **This demo project**: Open an issue in this repository
- **mcp-agent-kit package**: Visit [mcp-agent-kit documentation](https://github.com/dominiquekossi/mcp-agent-kit)

---

**Happy coding! 🚀**

This project demonstrates that building sophisticated AI-powered applications with MCP servers, agents, and chatbots can be simple and straightforward with the right tools.

edYear Int?
a

description title  
 p mo del Book {
creat Int did @default(autoincrefault(aut

mode
rout"ts: "ts-node scripts/-node screr.ts",ipt

## "d 📝 l "ts-node scrable NPM Scrprisma/seed.ts"-api.ts",

    "sect:api": "ts-node scp

````json
    "chatb: "ts-node src/chatboty-chatbot-rout
{ "scripts": pi": "ts- scripts/test/library-chatbot.t-routenode srrv "ts-nodeer.ts",
    "chatbot": "ts-no"r  :souter": tdio "ts-nod/server-sto.ts",s groq",

 ": mini": "ts-node src/mc scripts/tewebsocket.ts",
    "ts-s/test-agents.i",gent:g
ing

### API Serve't start

**Pblem:** Port 3000ady in us

**Solution:*
shfile
PORT=3001
ort 3000
# Wind
# Chanill the process usige the P
## 🐛 Tr not found" or authentication errors

**Solution:**
1. Verify your `.env` file exists in the project root
2. Check that API keys are correctly formatted (no extra spaces)
3. Ensure you're using valid, active API keys
4. Restart the application after updating `.env`

### MCP Server connection issues

**Problem:** MCP Server not responding

**Solution:**
1. Ensure the API server is running first (`npm run api`)
2. Check that the API_BASE_URL is correct in MCP server files
3. Verify network connectivity to localhost:3000

### Agent/Chatbot errors

**Problem:** Agent not calling tools

**Solution:**
1. Verify the API server is running
2. Check that tool handlers are correctly implemented
3. Review the system prompt - make sure it encourages tool usage
4. Check API logs for errors

### TypeScript compilation errors

**Problem:** Module not found or type errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
````

## 📚 Learn More

### About mcp-agent-kit

- [mcp-agent-kit on npm](https://www.npmjs.com/package/mcp-agent-kit)
- [GitHub Repository](https://github.com/dominiquekossi/mcp-agent-kit)

### Related Technologies

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Prisma ORM](https://www.prisma.io/)
- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Gemini API](https://ai.google.dev/)
- [Groq API](https://groq.com/)

## 🤝 Contributing

This is a demonstration project. Feel free to:

- Fork and modify for your own use cases
- Report issues or suggest improvements
- Share your own implementations

## 📄 License

MIT License - feel free to use this project as a reference or starting point for your own applications.

## 🙏 Acknowledgments

- Built with [mcp-agent-kit](https://www.npmjs.com/package/mcp-agent-kit)
- Powered by Gemini and Groq LLMs
- Database management with Prisma
- API framework with Express.js

---

**Made with ❤️ to demonstrate the power of mcp-agent-kit**

## 🎮 Guia Prático: Testando Cada Funcionalidade

Este guia mostra passo a passo como testar todas as funcionalidades do projeto como usuário final.

### Pré-requisitos

Antes de começar, certifique-se de que:

1. ✅ Você instalou as dependências (`npm install`)
2. ✅ Configurou o arquivo `.env` com suas API keys
3. ✅ Executou as migrações do banco (`npx prisma migrate dev`)
4. ✅ Populou o banco com dados de exemplo (`npm run seed`)

---

### 🚀 Passo 1: Iniciar o Servidor API

**Terminal 1:**

```bash
npm run api
```

**O que você verá:**

```
🚀 API Server running on http://localhost:3000
📚 Library API ready!
```

**Teste rápido:**
Abra seu navegador em `http://localhost:3000/api/books` - você deve ver uma lista de livros em JSON.

---

### 💬 Passo 2: Testar o Chatbot (Modo Interativo)

Agora vamos testar o chatbot que pode gerenciar a biblioteca através de conversação natural.

**Terminal 2:**

```bash
npm run chatbot
```

**O que você verá:**

```
🤖 Library Chatbot started!
Type your message (or 'exit' to quit)

You: _
```

#### Exemplo de Conversa Completa:

**1. Listar livros disponíveis:**

```
You: Quais livros você tem disponíveis?

Bot: Deixe-me verificar nosso catálogo... Temos os seguintes livros:
1. "The Great Gatsby" por F. Scott Fitzgerald (1925)
2. "1984" por George Orwell (1949)
3. "Pride and Prejudice" por Jane Austen (1813)
[... mais livros ...]
```

**2. Buscar livros específicos:**

```
You: Você tem algum livro do Fitzgerald?

Bot: Sim! Temos livros de F. Scott Fitzgerald:
- "The Great Gatsby" (1925) - Um clássico da literatura americana
- "Tender Is the Night" (1934)
```

**3. Cadastrar um novo livro:**

```
You: Cadastre um novo livro chamado "O Senhor dos Anéis" do autor com ID 1

Bot: Perfeito! Vou cadastrar o livro "O Senhor dos Anéis" para você...
✅ Livro cadastrado com sucesso!
- ID: 6
- Título: O Senhor dos Anéis
- Autor ID: 1
- Data de criação: 2024-01-15
```

**4. Verificar se o livro foi cadastrado:**

```
You: Liste todos os livros novamente

Bot: Aqui está a lista atualizada:
1. "The Great Gatsby" por F. Scott Fitzgerald (1925)
2. "1984" por George Orwell (1949)
3. "Pride and Prejudice" por Jane Austen (1813)
4. "O Senhor dos Anéis" por F. Scott Fitzgerald (recém-adicionado)
[...]
```

**5. Editar informações de um livro:**

```
You: Atualize o livro com ID 6, mudando o ano de publicação para 1954

Bot: Vou atualizar o livro para você...
✅ Livro atualizado com sucesso!
- ID: 6
- Título: O Senhor dos Anéis
- Ano de publicação: 1954 (atualizado)
```

**6. Buscar informações sobre autores:**

```
You: Me fale sobre o autor George Orwell

Bot: George Orwell é um autor britânico conhecido por suas obras distópicas.
Ele escreveu os seguintes livros em nossa biblioteca:
- "1984" (1949)
- "Animal Farm" (1945)
```

**7. Cadastrar um novo autor:**

```
You: Cadastre um novo autor chamado "J.R.R. Tolkien" com a bio "Autor britânico de fantasia"

Bot: Vou cadastrar o autor para você...
✅ Autor cadastrado com sucesso!
- ID: 4
- Nome: J.R.R. Tolkien
- Bio: Autor britânico de fantasia
```

**8. Deletar um livro:**

```
You: Delete o livro com ID 6

Bot: Tem certeza? Vou remover o livro "O Senhor dos Anéis" do catálogo...
✅ Livro deletado com sucesso!
```

**9. Testar a memória do chatbot:**

```
You: Qual foi o último livro que eu pedi para você cadastrar?

Bot: O último livro que você pediu para cadastrar foi "O Senhor dos Anéis",
mas acabamos de deletá-lo conforme sua solicitação anterior.
```

**10. Sair do chatbot:**

```
You: exit

Bot: Até logo! Foi um prazer ajudar com a biblioteca. 👋
```

---

### 🧠 Passo 3: Testar o Chatbot com Router (Roteamento Inteligente)

O chatbot com router escolhe automaticamente o melhor modelo de IA baseado na complexidade da pergunta.

**Terminal 2 (feche o chatbot anterior):**

```bash
npm run chatbot:router
```

#### Teste o Roteamento:

**Pergunta simples (usa Gemini - mais rápido):**

```
You: Liste os livros

Bot: [Resposta rápida do Gemini]
🔀 Roteado para: Gemini Flash 2.0
```

**Pergunta complexa (usa Groq - mais poderoso):**

```
You: Faça uma análise detalhada e complexa dos temas literários presentes nos livros de George Orwell

Bot: [Análise profunda do Groq]
🔀 Roteado para: Groq Mixtral
```

---

### 🤖 Passo 4: Testar Agentes Individuais

#### Testar Agente Gemini:

**Terminal 2:**

```bash
npm run agent:gemini
```

**O que acontece:**
O script executa queries de teste e mostra as respostas do agente Gemini.

```
🤖 Testing Gemini Agent...

Query: "List all books in the library"
Response: [Lista de livros]

Query: "Add a new book called 'Test Book'"
Response: [Confirmação de cadastro]
```

#### Testar Agente Groq:

**Terminal 2:**

```bash
npm run agent:groq
```

Similar ao Gemini, mas usando o modelo Groq.

---

### 🔀 Passo 5: Testar o Router de LLM

**Terminal 2:**

```bash
npm run router
```

**O que você verá:**

```
🔀 Testing LLM Router...

Test 1: Short query (< 100 chars)
Query: "List books"
Routed to: Gemini Flash 2.0 ✅
Response: [...]

Test 2: Complex query
Query: "Give me a detailed and complex analysis..."
Routed to: Groq Mixtral ✅
Response: [...]

Test 3: Default routing
Query: "What is the weather?"
Routed to: Gemini Flash 2.0 (default) ✅

📊 Router Statistics:
- Total rules: 3
- Total agents: 2
- Has fallback: Yes
- Retry attempts: 3
```

---

### 🔌 Passo 6: Testar o MCP Server (stdio)

**Terminal 2:**

```bash
npm run mcp:stdio
```

**O que você verá:**

```
🔌 MCP Server (stdio) started!
Server: library-mcp-server v1.0.0

Available Tools:
- list_books: List all books in the library
- get_book: Get a specific book by ID
- create_book: Create a new book
- update_book: Update a book
- delete_book: Delete a book
- list_authors: List all authors
- get_author: Get a specific author
- create_author: Create a new author

Available Resources:
- library://stats: Library statistics
- library://books: All books data
- library://authors: All authors data

Waiting for MCP client connections...
```

**Como testar:**
O MCP Server stdio aguarda conexões de clientes MCP (como Claude Desktop, Cline, etc.). Configure seu cliente MCP para conectar a este servidor.

---

### 🌐 Passo 7: Testar o MCP Server (WebSocket)

**Terminal 2:**

```bash
npm run mcp:ws
```

**O que você verá:**

```
🌐 MCP Server (WebSocket) started!
Server: library-mcp-server-ws v1.0.0
WebSocket URL: ws://localhost:8080

Available Tools: [mesmas tools do stdio]
Available Resources: [mesmos resources do stdio]

Waiting for WebSocket connections...
```

**Como testar:**
Use um cliente WebSocket ou configure seu cliente MCP para conectar via `ws://localhost:8080`.

---

### 🧪 Passo 8: Executar Testes Automatizados

#### Testar todos os endpoints da API:

**Terminal 2:**

```bash
npm run test:api
```

**O que você verá:**

```
🧪 Testing API Endpoints...

✅ GET /api/books - Success (5 books found)
✅ GET /api/books/1 - Success (The Great Gatsby)
✅ POST /api/books - Success (Book created with ID: 6)
✅ PUT /api/books/6 - Success (Book updated)
✅ DELETE /api/books/6 - Success (Book deleted)

✅ GET /api/authors - Success (3 authors found)
✅ GET /api/authors/1 - Success (F. Scott Fitzgerald)
✅ POST /api/authors - Success (Author created)
✅ PUT /api/authors/4 - Success (Author updated)
✅ DELETE /api/authors/4 - Success (Author deleted)

📊 Test Summary:
- Total tests: 10
- Passed: 10
- Failed: 0
```

#### Testar o MCP Server:

```bash
npm run test:mcp
```

#### Testar os Agentes:

```bash
npm run test:agents
```

#### Testar o Router:

```bash
npm run test:router
```

---

### 🎬 Passo 9: Demonstração Completa

Execute uma demonstração completa de todas as funcionalidades em sequência:

**Terminal 2:**

```bash
npm run demo
```

**O que acontece:**

```
🎬 Complete mcp-agent-kit Demo
================================

Step 1: Testing API...
✅ API is working

Step 2: Testing Gemini Agent...
✅ Gemini agent responded

Step 3: Testing Groq Agent...
✅ Groq agent responded

Step 4: Testing LLM Router...
✅ Router is working correctly

Step 5: Testing Chatbot...
✅ Chatbot conversation successful

Step 6: Testing API Helpers...
✅ API helpers working (retry, timeout, etc.)

================================
🎉 All features demonstrated successfully!
```

---

### 📊 Passo 10: Verificar o Banco de Dados

Você pode visualizar os dados diretamente no banco:

```bash
npx prisma studio
```

Isso abre uma interface web em `http://localhost:5555` onde você pode:

- Ver todos os livros cadastrados
- Ver todos os autores
- Editar dados manualmente
- Deletar registros
- Ver relacionamentos entre livros e autores

---

### 🎯 Resumo dos Comandos Principais

| Comando                  | Descrição                          |
| ------------------------ | ---------------------------------- |
| `npm run api`            | Inicia o servidor REST API         |
| `npm run chatbot`        | Chatbot interativo (Gemini)        |
| `npm run chatbot:router` | Chatbot com roteamento inteligente |
| `npm run agent:gemini`   | Testa o agente Gemini              |
| `npm run agent:groq`     | Testa o agente Groq                |
| `npm run router`         | Testa o roteador de LLM            |
| `npm run mcp:stdio`      | MCP Server (stdio)                 |
| `npm run mcp:ws`         | MCP Server (WebSocket)             |
| `npm run demo`           | Demonstração completa              |
| `npm run test:api`       | Testa todos os endpoints da API    |
| `npx prisma studio`      | Interface visual do banco de dados |

---

### 💡 Dicas de Uso

1. **Sempre inicie o servidor API primeiro** (`npm run api`) antes de testar outras funcionalidades
2. **Use terminais separados** para cada componente que você quer testar simultaneamente
3. **O chatbot mantém contexto** - você pode fazer perguntas de acompanhamento
4. **O router escolhe automaticamente** o melhor modelo baseado na complexidade
5. **Todos os dados são persistidos** no banco SQLite em `prisma/dev.db`
6. **Use `npx prisma studio`** para visualizar e editar dados graficamente

---

### 🎓 Fluxo de Teste Recomendado

Para uma experiência completa, siga esta ordem:

1. ✅ Inicie a API (`npm run api`)
2. ✅ Teste o chatbot básico (`npm run chatbot`)
3. ✅ Cadastre livros e autores via chat
4. ✅ Teste o chatbot com router (`npm run chatbot:router`)
5. ✅ Compare as respostas dos diferentes modelos
6. ✅ Execute a demo completa (`npm run demo`)
7. ✅ Visualize os dados no Prisma Studio (`npx prisma studio`)

---

## 🎉 Conclusão

Agora você testou todas as funcionalidades do mcp-agent-kit:

- ✅ **MCP Servers** (stdio e WebSocket)
- ✅ **AI Agents** (Gemini e Groq)
- ✅ **LLM Router** (roteamento inteligente)
- ✅ **Chatbots** (com memória e router)
- ✅ **API Helpers** (retry, timeout)
- ✅ **REST API** (CRUD completo)
- ✅ **Database** (Prisma + SQLite)

Este projeto demonstra como o mcp-agent-kit simplifica a criação de aplicações AI-powered com múltiplos LLMs, servidores MCP, e chatbots inteligentes! 🚀
