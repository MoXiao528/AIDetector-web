import { apiClient } from '../client';

export const fetchQuota = async () => apiClient.get('/api/v1/quota', { guestAuth: true });
