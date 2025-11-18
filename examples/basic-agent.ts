/**
 * Basic Agent Example
 * Shows how to create and use an AI agent
 */

import { createAgent } from '../src';

async function main() {
  // Create agent with OpenAI
  const agent = createAgent({
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
  });

  console.log('🤖 Agent created!\n');

  // Simple chat
  console.log('User: Hello! What can you do?');
  const response1 = await agent.execute('Hello! What can you do?');
  console.log(`Agent: ${response1}\n`);

  // Another message
  console.log('User: Tell me a joke');
  const response2 = await agent.execute('Tell me a joke');
  console.log(`Agent: ${response2}\n`);
}

main().catch(console.error);
