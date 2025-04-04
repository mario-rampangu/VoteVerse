import { configureStore } from '@reduxjs/toolkit';
import pollsReducer, {
  setPolls,
  addPoll,
  updatePoll,
  deletePoll,
  setCurrentPoll,
  setPollsLoading,
  setPollsError,
  addVote,
  addComment
} from '../../../src/redux/slices/pollsSlice';
import { mockPolls, mockComments } from '../../mocks/mockData';

describe('Polls Slice', () => {
  let store;

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        polls: pollsReducer
      }
    });
  });

  test('should handle initial state', () => {
    const state = store.getState().polls;
    expect(state).toEqual({
      polls: [],
      currentPoll: null,
      comments: [],
      loading: false,
      error: null
    });
  });

  test('should handle setPolls', () => {
    store.dispatch(setPolls(mockPolls));

    const state = store.getState().polls;
    expect(state.polls).toEqual(mockPolls);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('should handle addPoll', () => {
    const newPoll = {
      id: '3',
      group_id: '1',
      created_by: '1',
      title: 'Test Poll 3',
      description: 'This is a test poll 3',
      options: [
        {
          id: '5',
          text: 'Option 1',
          image_url: '',
          vote_count: 0,
        },
        {
          id: '6',
          text: 'Option 2',
          image_url: '',
          vote_count: 0,
        },
      ],
      start_time: '2025-01-01T00:00:00Z',
      end_time: '2025-01-31T00:00:00Z',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      is_active: true,
      visibility: 'group',
      total_votes: 0,
    };

    // First set some existing polls
    store.dispatch(setPolls(mockPolls));
    
    // Then add a new poll
    store.dispatch(addPoll(newPoll));

    const state = store.getState().polls;
    expect(state.polls).toHaveLength(mockPolls.length + 1);
    expect(state.polls).toContainEqual(newPoll);
  });

  test('should handle updatePoll', () => {
    // First set some existing polls
    store.dispatch(setPolls(mockPolls));
    
    // Then update a poll
    const updatedPoll = {
      ...mockPolls[0],
      title: 'Updated Poll Title',
      description: 'Updated description'
    };
    
    store.dispatch(updatePoll(updatedPoll));

    const state = store.getState().polls;
    expect(state.polls).toHaveLength(mockPolls.length);
    expect(state.polls.find(p => p.id === updatedPoll.id)).toEqual(updatedPoll);
  });

  test('should handle deletePoll', () => {
    // First set some existing polls
    store.dispatch(setPolls(mockPolls));
    
    // Then delete a poll
    const pollIdToDelete = mockPolls[0].id;
    store.dispatch(deletePoll(pollIdToDelete));

    const state = store.getState().polls;
    expect(state.polls).toHaveLength(mockPolls.length - 1);
    expect(state.polls.find(p => p.id === pollIdToDelete)).toBeUndefined();
  });

  test('should handle setCurrentPoll', () => {
    // Set current poll with comments
    store.dispatch(setCurrentPoll({
      poll: mockPolls[0],
      comments: mockComments
    }));

    const state = store.getState().polls;
    expect(state.currentPoll).toEqual(mockPolls[0]);
    expect(state.comments).toEqual(mockComments);
  });

  test('should handle setPollsLoading', () => {
    store.dispatch(setPollsLoading(true));

    let state = store.getState().polls;
    expect(state.loading).toBe(true);

    store.dispatch(setPollsLoading(false));

    state = store.getState().polls;
    expect(state.loading).toBe(false);
  });

  test('should handle setPollsError', () => {
    const error = 'Failed to fetch polls';
    store.dispatch(setPollsError(error));

    const state = store.getState().polls;
    expect(state.error).toEqual(error);
    expect(state.loading).toBe(false);
  });

  test('should handle addVote', () => {
    // First set current poll
    store.dispatch(setCurrentPoll({
      poll: mockPolls[0],
      comments: []
    }));
    
    // Then add a vote to the first option
    const optionId = mockPolls[0].options[0].id;
    const updatedPoll = {
      ...mockPolls[0],
      options: [
        {
          ...mockPolls[0].options[0],
          vote_count: mockPolls[0].options[0].vote_count + 1
        },
        mockPolls[0].options[1]
      ],
      total_votes: mockPolls[0].total_votes + 1
    };
    
    store.dispatch(addVote({
      pollId: mockPolls[0].id,
      optionId,
      updatedPoll
    }));

    const state = store.getState().polls;
    expect(state.currentPoll).toEqual(updatedPoll);
    
    // Check if the poll is also updated in the polls array
    const updatedPollInArray = state.polls.find(p => p.id === mockPolls[0].id);
    expect(updatedPollInArray).toEqual(updatedPoll);
  });

  test('should handle addComment', () => {
    // First set current poll with comments
    store.dispatch(setCurrentPoll({
      poll: mockPolls[0],
      comments: mockComments
    }));
    
    // Then add a new comment
    const newComment = {
      id: '3',
      poll_id: mockPolls[0].id,
      user_id: '1',
      username: 'testuser1',
      content: 'This is a new test comment',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };
    
    store.dispatch(addComment(newComment));

    const state = store.getState().polls;
    expect(state.comments).toHaveLength(mockComments.length + 1);
    expect(state.comments).toContainEqual(newComment);
  });

  test('should clear error when polls are successfully fetched', () => {
    // First set an error
    store.dispatch(setPollsError('Failed to fetch polls'));
    
    // Then successfully fetch polls
    store.dispatch(setPolls(mockPolls));

    const state = store.getState().polls;
    expect(state.error).toBeNull();
  });

  test('should update currentPoll when it is updated in the polls list', () => {
    // First set current poll
    store.dispatch(setCurrentPoll({
      poll: mockPolls[0],
      comments: []
    }));
    
    // Then update the same poll
    const updatedPoll = {
      ...mockPolls[0],
      title: 'Updated Poll Title',
      description: 'Updated description'
    };
    
    store.dispatch(updatePoll(updatedPoll));

    const state = store.getState().polls;
    expect(state.currentPoll).toEqual(updatedPoll);
  });

  test('should clear currentPoll when it is deleted', () => {
    // First set current poll
    store.dispatch(setCurrentPoll({
      poll: mockPolls[0],
      comments: []
    }));
    
    // Then delete the same poll
    store.dispatch(deletePoll(mockPolls[0].id));

    const state = store.getState().polls;
    expect(state.currentPoll).toBeNull();
  });
});
