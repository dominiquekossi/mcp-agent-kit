# Roadmap - Version 1.1.0

## 🎯 Objetivo da Release

Adicionar features essenciais de confiabilidade e observabilidade ao mcp-agent-kit.

## 📦 Version Bump

- **Current:** 1.0.0
- **Target:** 1.1.0
- **Type:** Minor (new features, backward compatible)

## 🚀 Features Principais

### 1. Smart Tool Calling ⭐

**Priority:** HIGH
**Status:** 🔴 Not Started
**Assignee:** TBD
**Estimated:** 1 week

Garante que tools sejam chamadas de forma confiável com retry e fallback.

**Tasks:**

- [ ] Implementar retry logic
- [ ] Implementar prompt enhancement
- [ ] Implementar fallback provider
- [ ] Adicionar testes
- [ ] Documentar API

**Files:**

- `src/agent/smart-tool-calling.ts` (new)
- `src/agent/createAgent.ts` (update)
- `tests/smart-tool-calling.test.ts` (new)

### 2. Cost Tracking & Budget Management ⭐

**Priority:** HIGH
**Status:** 🔴 Not Started
**Assignee:** TBD
**Estimated:** 1 week

Tracking de custos em tempo real com budget limits e alertas.

**Tasks:**

- [ ] Implementar cost calculator
- [ ] Implementar budget tracker
- [ ] Implementar alertas
- [ ] Adicionar export (JSON/CSV)
- [ ] Adicionar testes
- [ ] Documentar API

**Files:**

- `src/tracking/cost-tracker.ts` (new)
- `src/tracking/budget-manager.ts` (new)
- `tests/cost-tracking.test.ts` (new)

### 3. Enhanced Logging & Debugging

**Priority:** MEDIUM
**Status:** 🔴 Not Started
**Assignee:** TBD
**Estimated:** 3 days

Logs estruturados e debug mode para melhor observabilidade.

**Tasks:**

- [ ] Implementar structured logging
- [ ] Adicionar debug mode
- [ ] Adicionar tool call tracing
- [ ] Adicionar performance metrics
- [ ] Documentar

**Files:**

- `src/core/logger.ts` (update)
- `src/core/debug.ts` (new)

### 4. Testing Utilities

**Priority:** MEDIUM  
**Status:** 🔴 Not Started
**Assignee:** TBD
**Estimated:** 3 days

Mocks e helpers para facilitar testes.

**Tasks:**

- [ ] Criar mock agent
- [ ] Criar mock tools
- [ ] Criar test helpers
- [ ] Adicionar exemplos
- [ ] Documentar

**Files:**

- `src/testing/mocks.ts` (new)
- `src/testing/helpers.ts` (new)
- `examples/testing-example.ts` (new)

## 📝 Documentation Updates

- [ ] Update README.md
- [ ] Add CHANGELOG.md entry
- [ ] Update API documentation
- [ ] Add migration guide (1.0 → 1.1)
- [ ] Add examples for new features

## 🧪 Testing Requirements

- [ ] Unit tests for all new features
- [ ] Integration tests
- [ ] Coverage > 80%
- [ ] All existing tests passing

## 📊 Success Metrics

- ✅ All features implemented
- ✅ Tests passing
- ✅ Documentation complete
- ✅ No breaking changes
- ✅ Performance maintained or improved

## 🗓️ Timeline

**Week 1:** Smart Tool Calling
**Week 2:** Cost Tracking
**Week 3:** Logging + Testing Utilities
**Week 4:** Documentation + Release

**Target Release Date:** 4 weeks from start

## 🔄 Release Process

1. Create branch `feat/v1.1.0` from `main`
2. Implement features
3. Update version in package.json
4. Update CHANGELOG.md
5. Create PR to `main`
6. Review and test
7. Merge to `main`
8. Tag release `v1.1.0`
9. Publish to npm
10. Announce release

## 📢 Communication

- [ ] Blog post about new features
- [ ] Twitter announcement
- [ ] GitHub release notes
- [ ] Update documentation site
