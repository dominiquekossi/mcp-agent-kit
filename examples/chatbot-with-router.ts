/**
 * Example: Chatbot with Router for intelligent LLM selection
 */

import { createChatbot, createLLMRouter } from '../src';

// Create router with intelligent rules
const router = createLLMRouter({
  rules: [
    // Short questions go to fast model
    {
      when: (input) => input.length < 100,
      use: { provider: 'openai', model: 'gpt-4-turbo-preview' },
    },
    // Code questions go to Claude
    {
      when: (input) => {
        const codeWords = ['code', 'function', 'class', 'programming'];
        return codeWords.some(word => input.toLowerCase().includes(word));
      },
      use: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    },
    // Default
    {
      default: true,
      use: { provider: 'openai', model: 'gpt-4-turbo-preview' },
    },
  ],
});

// Create chatbot with router
const bot = createChatbot({
  router,
  system: 'You are an expert programming assistant. Help users with code and technical questions.',
  maxHistory: 15,
});

async function main() {
  console.log('🤖 Chatbot with Router Example\n');
  console.log('This chatbot uses different LLMs based on the query type\n');
  console.log('='.repeat(60) + '\n');

  const conversation = [
    {
      message: 'Hi there!',
      expectedRoute: 'Short query → GPT-4 Turbo',
    },
    {
      message: 'Can you write a function to calculate fibonacci numbers?',
      expectedRoute: 'Code query → Claude',
    },
    {
      message: 'What is the time complexity of that function?',
      expectedRoute: 'Follow-up → GPT-4 Turbo',
    },
    {
      message: 'Can you help me debug this code: const x = [1,2,3]; x.push(4);',
      expectedRoute: 'Code query → Claude',
    },
  ];

  for (const { message, expectedRoute } of conversation) {
    console.log(`👤 User: ${message}`);
    console.log(`📍 Expected: ${expectedRoute}\n`);
    
    const response = await bot.chat(message);
    
    console.log(`🤖 Bot: ${response.substring(0, 150)}...\n`);
    console.log('─'.repeat(60) + '\n');
  }

  // Show stats
  const stats = bot.getStats();
  console.log('📊 Conversation Statistics:');
  console.log(`   Total messages: ${stats.messageCount}`);
  console.log(`   Duration: ${stats.oldestMessage && stats.newestMessage 
    ? Math.round((stats.newestMessage.getTime() - stats.oldestMessage.getTime()) / 1000) 
    : 0}s`);

  console.log('\n✅ Router-based chatbot example completed!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { bot };
