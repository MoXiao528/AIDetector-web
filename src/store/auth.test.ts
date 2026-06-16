import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const mockState = vi.hoisted(() => ({
  routerReplace: vi.fn(),
  routerPush: vi.fn(),
  scanSyncHistoryFromBackend: vi.fn(),
  scanClearHistoryRecords: vi.fn(),
  scanMigrateLocalStorageToBackend: vi.fn(),
}));

vi.mock('../router', () => ({
  default: {
    replace: mockState.routerReplace,
    push: mockState.routerPush,
  },
}));

vi.mock('./scan', () => ({
  useScanStore: () => ({
    syncHistoryFromBackend: mockState.scanSyncHistoryFromBackend,
    clearHistoryRecords: mockState.scanClearHistoryRecords,
    migrateLocalStorageToBackend: mockState.scanMigrateLocalStorageToBackend,
  }),
}));

vi.mock('../api/modules/history', () => ({
  claimGuestHistory: vi.fn(),
}));

vi.mock('../api/modules/auth', () => ({
  clearGuestToken: vi.fn(),
  fetchMe: vi.fn(),
  getStoredGuestToken: vi.fn(() => ''),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
}));

import * as authApi from '../api/modules/auth';
import * as historyApi from '../api/modules/history';
import { useAuthStore } from './auth';

describe('auth store session flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockState.scanSyncHistoryFromBackend.mockResolvedValue([]);
    mockState.scanMigrateLocalStorageToBackend.mockResolvedValue({ migrated: [], skipped: [], failed: [] });
    window.localStorage.clear();
  });

  it('login 只保留 session marker，不再落 auth_token', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 7, name: 'alice', credits: 12 });

    window.localStorage.setItem('auth_token', 'legacy-token');
    const store = useAuthStore();

    await store.login({ identifier: 'alice', password: 'StrongPass!23' });

    expect(window.localStorage.getItem('auth_session')).toBe('1');
    expect(window.localStorage.getItem('auth_token')).toBeNull();
    expect(store.isAuthenticated).toBe(true);
    expect(store.user?.name).toBe('alice');
    expect(mockState.scanMigrateLocalStorageToBackend).toHaveBeenCalledTimes(1);
    expect(mockState.scanMigrateLocalStorageToBackend).toHaveBeenCalledWith({ existingRecords: [] });
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledTimes(2);
  });

  it('login 会自动 claim guest token 并导入游客本地历史', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-1');
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 8, name: 'guest-owner', credits: 20 });
    mockState.scanSyncHistoryFromBackend.mockResolvedValueOnce([{ id: 101, inputText: 'claimed record' }]);

    const store = useAuthStore();
    await store.login({ identifier: 'guest-owner', password: 'StrongPass!23' });

    expect(historyApi.claimGuestHistory).toHaveBeenCalledWith('guest-token-1');
    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(mockState.scanMigrateLocalStorageToBackend).toHaveBeenCalledWith({
      existingRecords: [{ id: 101, inputText: 'claimed record' }],
    });
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledTimes(2);
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

  it('logout 会清理本地 session 标记并跳回登录页', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 11, name: 'logout-user', credits: 18 });

    const store = useAuthStore();
    await store.login({ identifier: 'logout-user', password: 'StrongPass!23' });
    mockState.scanClearHistoryRecords.mockClear();
    await store.logout();

    expect(window.localStorage.getItem('auth_session')).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(mockState.scanClearHistoryRecords).toHaveBeenCalledTimes(1);
    expect(mockState.routerReplace).toHaveBeenCalledWith({ name: 'login' });
  });
});
