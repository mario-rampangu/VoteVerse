import axios from 'axios';

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8085/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const signup = async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', {
        username,
        email,
        password
    });
    return response.data;
};

export const signin = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/signin', {
        email,
        password
    });
    return response.data;
};

export const getProfile = async (): Promise<User> => {
    const response = await api.get('/user/profile');
    return response.data;
};

export const saveAuthData = (data: AuthResponse) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
};

export const getAuthData = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
};

export const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const isAdmin = () => {
    const { user } = getAuthData();
    return user?.role === 'admin';
};

export const isAuthenticated = () => {
    const { token } = getAuthData();
    return !!token;
}; 