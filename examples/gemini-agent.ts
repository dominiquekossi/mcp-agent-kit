/**
 * Example: Using Google Gemini Provider
 */

import { createAgent } from '../src';

async function main() {
  console.log('🤖 Google Gemini Agent Example\n');
  console.log('='.repeat(60) + '\n');

  // Create Gemini agent
  const agent = createAgent({
    provider: 'gemini',
    model: 'gemini-2.0-flash-exp', // or 'gemini-pro'
    temperature: 0.7,
    // API key from GEMINI_API_KEY env var or pass directly:
    // apiKey: 'your-api-key'
  });

  console.log('✅ Gemini agent created\n');

  // Example 1: Simple question
  console.log('📝 Example 1: Simple Question\n');
  try {
    const response1 = await agent.chat('What are the main features of TypeScript?');
    console.log('Response:', response1.content);
    console.log(`\nTokens used: ${response1.usage?.totalTokens}\n`);
  } catch (error: any) {
    console.error('Error:', error.message);
  }

  console.log('─'.repeat(60) + '\n');

  // Example 2: With system prompt
  console.log('📝 Example 2: With System Prompt\n');
  const agentWithSystem = createAgent({
    provider: 'gemini',
    system: 'You are a helpful coding assistant. Always provide code examples.',
  });

  try {
    const response2 = await agentWithSystem.chat('How do I create a class in TypeScript?');
    console.log('Response:', response2.content.substring(0, 300) + '...');
    console.log(`\nTokens used: ${response2.usage?.totalTokens}\n`);
  } catch (error: any) {
    console.error('Error:', error.message);
  }

  console.log('─'.repeat(60) + '\n');

  // Example 3: Conversation with context
  console.log('📝 Example 3: Conversation with Context\n');
  try {
    const response3a = await agent.chat('My name is Alice');
    console.log('Bot:', response3a.content);

    const response3b = await agent.chat([
      { role: 'user', content: 'My name is Alice' },
      { role: 'assistant', content: response3a.content },
      { role: 'user', content: 'What is my name?' },
    ]);
    console.log('Bot:', response3b.content);
    console.log(`\nTokens used: ${response3b.usage?.totalTokens}\n`);
  } catch (error: any) {
    console.error('Error:', error.message);
  }

  console.log('─'.repeat(60) + '\n');

  // Example 4: Creative writing
  console.log('📝 Example 4: Creative Writing\n');
  const creativeAgent = createAgent({
    provider: 'gemini',
    temperature: 0.9, // Higher temperature for creativity
  });

  try {
    const response4 = await creativeAgent.chat(
      'Write a haiku about programming'
    );
    console.log('Haiku:\n');
    console.log(response4.content);
    console.log(`\nTokens used: ${response4.usage?.totalTokens}\n`);
  } catch (error: any) {
    console.error('Error:', error.message);
  }

  console.log('✅ Gemini examples completed!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
