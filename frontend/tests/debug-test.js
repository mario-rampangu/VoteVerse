// Simple test file to debug Jest configuration issues
const React = require('react');
const { render, screen } = require('@testing-library/react');

// Log environment information
console.log('Node version:', process.version);
console.log('Current working directory:', process.cwd());
console.log('Test file location:', __filename);

// Create a simple component
const SimpleComponent = () => {
  return React.createElement('div', { 'data-testid': 'simple-component' }, 'Hello, World!');
};

// Basic test
describe('Simple Component Test', () => {
  test('renders without crashing', () => {
    console.log('Running simple component test');
    render(React.createElement(SimpleComponent));
    expect(screen.getByTestId('simple-component')).toBeInTheDocument();
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
    console.log('Simple component test completed successfully');
  });
});
