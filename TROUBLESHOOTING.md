# 🔧 Troubleshooting Guide

Common issues and solutions for **mcp-agent-kit**.

## Table of Contents

- [Installation Issues](#installation-issues)
- [API Key Errors](#api-key-errors)
- [Agent Errors](#agent-errors)
- [MCP Server Issues](#mcp-server-issues)
- [Router Problems](#router-problems)
- [Network Errors](#network-errors)
- [TypeScript Issues](#typescript-issues)

---

## Installation Issues

### Error: Cannot find module 'mcp-agent-kit'

**Problem:** Package not installed correctly.

**Solution:**
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error: Peer dependency warnings

**Problem:** Missing peer dependencies.

**Solution:**
```bash
npm install --legacy-peer-deps
```

---

## API Key Errors

### Error: "API key for openai not found"

**Problem:** OpenAI API key not configured.

**Solutions:**

1. **Set environment variable:**
```bash
export OPENAI_API_KEY=sk-...
```

2. **Use .env file:**
```bash
# .env
OPENAI_API_KEY=sk-...
```

3. **Pass in code:**
```typescript
const agent = createAgent({
  provider: 'openai',
  apiKey: 'sk-...'
});
```

### Error: "Invalid API key"

**Problem:** API key is incorrect or expired.

**Solutions:**

1. Verify your API key at:
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/
   - Google: https://makersuite.google.com/app/apikey

2. Check for extra spaces or newlines in your key

3. Regenerate a new API key if needed

---

## Agent Errors

### Error: "Unknown provider: xyz"

**Problem:** Provider not supported.

**Solution:**

Supported providers are: `openai`, `anthropic`, `gemini`, `ollama`

```typescript
const agent = createAgent({
  provider: 'openai' // Must be one of the supported providers
});
```

### Error: "Model not found"

**Problem:** Model name is incorrect or not available.

**Solutions:**

1. **Check model names:**
```typescript
// OpenAI
model: 'gpt-4-turbo-preview'  // ✅ Correct
model: 'gpt-4-turbo'           // ❌ Wrong

// Anthropic
model: 'claude-3-5-sonnet-20241022'  // ✅ Correct
model: 'claude-3.5-sonnet'           // ❌ Wrong
```

2. **Use default models:**
```typescript
const agent = createAgent({
  provider: 'openai'
  // model is optional, uses smart default
});
```

### Error: "Rate limit exceeded"

**Problem:** Too many requests to LLM API.

**Solutions:**

1. **Add delays between requests:**
```typescript
await agent.chat('Message 1');
await new Promise(r => setTimeout(r, 1000)); // Wait 1 second
await agent.chat('Message 2');
```

2. **Use router with fallback:**
```typescript
const router = createLLMRouter({
  rules: [...],
  fallback: { provider: 'anthropic' } // Switch provider on failure
});
```

3. **Upgrade your API plan**

---

## MCP Server Issues

### Error: "Port already in use"

**Problem:** Another process is using the port.

**Solutions:**

1. **Use a different port:**
```typescript
const server = createMCPServer({
  port: 8080 // Try different port
});
```

2. **Kill the process using the port:**
```bash
# Find process
lsof -i :7777

# Kill it
kill -9 <PID>
```

### Error: "Tool not found"

**Problem:** Tool name doesn't match.

**Solution:**

Ensure tool names match exactly:

```typescript
// Register tool
const server = createMCPServer({
  tools: [{
    name: 'get_weather', // ✅ Use snake_case
    // ...
  }]
});

// Call tool - name must match exactly
// Tool will be called as 'get_weather'
```

### Server not receiving connections

**Problem:** Transport configuration issue.

**Solutions:**

1. **Check transport type:**
```typescript
// For stdio (default)
await server.start();

// For WebSocket
await server.start('websocket');
```

2. **Verify client configuration matches server**

3. **Check firewall settings for WebSocket**

---

## Router Problems

### Router always uses default rule

**Problem:** Rules not matching correctly.

**Solutions:**

1. **Check rule order:**
```typescript
const router = createLLMRouter({
  rules: [
    // Specific rules first
    { when: (input) => input.includes('code'), use: {...} },
    
    // Default rule last
    { default: true, use: {...} }
  ]
});
```

2. **Debug rule matching:**
```typescript
const router = createLLMRouter({
  rules: [...],
  logLevel: 'debug' // See which rules match
});
```

3. **Test your when functions:**
```typescript
const testInput = 'Write code';
const rule = { when: (input) => input.includes('code') };
console.log(rule.when(testInput)); // Should be true
```

### Error: "All routing attempts failed"

**Problem:** All providers failed and no fallback.

**Solutions:**

1. **Add fallback:**
```typescript
const router = createLLMRouter({
  rules: [...],
  fallback: { provider: 'openai' }
});
```

2. **Increase retry attempts:**
```typescript
const router = createLLMRouter({
  rules: [...],
  retryAttempts: 5
});
```

---

## Network Errors

### Error: "ECONNREFUSED"

**Problem:** Cannot connect to API or server.

**Solutions:**

1. **Check internet connection**

2. **Verify API endpoint:**
```typescript
// For Ollama
OLLAMA_HOST=http://localhost:11434  // ✅ Correct
OLLAMA_HOST=localhost:11434          // ❌ Missing http://
```

3. **Check firewall/proxy settings**

### Error: "ETIMEDOUT"

**Problem:** Request timed out.

**Solutions:**

1. **Increase timeout:**
```typescript
const response = await api.request({
  url: '...',
  timeout: 60000 // 60 seconds
});
```

2. **Check network speed**

3. **Use retry:**
```typescript
const response = await api.request({
  url: '...',
  retries: 5
});
```

### Error: "Certificate error"

**Problem:** SSL/TLS certificate issue.

**Solutions:**

1. **Update Node.js to latest version**

2. **For development only (not recommended for production):**
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

---

## TypeScript Issues

### Error: "Cannot find type definitions"

**Problem:** TypeScript types not found.

**Solution:**

```bash
npm install --save-dev @types/node @types/ws
```

### Error: "Module not found" in TypeScript

**Problem:** Import path incorrect.

**Solutions:**

1. **Use correct imports:**
```typescript
// ✅ Correct
import { createAgent } from 'mcp-agent-kit';

// ❌ Wrong
import { createAgent } from 'mcp-agent-kit/dist/agent';
```

2. **Check tsconfig.json:**
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

### Type errors with agent responses

**Problem:** TypeScript doesn't recognize response types.

**Solution:**

```typescript
import { AgentResponse } from 'mcp-agent-kit';

const response: AgentResponse = await agent.chat('Hello');
```

---

## Chatbot Issues

### Chatbot loses context

**Problem:** History limit too small.

**Solution:**

```typescript
const bot = createChatbot({
  agent,
  maxHistory: 20 // Increase history size
});
```

### Chatbot responses inconsistent

**Problem:** No system prompt set.

**Solution:**

```typescript
const bot = createChatbot({
  agent,
  system: 'You are a helpful assistant. Always be consistent and clear.'
});
```

---

## Debugging Tips

### Enable Debug Logging

```typescript
// For specific components
const agent = createAgent({
  provider: 'openai',
  logLevel: 'debug'
});

// Or set globally
process.env.LOG_LEVEL = 'debug';
```

### Check Package Version

```bash
npm list mcp-agent-kit
```

### Verify Environment

```typescript
import { getEnv } from 'mcp-agent-kit';

const env = getEnv();
console.log(env);
```

---

## Still Having Issues?

1. **Check GitHub Issues:** https://github.com/dominiquekossi/mcp-agent-kit/issues
2. **Ask in Discussions:** https://github.com/dominiquekossi/mcp-agent-kit/discussions
3. **Email Support:** houessoudominique@gmail.com

When reporting issues, please include:
- Package version
- Node.js version
- Operating system
- Error message (full stack trace)
- Minimal code to reproduce the issue

---

## Common Gotchas

### 1. API Keys in Code

❌ **Don't do this:**
```typescript
const agent = createAgent({
  provider: 'openai',
  apiKey: 'sk-1234567890' // Hardcoded key
});
```

✅ **Do this:**
```typescript
// Use environment variables
const agent = createAgent({
  provider: 'openai'
  // Reads from OPENAI_API_KEY automatically
});
```

### 2. Async/Await

❌ **Don't forget await:**
```typescript
const response = agent.chat('Hello'); // Returns Promise!
console.log(response); // [object Promise]
```

✅ **Always use await:**
```typescript
const response = await agent.chat('Hello');
console.log(response.content); // Actual response
```

### 3. Error Handling

❌ **No error handling:**
```typescript
const response = await agent.chat('Hello'); // May throw
```

✅ **Always handle errors:**
```typescript
try {
  const response = await agent.chat('Hello');
} catch (error) {
  console.error('Agent error:', error.message);
}
```

---

Made with ❤️ by the mcp-agent-kit team
