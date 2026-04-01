import { apiClient } from '../client';

export type AdminSystemRole = 'INDIVIDUAL' | 'TEAM_ADMIN' | 'SYS_ADMIN';
export type AdminActorType = 'user' | 'guest';
export type AdminDetectionLabel = 'ai' | 'mixed' | 'human';
export type AdminOverviewPreset = 'today' | 'week' | 'month' | 'quarter' | 'year';
export type AdminOverviewGranularity = 'hour' | 'day' | 'week' | 'month';

export interface AdminStatusResponse {
  message: string;
}

export interface AdminOverviewPeriod {
  preset: AdminOverviewPreset;
  granularity: AdminOverviewGranularity;
  startAt: string;
  endAt: string;
}

export interface AdminOverviewSummary {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  detections: number;
  charsUsed: number;
}

export interface AdminOverviewSeriesItem {
  bucketStart: string;
  bucketLabel: string;
  newUsers: number;
  detections: number;
  charsUsed: number;
}

export interface AdminRecentUserItem {
  id: number;
  email: string;
  name: string;
  systemRole: AdminSystemRole;
  isActive: boolean;
  createdAt: string;
}

export interface AdminRecentDetectionItem {
  id: number;
  userId: number | null;
  userEmail: string | null;
  userName: string | null;
  actorType: AdminActorType;
  actorId: string;
  label: AdminDetectionLabel;
  score: number;
  charsUsed: number;
  createdAt: string;
}

export interface AdminOverviewResponse {
  period: AdminOverviewPeriod;
  summary: AdminOverviewSummary;
  series: AdminOverviewSeriesItem[];
  recentUsers: AdminRecentUserItem[];
  recentDetections: AdminRecentDetectionItem[];
}

export interface AdminUserProfile {
  firstName: string | null;
  surname: string | null;
  organization: string | null;
  jobRole: string | null;
  industry: string | null;
}

export interface AdminDetectionMini {
  id: number;
  label: AdminDetectionLabel;
  score: number;
  charsUsed: number;
  createdAt: string;
}

export interface AdminUserListItem {
  id: number;
  email: string;
  name: string;
  systemRole: AdminSystemRole;
  planTier: string;
  isActive: boolean;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  createdAt: string;
}

export interface AdminUserDetailResponse extends AdminUserListItem {
  profile: AdminUserProfile | null;
  recentDetections: AdminDetectionMini[];
}

export interface AdminUserListResponse {
  items: AdminUserListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminUserUpdateRequest {
  systemRole?: AdminSystemRole | null;
  planTier?: string | null;
  isActive?: boolean | null;
}

export interface AdminUserCreditsAdjustRequest {
  delta: number;
  reason: string;
}

export interface AdminUserCreditsAdjustResponse {
  userId: number;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
}

export interface AdminDetectionListItem {
  id: number;
  userId: number | null;
  userEmail: string | null;
  userName: string | null;
  actorType: AdminActorType;
  actorId: string;
  label: AdminDetectionLabel;
  score: number;
  charsUsed: number;
  functionsUsed: string[];
  createdAt: string;
}

export interface AdminDetectionDetailResponse extends AdminDetectionListItem {
  title: string | null;
  inputText: string;
  editorHtml: string | null;
  metaJson: Record<string, unknown> | null;
  analysis: Record<string, unknown> | null;
}

export interface AdminDetectionListResponse {
  items: AdminDetectionListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminOverviewParams {
  preset?: AdminOverviewPreset;
}

export interface AdminUserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  systemRole?: AdminSystemRole | '';
  isActive?: boolean | '';
  planTier?: string;
  sort?: 'createdAt' | 'email' | 'creditsRemaining';
  order?: 'asc' | 'desc';
}

export interface AdminDetectionListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: number | '';
  actorType?: AdminActorType | '';
  label?: AdminDetectionLabel | '';
  function?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'createdAt' | 'score' | 'charsUsed';
  order?: 'asc' | 'desc';
}

const ADMIN_PREFIX = '/api/v1/admin';

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });
  const result = query.toString();
  return result ? `?${result}` : '';
};

export const fetchAdminStatus = async () => apiClient.get<AdminStatusResponse>(`${ADMIN_PREFIX}/status`);

export const fetchAdminOverview = async (params: AdminOverviewParams = {}) =>
  apiClient.get<AdminOverviewResponse>(
    `${ADMIN_PREFIX}/overview${buildQueryString({
      preset: params.preset ?? 'week',
    })}`
  );

export const fetchAdminUsers = async (params: AdminUserListParams = {}) =>
  apiClient.get<AdminUserListResponse>(
    `${ADMIN_PREFIX}/users${buildQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search,
      systemRole: params.systemRole,
      isActive: params.isActive,
      planTier: params.planTier,
      sort: params.sort ?? 'createdAt',
      order: params.order ?? 'desc',
    })}`
  );

export const fetchAdminUser = async (userId: number) => apiClient.get<AdminUserDetailResponse>(`${ADMIN_PREFIX}/users/${userId}`);

export const updateAdminUser = async (userId: number, payload: AdminUserUpdateRequest) =>
  apiClient.patch<AdminUserDetailResponse>(`${ADMIN_PREFIX}/users/${userId}`, payload);

export const adjustAdminUserCredits = async (userId: number, payload: AdminUserCreditsAdjustRequest) =>
  apiClient.post<AdminUserCreditsAdjustResponse>(`${ADMIN_PREFIX}/users/${userId}/credits`, payload);

export const fetchAdminDetections = async (params: AdminDetectionListParams = {}) =>
  apiClient.get<AdminDetectionListResponse>(
    `${ADMIN_PREFIX}/detections${buildQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search,
      userId: params.userId,
      actorType: params.actorType,
      label: params.label,
      function: params.function,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sort: params.sort ?? 'createdAt',
      order: params.order ?? 'desc',
    })}`
  );

export const fetchAdminDetection = async (detectionId: number) =>
  apiClient.get<AdminDetectionDetailResponse>(`${ADMIN_PREFIX}/detections/${detectionId}`);

export const deleteAdminDetection = async (detectionId: number) =>
  apiClient.delete<void>(`${ADMIN_PREFIX}/detections/${detectionId}`);
