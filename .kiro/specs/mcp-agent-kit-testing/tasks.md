# Implementation Plan

- [x] 1. Setup projeto e limpar arquivos existentes

  - Remover diretórios src/ e examples/ do projeto atual
  - Criar nova estrutura de diretórios (src/api, src/mcp, src/agents, src/router, src/chatbot, src/utils, prisma/)
  - Atualizar package.json com dependências necessárias (mcp-agent-kit, prisma, express, cors, dotenv)
  - Instalar mcp-agent-kit diretamente do npm
  - Criar arquivo .env.example com variáveis de ambiente
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Configurar Prisma e banco de dados SQLite

- [x] 2.1 Criar schema Prisma com modelos Book e Author

  - Definir modelo Author com campos id, name, bio, createdAt
  - Definir modelo Book com campos id, title, description, publishedYear, authorId, createdAt
  - Estabelecer relação one-to-many entre Author e Book
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2.2 Criar arquivo de seed com dados de exemplo

  - Criar prisma/seed.ts com pelo menos 3 autores
  - Adicionar pelo menos 5 livros relacionados aos autores
  - Configurar script de seed no package.json
  - _Requirements: 2.5_

- [x] 2.3 Executar migrations e seed

  - Executar npx prisma migrate dev para criar banco
  - Executar seed para popular dados
  - Criar src/db/client.ts com PrismaClient
  - _Requirements: 2.4_

- [x] 3. Implementar API REST com Express

- [x] 3.1 Criar servidor Express básico

  - Criar src/api/server.ts com configuração Express
  - Configurar CORS e JSON middleware
  - Configurar porta e inicialização do servidor
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3.2 Implementar controllers e routes para Books

  - Criar src/api/controllers/books.controller.ts
  - Implementar listBooks, getBook, createBook, updateBook, deleteBook
  - Criar src/api/routes/books.ts com rotas GET, POST, PUT, DELETE
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3.3 Implementar controllers e routes para Authors

  - Criar src/api/controllers/authors.controller.ts
  - Implementar listAuthors, getAuthor, createAuthor, updateAuthor, deleteAuthor, getAuthorBooks
  - Criar src/api/routes/authors.ts com rotas correspondentes
  - _Requirements: 3.5, 3.6_

- [x] 3.4 Adicionar middleware de error handling

  - Criar src/api/middleware/error-handler.ts
  - Implementar classe ApiError
  - Adicionar middleware de tratamento de erros global
  - _Requirements: 3.7_

- [x] 4. Criar MCP Server com tools e resources

- [x] 4.1 Implementar MCP Server com stdio transport

  - Criar src/mcp/server-stdio.ts usando createMCPServer
  - Registrar tools para operações de livros (list_books, get_book, create_book, update_book, delete_book)
  - Registrar tools para operações de autores (list_authors, create_author, get_author_books)
  - Usar módulo api do mcp-agent-kit para fazer requisições HTTP
  - _Requirements: 4.1, 4.2, 4.3, 4.7_

- [x] 4.2 Adicionar resources ao MCP Server

  - Adicionar resource "library://stats" que retorna estatísticas da biblioteca
  - Adicionar resource "library://catalog" que retorna catálogo completo
  - _Requirements: 4.4_

- [x] 4.3 Criar MCP Server com WebSocket transport

  - Criar src/mcp/server-websocket.ts
  - Configurar servidor na porta 8080
  - Registrar mesmas tools e resources da versão stdio
  - Iniciar servidor em modo WebSocket
  - _Requirements: 4.5, 4.6_

- [x] 5. Implementar AI Agents com Gemini e Groq

- [x] 5.1 Criar Gemini Agent

  - Criar src/agents/gemini-agent.ts usando createAgent
  - Configurar provider "gemini" com model "gemini-2.0-flash-exp"
  - Adicionar system prompt para assistente de livraria
  - Registrar tools (search_books, get_book_details, add_book, list_authors)
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 5.2 Criar Groq Agent

  - Criar src/agents/groq-agent.ts usando createAgent
  - Configurar provider "groq" com model apropriado
  - Adicionar mesmas tools do Gemini agent
  - _Requirements: 5.4_

- [x] 5.3 Criar utilitários para agents

  - Criar src/agents/utils/error-handler.ts
  - Implementar função safeAgentCall para tratamento de erros
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Implementar LLM Router

- [x] 6.1 Criar configuração do Router

  - Criar src/router/llm-router.ts usando createLLMRouter
  - Configurar regra para queries curtas (< 100 chars) usar Gemini
  - Configurar regra para queries complexas usar Groq
  - Configurar regra default para Gemini
  - Configurar fallback para Gemini com 3 retry attempts
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6.2 Criar função de demonstração do Router

  - Implementar função queryLibrary que usa o router
  - Adicionar logging de estatísticas do router
  - Adicionar listagem de agents disponíveis
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Implementar Chatbots

- [x] 7.1 Criar Chatbot com agent único

  - Criar src/chatbot/library-chatbot.ts usando createChatbot
  - Configurar com geminiAgent e maxHistory de 20
  - Implementar função startChatSession com interface CLI interativa
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7.2 Criar Chatbot com Router

  - Criar src/chatbot/library-chatbot-router.ts
  - Configurar chatbot usando libraryRouter ao invés de agent único
  - _Requirements: 7.6_

- [x] 8. Demonstrar API Helpers do mcp-agent-kit

- [x] 8.1 Criar módulo de API client

  - Criar src/utils/api-client.ts usando módulo api do mcp-agent-kit
  - Implementar getAllBooks usando api.get
  - Implementar createBook usando api.post
  - Implementar getBookWithRetry com timeout e retry configurados
  - Implementar updateBook usando api.put
  - Implementar deleteBook usando api.delete
  - Implementar searchBooks com query parameters
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Criar scripts de demonstração

- [x] 9.1 Criar scripts de teste

  - Criar scripts/test-api.ts para testar endpoints da API
  - Criar scripts/test-mcp.ts para testar MCP Server
  - Criar scripts/test-agents.ts para testar Gemini e Groq agents
  - Criar scripts/test-router.ts para testar LLM Router
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 9.2 Configurar scripts no package.json

  - Adicionar script "api" para iniciar Express server
  - Adicionar scripts "mcp:stdio" e "mcp:ws" para MCP Servers
  - Adicionar scripts "agent:gemini" e "agent:groq"
  - Adicionar script "router" para demonstrar Router
  - Adicionar scripts "chatbot" e "chatbot:router"
  - Adicionar script "seed" para popular banco
  - Adicionar script "demo" para demonstração completa
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 10. Criar documentação completa

- [x] 10.1 Criar README.md do projeto

  - Adicionar visão geral e arquitetura do projeto
  - Documentar todas as funcionalidades do mcp-agent-kit demonstradas
  - Adicionar instruções de instalação e configuração
  - Documentar variáveis de ambiente (GEMINI_API_KEY, GROQ_API_KEY)
  - Adicionar exemplos de uso de cada componente
  - Documentar estrutura do projeto
  - Adicionar seção de troubleshooting
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 10.2 Documentar endpoints da API

  - Documentar cada endpoint REST com exemplos de request/response
  - Adicionar exemplos de curl ou requisições HTTP
  - _Requirements: 10.4_

- [x] 10.3 Adicionar exemplos de uso

  - Incluir exemplos de uso do MCP Server (stdio e WebSocket)
  - Incluir exemplos de uso dos AI Agents
  - Incluir exemplos de uso do Router
  - Incluir exemplos de uso dos Chatbots
  - Incluir exemplos de uso dos API Helpers
  - _Requirements: 10.5_
