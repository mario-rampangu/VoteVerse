import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  loginSuccess,
  logoutUser,
  registerSuccess,
  setAuthLoading,
  setAuthError
} from '../../../src/redux/slices/authSlice';

describe('Auth Slice', () => {
  let store;

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        auth: authReducer
      }
    });
  });

  test('should handle initial state', () => {
    const state = store.getState().auth;
    expect(state).toEqual({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
  });

  test('should handle loginSuccess', () => {
    const user = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    };
    const token = 'test-token';

    store.dispatch(loginSuccess({ user, token }));

    const state = store.getState().auth;
    expect(state.user).toEqual(user);
    expect(state.token).toEqual(token);
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();

    // Check if token is stored in localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('token', token);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
  });

  test('should handle registerSuccess', () => {
    const user = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    };
    const token = 'test-token';

    store.dispatch(registerSuccess({ user, token }));

    const state = store.getState().auth;
    expect(state.user).toEqual(user);
    expect(state.token).toEqual(token);
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();

    // Check if token is stored in localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('token', token);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
  });

  test('should handle logoutUser', () => {
    // First login a user
    const user = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    };
    const token = 'test-token';

    store.dispatch(loginSuccess({ user, token }));
    
    // Then logout
    store.dispatch(logoutUser());

    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();

    // Check if token is removed from localStorage
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
  });

  test('should handle setAuthLoading', () => {
    store.dispatch(setAuthLoading(true));

    let state = store.getState().auth;
    expect(state.loading).toBe(true);

    store.dispatch(setAuthLoading(false));

    state = store.getState().auth;
    expect(state.loading).toBe(false);
  });

  test('should handle setAuthError', () => {
    const error = 'Authentication failed';
    store.dispatch(setAuthError(error));

    const state = store.getState().auth;
    expect(state.error).toEqual(error);
    expect(state.loading).toBe(false);
  });

  test('should clear error when login or register is successful', () => {
    // First set an error
    store.dispatch(setAuthError('Authentication failed'));
    
    // Then login successfully
    const user = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    };
    const token = 'test-token';

    store.dispatch(loginSuccess({ user, token }));

    const state = store.getState().auth;
    expect(state.error).toBeNull();
  });
});
