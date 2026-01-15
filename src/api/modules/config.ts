import { apiClient } from '../client';

export const fetchAppConfig = async () => apiClient.get('/api/config');
