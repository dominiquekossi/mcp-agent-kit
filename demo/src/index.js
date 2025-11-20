import express from 'express';
import dotenv from 'dotenv';
import { createAgent } from 'mcp-agent-kit';
import { getAllBooks, getBookById } from './data/books.js';
import { getAllAuthors, getAuthorById } from './data/authors.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize AI agents
const groqAgent = createAgent({
  provider: 'openai',
  model: 'llama3-70b-8192',
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
  toolConfig: {
    forceToolUse: true,
    maxRetries: 3,
    toolTimeout: 30000,
    cacheResults: {
      enabled: true,
      ttl: 300000,
      maxSize: 100
    },
    debug: true
  },
  tools: [
    {
      name: 'search_books',
      description: 'Search for books in the library',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      },
      handler: async ({ query }) => {
        const books = getAllBooks();
        const results = books.filter(book => 
          book.title.toLowerCase().includes(query.toLowerCase()) ||
          book.description.toLowerCase().includes(query.toLowerCase())
        );
        return results;
      }
    },
    {
      name: 'get_author_info',
      description: 'Get information about an author',
      parameters: {
        type: 'object',
        properties: {
          authorId: { type: 'number', description: 'Author ID' }
        },
        required: ['authorId']
      },
      handler: async ({ authorId }) => {
        return getAuthorById(authorId);
      }
    }
  ]
});

const geminiAgent = createAgent({
  provider: 'gemini',
  model: 'gemini-2.0-flash-exp',
  apiKey: process.env.GEMINI_API_KEY,
  toolConfig: {
    maxRetries: 2,
    cacheResults: {
      enabled: true
    }
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'MCP Agent Kit Demo API',
    version: '1.1.0',
    endpoints: {
      books: '/api/books',
      authors: '/api/authors',
      ai: {
        ask: 'POST /api/ai/ask',
        chat: 'POST /api/ai/chat',
        recommend: 'POST /api/ai/recommend'
      }
    }
  });
});

// Books endpoints
app.get('/api/books', (req, res) => {
  res.json(getAllBooks());
});

app.get('/api/books/:id', (req, res) => {
  const book = getBookById(req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  res.json(book);
});

// Authors endpoints
app.get('/api/authors', (req, res) => {
  res.json(getAllAuthors());
});

app.get('/api/authors/:id', (req, res) => {
  const author = getAuthorById(req.params.id);
  if (!author) {
    return res.status(404).json({ error: 'Author not found' });
  }
  res.json(author);
});

// AI endpoints
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question, provider = 'groq' } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const agent = provider === 'gemini' ? geminiAgent : groqAgent;
    const response = await agent.chat(question);
    
    res.json({
      provider,
      question,
      answer: response.content,
      usage: response.usage
    });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/recommend', async (req, res) => {
  try {
    const { genre, provider = 'groq' } = req.body;
    
    const agent = provider === 'gemini' ? geminiAgent : groqAgent;
    const books = getAllBooks();
    
    const prompt = `Based on these books: ${JSON.stringify(books)}, recommend 3 books ${genre ? `in the ${genre} genre` : 'for a software developer'}. Explain why each is recommended.`;
    
    const response = await agent.chat(prompt);
    
    res.json({
      provider,
      genre: genre || 'general',
      recommendations: response.content
    });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Demo API running on http://localhost:${PORT}`);
  console.log(`📚 Books: http://localhost:${PORT}/api/books`);
  console.log(`✍️  Authors: http://localhost:${PORT}/api/authors`);
  console.log(`🤖 AI Ask: POST http://localhost:${PORT}/api/ai/ask`);
});
