import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, disposePinia, setActivePinia } from 'pinia';
import { reactive, nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import ScanPage from './ScanPage.vue';
import { createI18n, globalT } from '../i18n';
import { useAuthStore } from '../store/auth';
import { useScanStore } from '../store/scan';
import * as authApi from '../api/modules/auth';
import * as quotaApi from '../api/modules/quota';
import * as scanApi from '../api/modules/scan';

const route = reactive({
  name: 'dashboard',
  fullPath: '/dashboard?panel=home',
  query: { panel: 'home' as string | undefined },
});

const routerReplace = vi.fn(async ({ query = {} }) => {
  route.query = { ...query };
  const panel = typeof query.panel === 'string' ? `?panel=${query.panel}` : '';
  route.fullPath = `/dashboard${panel}`;
});

const routerPush = vi.fn(async ({ query = {} }) => {
  route.query = { ...query };
  const panel = typeof query.panel === 'string' ? `?panel=${query.panel}` : '';
  route.fullPath = `/dashboard${panel}`;
});

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({
      replace: routerReplace,
      push: routerPush,
    }),
    useRoute: () => route,
  };
});

vi.mock('../api/modules/auth', () => ({
  clearGuestToken: vi.fn(() => true),
  ensureGuestToken: vi.fn(async () => 'guest-token'),
  getGuestSessionId: vi.fn((token) => (token ? `sid:${token}` : '')),
  getStoredGuestToken: vi.fn(() => ''),
}));

vi.mock('../api/modules/quota', () => ({
  fetchQuota: vi.fn(async () => ({
    limit: 5000,
    remaining: 5000,
    used_today: 0,
  })),
}));

vi.mock('../api/modules/reports', () => ({
  exportPdfReport: vi.fn(),
}));

vi.mock('../api/modules/examples', () => ({
  fetchScanExamples: vi.fn(async () => []),
}));

vi.mock('../api/modules/scan', () => ({
  detectText: vi.fn(),
}));

vi.mock('../api/modules/history', () => ({
  getHistoryList: vi.fn(async () => []),
  getHistoryRecord: vi.fn(),
  createHistoryRecord: vi.fn(),
  updateHistoryRecord: vi.fn(),
  deleteHistoryRecord: vi.fn(),
  batchDeleteHistoryRecords: vi.fn(),
  clearAllHistory: vi.fn(),
  claimGuestHistory: vi.fn(),
}));

vi.mock('../utils/toast', () => ({
  showComingSoon: vi.fn(),
  showToast: vi.fn(),
}));

const pageStubs = {
  AppHeader: { template: '<div />' },
  LoginPromptModal: { template: '<div />' },
  BaseListbox: { template: '<div />' },
  ProfilePanel: { template: '<div />' },
  QAPanel: { template: '<div />' },
  OnboardingStepsBar: { template: '<div />' },
  UsageExamplesModal: { template: '<div />' },
  PricingPage: { template: '<div />' },
};

const mountScanPage = () =>
  mount(ScanPage, {
    global: {
      plugins: [createI18n()],
      stubs: pageStubs,
    },
  });

const createDeferred = <T>() => {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((next, fail) => {
    resolve = next;
    reject = fail;
  });
  return { promise, resolve, reject };
};

type ScanPageSetupState = {
  activeHistoryId: string;
  activeResultTab: string;
  activeSentenceId: string;
  editorMode: string;
  editorRef: HTMLElement | null;
  highlightedPreviewHtml: string;
  historySearchQuery: string;
  isHistoryManaging: boolean;
  isQuotaReady: boolean;
  isResultDetailOpen: boolean;
  isScanning: boolean;
  localText: string;
  quotaInfo: { actor_type: string; limit: number; used_today: number; remaining: number };
  renameHistoryDraft: string;
  renamingHistoryId: string;
  selectedHistoryIds: Array<string | number>;
  clearAllHistoryRecords: () => Promise<void>;
  handleScan: () => Promise<void>;
  loadHistoryRecord: (id: string | number) => Promise<void>;
  onFileChange: (event: { target: { files: File[]; value: string } }) => Promise<void>;
};

