# Quick Start Guide

> 🔒 Esta é uma branch de testes que usa o pacote `mcp-agent-kit` do npm, não o código fonte local.

## 🚀 Setup Rápido (5 minutos)

### 1. Instalar Dependências

```bash
cd demo
npm install
```

### 2. Configurar API Keys

Copie o arquivo de exemplo e adicione suas chaves:

```bash
cp .env.example .env
```

Edite `.env` e adicione suas chaves:

```env
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
```

**Onde conseguir as chaves:**

- Groq: https://console.groq.com/keys (Grátis!)
- Gemini: https://makersuite.google.com/app/apikey (Grátis!)

### 3. Verificar Versão do Pacote

```bash
npm run check:version
```

Isso mostra qual versão do `mcp-agent-kit` está instalada do npm.

### 4. Testar Tudo

```bash
npm run test:all
```

Isso vai executar todos os testes e validar:

- ✅ Agents básicos (Groq, Gemini)
- ✅ Smart Tool Calling (retry, timeout, cache)
- ✅ LLM Router
- ✅ Chatbot com memória

### 5. Iniciar API

```bash
npm start
```

## 🔄 Atualizando para Nova Versão

Quando uma nova versão do `mcp-agent-kit` for publicada:

```bash
# 1. Atualizar para a versão mais recente
npm run update:package

# 2. Verificar a versão instalada
npm run check:version

# 3. Rodar todos os testes
npm run verify
```

A API estará rodando em `http://localhost:3000`

## 📝 Exemplos de Uso

### Testar no Terminal

```bash
# Listar livros
curl http://localhost:3000/api/books

# Perguntar ao AI (Groq)
curl -X POST http://localhost:3000/api/ai/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Clean Code about?", "provider": "groq"}'

# Perguntar ao AI (Gemini)
curl -X POST http://localhost:3000/api/ai/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Explain TypeScript", "provider": "gemini"}'

# Recomendar livros
curl -X POST http://localhost:3000/api/ai/recommend \
  -H "Content-Type: application/json" \
  -d '{"genre": "Programming", "provider": "groq"}'
```

### Testar Features Individuais

```bash
# Testar apenas agents
npm run test:agent

# Testar apenas smart tools
npm run test:tools

# Testar apenas router
npm run test:router

# Testar apenas chatbot
npm run test:chatbot
```

## 🎯 O que cada teste faz

### test-agent.js

Testa os 4 providers suportados:

- Groq (llama3-70b-8192)
- Gemini (gemini-2.0-flash-exp)
- OpenAI (gpt-4-turbo-preview) - opcional
- Anthropic (claude-3-5-sonnet) - opcional

### test-smart-tools.js

Testa as novas features da v1.1.0:

- **Retry Logic**: Tool falha 2x e sucede na 3ª tentativa
- **Timeout**: Tool lento é cancelado após 2s
- **Caching**: Segunda chamada usa cache (mais rápido)
- **Force Tool Use**: Força o modelo a usar tools

### test-router.js

Testa roteamento inteligente:

- Queries com "code" → Groq
- Queries curtas (<50 chars) → Gemini
- Outras queries → Default (Groq)
- Fallback automático se falhar

### test-chatbot.js

Testa memória de conversação:

- Bot lembra do nome do usuário
- Mantém contexto entre mensagens
- Stats de conversação
- Reset de histórico

## 🐛 Troubleshooting

### Erro: "API key not found"

- Verifique se o arquivo `.env` existe
- Confirme que as chaves estão corretas
- Reinicie o processo após editar `.env`

### Erro: "Module not found"

```bash
cd demo
npm install
```

### Erro: "Port 3000 already in use"

Mude a porta no `.env`:

```env
PORT=3001
```

### Testes falhando

- Verifique sua conexão com internet
- Confirme que as API keys são válidas
- Alguns providers podem ter rate limits

## 📚 Próximos Passos

1. Explore o código em `src/index.js`
2. Veja os exemplos de tools em `test-smart-tools.js`
3. Customize os dados em `src/data/`
4. Adicione seus próprios endpoints
5. Experimente com diferentes modelos

## 💡 Dicas

- Use `debug: true` no `toolConfig` para ver logs detalhados
- Groq é muito rápido e gratuito - ótimo para testes
- Gemini também é gratuito e tem bom desempenho
- Cache economiza chamadas de API - use sempre que possível
- Retry logic é essencial para produção

## 🆘 Precisa de Ajuda?

- Documentação completa: [README.md](./README.md)
- Issues: https://github.com/dominiquekossi/mcp-agent-kit/issues
- NPM: https://www.npmjs.com/package/mcp-agent-kit
