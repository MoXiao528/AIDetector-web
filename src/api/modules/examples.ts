import { apiClient } from '../client';

export interface HeroExampleItem {
  key: string;
  label: string;
  content: string;
  description?: string | null;
  ai?: number | null;
  mixed?: number | null;
  human?: number | null;
  snapshot?: string | null;
  snippet?: string | null;
  structure?: string | null;
  rhythm?: string | null;
  action?: string | null;
}

export interface UsageExampleItem {
  key: string;
  title: string;
  docType: string;
  length: string;
  description: string;
  ai: number;
  mixed: number;
  human: number;
  snapshot: string;
  snippet: string;
  content?: string | null;
}

export interface ScanExamplesResponse {
  locale: string;
  heroExamples: HeroExampleItem[];
  usageExamples: UsageExampleItem[];
}

export const fetchScanExamples = async (locale = 'zh-CN') =>
  apiClient.get<ScanExamplesResponse>(`/api/v1/scan/examples?locale=${encodeURIComponent(locale)}`, { auth: false });
