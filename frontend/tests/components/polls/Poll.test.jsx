import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import Poll from '../../../src/components/polls/Poll';
import { mockPolls, mockComments } from '../../mocks/mockData';

// Mock useParams to simulate route parameters
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ pollId: '1' }),
  useNavigate: () => jest.fn(),
}));

// Simple test for Poll component
describe('Poll Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders poll component correctly', () => {
    renderWithProviders(<Poll />);
    
    // Check if the component renders
    expect(screen.getByTestId('poll-component')).toBeInTheDocument();
    expect(screen.getByTestId('poll-title')).toBeInTheDocument();
    expect(screen.getByTestId('poll-description')).toBeInTheDocument();
    expect(screen.getByTestId('poll-options')).toBeInTheDocument();
    expect(screen.getAllByTestId('poll-option')).toHaveLength(2);
  });

  test('handles voting on an option', async () => {
    const { store } = renderWithProviders(<Poll />);
    
    // Find and click on an option
    const options = screen.getAllByTestId('poll-option');
    fireEvent.click(options[0]);
    
    // Verify the API service was called
    await waitFor(() => {
      expect(global.ApiService.post).toHaveBeenCalled();
    });
  });

  test('displays comments section', () => {
    renderWithProviders(<Poll />);
    
    // Check if comments section is displayed
    expect(screen.getByTestId('poll-comments')).toBeInTheDocument();
  });
});
