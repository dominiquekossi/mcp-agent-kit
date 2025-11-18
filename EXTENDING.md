# 🔌 Extending mcp-agent-kit

Guide for extending **mcp-agent-kit** with custom providers, middleware, and plugins.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Creating Custom Providers](#creating-custom-providers)
- [Adding Middleware](#adding-middleware)
- [Custom Tools](#custom-tools)
- [Plugin System](#plugin-system)
- [Contributing](#contributing)

---

## Architecture Overview

**mcp-agent-kit** is built with extensibility in mind:

```
┌─────────────────────────────────────────┐
│           User Application              │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         mcp-agent-kit Core              │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │  Agent   │  │  Router  │           │
│  └────┬─────┘  └──────────┘           │
│       │                                │
│  ┌────▼──────────────────┐            │
│  │   Provider Interface  │            │
│  └────┬──────────────────┘            │
│       │                                │
│  ┌────▼────┐  ┌────────┐  ┌────────┐ │
│  │ OpenAI  │  │Anthropic│  │ Custom │ │
│  └─────────┘  └─────────┘  └────────┘ │
└─────────────────────────────────────────┘
```

---

## Creating Custom Providers

### Provider Interface

All providers must implement this interface:

```typescript
interface LLMProvider {
  chat(messages: AgentMessage[]): Promise<AgentResponse>;
}
```

### Example: Custom Provider

```typescript
// src/agent/providers/custom.ts
import { AgentConfig, AgentMessage, AgentResponse } from '../../types';
import { logger } from '../../core/logger';

export class CustomProvider {
  private config: AgentConfig;
  private apiKey: string;

  constructor(config: AgentConfig) {
    this.config = config;
    this.apiKey = config.apiKey || '';
  }

  async chat(messages: AgentMessage[]): Promise<AgentResponse> {
    try {
      logger.debug('CustomProvider: Processing request');

      // Your custom LLM API call here
      const response = await fetch('https://your-api.com/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          model: this.config.model || 'default-model',
          temperature: this.config.temperature ?? 0.7,
          max_tokens: this.config.maxTokens
        })
      });

      const data = await response.json();

      // Normalize response to AgentResponse format
      return {
        content: data.message || data.text || '',
        toolCalls: data.tool_calls?.map((tc: any) => ({
          name: tc.name,
          arguments: tc.arguments
        })),
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      };

    } catch (error: any) {
      logger.error('CustomProvider error:', error.message);
      throw new Error(`Custom API error: ${error.message}`);
    }
  }
}
```

### Registering Custom Provider

```typescript
// src/agent/createAgent.ts
import { CustomProvider } from './providers/custom';

// Add to createProvider method
private createProvider(): any {
  switch (this.config.provider) {
    case 'openai':
      return new OpenAIProvider(this.config);
    case 'anthropic':
      return new AnthropicProvider(this.config);
    case 'custom':
      return new CustomProvider(this.config);
    default:
      throw new Error(`Unknown provider: ${this.config.provider}`);
  }
}
```

### Using Custom Provider

```typescript
import { createAgent } from 'mcp-agent-kit';

const agent = createAgent({
  provider: 'custom' as any,
  apiKey: 'your-api-key',
  model: 'your-model'
});

const response = await agent.chat('Hello!');
```

---

## Adding Middleware

### Middleware Pattern

Middleware allows you to intercept and modify requests/responses:

```typescript
// src/middleware/types.ts
export interface Middleware {
  name: string;
  onRequest?: (messages: AgentMessage[]) => AgentMessage[];
  onResponse?: (response: AgentResponse) => AgentResponse;
  onError?: (error: Error) => Error;
}
```

### Example: Logging Middleware

```typescript
// src/middleware/logging.ts
import { Middleware } from './types';
import { logger } from '../core/logger';

export const loggingMiddleware: Middleware = {
  name: 'logging',
  
  onRequest: (messages) => {
    logger.info(`Request: ${messages.length} messages`);
    return messages;
  },
  
  onResponse: (response) => {
    logger.info(`Response: ${response.content.length} chars`);
    return response;
  },
  
  onError: (error) => {
    logger.error(`Error: ${error.message}`);
    return error;
  }
};
```

### Example: Content Filter Middleware

```typescript
// src/middleware/contentFilter.ts
import { Middleware } from './types';

export const contentFilterMiddleware: Middleware = {
  name: 'content-filter',
  
  onRequest: (messages) => {
    // Filter inappropriate content
    return messages.map(msg => ({
      ...msg,
      content: msg.content.replace(/badword/gi, '***')
    }));
  },
  
  onResponse: (response) => {
    // Filter response content
    return {
      ...response,
      content: response.content.replace(/badword/gi, '***')
    };
  }
};
```

### Using Middleware

```typescript
// Future API (not yet implemented)
const agent = createAgent({
  provider: 'openai',
  middleware: [
    loggingMiddleware,
    contentFilterMiddleware
  ]
});
```

---

## Custom Tools

### Tool Structure

```typescript
interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<any>;
}
```

### Example: Database Tool

```typescript
const databaseTool: AgentTool = {
  name: 'query_database',
  description: 'Query the database',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'SQL query to execute'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results',
        default: 10
      }
    },
    required: ['query']
  },
  handler: async ({ query, limit = 10 }) => {
    // Your database logic
    const db = await connectToDatabase();
    const results = await db.query(query, { limit });
    return results;
  }
};
```

### Example: File System Tool

```typescript
import * as fs from 'fs/promises';

const fileSystemTool: AgentTool = {
  name: 'read_file',
  description: 'Read contents of a file',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path to read'
      }
    },
    required: ['path']
  },
  handler: async ({ path }) => {
    try {
      const content = await fs.readFile(path, 'utf-8');
      return { success: true, content };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};
```

### Example: API Integration Tool

```typescript
import { api } from 'mcp-agent-kit';

const weatherTool: AgentTool = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or coordinates'
      },
      units: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    required: ['location']
  },
  handler: async ({ location, units = 'celsius' }) => {
    const response = await api.get(
      `https://api.weather.com/v1/current`,
      {
        name: 'weather-api',
        query: { location, units },
        timeout: 5000
      }
    );
    return response.data;
  }
};
```

### Using Custom Tools

```typescript
const agent = createAgent({
  provider: 'openai',
  tools: [
    databaseTool,
    fileSystemTool,
    weatherTool
  ]
});

const response = await agent.chat('What is the weather in London?');
```

---

## Plugin System

### Plugin Interface (Future)

```typescript
interface Plugin {
  name: string;
  version: string;
  install: (kit: MCPAgentKit) => void;
  uninstall?: () => void;
}
```

### Example: Analytics Plugin

```typescript
const analyticsPlugin: Plugin = {
  name: 'analytics',
  version: '1.0.0',
  
  install: (kit) => {
    // Add analytics tracking
    kit.on('agent:request', (data) => {
      trackEvent('agent_request', data);
    });
    
    kit.on('agent:response', (data) => {
      trackEvent('agent_response', data);
    });
  },
  
  uninstall: () => {
    // Cleanup
  }
};
```

### Example: Caching Plugin

```typescript
const cachingPlugin: Plugin = {
  name: 'caching',
  version: '1.0.0',
  
  install: (kit) => {
    const cache = new Map();
    
    kit.middleware.add({
      name: 'cache',
      onRequest: (messages) => {
        const key = JSON.stringify(messages);
        if (cache.has(key)) {
          return cache.get(key);
        }
        return messages;
      },
      onResponse: (response) => {
        // Cache response
        return response;
      }
    });
  }
};
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
handler: async (params) => {
  try {
    // Your logic
    return result;
  } catch (error: any) {
    logger.error('Tool error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 2. Validation

Validate inputs before processing:

```typescript
handler: async ({ path }) => {
  if (!path || typeof path !== 'string') {
    throw new Error('Invalid path parameter');
  }
  
  if (!path.startsWith('/safe/directory/')) {
    throw new Error('Access denied');
  }
  
  // Process...
}
```

### 3. Logging

Use the built-in logger:

```typescript
import { logger } from 'mcp-agent-kit';

logger.debug('Debug info');
logger.info('Info message');
logger.warn('Warning');
logger.error('Error occurred');
```

### 4. Type Safety

Always use TypeScript types:

```typescript
import { AgentTool, AgentMessage, AgentResponse } from 'mcp-agent-kit';

const myTool: AgentTool = {
  // Fully typed
};
```

---

## Contributing

Want to contribute a provider or plugin?

1. Fork the repository
2. Create your feature in a new branch
3. Add tests
4. Update documentation
5. Submit a pull request

### Guidelines

- Follow existing code style
- Add TypeScript types
- Include tests
- Update README if needed
- Add examples

---

## Future Roadmap

Planned extensibility features:

- [ ] Plugin system
- [ ] Middleware support
- [ ] Custom transport layers
- [ ] Event system
- [ ] Streaming support
- [ ] Custom serializers
- [ ] Provider marketplace

---

## Resources

- [GitHub Repository](https://github.com/dominiquekossi/mcp-agent-kit)
- [API Documentation](https://github.com/dominiquekossi/mcp-agent-kit/wiki)
- [Examples](https://github.com/dominiquekossi/mcp-agent-kit/tree/main/examples)

---

Made with ❤️ by the mcp-agent-kit community
