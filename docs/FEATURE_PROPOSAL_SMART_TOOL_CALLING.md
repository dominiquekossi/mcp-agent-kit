# Feature Proposal: Smart Tool Calling

## 🎯 Problema

Atualmente, quando configuramos tools em um agent, não há garantia de que elas serão chamadas. Como vimos nos testes, o Gemini frequentemente ignora as tools e responde genericamente.

## 💡 Solução: Smart Tool Calling

### API Proposta

```typescript
import { createAgent } from "mcp-agent-kit";

const agent = createAgent({
  provider: "gemini",
  model: "gemini-2.5-flash",
  tools: [
    {
      name: "search_books",
      description: "Search for books in the library",
      parameters: {
        /* ... */
      },
      handler: async (params) => {
        /* ... */
      },
    },
  ],

  // 🆕 NOVA CONFIGURAÇÃO
  toolConfig: {
    // Força o modelo a usar tools quando disponíveis
    forceToolUse: true,

    // Estratégia quando tool não é chamada
    onToolNotCalled: "retry", // "retry" | "error" | "warn" | "allow"

    // Número de tentativas
    maxRetries: 3,

    // Timeout por tool call
    toolTimeout: 5000,

    // Fallback para outro provider se falhar
    fallbackProvider: {
      provider: "openai",
      model: "gpt-4-turbo-preview",
    },

    // Validação de resposta da tool
    validateToolResponse: true,

    // Cache de tool results
    cacheResults: {
      enabled: true,
      ttl: 300000, // 5 minutos
      key: (toolName, params) => `${toolName}:${JSON.stringify(params)}`,
    },
  },
});
```

### Implementação Interna

```typescript
class SmartToolCalling {
  async executeWithRetry(
    agent: Agent,
    message: string,
    attempt: number = 1
  ): Promise<Response> {
    const response = await agent.chat(message);

    // Verifica se tool foi chamada
    if (!response.toolCalls && this.config.forceToolUse) {
      console.warn(`[Attempt ${attempt}] Tool not called, expected tool use`);

      if (attempt < this.config.maxRetries) {
        // Reformula a mensagem para forçar tool use
        const enhancedMessage = this.enhancePromptForToolUse(message);
        return this.executeWithRetry(agent, enhancedMessage, attempt + 1);
      }

      // Se esgotou tentativas, usa fallback provider
      if (this.config.fallbackProvider) {
        console.log("Using fallback provider...");
        const fallbackAgent = createAgent(this.config.fallbackProvider);
        return fallbackAgent.chat(message);
      }

      // Se não tem fallback, lança erro ou permite
      if (this.config.onToolNotCalled === "error") {
        throw new Error("Tool was not called after max retries");
      }
    }

    return response;
  }

  enhancePromptForToolUse(message: string): string {
    return `${message}\n\nIMPORTANT: You MUST use the available tools to answer this question. Do not provide a generic answer without calling the appropriate tool.`;
  }
}
```

### Exemplo de Uso

```typescript
// Antes (não funciona bem)
const agent = createAgent({
  provider: "gemini",
  tools: [searchBooksTool],
});

const response = await agent.chat("List all books");
// ❌ Gemini responde genericamente sem chamar a tool

// Depois (funciona!)
const agent = createAgent({
  provider: "gemini",
  tools: [searchBooksTool],
  toolConfig: {
    forceToolUse: true,
    maxRetries: 3,
    fallbackProvider: {
      provider: "openai",
      model: "gpt-4-turbo-preview",
    },
  },
});

const response = await agent.chat("List all books");
// ✅ Tool é chamada, ou fallback para OpenAI se necessário
```

### Logs de Debug

```
[DEBUG] Attempt 1: Sending message to Gemini
[WARN] Tool not called, expected tool use
[DEBUG] Attempt 2: Enhancing prompt for tool use
[WARN] Tool not called, expected tool use
[DEBUG] Attempt 3: Enhancing prompt for tool use
[WARN] Tool not called after 3 attempts
[INFO] Switching to fallback provider: OpenAI GPT-4
[SUCCESS] Tool 'search_books' called successfully
[DEBUG] Tool execution time: 234ms
[DEBUG] Tool result cached with key: search_books:{}
```

### Benefícios

1. **Confiabilidade**: Tools são chamadas de forma consistente
2. **Fallback Automático**: Se um provider falha, outro assume
3. **Cache**: Evita chamadas duplicadas
4. **Observabilidade**: Logs detalhados de cada tentativa
5. **Flexibilidade**: Configurável por use case

### Testes

```typescript
describe("Smart Tool Calling", () => {
  it("should retry when tool is not called", async () => {
    const agent = createAgent({
      provider: "gemini",
      tools: [mockTool],
      toolConfig: {
        forceToolUse: true,
        maxRetries: 3,
      },
    });

    const response = await agent.chat("test");
    expect(response.toolCalls).toBeDefined();
  });

  it("should use fallback provider after max retries", async () => {
    const agent = createAgent({
      provider: "gemini",
      tools: [mockTool],
      toolConfig: {
        forceToolUse: true,
        maxRetries: 2,
        fallbackProvider: { provider: "openai" },
      },
    });

    const response = await agent.chat("test");
    expect(response.provider).toBe("openai");
  });

  it("should cache tool results", async () => {
    const agent = createAgent({
      provider: "gemini",
      tools: [expensiveTool],
      toolConfig: {
        cacheResults: { enabled: true, ttl: 60000 },
      },
    });

    await agent.chat("test");
    const cachedResponse = await agent.chat("test");

    expect(expensiveTool.callCount).toBe(1); // Called only once
  });
});
```

## 📊 Impacto Esperado

- **Confiabilidade**: +80% de tool calls bem-sucedidas
- **Latência**: -40% com cache
- **Custos**: -30% evitando retries desnecessários
- **Developer Experience**: 10x melhor

## 🚀 Implementação

### Fase 1: Core (1 semana)

- [ ] Implementar retry logic
- [ ] Implementar prompt enhancement
- [ ] Testes unitários

### Fase 2: Advanced (1 semana)

- [ ] Fallback provider
- [ ] Cache system
- [ ] Logging & metrics

### Fase 3: Polish (3 dias)

- [ ] Documentação
- [ ] Exemplos
- [ ] Migration guide

## 📝 Documentação

```markdown
# Smart Tool Calling

Garante que suas tools sejam chamadas de forma confiável, com retry automático e fallback.

## Quick Start

\`\`\`typescript
const agent = createAgent({
provider: "gemini",
tools: [myTool],
toolConfig: {
forceToolUse: true,
maxRetries: 3
}
});
\`\`\`

## Configuration Options

- `forceToolUse`: Força o uso de tools
- `maxRetries`: Número de tentativas
- `fallbackProvider`: Provider alternativo
- `cacheResults`: Cache de resultados

## Best Practices

1. Use `forceToolUse: true` quando tools são essenciais
2. Configure fallback para providers mais confiáveis
3. Ative cache para tools com resultados estáveis
4. Monitor logs para otimizar configuração
```

---

**Esta feature sozinha pode aumentar significativamente a adoção do mcp-agent-kit, resolvendo um dos maiores pain points dos desenvolvedores.**
