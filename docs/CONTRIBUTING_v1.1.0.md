# Contributing to v1.1.0

## 🎯 Overview

This guide explains how to contribute to the v1.1.0 release.

## 🌿 Branch Strategy

```
main (v1.0.0 - production)
  └── feat/v1.1.0 (development branch)
       ├── feat/smart-tool-calling
       ├── feat/cost-tracking
       ├── feat/enhanced-logging
       └── feat/testing-utilities
```

## 🚀 Getting Started

### 1. Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/dominiquekossi/mcp-agent-kit.git
cd mcp-agent-kit

# Checkout the development branch
git checkout feat/v1.1.0

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

### 2. Create Feature Branch

```bash
# Create your feature branch from feat/v1.1.0
git checkout feat/v1.1.0
git pull origin feat/v1.1.0
git checkout -b feat/your-feature-name
```

### 3. Development Workflow

```bash
# Make your changes
# ...

# Run tests
npm test

# Run linter
npm run lint

# Build
npm run build

# Commit your changes
git add .
git commit -m "feat: add your feature description"

# Push to your branch
git push origin feat/your-feature-name
```

### 4. Create Pull Request

- Create PR targeting `feat/v1.1.0` (NOT main)
- Fill in the PR template
- Request review
- Address feedback
- Merge when approved

## 📋 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add smart tool calling
fix: resolve retry logic bug
docs: update API documentation
test: add cost tracking tests
chore: update dependencies
```

## 🧪 Testing Requirements

- All new code must have tests
- Maintain > 80% coverage
- All tests must pass
- No breaking changes

## 📝 Documentation

- Update README.md if needed
- Add JSDoc comments
- Update CHANGELOG.md
- Add examples

## 🔍 Code Review Checklist

- [ ] Code follows project style
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Performance considered
- [ ] Security considered

## 📞 Questions?

- Open an issue
- Ask in Discord
- Email: support@mcp-agent-kit.dev
