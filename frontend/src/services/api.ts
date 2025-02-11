import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8085/api';

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: false,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Group API
export const groupApi = {
  create: async (data: { name: string; description: string }) => {
    try {
      const response = await api.post('/groups', data);
      return response.data;
    } catch (error: any) {
      console.error('Create group error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to create group',
        details: error.response?.data?.details || {},
      };
    }
  },

  list: async () => {
    try {
      const response = await api.get('/groups');
      return { data: response.data || [] };
    } catch (error: any) {
      console.error('List groups error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to fetch groups',
        details: error.response?.data?.details || {},
      };
    }
  },

  search: async (query: string) => {
    try {
      const response = await api.get('/groups/search', { params: { q: query } });
      return { data: response.data || [] };
    } catch (error: any) {
      console.error('Search groups error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to search groups',
        details: error.response?.data?.details || {},
      };
    }
  },

  join: async (groupId: string) => {
    try {
      const response = await api.post(`/groups/${groupId}/join`);
      return response.data;
    } catch (error: any) {
      console.error('Join group error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to join group',
        details: error.response?.data?.details || {},
      };
    }
  },
};

// Poll API
export const pollApi = {
  create: (data: {
    group_id?: string;
    title: string;
    description: string;
    options: Array<{ text: string; image_url?: string }>;
    start_time?: Date;
    end_time?: Date;
    visibility: 'public' | 'group';
  }) => api.post('/polls', data),

  list: async (params?: { groupId?: string; visibility?: 'all' | 'public' | 'group' }) => {
    try {
      let url = '/polls';
      if (params?.groupId) {
        url = `/polls?group_id=${params.groupId}`;
      }
      const response = await api.get(url);
      return { data: response.data || [] };
    } catch (error: any) {
      console.error('List polls error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to fetch polls',
        details: error.response?.data?.details || {},
      };
    }
  },

  get: async (pollId: string) => {
    try {
      const response = await api.get(`/polls/${pollId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching poll:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to fetch poll',
        details: error.response?.data?.details || {},
      };
    }
  },

  vote: (pollId: string, optionId: string) =>
    api.post(`/polls/${pollId}/vote`, { option_id: optionId }),
};

// Comment API
export const commentApi = {
  create: (pollId: string, text: string) =>
    api.post(`/comments/poll/${pollId}`, { text }),

  list: (pollId: string) => api.get(`/comments/poll/${pollId}`),

  delete: (commentId: string) => api.delete(`/comments/${commentId}`),
};

// Types
export interface Group {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PollOption {
  _id: string;
  text: string;
  image_url?: string;
  vote_count: number;
}

export interface Poll {
  _id: string;
  group_id?: string;
  creator_id: string;
  title: string;
  description: string;
  options: PollOption[];
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  visibility: 'public' | 'group';
  user_vote?: string;
}

export interface Comment {
  _id: string;
  text: string;
  created_at: string;
  updated_at: string;
  user: {
    _id: string;
    username: string;
  };
}

export const fetchPollsForGroup = async (groupId: string) => {
  try {
    const response = await api.get(`/polls?group_id=${groupId}`);
    return { data: response.data || [] };
  } catch (error) {
    console.error('Error fetching polls:', error);
    throw error;
  }
};

export const createPoll = async (data: {
  title: string;
  description: string;
  options: string[];
  group_id: string;
}) => {
  try {
    const response = await api.post('/polls', data);
    return response.data;
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
};

export const votePoll = async (pollId: string, option: string) => {
  try {
    const response = await api.post(`/polls/${pollId}/vote`, { option });
    return response.data;
  } catch (error) {
    console.error('Error voting on poll:', error);
    throw error;
  }
};

export default api; 