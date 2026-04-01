const DEFAULT_TIMEOUT = 15000;
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'
  | string;

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  details: unknown;

  constructor({ status, code, message, details }: { status: number; code: ApiErrorCode; message: string; details?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiBlobResponse {
  blob: Blob;
  fileName: string | null;
  contentType: string;
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  timeout?: number;
  auth?: boolean;
  guestAuth?: boolean;
};

const getBaseUrl = () => {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) return '';
  return String(base).replace(/\/$/, '');
};

const LEGACY_TOKEN_STORAGE_KEY = 'auth_token';
const AUTH_SESSION_STORAGE_KEY = 'auth_session';
const GUEST_TOKEN_STORAGE_KEY = 'guest_token';

const buildUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getBaseUrl();
  if (!baseUrl) return normalizedPath;
  return `${baseUrl}${normalizedPath}`;
};

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

const parseFileNameFromContentDisposition = (value: string | null) => {
  if (!value) return null;
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const plainMatch = value.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || null;
};

const mapStatusToCode = (status: number): ApiErrorCode => {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN_ERROR';
};

const getErrorPayload = (payload: any) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }
  if (payload.detail && typeof payload.detail === 'object' && !Array.isArray(payload.detail)) {
    return payload.detail;
  }
  return payload;
};

const getPayloadErrorCode = (payload: any): string => {
  const normalizedPayload = getErrorPayload(payload);
  return (
    normalizedPayload?.code ||
    normalizedPayload?.errorCode ||
    normalizedPayload?.error?.code ||
    payload?.code ||
    payload?.errorCode ||
    ''
  );
};

const buildErrorMessage = (status: number, payload: any) => {
  const normalizedPayload = getErrorPayload(payload);
  if (normalizedPayload?.message) return normalizedPayload.message;
  if (normalizedPayload?.error) return normalizedPayload.error;
  if (typeof payload?.detail === 'string') return payload.detail;
  if (status === 401) return '未授权访问，请重新登录。';
  if (status === 403) return '当前账号没有权限执行该操作。';
  if (status >= 500) return '服务暂时不可用，请稍后重试。';
  return '请求失败，请稍后重试。';
};

const hasStoredUserSession = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) === '1';
};

const getGuestToken = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(GUEST_TOKEN_STORAGE_KEY) || '';
};

const clearStoredUserSession = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
};

const clearLegacyUserToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
};

const buildHeaders = (headers: HeadersInit | undefined, body: unknown, auth: boolean, guestAuth: boolean) => {
  const finalHeaders = new Headers(headers || {});
  if (auth && guestAuth && !hasStoredUserSession()) {
    const guestToken = getGuestToken();
    if (guestToken) {
      finalHeaders.set('Authorization', `Bearer ${guestToken}`);
    }
  }
  if (body && typeof body === 'object' && !(body instanceof FormData) && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  return finalHeaders;
};

const normalizeBody = (body: unknown, headers: Headers) => {
  if (!body) return undefined;
  if (body instanceof FormData) return body;
  if (headers.get('Content-Type')?.includes('application/json') && typeof body === 'object') {
    return JSON.stringify(body);
  }
  return body as BodyInit;
};

const requestInternal = async <T>(
  path: string,
  parseSuccess: (response: Response) => Promise<T>,
  { timeout = DEFAULT_TIMEOUT, auth = true, guestAuth = false, body, ...options }: ApiRequestOptions = {}
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const headers = buildHeaders(options.headers, body, auth, guestAuth);

  try {
    const response = await fetch(buildUrl(path), {
      ...options,
      method: options.method || 'GET',
      credentials: options.credentials || 'include',
      headers,
      body: normalizeBody(body, headers),
      signal: controller.signal,
    });

    const payload = response.status === 204 ? null : response.ok ? await parseSuccess(response) : await parseResponseBody(response);

    if (!response.ok) {
      const apiCode = getPayloadErrorCode(payload);
      if (response.status === 401 && typeof window !== 'undefined') {
        const hasUserSession = hasStoredUserSession();
        const hasLegacyToken = Boolean(window.localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY));
        if (hasUserSession || hasLegacyToken) {
          clearLegacyUserToken();
          clearStoredUserSession();
          if (window.location.pathname !== '/login') {
            window.location.assign('/login');
          } else {
            window.location.reload();
          }
        } else if (guestAuth) {
          window.localStorage.removeItem(GUEST_TOKEN_STORAGE_KEY);
        }
      } else if (response.status === 402) {
        console.warn('余额不足，请检查账户点数。');
      }
      throw new ApiError({
        status: response.status,
        code: apiCode || mapStatusToCode(response.status),
        message: buildErrorMessage(response.status, payload),
        details: payload,
      });
    }

    return payload as T;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ApiError({ status: 408, code: 'UNKNOWN_ERROR', message: '请求超时，请稍后重试。' });
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: '网络异常，请检查连接后重试。', details: error });
  } finally {
    clearTimeout(timeoutId);
  }
};

const request = async <T>(path: string, options: ApiRequestOptions = {}) =>
  requestInternal<T>(path, async (response) => parseResponseBody(response) as Promise<T>, options);

const requestBlob = async (path: string, options: ApiRequestOptions = {}) =>
  requestInternal<ApiBlobResponse>(
    path,
    async (response) => ({
      blob: await response.blob(),
      fileName: parseFileNameFromContentDisposition(response.headers.get('content-disposition')),
      contentType: response.headers.get('content-type') || 'application/octet-stream',
    }),
    options
  );

export const extractApiErrorCode = (error: any) => {
  const payload = error?.details ?? error;
  return getPayloadErrorCode(payload) || error?.code || '';
};

export const apiClient = {
  request,
  requestBlob,
  get: <T>(path: string, options?: ApiRequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  getBlob: (path: string, options?: ApiRequestOptions) => requestBlob(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  postBlob: (path: string, body?: unknown, options?: ApiRequestOptions) =>
    requestBlob(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: ApiRequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};

export type { ApiRequestOptions };
