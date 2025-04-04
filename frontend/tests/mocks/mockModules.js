// Mock implementation for @reduxjs/toolkit
const reduxToolkit = {
  configureStore: (config) => ({
    getState: () => config.preloadedState || {},
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  }),
  createSlice: (config) => ({
    name: config.name,
    reducer: config.reducers,
    actions: Object.keys(config.reducers || {}).reduce((acc, key) => {
      acc[key] = (payload) => ({ type: `${config.name}/${key}`, payload });
      return acc;
    }, {}),
  }),
  createAsyncThunk: (type, payloadCreator) => {
    const actionCreator = (arg) => ({ type, payload: arg });
    actionCreator.pending = `${type}/pending`;
    actionCreator.fulfilled = `${type}/fulfilled`;
    actionCreator.rejected = `${type}/rejected`;
    return actionCreator;
  },
};

// Mock implementation for react-redux
const reactRedux = {
  Provider: ({ store, children }) => children,
  useDispatch: () => jest.fn(),
  useSelector: (selector) => selector({}),
};

// Mock implementation for Material UI
const materialUI = {
  ThemeProvider: ({ theme, children }) => children,
  CssBaseline: { default: () => null },
  createTheme: (options) => options,
  styled: (component) => (props) => component(props),
};

// Mock implementation for API service
const apiService = {
  get: jest.fn().mockResolvedValue({}),
  post: jest.fn().mockResolvedValue({}),
  put: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
};

// Mock implementation for auth service
const authService = {
  login: jest.fn().mockResolvedValue({ token: 'mock-token', user: { id: '1', username: 'testuser' } }),
  register: jest.fn().mockResolvedValue({ token: 'mock-token', user: { id: '1', username: 'testuser' } }),
  logout: jest.fn(),
  getCurrentUser: jest.fn().mockReturnValue({ id: '1', username: 'testuser' }),
};

// Mock modules for testing
const React = require('react');
const { mockApiResponses, mockUsers, mockGroups, mockPolls, mockComments } = require('./mockData');
const { Register, Poll, Group, Dashboard } = require('./mockComponents');
const { authSlice, groupsSlice, pollsSlice } = require('./mockSlices');

// Mock Material UI components
const mockMaterialUI = {
  Button: ({ children, onClick, ...props }) => React.createElement('button', { onClick, ...props, 'data-testid': 'mui-button' }, children),
  TextField: ({ label, ...props }) => React.createElement('input', { ...props, placeholder: label, 'data-testid': 'mui-textfield' }),
  Typography: ({ children, variant, ...props }) => React.createElement('div', { ...props, className: variant, 'data-testid': 'mui-typography' }, children),
  Box: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-box' }, children),
  Container: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-container' }, children),
  Grid: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-grid' }, children),
  Card: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-card' }, children),
  CardContent: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-card-content' }, children),
  CardActions: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-card-actions' }, children),
  Paper: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-paper' }, children),
  IconButton: ({ children, onClick, ...props }) => React.createElement('button', { onClick, ...props, 'data-testid': 'mui-icon-button' }, children),
  Divider: (props) => React.createElement('hr', { ...props, 'data-testid': 'mui-divider' }),
  List: ({ children, ...props }) => React.createElement('ul', { ...props, 'data-testid': 'mui-list' }, children),
  ListItem: ({ children, ...props }) => React.createElement('li', { ...props, 'data-testid': 'mui-list-item' }, children),
  ListItemText: ({ primary, secondary, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-list-item-text' }, [
    React.createElement('div', { key: 'primary' }, primary),
    secondary && React.createElement('div', { key: 'secondary' }, secondary)
  ]),
  CircularProgress: (props) => React.createElement('div', { ...props, 'data-testid': 'mui-circular-progress' }, 'Loading...'),
  FormControl: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-form-control' }, children),
  InputLabel: ({ children, ...props }) => React.createElement('label', { ...props, 'data-testid': 'mui-input-label' }, children),
  Select: ({ children, ...props }) => React.createElement('select', { ...props, 'data-testid': 'mui-select' }, children),
  MenuItem: ({ children, value, ...props }) => React.createElement('option', { value, ...props, 'data-testid': 'mui-menu-item' }, children),
  Snackbar: ({ open, message, ...props }) => open ? React.createElement('div', { ...props, 'data-testid': 'mui-snackbar' }, message) : null,
  Alert: ({ children, severity, ...props }) => React.createElement('div', { ...props, 'data-testid': `mui-alert-${severity}` }, children),
  Dialog: ({ open, children, ...props }) => open ? React.createElement('div', { ...props, 'data-testid': 'mui-dialog' }, children) : null,
  DialogTitle: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-dialog-title' }, children),
  DialogContent: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-dialog-content' }, children),
  DialogActions: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-dialog-actions' }, children),
  Tabs: ({ children, value, onChange, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-tabs' }, children),
  Tab: ({ label, ...props }) => React.createElement('div', { ...props, 'data-testid': 'mui-tab' }, label),
};

// Mock Redux toolkit
const mockReduxToolkit = {
  configureStore: () => ({
    getState: () => ({
      auth: {
        user: mockUsers[0],
        token: 'mock-jwt-token',
        isAuthenticated: true,
        loading: false,
        error: null
      },
      groups: {
        groups: mockGroups,
        loading: false,
        error: null
      },
      polls: {
        polls: mockPolls,
        loading: false,
        error: null
      }
    }),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn()
  }),
  createSlice: (options) => {
    if (options.name === 'auth') return authSlice;
    if (options.name === 'groups') return groupsSlice;
    if (options.name === 'polls') return pollsSlice;
    return {
      name: options.name,
      reducer: options.initialState,
      actions: {}
    };
  },
  createAsyncThunk: (type, thunkFn) => {
    return (...args) => {
      return {
        type,
        payload: args[0],
        meta: { requestStatus: 'fulfilled' }
      };
    };
  }
};

// Mock React Redux
const mockReactRedux = {
  Provider: ({ children }) => children,
  useDispatch: () => jest.fn(),
  useSelector: (selector) => {
    const state = {
      auth: {
        user: mockUsers[0],
        token: 'mock-jwt-token',
        isAuthenticated: true,
        loading: false,
        error: null
      },
      groups: {
        groups: mockGroups,
        loading: false,
        error: null
      },
      polls: {
        polls: mockPolls,
        loading: false,
        error: null
      }
    };
    return selector(state);
  }
};

// Mock React Router DOM
const mockReactRouterDom = {
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ path, element }) => element,
  Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props, 'data-testid': 'router-link' }, children),
  NavLink: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props, 'data-testid': 'router-navlink' }, children),
  Navigate: ({ to }) => React.createElement('div', { 'data-testid': 'router-navigate', to }, `Navigate to ${to}`),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null })
};

