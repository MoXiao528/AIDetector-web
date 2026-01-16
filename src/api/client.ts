const DEFAULT_TIMEOUT = 15000;
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

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

type ApiRequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  body?: unknown;
  timeout?: number;
  auth?: boolean;
};

const getBaseUrl = () => {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) return '';
  return String(base).replace(/\/$/, '');
};

const TOKEN_STORAGE_KEY = 'auth_token';

const buildUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = getBaseUrl();
  if (!baseUrl) return path.startsWith('/') ? path : `/${path}`;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

const mapStatusToCode = (status: number): ApiErrorCode => {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN_ERROR';
};

const buildErrorMessage = (status: number, payload: any) => {
  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;
  if (status === 401) return '未授权访问，请重新登录。';
  if (status === 403) return '当前账号没有权限执行该操作。';
  if (status >= 500) return '服务暂时不可用，请稍后重试。';
  return '请求失败，请稍后重试。';
};

const buildHeaders = (headers: HeadersInit | undefined, body: unknown, auth: boolean, token: string) => {
  const finalHeaders = new Headers(headers || {});
  if (auth) {
    if (token) {
      finalHeaders.set('Authorization', `Bearer ${token}`);
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

const request = async <T>(path: string, { timeout = DEFAULT_TIMEOUT, auth = true, body, ...options }: ApiRequestOptions = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  let resolvedToken = '';
  if (typeof window !== 'undefined') {
    resolvedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    if (!resolvedToken) {
      try {
        const { useAuthStore } = await import('../store/auth');
        resolvedToken = useAuthStore().authToken || '';
      } catch (error) {
        console.warn('Failed to resolve auth token from store', error);
      }
    }
  }
  const headers = buildHeaders(options.headers, body, auth, resolvedToken);

  try {
    const response = await fetch(buildUrl(path), {
      ...options,
      method: options.method || 'GET',
      headers,
      body: normalizeBody(body, headers),
      signal: controller.signal,
    });

    const payload = response.status === 204 ? null : await parseResponseBody(response);

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        } else {
          window.location.reload();
        }
      } else if (response.status === 402) {
        console.warn('余额不足，请检查账户点数。');
      }
      throw new ApiError({
        status: response.status,
        code: mapStatusToCode(response.status),
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

export const apiClient = {
  request,
  get: <T>(path: string, options?: ApiRequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: ApiRequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};

export type { ApiRequestOptions };
