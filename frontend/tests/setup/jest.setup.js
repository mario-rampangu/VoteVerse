// Jest setup file
console.log('Loading Jest setup file...');

// Set up DOM environment
require('@testing-library/jest-dom');

// Import mocks
const mocks = require('../mocks/mockModules');

// Set up global mocks
global.React = mocks.React;
global.MaterialUI = mocks.MaterialUI;
global.ReduxToolkit = mocks.ReduxToolkit;
global.ReactRedux = mocks.ReactRedux;
global.ReactRouterDom = mocks.ReactRouterDom;
global.ApiService = mocks.ApiService;
global.AuthService = mocks.AuthService;
global.Components = mocks.Components;

// Mock localStorage and sessionStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn(index => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

const sessionStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn(index => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock fetch API
global.fetch = jest.fn().mockImplementation((url, options) => {
  console.log(`Mocking fetch for URL: ${url}`);
  
  // Mock different API endpoints
  if (url.includes('/auth/signin')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mocks.ApiService.post('/auth/signin').then(res => res))
    });
  }
  
  if (url.includes('/auth/signup')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mocks.ApiService.post('/auth/signup').then(res => res))
    });
  }
  
  if (url.includes('/groups') && options && options.method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mocks.ApiService.post('/groups').then(res => res))
    });
  }
  
  if (url.includes('/groups') && options && options.method === 'PUT') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mocks.ApiService.put('/groups').then(res => res))
    });
  }
  
  if (url.includes('/groups') && options && options.method === 'DELETE') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mocks.ApiService.delete('/groups').then(res => res))
    });
  }
  
  if (url.includes('/groups')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mocks.ApiService.get('/groups').then(res => res))
    });
  }
  
  if (url.includes('/polls') && options && options.method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mocks.ApiService.post('/polls').then(res => res))
    });
  }
  
  if (url.includes('/polls') && options && options.method === 'PUT') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mocks.ApiService.put('/polls').then(res => res))
    });
  }
  
  if (url.includes('/polls') && options && options.method === 'DELETE') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mocks.ApiService.delete('/polls').then(res => res))
    });
  }
  
  if (url.includes('/polls')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mocks.ApiService.get('/polls').then(res => res))
    });
  }
  
  if (url.includes('/users')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mocks.ApiService.get('/users').then(res => res))
    });
  }
  
  // Default response for any other URL
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
});

// Mock modules
jest.mock('@mui/material', () => mocks.MaterialUI);
jest.mock('@reduxjs/toolkit', () => mocks.ReduxToolkit);
jest.mock('react-redux', () => mocks.ReactRedux);
jest.mock('react-router-dom', () => mocks.ReactRouterDom);
jest.mock('../../src/services/apiService', () => mocks.ApiService);
jest.mock('../../src/services/authService', () => mocks.AuthService);

// Mock components
jest.mock('../../src/components/auth/Register', () => mocks.Components.Register);
jest.mock('../../src/components/auth/Login', () => mocks.Components.Login);
jest.mock('../../src/components/polls/Poll', () => mocks.Components.Poll);
jest.mock('../../src/components/groups/Group', () => mocks.Components.Group);
jest.mock('../../src/components/dashboard/Dashboard', () => mocks.Components.Dashboard);

console.log('Jest setup complete!');
