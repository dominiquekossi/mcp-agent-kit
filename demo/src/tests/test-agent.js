import { createAgent } from 'mcp-agent-kit';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Basic Agents\n');

async function testGroq() {
  console.log('1️⃣  Testing Groq (llama3-70b-8192)...');
  try {
    const agent = createAgent({
      provider: 'openai',
      model: 'llama3-70b-8192',
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    });

    const response = await agent.chat('What is TypeScript? Answer in one sentence.');
    console.log('✅ Groq Response:', response.content);
    console.log('   Tokens:', response.usage?.totalTokens || 'N/A');
  } catch (error) {
    console.error('❌ Groq Error:', error.message);
  }
  console.log('');
}

async function testGemini() {
  console.log('2️⃣  Testing Gemini (gemini-2.0-flash-exp)...');
  try {
    const agent = createAgent({
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      apiKey: process.env.GEMINI_API_KEY
    });

    const response = await agent.chat('What is Node.js? Answer in one sentence.');
    console.log('✅ Gemini Response:', response.content);
  } catch (error) {
    console.error('❌ Gemini Error:', error.message);
  }
  console.log('');
}

async function testOpenAI() {
  console.log('3️⃣  Testing OpenAI (gpt-4-turbo-preview)...');
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  OpenAI API key not found, skipping...');
      return;
    }

    const agent = createAgent({
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await agent.chat('What is Express.js? Answer in one sentence.');
    console.log('✅ OpenAI Response:', response.content);
    console.log('   Tokens:', response.usage?.totalTokens || 'N/A');
  } catch (error) {
    console.error('❌ OpenAI Error:', error.message);
  }
  console.log('');
}

async function testAnthropic() {
  console.log('4️⃣  Testing Anthropic (claude-3-5-sonnet)...');
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('⚠️  Anthropic API key not found, skipping...');
      return;
    }

    const agent = createAgent({
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await agent.chat('What is REST API? Answer in one sentence.');
    console.log('✅ Anthropic Response:', response.content);
  } catch (error) {
    console.error('❌ Anthropic Error:', error.message);
  }
  console.log('');
}

async function runTests() {
  await testGroq();
  await testGemini();
  await testOpenAI();
  await testAnthropic();
  
  console.log('✨ Agent tests completed!\n');
}

runTests().catch(console.error);
