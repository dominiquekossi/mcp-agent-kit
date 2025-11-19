# Implementation Plan: Smart Tool Calling

**Feature:** Smart Tool Calling with Retry and Fallback
**Branch:** `feat/smart-tool-calling`
**Base:** `feat/v1.1.0`
**Status:** 🔴 In Progress
**Started:** 19/11/2025

---

## 🎯 Objetivo

Garantir que tools sejam chamadas de forma confiável através de:

- Retry automático quando tool não é chamada
- Fallback para outro provider
- Cache de resultados
- Logs detalhados

---

## 📋 Checklist de Implementação

### Fase 1: Core Logic (Dia 1-2)

- [ ] Criar `src/agent/smart-tool-calling/config.ts`
- [ ] Criar `src/agent/smart-tool-calling/retry-logic.ts`
- [ ] Criar `src/agent/smart-tool-calling/prompt-enhancer.ts`
- [ ] Criar `src/agent/smart-tool-calling/index.ts`
- [ ] Integrar com `createAgent`

### Fase 2: Fallback & Cache (Dia 3-4)

- [ ] Implementar fallback provider
- [ ] Implementar cache de resultados
- [ ] Adicionar timeout por tool
- [ ] Adicionar validação de resposta

### Fase 3: Testing (Dia 5)

- [ ] Testes unitários (retry logic)
- [ ] Testes unitários (prompt enhancer)
- [ ] Testes unitários (fallback)
- [ ] Testes unitários (cache)
- [ ] Testes de integração
- [ ] Coverage > 80%

### Fase 4: Documentation (Dia 6-7)

- [ ] JSDoc comments
- [ ] README examples
- [ ] API documentation
- [ ] Migration guide
- [ ] Update CHANGELOG.md

---

## 🏗️ Arquitetura

```typescript
// Estrutura de arquivos
src/agent/smart-tool-calling/
├── index.ts              // Export principal
├── config.ts             // Tipos e configuração
├── retry-logic.ts        // Lógica de retry
├── prompt-enhancer.ts    // Melhora prompts
├── fallback.ts           // Fallback provider
└── cache.ts              // Cache de resultados

tests/smart-tool-calling/
├── retry-logic.test.ts
├── prompt-enhancer.test.ts
├── fallback.test.ts
├── cache.test.ts
└── integration.test.ts
```

---

## 📝 Tasks Detalhadas

### Task 1: Criar Tipos e Configuração

**File:** `src/agent/smart-tool-calling/config.ts`
**Estimativa:** 30min

```typescript
export interface SmartToolConfig {
  forceToolUse: boolean;
  maxRetries: number;
  onToolNotCalled: "retry" | "error" | "warn" | "allow";
  toolTimeout: number;
  fallbackProvider?: ProviderConfig;
  cacheResults?: CacheConfig;
  validateToolResponse?: boolean;
}
```

### Task 2: Implementar Retry Logic

**File:** `src/agent/smart-tool-calling/retry-logic.ts`
**Estimativa:** 2h

```typescript
export class RetryLogic {
  async executeWithRetry(
    agent: Agent,
    message: string,
    config: SmartToolConfig
  ): Promise<Response>;
}
```

### Task 3: Implementar Prompt Enhancer

**File:** `src/agent/smart-tool-calling/prompt-enhancer.ts`
**Estimativa:** 1h

```typescript
export class PromptEnhancer {
  enhance(message: string, attempt: number): string;
}
```

### Task 4: Implementar Fallback

**File:** `src/agent/smart-tool-calling/fallback.ts`
**Estimativa:** 2h

```typescript
export class FallbackProvider {
  async executeFallback(
    message: string,
    config: ProviderConfig
  ): Promise<Response>;
}
```

### Task 5: Implementar Cache

**File:** `src/agent/smart-tool-calling/cache.ts`
**Estimativa:** 1.5h

```typescript
export class ToolCache {
  get(key: string): CachedResult | null;
  set(key: string, result: any, ttl: number): void;
  clear(): void;
}
```

### Task 6: Integrar com createAgent

**File:** Update existing `createAgent`
**Estimativa:** 1h

Adicionar suporte para `toolConfig` no createAgent.

### Task 7: Escrever Testes

**Files:** `tests/smart-tool-calling/*.test.ts`
**Estimativa:** 4h

- Unit tests para cada módulo
- Integration tests
- Coverage > 80%

### Task 8: Documentação

**Files:** README, docs, examples
**Estimativa:** 2h

- Atualizar README com exemplos
- Criar guia de migração
- Adicionar JSDoc

---

## 🧪 Estratégia de Testes

### Unit Tests

```typescript
describe("RetryLogic", () => {
  it("should retry when tool is not called");
  it("should stop after max retries");
  it("should enhance prompt on retry");
  it("should use fallback after max retries");
});

describe("PromptEnhancer", () => {
  it("should add tool usage instruction");
  it("should increase urgency on retries");
});

describe("ToolCache", () => {
  it("should cache results");
  it("should respect TTL");
  it("should generate correct keys");
});
```

### Integration Tests

```typescript
describe("Smart Tool Calling Integration", () => {
  it("should call tool successfully");
  it("should retry and succeed");
  it("should fallback to another provider");
  it("should use cached results");
});
```

---

## 📊 Métricas de Sucesso

- [ ] Tool calling success rate > 95%
- [ ] Average retries < 1.5
- [ ] Fallback usage < 10%
- [ ] Cache hit rate > 30%
- [ ] Test coverage > 80%
- [ ] Zero breaking changes

---

## 🚀 Deployment Plan

1. Implementar feature
2. Testar localmente
3. Commit e push
4. Create PR para `feat/v1.1.0`
5. Code review
6. Merge
7. Testar em feat/v1.1.0
8. Quando v1.1.0 estiver completa, merge para main

---

## 📝 Notes

- Manter backward compatibility
- Adicionar feature flags se necessário
- Documentar breaking changes (se houver)
- Considerar performance impact

---

**Status:** 🔴 Ready to Start
**Next Step:** Criar config.ts
