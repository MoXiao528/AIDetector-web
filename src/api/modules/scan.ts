import { apiClient } from '../client';

export interface AnalysisSentence {
  text: string;
  score: number;
  label: 'Human' | 'AI' | 'Mixed';
  suggestion?: string;
}

export interface AnalysisResult {
  score: number;
  label: 'Human' | 'AI' | 'Mixed';
  summary: {
    ai: string;
    human: string;
    mixed: string;
  };
  sentences: AnalysisSentence[];
  polish?: string;
  translation?: string;
  citations?: Array<{ text: string; source: string }>;
}

export interface DetectionResponse {
  id: number;
  input_text: string;
  result: AnalysisResult;
  verdict: string;
  cost: number;
}

export const submitScan = async (payload) => apiClient.post('/api/scan', payload);

export const fetchScanHistory = async () => apiClient.get('/api/scan/history');

export const detectText = async (payload: { text: string; functions: string[] }) =>
  apiClient.post<DetectionResponse>('/api/v1/detections/', payload);

export const parseFiles = async (formData: FormData) =>
  apiClient.post('/api/v1/detections/parse-files', formData);
