import { apiClient } from '../client';

export interface AnalysisSentence {
  id?: string;
  text: string;
  raw?: string;
  startParagraph?: number;
  endParagraph?: number;
  start_paragraph?: number;
  end_paragraph?: number;
  score?: number;
  probability?: number;
  type?: 'ai' | 'mixed' | 'human';
  label?: 'Human' | 'AI' | 'Mixed';
  reason?: string;
  suggestion?: string;
}

export interface AnalysisResult {
  score?: number;
  label?: 'Human' | 'AI' | 'Mixed';
  summary?: {
    ai: string | number;
    human: string | number;
    mixed: string | number;
  };
  sentences?: AnalysisSentence[];
  polish?: string;
  translation?: string;
  citations?: Array<{ id?: string; text?: string; source?: string; excerpt?: string; note?: string; status?: string }>;
  aiLikelyCount?: number;
  ai_likely_count?: number;
  highlightedHtml?: string;
  highlighted_html?: string;
}

export interface DetectionResponse {
  id?: number;
  detection_id?: number;
  detectionId?: number;
  history_id?: number;
  historyId?: number;
  input_text?: string;
  inputText?: string;
  result?: AnalysisResult;
  verdict?: string;
  cost?: number;
  currentCredits?: number;
}

export const submitScan = async (payload: any) => apiClient.post('/api/scan', payload);

export const fetchScanHistory = async () => apiClient.get('/api/scan/history');

export const detectText = async (payload: { text: string; functions: string[]; editorHtml?: string }) =>
  apiClient.post<DetectionResponse>('/api/v1/detect', payload, { guestAuth: true });

export const parseFiles = async (formData: FormData) =>
  apiClient.post('/api/v1/detections/parse-files', formData);
