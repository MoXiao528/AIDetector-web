import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

vi.mock('../../utils/toast', () => ({
  showToast: vi.fn(),
}));

import { apiClient } from '../client';
import { ensureGuestToken } from './auth';

const NOW_SECONDS = 1_800_000_000;
const GUEST_ID = '08b57ec3-e1db-4f3b-ad41-ad5c443707c8';

const createGuestToken = (
  expiresAt: number,
  { includeSid = true, sid = GUEST_ID, sub = GUEST_ID }: { includeSid?: boolean; sid?: string; sub?: string } = {}
) => {
  const claims = {
    exp: expiresAt,
    sub,
    sub_type: 'guest',
    ...(includeSid ? { sid } : { guest_id: sub }),
  };
  const payload = window
    .btoa(JSON.stringify(claims))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`;
};

const expectGuestSessionRequest = (expectedToken = '') => {
  expect(apiClient.post).toHaveBeenCalledTimes(1);
  const [path, body, options] = vi.mocked(apiClient.post).mock.calls[0];
  const headers = new Headers(options?.headers);

  expect(path).toBe('/api/v1/auth/guest');
  expect(body).toBeUndefined();
  expect(options?.auth).toBe(false);
  expect(headers.get('Authorization')).toBe(expectedToken ? `Bearer ${expectedToken}` : null);
};

describe('ensureGuestToken session recovery', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(apiClient.post).mockReset();
    vi.spyOn(Date, 'now').mockReturnValue(NOW_SECONDS * 1000);
  });

  it('没有 guest token 时忽略并清理遗留 guest_session_id，由服务端创建主体', async () => {
    const nextToken = createGuestToken(NOW_SECONDS + 3600);
    window.localStorage.setItem('guest_session_id', 'client-chosen-id');
    vi.mocked(apiClient.post).mockResolvedValue({ access_token: nextToken });

    await expect(ensureGuestToken()).resolves.toBe(nextToken);

    expectGuestSessionRequest();
    expect(window.localStorage.getItem('guest_token')).toBe(nextToken);
    expect(window.localStorage.getItem('guest_session_id')).toBeNull();
  });

  it.each([
    ['缺少 sid', createGuestToken(NOW_SECONDS + 3600, { includeSid: false })],
    ['sid 与 sub 不一致', createGuestToken(NOW_SECONDS + 3600, { sid: 'another-session-id' })],
  ])('%s 的旧 guest JWT 被硬切，不作为新会话的恢复凭据', async (_label, legacyToken) => {
    const nextToken = createGuestToken(NOW_SECONDS + 3600);
    window.localStorage.setItem('guest_token', legacyToken);
    window.localStorage.setItem('guest_session_id', GUEST_ID);
    vi.mocked(apiClient.post).mockResolvedValue({ access_token: nextToken });

    await expect(ensureGuestToken()).resolves.toBe(nextToken);

    expectGuestSessionRequest();
    expect(window.localStorage.getItem('guest_token')).toBe(nextToken);
    expect(window.localStorage.getItem('guest_session_id')).toBeNull();
  });

  it('新 session token 距过期时间充足时直接复用，并清理遗留 ID', async () => {
    const currentToken = createGuestToken(NOW_SECONDS + 120);
    window.localStorage.setItem('guest_token', currentToken);
    window.localStorage.setItem('guest_session_id', GUEST_ID);

    await expect(ensureGuestToken()).resolves.toBe(currentToken);

    expect(apiClient.post).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('guest_session_id')).toBeNull();
  });

  it.each([
    ['临近过期', NOW_SECONDS + 20],
    ['已经过期', NOW_SECONDS - 1],
  ])('%s 时无 body 并携带现有 Bearer 恢复 session', async (_label, expiresAt) => {
    const currentToken = createGuestToken(expiresAt as number);
    const nextToken = createGuestToken(NOW_SECONDS + 3600);
    window.localStorage.setItem('guest_token', currentToken);
    window.localStorage.setItem('guest_session_id', GUEST_ID);
    vi.mocked(apiClient.post).mockResolvedValue({ access_token: nextToken });

    await expect(ensureGuestToken()).resolves.toBe(nextToken);

    expectGuestSessionRequest(currentToken);
    expect(window.localStorage.getItem('guest_token')).toBe(nextToken);
    expect(window.localStorage.getItem('guest_session_id')).toBeNull();
  });

  it('恢复请求返回 401 时 fail closed，不再发起无凭据建号请求', async () => {
    const expiredToken = createGuestToken(NOW_SECONDS - 1);
    const unauthorized = Object.assign(new Error('expired guest session'), {
      status: 401,
      code: 'GUEST_SESSION_EXPIRED',
    });
    window.localStorage.setItem('guest_token', expiredToken);
    vi.mocked(apiClient.post).mockRejectedValue(unauthorized);

    await expect(ensureGuestToken()).rejects.toBe(unauthorized);

    expectGuestSessionRequest(expiredToken);
    expect(window.localStorage.getItem('guest_token')).toBe(expiredToken);
  });

  it('并发恢复共用一个请求，避免同一 recovery cookie 被重复轮换', async () => {
    const currentToken = createGuestToken(NOW_SECONDS + 20);
    const nextToken = createGuestToken(NOW_SECONDS + 3600);
    let resolveRequest: (value: { access_token: string }) => void = () => undefined;
    const pendingResponse = new Promise<{ access_token: string }>((resolve) => {
      resolveRequest = resolve;
    });
    window.localStorage.setItem('guest_token', currentToken);
    vi.mocked(apiClient.post).mockReturnValue(pendingResponse);

    const firstRecovery = ensureGuestToken();
    const secondRecovery = ensureGuestToken();

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    resolveRequest({ access_token: nextToken });
    await expect(Promise.all([firstRecovery, secondRecovery])).resolves.toEqual([nextToken, nextToken]);
  });
});
