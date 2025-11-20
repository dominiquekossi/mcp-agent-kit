import { createChatbot, createAgent } from 'mcp-agent-kit';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Chatbot with Memory\n');

async function testChatbot() {
  console.log('1️⃣  Creating chatbot...');
  
  const agent = createAgent({
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY
  });

  const bot = createChatbot({
    agent,
    system: 'You are a helpful programming assistant. Keep responses concise.',
    maxHistory: 10
  });

  console.log('✅ Chatbot created\n');

  // Test conversation with memory
  console.log('2️⃣  Testing conversation memory...');
  
  try {
    console.log('   User: Hi, my name is John');
    const response1 = await bot.chat('Hi, my name is John');
    console.log('   Bot:', response1.content);
    
    console.log('\n   User: What programming language should I learn?');
    const response2 = await bot.chat('What programming language should I learn?');
    console.log('   Bot:', response2.content.substring(0, 150) + '...');
    
    console.log('\n   User: What is my name?');
    const response3 = await bot.chat('What is my name?');
    console.log('   Bot:', response3.content);
    
    // Check if bot remembers
    if (response3.content.toLowerCase().includes('john')) {
      console.log('\n✅ Memory working! Bot remembered the name.');
    } else {
      console.log('\n⚠️  Bot might not have remembered the name.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('');

  // Test stats
  console.log('3️⃣  Checking conversation stats...');
  const stats = bot.getStats();
  console.log('   Stats:', stats);
  
  const history = bot.getHistory();
  console.log('   History length:', history.length);
  
  console.log('');

  // Test reset
  console.log('4️⃣  Testing reset...');
  bot.reset();
  const newHistory = bot.getHistory();
  console.log('   History after reset:', newHistory.length);
  
  if (newHistory.length === 0) {
    console.log('✅ Reset working!');
  }
  
  console.log('\n✨ Chatbot tests completed!\n');
}

testChatbot().catch(console.error);
