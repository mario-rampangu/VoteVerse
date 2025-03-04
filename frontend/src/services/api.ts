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
    console.log('[API] Request with auth:', {
      url: config.url,
      method: config.method,
      hasToken: !!token
    });
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response success:', {
      url: response.config.url,
      status: response.status,
      dataSize: JSON.stringify(response.data).length
    });
    return response;
  },
  (error) => {
    console.error('[API] Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message
    });
    if (error.response?.status === 401) {
      console.warn('[API] Auth token expired or invalid');
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
      console.log('Raw API response from create:', response.data);
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
      console.log('Raw API response from list:', response.data);
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
      console.log('Raw API response from search:', response.data);
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
      console.log('Raw API response from join:', response.data);
      return response.data as Group;
    } catch (error: any) {
      console.error('Join group error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to join group',
        details: error.response?.data?.details || {},
      };
    }
  },

  leave: async (groupId: string) => {
    try {
      const response = await api.post(`/groups/${groupId}/leave`);
      console.log('Raw API response from leave:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Leave group error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to leave group',
        details: error.response?.data?.details || {},
      };
    }
  },

  get: async (groupId: string) => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      console.log('Raw API response from get group:', response.data);
      return response.data as Group;
    } catch (error: any) {
      console.error('Get group error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to get group',
        details: error.response?.data?.details || {},
      };
    }
  },
};

// Poll API
export const pollApi = {
  list: async ({ groupId }: { groupId?: string } = {}) => {
    try {
      console.log('[API] Fetching polls with params:', { groupId });
      const response = await api.get('/polls', {
        params: {
          group_id: groupId
        }
      });
      console.log('Raw API response from list:', response.data);
      return { data: response.data };
    } catch (error: any) {
      console.error('[API] Error fetching polls:', error.response?.data);
      throw error;
    }
  },

  fetchAll: async () => {
    try {
      console.log('[API] Fetching all polls');
      const response = await api.get('/polls');
      console.log('Raw API response from fetchAll:', response.data);
      return { data: response.data };
    } catch (error: any) {
      console.error('[API] Error fetching all polls:', error.response?.data);
      throw error;
    }
  },

  fetchRecent: async (limit: number = 10) => {
    try {
      console.log('[API] Fetching recent polls:', { limit });
      const response = await api.get('/polls', {
        params: {
          limit,
          sort: 'recent'
        }
      });
      console.log('Raw API response from fetchRecent:', response.data);
      return { data: response.data };
    } catch (error: any) {
      console.error('[API] Error fetching recent polls:', error.response?.data);
      throw error;
    }
  },

  fetchForGroup: async (groupId: string) => {
    try {
      console.log('[API] Fetching polls for group:', groupId);
      const response = await api.get('/polls', {
        params: {
          group_id: groupId
        }
      });
      console.log('Raw API response from fetchForGroup:', response.data);
      return { data: response.data };
    } catch (error: any) {
      console.error('[API] Error fetching group polls:', error.response?.data || error.message);
      throw error;
    }
  },

  create: async (data: {
    title: string;
    description: string;
    options: string[];
    group_id?: string;
    visibility: 'public' | 'group';
    end_time?: string;
  }) => {
    try {
      // Convert string options to PollOption objects
      const formattedData = {
        ...data,
        options: data.options.map(text => ({ text, image_url: '' })),
        end_time: data.end_time ? new Date(data.end_time) : new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      console.log('[API] Creating poll with formatted data:', formattedData);
      
      const response = await api.post('/polls', formattedData);
      console.log('Raw API response from create:', response.data);
      return { data: response.data };
    } catch (error: any) {
      console.error('Create poll error:', error.response?.data || error.message);
      throw error;
    }
  },

  get: async (pollId: string) => {
    if (!pollId || pollId === "undefined") {
      console.error('[API] Error: Attempted to fetch poll details with undefined or invalid pollId');
      throw new Error('Valid Poll ID is required');
    }
    
    try {
      console.log('[API] Fetching poll details:', { pollId });
      const response = await api.get(`/polls/${pollId}`);
      console.log('Raw API response from get poll:', response.data);
      return { data: response.data };
    } catch (error: any) {
      console.error('[API] Error fetching poll details:', error.response?.data || error.message);
      throw error;
    }
  },

  vote: async (pollId: string, optionId: string) => {
    if (!pollId || !optionId || pollId === "undefined" || optionId === "undefined") {
      console.error('[API] Error: Attempted to vote with undefined or invalid pollId or optionId');
      throw new Error('Valid Poll ID and Option ID are required');
    }
    
    try {
      console.log('[API] Submitting vote:', { pollId, optionId });
      const response = await api.post(`/polls/${pollId}/vote`, { option_id: optionId });
      console.log('Raw API response from vote:', response.data);
      return { data: response.data };
    } catch (error: any) {
      console.error('[API] Error submitting vote:', error.response?.data || error.message);
      throw error;
    }
  },

  listWithFilters: async (params?: { groupId?: string; visibility?: 'all' | 'public' | 'group' }) => {
    try {
      console.log('[API] Fetching polls with params:', params);
      let url = '/polls';
      if (params?.groupId) {
        url = `/polls?group_id=${params.groupId}`;
      }
      const response = await api.get(url);
      console.log('[API] Raw API response from list:', response.data);
      
      // Ensure we're returning an array even if the response is empty or malformed
      const pollsData = Array.isArray(response.data) ? response.data : [];
      console.log('[API] Processed polls data:', { count: pollsData.length });
      
      return { data: pollsData };
    } catch (error: any) {
      console.error('[API] List polls error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to fetch polls',
        details: error.response?.data?.details || {},
      };
    }
  },
};

// User API for admin
export const userApi = {
  list: async () => {
    try {
      const response = await api.get('/admin/users');
      console.log('Raw API response from list users:', response.data);
      return { data: response.data || [] };
    } catch (error: any) {
      console.error('List users error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to fetch users',
        details: error.response?.data?.details || {},
      };
    }
  },

  create: async (data: { username: string; email: string; password: string; role: string }) => {
    try {
      const response = await api.post('/admin/users', data);
      console.log('Raw API response from create user:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Create user error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to create user',
        details: error.response?.data?.details || {},
      };
    }
  },

  updateRole: async (userId: string, role: string) => {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role });
      console.log('Raw API response from update user role:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Update user role error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to update user role',
        details: error.response?.data?.details || {},
      };
    }
  },

  delete: async (userId: string) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      console.log('Raw API response from delete user:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Delete user error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to delete user',
        details: error.response?.data?.details || {},
      };
    }
  },
};

