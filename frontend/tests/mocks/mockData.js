// Mock data for testing

// Mock API responses
const mockApiResponses = {
  login: {
    token: 'mock-jwt-token',
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user'
    }
  },
  register: {
    token: 'mock-jwt-token',
    user: {
      id: '2',
      name: 'New User',
      email: 'new@example.com',
      role: 'user'
    }
  },
  error: {
    message: 'An error occurred'
  }
};

// Mock users data
const mockUsers = [
  {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    avatar: 'https://via.placeholder.com/150',
    groups: ['1', '2'],
    polls: ['1', '3']
  },
  {
    id: '2',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://via.placeholder.com/150',
    groups: ['1', '3'],
    polls: ['2']
  },
  {
    id: '3',
    name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
    avatar: 'https://via.placeholder.com/150',
    groups: ['2'],
    polls: []
  }
];

// Mock groups data
const mockGroups = [
  {
    id: '1',
    name: 'Test Group',
    description: 'A test group for testing purposes',
    creator: '1',
    members: ['1', '2'],
    polls: ['1', '2'],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z'
  },
  {
    id: '2',
    name: 'Another Group',
    description: 'Another test group',
    creator: '2',
    members: ['1', '3'],
    polls: ['3'],
    createdAt: '2023-02-01T00:00:00.000Z',
    updatedAt: '2023-02-02T00:00:00.000Z'
  },
  {
    id: '3',
    name: 'Third Group',
    description: 'Third test group',
    creator: '3',
    members: ['2'],
    polls: [],
    createdAt: '2023-03-01T00:00:00.000Z',
    updatedAt: '2023-03-02T00:00:00.000Z'
  }
];

// Mock polls data
const mockPolls = [
  {
    id: '1',
    title: 'Test Poll',
    description: 'A test poll for testing purposes',
    creator: '1',
    group: '1',
    options: [
      { id: '1', text: 'Option 1', votes: 5 },
      { id: '2', text: 'Option 2', votes: 3 }
    ],
    status: 'active',
    createdAt: '2023-01-10T00:00:00.000Z',
    updatedAt: '2023-01-11T00:00:00.000Z',
    endDate: '2023-12-31T00:00:00.000Z',
    comments: ['1', '2']
  },
  {
    id: '2',
    title: 'Another Poll',
    description: 'Another test poll',
    creator: '2',
    group: '1',
    options: [
      { id: '3', text: 'Option A', votes: 2 },
      { id: '4', text: 'Option B', votes: 7 }
    ],
    status: 'active',
    createdAt: '2023-02-10T00:00:00.000Z',
    updatedAt: '2023-02-11T00:00:00.000Z',
    endDate: '2023-12-31T00:00:00.000Z',
    comments: []
  },
  {
    id: '3',
    title: 'Third Poll',
    description: 'Third test poll',
    creator: '1',
    group: '2',
    options: [
      { id: '5', text: 'Yes', votes: 10 },
      { id: '6', text: 'No', votes: 2 }
    ],
    status: 'closed',
    createdAt: '2023-03-10T00:00:00.000Z',
    updatedAt: '2023-03-11T00:00:00.000Z',
    endDate: '2023-03-31T00:00:00.000Z',
    comments: ['3']
  }
];

// Mock comments data
const mockComments = [
  {
    id: '1',
    text: 'This is a test comment',
    author: '1',
    poll: '1',
    createdAt: '2023-01-15T00:00:00.000Z'
  },
  {
    id: '2',
    text: 'Another test comment',
    author: '2',
    poll: '1',
    createdAt: '2023-01-16T00:00:00.000Z'
  },
  {
    id: '3',
    text: 'Comment on the third poll',
    author: '3',
    poll: '3',
    createdAt: '2023-03-20T00:00:00.000Z'
  }
];

// Export all mock data
module.exports = {
  mockApiResponses,
  mockUsers,
  mockGroups,
  mockPolls,
  mockComments
};
