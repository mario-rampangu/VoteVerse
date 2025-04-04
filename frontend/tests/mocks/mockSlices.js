// Mock Redux slices for testing

// Mock authSlice
const authSlice = {
  name: 'auth',
  reducer: (state = { user: null, token: null, isAuthenticated: false, loading: false, error: null }, action) => {
    switch (action.type) {
      case 'auth/loginSuccess':
        return {
          ...state,
          user: action.payload.user,
          token: action.payload.token,
          isAuthenticated: true,
          loading: false,
          error: null
        };
      case 'auth/logoutUser':
        return {
          ...state,
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null
        };
      case 'auth/registerSuccess':
        return {
          ...state,
          user: action.payload.user,
          token: action.payload.token,
          isAuthenticated: true,
          loading: false,
          error: null
        };
      default:
        return state;
    }
  },
  actions: {
    loginSuccess: (payload) => ({ type: 'auth/loginSuccess', payload }),
    logoutUser: () => ({ type: 'auth/logoutUser' }),
    registerSuccess: (payload) => ({ type: 'auth/registerSuccess', payload })
  }
};

// Mock groupsSlice
const groupsSlice = {
  name: 'groups',
  reducer: (state = { groups: [], loading: false, error: null }, action) => {
    switch (action.type) {
      case 'groups/setGroups':
        return {
          ...state,
          groups: action.payload,
          loading: false,
          error: null
        };
      case 'groups/addGroup':
        return {
          ...state,
          groups: [...state.groups, action.payload],
          loading: false,
          error: null
        };
      case 'groups/updateGroup':
        return {
          ...state,
          groups: state.groups.map(group => 
            group.id === action.payload.id ? action.payload : group
          ),
          loading: false,
          error: null
        };
      case 'groups/deleteGroup':
        return {
          ...state,
          groups: state.groups.filter(group => group.id !== action.payload),
          loading: false,
          error: null
        };
      default:
        return state;
    }
  },
  actions: {
    setGroups: (payload) => ({ type: 'groups/setGroups', payload }),
    addGroup: (payload) => ({ type: 'groups/addGroup', payload }),
    updateGroup: (payload) => ({ type: 'groups/updateGroup', payload }),
    deleteGroup: (payload) => ({ type: 'groups/deleteGroup', payload })
  }
};

// Mock pollsSlice
const pollsSlice = {
  name: 'polls',
  reducer: (state = { polls: [], loading: false, error: null }, action) => {
    switch (action.type) {
      case 'polls/setPolls':
        return {
          ...state,
          polls: action.payload,
          loading: false,
          error: null
        };
      case 'polls/addPoll':
        return {
          ...state,
          polls: [...state.polls, action.payload],
          loading: false,
          error: null
        };
      case 'polls/updatePoll':
        return {
          ...state,
          polls: state.polls.map(poll => 
            poll.id === action.payload.id ? action.payload : poll
          ),
          loading: false,
          error: null
        };
      case 'polls/deletePoll':
        return {
          ...state,
          polls: state.polls.filter(poll => poll.id !== action.payload),
          loading: false,
          error: null
        };
      default:
        return state;
    }
  },
  actions: {
    setPolls: (payload) => ({ type: 'polls/setPolls', payload }),
    addPoll: (payload) => ({ type: 'polls/addPoll', payload }),
    updatePoll: (payload) => ({ type: 'polls/updatePoll', payload }),
    deletePoll: (payload) => ({ type: 'polls/deletePoll', payload })
  }
};

// Export mock slices
module.exports = {
  authSlice,
  groupsSlice,
  pollsSlice
};
