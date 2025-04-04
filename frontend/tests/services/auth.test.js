import { authService } from '../../../src/services/auth';
import { apiService } from '../../../src/services/api';

// Mock the API service
jest.mock('../../../src/services/api', () => ({
  apiService: {
    post: jest.fn(),
    get: jest.fn(),
  }
}));

describe('Auth Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage
    localStorage.clear();
  });

  test('should handle login correctly', async () => {
    // Mock API response
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
    const mockToken = 'test-token';
    apiService.post.mockResolvedValueOnce({ user: mockUser, token: mockToken });

    // Call the auth service
    const credentials = { email: 'test@example.com', password: 'password123' };
    const result = await authService.login(credentials);

    // Check if API was called correctly
    expect(apiService.post).toHaveBeenCalledWith('/auth/signin', credentials);

    // Check if the result is correct
    expect(result).toEqual({ user: mockUser, token: mockToken });

    // Check if token and user were stored in localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });

  test('should handle registration correctly', async () => {
    // Mock API response
    const mockUser = { id: '1', username: 'newuser', email: 'new@example.com' };
    const mockToken = 'new-token';
    apiService.post.mockResolvedValueOnce({ user: mockUser, token: mockToken });

    // Call the auth service
    const userData = { username: 'newuser', email: 'new@example.com', password: 'password123' };
    const result = await authService.register(userData);

    // Check if API was called correctly
    expect(apiService.post).toHaveBeenCalledWith('/auth/signup', userData);

    // Check if the result is correct
    expect(result).toEqual({ user: mockUser, token: mockToken });

    // Check if token and user were stored in localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });

  test('should handle logout correctly', () => {
    // Set token and user in localStorage
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: '1' }));

    // Call the auth service
    authService.logout();

    // Check if token and user were removed from localStorage
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
  });

  test('should get current user from localStorage', () => {
    // Set user in localStorage
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
    localStorage.setItem('user', JSON.stringify(mockUser));

    // Call the auth service
    const result = authService.getCurrentUser();

    // Check if the result is correct
    expect(result).toEqual(mockUser);
  });

  test('should return null if no current user in localStorage', () => {
    // Call the auth service
    const result = authService.getCurrentUser();

    // Check if the result is null
    expect(result).toBeNull();
  });

  test('should get token from localStorage', () => {
    // Set token in localStorage
    const mockToken = 'test-token';
    localStorage.setItem('token', mockToken);

    // Call the auth service
    const result = authService.getToken();

    // Check if the result is correct
    expect(result).toEqual(mockToken);
  });

  test('should return null if no token in localStorage', () => {
    // Call the auth service
    const result = authService.getToken();

    // Check if the result is null
    expect(result).toBeNull();
  });

  test('should check if user is authenticated', () => {
    // Set token in localStorage
    localStorage.setItem('token', 'test-token');

    // Call the auth service
    const result = authService.isAuthenticated();

    // Check if the result is true
    expect(result).toBe(true);
  });

  test('should return false if not authenticated', () => {
    // Call the auth service
    const result = authService.isAuthenticated();

    // Check if the result is false
    expect(result).toBe(false);
  });

  test('should handle API errors during login', async () => {
    // Mock API error
    const errorMessage = 'Invalid credentials';
    apiService.post.mockRejectedValueOnce({ message: errorMessage });

    // Call the auth service and expect it to throw
    const credentials = { email: 'wrong@example.com', password: 'wrongpassword' };
    await expect(authService.login(credentials)).rejects.toEqual({ message: errorMessage });

    // Check that nothing was stored in localStorage
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  test('should handle API errors during registration', async () => {
    // Mock API error
    const errorMessage = 'Email already exists';
    apiService.post.mockRejectedValueOnce({ message: errorMessage });

    // Call the auth service and expect it to throw
    const userData = { username: 'existinguser', email: 'existing@example.com', password: 'password123' };
    await expect(authService.register(userData)).rejects.toEqual({ message: errorMessage });

    // Check that nothing was stored in localStorage
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});
