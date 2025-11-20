# MCP Agent Kit Demo - Library API

Demo API para testar todas as funcionalidades do `mcp-agent-kit` v1.1.0.

## Estrutura

```
demo/
├── src/
│   ├── index.js              # API Express principal
│   ├── data/
│   │   ├── books.js          # Dados de livros
│   │   └── authors.js        # Dados de autores
│   ├── routes/
│   │   ├── books.js          # Rotas de livros
│   │   └── authors.js        # Rotas de autores
│   └── tests/
│       ├── test-agent.js     # Testa agents básicos
│       ├── test-router.js    # Testa LLM router
│       ├── test-chatbot.js   # Testa chatbot
│       ├── test-smart-tools.js # Testa smart tool calling
│       └── test-all.js       # Executa todos os testes
├── package.json
└── .env
```

## Features Testadas

### ✅ AI Agents

- [x] Groq (llama3-70b-8192)
- [x] Gemini (gemini-2.0-flash-exp)
- [x] OpenAI (gpt-4-turbo-preview)
- [x] Anthropic (claude-3-5-sonnet)

### ✅ Smart Tool Calling (v1.1.0)

- [x] Retry automático
- [x] Timeout
- [x] Cache de resultados
- [x] Force tool use
- [x] Error handling
- [x] Debug mode

### ✅ LLM Router

- [x] Routing por regras
- [x] Fallback automático
- [x] Retry logic

### ✅ Chatbot

- [x] Memória de conversação
- [x] System prompt
- [x] Histórico

### ✅ API Requests

- [x] GET, POST, PUT, DELETE
- [x] Retry e timeout

## Setup

1. Instalar dependências:

```bash
cd demo
npm install
```

2. Configurar variáveis de ambiente:

```bash
cp .env.example .env
# Editar .env com suas API keys
```

3. Iniciar API:

```bash
npm start
```

## Testes

Executar todos os testes:

```bash
npm run test:all
```

Testes individuais:

```bash
npm run test:agent      # Testa agents básicos
npm run test:router     # Testa LLM router
npm run test:chatbot    # Testa chatbot
npm run test:tools      # Testa smart tool calling
```

## Endpoints da API

### Books

- `GET /api/books` - Lista todos os livros
- `GET /api/books/:id` - Busca livro por ID
- `POST /api/books` - Cria novo livro
- `PUT /api/books/:id` - Atualiza livro
- `DELETE /api/books/:id` - Remove livro

### Authors

- `GET /api/authors` - Lista todos os autores
- `GET /api/authors/:id` - Busca autor por ID
- `POST /api/authors` - Cria novo autor
- `PUT /api/authors/:id` - Atualiza autor
- `DELETE /api/authors/:id` - Remove autor

### AI Features

- `POST /api/ai/ask` - Pergunta ao agent
- `POST /api/ai/chat` - Chat com memória
- `POST /api/ai/recommend` - Recomendação de livros
