import { apiClient } from '../client';

export const submitContactForm = async (payload) => apiClient.post('/api/contact', payload);
