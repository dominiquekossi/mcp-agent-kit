import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Checking mcp-agent-kit version...\n');

try {
  // Read package.json from node_modules
  const packagePath = join(__dirname, 'node_modules', 'mcp-agent-kit', 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  
  console.log('📦 Installed version:', packageJson.version);
  console.log('📝 Package name:', packageJson.name);
  console.log('📄 Description:', packageJson.description);
  console.log('');
  
  // Check if it's the expected version
  const expectedVersion = '1.1.0';
  if (packageJson.version === expectedVersion) {
    console.log('✅ Using the correct version!');
  } else if (packageJson.version.startsWith('1.1.')) {
    console.log('✅ Using a compatible 1.1.x version');
  } else {
    console.log('⚠️  Version mismatch! Expected 1.1.0 or higher');
  }
  
  console.log('');
  console.log('💡 To update to the latest version, run:');
  console.log('   npm run update:package');
  console.log('');
  
} catch (error) {
  console.error('❌ Error reading package:', error.message);
  console.log('');
  console.log('💡 Make sure to run "npm install" first');
  console.log('');
  process.exit(1);
}
