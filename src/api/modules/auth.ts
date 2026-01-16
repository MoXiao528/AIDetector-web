import { apiClient } from '../client';

export const login = async (payload) => apiClient.post('/api/v1/auth/login', payload, { auth: false });

export const register = async (payload) => apiClient.post('/api/v1/auth/register', payload, { auth: false });

export const fetchMe = async () => apiClient.get('/api/v1/auth/me');

export const updateProfile = async (payload) => apiClient.patch('/api/v1/auth/me/profile', payload);
