import { apiClient } from '../client';

export const login = async (payload) => apiClient.post('/api/auth/login', payload, { auth: false });

export const logout = async () => apiClient.post('/api/auth/logout');

export const fetchProfile = async () => apiClient.get('/api/auth/profile');
