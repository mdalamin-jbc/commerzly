#!/usr/bin/env node

/**
 * BitCommerce OAuth API Setup Script
 * 
 * This script helps set up the development environment and run the demo.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 BitCommerce OAuth API Setup\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRY=1h
JWT_REFRESH_TOKEN_EXPIRY=7d

# OAuth Configuration
OAUTH_AUTHORIZATION_CODE_EXPIRY=10m
OAUTH_STATE_SECRET=your-oauth-state-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
} else {
  console.log('✅ .env file already exists');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully!');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

// Check if server can start
console.log('\n🔧 Testing server startup...');
try {
  // Test if the server can be required without errors
  require('./src/server');
  console.log('✅ Server configuration is valid');
} catch (error) {
  console.error('❌ Server configuration error:', error.message);
  process.exit(1);
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Start the server: npm run dev');
console.log('2. Run the demo: npm run demo');
console.log('3. Run tests: npm test');
console.log('4. View API docs: API_DOCUMENTATION.md');
console.log('\n🌐 Server will be available at: http://localhost:3000');
console.log('🔐 OAuth endpoints: http://localhost:3000/oauth');
console.log('🏪 Merchant APIs: http://localhost:3000/api/v1/merchants');

console.log('\n💡 Quick start commands:');
console.log('   npm run dev     # Start development server');
console.log('   npm run demo    # Run OAuth flow demo');
console.log('   npm test        # Run test suite');

console.log('\n📖 For detailed documentation, see:');
console.log('   - README.md');
console.log('   - API_DOCUMENTATION.md'); 