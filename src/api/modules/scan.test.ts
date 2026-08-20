import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectText } from './scan';

describe('detectText guest identity pinning', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('显式 guest token 不会被另一个标签刚写入的 token 覆盖', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ score: 0.1, label: 'human' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.setItem('guest_token', 'guest-b-token');

    await detectText(
      {
        text: 'guest A private text',
        functions: ['scan'],
      },
      'guest-a-token'
    );

    const requestOptions = fetchMock.mock.calls[0][1];
    expect(new Headers(requestOptions?.headers).get('Authorization')).toBe('Bearer guest-a-token');
  });

  it('账号检测不会携带残留的 guest token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ score: 0.1, label: 'human' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.setItem('auth_session', '1');
    window.localStorage.setItem('guest_token', 'residual-guest-token');

    await detectText({ text: 'account text', functions: ['scan'] });

    const requestOptions = fetchMock.mock.calls[0][1];
    expect(new Headers(requestOptions?.headers).has('Authorization')).toBe(false);
  });
});
