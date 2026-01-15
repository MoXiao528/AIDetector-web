import { apiClient } from '../client';

export const submitScan = async (payload) => apiClient.post('/api/scan', payload);

export const fetchScanHistory = async () => apiClient.get('/api/scan/history');
