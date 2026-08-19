import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const mockState = vi.hoisted(() => ({
  routerReplace: vi.fn(),
  routerPush: vi.fn(),
  scanSyncHistoryFromBackend: vi.fn(),
  scanClearHistoryRecords: vi.fn(),
  scanGetPersistedLocalHistoryCount: vi.fn(),
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
    getPersistedLocalHistoryCount: mockState.scanGetPersistedLocalHistoryCount,
    migrateLocalStorageToBackend: mockState.scanMigrateLocalStorageToBackend,
  }),
}));

vi.mock('../api/modules/history', () => ({
  claimGuestHistory: vi.fn(),
}));

vi.mock('../api/modules/auth', () => ({
  clearGuestToken: vi.fn(),
  discardGuestSession: vi.fn(),
  ensureGuestToken: vi.fn(),
  fetchMe: vi.fn(),
  previewGuestSession: vi.fn(),
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
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(0);
    mockState.scanMigrateLocalStorageToBackend.mockResolvedValue({ migrated: [], skipped: [], failed: [] });
    vi.mocked(authApi.discardGuestSession).mockResolvedValue(undefined);
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: false, historyCount: 0 });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    window.localStorage.clear();
  });

  it('inactive 且 remote/local 都为 0 时只做 cookie-only discard，不创建新 guest 或触发确认', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 7, name: 'alice', credits: 12 });

    window.localStorage.setItem('auth_token', 'legacy-token');
    const store = useAuthStore();

    await store.login({ identifier: 'alice', password: 'StrongPass!23' });

    expect(window.localStorage.getItem('auth_session')).toBe('1');
    expect(window.localStorage.getItem('auth_token')).toBeNull();
    expect(store.isAuthenticated).toBe(true);
    expect(store.user?.name).toBe('alice');
    expect(authApi.previewGuestSession).toHaveBeenCalledWith();
    expect(authApi.ensureGuestToken).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(authApi.discardGuestSession).toHaveBeenCalledWith('');
    expect(vi.mocked(authApi.previewGuestSession).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(authApi.discardGuestSession).mock.invocationCallOrder[0]
    );
    expect(mockState.scanClearHistoryRecords).toHaveBeenCalledTimes(1);
    expect(mockState.scanMigrateLocalStorageToBackend).not.toHaveBeenCalled();
  });

  it('active guest 但 remote/local 都为 0 时仍用 Bearer 撤销服务端能力', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-empty');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-session-token-empty');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 0 });
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 20, name: 'empty-guest-user', credits: 20 });

    const store = useAuthStore();
    await store.login({ identifier: 'empty-guest-user', password: 'StrongPass!23' });

    expect(window.confirm).not.toHaveBeenCalled();
    expect(authApi.discardGuestSession).toHaveBeenCalledWith('guest-session-token-empty');
    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(mockState.scanClearHistoryRecords).toHaveBeenCalledTimes(1);
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanMigrateLocalStorageToBackend).not.toHaveBeenCalled();
  });

  it('login 明确确认后显示目标账号和分列数量，并各执行一次 claim、discard、migrate', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-session-token-1');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 2 });
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({
      id: 8,
      name: 'guest-owner',
      email: 'guest-owner@example.com',
      credits: 20,
    });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(3);
    mockState.scanSyncHistoryFromBackend.mockResolvedValueOnce([{ id: 101, inputText: 'claimed record' }]);

    const store = useAuthStore();
    await store.login({ identifier: 'guest-owner', password: 'StrongPass!23' });

    expect(authApi.ensureGuestToken).toHaveBeenCalledTimes(1);
    expect(authApi.previewGuestSession).toHaveBeenCalledWith('guest-session-token-1');
    expect(vi.mocked(authApi.previewGuestSession).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(authApi.login).mock.invocationCallOrder[0]
    );
    expect(window.confirm).toHaveBeenCalledTimes(1);
    const prompt = String(vi.mocked(window.confirm).mock.calls[0][0]);
    expect(prompt).toContain('guest-owner@example.com');
    expect(prompt).toMatch(/(?:云端|remote)\D*2/i);
    expect(prompt).toMatch(/(?:本地|local)\D*3/i);
    expect(historyApi.claimGuestHistory).toHaveBeenCalledWith('guest-session-token-1');
    expect(authApi.discardGuestSession).toHaveBeenCalledTimes(1);
    expect(vi.mocked(authApi.discardGuestSession).mock.calls[0]).toEqual([]);
    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(mockState.scanMigrateLocalStorageToBackend).toHaveBeenCalledWith({
      existingRecords: [{ id: 101, inputText: 'claimed record' }],
    });
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenNthCalledWith(1, { strict: true });
    expect(vi.mocked(historyApi.claimGuestHistory).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(authApi.discardGuestSession).mock.invocationCallOrder[0]
    );
    expect(vi.mocked(authApi.discardGuestSession).mock.invocationCallOrder[0]).toBeLessThan(
      mockState.scanMigrateLocalStorageToBackend.mock.invocationCallOrder[0]
    );
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledTimes(2);
  });

  it('仅有 recovery cookie 时先 cookie-only preview，再恢复同一 guest token 并使用快照数量', async () => {
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 5 });
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('recovered-guest-token');
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({
      id: 18,
      name: 'cookie-owner',
      email: 'cookie-owner@example.com',
      credits: 20,
    });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(1);

    const store = useAuthStore();
    await store.login({ identifier: 'cookie-owner', password: 'StrongPass!23' });

    expect(authApi.previewGuestSession).toHaveBeenCalledTimes(1);
    expect(vi.mocked(authApi.previewGuestSession).mock.calls[0]).toEqual([]);
    expect(authApi.ensureGuestToken).toHaveBeenCalledTimes(1);
    expect(vi.mocked(authApi.previewGuestSession).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(authApi.ensureGuestToken).mock.invocationCallOrder[0]
    );
    expect(vi.mocked(authApi.ensureGuestToken).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(authApi.login).mock.invocationCallOrder[0]
    );
    const prompt = String(vi.mocked(window.confirm).mock.calls[0][0]);
    expect(prompt).toContain('cookie-owner@example.com');
    expect(prompt).toMatch(/(?:云端|remote)\D*5/i);
    expect(prompt).toMatch(/(?:本地|local)\D*1/i);
    expect(historyApi.claimGuestHistory).toHaveBeenCalledWith('recovered-guest-token');
    expect(authApi.previewGuestSession).toHaveBeenCalledTimes(1);
  });

  it('cookie-only preview 为 active 但无法恢复 Bearer 时 fail closed', async () => {
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 2 });
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('');
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 22, name: 'missing-bearer-user', credits: 20 });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(1);

    const store = useAuthStore();
    await expect(store.login({ identifier: 'missing-bearer-user', password: 'StrongPass!23' })).resolves.toMatchObject({
      id: 22,
    });

    expect(window.confirm).not.toHaveBeenCalled();
    expect(authApi.discardGuestSession).not.toHaveBeenCalled();
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanMigrateLocalStorageToBackend).not.toHaveBeenCalled();
    expect(mockState.scanClearHistoryRecords).toHaveBeenCalledWith({ preserveLocalCache: true });
  });

  it('login 拒绝导入时 discard 成功后才清能力和本地缓存，绝不 claim 或 migrate', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-session-token-1');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 4 });
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 9, name: 'account-b', email: 'account-b@example.com', credits: 20 });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(2);

    const store = useAuthStore();
    await store.login({ identifier: 'account-b', password: 'StrongPass!23' });

    expect(authApi.discardGuestSession).toHaveBeenCalledWith('guest-session-token-1');
    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(mockState.scanClearHistoryRecords).toHaveBeenCalledTimes(1);
    expect(vi.mocked(authApi.discardGuestSession).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(authApi.clearGuestToken).mock.invocationCallOrder[0]
    );
    expect(vi.mocked(authApi.discardGuestSession).mock.invocationCallOrder[0]).toBeLessThan(
      mockState.scanClearHistoryRecords.mock.invocationCallOrder[0]
    );
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanMigrateLocalStorageToBackend).not.toHaveBeenCalled();
  });

  it('拒绝导入但 discard 返回 401 时 fail closed：保留 token/cache、清空内存且登录仍成功', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-session-token-1');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 1 });
    vi.mocked(authApi.discardGuestSession).mockRejectedValue(
      Object.assign(new Error('guest session is invalid'), { status: 401, code: 'GUEST_SESSION_INVALID' })
    );
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 10, name: 'safe-user', credits: 20 });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(1);
    const localCache = JSON.stringify([{ id: 'local-1', inputText: 'preserve me' }]);
    window.localStorage.setItem('guest_token', 'guest-session-token-1');
    window.localStorage.setItem('ai-detector-history-records', localCache);

    const store = useAuthStore();
    await expect(store.login({ identifier: 'safe-user', password: 'StrongPass!23' })).resolves.toMatchObject({ id: 10 });

    expect(authApi.clearGuestToken).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('guest_token')).toBe('guest-session-token-1');
    expect(window.localStorage.getItem('ai-detector-history-records')).toBe(localCache);
    expect(mockState.scanClearHistoryRecords).toHaveBeenCalledWith({ preserveLocalCache: true });
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanMigrateLocalStorageToBackend).not.toHaveBeenCalled();
  });

  it('远端 preview 失败时仍允许用户登录，但不清、不提示、不 claim、不迁移', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-session-token-1');
    vi.mocked(authApi.previewGuestSession).mockRejectedValue(new Error('preview unavailable'));
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 11, name: 'preview-safe-user', credits: 20 });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(2);

    const store = useAuthStore();
    await expect(store.login({ identifier: 'preview-safe-user', password: 'StrongPass!23' })).resolves.toMatchObject({ id: 11 });

    expect(window.confirm).not.toHaveBeenCalled();
    expect(authApi.clearGuestToken).not.toHaveBeenCalled();
    expect(authApi.discardGuestSession).not.toHaveBeenCalled();
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanMigrateLocalStorageToBackend).not.toHaveBeenCalled();
    expect(mockState.scanClearHistoryRecords).toHaveBeenCalledWith({ preserveLocalCache: true });
  });

  it('确认对话框异常时不视为拒绝，不撤销或迁移并保留本地缓存', async () => {
    vi.mocked(window.confirm).mockImplementation(() => {
      throw new Error('confirm unavailable');
    });
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-session-token-1');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 1 });
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 23, name: 'confirm-error-user', credits: 20 });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(1);

    const store = useAuthStore();
    await store.login({ identifier: 'confirm-error-user', password: 'StrongPass!23' });

    expect(authApi.discardGuestSession).not.toHaveBeenCalled();
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanMigrateLocalStorageToBackend).not.toHaveBeenCalled();
    expect(mockState.scanClearHistoryRecords).toHaveBeenCalledWith({ preserveLocalCache: true });
  });

  it('remote claim 失败时清除内存视图但保留本地缓存，且不继续上传', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-session-token-1');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 1 });
    vi.mocked(historyApi.claimGuestHistory).mockRejectedValue(new Error('claim unavailable'));
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 24, name: 'claim-error-user', credits: 20 });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(1);

    const store = useAuthStore();
    await store.login({ identifier: 'claim-error-user', password: 'StrongPass!23' });

    expect(authApi.discardGuestSession).not.toHaveBeenCalled();
    expect(mockState.scanMigrateLocalStorageToBackend).not.toHaveBeenCalled();
    expect(mockState.scanClearHistoryRecords).toHaveBeenCalledWith({ preserveLocalCache: true });
  });

  it('remote confirm 的 terminal-cookie discard 失败不伪装回滚：仍清 token 并迁移已确认的本地记录', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-session-token-1');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 1 });
    vi.mocked(authApi.discardGuestSession).mockRejectedValue(new Error('terminal cookie cleanup unavailable'));
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 12, name: 'confirmed-user', credits: 20 });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(1);

    const store = useAuthStore();
    await store.login({ identifier: 'confirmed-user', password: 'StrongPass!23' });

    expect(historyApi.claimGuestHistory).toHaveBeenCalledTimes(1);
    expect(authApi.discardGuestSession).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(mockState.scanMigrateLocalStorageToBackend).toHaveBeenCalledTimes(1);
    expect(mockState.scanClearHistoryRecords).not.toHaveBeenCalled();
  });

  it('remote claim 后 strict backend sync 失败时不上传本地残留', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-session-token-1');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 1 });
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 19, name: 'strict-sync-user', credits: 20 });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(1);
    mockState.scanSyncHistoryFromBackend.mockRejectedValueOnce(new Error('history sync unavailable'));

    const store = useAuthStore();
    await store.login({ identifier: 'strict-sync-user', password: 'StrongPass!23' });

    expect(historyApi.claimGuestHistory).toHaveBeenCalledTimes(1);
    expect(authApi.discardGuestSession).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(mockState.scanSyncHistoryFromBackend).toHaveBeenCalledWith({ strict: true });
    expect(mockState.scanMigrateLocalStorageToBackend).not.toHaveBeenCalled();
    expect(mockState.scanClearHistoryRecords).toHaveBeenCalledWith({ preserveLocalCache: true });
  });

  it('已成功登录后本地迁移发生意外异常时仍返回用户快照并保留缓存', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-session-token-1');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 1 });
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 21, name: 'migration-error-user', credits: 20 });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(1);
    mockState.scanMigrateLocalStorageToBackend.mockRejectedValueOnce(new Error('unexpected migration failure'));

    const store = useAuthStore();
    await expect(store.login({ identifier: 'migration-error-user', password: 'StrongPass!23' })).resolves.toMatchObject({
      id: 21,
    });

    expect(historyApi.claimGuestHistory).toHaveBeenCalledTimes(1);
    expect(mockState.scanClearHistoryRecords).toHaveBeenCalledWith({ preserveLocalCache: true });
  });

  it('local-only 确认先完成 cookie-only discard，再迁移且不 claim', async () => {
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(2);
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 13, name: 'local-owner', credits: 20 });

    const store = useAuthStore();
    await store.login({ identifier: 'local-owner', password: 'StrongPass!23' });

    expect(authApi.ensureGuestToken).not.toHaveBeenCalled();
    expect(authApi.previewGuestSession).toHaveBeenCalledWith();
    expect(window.confirm).toHaveBeenCalledTimes(1);
    const prompt = String(vi.mocked(window.confirm).mock.calls[0][0]);
    expect(prompt).toMatch(/(?:云端|remote)\D*0/i);
    expect(prompt).toMatch(/(?:本地|local)\D*2/i);
    expect(vi.mocked(authApi.discardGuestSession).mock.calls[0]).toEqual([]);
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(mockState.scanMigrateLocalStorageToBackend).toHaveBeenCalledTimes(1);
    expect(vi.mocked(authApi.discardGuestSession).mock.invocationCallOrder[0]).toBeLessThan(
      mockState.scanMigrateLocalStorageToBackend.mock.invocationCallOrder[0]
    );
    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
  });

  it('local-only 确认但 cookie-only discard 失败时不清、不迁移', async () => {
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(1);
    vi.mocked(authApi.discardGuestSession).mockRejectedValue(new Error('cookie discard unavailable'));
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 14, name: 'local-safe-user', credits: 20 });

    const store = useAuthStore();
    await store.login({ identifier: 'local-safe-user', password: 'StrongPass!23' });

    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(authApi.clearGuestToken).not.toHaveBeenCalled();
    expect(mockState.scanMigrateLocalStorageToBackend).not.toHaveBeenCalled();
    expect(mockState.scanClearHistoryRecords).toHaveBeenCalledWith({ preserveLocalCache: true });
  });

  it('register 复用同一确认流程，不会绕过来源、数量和一次性迁移', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-register');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-session-token-register');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 1 });
    vi.mocked(authApi.register).mockResolvedValue({ access_token: 'registration-response' });
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 15, name: 'registered-user', email: 'registered@example.com', credits: 20 });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(2);

    const store = useAuthStore();
    await store.register({ name: 'registered-user', email: 'registered@example.com', password: 'StrongPass!23' });

    const prompt = String(vi.mocked(window.confirm).mock.calls[0][0]);
    expect(prompt).toContain('registered@example.com');
    expect(prompt).toMatch(/(?:云端|remote)\D*1/i);
    expect(prompt).toMatch(/(?:本地|local)\D*2/i);
    expect(historyApi.claimGuestHistory).toHaveBeenCalledTimes(1);
    expect(authApi.discardGuestSession).toHaveBeenCalledTimes(1);
    expect(mockState.scanMigrateLocalStorageToBackend).toHaveBeenCalledTimes(1);
  });

  it('并发重复 login 共用一次认证和迁移决策，避免重复 claim', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-token-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-session-token-1');
    vi.mocked(authApi.previewGuestSession).mockResolvedValue({ active: true, historyCount: 1 });
    let resolveLogin: (value: { access_token: string }) => void = () => undefined;
    const pendingLogin = new Promise<{ access_token: string }>((resolve) => {
      resolveLogin = resolve;
    });
    vi.mocked(authApi.login).mockReturnValue(pendingLogin);
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 16, name: 'single-flight-user', credits: 20 });
    mockState.scanGetPersistedLocalHistoryCount.mockReturnValue(1);

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
    expect(mockState.scanMigrateLocalStorageToBackend).toHaveBeenCalledTimes(1);
  });

  it('guest 凭据恢复失败时放弃迁移，但不阻止用户登录', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('invalid-guest-token');
    vi.mocked(authApi.ensureGuestToken).mockRejectedValue(new Error('invalid guest session'));
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 12, name: 'safe-login', credits: 20 });

    const store = useAuthStore();
    await store.login({ identifier: 'safe-login', password: 'StrongPass!23' });

    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('auth_session')).toBe('1');
    expect(store.isAuthenticated).toBe(true);
    expect(store.user?.name).toBe('safe-login');
    expect(mockState.routerReplace).not.toHaveBeenCalled();
  });

  it('guest 凭据恢复失败时放弃迁移，但不阻止注册后的登录', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('invalid-guest-token');
    vi.mocked(authApi.ensureGuestToken).mockRejectedValue(new Error('invalid guest session'));
    vi.mocked(authApi.register).mockResolvedValue({ access_token: 'registration-response' });
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'server-body-token' });
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: 13, name: 'safe-register', credits: 20 });

    const store = useAuthStore();
    await store.register({ name: 'safe-register', email: 'safe@example.com', password: 'StrongPass!23' });

    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(historyApi.claimGuestHistory).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('auth_session')).toBe('1');
    expect(store.isAuthenticated).toBe(true);
    expect(store.user?.name).toBe('safe-register');
    expect(mockState.routerReplace).not.toHaveBeenCalled();
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
