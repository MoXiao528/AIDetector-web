import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const mockState = vi.hoisted(() => ({
  routerReplace: vi.fn(),
  routerPush: vi.fn(),
  scanSyncHistoryFromBackend: vi.fn(),
  scanClearScanSessionData: vi.fn(),
  scanActivateGuestSession: vi.fn(),
  forbiddenLegacyScanApi: vi.fn(),
}));

vi.mock('../router', () => ({
  default: {
    replace: mockState.routerReplace,
    push: mockState.routerPush,
  },
}));

vi.mock('./scan', () => ({
  useScanStore: () =>
    new Proxy(
      {
        syncHistoryFromBackend: mockState.scanSyncHistoryFromBackend,
        clearScanSessionData: mockState.scanClearScanSessionData,
        activateGuestSession: mockState.scanActivateGuestSession,
      },
      {
        get(target, property, receiver) {
          if (property === 'getPersistedLocalHistoryCount') {
            return () => {
              mockState.forbiddenLegacyScanApi(property);
              return 0;
            };
          }
          if (property === 'migrateLocalStorageToBackend') {
            return async () => {
              mockState.forbiddenLegacyScanApi(property);
              return { migrated: [], skipped: [], failed: [] };
            };
          }
          if (property === 'clearHistoryRecords') {
            return () => mockState.forbiddenLegacyScanApi(property);
          }
          return Reflect.get(target, property, receiver);
        },
      }
    ),
}));

vi.mock('../api/modules/history', () => ({
  claimGuestHistory: vi.fn(),
}));

vi.mock('../api/modules/auth', () => ({
  clearGuestToken: vi.fn(),
  discardGuestSession: vi.fn(),
  ensureGuestToken: vi.fn(),
  fetchMe: vi.fn(),
  getGuestSessionId: vi.fn((token) => (token ? `sid:${token}` : '')),
  getStoredGuestToken: vi.fn(() => ''),
  login: vi.fn(),
  logout: vi.fn(),
  previewGuestSession: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
}));

import * as authApi from '../api/modules/auth';
import * as historyApi from '../api/modules/history';
import { useAuthStore } from './auth';

const HISTORY_STORAGE_KEY = 'ai-detector-history-records';

const arrangeSuccessfulLogin = ({
  id = 8,
  name = 'guest-owner',
  email = 'guest-owner@example.com',
  onLogin,
}: {
  id?: number;
  name?: string;
  email?: string;
  onLogin?: () => void;
} = {}) => {
  vi.mocked(authApi.login).mockImplementation(async () => {
    onLogin?.();
    return { access_token: 'server-body-token' };
  });
  vi.mocked(authApi.fetchMe).mockResolvedValue({ id, name, email, credits: 20 });
};

const arrangeActiveGuest = ({ token = 'guest-session-token-1', historyCount = 1 } = {}) => {
  vi.mocked(authApi.getStoredGuestToken).mockReturnValue('stored-guest-token');
  vi.mocked(authApi.ensureGuestToken).mockResolvedValue(token);
  vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount });
};

