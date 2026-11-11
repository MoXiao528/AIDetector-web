import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './client';
import {
  getHistoryList, getHistoryRecord, updateHistoryRecord, deleteHistoryRecord,
  batchDeleteHistoryRecords, clearAllHistory,
} from './modules/history';

const createJsonResponse = (payload: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });

describe('apiClient guest auth routing', () => {
  afterEach(() => vi.useRealTimers());
  beforeEach(() => {
    window.localStorage.clear();
  });

  it.each([
    { code: 'TEXT_TOO_SHORT', message: 'Readable error', detail: { minimumTokens: 256 } },
    { detail: { code: 'TEXT_TOO_SHORT', message: 'Readable error', detail: { minimumTokens: 256 } } },
  ])('结构化长度detail保留错误码和可读message %#', async (payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createJsonResponse(payload, { status: 422 })));
    await expect(apiClient.post('/api/v1/detect', {}, { auth: false })).rejects.toMatchObject({
      status: 422, code: 'TEXT_TOO_SHORT', message: 'Readable error', details: payload,
    });
  });

  it('调用者取消会终止fetch并保留AbortError，已取消的signal也被传递', async () => {
    const fetchMock = vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
      if (signal.aborted) reject(new DOMException('Cancelled', 'AbortError'));
      signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')));
    }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const request = apiClient.post('/api/v1/detect/preflight', { text: 'old' }, { signal: controller.signal });
    const rejection = expect(request).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await rejection;
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    await expect(apiClient.get('/test', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('超时仍返回408，未取消的调用者signal不受影响', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Timeout', 'AbortError')));
    })));
    const controller = new AbortController();
    const request = apiClient.get('/test', { signal: controller.signal, timeout: 50 });
    const rejection = expect(request).rejects.toMatchObject({ status: 408, message: '请求超时，请稍后重试。' });
    await vi.advanceTimersByTimeAsync(50);
    await rejection;
    expect(controller.signal.aborted).toBe(false);
  });

  it('游客历史各入口固定使用调用者凭证，401 不清除随后登录的用户会话', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => createJsonResponse({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.setItem('guest_token', 'different-tab-token');
    window.localStorage.setItem('auth_session', '1');
    await getHistoryList({ q: '参考 文本', pinned: true }, 'captured-token');
    await getHistoryRecord(462, 'captured-token');
    await updateHistoryRecord(462, { title: 'renamed' }, 'captured-token');
    await deleteHistoryRecord(462, 'captured-token');
    await batchDeleteHistoryRecords([462], 'captured-token');
    await clearAllHistory('captured-token');
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(calls.map(([url, options]) => [new URL(url, 'http://localhost').pathname, options.method])).toEqual([
      ['/api/v1/guest/history', 'GET'], ['/api/v1/guest/history/462', 'GET'],
      ['/api/v1/guest/history/462', 'PATCH'], ['/api/v1/guest/history/462', 'DELETE'],
      ['/api/v1/guest/history/batch-delete', 'POST'], ['/api/v1/guest/history', 'DELETE'],
    ]);
    expect(new URL(calls[0][0], 'http://localhost').searchParams.get('q')).toBe('参考 文本');
    for (const [, options] of calls) {
      expect(new Headers(options.headers).get('Authorization')).toBe('Bearer captured-token');
    }
    fetchMock.mockResolvedValueOnce(createJsonResponse({ detail: 'expired' }, { status: 401 }));
    await expect(getHistoryList({}, 'captured-token')).rejects.toMatchObject({ status: 401 });
    expect(window.localStorage.getItem('auth_session')).toBe('1');
    await getHistoryList();
    expect(String(fetchMock.mock.lastCall?.[0])).toMatch(/\/api\/v1\/history$/);
    expect(new Headers(fetchMock.mock.lastCall?.[1].headers).has('Authorization')).toBe(false);
  });

  it('游客请求会携带 guest token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.setItem('guest_token', 'guest-token-123');

    await apiClient.get('/api/v1/quota', { guestAuth: true });

    const requestOptions = fetchMock.mock.calls[0][1];
    const headers = new Headers(requestOptions?.headers);
    expect(headers.get('Authorization')).toBe('Bearer guest-token-123');
    expect(requestOptions?.credentials).toBe('include');
  });

  it('已登录 session 不会再混发 guest token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.setItem('auth_session', '1');
    window.localStorage.setItem('guest_token', 'guest-token-123');

    await apiClient.get('/api/v1/quota', { guestAuth: true });

    const requestOptions = fetchMock.mock.calls[0][1];
    const headers = new Headers(requestOptions?.headers);
    expect(headers.has('Authorization')).toBe(false);
    expect(requestOptions?.credentials).toBe('include');
  });

  it('游客请求返回 401 时保留 guest token，避免下一次请求静默换主体', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(
        { code: 'GUEST_SESSION_INVALID', message: 'invalid guest session' },
        { status: 401 }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.setItem('guest_token', 'guest-token-123');

    await expect(apiClient.get('/api/v1/quota', { guestAuth: true })).rejects.toMatchObject({ status: 401 });

    expect(window.localStorage.getItem('guest_token')).toBe('guest-token-123');
  });

  it('auth:false 的游客会话请求返回 401 时不会误清已登录用户 session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(
        { code: 'GUEST_SESSION_INVALID', message: 'invalid guest session' },
        { status: 401 }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.setItem('auth_session', '1');

    await expect(apiClient.get('/api/v1/auth/guest', { auth: false })).rejects.toMatchObject({ status: 401 });

    expect(window.localStorage.getItem('auth_session')).toBe('1');
  });
});
