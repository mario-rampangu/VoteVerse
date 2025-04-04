import { configureStore } from '@reduxjs/toolkit';
import groupsReducer, {
  setGroups,
  addGroup,
  updateGroup,
  deleteGroup,
  setCurrentGroup,
  setGroupsLoading,
  setGroupsError
} from '../../../src/redux/slices/groupsSlice';
import { mockGroups } from '../../mocks/mockData';

describe('Groups Slice', () => {
  let store;

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        groups: groupsReducer
      }
    });
  });

  test('should handle initial state', () => {
    const state = store.getState().groups;
    expect(state).toEqual({
      groups: [],
      currentGroup: null,
      loading: false,
      error: null
    });
  });

  test('should handle setGroups', () => {
    store.dispatch(setGroups(mockGroups));

    const state = store.getState().groups;
    expect(state.groups).toEqual(mockGroups);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('should handle addGroup', () => {
    const newGroup = {
      id: '3',
      name: 'Test Group 3',
      description: 'This is a test group 3',
      created_by: '1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      is_active: true,
      members: [
        { id: '1', username: 'testuser1', role: 'admin' }
      ]
    };

    // First set some existing groups
    store.dispatch(setGroups(mockGroups));
    
    // Then add a new group
    store.dispatch(addGroup(newGroup));

    const state = store.getState().groups;
    expect(state.groups).toHaveLength(mockGroups.length + 1);
    expect(state.groups).toContainEqual(newGroup);
  });

  test('should handle updateGroup', () => {
    // First set some existing groups
    store.dispatch(setGroups(mockGroups));
    
    // Then update a group
    const updatedGroup = {
      ...mockGroups[0],
      name: 'Updated Group Name',
      description: 'Updated description'
    };
    
    store.dispatch(updateGroup(updatedGroup));

    const state = store.getState().groups;
    expect(state.groups).toHaveLength(mockGroups.length);
    expect(state.groups.find(g => g.id === updatedGroup.id)).toEqual(updatedGroup);
  });

  test('should handle deleteGroup', () => {
    // First set some existing groups
    store.dispatch(setGroups(mockGroups));
    
    // Then delete a group
    const groupIdToDelete = mockGroups[0].id;
    store.dispatch(deleteGroup(groupIdToDelete));

    const state = store.getState().groups;
    expect(state.groups).toHaveLength(mockGroups.length - 1);
    expect(state.groups.find(g => g.id === groupIdToDelete)).toBeUndefined();
  });

  test('should handle setCurrentGroup', () => {
    store.dispatch(setCurrentGroup(mockGroups[0]));

    const state = store.getState().groups;
    expect(state.currentGroup).toEqual(mockGroups[0]);
  });

  test('should handle setGroupsLoading', () => {
    store.dispatch(setGroupsLoading(true));

    let state = store.getState().groups;
    expect(state.loading).toBe(true);

    store.dispatch(setGroupsLoading(false));

    state = store.getState().groups;
    expect(state.loading).toBe(false);
  });

  test('should handle setGroupsError', () => {
    const error = 'Failed to fetch groups';
    store.dispatch(setGroupsError(error));

    const state = store.getState().groups;
    expect(state.error).toEqual(error);
    expect(state.loading).toBe(false);
  });

  test('should clear error when groups are successfully fetched', () => {
    // First set an error
    store.dispatch(setGroupsError('Failed to fetch groups'));
    
    // Then successfully fetch groups
    store.dispatch(setGroups(mockGroups));

    const state = store.getState().groups;
    expect(state.error).toBeNull();
  });

  test('should update currentGroup when it is updated in the groups list', () => {
    // First set current group
    store.dispatch(setCurrentGroup(mockGroups[0]));
    
    // Then update the same group
    const updatedGroup = {
      ...mockGroups[0],
      name: 'Updated Group Name',
      description: 'Updated description'
    };
    
    store.dispatch(updateGroup(updatedGroup));

    const state = store.getState().groups;
    expect(state.currentGroup).toEqual(updatedGroup);
  });

  test('should clear currentGroup when it is deleted', () => {
    // First set current group
    store.dispatch(setCurrentGroup(mockGroups[0]));
    
    // Then delete the same group
    store.dispatch(deleteGroup(mockGroups[0].id));

    const state = store.getState().groups;
    expect(state.currentGroup).toBeNull();
  });
});
