import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import Dashboard from '../../../src/components/dashboard/Dashboard';
import { mockGroups, mockPolls } from '../../mocks/mockData';

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders dashboard component correctly', () => {
    renderWithProviders(<Dashboard />);
    
    // Check if the component renders
    expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-groups')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-polls')).toBeInTheDocument();
  });

  test('displays user groups and polls', async () => {
    renderWithProviders(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-groups-list')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-polls-list')).toBeInTheDocument();
    });
    
    // Check if groups and polls are displayed
    expect(screen.getAllByTestId('group-item')).toHaveLength(2);
    expect(screen.getAllByTestId('poll-item')).toHaveLength(2);
  });

  test('renders loading state initially', () => {
    // Mock API calls that will be made when the component mounts
    // mockFetch({ groups: [] });
    // mockFetch({ polls: [] });
    
    renderWithProviders(<Dashboard />);
    
    // Check if loading indicators are displayed
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  test('renders dashboard with user groups and polls', async () => {
    // Mock API calls for groups and polls
    // mockFetch({ groups: mockGroups });
    // mockFetch({ polls: mockPolls });
    
    renderWithProviders(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    
    // Check if groups are displayed
    expect(screen.getByText(/Test Group 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Group 2/i)).toBeInTheDocument();
    
    // Check if polls are displayed
    expect(screen.getByText(/Test Poll 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Poll 2/i)).toBeInTheDocument();
    
    // Check if create buttons are displayed
    expect(screen.getByText(/Create New Group/i)).toBeInTheDocument();
    expect(screen.getByText(/Create New Poll/i)).toBeInTheDocument();
  });

  test('renders empty state when user has no groups or polls', async () => {
    // Mock API calls with empty responses
    // mockFetch({ groups: [] });
    // mockFetch({ polls: [] });
    
    renderWithProviders(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    
    // Check if empty state messages are displayed
    expect(screen.getByText(/You don't have any groups yet/i)).toBeInTheDocument();
    expect(screen.getByText(/You don't have any polls yet/i)).toBeInTheDocument();
  });

  test('displays error message when API calls fail', async () => {
    // Mock failed API calls
    // mockFetch({ error: 'Failed to fetch groups' }, 500);
    // mockFetch({ error: 'Failed to fetch polls' }, 500);
    
    renderWithProviders(<Dashboard />);
    
    // Wait for errors to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Error loading groups/i)).toBeInTheDocument();
      expect(screen.getByText(/Error loading polls/i)).toBeInTheDocument();
    });
  });

  test('redirects to login page when user is not authenticated', async () => {
    // Don't mock authenticated user
    // mockFetch({ groups: mockGroups });
    // mockFetch({ polls: mockPolls });
    
    renderWithProviders(<Dashboard />);
    
    // Check if redirect happens (would be tested in integration tests)
    // For unit test, we can check if the component doesn't render dashboard content
    await waitFor(() => {
      expect(screen.queryByText(/Test Group 1/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Test Poll 1/i)).not.toBeInTheDocument();
    });
  });
});
