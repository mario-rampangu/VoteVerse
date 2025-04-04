import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import Register from '../../../src/components/auth/Register';
import { mockApiResponses } from '../../mocks/mockData';

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('Register Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders registration form correctly', () => {
    renderWithProviders(<Register />);
    
    // Check if the form elements are rendered
    expect(screen.getByTestId('register-component')).toBeInTheDocument();
    expect(screen.getByTestId('register-title')).toBeInTheDocument();
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  test('handles form submission with valid data', async () => {
    // Mock successful registration API response
    mockApiResponses.register.success;
    
    const { store } = renderWithProviders(<Register />);
    
    // Fill in the form
    fireEvent.change(screen.getByTestId('name-input'), {
      target: { value: 'testuser1' },
    });
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'testuser1@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('register-form'));
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/signup'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            username: 'testuser1',
            email: 'testuser1@example.com',
            password: 'password123',
          }),
        })
      );
    });
    
    // Check if the user is authenticated in the store
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.user).toEqual(mockApiResponses.register.success.user);
    expect(state.auth.token).toEqual(mockApiResponses.register.success.token);
  });

  test('displays error message when email already exists', async () => {
    // Mock failed registration API response
    mockApiResponses.register.error;
    
    renderWithProviders(<Register />);
    
    // Fill in the form with an existing email
    fireEvent.change(screen.getByTestId('name-input'), {
      target: { value: 'testuser1' },
    });
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('register-form'));
    
    // Wait for the API call to complete and error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });
  });

  test('validates form inputs before submission', async () => {
    renderWithProviders(<Register />);
    
    // Submit the form without filling in any fields
    fireEvent.submit(screen.getByTestId('register-form'));
    
    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/Username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
    
    // Fill in invalid email format
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'invalidemail' },
    });
    
    // Check for email format validation
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email/i)).toBeInTheDocument();
    });
    
    // Fill in passwords that don't match
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'differentpassword' },
    });
    
    // Check for password match validation
    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
    
    // Ensure fetch was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('navigates to login page when clicking the sign in link', () => {
    const { getByText } = renderWithProviders(<Register />);
    
    // Click on the "Sign In" link
    const signInLink = getByText(/Already have an account\? Sign In/i);
    fireEvent.click(signInLink);
    
    // Navigation would be tested in integration tests
  });
});
