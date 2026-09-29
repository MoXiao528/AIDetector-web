import { apiClient, type ApiRequestOptions } from '../client';
import type { EvidenceResult } from './scan';

// ==================== 类型定义 ====================

export interface Summary {
    ai: number;
    human: number;
}

export interface Sentence {
    id: string;
    text: string;
    raw: string;
    type: 'ai' | 'human' | 'too_short';
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
    user_id: number | null;
    title: string;
    created_at: string;
    functions: string[];
    input_text: string;
    editor_html: string;
    is_pinned?: boolean;
    isPinned?: boolean;
    analysis: Analysis | null;
    evidence?: EvidenceResult;
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
    q?: string;
    pinned?: boolean | null;
}

export interface CreateHistoryData {
    title: string;
    functions: string[];
    input_text: string;
    editor_html: string;
    analysis: Analysis | null;
    is_pinned?: boolean;
}

export interface UpdateHistoryData {
    title?: string;
    is_pinned?: boolean;
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

const historyPath = (guestToken = '') => guestToken ? '/api/v1/guest/history' : '/api/v1/history';
const historyOptions = (guestToken = ''): ApiRequestOptions | undefined => guestToken
    ? { auth: false, headers: { Authorization: `Bearer ${guestToken}` } }
    : undefined;

/**
 * 获取历史记录列表（分页）
 */
export const getHistoryList = async (params?: HistoryListParams, guestToken = ''): Promise<HistoryListResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.per_page) queryParams.set('per_page', String(params.per_page));
    if (params?.sort) queryParams.set('sort', params.sort);
    if (params?.order) queryParams.set('order', params.order);
    if (params?.q) queryParams.set('q', params.q);
    if (typeof params?.pinned === 'boolean') queryParams.set('pinned', String(params.pinned));

    const query = queryParams.toString();
    const path = `${historyPath(guestToken)}${query ? `?${query}` : ''}`;

    return apiClient.get<HistoryListResponse>(path, historyOptions(guestToken));
};

/**
 * 获取单条历史记录
 */
export const getHistoryRecord = async (id: number, guestToken = ''): Promise<HistoryRecord> => {
    return apiClient.get<HistoryRecord>(`${historyPath(guestToken)}/${id}`, historyOptions(guestToken));
};

/**
 * 创建历史记录
 */
export const createHistoryRecord = async (data: CreateHistoryData): Promise<HistoryRecord> => {
    return apiClient.post<HistoryRecord>('/api/v1/history', data);
};

/**
 * 更新历史记录的标题或置顶状态
 */
export const updateHistoryRecord = async (id: number, data: UpdateHistoryData, guestToken = ''): Promise<HistoryRecord> => {
    return apiClient.patch<HistoryRecord>(`${historyPath(guestToken)}/${id}`, data, historyOptions(guestToken));
};

/**
 * 删除单条历史记录
 */
export const deleteHistoryRecord = async (id: number, guestToken = ''): Promise<void> => {
    return apiClient.delete<void>(`${historyPath(guestToken)}/${id}`, historyOptions(guestToken));
};

/**
 * 批量删除历史记录
 */
export const batchDeleteHistoryRecords = async (ids: number[], guestToken = ''): Promise<BatchDeleteResponse> => {
    return apiClient.post<BatchDeleteResponse>(`${historyPath(guestToken)}/batch-delete`, { ids }, historyOptions(guestToken));
};

/**
 * 清空所有历史记录
 */
export const clearAllHistory = async (guestToken = ''): Promise<ClearAllResponse> => {
    return apiClient.delete<ClearAllResponse>(historyPath(guestToken), historyOptions(guestToken));
};

export const claimGuestHistory = async (guestToken: string): Promise<ClaimGuestHistoryResponse> => {
    return apiClient.post<ClaimGuestHistoryResponse>('/api/v1/history/claim-guest', {
        guest_token: guestToken,
    });
};
