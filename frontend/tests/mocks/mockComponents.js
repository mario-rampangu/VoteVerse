// Mock components for testing
const React = require('react');

// Mock Register component
const Register = () => {
  return React.createElement('div', { 'data-testid': 'register-component' }, [
    React.createElement('h1', { key: 'title', 'data-testid': 'register-title' }, 'Create Account'),
    React.createElement('form', { key: 'form', 'data-testid': 'register-form' }, [
      React.createElement('input', { key: 'name', id: 'name', name: 'name', type: 'text', placeholder: 'Name', 'data-testid': 'name-input' }),
      React.createElement('input', { key: 'email', id: 'email', name: 'email', type: 'email', placeholder: 'Email', 'data-testid': 'email-input' }),
      React.createElement('input', { key: 'password', id: 'password', name: 'password', type: 'password', placeholder: 'Password', 'data-testid': 'password-input' }),
      React.createElement('button', { key: 'submit', type: 'submit', 'data-testid': 'submit-button' }, 'Sign Up')
    ])
  ]);
};

// Mock Poll component
const Poll = () => {
  return React.createElement('div', { 'data-testid': 'poll-component' }, [
    React.createElement('h1', { key: 'title', 'data-testid': 'poll-title' }, 'Test Poll'),
    React.createElement('p', { key: 'description', 'data-testid': 'poll-description' }, 'A test poll for testing purposes'),
    React.createElement('div', { key: 'options', 'data-testid': 'poll-options' }, [
      React.createElement('div', { key: 'option1', 'data-testid': 'poll-option' }, 'Option 1'),
      React.createElement('div', { key: 'option2', 'data-testid': 'poll-option' }, 'Option 2')
    ]),
    React.createElement('div', { key: 'comments', 'data-testid': 'poll-comments' }, 'Comments')
  ]);
};

// Mock Group component
const Group = () => {
  return React.createElement('div', { 'data-testid': 'group-component' }, [
    React.createElement('h1', { key: 'title', 'data-testid': 'group-title' }, 'Test Group'),
    React.createElement('p', { key: 'description', 'data-testid': 'group-description' }, 'A test group for testing purposes'),
    React.createElement('div', { key: 'members', 'data-testid': 'group-members' }, 'Members'),
    React.createElement('div', { key: 'polls', 'data-testid': 'group-polls' }, 'Polls')
  ]);
};

// Mock Dashboard component
const Dashboard = () => {
  return React.createElement('div', { 'data-testid': 'dashboard-component' }, [
    React.createElement('h1', { key: 'title', 'data-testid': 'dashboard-title' }, 'Dashboard'),
    React.createElement('div', { key: 'groups', 'data-testid': 'dashboard-groups' }, 'My Groups'),
    React.createElement('div', { key: 'polls', 'data-testid': 'dashboard-polls' }, 'Recent Polls')
  ]);
};

// Export mock components
module.exports = {
  Register,
  Poll,
  Group,
  Dashboard
};