describe('auth store session flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockState.scanSyncHistoryFromBackend.mockResolvedValue([]);
    vi.mocked(authApi.discardGuestSession).mockResolvedValue(undefined);
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => (token ? `sid:${token}` : ''));
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: false, historyCount: 0 });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('inactive 且 remote 为 0 时只做 cookie-only discard，并清 scan 敏感内存', async () => {
    arrangeSuccessfulLogin({ id: 7, name: 'alice', email: 'alice@example.com' });
    const store = useAuthStore();

    await store.login({ identifier: 'alice', password: 'StrongPass!23' });

    expect(store.isAuthenticated).toBe(true);
    expect(authApi.previewGuestSession).toHaveBeenCalledWith();
    expect(authApi.ensureGuestToken).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(authApi.discardGuestSession).toHaveBeenCalledWith('');
    expect(mockState.scanSyncHistoryFromBackend).not.toHaveBeenCalled();
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
    expect(mockState.forbiddenLegacyScanApi).not.toHaveBeenCalled();
  });

  it('active guest 但 remote 为 0 时仍用 Bearer 撤销能力并清 scan 内存', async () => {
    arrangeActiveGuest({ token: 'guest-session-token-empty', historyCount: 0 });
    arrangeSuccessfulLogin({ id: 20, name: 'empty-guest-user' });
    const store = useAuthStore();

    await store.login({ identifier: 'empty-guest-user', password: 'StrongPass!23' });

    expect(window.confirm).not.toHaveBeenCalled();
    expect(authApi.discardGuestSession).toHaveBeenCalledWith('guest-session-token-empty');
    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).toHaveBeenCalledWith('guest-session-token-empty');
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanSyncHistoryFromBackend).not.toHaveBeenCalled();
    expect(mockState.forbiddenLegacyScanApi).not.toHaveBeenCalled();
  });

  it('login 确认后只 claim、cookie cleanup、清 scan 内存并 strict sync 一次', async () => {
    arrangeActiveGuest({ historyCount: 2 });
    arrangeSuccessfulLogin({
      onLogin: () => {
        window.localStorage.setItem(
          HISTORY_STORAGE_KEY,
          JSON.stringify([{ inputText: 'DYNAMIC_ATTACKER_TEXT', analysis: { translation: 'DYNAMIC_ATTACKER_ANALYSIS' } }])
        );
      },
    });
    const historyReadSpy = vi.spyOn(window.localStorage, 'getItem');
    const store = useAuthStore();

    await store.login({ identifier: 'guest-owner', password: 'StrongPass!23' });

    const prompt = String(vi.mocked(window.confirm).mock.calls[0][0]);
    expect(prompt).toContain('guest-owner@example.com');
    expect(prompt).toMatch(/(?:云端|remote)\D*2/i);
    expect(prompt).toMatch(/(?:本地|local)\D*0/i);
    expect(mockState.scanActivateGuestSession).toHaveBeenCalledWith('sid:guest-session-token-1');
    expect(historyApi.claimGuestHistory).toHaveBeenCalledWith('guest-session-token-1');
    expect(historyApi.claimGuestHistory).toHaveBeenCalledTimes(1);
    expect(authApi.discardGuestSession).toHaveBeenCalledWith();
    expect(authApi.discardGuestSession).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).toHaveBeenCalledWith('guest-session-token-1');
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledTimes(1);
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledWith({ strict: true });
    expect(mockState.forbiddenLegacyScanApi).not.toHaveBeenCalled();
    expect(historyReadSpy).not.toHaveBeenCalledWith(HISTORY_STORAGE_KEY);
    expect(vi.mocked(historyApi.claimGuestHistory).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(authApi.discardGuestSession).mock.invocationCallOrder[0]
    );
    expect(vi.mocked(authApi.discardGuestSession).mock.invocationCallOrder[0]).toBeLessThan(
      mockState.scanClearScanSessionData.mock.invocationCallOrder[0]
    );
    expect(mockState.scanClearScanSessionData.mock.invocationCallOrder[0]).toBeLessThan(
      mockState.scanSyncHistoryFromBackend.mock.invocationCallOrder[0]
    );
  });

  it('仅有 recovery cookie 时恢复 Bearer 后复用同一 remote-only 流程', async () => {
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 5 });
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('recovered-guest-token');
    arrangeSuccessfulLogin({ id: 18, name: 'cookie-owner', email: 'cookie-owner@example.com' });
    const store = useAuthStore();

    await store.login({ identifier: 'cookie-owner', password: 'StrongPass!23' });

    expect(vi.mocked(authApi.previewGuestSession).mock.calls[0]).toEqual([]);
    expect(authApi.ensureGuestToken).toHaveBeenCalledTimes(1);
    expect(historyApi.claimGuestHistory).toHaveBeenCalledWith('recovered-guest-token');
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledWith({ strict: true });
    expect(mockState.forbiddenLegacyScanApi).not.toHaveBeenCalled();
  });

  it('cookie-only preview active 但无法恢复 Bearer 时 fail closed 且登录成功', async () => {
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 2 });
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('');
    arrangeSuccessfulLogin({ id: 22, name: 'missing-bearer-user' });
    const store = useAuthStore();

    await expect(store.login({ identifier: 'missing-bearer-user', password: 'StrongPass!23' })).resolves.toMatchObject({
      id: 22,
    });

    expect(window.confirm).not.toHaveBeenCalled();
    expect(authApi.discardGuestSession).not.toHaveBeenCalled();
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanSyncHistoryFromBackend).not.toHaveBeenCalled();
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
  });

  it('拒绝导入时先 discard，再清 token 和 scan 内存，零 claim/sync', async () => {
    arrangeActiveGuest({ historyCount: 4 });
    arrangeSuccessfulLogin({ id: 9, name: 'account-b', email: 'account-b@example.com' });
    vi.mocked(window.confirm).mockReturnValue(false);
    const store = useAuthStore();

    await store.login({ identifier: 'account-b', password: 'StrongPass!23' });

    expect(authApi.discardGuestSession).toHaveBeenCalledWith('guest-session-token-1');
    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).toHaveBeenCalledWith('guest-session-token-1');
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanSyncHistoryFromBackend).not.toHaveBeenCalled();
    expect(mockState.forbiddenLegacyScanApi).not.toHaveBeenCalled();
    expect(vi.mocked(authApi.discardGuestSession).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(authApi.clearGuestToken).mock.invocationCallOrder[0]
    );
    expect(vi.mocked(authApi.clearGuestToken).mock.invocationCallOrder[0]).toBeLessThan(
      mockState.scanClearScanSessionData.mock.invocationCallOrder[0]
    );
  });

  it('拒绝导入但 discard 401 时保留 token、清 scan 内存且登录成功', async () => {
    arrangeActiveGuest();
    arrangeSuccessfulLogin({ id: 10, name: 'safe-user' });
    vi.mocked(window.confirm).mockReturnValue(false);
    vi.mocked(authApi.discardGuestSession).mockRejectedValue(
      Object.assign(new Error('guest session is invalid'), { status: 401, code: 'GUEST_SESSION_INVALID' })
    );
    window.localStorage.setItem('guest_token', 'guest-session-token-1');
    const store = useAuthStore();

    await expect(store.login({ identifier: 'safe-user', password: 'StrongPass!23' })).resolves.toMatchObject({ id: 10 });

    expect(authApi.clearGuestToken).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('guest_token')).toBe('guest-session-token-1');
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanSyncHistoryFromBackend).not.toHaveBeenCalled();
  });

  it('preview 失败时不确认/discard/claim/sync，清 scan 内存且登录成功', async () => {
    arrangeActiveGuest();
    vi.mocked(authApi.previewGuestSession).mockRejectedValue(new Error('preview unavailable'));
    arrangeSuccessfulLogin({ id: 11, name: 'preview-safe-user' });
    const store = useAuthStore();

    await expect(store.login({ identifier: 'preview-safe-user', password: 'StrongPass!23' })).resolves.toMatchObject({ id: 11 });

    expect(window.confirm).not.toHaveBeenCalled();
    expect(authApi.discardGuestSession).not.toHaveBeenCalled();
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanSyncHistoryFromBackend).not.toHaveBeenCalled();
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
  });

  it('confirm 异常不视为拒绝：不撤销/claim/sync，清 scan 内存且登录成功', async () => {
    arrangeActiveGuest();
    arrangeSuccessfulLogin({ id: 23, name: 'confirm-error-user' });
    vi.mocked(window.confirm).mockImplementation(() => {
      throw new Error('confirm unavailable');
    });
    const store = useAuthStore();

    await expect(store.login({ identifier: 'confirm-error-user', password: 'StrongPass!23' })).resolves.toMatchObject({ id: 23 });

    expect(authApi.discardGuestSession).not.toHaveBeenCalled();
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanSyncHistoryFromBackend).not.toHaveBeenCalled();
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
  });

  it('claim 失败时不继续 discard/sync，清 scan 内存且登录成功', async () => {
    arrangeActiveGuest();
    arrangeSuccessfulLogin({ id: 24, name: 'claim-error-user' });
    vi.mocked(historyApi.claimGuestHistory).mockRejectedValue(new Error('claim unavailable'));
    const store = useAuthStore();

    await expect(store.login({ identifier: 'claim-error-user', password: 'StrongPass!23' })).resolves.toMatchObject({ id: 24 });

    expect(authApi.discardGuestSession).not.toHaveBeenCalled();
    expect(mockState.scanSyncHistoryFromBackend).not.toHaveBeenCalled();
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
  });

  it('claim 后 cookie cleanup 失败仍清 token/scan 内存并 strict sync', async () => {
    arrangeActiveGuest();
    arrangeSuccessfulLogin({ id: 12, name: 'confirmed-user' });
    vi.mocked(authApi.discardGuestSession).mockRejectedValue(new Error('terminal cookie cleanup unavailable'));
    const store = useAuthStore();

    await expect(store.login({ identifier: 'confirmed-user', password: 'StrongPass!23' })).resolves.toMatchObject({ id: 12 });

    expect(historyApi.claimGuestHistory).toHaveBeenCalledTimes(1);
    expect(authApi.discardGuestSession).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).toHaveBeenCalledWith('guest-session-token-1');
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledTimes(1);
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledWith({ strict: true });
  });

  it('strict sync 失败时 fail closed，清 scan 内存且登录成功', async () => {
    arrangeActiveGuest();
    arrangeSuccessfulLogin({ id: 19, name: 'strict-sync-user' });
    mockState.scanSyncHistoryFromBackend.mockRejectedValueOnce(new Error('history sync unavailable'));
    const store = useAuthStore();

    await expect(store.login({ identifier: 'strict-sync-user', password: 'StrongPass!23' })).resolves.toMatchObject({ id: 19 });

    expect(historyApi.claimGuestHistory).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).toHaveBeenCalledWith('guest-session-token-1');
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledTimes(1);
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledWith({ strict: true });
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
    expect(mockState.forbiddenLegacyScanApi).not.toHaveBeenCalled();
  });

  it('register 复用 remote-only 确认流：单次 claim/cleanup/clear/strict sync', async () => {
    arrangeActiveGuest({ token: 'guest-session-token-register' });
    vi.mocked(authApi.register).mockResolvedValue({ access_token: 'registration-response' });
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({
      id: 15,
      name: 'registered-user',
      email: 'registered@example.com',
      credits: 20,
    });
    const store = useAuthStore();

    await store.register({ name: 'registered-user', email: 'registered@example.com', password: 'StrongPass!23' });

    expect(historyApi.claimGuestHistory).toHaveBeenCalledWith('guest-session-token-register');
    expect(historyApi.claimGuestHistory).toHaveBeenCalledTimes(1);
    expect(authApi.discardGuestSession).toHaveBeenCalledTimes(1);
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledTimes(1);
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledWith({ strict: true });
    expect(mockState.forbiddenLegacyScanApi).not.toHaveBeenCalled();
  });

  it('并发重复 login 共用一次认证和 remote-only 决策', async () => {
    arrangeActiveGuest();
    let resolveLogin: (value: { access_token: string }) => void = () => undefined;
    const pendingLogin = new Promise<{ access_token: string }>((resolve) => {
      resolveLogin = resolve;
    });
    vi.mocked(authApi.login).mockReturnValue(pendingLogin);
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 16, name: 'single-flight-user', credits: 20 });
    const store = useAuthStore();

    const first = store.login({ identifier: 'single-flight-user', password: 'StrongPass!23' });
    const second = store.login({ identifier: 'single-flight-user', password: 'StrongPass!23' });
    await vi.waitFor(() => expect(authApi.login).toHaveBeenCalled());
    resolveLogin({ access_token: 'server-body-token' });
    await Promise.all([first, second]);

    expect(authApi.login).toHaveBeenCalledTimes(1);
    expect(authApi.previewGuestSession).toHaveBeenCalledTimes(1);
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(historyApi.claimGuestHistory).toHaveBeenCalledTimes(1);
    expect(authApi.discardGuestSession).toHaveBeenCalledTimes(1);
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledTimes(1);
  });

  it('并发重复 register 共用一次注册、登录和 remote-only 决策', async () => {
    arrangeActiveGuest({ token: 'guest-session-token-register' });
    let resolveRegister: (value: { access_token: string }) => void = () => undefined;
    const pendingRegister = new Promise<{ access_token: string }>((resolve) => {
      resolveRegister = resolve;
    });
    vi.mocked(authApi.register).mockReturnValue(pendingRegister);
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 17, name: 'single-register-user', credits: 20 });
    const store = useAuthStore();

    const first = store.register({ name: 'single-register-user', email: 'one@example.com', password: 'StrongPass!23' });
    const second = store.register({ name: 'single-register-user', email: 'one@example.com', password: 'StrongPass!23' });
    await vi.waitFor(() => expect(authApi.register).toHaveBeenCalled());
    resolveRegister({ access_token: 'registration-response' });
    await Promise.all([first, second]);

    expect(authApi.register).toHaveBeenCalledTimes(1);
    expect(authApi.login).toHaveBeenCalledTimes(1);
    expect(authApi.previewGuestSession).toHaveBeenCalledTimes(1);
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(historyApi.claimGuestHistory).toHaveBeenCalledTimes(1);
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledTimes(1);
  });

  it('guest 凭据恢复失败时放弃 claim，清 scan 内存但不阻止登录', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('invalid-guest-token');
    vi.mocked(authApi.ensureGuestToken).mockRejectedValue(new Error('invalid guest session'));
    arrangeSuccessfulLogin({ id: 12, name: 'safe-login' });
    const store = useAuthStore();

    await expect(store.login({ identifier: 'safe-login', password: 'StrongPass!23' })).resolves.toMatchObject({ id: 12 });

    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).toHaveBeenCalledWith('invalid-guest-token');
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanSyncHistoryFromBackend).not.toHaveBeenCalled();
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
  });

  it('restoreSession 会用 cookie 会话恢复用户，并清理遗留 token', async () => {
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 9, name: 'cookie-user', credits: 30 });
    window.localStorage.setItem('auth_session', '1');
    window.localStorage.setItem('auth_token', 'legacy-token');
    const store = useAuthStore();

    const restored = await store.restoreSession();

    expect(restored).toBe(true);
    expect(window.localStorage.getItem('auth_token')).toBeNull();
    expect(store.hasRestoredSession).toBe(true);
    expect(store.user?.name).toBe('cookie-user');
  });

  it('logout 会清本地 session、scan 敏感内存并跳回登录页', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    arrangeSuccessfulLogin({ id: 11, name: 'logout-user' });
    const store = useAuthStore();
    await store.login({ identifier: 'logout-user', password: 'StrongPass!23' });
    mockState.scanClearScanSessionData.mockClear();

    await store.logout();

    expect(window.localStorage.getItem('auth_session')).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(mockState.scanClearScanSessionData).toHaveBeenCalledTimes(1);
    expect(mockState.routerReplace).toHaveBeenCalledWith({ name: 'login' });
  });
});
