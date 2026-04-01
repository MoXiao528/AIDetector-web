import { apiClient } from '../client';

// ==================== 类型定义 ====================

export interface Summary {
    ai: number;
    mixed: number;
    human: number;
}

export interface Sentence {
    id: string;
    text: string;
    raw: string;
    type: 'ai' | 'mixed' | 'human';
    probability: number;
    score: number;
    reason: string;
    suggestion: string;
}

export interface Citation {
    id: string;
    text: string;
    source: string;
}

export interface Analysis {
    summary: Summary;
    sentences: Sentence[];
    translation: string;
    polish: string;
    citations: Citation[];
    ai_likely_count: number;
    highlighted_html: string;
}

export interface HistoryRecord {
    id: number;
    user_id: number;
    title: string;
    created_at: string;
    functions: string[];
    input_text: string;
    editor_html: string;
    analysis: Analysis | null;
}

export interface HistoryListResponse {
    items: HistoryRecord[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

export interface HistoryListParams {
    page?: number;
    per_page?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface CreateHistoryData {
    title: string;
    functions: string[];
    input_text: string;
    editor_html: string;
    analysis: Analysis | null;
}

export interface UpdateHistoryData {
    title: string;
}

export interface BatchDeleteResponse {
    deleted_count: number;
    failed_ids: number[];
}

export interface ClearAllResponse {
    deleted_count: number;
}

export interface ClaimGuestHistoryResponse {
    claimed_count: number;
}

// ==================== API 调用 ====================

/**
 * 获取历史记录列表（分页）
 */
export const getHistoryList = async (params?: HistoryListParams): Promise<HistoryListResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.per_page) queryParams.set('per_page', String(params.per_page));
    if (params?.sort) queryParams.set('sort', params.sort);
    if (params?.order) queryParams.set('order', params.order);

    const query = queryParams.toString();
    const path = query ? `/api/v1/history?${query}` : '/api/v1/history';

    return apiClient.get<HistoryListResponse>(path);
};

/**
 * 获取单条历史记录
 */
export const getHistoryRecord = async (id: number): Promise<HistoryRecord> => {
    return apiClient.get<HistoryRecord>(`/api/v1/history/${id}`);
};

/**
 * 创建历史记录
 */
export const createHistoryRecord = async (data: CreateHistoryData): Promise<HistoryRecord> => {
    return apiClient.post<HistoryRecord>('/api/v1/history', data);
};

/**
 * 更新历史记录（仅 title）
 */
export const updateHistoryRecord = async (id: number, data: UpdateHistoryData): Promise<HistoryRecord> => {
    return apiClient.patch<HistoryRecord>(`/api/v1/history/${id}`, data);
};

/**
 * 删除单条历史记录
 */
export const deleteHistoryRecord = async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/history/${id}`);
};

/**
 * 批量删除历史记录
 */
export const batchDeleteHistoryRecords = async (ids: number[]): Promise<BatchDeleteResponse> => {
    return apiClient.post<BatchDeleteResponse>('/api/v1/history/batch-delete', { ids });
};

/**
 * 清空所有历史记录
 */
export const clearAllHistory = async (): Promise<ClearAllResponse> => {
    return apiClient.delete<ClearAllResponse>('/api/v1/history');
};

export const claimGuestHistory = async (guestToken: string): Promise<ClaimGuestHistoryResponse> => {
    return apiClient.post<ClaimGuestHistoryResponse>('/api/v1/history/claim-guest', {
        guest_token: guestToken,
    });
};
