import { createLLMRouter } from 'mcp-agent-kit';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing LLM Router\n');

async function testRouter() {
  console.log('1️⃣  Creating router with rules...');
  
  const router = createLLMRouter({
    rules: [
      {
        when: (input) => input.toLowerCase().includes('code'),
        use: {
          provider: 'openai',
          model: 'llama3-70b-8192',
          apiKey: process.env.GROQ_API_KEY,
          baseURL: 'https://api.groq.com/openai/v1'
        }
      },
      {
        when: (input) => input.length < 50,
        use: {
          provider: 'gemini',
          model: 'gemini-2.0-flash-exp',
          apiKey: process.env.GEMINI_API_KEY
        }
      },
      {
        default: true,
        use: {
          provider: 'openai',
          model: 'llama3-70b-8192',
          apiKey: process.env.GROQ_API_KEY,
          baseURL: 'https://api.groq.com/openai/v1'
        }
      }
    ],
    fallback: {
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      apiKey: process.env.GEMINI_API_KEY
    },
    retryAttempts: 2,
    logLevel: 'info'
  });

  console.log('✅ Router created');
  console.log('   Stats:', router.getStats());
  console.log('   Agents:', router.listAgents());
  console.log('');

  // Test routing
  console.log('2️⃣  Testing routing...');
  
  try {
    console.log('   Query 1 (should use Groq - contains "code"):');
    const response1 = await router.route('Explain how to write clean code');
    console.log('   ✅', response1.content.substring(0, 100) + '...');
    
    console.log('\n   Query 2 (should use Gemini - short):');
    const response2 = await router.route('What is AI?');
    console.log('   ✅', response2.content.substring(0, 100) + '...');
    
    console.log('\n   Query 3 (should use default):');
    const response3 = await router.route('Tell me about software architecture patterns');
    console.log('   ✅', response3.content.substring(0, 100) + '...');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n✨ Router tests completed!\n');
}

testRouter().catch(console.error);