// Mock API services
const mockApiService = {
  get: jest.fn().mockImplementation((url) => {
    if (url.includes('/groups')) return Promise.resolve(mockGroups);
    if (url.includes('/polls')) return Promise.resolve(mockPolls);
    if (url.includes('/users')) return Promise.resolve(mockUsers);
    return Promise.resolve({});
  }),
  post: jest.fn().mockImplementation((url, data) => {
    if (url.includes('/auth/signin')) return Promise.resolve(mockApiResponses.login);
    if (url.includes('/auth/signup')) return Promise.resolve(mockApiResponses.register);
    if (url.includes('/groups')) return Promise.resolve(mockGroups[0]);
    if (url.includes('/polls')) return Promise.resolve(mockPolls[0]);
    return Promise.resolve({});
  }),
  put: jest.fn().mockImplementation((url, data) => {
    if (url.includes('/groups')) return Promise.resolve(mockGroups[0]);
    if (url.includes('/polls')) return Promise.resolve(mockPolls[0]);
    return Promise.resolve({});
  }),
  delete: jest.fn().mockImplementation((url) => {
    return Promise.resolve({ success: true });
  })
};

const mockAuthService = {
  login: jest.fn().mockImplementation((credentials) => {
    return Promise.resolve(mockApiResponses.login);
  }),
  register: jest.fn().mockImplementation((userData) => {
    return Promise.resolve(mockApiResponses.register);
  }),
  logout: jest.fn(),
  getCurrentUser: jest.fn().mockImplementation(() => {
    return mockUsers[0];
  }),
  isAuthenticated: jest.fn().mockImplementation(() => {
    return true;
  })
};

// Mock components
const mockComponents = {
  Register,
  Login: ({ onSubmit }) => {
    return React.createElement('div', { 'data-testid': 'login-component' }, [
      React.createElement('h1', { key: 'title', 'data-testid': 'login-title' }, 'Sign In'),
      React.createElement('form', { key: 'form', 'data-testid': 'login-form', onSubmit }, [
        React.createElement('input', { key: 'email', id: 'email', name: 'email', type: 'email', placeholder: 'Email', 'data-testid': 'email-input' }),
        React.createElement('input', { key: 'password', id: 'password', name: 'password', type: 'password', placeholder: 'Password', 'data-testid': 'password-input' }),
        React.createElement('button', { key: 'submit', type: 'submit', 'data-testid': 'submit-button' }, 'Sign In')
      ])
    ]);
  },
  Poll,
  Group,
  Dashboard
};

// Export all mocks
module.exports = {
  React,
  MaterialUI: mockMaterialUI,
  ReduxToolkit: mockReduxToolkit,
  ReactRedux: mockReactRedux,
  ReactRouterDom: mockReactRouterDom,
  ApiService: mockApiService,
  AuthService: mockAuthService,
  Components: mockComponents,
  reduxToolkit,
  reactRedux,
  materialUI,
  apiService,
  authService
};
