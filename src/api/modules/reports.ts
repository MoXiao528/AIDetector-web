import { apiClient } from '../client';

export interface ReportPdfRequest {
  reportType: 'scan' | 'history';
  locale?: string;
  historyId: number;
}

export const exportPdfReport = async (payload: ReportPdfRequest) =>
  apiClient.postBlob('/api/v1/reports/pdf', payload);
