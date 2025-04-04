import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { mockApiResponses, mockUsers, mockGroups, mockPolls } from '../mocks/mockData';

// Import mocks
const mocks = require('../mocks/mockModules');

// Create a custom render function that includes Redux provider and Router
export function renderWithProviders(
  ui,
  {
    preloadedState = {
      auth: {
        user: mockUsers[0],
        token: 'mock-jwt-token',
        isAuthenticated: true,
        loading: false,
        error: null
      },
      groups: {
        groups: mockGroups,
        loading: false,
        error: null
      },
      polls: {
        polls: mockPolls,
        loading: false,
        error: null
      }
    },
    store = mocks.ReduxToolkit.configureStore({
      reducer: {
        auth: (state = preloadedState.auth, action) => state,
        groups: (state = preloadedState.groups, action) => state,
        polls: (state = preloadedState.polls, action) => state
      },
      preloadedState
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <mocks.ReactRedux.Provider store={store}>
        <mocks.ReactRouterDom.BrowserRouter>
          {children}
        </mocks.ReactRouterDom.BrowserRouter>
      </mocks.ReactRedux.Provider>
    );
  }
  
  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
}

// Export everything from React Testing Library
export * from '@testing-library/react';
