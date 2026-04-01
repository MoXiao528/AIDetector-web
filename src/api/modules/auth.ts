import { apiClient } from '../client';
import { showToast } from '../../utils/toast';

const AUTH_PREFIX = '/api/v1/auth';
const LEGACY_USER_TOKEN_STORAGE_KEY = 'auth_token';
const AUTH_SESSION_STORAGE_KEY = 'auth_session';
const GUEST_TOKEN_STORAGE_KEY = 'guest_token';
const GUEST_SESSION_ID_STORAGE_KEY = 'guest_session_id';
const GUEST_TOKEN_REFRESH_SKEW_SECONDS = 30;

interface GuestJwtPayload {
  exp?: number;
  guest_id?: string;
  sub?: string;
  sub_type?: string;
}

interface AuthTokenResponse {
  accessToken?: string;
  access_token?: string;
  token?: string;
  guest_id?: string;
  guestId?: string;
  data?: {
    token?: string;
  };
}

export const getStoredGuestToken = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(GUEST_TOKEN_STORAGE_KEY) || '';
};

export const getStoredGuestSessionId = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(GUEST_SESSION_ID_STORAGE_KEY) || '';
};

export const clearGuestToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(GUEST_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(GUEST_SESSION_ID_STORAGE_KEY);
};

const hasStoredUserSession = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) === '1';
};

const persistGuestSessionId = (guestSessionId: string) => {
  if (typeof window === 'undefined') return;
  const normalized = String(guestSessionId || '').trim();
  if (!normalized) return;
  window.localStorage.setItem(GUEST_SESSION_ID_STORAGE_KEY, normalized);
};

const decodeJwtPayload = (token: string): GuestJwtPayload | null => {
  const rawToken = String(token || '').trim();
  if (!rawToken) return null;

  const segments = rawToken.split('.');
  if (segments.length < 2) return null;

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = `${base64}${'='.repeat((4 - (base64.length % 4 || 4)) % 4)}`;
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

const isGuestTokenExpired = (payload: GuestJwtPayload | null) => {
  const expiresAt = Number(payload?.exp || 0);
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) return true;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  return expiresAt - currentTimestamp <= GUEST_TOKEN_REFRESH_SKEW_SECONDS;
};

const syncGuestIdentityFromToken = (token: string) => {
  const payload = decodeJwtPayload(token);
  const guestSessionId = String(payload?.guest_id || payload?.sub || '').trim();
  if (String(payload?.sub_type || '').toLowerCase() === 'guest' && guestSessionId) {
    persistGuestSessionId(guestSessionId);
  }
  return payload;
};

export const login = async (payload) => apiClient.post<AuthTokenResponse>(`${AUTH_PREFIX}/login`, payload, { auth: false });

export const register = async (payload) => apiClient.post<AuthTokenResponse>(`${AUTH_PREFIX}/register`, payload, { auth: false });

export const fetchMe = async () => apiClient.get(`${AUTH_PREFIX}/me`);

export const updateProfile = async (payload) => apiClient.patch(`${AUTH_PREFIX}/me/profile`, payload);

export const logout = async () => apiClient.post(`${AUTH_PREFIX}/logout`, undefined);

export const ensureGuestToken = async () => {
  if (typeof window === 'undefined') return '';

  window.localStorage.removeItem(LEGACY_USER_TOKEN_STORAGE_KEY);
  if (hasStoredUserSession()) return '';

  const guestToken = getStoredGuestToken();
  const guestPayload = guestToken ? syncGuestIdentityFromToken(guestToken) : null;
  if (guestToken && !isGuestTokenExpired(guestPayload)) {
    return guestToken;
  }

  try {
    const guestSessionId = getStoredGuestSessionId() || String(guestPayload?.guest_id || guestPayload?.sub || '').trim();
    const response = await apiClient.post<AuthTokenResponse>(
      `${AUTH_PREFIX}/guest`,
      guestSessionId ? { guest_id: guestSessionId } : undefined,
      { auth: false }
    );
    const token = response?.accessToken || response?.access_token || response?.token || response?.data?.token;
    if (!token) {
      throw new Error('Missing guest token');
    }

    window.localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token);
    const nextPayload = syncGuestIdentityFromToken(token);
    const responseGuestId = String(response?.guest_id || response?.guestId || nextPayload?.guest_id || '').trim();
    if (responseGuestId) {
      persistGuestSessionId(responseGuestId);
    }
    return token;
  } catch (error) {
    showToast({ title: '提示', message: '获取游客凭证失败' });
    throw error;
  }
};
