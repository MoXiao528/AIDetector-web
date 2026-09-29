import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, disposePinia, setActivePinia } from 'pinia';
import { reactive, nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import ScanPage from './ScanPage.vue';
import EvidencePanel from '../components/EvidencePanel.vue';
import { createI18n, globalT } from '../i18n';
import { useAuthStore } from '../store/auth';
import { useScanStore } from '../store/scan';
import * as authApi from '../api/modules/auth';
import * as quotaApi from '../api/modules/quota';
import * as scanApi from '../api/modules/scan';
import * as historyApi from '../api/modules/history';

const route = reactive({
  name: 'dashboard',
  fullPath: '/dashboard?panel=home',
  query: { panel: 'home' } as Record<string, string | undefined>,
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

const makeHistoryResponse = (records = []) => ({
  items: records.map((record) => ({
    id: record.id, user_id: null, title: record.title || '',
    created_at: record.createdAt || '2026-09-12T00:00:00Z',
    functions: record.functions || ['scan'], input_text: record.inputText,
    editor_html: record.editorHtml || `<p>${record.inputText}</p>`,
    is_pinned: Boolean(record.isPinned), analysis: record.analysis || null,
    evidence: record.evidence,
  })),
  total: records.length, page: 1, per_page: 100, total_pages: records.length ? 1 : 0,
});

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
    window.localStorage.setItem('guest_token', 'guest-token');
    vi.mocked(authApi.getStoredGuestToken).mockImplementation(() => window.localStorage.getItem('guest_token') || '');
    vi.mocked(scanApi.detectText).mockReset();
    vi.mocked(historyApi.getHistoryList).mockReset().mockResolvedValue(makeHistoryResponse());
    vi.mocked(historyApi.getHistoryRecord).mockReset();
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

  it.each(['home', 'document'])('游客进入 %s 后取得凭据并从服务器恢复历史，不恢复浏览器正文缓存', async (panel) => {
    route.query = { panel };
    window.localStorage.removeItem('guest_token');
    window.localStorage.setItem('ai-detector-history-records', JSON.stringify([{ id: 99, inputText: 'obsolete local secret' }]));
    vi.mocked(authApi.ensureGuestToken).mockImplementationOnce(async () => {
      window.localStorage.setItem('guest_token', 'recovered-token');
      return 'recovered-token';
    });
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([{ id: 901, inputText: 'server original', title: 'Server history' }]));
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      expect(historyApi.getHistoryList).toHaveBeenLastCalledWith(expect.any(Object), 'recovered-token');
      expect(scanStore.historyRecords).toHaveLength(1);
      expect(scanStore.historyRecords[0]).toMatchObject({ id: 901, inputText: 'server original' });
      expect(scanStore.historyLoadFailed).toBe(false);
      expect(window.localStorage.getItem('ai-detector-history-records')).toBeNull();
      expect(JSON.stringify(Object.values(window.localStorage))).not.toContain('server original');
      expect(scanApi.detectText).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
  });

  it('游客列表无分析时读取详情，详情仍无分析则只打开正文', async () => {
    route.query = { panel: 'document' };
    const list = makeHistoryResponse([
      { id: 904, inputText: 'Complete detail text', analysis: null },
      { id: 905, inputText: 'Unanalyzed draft text', analysis: null },
    ]);
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(list);
    vi.mocked(historyApi.getHistoryRecord)
      .mockResolvedValueOnce({
        ...list.items[0],
        analysis: {
          summary: { ai: 77, human: 23 }, sentences: [], translation: '', polish: '',
          citations: [], ai_likely_count: 0, highlighted_html: '',
        },
      })
      .mockResolvedValueOnce(list.items[1]);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      expect(scanStore.historyRecords.map((record) => record.analysis)).toEqual([null, null]);

      await state.loadHistoryRecord(904);
      expect(historyApi.getHistoryRecord).toHaveBeenCalledWith(904, 'guest-token');
      expect(scanStore.result?.summary).toEqual({ ai: 77, human: 23 });
      expect(state.editorMode).toBe('preview');

      await state.loadHistoryRecord(905);
      expect(historyApi.getHistoryRecord).toHaveBeenCalledWith(905, 'guest-token');
      expect(scanStore.inputText).toBe('Unanalyzed draft text');
      expect(scanStore.result).toBeNull();
      expect(scanStore.resultInputText).toBe('');
      expect(state.editorMode).toBe('edit');
    } finally {
      wrapper.unmount();
    }
  });

  it('游客刷新详情 URL 时可读取不在当前列表中的服务器记录和 Evidence', async () => {
    route.query = { panel: 'document', detail: '902' };
    route.fullPath = '/dashboard?panel=document&detail=902';
    const evidence: scanApi.EvidenceResult = {
      status: 'unsupported', artifactVersion: null, featureSchemaVersion: 1, route: null,
      quality: { level: 'unavailable', coverage: 0, reasons: ['unsupported_language'] }, signals: [], patterns: null,
    };
    const record = makeHistoryResponse([{
      id: 902, inputText: 'Persisted guest document', title: 'Recovered detail', evidence,
      analysis: { summary: { ai: 77, human: 23 }, sentences: [] },
    }]).items[0];
    vi.mocked(historyApi.getHistoryRecord).mockResolvedValue(record);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      expect(historyApi.getHistoryRecord).toHaveBeenCalledWith('902', 'guest-token');
      expect(scanStore.currentResultHistoryId).toBe(902);
      expect(scanStore.inputText).toBe('Persisted guest document');
      expect(scanStore.result?.evidence).toEqual(evidence);
      expect(scanStore.result?.summary).toEqual({ ai: 77, human: 23 });
      expect(getScanPageSetupState(wrapper).isResultDetailOpen).toBe(true);
      expect(wrapper.findAllComponents(EvidencePanel).find((component) => component.props('detailed'))?.props('submittedText')).toBe('Persisted guest document');
      expect(scanApi.detectText).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
  });

  it('游客历史读取失败明确显示错误和重试，不能显示成暂无记录', async () => {
    route.query = { panel: 'document' };
    vi.mocked(historyApi.getHistoryList).mockRejectedValue(new Error('temporary history failure'));
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      expect(wrapper.get('[role="alert"]').text()).toContain(globalT('scan.history.loadFailed'));
      expect(wrapper.text()).not.toContain(globalT('scan.history.emptyTitle'));
      expect(useScanStore().historyRecords).toEqual([]);
      vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([{ id: 903, inputText: 'Retry recovered document' }]));
      await wrapper.get('[role="alert"] button').trigger('click');
      await flushPromises();
      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
      expect(useScanStore().historyRecords[0]).toMatchObject({ id: 903, inputText: 'Retry recovered document' });
    } finally {
      wrapper.unmount();
    }
  });

  it('旧漏段记录显示覆盖提示，手动重检提交完整原文并恢复正确高亮', async () => {
    route.query = { panel: 'document' };
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      const paragraphs = ['开头正文', '正文甲'.repeat(40), '中间遗漏正文', '正文乙'.repeat(40)];
      const html = `<div>${paragraphs[0]}<div>${paragraphs[1]}</div><strong>${paragraphs[2]}</strong><div>${paragraphs[3]}</div></div>`;
      const oldText = [paragraphs[1], paragraphs[3]].join('\n');
      const fullText = paragraphs.join('\n\n');
      await scanStore.addHistoryRecord({
        id: 454,
        title: '旧漏段记录', text: oldText, html, functions: ['scan'],
        analysis: {
          summary: { ai: 10, human: 90 },
          sentences: [{ id: 'old-1', raw: oldText, startParagraph: 1, endParagraph: 2, type: 'human', probability: 0.1 }],
        },
      });
      const oldRecord = scanStore.historyRecords[0];
      await state.loadHistoryRecord(oldRecord.id);
      await flushPromises();
      expect(wrapper.text()).toContain(globalT('scan.results.incompleteTextNotice'));
      expect(wrapper.get('.preview-surface').text()).toContain(paragraphs[0]);
      expect(wrapper.get('.preview-surface').text()).toContain(paragraphs[2]);
      expect(wrapper.find('.preview-surface [data-sentence-id]').exists()).toBe(false);
      expect(scanStore.result?.summary.ai).toBe(10);
      expect(scanApi.detectText).not.toHaveBeenCalled();
      state.isResultDetailOpen = true;
      await nextTick();
      expect(wrapper.findAll('[data-testid="incomplete-text-notice"]')).toHaveLength(2);
      state.isResultDetailOpen = false;

      vi.mocked(scanApi.detectText).mockResolvedValueOnce({
        historyId: 455,
        result: {
          summary: { ai: 20, human: 80 },
          sentences: paragraphs.map((raw, index) => ({
            id: `new-${index}`, text: raw, raw, startParagraph: index + 1, endParagraph: index + 1, type: 'human', probability: 0.2,
          })),
        },
      });
      await state.handleScan();
      await flushPromises();
      expect(scanApi.detectText).toHaveBeenCalledTimes(1);
      expect(vi.mocked(scanApi.detectText).mock.calls[0][0].text).toBe(fullText);
      expect(wrapper.find('[data-testid="incomplete-text-notice"]').exists()).toBe(false);
      expect(wrapper.findAll('.preview-surface [data-sentence-id]').map((node) => node.text())).toEqual(paragraphs);
      expect(oldRecord.inputText).toBe(oldText);
      expect(oldRecord.analysis.summary.ai).toBe(10);
    } finally {
      wrapper.unmount();
    }
  });

  it.each([
    { missingChars: 20000, remaining: 5000 },
    { missingChars: 300, remaining: 300 },
  ])('重检前用补全后的正文校验长度和额度（遗漏=$missingChars，可用=$remaining）', async ({ missingChars, remaining }) => {
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      state.quotaInfo = { actor_type: 'guest', limit: 5000, used_today: 5000 - remaining, remaining };
      const oldText = '已送检'.repeat(70);
      const missing = '字'.repeat(missingChars);
      scanStore.setImportedContent({ text: oldText, html: `<div>${missing}<div>${oldText}</div></div>` });
      await state.handleScan();
      expect(scanStore.inputText).toBe(`${missing}\n\n${oldText}`);
      expect(scanApi.detectText).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
  });

  it('quota 返回无错误码 401 时不清 token，也不自动创建新游客主体', async () => {
    vi.mocked(historyApi.getHistoryList).mockRejectedValue(new Error('history unavailable'));
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
        scanStore.result = { summary: { ai: 88, human: 12 } };
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
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse(scanStore.historyRecords));

    dispatchGuestTokenStorage('guest-a-access-1', 'guest-a-access-2');
    oldQuota.reject({ status: 401, code: 'GUEST_TOKEN_REQUIRED' });
    await flushPromises();

    expect(authApi.clearGuestToken).toHaveBeenCalledWith('guest-a-access-1');
    expect(clearSessionSpy).not.toHaveBeenCalled();
    expect(authApi.ensureGuestToken).toHaveBeenCalledTimes(2);
    expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(2);
    expect(scanStore.inputText).toBe('same sid draft');
    expect(scanStore.historyRecords).toHaveLength(1);
    expect(scanStore.historyRecords[0]).toMatchObject({ id: 'same-sid-history', inputText: 'same sid draft' });
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
    scanStore.result = { summary: { ai: 99, human: 1 } };
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
    scanStore.result = { summary: { ai: 95, human: 5 }, sentences: [] };
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
      summary: { ai: 90, human: 10 },
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

  it.each(['修改文字', '只拆分段落'])('检测期间%s后，旧结果只标注送检快照并提示当前正文不匹配', async (edit) => {
    route.query = { panel: 'document' };
    const oldText = '旧正文'.repeat(70);
    const newText = edit === '只拆分段落'
      ? `${oldText.slice(0, 105)}\n\n${oldText.slice(105)}`
      : '新正文'.repeat(70);
    const editedHtml = edit === '只拆分段落'
      ? `<p>${oldText.slice(0, 105)}</p><p>${oldText.slice(105)}</p>`
      : `<p>${newText}</p>`;
    const response = createDeferred<scanApi.DetectionResponse>();
    vi.mocked(scanApi.detectText).mockReturnValue(response.promise);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      scanStore.setText(oldText);
      const scanning = state.handleScan();
      await vi.waitFor(() => expect(scanApi.detectText).toHaveBeenCalledTimes(1));

      const editor = wrapper.get('.editor-surface');
      editor.element.innerHTML = editedHtml;
      await editor.trigger('input');
      expect(scanStore.inputText).toBe(newText);

      response.resolve({
        historyId: 991,
        inputText: oldText,
        result: {
          summary: { ai: 80, human: 20 },
          sentences: [{ id: 'submitted-sentence', text: oldText, raw: oldText, startParagraph: 1, endParagraph: 1, type: 'ai', probability: 0.8 }],
        },
      });
      await scanning;
      await flushPromises();

      expect(scanStore.resultInputText).toBe(oldText);
      expect(scanStore.inputText).toBe(newText);
      expect(wrapper.find('[data-testid="incomplete-text-notice"]').exists()).toBe(true);
      expect(wrapper.get('.preview-surface [data-sentence-id="submitted-sentence"]').text()).toBe(oldText);
      expect(wrapper.get('.preview-surface').text()).not.toContain(newText);
      expect(editor.element.innerHTML).toBe(editedHtml);
    } finally {
      wrapper.unmount();
    }
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
    scanStore.result = { summary: { ai: 10, human: 90 } };
    scanStore.historyRecords = [{ id: 'new-record', inputText: 'new actor draft' }];
    deferred.resolve({ deletedCount: 0 });
    await clearing;
    await flushPromises();

    expect(scanStore.inputText).toBe('new actor draft');
    expect(scanStore.result).toEqual({ summary: { ai: 10, human: 90 } });
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
    scanStore.result = { summary: { ai: 5, human: 95 } };
    deferred.resolve(false);
    await reading;
    await flushPromises();

    expect(scanStore.inputText).toBe('new actor file draft');
    expect(scanStore.result).toEqual({ summary: { ai: 5, human: 95 } });
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

  it.each([23, 77])('Evidence 随检测和历史切换面板，缺失时恢复旧页面，主摘要 AI=%i 与段落预览不变', async (ai) => {
    route.query = { panel: 'document' };
    route.fullPath = '/dashboard?panel=document';
    const text = 'The same paragraph remains unchanged across both responses. '.repeat(4).trim();
    const label = ai === 77 ? 'ai' : 'human';
    const evidence: scanApi.EvidenceResult = {
      status: 'unsupported',
      artifactVersion: null,
      featureSchemaVersion: 1,
      route: null,
      quality: { level: 'unavailable', coverage: 0, reasons: ['unsupported_language'] },
      signals: [],
      patterns: null,
    };
    const response: scanApi.DetectionResponse = {
      historyId: 91,
      inputText: text,
      score: ai / 100,
      label,
      result: {
        summary: { ai, human: 100 - ai },
        sentences: [{
          id: 'ev5-main-paragraph',
          text,
          raw: text,
          startParagraph: 1,
          endParagraph: 1,
          type: label,
          probability: ai / 100,
          score: ai,
        }],
      },
    };
    vi.mocked(scanApi.detectText)
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce({ ...response, historyId: 92, evidence });
    const wrapper = mountScanPage();
    await flushPromises();
    const scanStore = useScanStore();
    const state = getScanPageSetupState(wrapper);
    scanStore.setText(text);

    await state.handleScan();
    await flushPromises();
    const legacyHistoryId = scanStore.currentResultHistoryId;
    const legacyResultPanel = wrapper.get('.text-6xl').element.closest('aside')!.innerHTML;
    const legacySummary = wrapper.get('.text-6xl').element.closest('.shadow-premium')!.outerHTML;
    const legacyPreview = wrapper.get('.preview-surface').html();
    expect(wrapper.find('[data-testid="evidence-panel"]').exists()).toBe(false);
    expect(wrapper.get('.text-6xl').text()).toBe(`${ai}%`);
    expect(legacyResultPanel).toContain(`${100 - ai}%`);
    expect(legacyPreview).toContain('data-sentence-id="ev5-main-paragraph"');
    expect(scanStore.result?.summary).toEqual({ ai, human: 100 - ai });

    await state.handleScan();
    await flushPromises();
    const evidenceHistoryId = scanStore.currentResultHistoryId;
    expect(scanStore.result?.evidence).toEqual(evidence);
    expect(wrapper.get('.text-6xl').element.closest('.shadow-premium')!.outerHTML).toBe(legacySummary);
    expect(wrapper.get('[data-testid="evidence-status"]').text()).toBe(globalT('scan.evidence.presentation.status.unsupported'));
    expect(wrapper.get('.preview-surface').html()).toBe(legacyPreview);

    await state.loadHistoryRecord(legacyHistoryId);
    await flushPromises();
    expect(scanStore.result?.evidence).toBeUndefined();
    expect(scanStore.result?.summary).toEqual({ ai, human: 100 - ai });
    expect(wrapper.find('[data-testid="evidence-panel"]').exists()).toBe(false);
    expect(wrapper.get('.text-6xl').element.closest('aside')!.innerHTML).toBe(legacyResultPanel);

    await state.loadHistoryRecord(evidenceHistoryId);
    await flushPromises();
    expect(scanStore.result?.evidence).toEqual(evidence);
    expect(scanStore.result?.summary).toEqual({ ai, human: 100 - ai });
    expect(wrapper.get('.text-6xl').element.closest('.shadow-premium')!.outerHTML).toBe(legacySummary);
    expect(wrapper.get('[data-testid="evidence-status"]').text()).toBe(globalT('scan.evidence.presentation.status.unsupported'));
    expect(wrapper.get('.preview-surface').html()).toBe(legacyPreview);
    wrapper.unmount();
  });

  it.each([23, 77])('侧栏摘要导航到分维度详情，专业快照随历史回放且主结果 AI=%i 不受提示影响', async (ai) => {
    route.query = { panel: 'document' };
    route.fullPath = '/dashboard?panel=document';
    const label = ai === 77 ? 'ai' : 'human';
    const metrics: Record<scanApi.EvidenceSignal['dimension'], string[]> = {
      lexical: ['mattr', 'token_entropy', 'entropy_per_log_vocab', 'hapax_type_ratio', 'top_token_concentration'],
      phrase_template: ['repeat_ngram_coverage', 'sentence_start_repeat'],
      rhythm: ['sentence_length_median', 'sentence_length_iqr', 'sentence_length_cv', 'sentence_adjacent_change_median',
        'paragraph_length_median', 'paragraph_length_iqr', 'paragraph_length_cv', 'punctuation_per_1k', 'punctuation_entropy'],
      discourse: ['transition_per_1k', 'transition_diversity', 'paragraph_adjacent_jaccard',
        'paragraph_nonadjacent_jaccard_q90', 'intro_conclusion_jaccard', 'section_heading_count'],
    };
    const evidence: scanApi.EvidenceResult = {
      status: 'partial', artifactVersion: '1'.repeat(64), featureSchemaVersion: 1,
      route: {
        language: 'zh', domain: 'news', confidence: { language: 0, domain: 0.8125 },
        lengthBucket: 'short', fallbackLevel: 'language_length',
      },
      quality: { level: 'partial', coverage: 19 / 22, reasons: ['reference_fallback_language_length', 'reference_metrics_unavailable'] },
      signals: Object.entries(metrics).flatMap(([dimension, names]) => names.map((metric) => {
        const comparable = !['paragraph_adjacent_jaccard', 'paragraph_nonadjacent_jaccard_q90', 'intro_conclusion_jaccard'].includes(metric);
        return {
          dimension: dimension as scanApi.EvidenceSignal['dimension'], metric, observed: 0,
          humanPercentile: comparable ? 50 : null, aiPercentile: comparable ? 50 : null,
          referenceRanges: comparable ? { human: [0, 0], ai: [0, 0] } : null,
          referenceExtent: comparable ? [0, 1] as [number, number] : undefined,
          relation: comparable ? { human: 'within', ai: 'within' } : null,
          notice: null, sampleCount: comparable ? 10 : 0, offsets: [],
          reasons: comparable ? [] : ['no_valid_source_groups'],
        };
      })),
      patterns: {
        descriptive_top_tokens: [],
        repeated_phrases: [{ count: 20, offsets: [{ start: 0, end: 2 }] }], sentence_start_templates: [],
      },
    };
    Object.assign(evidence.signals[0], {
      humanPercentile: label === 'human' ? 0 : 2.5, aiPercentile: label === 'ai' ? 0 : 2.5,
      referenceRanges: { human: [label === 'human' ? 0.1 : 0, 0.5], ai: [label === 'ai' ? 0.1 : 0, 0.5] },
      relation: { human: label === 'human' ? 'below' : 'within', ai: label === 'ai' ? 'below' : 'within' },
      notice: 'reference_mismatch',
    });
    Object.assign(evidence.signals[1], {
      humanPercentile: 0, aiPercentile: 0,
      referenceRanges: { human: [0.1, 0.5], ai: [0.1, 0.5] },
      relation: { human: 'below', ai: 'below' }, notice: 'outside_both',
    });
    vi.mocked(scanApi.detectText).mockResolvedValue({
      historyId: 92, score: ai / 100, label, evidence,
      result: { summary: { ai, human: 100 - ai }, sentences: [] },
    });
    const wrapper = mountScanPage();
    await flushPromises();
    const scanStore = useScanStore();
    const submittedText = '用于验证四维面板的中文文本。'.repeat(20);
    scanStore.setText(submittedText);
    await getScanPageSetupState(wrapper).handleScan();
    await flushPromises();
    const historyId = scanStore.currentResultHistoryId;
    const savedRecord = scanStore.historyRecords[0];
    vi.mocked(historyApi.getHistoryList).mockImplementation(async (params) => makeHistoryResponse(params?.q ? [] : [savedRecord]));
    expect(wrapper.findAll('[data-testid="evidence-panel"]')).toHaveLength(1);
    const compact = wrapper.getComponent(EvidencePanel);
    expect(compact.props('detailed')).toBe(false);
    expect(compact.findAll('[data-testid="evidence-summary"]')).toHaveLength(0);
    expect(compact.get('[data-testid="evidence-empty-selection"]').text()).toContain(globalT('scan.evidence.presentation.noRecommended'));
    expect(compact.get('[data-testid="evidence-empty-selection"]').text()).toContain('暂不能为来源判断提供补充依据');
    await compact.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(compact.findAll('[data-testid="evidence-summary"]')).toHaveLength(4);
    expect(compact.find('[data-metric], [data-testid="evidence-route"], [data-testid="evidence-quality"]').exists()).toBe(false);
    await compact.get('[data-dimension="rhythm"]').trigger('click');
    await flushPromises();
    const panels = wrapper.findAllComponents(EvidencePanel);
    expect(panels).toHaveLength(2);
    for (const panel of panels) {
      expect(panel.props('evidence')).toEqual(evidence);
    }
    const detailed = panels.find((panel) => panel.props('detailed'))!;
    expect(detailed.get('[data-testid="evidence-show-all"]').attributes('aria-pressed')).toBe('true');
    expect(getScanPageSetupState(wrapper).isResultDetailOpen).toBe(true);
    expect(detailed.get('[data-dimension="rhythm"]').attributes('aria-pressed')).toBe('true');
    expect(detailed.props('submittedText')).toBe(submittedText);
    expect(detailed.get('[data-summary-metric="sentence_length_median"] [data-axis-min]').attributes('data-axis-min')).toBe('0');
    expect(detailed.get('[data-summary-metric="sentence_length_median"] [data-axis-max]').attributes('data-axis-max')).toBe('1');
    const professional = detailed.get('details[data-testid="evidence-professional"]');
    expect(professional.attributes('open')).toBeUndefined();
    expect(professional.findAll('[data-metric]')).toHaveLength(22);
    expect(professional.get('[data-value="coverage"]').text()).toBe('86.3636%');
    expect(professional.get('[data-route="fallbackLevel"]').text()).toBe(globalT('scan.evidence.route.values.fallbackLevel.language_length'));
    expect(professional.get('[data-confidence="language"]').text()).toBe('0');
    expect(professional.get('[data-confidence="domain"]').text()).toBe('0.8125');
    expect(professional.find('[data-value="sample-count"]').exists()).toBe(false);
    expect(evidence.signals.find((signal) => signal.metric === 'mattr')!.sampleCount).toBe(10);
    expect(professional.findAll('[data-testid="evidence-notice"]')).toHaveLength(2);
    await detailed.get('[data-dimension="phrase_template"]').trigger('click');
    const excerpt = detailed.get('[data-testid="evidence-examples"]').text();
    expect(excerpt).toContain('用于');
    scanStore.setText('编辑中的新草稿不应被用来提取旧检测的词语。'.repeat(20));
    await flushPromises();
    expect(detailed.props('submittedText')).toBe(submittedText);
    expect(detailed.get('[data-testid="evidence-examples"]').text()).toBe(excerpt);
    await wrapper.get('input[type="search"]').setValue('no-history-matches-this-search');
    await vi.waitFor(() => expect(scanStore.historyRecords).toHaveLength(0));
    expect(detailed.props('submittedText')).toBe(submittedText);
    expect(detailed.get('[data-testid="evidence-examples"]').text()).toBe(excerpt);
    await wrapper.get('input[type="search"]').setValue('');
    await vi.waitFor(() => expect(scanStore.historyRecords.some((record) => record.id === historyId)).toBe(true));
    expect(wrapper.get('.text-6xl').text()).toBe(`${ai}%`);
    expect(wrapper.get('.text-5xl').text()).toBe(`${ai}%`);
    expect(scanStore.result?.summary).toEqual({ ai, human: 100 - ai });
    expect(scanStore.result?.sentences[0].type).toBe(label);
    const legacyRecord = await scanStore.addHistoryRecord({
      id: 93,
      title: 'Legacy without Evidence', text: '旧记录没有证据快照。'.repeat(30), html: '', functions: ['scan'],
      analysis: { summary: { ai, human: 100 - ai }, sentences: [] },
    });
    await getScanPageSetupState(wrapper).loadHistoryRecord(legacyRecord.id);
    await flushPromises();
    expect(scanStore.result?.evidence).toBeUndefined();
    expect(wrapper.find('[data-testid="evidence-panel"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="evidence-route"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="evidence-quality"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="evidence-notice"]').exists()).toBe(false);
    expect(wrapper.get('.text-6xl').text()).toBe(`${ai}%`);
    expect(wrapper.get('.text-5xl').text()).toBe(`${ai}%`);
    await getScanPageSetupState(wrapper).loadHistoryRecord(historyId);
    await flushPromises();
    expect(wrapper.findAll('[data-testid="evidence-panel"]')).toHaveLength(2);
    expect(wrapper.findAll('[data-testid="evidence-route"]')).toHaveLength(1);
    const restoredDetails = wrapper.findAllComponents(EvidencePanel).find((panel) => panel.props('detailed'))!;
    expect(restoredDetails.get('[data-testid="evidence-show-all"]').attributes('aria-pressed')).toBe('false');
    await restoredDetails.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.findAll('[data-testid="evidence-notice"]')).toHaveLength(2);
    expect(wrapper.findAllComponents(EvidencePanel).find((panel) => panel.props('detailed'))!.props('submittedText')).toBe(submittedText);
    expect(scanStore.result?.evidence).toEqual(evidence);
    expect(scanStore.result?.evidence?.signals[0].referenceExtent).toEqual([0, 1]);
    expect(scanStore.result?.summary).toEqual({ ai, human: 100 - ai });
    expect(scanStore.result?.sentences[0].type).toBe(label);
    expect(wrapper.get('.text-6xl').text()).toBe(`${ai}%`);
    expect(wrapper.get('.text-5xl').text()).toBe(`${ai}%`);
    wrapper.unmount();
  });
});
