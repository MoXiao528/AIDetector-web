import { apiClient } from '../client';

export const login = async (payload) => apiClient.post('/api/auth/login', payload, { auth: false });

export const register = async (payload) => apiClient.post('/api/auth/register', payload, { auth: false });

export const fetchMe = async () => apiClient.get('/api/auth/me');

export const logout = async () => apiClient.post('/api/auth/logout');