const getScanPageSetupState = (wrapper: ReturnType<typeof mountScanPage>) =>
  (wrapper.vm as unknown as { $: { setupState: ScanPageSetupState } }).$.setupState;

const dispatchGuestTokenStorage = (
  oldValue: string | null,
  newValue: string | null,
  key: string | null = 'guest_token'
) => {
  window.dispatchEvent(
    new StorageEvent('storage', {
      key,
      oldValue,
      newValue,
      storageArea: window.localStorage,
    })
  );
};

describe('ScanPage panel switching', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-token');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => (token ? `sid:${token}` : ''));
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('');
    vi.mocked(scanApi.detectText).mockReset();
    vi.mocked(quotaApi.fetchQuota).mockResolvedValue({
      limit: 5000,
      remaining: 5000,
      used_today: 0,
    });
    route.name = 'dashboard';
    route.query = { panel: 'home' };
    route.fullPath = '/dashboard?panel=home';
    window.localStorage.setItem('locale', 'en-US');
  });

  afterEach(() => {
    disposePinia(pinia);
  });

  it('从 home 点击 Document 后应切换到 document 面板', async () => {
    const wrapper = mountScanPage();

    await flushPromises();

    const navButtons = wrapper.findAll('aside nav > button');
    expect(navButtons).toHaveLength(2);

    await navButtons[1].trigger('click');
    await nextTick();
    await flushPromises();

    expect(route.query.panel).toBe('document');
    expect(wrapper.find('.editor-surface').exists()).toBe(true);
    expect(wrapper.find('.preview-surface').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Workspace overview');
    wrapper.unmount();
  });

  it('clears stale upload errors after valid editor input', async () => {
    const wrapper = mountScanPage();

    await flushPromises();

    const scanStore = useScanStore();
    scanStore.uploadError = 'This file is too long';

    const navButtons = wrapper.findAll('aside nav > button');
    await navButtons[1].trigger('click');
    await nextTick();
    await flushPromises();

    const editor = wrapper.find('.editor-surface');
    editor.element.innerHTML = '<p>Valid text</p>';
    await editor.trigger('input');

    expect(scanStore.uploadError).toBe('');
    wrapper.unmount();
  });

  it('quota 返回无错误码 401 时不清 token，也不自动创建新游客主体', async () => {
    vi.mocked(quotaApi.fetchQuota).mockImplementationOnce(async () => {
      const scanStore = useScanStore();
      scanStore.setText('keep current guest text');
      scanStore.historyRecords.push({ id: 'current-guest-history', inputText: 'keep current guest text' });
      throw { status: 401 };
    });

    const wrapper = mountScanPage();

    await flushPromises();

    expect(authApi.ensureGuestToken).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).not.toHaveBeenCalled();
    expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(1);
    const scanStore = useScanStore();
    expect(scanStore.inputText).toBe('keep current guest text');
    expect(scanStore.historyRecords).toHaveLength(1);
    wrapper.unmount();
  });

  it('quota 返回 GUEST_TOKEN_REQUIRED 时先清旧 guest 数据，再创建并绑定新主体', async () => {
    const scanStore = useScanStore();
    const clearSessionSpy = vi.spyOn(scanStore, 'clearScanSessionData');
    vi.mocked(authApi.ensureGuestToken)
      .mockResolvedValueOnce('guest-token-a')
      .mockResolvedValue('guest-token-b');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => {
      if (token === 'guest-token-a') return 'sid-a';
      if (token === 'guest-token-b') return 'sid-b';
      return '';
    });
    vi.mocked(quotaApi.fetchQuota)
      .mockImplementationOnce(async () => {
        const scanStore = useScanStore();
        scanStore.setText('old guest secret');
        scanStore.result = { summary: { ai: 88, mixed: 0, human: 12 } };
        scanStore.currentResultHistoryId = 'old-result';
        scanStore.historyRecords.push({ id: 'old-history', inputText: 'old guest secret' });
        throw { status: 401, code: 'GUEST_TOKEN_REQUIRED' };
      })
      .mockResolvedValueOnce({
        limit: 5000,
        remaining: 5000,
        used_today: 0,
      });

    const wrapper = mountScanPage();
    await flushPromises();

    expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
    expect(authApi.clearGuestToken).toHaveBeenCalledWith('guest-token-a');
    expect(authApi.ensureGuestToken).toHaveBeenCalledTimes(2);
    expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(2);
    expect(vi.mocked(authApi.clearGuestToken).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(authApi.ensureGuestToken).mock.invocationCallOrder[1]
    );
    expect(clearSessionSpy.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(authApi.ensureGuestToken).mock.invocationCallOrder[1]
    );
    expect(scanStore.inputText).toBe('');
    expect(scanStore.editorHtml).toBe('');
    expect(scanStore.result).toBeNull();
    expect(scanStore.currentResultHistoryId).toBeNull();
    expect(scanStore.historyRecords).toEqual([]);
    expect(wrapper.text()).not.toContain('old guest secret');
    wrapper.unmount();
  });

  it('同 SID 新 token 已写入时，旧 quota 401 不清当前游客的正文和历史', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-a-access-1');
    vi.mocked(authApi.ensureGuestToken)
      .mockResolvedValueOnce('guest-a-access-1')
      .mockResolvedValue('guest-a-access-2');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => (token?.startsWith('guest-a-') ? 'sid-a' : ''));
    vi.mocked(authApi.clearGuestToken).mockReturnValueOnce(false);
    const oldQuota = createDeferred<{ limit: number; remaining: number; used_today: number }>();
    vi.mocked(quotaApi.fetchQuota)
      .mockReturnValueOnce(oldQuota.promise)
      .mockResolvedValueOnce({ limit: 5000, remaining: 4321, used_today: 679 });
    const wrapper = mountScanPage();
    await vi.waitFor(() => expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(1));
    const scanStore = useScanStore();
    const clearSessionSpy = vi.spyOn(scanStore, 'clearScanSessionData');
    scanStore.setEditorHtml('<p>same sid draft</p>');
    scanStore.historyRecords = [{ id: 'same-sid-history', inputText: 'same sid draft' }];

    dispatchGuestTokenStorage('guest-a-access-1', 'guest-a-access-2');
    oldQuota.reject({ status: 401, code: 'GUEST_TOKEN_REQUIRED' });
    await flushPromises();

    expect(authApi.clearGuestToken).toHaveBeenCalledWith('guest-a-access-1');
    expect(clearSessionSpy).not.toHaveBeenCalled();
    expect(authApi.ensureGuestToken).toHaveBeenCalledTimes(2);
    expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(2);
    expect(scanStore.inputText).toBe('same sid draft');
    expect(scanStore.historyRecords).toEqual([{ id: 'same-sid-history', inputText: 'same sid draft' }]);
    wrapper.unmount();
  });

  it('开始扫描前若 guest SID 已切换，会清空旧正文且不发送给新主体', async () => {
    route.query = { panel: 'document' };
    route.fullPath = '/dashboard?panel=document';
    vi.mocked(authApi.ensureGuestToken)
      .mockResolvedValueOnce('guest-token-a')
      .mockResolvedValueOnce('guest-token-b');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => {
      if (token === 'guest-token-a') return 'sid-a';
      if (token === 'guest-token-b') return 'sid-b';
      return '';
    });

    const wrapper = mountScanPage();
    await flushPromises();
    const scanStore = useScanStore();
    scanStore.setText('A'.repeat(200));
    await nextTick();

    const startButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes(globalT('scan.toolbar.start')));
    expect(startButton).toBeTruthy();
    await startButton!.trigger('click');
    await flushPromises();

    expect(scanStore.inputText).toBe('');
    expect(scanApi.detectText).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('跨标签同 SID refresh 保留内存，不同 SID 或 token 删除会清敏感状态，页面卸载后 Store 仍响应', async () => {
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-a-access-1');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => {
      if (token?.startsWith('guest-a-')) return 'sid-a';
      if (token?.startsWith('guest-b-')) return 'sid-b';
      return '';
    });
    const wrapper = mountScanPage();
    await flushPromises();
    const scanStore = useScanStore();
    scanStore.setText('sid-a secret');
    scanStore.result = { summary: { ai: 99, mixed: 0, human: 1 } };
    scanStore.currentResultHistoryId = 'sid-a-result';
    scanStore.historyRecords.push({ id: 'sid-a-history', inputText: 'sid-a secret' });

    dispatchGuestTokenStorage('guest-a-access-1', 'guest-a-access-2');
    await flushPromises();
    expect(scanStore.inputText).toBe('sid-a secret');
    expect(scanStore.historyRecords).toHaveLength(1);

    dispatchGuestTokenStorage('guest-a-access-2', 'guest-b-access-1');
    await flushPromises();
    expect(scanStore.inputText).toBe('');
    expect(scanStore.editorHtml).toBe('');
    expect(scanStore.result).toBeNull();
    expect(scanStore.currentResultHistoryId).toBeNull();
    expect(scanStore.historyRecords).toEqual([]);
    expect(wrapper.text()).not.toContain('sid-a secret');

    scanStore.setText('local storage clear secret');
    dispatchGuestTokenStorage(null, null, null);
    await flushPromises();
    expect(scanStore.inputText).toBe('');

    dispatchGuestTokenStorage(null, 'guest-b-access-2');
    await flushPromises();
    scanStore.setText('sid-b secret');
    dispatchGuestTokenStorage('guest-b-access-2', null);
    await flushPromises();
    expect(scanStore.inputText).toBe('');

    dispatchGuestTokenStorage(null, 'guest-b-access-3');
    await flushPromises();
    scanStore.setText('after unmount');
    wrapper.unmount();
    dispatchGuestTokenStorage('guest-b-access-3', 'guest-a-access-3');
    await flushPromises();
    expect(scanStore.inputText).toBe('');
  });

  it('登录用户忽略 guest_token 跨标签变化并保留当前 UI', async () => {
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-a-access-1');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => {
      if (token?.startsWith('guest-a-')) return 'sid-a';
      if (token?.startsWith('guest-b-')) return 'sid-b';
      return '';
    });
    const wrapper = mountScanPage();
    await flushPromises();
    const authStore = useAuthStore();
    const scanStore = useScanStore();
    authStore.token = '__cookie__';
    scanStore.setText('authenticated user secret');
    scanStore.historyRecords.push({ id: 'user-history', inputText: 'authenticated user secret' });
    vi.mocked(authApi.getGuestSessionId).mockClear();

    dispatchGuestTokenStorage('guest-a-access-1', 'guest-b-access-1');
    await flushPromises();

    expect(authApi.getGuestSessionId).not.toHaveBeenCalledWith('guest-b-access-1');
    expect(scanStore.inputText).toBe('authenticated user secret');
    expect(scanStore.historyRecords).toHaveLength(1);
    wrapper.unmount();
  });

  it('同一 Pinia 中 A 页面卸载后 token 换成 B，remount 首屏前同步清掉 A', async () => {
    let storedGuestToken = 'guest-a-access-1';
    vi.mocked(authApi.getStoredGuestToken).mockImplementation(() => storedGuestToken);
    vi.mocked(authApi.ensureGuestToken)
      .mockResolvedValueOnce('guest-a-access-1')
      .mockResolvedValue('guest-b-access-1');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => {
      if (token?.startsWith('guest-a-')) return 'sid-a';
      if (token?.startsWith('guest-b-')) return 'sid-b';
      return '';
    });

    const firstWrapper = mountScanPage();
    await flushPromises();
    const scanStore = useScanStore();
    scanStore.setEditorHtml('<p>sid-a remount secret</p>');
    scanStore.historyRecords.push({ id: 'sid-a-remount', inputText: 'sid-a remount secret' });
    firstWrapper.unmount();
    storedGuestToken = 'guest-b-access-1';

    const secondWrapper = mountScanPage();

    expect(scanStore.inputText).toBe('');
    expect(scanStore.editorHtml).toBe('');
    expect(scanStore.historyRecords).toEqual([]);
    expect(secondWrapper.text()).not.toContain('sid-a remount secret');
    secondWrapper.unmount();
  });

  it('session generation 变化会同步清空页面搜索、重命名、选择、详情和预览状态', async () => {
    route.query = { panel: 'document' };
    route.fullPath = '/dashboard?panel=document';
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-a-access-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-a-access-1');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => {
      if (token?.startsWith('guest-a-')) return 'sid-a';
      if (token?.startsWith('guest-b-')) return 'sid-b';
      return '';
    });
    const wrapper = mountScanPage();
    await flushPromises();
    const scanStore = useScanStore();
    const state = getScanPageSetupState(wrapper);
    const searchSpy = vi.spyOn(scanStore, 'searchHistoryRecords');
    searchSpy.mockClear();
    scanStore.setEditorHtml('<p>sid-a editor secret</p>');
    scanStore.result = { summary: { ai: 95, mixed: 0, human: 5 }, sentences: [] };
    scanStore.historyRecords.push({ id: 'sid-a-history', inputText: 'sid-a history secret' });
    state.localText = 'sid-a local secret';
    state.historySearchQuery = 'sid-a search secret';
    state.renamingHistoryId = 'sid-a-history';
    state.renameHistoryDraft = 'sid-a rename secret';
    state.selectedHistoryIds = ['sid-a-history'];
    state.isHistoryManaging = true;
    state.activeHistoryId = 'sid-a-history';
    state.isResultDetailOpen = true;
    state.activeSentenceId = 'sid-a-sentence';
    state.highlightedPreviewHtml = '<p>sid-a preview secret</p>';
    state.editorMode = 'preview';
    state.activeResultTab = 'translate';
    await nextTick();

    scanStore.activateGuestSession('sid-b');
    await nextTick();

    expect(state.localText).toBe('');
    expect(state.historySearchQuery).toBe('');
    expect(state.renamingHistoryId).toBe('');
    expect(state.renameHistoryDraft).toBe('');
    expect(state.selectedHistoryIds).toEqual([]);
    expect(state.isHistoryManaging).toBe(false);
    expect(state.activeHistoryId).toBe('');
    expect(state.isResultDetailOpen).toBe(false);
    expect(state.activeSentenceId).toBe('');
    expect(state.highlightedPreviewHtml).toBe('');
    expect(state.editorMode).toBe('edit');
    expect(state.activeResultTab).toBe('scan');
    expect(state.editorRef?.innerHTML || '').toBe('');
    expect(wrapper.text()).not.toContain('sid-a history secret');
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(searchSpy).not.toHaveBeenCalledWith({ q: 'sid-a search secret' });
    wrapper.unmount();
  });

  it('扫描响应回来前 generation 已变化时不切预览，也不刷新旧主体配额', async () => {
    route.query = { panel: 'document' };
    route.fullPath = '/dashboard?panel=document';
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-a-access-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-a-access-1');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => (token?.startsWith('guest-a-') ? 'sid-a' : ''));
    const wrapper = mountScanPage();
    await flushPromises();
    const scanStore = useScanStore();
    const state = getScanPageSetupState(wrapper);
    const staleAnalysis = {
      summary: { ai: 90, mixed: 0, human: 10 },
      sentences: [],
      highlightedHtml: '<p>stale analysis secret</p>',
    };
    const deferred = createDeferred<typeof staleAnalysis>();
    const analyzeSpy = vi.spyOn(scanStore, 'analyzeText').mockReturnValue(deferred.promise);
    scanStore.setText('A'.repeat(200));
    await nextTick();
    vi.mocked(quotaApi.fetchQuota).mockClear();

    const startButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes(globalT('scan.toolbar.start')));
    await startButton!.trigger('click');
    await vi.waitFor(() => expect(analyzeSpy).toHaveBeenCalledTimes(1));
    scanStore.activateGuestSession('sid-b');
    state.isScanning = true;
    deferred.resolve(staleAnalysis);
    await flushPromises();

    expect(state.editorMode).toBe('edit');
    expect(state.highlightedPreviewHtml).toBe('');
    expect(state.isScanning).toBe(true);
    expect(quotaApi.fetchQuota).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('stale analysis secret');
    wrapper.unmount();
  });

  it('旧 generation 的 quota 响应不会回填新主体额度', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-a-access-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-a-access-1');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => (token?.startsWith('guest-a-') ? 'sid-a' : ''));
    const deferred = createDeferred<{ limit: number; remaining: number; used_today: number }>();
    vi.mocked(quotaApi.fetchQuota).mockReturnValue(deferred.promise);

    const wrapper = mountScanPage();
    await vi.waitFor(() => expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(1));
    const scanStore = useScanStore();
    const authStore = useAuthStore();
    const state = getScanPageSetupState(wrapper);
    scanStore.activateGuestSession('sid-b');
    deferred.resolve({ limit: 5000, remaining: 1234, used_today: 3766 });
    await flushPromises();

    expect(state.isQuotaReady).toBe(false);
    expect(state.quotaInfo).toEqual({ actor_type: '', limit: 0, used_today: 0, remaining: 0 });
    expect(authStore.creditUsage.remaining).toBe(0);
    wrapper.unmount();
  });

  it('历史详情加载期间身份已切换时不会用旧列表记录回填新会话', async () => {
    route.query = { panel: 'document' };
    route.fullPath = '/dashboard?panel=document';
    const wrapper = mountScanPage();
    await flushPromises();
    const authStore = useAuthStore();
    const scanStore = useScanStore();
    const state = getScanPageSetupState(wrapper);
    authStore.token = '__cookie__';
    authStore.user = { id: 42, email: 'user@example.com' };
    scanStore.historyRecords = [
      {
        id: 'old-record',
        inputText: 'old actor detail secret',
        editorHtml: '<p>old actor detail secret</p>',
        analysis: null,
      },
    ];
    const deferred = createDeferred<null>();
    const detailSpy = vi.spyOn(scanStore, 'fetchHistoryRecordDetail').mockReturnValue(deferred.promise);

    const loading = state.loadHistoryRecord('old-record');
    await vi.waitFor(() => expect(detailSpy).toHaveBeenCalledWith('old-record'));
    scanStore.clearScanSessionData();
    deferred.resolve(null);
    await loading;
    await flushPromises();

    expect(scanStore.inputText).toBe('');
    expect(scanStore.editorHtml).toBe('');
    expect(scanStore.result).toBeNull();
    expect(scanStore.historyRecords).toEqual([]);
    expect(wrapper.text()).not.toContain('old actor detail secret');
    wrapper.unmount();
  });

  it('游客 quota 请求返回前登录完成时不会把游客额度写进账号', async () => {
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-a-access-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-a-access-1');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => (token?.startsWith('guest-a-') ? 'sid-a' : ''));
    const guestRequest = createDeferred<{ limit: number; remaining: number; used_today: number }>();
    const userRequest = createDeferred<{ limit: number; remaining: number; used_today: number }>();
    vi.mocked(quotaApi.fetchQuota)
      .mockReturnValueOnce(guestRequest.promise)
      .mockReturnValueOnce(userRequest.promise);
    const wrapper = mountScanPage();
    await vi.waitFor(() => expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(1));
    const authStore = useAuthStore();
    const state = getScanPageSetupState(wrapper);

    authStore.token = '__cookie__';
    authStore.user = { id: 7, email: 'signed-in@example.com', credits: 9000 };
    await vi.waitFor(() => expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(2));
    guestRequest.resolve({ limit: 5000, remaining: 1234, used_today: 3766 });
    await flushPromises();

    expect(state.isQuotaReady).toBe(false);
    expect(state.quotaInfo).toEqual({ actor_type: '', limit: 0, used_today: 0, remaining: 0 });
    expect(authStore.user.credits).toBe(9000);
    wrapper.unmount();
  });

  it('账号 quota 请求返回前退出时不会把旧账号额度写进游客态', async () => {
    window.localStorage.setItem('auth_session', '1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('');
    const authStore = useAuthStore();
    authStore.token = '__cookie__';
    authStore.user = { id: 9, email: 'before-logout@example.com', credits: 8000 };
    const userRequest = createDeferred<{ limit: number; remaining: number; used_today: number }>();
    const guestRequest = createDeferred<{ limit: number; remaining: number; used_today: number }>();
    vi.mocked(quotaApi.fetchQuota)
      .mockReturnValueOnce(userRequest.promise)
      .mockReturnValueOnce(guestRequest.promise);
    const wrapper = mountScanPage();
    await vi.waitFor(() => expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(1));
    const state = getScanPageSetupState(wrapper);

    authStore.token = '';
    authStore.user = null;
    window.localStorage.removeItem('auth_session');
    await vi.waitFor(() => expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(2));
    userRequest.resolve({ limit: 10000, remaining: 4321, used_today: 5679 });
    await flushPromises();

    expect(state.isQuotaReady).toBe(false);
    expect(state.quotaInfo).toEqual({ actor_type: '', limit: 0, used_today: 0, remaining: 0 });
    expect(authStore.creditUsage.remaining).toBe(0);
    wrapper.unmount();
  });

  it('登录态残留 guest token 时进入扫描页不会清掉账号草稿', async () => {
    route.query = { panel: 'document' };
    route.fullPath = '/dashboard?panel=document';
    window.localStorage.setItem('auth_session', '1');
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-a-access-1');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => (token?.startsWith('guest-a-') ? 'sid-a' : ''));
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('');
    const authStore = useAuthStore();
    authStore.token = '__cookie__';
    authStore.user = { id: 11, email: 'account@example.com' };
    const scanStore = useScanStore();
    await flushPromises();
    const clearSessionSpy = vi.spyOn(scanStore, 'clearScanSessionData');
    scanStore.setEditorHtml('<p>account draft secret</p>');

    const wrapper = mountScanPage();
    await flushPromises();

    expect(scanStore.inputText).toBe('account draft secret');
    expect(scanStore.editorHtml).toBe('<p>account draft secret</p>');
    expect(clearSessionSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('account draft secret');
    wrapper.unmount();
  });

  it('旧 clear-history 请求返回时不会清掉新主体刚输入的内容', async () => {
    const wrapper = mountScanPage();
    await flushPromises();
    const scanStore = useScanStore();
    const state = getScanPageSetupState(wrapper);
    scanStore.historyRecords = [{ id: 'old-record', inputText: 'old actor record' }];
    const deferred = createDeferred<{ deletedCount: number }>();
    const clearSpy = vi.spyOn(scanStore, 'clearAllHistoryRecords').mockReturnValue(deferred.promise);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const clearing = state.clearAllHistoryRecords();
    await vi.waitFor(() => expect(clearSpy).toHaveBeenCalledTimes(1));
    scanStore.clearScanSessionData();
    scanStore.setEditorHtml('<p>new actor draft</p>');
    scanStore.result = { summary: { ai: 10, mixed: 0, human: 90 } };
    scanStore.historyRecords = [{ id: 'new-record', inputText: 'new actor draft' }];
    deferred.resolve({ deletedCount: 0 });
    await clearing;
    await flushPromises();

    expect(scanStore.inputText).toBe('new actor draft');
    expect(scanStore.result).toEqual({ summary: { ai: 10, mixed: 0, human: 90 } });
    expect(scanStore.historyRecords).toEqual([{ id: 'new-record', inputText: 'new actor draft' }]);
    wrapper.unmount();
  });

  it('旧文件解析作废后不会清掉新主体的正文和结果', async () => {
    const wrapper = mountScanPage();
    await flushPromises();
    const scanStore = useScanStore();
    const state = getScanPageSetupState(wrapper);
    const deferred = createDeferred<boolean>();
    const readSpy = vi.spyOn(scanStore, 'readFile').mockReturnValue(deferred.promise);
    const event = { target: { files: [new File(['old'], 'old.txt', { type: 'text/plain' })], value: 'old.txt' } };

    const reading = state.onFileChange(event);
    await vi.waitFor(() => expect(readSpy).toHaveBeenCalledTimes(1));
    scanStore.clearScanSessionData();
    scanStore.setEditorHtml('<p>new actor file draft</p>');
    scanStore.result = { summary: { ai: 5, mixed: 0, human: 95 } };
    deferred.resolve(false);
    await reading;
    await flushPromises();

    expect(scanStore.inputText).toBe('new actor file draft');
    expect(scanStore.result).toEqual({ summary: { ai: 5, mixed: 0, human: 95 } });
    expect(state.editorMode).toBe('edit');
    wrapper.unmount();
  });

  it('等待 guest 凭据期间完成登录时不会把游客正文作为账号检测发送', async () => {
    route.query = { panel: 'document' };
    route.fullPath = '/dashboard?panel=document';
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-a-access-1');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-a-access-1');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => (token?.startsWith('guest-a-') ? 'sid-a' : ''));
    const wrapper = mountScanPage();
    await flushPromises();
    const authStore = useAuthStore();
    const scanStore = useScanStore();
    const state = getScanPageSetupState(wrapper);
    scanStore.setText('A'.repeat(200));
    vi.mocked(scanApi.detectText).mockClear();
    vi.mocked(authApi.ensureGuestToken).mockClear();
    const pendingCredential = createDeferred<string>();
    vi.mocked(authApi.ensureGuestToken).mockReturnValue(pendingCredential.promise);

    const scanning = state.handleScan();
    await vi.waitFor(() => expect(authApi.ensureGuestToken).toHaveBeenCalledTimes(1));
    authStore.token = '__cookie__';
    authStore.user = { id: 73, email: 'new-account@example.com' };
    pendingCredential.resolve('guest-a-access-1');
    await scanning;
    await flushPromises();

    expect(scanApi.detectText).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('扫描出站时固定 ensure 返回的 guest token，不重读其他标签的新 token', async () => {
    route.query = { panel: 'document' };
    route.fullPath = '/dashboard?panel=document';
    vi.mocked(authApi.getStoredGuestToken).mockReturnValue('guest-a-token');
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-a-token');
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => {
      if (token === 'guest-a-token') return 'sid-a';
      if (token === 'guest-b-token') return 'sid-b';
      return '';
    });
    vi.mocked(scanApi.detectText).mockResolvedValue({
      historyId: 91,
      score: 0.1,
      label: 'human',
    });
    const wrapper = mountScanPage();
    await flushPromises();
    const scanStore = useScanStore();
    const state = getScanPageSetupState(wrapper);
    scanStore.setText('A'.repeat(200));
    vi.mocked(scanApi.detectText).mockClear();

    window.localStorage.setItem('guest_token', 'guest-b-token');
    await state.handleScan();
    await flushPromises();

    expect(scanApi.detectText).toHaveBeenCalledTimes(1);
    expect(vi.mocked(scanApi.detectText).mock.calls[0][1]).toBe('guest-a-token');
    wrapper.unmount();
  });
});
