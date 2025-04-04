const { execSync } = require('child_process');
const path = require('path');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

console.log(`${colors.bright}${colors.blue}=== VoteVerse Frontend Test Suite ===${colors.reset}\n`);

try {
  // Run Jest tests
  console.log(`${colors.yellow}Running tests...${colors.reset}\n`);
  
  execSync('npx jest --config=jest.config.js', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log(`\n${colors.green}${colors.bright}✓ All tests completed successfully!${colors.reset}`);
} catch (error) {
  console.error(`\n${colors.red}${colors.bright}✗ Tests failed with errors.${colors.reset}`);
  process.exit(1);
}
