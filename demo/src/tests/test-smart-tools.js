import { createAgent } from 'mcp-agent-kit';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Smart Tool Calling (v1.1.0)\n');

async function testRetryLogic() {
  console.log('1️⃣  Testing Retry Logic...');
  
  let attempts = 0;
  
  const agent = createAgent({
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    toolConfig: {
      maxRetries: 3,
      debug: true
    },
    tools: [
      {
        name: 'flaky_tool',
        description: 'A tool that fails sometimes',
        parameters: {
          type: 'object',
          properties: {
            input: { type: 'string' }
          },
          required: ['input']
        },
        handler: async ({ input }) => {
          attempts++;
          console.log(`   Attempt ${attempts}...`);
          
          if (attempts < 2) {
            throw new Error('Simulated failure');
          }
          
          return { success: true, attempts, input };
        }
      }
    ]
  });

  try {
    const result = await agent.executeTool('flaky_tool', { input: 'test' });
    console.log('✅ Tool succeeded after retries:', result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('');
}

async function testTimeout() {
  console.log('2️⃣  Testing Timeout...');
  
  const agent = createAgent({
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    toolConfig: {
      toolTimeout: 2000, // 2 seconds
      debug: true
    },
    tools: [
      {
        name: 'slow_tool',
        description: 'A slow tool',
        parameters: {
          type: 'object',
          properties: {
            delay: { type: 'number' }
          },
          required: ['delay']
        },
        handler: async ({ delay }) => {
          console.log(`   Waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return { completed: true };
        }
      }
    ]
  });

  try {
    // This should timeout
    await agent.executeTool('slow_tool', { delay: 5000 });
    console.log('❌ Should have timed out!');
  } catch (error) {
    console.log('✅ Correctly timed out:', error.message);
  }
  console.log('');
}

async function testCaching() {
  console.log('3️⃣  Testing Result Caching...');
  
  let callCount = 0;
  
  const agent = createAgent({
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    toolConfig: {
      cacheResults: {
        enabled: true,
        ttl: 60000, // 1 minute
        maxSize: 100
      },
      debug: true
    },
    tools: [
      {
        name: 'expensive_calculation',
        description: 'An expensive calculation',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' }
          },
          required: ['x', 'y']
        },
        handler: async ({ x, y }) => {
          callCount++;
          console.log(`   Calculation called (count: ${callCount})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return { result: x + y, callCount };
        }
      }
    ]
  });

  try {
    console.log('   First call (should execute)...');
    const result1 = await agent.executeTool('expensive_calculation', { x: 5, y: 3 });
    console.log('   Result:', result1);

    console.log('   Second call (should use cache)...');
    const result2 = await agent.executeTool('expensive_calculation', { x: 5, y: 3 });
    console.log('   Result:', result2);

    if (result1.callCount === result2.callCount) {
      console.log('✅ Cache working! Same call count:', result1.callCount);
    } else {
      console.log('❌ Cache not working');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('');
}

async function testForceToolUse() {
  console.log('4️⃣  Testing Force Tool Use...');
  
  const agent = createAgent({
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    toolConfig: {
      forceToolUse: true,
      debug: true
    },
    tools: [
      {
        name: 'get_weather',
        description: 'Get weather information',
        parameters: {
          type: 'object',
          properties: {
            city: { type: 'string' }
          },
          required: ['city']
        },
        handler: async ({ city }) => {
          return { city, temp: 72, condition: 'Sunny' };
        }
      }
    ]
  });

  try {
    const response = await agent.chat('What is the weather in San Francisco?');
    console.log('✅ Response:', response.content);
    if (response.toolCalls && response.toolCalls.length > 0) {
      console.log('   Tools called:', response.toolCalls.map(t => t.name).join(', '));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('');
}

async function runTests() {
  await testRetryLogic();
  await testTimeout();
  await testCaching();
  await testForceToolUse();
  
  console.log('✨ Smart Tool Calling tests completed!\n');
}

runTests().catch(console.error);
