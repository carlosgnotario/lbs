#!/usr/bin/env node

const { execSync } = require('child_process');

// Get commit message from command line arguments
// Usage: npm run git:push "Your message"
// Or: npm run gp "Your message"
// The -- separator passes arguments to the script
const args = process.argv.slice(2);
const message = args[0] || process.env.npm_config_message || 'Update';

try {
  console.log('Adding all files...');
  execSync('git add .', { stdio: 'inherit' });
  
  console.log(`Committing with message: "${message}"`);
  execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
  
  console.log('Pushing to GitHub...');
  execSync('git push', { stdio: 'inherit' });
  
  console.log('✅ Successfully pushed to GitHub!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

