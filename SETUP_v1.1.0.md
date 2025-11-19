# Setup v1.1.0 Development Branch

## 🎯 Objetivo

Criar branch de desenvolvimento para versão 1.1.0 com todas as melhorias planejadas.

## 📋 Passos Manuais

### 1. Garantir que está na branch main atualizada

```bash
git checkout main
git pull origin main
```

### 2. Criar nova branch de desenvolvimento

```bash
git checkout -b feat/v1.1.0
```

### 3. Atualizar versão no package.json

```bash
npm version 1.1.0-dev --no-git-tag-version
```

### 4. Criar estrutura de diretórios

```bash
mkdir -p src/agent/smart-tool-calling
mkdir -p src/tracking
mkdir -p src/testing
mkdir -p tests/smart-tool-calling
mkdir -p tests/tracking
mkdir -p tests/testing
```

### 5. Criar CHANGELOG.md

Criar arquivo `CHANGELOG.md` com o seguinte conteúdo:

```markdown
# Changelog

## [1.1.0-dev] - In Development

### Added

- Smart Tool Calling with retry and fallback
- Cost Tracking and Budget Management
- Enhanced Logging and Debugging
- Testing Utilities (mocks and helpers)

### Changed

- Improved error messages
- Better TypeScript types

## [1.0.0] - Initial Release

### Added

- Basic agent creation
- MCP server support
- Chatbot with memory
- LLM router
- API helpers
```

### 6. Commit e push

```bash
git add .
git commit -m "chore: initialize v1.1.0 development branch"
git push -u origin feat/v1.1.0
```

### 7. Verificar

```bash
git branch
# Deve mostrar: * feat/v1.1.0

git log --oneline -1
# Deve mostrar o commit de inicialização
```

## ✅ Checklist

- [ ] Branch feat/v1.1.0 criada
- [ ] Versão atualizada para 1.1.0-dev
- [ ] Estrutura de diretórios criada
- [ ] CHANGELOG.md criado
- [ ] Documentação organizada em docs/
- [ ] Commit e push realizados

## 📚 Próximos Passos

1. Revisar [docs/ROADMAP_v1.1.0.md](docs/ROADMAP_v1.1.0.md)
2. Escolher uma feature para implementar
3. Criar branch da feature: `git checkout -b feat/nome-da-feature`
4. Implementar seguindo o proposal em docs/
5. Criar PR para feat/v1.1.0

## 🎯 Features Prioritárias

1. **Smart Tool Calling** - [docs/FEATURE_PROPOSAL_SMART_TOOL_CALLING.md](docs/FEATURE_PROPOSAL_SMART_TOOL_CALLING.md)
2. **Cost Tracking** - [docs/FEATURE_PROPOSAL_COST_TRACKING.md](docs/FEATURE_PROPOSAL_COST_TRACKING.md)

## 📞 Dúvidas?

Consulte [docs/CONTRIBUTING_v1.1.0.md](docs/CONTRIBUTING_v1.1.0.md)
