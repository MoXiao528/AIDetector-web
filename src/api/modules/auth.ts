import { apiClient } from '../client';
import { showToast } from '../../utils/toast';

const AUTH_PREFIX = '/api/v1/auth';
const LEGACY_USER_TOKEN_STORAGE_KEY = 'auth_token';
const AUTH_SESSION_STORAGE_KEY = 'auth_session';
const GUEST_TOKEN_STORAGE_KEY = 'guest_token';
const GUEST_SESSION_ID_STORAGE_KEY = 'guest_session_id';
const GUEST_TOKEN_REFRESH_SKEW_SECONDS = 30;
let guestTokenRequest: Promise<string> | null = null;

interface GuestJwtPayload {
  exp?: number;
  sid?: string;
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

export const clearGuestToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(GUEST_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(GUEST_SESSION_ID_STORAGE_KEY);
};

const hasStoredUserSession = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) === '1';
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

const isGuestSessionToken = (payload: GuestJwtPayload | null) => {
  const subject = String(payload?.sub || '').trim();
  const sessionId = String(payload?.sid || '').trim();
  return String(payload?.sub_type || '').toLowerCase() === 'guest' && Boolean(subject) && sessionId === subject;
};

export const login = async (payload) => apiClient.post<AuthTokenResponse>(`${AUTH_PREFIX}/login`, payload, { auth: false });

export const register = async (payload) => apiClient.post<AuthTokenResponse>(`${AUTH_PREFIX}/register`, payload, { auth: false });

export const fetchMe = async () => apiClient.get(`${AUTH_PREFIX}/me`);

export const updateProfile = async (payload) => apiClient.patch(`${AUTH_PREFIX}/me/profile`, payload);

export const logout = async () => apiClient.post(`${AUTH_PREFIX}/logout`, undefined);

const resolveGuestToken = async () => {
  if (typeof window === 'undefined') return '';

  window.localStorage.removeItem(LEGACY_USER_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(GUEST_SESSION_ID_STORAGE_KEY);
  if (hasStoredUserSession()) return '';

  const guestToken = getStoredGuestToken();
  const guestPayload = guestToken ? decodeJwtPayload(guestToken) : null;
  const hasGuestSessionToken = Boolean(guestToken) && isGuestSessionToken(guestPayload);
  if (hasGuestSessionToken && !isGuestTokenExpired(guestPayload)) {
    return guestToken;
  }
  if (guestToken && !hasGuestSessionToken) {
    window.localStorage.removeItem(GUEST_TOKEN_STORAGE_KEY);
  }

  try {
    const response = await apiClient.post<AuthTokenResponse>(
      `${AUTH_PREFIX}/guest`,
      undefined,
      {
        auth: false,
        headers: hasGuestSessionToken ? { Authorization: `Bearer ${guestToken}` } : undefined,
      }
    );
    const token = response?.accessToken || response?.access_token || response?.token || response?.data?.token;
    if (!token || !isGuestSessionToken(decodeJwtPayload(token))) {
      throw new Error('Invalid guest session token');
    }

    window.localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token);
    return token;
  } catch (error) {
    showToast({ title: '提示', message: '获取游客凭证失败' });
    throw error;
  }
};

export const ensureGuestToken = () => {
  if (!guestTokenRequest) {
    guestTokenRequest = resolveGuestToken().finally(() => {
      guestTokenRequest = null;
    });
  }
  return guestTokenRequest;
};
