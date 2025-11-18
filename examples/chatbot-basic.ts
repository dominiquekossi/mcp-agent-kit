/**
 * Example: Basic Chatbot with Agent
 */

import { createChatbot, createAgent } from '../src';

// Create agent
const agent = createAgent({
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
});

// Create chatbot with agent
const bot = createChatbot({
  agent,
  system: 'You are a helpful and friendly AI assistant. Keep responses concise and clear.',
  maxHistory: 10,
});

async function main() {
  console.log('🤖 Chatbot Example - Basic Conversation\n');
  console.log('System:', bot.getSystemPrompt());
  console.log('\n' + '='.repeat(60) + '\n');

  // Simulate a conversation
  const conversation = [
    'Hello! What can you help me with?',
    'Can you explain what TypeScript is?',
    'What are the main benefits compared to JavaScript?',
    'Thanks! Can you give me a simple example?',
  ];

  for (const userMessage of conversation) {
    console.log(`👤 User: ${userMessage}\n`);
    
    const response = await bot.chat(userMessage);
    
    console.log(`🤖 Bot: ${response}\n`);
    console.log('─'.repeat(60) + '\n');
  }

  // Show conversation stats
  const stats = bot.getStats();
  console.log('📊 Conversation Statistics:');
  console.log(`   Total messages: ${stats.messageCount}`);
  console.log(`   User messages: ${stats.userMessages}`);
  console.log(`   Bot messages: ${stats.assistantMessages}`);
  console.log(`   Started: ${stats.oldestMessage?.toLocaleTimeString()}`);
  console.log(`   Last message: ${stats.newestMessage?.toLocaleTimeString()}`);

  // Show full history
  console.log('\n📜 Full History:');
  bot.getHistory().forEach((msg, i) => {
    const icon = msg.role === 'user' ? '👤' : '🤖';
    console.log(`${i + 1}. ${icon} [${msg.timestamp.toLocaleTimeString()}] ${msg.content.substring(0, 50)}...`);
  });

  // Reset and start new conversation
  console.log('\n🔄 Resetting conversation...\n');
  bot.reset();
  
  const newResponse = await bot.chat('Hi! This is a new conversation.');
  console.log(`🤖 Bot: ${newResponse}\n`);
  
  console.log('✅ Example completed!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { bot };
