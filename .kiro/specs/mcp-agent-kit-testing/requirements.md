# Requirements Document

## Introduction

Este documento define os requisitos para criar uma aplicação real de livraria (API REST com Node.js + Prisma + SQLite) integrada com o pacote mcp-agent-kit. O objetivo é demonstrar o uso prático do mcp-agent-kit através de um MCP Server, Chatbot e AI Agent que interagem com a API da livraria usando Gemini Flash 2.5 e Groq como provedores de LLM.

## Glossary

- **LibraryAPI**: API REST que gerencia livros e autores com operações CRUD
- **MCPServer**: Servidor que expõe ferramentas da API da livraria via Model Context Protocol
- **AIAgent**: Agente de inteligência artificial que interage com a LibraryAPI usando Gemini ou Groq
- **Chatbot**: Sistema conversacional que permite interagir com a livraria em linguagem natural
- **Prisma**: ORM TypeScript para gerenciar o banco de dados SQLite
- **DatabaseSchema**: Esquema do banco de dados com tabelas Book e Author
- **Provider**: Provedor de LLM (Gemini Flash 2.5, Groq)

## Requirements

### Requirement 1

**User Story:** Como desenvolvedor, eu quero configurar um projeto Node.js limpo com Prisma e SQLite, para que eu possa criar uma API de livraria funcional

#### Acceptance Criteria

1. THE LibraryAPI SHALL remover arquivos de código fonte existentes (src/, examples/) mantendo apenas configurações essenciais
2. THE LibraryAPI SHALL criar uma estrutura de diretórios organizada (src/api, src/mcp, src/agents, src/chatbot, prisma/)
3. THE LibraryAPI SHALL configurar package.json instalando mcp-agent-kit do npm como dependência
4. THE LibraryAPI SHALL instalar Prisma, Express e dependências necessárias
5. THE LibraryAPI SHALL criar um arquivo .env.example com variáveis para GEMINI_API_KEY e GROQ_API_KEY

### Requirement 2

**User Story:** Como desenvolvedor, eu quero criar um schema Prisma com modelos Book e Author, para que eu possa armazenar dados da livraria no SQLite

#### Acceptance Criteria

1. THE DatabaseSchema SHALL definir um modelo Author com campos id, name, bio e createdAt
2. THE DatabaseSchema SHALL definir um modelo Book com campos id, title, description, publishedYear, authorId e createdAt
3. THE DatabaseSchema SHALL estabelecer uma relação one-to-many entre Author e Book
4. WHEN Prisma migrate é executado, THE DatabaseSchema SHALL criar o banco de dados SQLite com as tabelas
5. THE DatabaseSchema SHALL incluir seed data com pelo menos 3 autores e 5 livros para testes

### Requirement 3

**User Story:** Como desenvolvedor, eu quero criar uma API REST com Express, para que eu possa expor operações CRUD de livros e autores

#### Acceptance Criteria

1. THE LibraryAPI SHALL implementar endpoint GET /api/books para listar todos os livros
2. THE LibraryAPI SHALL implementar endpoint POST /api/books para criar um novo livro
3. THE LibraryAPI SHALL implementar endpoint PUT /api/books/:id para atualizar um livro
4. THE LibraryAPI SHALL implementar endpoint DELETE /api/books/:id para deletar um livro
5. THE LibraryAPI SHALL implementar endpoints equivalentes para autores (GET, POST, PUT, DELETE /api/authors)
6. THE LibraryAPI SHALL implementar endpoint GET /api/authors/:id/books para listar livros de um autor
7. WHEN a API recebe requisições, THE LibraryAPI SHALL validar dados de entrada e retornar erros apropriados

### Requirement 4

**User Story:** Como desenvolvedor, eu quero criar um MCP Server usando mcp-agent-kit, para que eu possa expor as operações da API como ferramentas e recursos MCP

#### Acceptance Criteria

1. THE MCPServer SHALL usar createMCPServer do mcp-agent-kit para criar o servidor
2. THE MCPServer SHALL registrar tools para operações de livros (list_books, create_book, update_book, delete_book, get_book)
3. THE MCPServer SHALL registrar tools para operações de autores (list_authors, create_author, get_author_books)
4. THE MCPServer SHALL registrar resources incluindo "library://stats" e "library://catalog"
5. THE MCPServer SHALL criar uma versão com stdio transport (padrão)
6. THE MCPServer SHALL criar uma versão com WebSocket transport na porta 8080
7. WHEN uma tool é executada, THE MCPServer SHALL usar o módulo api do mcp-agent-kit para fazer requisições HTTP

### Requirement 5

**User Story:** Como desenvolvedor, eu quero criar AI Agents usando Gemini e Groq, para que eu possa interagir com a API da livraria usando linguagem natural