// Admin API for content moderation
export const adminApi = {
  deleteGroup: async (groupId: string, reason: string) => {
    try {
      const response = await api.delete(`/admin/groups/${groupId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error: any) {
      console.error('Admin delete group error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to delete group',
        details: error.response?.data?.details || {},
      };
    }
  },

  deletePoll: async (pollId: string, reason: string) => {
    try {
      const response = await api.delete(`/admin/polls/${pollId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error: any) {
      console.error('Admin delete poll error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to delete poll',
        details: error.response?.data?.details || {},
      };
    }
  },
  
  // New methods for explicitly fetching all groups and polls
  getAllGroups: async () => {
    try {
      const response = await api.get('/admin/groups/all');
      console.log('Raw API response from admin getAllGroups:', response.data);
      return { data: response.data || [] };
    } catch (error: any) {
      console.error('Admin get all groups error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to fetch all groups',
        details: error.response?.data?.details || {},
      };
    }
  },
  
  getAllPolls: async (params?: { limit?: number; sort?: string }) => {
    try {
      const response = await api.get('/admin/polls/all', { params });
      console.log('Raw API response from admin getAllPolls:', response.data);
      return { data: response.data || [] };
    } catch (error: any) {
      console.error('Admin get all polls error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || 'Failed to fetch all polls',
        details: error.response?.data?.details || {},
      };
    }
  }
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
  is_member: boolean;
}

export interface PollOption {
  _id: string;
  id?: string;
  text: string;
  image_url?: string;
  vote_count: number;
}

export interface Poll {
  _id: string;
  id?: string;
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
    console.log('Raw API response from fetchPollsForGroup:', response.data);
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
    console.log('Raw API response from createPoll:', response.data);
    return { data: response.data };
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
};

export const votePoll = async (pollId: string, option: string) => {
  try {
    const response = await api.post(`/polls/${pollId}/vote`, { option });
    console.log('Raw API response from votePoll:', response.data);
    return { data: response.data };
  } catch (error) {
    console.error('Error voting on poll:', error);
    throw error;
  }
};

export default api; 