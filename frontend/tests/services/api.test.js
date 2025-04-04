import { apiService } from '../../../src/services/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage
    localStorage.clear();
  });

  test('should make GET request correctly', async () => {
    // Mock successful response
    const mockResponse = { data: 'test data' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Call the API service
    const result = await apiService.get('/test-endpoint');

    // Check if fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    // Check if the result is correct
    expect(result).toEqual(mockResponse);
  });

  test('should make POST request correctly', async () => {
    // Mock successful response
    const mockResponse = { success: true };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Call the API service
    const data = { name: 'test', value: 123 };
    const result = await apiService.post('/test-endpoint', data);

    // Check if fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
      })
    );

    // Check if the result is correct
    expect(result).toEqual(mockResponse);
  });

  test('should make PUT request correctly', async () => {
    // Mock successful response
    const mockResponse = { success: true };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Call the API service
    const data = { id: 1, name: 'updated test' };
    const result = await apiService.put('/test-endpoint/1', data);

    // Check if fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint/1'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
      })
    );

    // Check if the result is correct
    expect(result).toEqual(mockResponse);
  });

  test('should make DELETE request correctly', async () => {
    // Mock successful response
    const mockResponse = { success: true };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Call the API service
    const result = await apiService.delete('/test-endpoint/1');

    // Check if fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint/1'),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    // Check if the result is correct
    expect(result).toEqual(mockResponse);
  });

  test('should include auth token in headers when available', async () => {
    // Set token in localStorage
    const token = 'test-auth-token';
    localStorage.setItem('token', token);

    // Mock successful response
    const mockResponse = { data: 'test data' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Call the API service
    await apiService.get('/test-endpoint');

    // Check if fetch was called with the auth token
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${token}`,
        }),
      })
    );
  });

  test('should handle API errors correctly', async () => {
    // Mock error response
    const errorMessage = 'Not found';
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: errorMessage }),
    });

    // Call the API service and expect it to throw
    await expect(apiService.get('/test-endpoint')).rejects.toEqual({
      status: 404,
      message: errorMessage,
    });
  });

  test('should handle network errors correctly', async () => {
    // Mock network error
    const networkError = new Error('Network error');
    global.fetch.mockRejectedValueOnce(networkError);

    // Call the API service and expect it to throw
    await expect(apiService.get('/test-endpoint')).rejects.toEqual({
      status: 0,
      message: 'Network error. Please check your connection.',
    });
  });

  test('should handle JSON parsing errors correctly', async () => {
    // Mock invalid JSON response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
    });

    // Call the API service and expect it to throw
    await expect(apiService.get('/test-endpoint')).rejects.toEqual({
      status: 0,
      message: 'Failed to parse response.',
    });
  });
});
