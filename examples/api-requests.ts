/**
 * Example: API Requests with retry and timeout
 */

import { api } from '../src';

async function main() {
  console.log('🌐 API Request Examples\n');
  console.log('='.repeat(60) + '\n');

  // Example 1: Simple GET request
  console.log('📥 Example 1: GET Request\n');
  try {
    const response = await api.get('https://jsonplaceholder.typicode.com/posts/1', {
      name: 'get-post',
      timeout: 5000,
    });

    console.log('✅ Success!');
    console.log(`Status: ${response.status}`);
    console.log(`Duration: ${response.duration}ms`);
    console.log('Data:', response.data);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Example 2: POST request with body
  console.log('📤 Example 2: POST Request\n');
  try {
    const response = await api.post(
      'https://jsonplaceholder.typicode.com/posts',
      {
        title: 'Test Post',
        body: 'This is a test post created by mcp-agent-kit',
        userId: 1,
      },
      {
        name: 'create-post',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Success!');
    console.log(`Status: ${response.status}`);
    console.log(`Duration: ${response.duration}ms`);
    console.log('Created:', response.data);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Example 3: Request with query parameters
  console.log('🔍 Example 3: GET with Query Parameters\n');
  try {
    const response = await api.get('https://jsonplaceholder.typicode.com/posts', {
      name: 'search-posts',
      query: {
        userId: 1,
        _limit: 5,
      },
    });

    console.log('✅ Success!');
    console.log(`Status: ${response.status}`);
    console.log(`Duration: ${response.duration}ms`);
    console.log(`Found ${response.data.length} posts`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Example 4: PUT request
  console.log('✏️ Example 4: PUT Request\n');
  try {
    const response = await api.put(
      'https://jsonplaceholder.typicode.com/posts/1',
      {
        id: 1,
        title: 'Updated Title',
        body: 'Updated body content',
        userId: 1,
      },
      {
        name: 'update-post',
      }
    );

    console.log('✅ Success!');
    console.log(`Status: ${response.status}`);
    console.log(`Duration: ${response.duration}ms`);
    console.log('Updated:', response.data);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Example 5: DELETE request
  console.log('🗑️ Example 5: DELETE Request\n');
  try {
    const response = await api.delete(
      'https://jsonplaceholder.typicode.com/posts/1',
      {
        name: 'delete-post',
      }
    );

    console.log('✅ Success!');
    console.log(`Status: ${response.status}`);
    console.log(`Duration: ${response.duration}ms`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Example 6: Request with custom retry and timeout
  console.log('⚙️ Example 6: Custom Retry & Timeout\n');
  try {
    const response = await api.request({
      name: 'custom-config',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
      timeout: 10000, // 10 seconds
      retries: 5, // 5 attempts
      headers: {
        'User-Agent': 'mcp-agent-kit/1.0',
      },
    });

    console.log('✅ Success!');
    console.log(`Status: ${response.status}`);
    console.log(`Duration: ${response.duration}ms`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Example 7: Handling errors (intentional 404)
  console.log('❗ Example 7: Error Handling (404)\n');
  try {
    const response = await api.get(
      'https://jsonplaceholder.typicode.com/posts/999999',
      {
        name: 'not-found',
        retries: 1, // Only try once for 404
      }
    );

    console.log('Response:', response);
  } catch (error: any) {
    console.log('✅ Error caught correctly:', error.message);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Example 8: Using with Agent tools
  console.log('🤖 Example 8: API in Agent Tool\n');
  console.log('This shows how to use api.request() inside an agent tool:\n');
  console.log(`
  const weatherTool = {
    name: 'get_weather',
    description: 'Get weather data',
    handler: async ({ city }) => {
      const response = await api.get(
        \`https://api.weather.com/v1/weather/\${city}\`,
        { name: 'weather-api', timeout: 5000 }
      );
      return response.data;
    }
  };
  `);

  console.log('\n✅ All API examples completed!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
