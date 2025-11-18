/**
 * Example: LLM Router with intelligent routing rules
 */

import { createLLMRouter } from '../src';

// Create router with multiple routing rules
const router = createLLMRouter({
  logLevel: 'debug',
  retryAttempts: 3,
  
  rules: [
    // Rule 1: Short messages go to GPT-4 Turbo (fast and cheap)
    {
      when: (input) => input.length < 200,
      use: {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
      },
    },
    
    // Rule 2: Code-related queries go to Claude (excellent at coding)
    {
      when: (input) => {
        const codeKeywords = ['code', 'function', 'class', 'debug', 'error', 'bug'];
        return codeKeywords.some(keyword => input.toLowerCase().includes(keyword));
      },
      use: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      },
    },
    
    // Rule 3: Analysis queries go to Claude (great at reasoning)
    {
      when: (input) => {
        const analysisKeywords = ['analyze', 'explain', 'compare', 'evaluate'];
        return analysisKeywords.some(keyword => input.toLowerCase().includes(keyword));
      },
      use: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      },
    },
    
    // Rule 4: Long creative content goes to GPT-4
    {
      when: (input) => {
        const creativeKeywords = ['write', 'story', 'article', 'blog', 'creative'];
        return input.length > 500 || 
               creativeKeywords.some(keyword => input.toLowerCase().includes(keyword));
      },
      use: {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
      },
    },
    
    // Default rule: Everything else goes to GPT-4 Turbo
    {
      default: true,
      use: {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
      },
    },
  ],
  
  // Fallback if all rules fail
  fallback: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
  },
});

async function main() {
  console.log('🤖 LLM Router Example\n');
  console.log('📊 Router Stats:', router.getStats());
  console.log('🔧 Available Agents:', router.listAgents());
  console.log('\n' + '='.repeat(60) + '\n');

  // Test different types of queries
  const queries = [
    {
      name: 'Short Query',
      input: 'What is 2+2?',
    },
    {
      name: 'Code Query',
      input: 'Write a function to reverse a string in JavaScript',
    },
    {
      name: 'Analysis Query',
      input: 'Analyze the pros and cons of using TypeScript vs JavaScript',
    },
    {
      name: 'Creative Query',
      input: 'Write a short story about a robot learning to paint',
    },
  ];

  for (const query of queries) {
    try {
      console.log(`\n📝 ${query.name}:`);
      console.log(`Input: "${query.input}"\n`);
      
      const response = await router.route(query.input);
      
      console.log(`✅ Response (${response.usage?.totalTokens} tokens):`);
      console.log(response.content.substring(0, 200) + '...\n');
      console.log('─'.repeat(60));
      
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('\n✅ Router example completed!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { router };
