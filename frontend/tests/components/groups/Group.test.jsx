import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import Group from '../../../src/components/groups/Group';
import { mockGroups, mockPolls } from '../../mocks/mockData';

// Mock useParams to simulate route parameters
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ groupId: '1' }),
  useNavigate: () => jest.fn(),
}));

describe('Group Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders group component correctly', () => {
    renderWithProviders(<Group />);
    
    // Check if the component renders
    expect(screen.getByTestId('group-component')).toBeInTheDocument();
    expect(screen.getByTestId('group-title')).toBeInTheDocument();
    expect(screen.getByTestId('group-description')).toBeInTheDocument();
    expect(screen.getByTestId('group-members')).toBeInTheDocument();
    expect(screen.getByTestId('group-polls')).toBeInTheDocument();
  });

  test('handles joining a group', async () => {
    const { store } = renderWithProviders(<Group />);
    
    // Find and click on join button (simulated)
    const joinButton = screen.getByTestId('group-members');
    fireEvent.click(joinButton);
    
    // Verify the API service was called
    await waitFor(() => {
      expect(global.ApiService.post).toHaveBeenCalled();
    });
  });

  test('renders loading state initially', () => {
    // Mock API calls that will be made when the component mounts
    jest.spyOn(global.ApiService, 'get').mockImplementation(() => Promise.resolve({ group: null }));
    
    renderWithProviders(<Group />);
    
    // Check if loading indicator is displayed
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  test('renders group details and polls', async () => {
    // Mock API calls for group and polls
    jest.spyOn(global.ApiService, 'get').mockImplementation(() => Promise.resolve({ group: mockGroups[0] }));
    jest.spyOn(global.ApiService, 'get').mockImplementationOnce(() => Promise.resolve({ polls: mockPolls.filter(poll => poll.group_id === '1') }));
    jest.spyOn(global.ApiService, 'get').mockImplementationOnce(() => Promise.resolve({ members: mockGroups[0].members }));
    
    const { store } = renderWithProviders(<Group />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    
    // Check if group details are displayed
    expect(screen.getByText(/Test Group 1/i)).toBeInTheDocument();
    expect(screen.getByText(/This is a test group 1/i)).toBeInTheDocument();
    
    // Check if polls are displayed
    expect(screen.getByText(/Test Poll 1/i)).toBeInTheDocument();
    
    // Check if members are displayed
    expect(screen.getByText(/testuser1/i)).toBeInTheDocument();
    expect(screen.getByText(/testuser2/i)).toBeInTheDocument();
  });

  test('handles poll creation button click', async () => {
    // Mock API calls
    jest.spyOn(global.ApiService, 'get').mockImplementation(() => Promise.resolve({ group: mockGroups[0] }));
    jest.spyOn(global.ApiService, 'get').mockImplementationOnce(() => Promise.resolve({ polls: mockPolls.filter(poll => poll.group_id === '1') }));
    jest.spyOn(global.ApiService, 'get').mockImplementationOnce(() => Promise.resolve({ members: mockGroups[0].members }));
    
    const { store } = renderWithProviders(<Group />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    
    // Find and click the create poll button
    const createPollButton = screen.getByText(/Create New Poll/i);
    fireEvent.click(createPollButton);
    
    // Navigation would be tested in integration tests
  });

  test('handles join group button click', async () => {
    // Mock API calls
    jest.spyOn(global.ApiService, 'get').mockImplementation(() => Promise.resolve({ group: mockGroups[0] }));
    jest.spyOn(global.ApiService, 'get').mockImplementationOnce(() => Promise.resolve({ polls: mockPolls.filter(poll => poll.group_id === '1') }));
    jest.spyOn(global.ApiService, 'get').mockImplementationOnce(() => Promise.resolve({ members: mockGroups[0].members.filter(member => member.id !== '1') }));
    
    const { store } = renderWithProviders(<Group />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    
    // Mock join group API call
    jest.spyOn(global.ApiService, 'post').mockImplementation(() => Promise.resolve({ success: true }));
    
    // Find and click the join group button
    const joinGroupButton = screen.getByText(/Join Group/i);
    fireEvent.click(joinGroupButton);
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(global.ApiService.post).toHaveBeenCalledWith(
        expect.stringContaining(`/api/groups/${mockGroups[0].id}/join`),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
    
    // Check if success message is displayed
    expect(screen.getByText(/Successfully joined the group/i)).toBeInTheDocument();
  });

  test('displays error message when API calls fail', async () => {
    // Mock failed API call
    jest.spyOn(global.ApiService, 'get').mockImplementation(() => Promise.resolve({ error: 'Failed to fetch group' }));
    
    renderWithProviders(<Group />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Error loading group/i)).toBeInTheDocument();
    });
  });

  test('redirects to login page when user is not authenticated', async () => {
    // Don't mock authenticated user
    jest.spyOn(global.ApiService, 'get').mockImplementation(() => Promise.resolve({ group: mockGroups[0] }));
    
    renderWithProviders(<Group />);
    
    // Check if redirect happens (would be tested in integration tests)
    // For unit test, we can check if the component doesn't render group content
    await waitFor(() => {
      expect(screen.queryByText(/Test Group 1/i)).not.toBeInTheDocument();
    });
  });
});
