/**
 * Example: Using Ollama (Local LLM) Provider
 */

import { createAgent } from '../src';

async function main() {
  console.log('🤖 Ollama (Local LLM) Agent Example\n');
  console.log('='.repeat(60) + '\n');

  console.log('⚠️  Prerequisites:');
  console.log('   1. Install Ollama: https://ollama.ai');
  console.log('   2. Run: ollama serve');
  console.log('   3. Pull a model: ollama pull llama2\n');
  console.log('='.repeat(60) + '\n');

  // Create Ollama agent
  const agent = createAgent({
    provider: 'ollama',
    model: 'llama2', // or 'mistral', 'codellama', 'phi', etc.
    temperature: 0.7,
    // No API key needed for Ollama!
    // Connects to http://localhost:11434 by default
  });

  console.log('✅ Ollama agent created\n');

  // Example 1: Simple question
  console.log('📝 Example 1: Simple Question\n');
  try {
    const response1 = await agent.chat('What is the capital of France?');
    console.log('Response:', response1.content);
    console.log(`\nTokens used: ${response1.usage?.totalTokens}\n`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure Ollama is running: ollama serve');
    console.log('💡 And you have pulled a model: ollama pull llama2\n');
    return;
  }

  console.log('─'.repeat(60) + '\n');

  // Example 2: Code generation
  console.log('📝 Example 2: Code Generation\n');
  const codeAgent = createAgent({
    provider: 'ollama',
    model: 'codellama', // Specialized for code
    system: 'You are an expert programmer. Provide clear, working code examples.',
  });

  try {
    const response2 = await codeAgent.chat('Write a Python function to calculate fibonacci');
    console.log('Response:', response2.content.substring(0, 400) + '...');
    console.log(`\nTokens used: ${response2.usage?.totalTokens}\n`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('💡 Install codellama: ollama pull codellama\n');
  }

  console.log('─'.repeat(60) + '\n');

  // Example 3: Conversation
  console.log('📝 Example 3: Multi-turn Conversation\n');
  try {
    const messages = [
      { role: 'user' as const, content: 'Hi, I am learning JavaScript' },
    ];

    const response3a = await agent.chat(messages);
    console.log('Bot:', response3a.content);

    messages.push(
      { role: 'assistant' as const, content: response3a.content },
      { role: 'user' as const, content: 'Can you explain what a closure is?' }
    );

    const response3b = await agent.chat(messages);
    console.log('\nBot:', response3b.content.substring(0, 300) + '...');
    console.log(`\nTokens used: ${response3b.usage?.totalTokens}\n`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('─'.repeat(60) + '\n');

  // Example 4: Using different models
  console.log('📝 Example 4: Comparing Models\n');
  
  const models = ['llama2', 'mistral', 'phi'];
  const question = 'Explain quantum computing in one sentence';

  for (const model of models) {
    try {
      console.log(`\n🔹 Model: ${model}`);
      const modelAgent = createAgent({
        provider: 'ollama',
        model,
      });

      const response = await modelAgent.chat(question);
      console.log('Response:', response.content);
      console.log(`Tokens: ${response.usage?.totalTokens}`);
    } catch (error: any) {
      console.log(`❌ ${model} not available (run: ollama pull ${model})`);
    }
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Example 5: Custom Ollama host
  console.log('📝 Example 5: Custom Ollama Host\n');
  console.log('You can connect to a remote Ollama instance:\n');
  console.log(`
  // Set environment variable
  process.env.OLLAMA_HOST = 'http://192.168.1.100:11434';
  
  // Or pass in config
  const remoteAgent = createAgent({
    provider: 'ollama',
    model: 'llama2',
    // Will use OLLAMA_HOST env var
  });
  `);

  console.log('\n✅ Ollama examples completed!');
  console.log('\n💡 Tips:');
  console.log('   - Ollama is free and runs locally');
  console.log('   - No API key required');
  console.log('   - Great for privacy and offline use');
  console.log('   - Models: ollama.ai/library');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
