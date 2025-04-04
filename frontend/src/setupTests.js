// Jest setup file
console.log('Loading Jest setup file...');

// Set up DOM environment
import '@testing-library/jest-dom';

// Import mocks
import { 
  React, 
  MaterialUI, 
  ReduxToolkit, 
  ReactRedux, 
  ReactRouterDom, 
  ApiService, 
  AuthService, 
  Components 
} from '../tests/mocks/mockModules';

// Set up global mocks
global.React = React;
global.MaterialUI = MaterialUI;
global.ReduxToolkit = ReduxToolkit;
global.ReactRedux = ReactRedux;
global.ReactRouterDom = ReactRouterDom;
global.ApiService = ApiService;
global.AuthService = AuthService;
global.Components = Components;

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
      json: () => Promise.resolve(ApiService.post('/auth/signin').then(res => res))
    });
  }
  
  if (url.includes('/auth/signup')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(ApiService.post('/auth/signup').then(res => res))
    });
  }
  
  if (url.includes('/groups') && options && options.method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(ApiService.post('/groups').then(res => res))
    });
  }
  
  if (url.includes('/groups') && options && options.method === 'PUT') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(ApiService.put('/groups').then(res => res))
    });
  }
  
  if (url.includes('/groups') && options && options.method === 'DELETE') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(ApiService.delete('/groups').then(res => res))
    });
  }
  
  if (url.includes('/groups')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(ApiService.get('/groups').then(res => res))
    });
  }
  
  if (url.includes('/polls') && options && options.method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(ApiService.post('/polls').then(res => res))
    });
  }
  
  if (url.includes('/polls') && options && options.method === 'PUT') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(ApiService.put('/polls').then(res => res))
    });
  }
  
  if (url.includes('/polls') && options && options.method === 'DELETE') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(ApiService.delete('/polls').then(res => res))
    });
  }
  
  if (url.includes('/polls')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(ApiService.get('/polls').then(res => res))
    });
  }
  
  if (url.includes('/users')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(ApiService.get('/users').then(res => res))
    });
  }
  
  // Default response for any other URL
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
});

// Mock modules
jest.mock('@mui/material', () => MaterialUI);
jest.mock('@reduxjs/toolkit', () => ReduxToolkit);
jest.mock('react-redux', () => ReactRedux);
jest.mock('react-router-dom', () => ReactRouterDom);
jest.mock('../src/services/apiService', () => ApiService);
jest.mock('../src/services/authService', () => AuthService);

// Mock components
jest.mock('../src/components/auth/Register', () => Components.Register);
jest.mock('../src/components/auth/Login', () => Components.Login);
jest.mock('../src/components/polls/Poll', () => Components.Poll);
jest.mock('../src/components/groups/Group', () => Components.Group);
jest.mock('../src/components/dashboard/Dashboard', () => Components.Dashboard);

console.log('Jest setup complete!');