#### Acceptance Criteria

1. THE AIAgent SHALL usar createAgent do mcp-agent-kit com provider "gemini" e model "gemini-2.0-flash-exp"
2. THE AIAgent SHALL configurar tools que permitem ao agent chamar as operações da API
3. WHEN o agent recebe uma pergunta sobre livros, THE AIAgent SHALL usar as tools para buscar informações na API
4. THE AIAgent SHALL criar um segundo agent usando provider "groq" para comparação
5. THE AIAgent SHALL incluir system prompt que instrui o agent a ser um assistente de livraria útil

### Requirement 6

**User Story:** Como desenvolvedor, eu quero criar um Chatbot com memória conversacional, para que usuários possam interagir naturalmente com a livraria

#### Acceptance Criteria

1. THE Chatbot SHALL usar createChatbot do mcp-agent-kit com um AIAgent configurado
2. THE Chatbot SHALL manter histórico de conversação com maxHistory de 20 mensagens
3. WHEN um usuário pergunta sobre livros, THE Chatbot SHALL usar o contexto de mensagens anteriores
4. THE Chatbot SHALL permitir operações como "adicione um livro chamado X do autor Y"
5. THE Chatbot SHALL fornecer respostas naturais e contextualizadas sobre a livraria

### Requirement 7

**User Story:** Como desenvolvedor, eu quero criar um LLM Router, para que eu possa demonstrar roteamento inteligente entre Gemini e Groq

#### Acceptance Criteria

1. THE LibraryAPI SHALL usar createLLMRouter do mcp-agent-kit
2. THE LibraryAPI SHALL configurar regras que direcionam queries curtas para Gemini
3. THE LibraryAPI SHALL configurar regras que direcionam queries complexas para Groq
4. THE LibraryAPI SHALL configurar um fallback para Gemini
5. THE LibraryAPI SHALL implementar retry com 3 tentativas
6. THE LibraryAPI SHALL criar um chatbot que usa o router ao invés de um agent único

### Requirement 8

**User Story:** Como desenvolvedor, eu quero demonstrar o uso dos API Helpers, para que eu possa mostrar requisições HTTP com retry e timeout

#### Acceptance Criteria

1. THE LibraryAPI SHALL criar um módulo api-client.ts usando o módulo api do mcp-agent-kit
2. THE LibraryAPI SHALL demonstrar requisições GET, POST, PUT, DELETE
3. THE LibraryAPI SHALL demonstrar configuração de timeout em requisições
4. THE LibraryAPI SHALL demonstrar configuração de retry em requisições
5. THE LibraryAPI SHALL demonstrar uso de query parameters

### Requirement 9

**User Story:** Como desenvolvedor, eu quero scripts de demonstração executáveis, para que eu possa testar cada funcionalidade do mcp-agent-kit facilmente

#### Acceptance Criteria

1. THE LibraryAPI SHALL incluir script "npm run api" que inicia o servidor Express
2. THE LibraryAPI SHALL incluir scripts "npm run mcp:stdio" e "npm run mcp:ws" para MCP Server
3. THE LibraryAPI SHALL incluir script "npm run agent:gemini" que demonstra o agent Gemini
4. THE LibraryAPI SHALL incluir script "npm run agent:groq" que demonstra o agent Groq
5. THE LibraryAPI SHALL incluir script "npm run router" que demonstra o LLM Router
6. THE LibraryAPI SHALL incluir scripts "npm run chatbot" e "npm run chatbot:router"
7. THE LibraryAPI SHALL incluir script "npm run seed" que popula o banco com dados de exemplo
8. THE LibraryAPI SHALL incluir script "npm run demo" que executa uma demonstração completa

### Requirement 10

**User Story:** Como desenvolvedor, eu quero documentação completa do projeto, para que outros desenvolvedores possam entender e usar o exemplo facilmente

#### Acceptance Criteria

1. THE LibraryAPI SHALL incluir um README.md com visão geral do projeto e arquitetura
2. THE LibraryAPI SHALL documentar como configurar as API keys (GEMINI_API_KEY, GROQ_API_KEY)
3. THE LibraryAPI SHALL incluir instruções passo-a-passo de instalação e execução
4. THE LibraryAPI SHALL documentar cada endpoint da API REST com exemplos de requisição/resposta
5. THE LibraryAPI SHALL incluir exemplos de uso de todas as funcionalidades do mcp-agent-kit (MCP Server stdio/WebSocket, AI Agents, Router, Chatbot, API Helpers)
6. THE LibraryAPI SHALL documentar a estrutura do projeto e responsabilidade de cada arquivo
7. THE LibraryAPI SHALL incluir seção destacando todas as funcionalidades do mcp-agent-kit demonstradas
