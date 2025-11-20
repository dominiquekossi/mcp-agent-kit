import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Running All Tests\n');
console.log('=' .repeat(60));

const tests = [
  { name: 'Basic Agents', file: 'test-agent.js' },
  { name: 'Smart Tool Calling', file: 'test-smart-tools.js' },
  { name: 'LLM Router', file: 'test-router.js' },
  { name: 'Chatbot', file: 'test-chatbot.js' }
];

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    const testPath = join(__dirname, testFile);
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function runAllTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📋 Running: ${test.name}`);
    console.log('-'.repeat(60));
    
    try {
      await runTest(test.file);
      passed++;
      console.log(`✅ ${test.name} passed`);
    } catch (error) {
      failed++;
      console.error(`❌ ${test.name} failed:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${tests.length}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed.\n');
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
