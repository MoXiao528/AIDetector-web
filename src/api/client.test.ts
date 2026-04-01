import { describe, expect, it, vi } from 'vitest';
import { apiClient } from './client';

const createJsonResponse = (payload: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });

describe('apiClient guest auth routing', () => {
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
});
