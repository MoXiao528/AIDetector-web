import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, disposePinia, setActivePinia } from 'pinia';
import { reactive, nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import ScanPage from './ScanPage.vue';
import EvidencePanel from '../components/EvidencePanel.vue';
import OnboardingStepsBar from '../components/dashboard/OnboardingStepsBar.vue';
import { createI18n, globalT, useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { useScanStore } from '../store/scan';
import * as authApi from '../api/modules/auth';
import * as quotaApi from '../api/modules/quota';
import * as scanApi from '../api/modules/scan';
import * as historyApi from '../api/modules/history';
import * as reportsApi from '../api/modules/reports';
import { showToast } from '../utils/toast';

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
    actorType: 'guest',
    limit: 5000,
    remaining: 5000,
    usedToday: 0,
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
  preflightText: vi.fn(),
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
  activePanel: string;
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
  isExportingReport: boolean;
  localText: string;
  quotaInfo: { actor_type: string; limit: number; used_today: number; remaining: number };
  renameHistoryDraft: string;
  renamingHistoryId: string;
  selectedHistoryIds: Array<string | number>;
  clearAllHistoryRecords: () => Promise<void>;
  closeResultDetail: () => void;
  openResultDetail: () => void;
  deleteSingleHistoryRecord: (record: { id: number }) => Promise<void>;
  deleteSelectedHistoryRecords: () => Promise<void>;
  handleScan: () => Promise<void>;
  retryLengthPreflight: () => Promise<void>;
  canStartScan: boolean;
  preflightStatus: string;
  exportReport: () => Promise<void>;
  loadHistoryRecord: (id: string | number) => Promise<void>;
  onFileChange: (event: { target: { files: File[]; value: string } }) => Promise<void>;
  setActivePanel: (panel: string) => void;
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
    vi.stubEnv('VITE_EVIDENCE_ENABLED', 'true');
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(authApi.ensureGuestToken).mockResolvedValue('guest-token');
    vi.mocked(authApi.clearGuestToken).mockReset().mockReturnValue(true);
    vi.mocked(authApi.getGuestSessionId).mockImplementation((token) => (token ? `sid:${token}` : ''));
    window.localStorage.setItem('guest_token', 'guest-token');
    vi.mocked(authApi.getStoredGuestToken).mockImplementation(() => window.localStorage.getItem('guest_token') || '');
    vi.mocked(scanApi.detectText).mockReset();
    vi.mocked(scanApi.preflightText).mockReset().mockResolvedValue({
      characterCount: 200, tokenCount: 256, minimumTokens: 256, ready: true, estimatedAdditionalCharacters: null,
    });
    vi.mocked(reportsApi.exportPdfReport).mockReset();
    vi.mocked(historyApi.getHistoryList).mockReset().mockResolvedValue(makeHistoryResponse());
    vi.mocked(historyApi.getHistoryRecord).mockReset();
    vi.mocked(quotaApi.fetchQuota).mockResolvedValue({
      actorType: 'guest',
      limit: 5000,
      remaining: 5000,
      usedToday: 0,
    });
    route.name = 'dashboard';
    route.query = { panel: 'home' };
    route.fullPath = '/dashboard?panel=home';
    window.localStorage.setItem('locale', 'en-US');
  });

  afterEach(() => {
    disposePinia(pinia);
    vi.unstubAllEnvs();
  });

  const mockGuestRenewal = (issueToken: () => Promise<string>) => {
    vi.mocked(authApi.clearGuestToken).mockImplementation((expected) => {
      if (window.localStorage.getItem('guest_token') !== expected) return false;
      window.localStorage.removeItem('guest_token');
      return true;
    });
    vi.mocked(authApi.ensureGuestToken).mockImplementation(async () => {
      const stored = window.localStorage.getItem('guest_token');
      if (stored) return stored;
      const token = await issueToken();
      window.localStorage.setItem('guest_token', token);
      return token;
    });
  };

  const rejectGuestPreflight = async (state: ScanPageSetupState) => {
    vi.mocked(scanApi.preflightText).mockRejectedValueOnce({ status: 401, code: 'GUEST_SESSION_INVALID' });
    await state.retryLengthPreflight();
    await nextTick();
    expect(state.preflightStatus).toBe('error');
  };

  it('撤销但本地未过期的游客可显式恢复一次，保留等待期间最新草稿并清理旧主体历史', async () => {
    route.query = { panel: 'document' };
    const issued = createDeferred<string>();
    const issueToken = vi.fn(() => issued.promise);
    mockGuestRenewal(issueToken);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const store = useScanStore();
      const state = getScanPageSetupState(wrapper);
      store.setEditorHtml('<p>Initial <strong>draft</strong></p>');
      store.lastUploadedFileName = 'draft.txt';
      store.historyRecords = [{ id: 'revoked-history', inputText: 'old actor record' }];
      await rejectGuestPreflight(state);
      expect(wrapper.get('.scan-readiness button').text()).toBe(globalT('scan.editor.preflightSessionRetry'));
      expect(authApi.clearGuestToken).not.toHaveBeenCalled();
      const recovery = state.retryLengthPreflight();
      await state.retryLengthPreflight();
      await nextTick();
      expect(wrapper.get('.scan-readiness button').attributes('disabled')).toBeDefined();
      expect(issueToken).toHaveBeenCalledTimes(1);
      store.setEditorHtml('<p>Newest <strong>draft 😀</strong></p>');
      const latestHtml = store.editorHtml;
      await nextTick();
      issued.resolve('fresh-guest-token');
      await recovery;
      await flushPromises();
      expect(store.inputText).toBe('Newest draft 😀');
      expect(store.editorHtml).toBe(latestHtml);
      expect(wrapper.get('.editor-surface').element.innerHTML).toBe(latestHtml);
      expect(wrapper.get('.editor-surface').text()).toBe('Newest draft 😀');
      expect(store.lastUploadedFileName).toBe('draft.txt');
      expect(store.historyRecords).toEqual([]);
      expect(state.canStartScan).toBe(true);
      expect(authApi.clearGuestToken).toHaveBeenCalledExactlyOnceWith('guest-token');
      expect(vi.mocked(scanApi.preflightText).mock.lastCall?.slice(0, 2)).toEqual(['Newest draft 😀', 'fresh-guest-token']);
      expect(window.localStorage.getItem('ai-detector-scan-draft') || '').not.toContain('Newest draft');
    } finally {
      wrapper.unmount();
    }
  });

  it('恢复后的新游客仍401时不循环新建会话，继续输入也保留显式恢复入口', async () => {
    route.query = { panel: 'document' };
    vi.useFakeTimers();
    const issueToken = vi.fn(async () => 'fresh-guest-token');
    mockGuestRenewal(issueToken);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const store = useScanStore();
      const state = getScanPageSetupState(wrapper);
      store.setText('Draft still here.');
      vi.mocked(scanApi.preflightText).mockRejectedValue({ status: 401, code: 'GUEST_SESSION_INVALID' });
      await state.retryLengthPreflight();
      await state.retryLengthPreflight();
      expect(state.preflightStatus).toBe('error');
      expect(issueToken).toHaveBeenCalledTimes(1);
      store.setText('Draft still here with another edit.');
      await vi.advanceTimersByTimeAsync(1500);
      expect(issueToken).toHaveBeenCalledTimes(1);
      expect(scanApi.preflightText).toHaveBeenCalledTimes(2);
      expect(store.inputText).toBe('Draft still here with another edit.');
      expect(wrapper.get('.scan-readiness button').text()).toBe(globalT('scan.editor.preflightSessionRetry'));
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it.each([401, 0])('恢复凭据失败%s不丢草稿，下一次显式重试可以成功', async (status) => {
    route.query = { panel: 'document' };
    const issueToken = vi.fn().mockRejectedValueOnce(Object.assign(new Error('renewal failed'), { status })).mockResolvedValueOnce('fresh-guest-token');
    mockGuestRenewal(issueToken);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const state = getScanPageSetupState(wrapper);
      const store = useScanStore();
      store.setEditorHtml('<p>Keep <em>this draft</em></p>');
      await rejectGuestPreflight(state);
      await state.retryLengthPreflight();
      expect(store.inputText).toBe('Keep this draft');
      expect(state.canStartScan).toBe(false);
      await state.retryLengthPreflight();
      expect(store.inputText).toBe('Keep this draft');
      expect(store.editorHtml).toContain('<em>this draft</em>');
      expect(state.canStartScan).toBe(true);
      expect(authApi.clearGuestToken).toHaveBeenCalledTimes(1);
      expect(issueToken).toHaveBeenCalledTimes(2);
    } finally {
      wrapper.unmount();
    }
  });

  it.each(['new token', 'new actor'])('旧预检401晚于%s时不清新凭据、不回填旧正文', async (change) => {
    route.query = { panel: 'document' };
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const store = useScanStore();
      const state = getScanPageSetupState(wrapper);
      store.setText('Old draft.');
      const pending = createDeferred<scanApi.DetectionPreflight>();
      vi.mocked(scanApi.preflightText).mockReturnValueOnce(pending.promise);
      const checking = state.retryLengthPreflight();
      await flushPromises();
      window.localStorage.setItem('guest_token', 'new-guest-token');
      if (change === 'new actor') {
        dispatchGuestTokenStorage('guest-token', 'new-guest-token');
        store.setText('New actor draft.');
      }
      pending.reject({ status: 401, code: 'GUEST_SESSION_INVALID' });
      await checking;
      await nextTick();
      expect(authApi.clearGuestToken).not.toHaveBeenCalled();
      expect(window.localStorage.getItem('guest_token')).toBe('new-guest-token');
      expect(store.inputText).toBe(change === 'new actor' ? 'New actor draft.' : 'Old draft.');
      expect(wrapper.text()).not.toContain(globalT('scan.editor.preflightSessionExpired'));
    } finally {
      wrapper.unmount();
    }
  });

  it.each(['login', 'unmount'])('恢复等待期间%s使恢复作废，不发送或恢复旧游客草稿', async (change) => {
    route.query = { panel: 'document' };
    const issued = createDeferred<string>();
    mockGuestRenewal(() => issued.promise);
    const wrapper = mountScanPage();
    let mounted = true;
    try {
      await flushPromises();
      const store = useScanStore();
      const state = getScanPageSetupState(wrapper);
      store.setText('Old guest draft.');
      await rejectGuestPreflight(state);
      const recovery = state.retryLengthPreflight();
      if (change === 'login') {
        window.localStorage.setItem('auth_session', '1');
        useAuthStore().token = '__cookie__';
        useAuthStore().user = { id: 321 };
        store.clearScanSessionData();
        store.setText('New account draft.');
      } else {
        wrapper.unmount();
        mounted = false;
      }
      const generation = store.sessionGeneration;
      issued.resolve('fresh-guest-token');
      await recovery;
      expect(store.sessionGeneration).toBe(generation);
      expect(store.inputText).toBe(change === 'login' ? 'New account draft.' : 'Old guest draft.');
      expect(scanApi.preflightText).toHaveBeenCalledTimes(1);
    } finally {
      if (mounted) wrapper.unmount();
    }
  });

  it('工作台停输500ms预检，以服务端ready启用按钮，改字/清空/导入立即作废旧结果', async () => {
    route.query = { panel: 'document' };
    vi.useFakeTimers();
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const store = useScanStore();
      const state = getScanPageSetupState(wrapper);
      const startButton = () => wrapper.findAll('button').find((button) => button.text().includes(globalT('scan.toolbar.start')))!;
      vi.mocked(scanApi.preflightText).mockResolvedValueOnce({
        characterCount: 6, tokenCount: 9, minimumTokens: 256, ready: false, estimatedAdditionalCharacters: 211,
      });
      store.setText('😀 hello');
      expect(state.canStartScan).toBe(false);
      await vi.advanceTimersByTimeAsync(499);
      expect(scanApi.preflightText).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      await nextTick();
      expect(startButton().attributes('disabled')).toBeDefined();
      expect(wrapper.get('.scan-readiness').text()).toContain(globalT('scan.editor.visibleCharacterCount', { count: 6 }));
      expect(wrapper.get('.scan-readiness').text()).toContain('211');
      expect(wrapper.get('.scan-readiness').text()).not.toMatch(/256|token/);
      expect(vi.mocked(scanApi.preflightText).mock.calls[0].slice(0, 2)).toEqual(['😀 hello', 'guest-token']);

      store.setImportedContent({ text: 'Imported document.', html: '<p>Imported document.</p>' });
      expect(state.canStartScan).toBe(false);
      await vi.advanceTimersByTimeAsync(500);
      await nextTick();
      expect(startButton().attributes('disabled')).toBeUndefined();
      expect(scanApi.detectText).not.toHaveBeenCalled();
      store.setText('');
      expect(state.canStartScan).toBe(false);
      await vi.advanceTimersByTimeAsync(500);
      expect(scanApi.preflightText).toHaveBeenCalledTimes(2);
      expect(wrapper.get('.scan-readiness').text()).toContain(globalT('scan.editor.preflightEmpty'));
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it('长度预检网络失败显示重试，成功重试后恢复检测按钮', async () => {
    route.query = { panel: 'document' };
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const state = getScanPageSetupState(wrapper);
      useScanStore().setText('A document to check.');
      vi.mocked(scanApi.preflightText).mockRejectedValueOnce(new Error('network unavailable'));
      await state.retryLengthPreflight();
      await nextTick();
      expect(state.canStartScan).toBe(false);
      expect(wrapper.get('.scan-readiness').text()).toContain(globalT('scan.editor.preflightError'));
      await wrapper.get('.scan-readiness button').trigger('click');
      await flushPromises();
      expect(state.canStartScan).toBe(true);
      expect(wrapper.find('.scan-readiness button').exists()).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it('正式检测仍以服务端长度校验为准，错误与提示区只显示补充字符估算', async () => {
    route.query = { panel: 'document' };
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const store = useScanStore();
      const state = getScanPageSetupState(wrapper);
      store.setText('A document whose server check rejects its length.');
      await state.retryLengthPreflight();
      vi.mocked(scanApi.detectText).mockRejectedValueOnce(Object.assign(new Error('At least 256 model tokens are required'), {
        status: 422, code: 'TEXT_TOO_SHORT', details: {
          code: 'TEXT_TOO_SHORT', detail: { characterCount: 40, tokenCount: 30, minimumTokens: 256, ready: false, estimatedAdditionalCharacters: 52 },
        },
      }));
      await state.handleScan();
      await nextTick();
      expect(scanApi.detectText).toHaveBeenCalledTimes(1);
      expect(state.canStartScan).toBe(false);
      const message = globalT('scan.editor.minDetectRemaining', { remaining: 52 });
      expect(store.analysisError?.message).toBe(message);
      expect(wrapper.get('.scan-readiness').text()).toContain(message);
      expect(wrapper.text()).not.toMatch(/256 model tokens/);
    } finally {
      wrapper.unmount();
    }
  });

  it.each(['history', 'detection'])('%s结果的高亮预览不显示长度提示或发预检，切回编辑重新检查并可重试', async (source) => {
    route.query = { panel: 'document' };
    const text = 'A document with a completed detection.';
    const analysis = { summary: { ai: 67, human: 33 }, sentences: [] };
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([{ id: 960, inputText: text, analysis }]));
    vi.mocked(scanApi.detectText).mockResolvedValue({ historyId: 961, result: analysis });
    vi.useFakeTimers();
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const state = getScanPageSetupState(wrapper);
      if (source === 'history') {
        await state.loadHistoryRecord(960);
      } else {
        useScanStore().setText(text);
        await state.retryLengthPreflight();
        await state.handleScan();
      }
      await flushPromises();
      const requestsBeforePreview = vi.mocked(scanApi.preflightText).mock.calls.length;
      expect(state.editorMode).toBe('preview');
      expect(state.preflightStatus).toBe('paused');
      expect(state.canStartScan).toBe(false);
      expect(wrapper.find('.scan-readiness').exists()).toBe(false);
      await vi.advanceTimersByTimeAsync(1000);
      expect(scanApi.preflightText).toHaveBeenCalledTimes(requestsBeforePreview);

      vi.mocked(scanApi.preflightText).mockRejectedValueOnce(new Error('offline'));
      await wrapper.findAll('.mode-button')[0].trigger('click');
      expect(state.canStartScan).toBe(false);
      await vi.advanceTimersByTimeAsync(499);
      expect(scanApi.preflightText).toHaveBeenCalledTimes(requestsBeforePreview);
      await vi.advanceTimersByTimeAsync(1);
      expect(wrapper.get('.scan-readiness').text()).toContain(globalT('scan.editor.preflightError'));
      await wrapper.get('.scan-readiness button').trigger('click');
      await flushPromises();
      expect(state.canStartScan).toBe(true);
      await wrapper.findAll('.mode-button')[1].trigger('click');
      expect(state.canStartScan).toBe(false);
      expect(wrapper.find('.scan-readiness').exists()).toBe(false);
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it.each([
    { source: 'history', locale: 'zh-CN' },
    { source: 'detection', locale: 'en-US' },
  ])('$source的metadata不着色/判定，$locale详情仅显示上下文，普通短段保持原判定', async ({ source, locale }) => {
    route.query = { panel: 'document' };
    const paragraphs = ['标题', '作者：张三', '好。', '“去吧。”'];
    const text = paragraphs.join('\n\n');
    const html = '<h1><strong>标题</strong></h1><p><em>作者：张三</em></p><p>好。</p><p>“去吧。”</p>';
    const types = ['metadata', 'metadata', 'ai', 'human'] as const;
    const analysis = {
      summary: { ai: 73, human: 27 },
      sentences: paragraphs.map((raw, index) => ({
        id: `meta-test-${index}`, text: raw, raw, type: types[index],
        score: index === 2 ? 90 : index === 3 ? 10 : 0,
        probability: index === 2 ? 0.9 : index === 3 ? 0.1 : 0,
        startParagraph: index + 1, endParagraph: index + 1,
      })),
    };
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([
      { id: 980, inputText: text, editorHtml: html, analysis },
    ]));
    vi.mocked(scanApi.detectText).mockResolvedValue({ historyId: 981, inputText: text, result: analysis });
    let restoreLocale = () => {};
    const wrapper = mount(ScanPage, {
      global: {
        plugins: [createI18n()],
        stubs: {
          ...pageStubs,
          AppHeader: {
            setup() {
              const i18n = useI18n();
              const previous = i18n.locale.value;
              restoreLocale = () => i18n.setLocale(previous);
              i18n.setLocale(locale);
            },
            template: '<div />',
          },
        },
      },
    });
    try {
      await flushPromises();
      const state = getScanPageSetupState(wrapper);
      const store = useScanStore();
      if (source === 'history') {
        await state.loadHistoryRecord(980);
      } else {
        store.setImportedContent({ text, html });
        await state.retryLengthPreflight();
        await state.handleScan();
      }
      await flushPromises();
      const preview = wrapper.get('.preview-surface');
      expect(preview.get('h1 strong').text()).toBe('标题');
      expect(preview.get('p em').text()).toBe('作者：张三');
      expect(preview.find('[data-sentence-id="meta-test-0"], [data-sentence-id="meta-test-1"]').exists()).toBe(false);
      expect(preview.findAll('.highlight-chip')).toHaveLength(2);
      expect(preview.get('[data-sentence-id="meta-test-2"]').classes()).toContain('bg-rose-100');
      expect(preview.get('[data-sentence-id="meta-test-3"]').classes()).toContain('bg-emerald-100');
      expect(store.result.summary).toEqual({ ai: 73, human: 27 });
      expect(store.result.aiLikelyCount).toBe(1);
      expect(wrapper.find('.scan-readiness').exists()).toBe(false);
      state.openResultDetail();
      await flushPromises();
      const metadataTextNodes = wrapper.findAll('.result-sentence-text').filter((node) => paragraphs.slice(0, 2).includes(node.text()));
      expect(metadataTextNodes).toHaveLength(4);
      for (const node of metadataTextNodes) {
        const card = node.element.parentElement!;
        expect(card.textContent).toContain(locale === 'zh-CN' ? '元信息 · 仅作上下文' : 'Metadata · Context only');
        expect(card.textContent).not.toMatch(/\d+%/);
        expect(card.className).not.toMatch(/orange|emerald|rose|amber|lime/);
        expect(node.html()).not.toMatch(/text-(?:rose|orange|amber|lime|emerald)/);
      }
    } finally {
      wrapper.unmount();
      restoreLocale();
    }
  });

  const mountExportPage = async (authenticated = true) => {
    route.query = { panel: 'document' };
    route.fullPath = '/dashboard?panel=document';
    if (authenticated) {
      const authStore = useAuthStore();
      authStore.token = '__cookie__';
      authStore.user = { id: 42, email: 'pdf@example.com' };
    }
    const wrapper = mountScanPage();
    await flushPromises();
    const scanStore = useScanStore();
    scanStore.result = { summary: { ai: 75, human: 25 }, sentences: [] };
    scanStore.resultInputText = 'The saved detection text.';
    scanStore.currentResultHistoryId = 42;
    scanStore.setText('Edited draft that has not been scanned.');
    await nextTick();
    return wrapper;
  };

  it.each([
    { evidenceEnabled: 'true', serverName: 'repreguard-42.pdf', expectedName: 'repreguard-42.pdf' },
    { evidenceEnabled: 'false', serverName: null, expectedName: 'repreguard-report.pdf' },
  ])('PDF 复用历史快照、Evidence=$evidenceEnabled，两入口防重并下载 $expectedName', async ({ evidenceEnabled, serverName, expectedName }) => {
    vi.stubEnv('VITE_EVIDENCE_ENABLED', evidenceEnabled);
    const request = createDeferred<{ blob: Blob; fileName: string | null; contentType: string }>();
    vi.mocked(reportsApi.exportPdfReport).mockReturnValueOnce(request.promise);
    const createUrl = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:report-test');
    const downloads: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });
    const wrapper = await mountExportPage();
    try {
      const state = getScanPageSetupState(wrapper);
      state.openResultDetail();
      await nextTick();
      const exportButtons = wrapper.findAll('[data-testid="result-export"], [data-testid="detail-export"]');
      expect(exportButtons).toHaveLength(2);
      expect(wrapper.get('[data-testid="incomplete-text-notice"]').text()).toContain(globalT('scan.results.exportSnapshotNotice'));
      await exportButtons[0].trigger('click');
      await state.exportReport();
      expect(reportsApi.exportPdfReport).toHaveBeenCalledExactlyOnceWith({
        reportType: 'scan', locale: expect.any(String), historyId: 42,
        includeEvidence: evidenceEnabled === 'true',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      for (const button of exportButtons) {
        expect(button.attributes('disabled')).toBeDefined();
        expect(button.attributes('aria-busy')).toBe('true');
        expect(button.text()).toBe(globalT('scan.results.exporting'));
      }
      const blob = new Blob(['pdf']);
      request.resolve({ blob, fileName: serverName, contentType: 'application/pdf' });
      await flushPromises();
      expect(createUrl).toHaveBeenCalledWith(blob);
      expect(downloads).toEqual([expectedName]);
      expect(state.isExportingReport).toBe(false);
      for (const button of exportButtons) expect(button.attributes('disabled')).toBeUndefined();
      expect(useScanStore().resultInputText).toBe('The saved detection text.');
    } finally {
      wrapper.unmount();
      createUrl.mockRestore();
      click.mockRestore();
    }
  });

  it('游客导出提示先登录并导入记录，不发送 PDF 请求', async () => {
    const wrapper = await mountExportPage(false);
    try {
      await getScanPageSetupState(wrapper).exportReport();
      expect(reportsApi.exportPdfReport).not.toHaveBeenCalled();
      expect(showToast).toHaveBeenLastCalledWith({
        title: globalT('scan.results.exportLoginTitle'),
        message: globalT('scan.results.exportLoginMessage'),
      });
    } finally {
      wrapper.unmount();
    }
  });

  it('没有有效账号记录 ID 时说明记录不可导出，不发送 PDF 请求', async () => {
    const wrapper = await mountExportPage();
    try {
      useScanStore().currentResultHistoryId = 1.5;
      await getScanPageSetupState(wrapper).exportReport();
      expect(reportsApi.exportPdfReport).not.toHaveBeenCalled();
      expect(showToast).toHaveBeenLastCalledWith({
        title: globalT('scan.results.exportErrorTitle'),
        message: globalT('scan.results.exportRecordUnavailable'),
      });
    } finally {
      wrapper.unmount();
    }
  });

  it.each([
    { status: 401, code: 'UNAUTHORIZED', key: 'exportSessionExpired' },
    { status: 404, code: 'HISTORY_NOT_FOUND', key: 'exportRecordUnavailable' },
    { status: 422, code: 'REPORT_SOURCE_INVALID', key: 'exportRecordUnavailable' },
    { status: 408, code: 'UNKNOWN_ERROR', key: 'exportTimeout' },
    { status: 0, code: 'NETWORK_ERROR', key: 'exportNetworkError' },
    { status: 500, code: 'SERVER_ERROR', key: 'exportErrorMessage' },
  ])('PDF 错误 $status 显示 $key 并允许重试', async ({ status, code, key }) => {
    vi.mocked(reportsApi.exportPdfReport).mockRejectedValueOnce({ status, code, message: 'Internal server details' });
    const wrapper = await mountExportPage();
    try {
      await getScanPageSetupState(wrapper).exportReport();
      expect(showToast).toHaveBeenLastCalledWith({
        title: globalT('scan.results.exportErrorTitle'), message: globalT(`scan.results.${key}`),
      });
      expect(getScanPageSetupState(wrapper).isExportingReport).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it('PDF 生成期间切换账号时丢弃旧账号响应', async () => {
    const request = createDeferred<{ blob: Blob; fileName: string | null; contentType: string }>();
    vi.mocked(reportsApi.exportPdfReport).mockReturnValueOnce(request.promise);
    const createUrl = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:report-test');
    const wrapper = await mountExportPage();
    try {
      const state = getScanPageSetupState(wrapper);
      const exporting = state.exportReport();
      useAuthStore().user = { id: 43, email: 'another@example.com' };
      request.resolve({ blob: new Blob(['pdf']), fileName: 'previous-account.pdf', contentType: 'application/pdf' });
      await exporting;
      expect(createUrl).not.toHaveBeenCalled();
      expect(state.isExportingReport).toBe(false);
    } finally {
      wrapper.unmount();
      createUrl.mockRestore();
    }
  });

  it.each([
    ['settings', 'profile'],
    ['qa', 'qa'],
  ])('游客可通过侧栏 %s 进入 %s 面板', async (labelKey, panel) => {
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      expect(useAuthStore().isAuthenticated).toBe(false);
      const entry = wrapper.findAll('aside button').find((button) => button.text() === globalT(`scan.nav.${labelKey}`));
      expect(entry).toBeDefined();
      await entry!.trigger('click');
      await flushPromises();
      expect(getScanPageSetupState(wrapper).activePanel).toBe(panel);
      expect(route.query.panel).toBe(panel);
    } finally {
      wrapper.unmount();
    }
  });

  it('从 home 点击 Document 后应切换到 document 面板', async () => {
    const wrapper = mountScanPage();

    await flushPromises();

    const navButtons = wrapper.findAll('.workbench-panel-navigation > button');
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

    const navButtons = wrapper.findAll('.workbench-panel-navigation > button');
    await navButtons[1].trigger('click');
    await nextTick();
    await flushPromises();

    const editor = wrapper.find('.editor-surface');
    editor.element.innerHTML = '<p>Valid text</p>';
    await editor.trigger('input');

    expect(scanStore.uploadError).toBe('');
    wrapper.unmount();
  });

  it('首页历史加载和失败不伪装为空记录，重试后显示恢复的记录', async () => {
    const pendingHistory = createDeferred<ReturnType<typeof makeHistoryResponse>>();
    vi.mocked(historyApi.getHistoryList).mockReturnValueOnce(pendingHistory.promise);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const home = wrapper.get('.dashboard-home');
      expect(home.get('[role="status"]').text()).toContain(globalT('scan.history.loading'));
      expect(home.text()).not.toContain(globalT('scan.dashboard.activity.emptyTitle'));
      const recordsLabel = home.findAll('p').find((item) => item.text() === globalT('scan.dashboard.stats.records'))!;
      expect(recordsLabel.element.nextElementSibling?.textContent).toBe('--');

      pendingHistory.reject(Object.assign(new Error('History unavailable'), { status: 503 }));
      await flushPromises();
      expect(home.get('[role="alert"]').text()).toContain(globalT('scan.history.loadFailed'));
      expect(home.find('[role="status"]').exists()).toBe(false);
      expect(home.text()).not.toContain(globalT('scan.dashboard.activity.emptyTitle'));
      expect(recordsLabel.element.nextElementSibling?.textContent).toBe('--');

      vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([
        { id: 904, title: 'Recovered homepage record', inputText: 'Recovered document' },
      ]));
      await home.get('[role="alert"] button').trigger('click');
      await flushPromises();
      expect(home.find('[role="alert"]').exists()).toBe(false);
      expect(home.text()).toContain('Recovered homepage record');
      expect(recordsLabel.element.nextElementSibling?.textContent).toBe('1 条');
    } finally {
      wrapper.unmount();
    }
  });

  it('首页额度加载和失败显示未知值及原因，不显示成已用或剩余零额度', async () => {
    const pendingQuota = createDeferred<Awaited<ReturnType<typeof quotaApi.fetchQuota>>>();
    vi.mocked(quotaApi.fetchQuota).mockReturnValueOnce(pendingQuota.promise);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const overview = wrapper.get('.home-overview');
      const quotaLabels = ['remaining', 'used'].map((key) =>
        overview.findAll('p').find((item) => item.text() === globalT(`scan.dashboard.stats.${key}`))!
      );
      expect(overview.text()).toContain(globalT('scan.results.loading'));
      quotaLabels.forEach((label) => expect(label.element.nextElementSibling?.textContent).toBe('--'));

      pendingQuota.reject(Object.assign(new Error('Quota unavailable'), { status: 503 }));
      await flushPromises();
      expect(overview.text()).toContain(globalT('scan.results.error'));
      expect(overview.text()).not.toContain(globalT('scan.results.loading'));
      quotaLabels.forEach((label) => expect(label.element.nextElementSibling?.textContent).toBe('--'));
      await overview.get('.home-quota-retry').trigger('click');
      await flushPromises();
      expect(overview.find('.home-quota-retry').exists()).toBe(false);
      expect(quotaLabels[0].element.nextElementSibling?.textContent).toBe((5000).toLocaleString());
      expect(quotaLabels[1].element.nextElementSibling?.textContent).toBe('0');
    } finally {
      wrapper.unmount();
    }
  });

  it('首页读取正式额度字段 usedToday，并在检测成功后刷新今日已用', async () => {
    vi.mocked(quotaApi.fetchQuota)
      .mockResolvedValueOnce({ actorType: 'guest', limit: 5000, remaining: 4784, usedToday: 216 })
      .mockResolvedValueOnce({ actorType: 'guest', limit: 5000, remaining: 4568, usedToday: 432 });
    vi.mocked(scanApi.detectText).mockResolvedValue({
      historyId: 905,
      result: { summary: { ai: 67, human: 33 }, sentences: [] },
    });
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const statValue = (key: string) => wrapper.get('.home-overview').findAll('p')
        .find((item) => item.text() === globalT(`scan.dashboard.stats.${key}`))!
        .element.nextElementSibling?.textContent;
      expect(statValue('remaining')).toBe((4784).toLocaleString());
      expect(statValue('used')).toBe('216');
      const state = getScanPageSetupState(wrapper);
      expect(state.quotaInfo.actor_type).toBe('guest');

      await wrapper.get('.home-primary').trigger('click');
      await flushPromises();
      useScanStore().setText('A'.repeat(216));
      await state.retryLengthPreflight();
      await state.handleScan();
      await flushPromises();
      expect(scanApi.detectText).toHaveBeenCalledTimes(1);
      expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(2);
      state.setActivePanel('home');
      await flushPromises();
      await vi.waitFor(() => expect(statValue('used')).toBe('432'));
      expect(statValue('remaining')).toBe((4568).toLocaleString());
    } finally {
      wrapper.unmount();
    }
  });

  it('首页正确显示尚未使用额度时的 usedToday 零值', async () => {
    vi.mocked(quotaApi.fetchQuota).mockResolvedValue({
      actorType: 'guest', limit: 5000, remaining: 5000, usedToday: 0,
    });
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const usedLabel = wrapper.get('.home-overview').findAll('p')
        .find((item) => item.text() === globalT('scan.dashboard.stats.used'))!;
      expect(usedLabel.element.nextElementSibling?.textContent).toBe('0');
      expect(getScanPageSetupState(wrapper).quotaInfo.used_today).toBe(0);
    } finally {
      wrapper.unmount();
    }
  });

  it('首页额度更新经过中间值，快速更新以最后响应为准，失败后恢复不沿用旧动画', async () => {
    vi.mocked(quotaApi.fetchQuota).mockResolvedValue({
      actorType: 'guest', limit: 5000, remaining: 4784, usedToday: 216,
    });
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const state = getScanPageSetupState(wrapper);
      const values = () => wrapper.findAll('.home-overview .grid > div > p:nth-child(2)')
        .slice(0, 2).map((node) => Number(node.text().replace(/,/g, '')));
      expect(values()).toEqual([4784, 216]);
      vi.useFakeTimers({ toFake: ['Date', 'requestAnimationFrame', 'cancelAnimationFrame'] });
      state.quotaInfo = { actor_type: 'guest', limit: 5000, remaining: 4524, used_today: 476 };
      await nextTick();
      await vi.advanceTimersByTimeAsync(100);
      expect(values()[1]).toBeGreaterThan(216);
      expect(values()[1]).toBeLessThan(476);
      state.quotaInfo = { actor_type: 'guest', limit: 5000, remaining: 4300, used_today: 700 };
      await nextTick();
      await vi.advanceTimersByTimeAsync(400);
      expect(values()).toEqual([4300, 700]);
      state.isQuotaReady = false;
      await nextTick();
      state.quotaInfo = { actor_type: 'guest', limit: 5000, remaining: 4200, used_today: 800 };
      state.isQuotaReady = true;
      await nextTick();
      expect(values()).toEqual([4200, 800]);
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it('减少动态效果时首页额度直接显示新值', async () => {
    const matchMedia = window.matchMedia.bind(window);
    const mediaSpy = vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
      const media = matchMedia(query);
      if (query === '(prefers-reduced-motion: reduce)') {
        Object.defineProperty(media, 'matches', { value: true });
      }
      return media;
    });
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      getScanPageSetupState(wrapper).quotaInfo = { actor_type: 'guest', limit: 5000, remaining: 4784, used_today: 216 };
      await nextTick();
      const values = wrapper.findAll('.home-overview .grid > div > p:nth-child(2)').slice(0, 2).map((node) => node.text());
      expect(values).toEqual([(4784).toLocaleString(), '216']);
    } finally {
      wrapper.unmount();
      mediaSpy.mockRestore();
    }
  });

  it('首页切换语言同步更新引用和引导文案，保留已完成步骤', async () => {
    const authStore = useAuthStore();
    authStore.token = '__cookie__';
    authStore.user = { id: 12, email: 'onboarding@example.com' };
    let restoreLocale = () => {};
    const wrapper = mount(ScanPage, {
      global: {
        plugins: [createI18n()],
        stubs: {
          ...pageStubs,
          OnboardingStepsBar: false,
          AppHeader: {
            setup() {
              const i18n = useI18n();
              const previousLocale = i18n.locale.value;
              restoreLocale = () => i18n.setLocale(previousLocale);
              i18n.setLocale('zh-CN');
              return i18n;
            },
            template: '<button data-testid="switch-english" @click="setLocale(\'en-US\')">English</button>',
          },
        },
      },
    });
    const readFile = vi.spyOn(useScanStore(), 'readFile').mockResolvedValue(true);
    try {
      await flushPromises();
      const initialQuote = wrapper.get('.dashboard-home header p').text();
      expect(globalT('scan.quotes')).toContain(initialQuote);
      expect(wrapper.getComponent(OnboardingStepsBar).text()).toContain(globalT('scan.onboarding.upload.label'));

      await getScanPageSetupState(wrapper).onFileChange({
        target: { files: [new File(['Text'], 'draft.txt', { type: 'text/plain' })], value: 'draft.txt' },
      });
      await wrapper.get('[data-testid="switch-english"]').trigger('click');
      await flushPromises();

      const translatedQuote = wrapper.get('.dashboard-home header p').text();
      expect(translatedQuote).not.toBe(initialQuote);
      expect(globalT('scan.quotes')).toContain(translatedQuote);
      const guide = wrapper.getComponent(OnboardingStepsBar);
      for (const key of ['upload', 'scan', 'review', 'export']) {
        expect(guide.text()).toContain(globalT(`scan.onboarding.${key}.label`));
        expect(guide.text()).toContain(globalT(`scan.onboarding.${key}.description`));
      }
      expect(guide.props('steps').map((step: { status: string }) => step.status)).toEqual([
        'done', 'current', 'upcoming', 'upcoming',
      ]);
    } finally {
      readFile.mockRestore();
      wrapper.unmount();
      restoreLocale();
    }
  });

  it('模式按钮的选中状态对应正文展示，仅实际编辑才清除结果', async () => {
    route.query = { panel: 'document' };
    const text = 'A document with a saved detection result.';
    const analysis = { summary: { ai: 67, human: 33 }, sentences: [] };
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([
      { id: 960, inputText: text, analysis },
    ]));
    const wrapper = mountScanPage();
    document.body.appendChild(wrapper.element);
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const [edit, preview] = wrapper.findAll('.mode-button');
      const editorSurface = wrapper.get('.editor-surface');
      const previewSurface = wrapper.get('.preview-surface');

      expect(preview.attributes('disabled')).toBeDefined();
      expect(wrapper.find('.scan-readiness').exists()).toBe(true);
      expect(wrapper.find('[data-testid="result-export"]').exists()).toBe(false);
      await preview.trigger('click');
      expect(edit.attributes('aria-pressed')).toBe('true');
      expect(preview.attributes('aria-pressed')).toBe('false');
      expect(editorSurface.isVisible()).toBe(true);
      expect(previewSurface.isVisible()).toBe(false);

      await getScanPageSetupState(wrapper).loadHistoryRecord(960);
      await getScanPageSetupState(wrapper).retryLengthPreflight();
      await flushPromises();
      expect(preview.attributes('disabled')).toBeUndefined();
      expect(preview.attributes('aria-pressed')).toBe('true');
      expect(edit.attributes('aria-pressed')).toBe('false');
      expect(previewSurface.isVisible()).toBe(true);
      expect(editorSurface.isVisible()).toBe(false);
      expect(previewSurface.text()).toContain(text);
      expect(wrapper.find('.scan-readiness').exists()).toBe(false);
      expect(wrapper.find('[data-testid="result-export"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="result-segments"]').exists()).toBe(true);

      await edit.trigger('click');
      expect(edit.attributes('aria-pressed')).toBe('true');
      expect(preview.attributes('aria-pressed')).toBe('false');
      expect(editorSurface.isVisible()).toBe(true);
      expect(previewSurface.isVisible()).toBe(false);
      expect(scanStore.result?.summary).toEqual(analysis.summary);

      await preview.trigger('click');
      expect(preview.attributes('aria-pressed')).toBe('true');
      expect(edit.attributes('aria-pressed')).toBe('false');
      expect(previewSurface.isVisible()).toBe(true);
      expect(editorSurface.isVisible()).toBe(false);

      await edit.trigger('click');
      editorSurface.element.innerHTML = '<p>Changed document</p>';
      await editorSurface.trigger('input');
      expect(scanStore.result).toBeNull();
      expect(wrapper.find('.scan-readiness').exists()).toBe(true);
      expect(wrapper.find('[data-testid="result-export"]').exists()).toBe(false);
      expect(preview.attributes('disabled')).toBeDefined();
      expect(edit.attributes('aria-pressed')).toBe('true');
    } finally {
      wrapper.unmount();
    }
  });

  it.each(['preview', 'edit'])('历史正文在 %s 模式往返首页后，首次切编辑仍完整', async (initialMode) => {
    route.query = { panel: 'document' };
    const text = '第一段有加粗文本。\n第二段保持完整。';
    const editorHtml = '<p>第一段有<strong>加粗</strong>文本。</p><p>第二段保持完整。</p>';
    const analysis = { summary: { ai: 67, human: 33 }, sentences: [] };
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([
      { id: 961, inputText: text, editorHtml, analysis },
    ]));
    const wrapper = mountScanPage();
    document.body.appendChild(wrapper.element);
    try {
      await flushPromises();
      const state = getScanPageSetupState(wrapper);
      const scanStore = useScanStore();
      await state.loadHistoryRecord(961);
      await flushPromises();
      if (initialMode === 'edit') await wrapper.findAll('.mode-button')[0].trigger('click');
      const originalEditor = wrapper.get('.editor-surface').element;
      const originalResult = JSON.stringify(scanStore.result);
      const savedHtml = scanStore.editorHtml;

      state.setActivePanel('home');
      await flushPromises();
      expect(wrapper.find('.editor-surface').exists()).toBe(false);
      state.setActivePanel('document');
      await flushPromises();
      expect(wrapper.get('.editor-surface').element).not.toBe(originalEditor);
      expect(state.editorMode).toBe(initialMode);
      expect(scanStore.editorHtml).toBe(savedHtml);
      expect(wrapper.get('.preview-surface').text()).toContain('第二段保持完整。');

      await wrapper.findAll('.mode-button')[0].trigger('click');
      const editor = wrapper.get('.editor-surface');
      expect(editor.isVisible()).toBe(true);
      expect(editor.element.innerHTML).toBe(savedHtml);
      expect(editor.get('strong').text()).toBe('加粗');
      expect(JSON.stringify(scanStore.result)).toBe(originalResult);
      expect(String(state.activeHistoryId)).toBe('961');
      expect(scanApi.detectText).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
  });

  it('未检测草稿在首页往返后恢复，隐藏期间更新则显示最新正文', async () => {
    route.query = { panel: 'document' };
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const state = getScanPageSetupState(wrapper);
      const scanStore = useScanStore();
      const editor = wrapper.get('.editor-surface');
      editor.element.innerHTML = '<p>未检测的<strong>草稿</strong>。</p>';
      await editor.trigger('input');
      for (const updateWhileHidden of [false, true]) {
        state.setActivePanel('home');
        await flushPromises();
        if (updateWhileHidden) scanStore.setText('隐藏期间更新的最新正文。');
        const expectedHtml = scanStore.editorHtml;
        state.setActivePanel('document');
        await flushPromises();
        expect(state.editorMode).toBe('edit');
        expect(wrapper.get('.editor-surface').element.innerHTML).toBe(expectedHtml);
        expect(scanStore.result).toBeNull();
      }
      expect(scanApi.detectText).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
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

  it.each([911, 912])('批量删除部分失败 %s 时，仅在当前记录真正删除后清空编辑器', async (failedId) => {
    route.query = { panel: 'document' };
    const analysis = {
      summary: { ai: 64, human: 36 }, sentences: [], translation: '', polish: '',
      citations: [], ai_likely_count: 0, highlighted_html: '',
    };
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([
      { id: 911, inputText: 'Active record text', analysis },
      { id: 912, inputText: 'Other record text', analysis },
    ]));
    vi.mocked(historyApi.batchDeleteHistoryRecords).mockResolvedValue({ deleted_count: 1, failed_ids: [failedId] });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      await state.loadHistoryRecord(911);
      state.selectedHistoryIds = [911, 912];

      await state.deleteSelectedHistoryRecords();

      expect(scanStore.historyRecords.map((record) => record.id)).toEqual([failedId]);
      expect(state.selectedHistoryIds).toEqual([failedId]);
      if (failedId === 911) {
        expect(String(state.activeHistoryId)).toBe('911');
        expect(scanStore.inputText).toBe('Active record text');
        expect(scanStore.result?.summary).toEqual(analysis.summary);
      } else {
        expect(state.activeHistoryId).toBe('');
        expect(scanStore.inputText).toBe('');
        expect(scanStore.result).toBeNull();
      }
    } finally {
      confirmSpy.mockRestore();
      wrapper.unmount();
    }
  });

  it('单条删除等待期间切到其他历史，旧删除不能清空新选择', async () => {
    route.query = { panel: 'document' };
    const analysis = {
      summary: { ai: 64, human: 36 }, sentences: [], translation: '', polish: '',
      citations: [], ai_likely_count: 0, highlighted_html: '',
    };
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([
      { id: 913, inputText: 'Old active text', analysis },
      { id: 914, inputText: 'New active text', analysis },
    ]));
    const deferred = createDeferred<void>();
    vi.mocked(historyApi.deleteHistoryRecord).mockReturnValueOnce(deferred.promise);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      await state.loadHistoryRecord(913);
      const deleting = state.deleteSingleHistoryRecord({ id: 913 });
      await state.loadHistoryRecord(914);
      deferred.resolve();
      await deleting;

      expect(String(state.activeHistoryId)).toBe('914');
      expect(scanStore.inputText).toBe('New active text');
      expect(scanStore.result?.summary).toEqual(analysis.summary);
    } finally {
      confirmSpy.mockRestore();
      wrapper.unmount();
    }
  });

  it('清空历史等待期间输入新正文，旧清空不能清掉新草稿', async () => {
    route.query = { panel: 'document' };
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([
      { id: 915, inputText: 'Old text', analysis: null },
    ]));
    const deferred = createDeferred<historyApi.ClearAllResponse>();
    vi.mocked(historyApi.clearAllHistory).mockReturnValueOnce(deferred.promise);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      const clearing = state.clearAllHistoryRecords();
      const editor = wrapper.find('.editor-surface');
      editor.element.innerHTML = '<p>New draft text</p>';
      await editor.trigger('input');
      deferred.resolve({ deleted_count: 1 });
      await clearing;

      expect(scanStore.inputText).toBe('New draft text');
      expect(scanStore.editorHtml).toBe('<p>New draft text</p>');
      expect(scanStore.historyRecords).toEqual([]);
    } finally {
      confirmSpy.mockRestore();
      wrapper.unmount();
    }
  });

  it('清空历史等待期间打开另一条旧记录，完成后清掉已删除记录的正文和结果', async () => {
    route.query = { panel: 'document' };
    const analysis = {
      summary: { ai: 64, human: 36 }, sentences: [], translation: '', polish: '',
      citations: [], ai_likely_count: 0, highlighted_html: '',
    };
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([
      { id: 921, inputText: 'First old text', analysis },
      { id: 922, inputText: 'Second old text', analysis },
    ]));
    const deferred = createDeferred<historyApi.ClearAllResponse>();
    vi.mocked(historyApi.clearAllHistory).mockReturnValueOnce(deferred.promise);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      await state.loadHistoryRecord(921);
      const clearing = state.clearAllHistoryRecords();
      await state.loadHistoryRecord(922);
      expect(scanStore.inputText).toBe('Second old text');
      deferred.resolve({ deleted_count: 2 });
      await clearing;

      expect(scanStore.historyRecords).toEqual([]);
      expect(state.activeHistoryId).toBe('');
      expect(scanStore.inputText).toBe('');
      expect(scanStore.result).toBeNull();
      expect(wrapper.find('.editor-surface').element.innerHTML).toBe('');
    } finally {
      confirmSpy.mockRestore();
      wrapper.unmount();
    }
  });

  it('清空历史等待期间启动新检测，旧清空不能清掉新结果', async () => {
    route.query = { panel: 'document' };
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([
      { id: 919, inputText: 'Old text', analysis: null },
    ]));
    vi.mocked(scanApi.detectText).mockResolvedValue({
      historyId: 920,
      result: { summary: { ai: 71, human: 29 }, sentences: [] },
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      const newText = 'New detection text. '.repeat(12);
      scanStore.setText(newText);
      const deferred = createDeferred<{ deletedCount: number }>();
      vi.spyOn(scanStore, 'clearAllHistoryRecords').mockReturnValueOnce(deferred.promise);
      const clearing = state.clearAllHistoryRecords();
      await state.retryLengthPreflight();
      await state.handleScan();
      deferred.resolve({ deletedCount: 1 });
      await clearing;

      expect(scanApi.detectText).toHaveBeenCalledTimes(1);
      expect(scanStore.inputText).toBe(newText.trim());
      expect(scanStore.result?.summary).toEqual({ ai: 71, human: 29 });
    } finally {
      confirmSpy.mockRestore();
      wrapper.unmount();
    }
  });

  it('快速打开两条游客历史时，较慢的旧详情不能覆盖最后选择', async () => {
    route.query = { panel: 'document' };
    const list = makeHistoryResponse([
      { id: 906, inputText: 'First history text', analysis: null },
      { id: 907, inputText: 'Second history text', analysis: null },
    ]);
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(list);
    const first = createDeferred<historyApi.HistoryRecord>();
    const second = createDeferred<historyApi.HistoryRecord>();
    vi.mocked(historyApi.getHistoryRecord)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      const firstLoad = state.loadHistoryRecord(906);
      const secondLoad = state.loadHistoryRecord(907);
      expect(historyApi.getHistoryRecord).toHaveBeenCalledTimes(2);

      second.resolve({
        ...list.items[1],
        analysis: {
          summary: { ai: 66, human: 34 }, sentences: [], translation: '', polish: '',
          citations: [], ai_likely_count: 0, highlighted_html: '',
        },
      });
      await secondLoad;
      first.resolve({
        ...list.items[0],
        analysis: {
          summary: { ai: 22, human: 78 }, sentences: [], translation: '', polish: '',
          citations: [], ai_likely_count: 0, highlighted_html: '',
        },
      });
      await firstLoad;

      expect(String(state.activeHistoryId)).toBe('907');
      expect(scanStore.inputText).toBe('Second history text');
      expect(scanStore.result?.summary).toEqual({ ai: 66, human: 34 });
      expect(state.editorMode).toBe('preview');
      expect(wrapper.find('.editor-surface').element.innerHTML).toContain('Second history text');
    } finally {
      wrapper.unmount();
    }
  });

  it('修改历史搜索词后，旧详情不能覆盖当前正文', async () => {
    route.query = { panel: 'document' };
    const list = makeHistoryResponse([{ id: 916, inputText: 'Old matching text', analysis: null }]);
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(list);
    const deferred = createDeferred<historyApi.HistoryRecord>();
    vi.mocked(historyApi.getHistoryRecord).mockReturnValueOnce(deferred.promise);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      const loading = state.loadHistoryRecord(916);
      state.historySearchQuery = 'other';
      await nextTick();
      deferred.resolve({ ...list.items[0], analysis: null });
      await loading;

      expect(scanStore.inputText).toBe('');
      expect(scanStore.result).toBeNull();
      expect(state.activeHistoryId).toBe('');
    } finally {
      wrapper.unmount();
    }
  });

  it('目标 URL 详情读取失败时，不把之前的检测结果错当成目标结果弹出', async () => {
    route.query = { panel: 'document' };
    const analysis = {
      summary: { ai: 64, human: 36 }, sentences: [], translation: '', polish: '',
      citations: [], ai_likely_count: 0, highlighted_html: '',
    };
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([
      { id: 917, inputText: 'Existing result text', analysis },
    ]));
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      await state.loadHistoryRecord(917);
      vi.spyOn(scanStore, 'fetchHistoryRecordDetail').mockResolvedValueOnce(null);
      route.query = { panel: 'document', detail: '918' };
      await flushPromises();

      expect(scanStore.result?.summary).toEqual(analysis.summary);
      expect(state.isResultDetailOpen).toBe(false);
      expect(scanStore.inputText).toBe('Existing result text');
    } finally {
      wrapper.unmount();
    }
  });

  it.each(['close', 'browser-back'])('%s 清除 URL 详情后，未完成的历史读取不能恢复正文或重开弹层', async (action) => {
    route.query = { panel: 'document', detail: '908' };
    const deferred = createDeferred<historyApi.HistoryRecord>();
    vi.mocked(historyApi.getHistoryRecord).mockReturnValueOnce(deferred.promise);
    const wrapper = mountScanPage();
    try {
      await vi.waitFor(() => expect(historyApi.getHistoryRecord).toHaveBeenCalledWith('908', 'guest-token'));
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      if (action === 'close') state.closeResultDetail();
      else route.query = { panel: 'document' };
      deferred.resolve({
        ...makeHistoryResponse([{ id: 908, inputText: 'Closed detail text' }]).items[0],
        analysis: {
          summary: { ai: 77, human: 23 }, sentences: [], translation: '', polish: '',
          citations: [], ai_likely_count: 0, highlighted_html: '',
        },
      });
      await flushPromises();

      expect(route.query.detail).toBeUndefined();
      expect(state.isResultDetailOpen).toBe(false);
      expect(scanStore.inputText).toBe('');
      expect(scanStore.result).toBeNull();
    } finally {
      wrapper.unmount();
    }
  });

  it('离开文档页后，未完成的历史读取不能重新切回文档页', async () => {
    route.query = { panel: 'document' };
    const list = makeHistoryResponse([{ id: 909, inputText: 'Old history text', analysis: null }]);
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(list);
    const deferred = createDeferred<historyApi.HistoryRecord>();
    vi.mocked(historyApi.getHistoryRecord).mockReturnValueOnce(deferred.promise);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      const loading = state.loadHistoryRecord(909);
      state.setActivePanel('profile');
      deferred.resolve({ ...list.items[0], analysis: null });
      await loading;

      expect(state.activePanel).toBe('profile');
      expect(scanStore.inputText).toBe('');
      expect(scanStore.result).toBeNull();
    } finally {
      wrapper.unmount();
    }
  });

  it('浏览器返回首页后，未完成的历史读取不能重新切回文档页', async () => {
    route.query = { panel: 'document' };
    const list = makeHistoryResponse([{ id: 910, inputText: 'Old history text', analysis: null }]);
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(list);
    const deferred = createDeferred<historyApi.HistoryRecord>();
    vi.mocked(historyApi.getHistoryRecord).mockReturnValueOnce(deferred.promise);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const state = getScanPageSetupState(wrapper);
      const loading = state.loadHistoryRecord(910);
      route.query = { panel: 'home' };
      deferred.resolve({ ...list.items[0], analysis: null });
      await loading;

      expect(state.activePanel).toBe('home');
      expect(scanStore.inputText).toBe('');
      expect(scanStore.result).toBeNull();
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

  it('旧记录正文用单换行保存、编辑器用双段落保存时不误报覆盖不全', async () => {
    route.query = { panel: 'document' };
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const text = '第一段正文\n第二段正文';
      const html = '<p>第一段正文</p><p>第二段正文</p>';
      const record = await scanStore.addHistoryRecord({
        id: 453,
        title: '旧版分段记录', text, html, functions: ['scan'],
        analysis: { summary: { ai: 20, human: 80 }, sentences: [] },
      });

      await getScanPageSetupState(wrapper).loadHistoryRecord(record.id);
      await flushPromises();
      expect(scanStore.resultInputText).toBe(text);
      expect(scanStore.resultInputHtml).toBe(html);
      expect(wrapper.find('[data-testid="incomplete-text-notice"]').exists()).toBe(false);
      getScanPageSetupState(wrapper).isResultDetailOpen = true;
      await nextTick();
      expect(wrapper.findAll('[data-testid="incomplete-text-notice"]')).toHaveLength(0);
    } finally {
      wrapper.unmount();
    }
  });

  it('旧记录正文少了词间分隔时仍提示正文不一致', async () => {
    route.query = { panel: 'document' };
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const scanStore = useScanStore();
      const record = await scanStore.addHistoryRecord({
        id: 454,
        title: '旧版正文差异', text: 'foobar', html: '<p>foo bar</p>', functions: ['scan'],
        analysis: { summary: { ai: 20, human: 80 }, sentences: [] },
      });

      await getScanPageSetupState(wrapper).loadHistoryRecord(record.id);
      await flushPromises();
      expect(wrapper.find('[data-testid="incomplete-text-notice"]').exists()).toBe(true);
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
      state.editorMode = 'edit';
      await state.retryLengthPreflight();
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
      await state.retryLengthPreflight();
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
        actorType: 'guest',
        limit: 5000,
        remaining: 5000,
        usedToday: 0,
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
    const oldQuota = createDeferred<{ actorType: string; limit: number; remaining: number; usedToday: number }>();
    vi.mocked(quotaApi.fetchQuota)
      .mockReturnValueOnce(oldQuota.promise)
      .mockResolvedValueOnce({ actorType: 'guest', limit: 5000, remaining: 4321, usedToday: 679 });
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

  it('长度预检前若 guest SID 已切换，会清空旧正文且不发送给新主体', async () => {
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
    await getScanPageSetupState(wrapper).retryLengthPreflight();
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
    await state.retryLengthPreflight();
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
      await state.retryLengthPreflight();
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
    const deferred = createDeferred<{ actorType: string; limit: number; remaining: number; usedToday: number }>();
    vi.mocked(quotaApi.fetchQuota).mockReturnValue(deferred.promise);

    const wrapper = mountScanPage();
    await vi.waitFor(() => expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(1));
    const scanStore = useScanStore();
    const authStore = useAuthStore();
    const state = getScanPageSetupState(wrapper);
    scanStore.activateGuestSession('sid-b');
    deferred.resolve({ actorType: 'guest', limit: 5000, remaining: 1234, usedToday: 3766 });
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
    const guestRequest = createDeferred<{ actorType: string; limit: number; remaining: number; usedToday: number }>();
    const userRequest = createDeferred<{ actorType: string; limit: number; remaining: number; usedToday: number }>();
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
    guestRequest.resolve({ actorType: 'guest', limit: 5000, remaining: 1234, usedToday: 3766 });
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
    const userRequest = createDeferred<{ actorType: string; limit: number; remaining: number; usedToday: number }>();
    const guestRequest = createDeferred<{ actorType: string; limit: number; remaining: number; usedToday: number }>();
    vi.mocked(quotaApi.fetchQuota)
      .mockReturnValueOnce(userRequest.promise)
      .mockReturnValueOnce(guestRequest.promise);
    const wrapper = mountScanPage();
    await vi.waitFor(() => expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(1));
    const state = getScanPageSetupState(wrapper);

    // Match clearSessionState: clear persistent session before reactive token invalidation.
    window.localStorage.removeItem('auth_session');
    authStore.token = '';
    authStore.user = null;
    await vi.waitFor(() => expect(quotaApi.fetchQuota).toHaveBeenCalledTimes(2));
    userRequest.resolve({ actorType: 'user', limit: 10000, remaining: 4321, usedToday: 5679 });
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
    await state.retryLengthPreflight();
    await state.handleScan();
    await flushPromises();

    expect(scanApi.detectText).toHaveBeenCalledTimes(1);
    expect(vi.mocked(scanApi.detectText).mock.calls[0][1]).toBe('guest-a-token');
    wrapper.unmount();
  });

  it('关闭 Evidence 时新检测和旧历史均隐藏相关入口，主结果、普通详情和 PDF 入口保留', async () => {
    vi.stubEnv('VITE_EVIDENCE_ENABLED', 'false');
    route.query = { panel: 'document' };
    route.fullPath = '/dashboard?panel=document';
    const text = 'The main detection paragraph remains available while Evidence is paused. '.repeat(4).trim();
    const oldText = 'Cached history still retains its original paragraph. '.repeat(4).trim();
    const evidence: scanApi.EvidenceResult = {
      status: 'unsupported', artifactVersion: null, featureSchemaVersion: 1, route: null,
      quality: { level: 'unavailable', coverage: 0, reasons: ['unsupported_language'] },
      signals: [], patterns: null,
    };
    const analysis = (ai: number, paragraph: string) => ({
      summary: { ai, human: 100 - ai },
      sentences: [{ id: `main-${ai}`, text: paragraph, raw: paragraph, startParagraph: 1, endParagraph: 1,
        type: ai > 50 ? 'ai' : 'human', probability: ai / 100, score: ai }],
    });
    vi.mocked(historyApi.getHistoryList).mockResolvedValue(makeHistoryResponse([
      { id: 93, inputText: oldText, evidence, analysis: analysis(23, oldText) },
    ]));
    vi.mocked(scanApi.detectText).mockResolvedValue({
      historyId: 94, inputText: text, score: 0.77, label: 'ai', evidence, result: analysis(77, text),
    } as scanApi.DetectionResponse);
    const wrapper = mountScanPage();
    try {
      await flushPromises();
      const state = getScanPageSetupState(wrapper);
      const scanStore = useScanStore();
      scanStore.setText(text);
      await state.retryLengthPreflight();
      await state.handleScan();
      await flushPromises();
      expect(scanStore.result?.evidence).toEqual(evidence);
      expect(wrapper.get('.text-6xl').text()).toBe('77%');
      expect(wrapper.get('.preview-surface').text()).toContain(text);
      expect(scanStore.result?.sentences[0].type).toBe('ai');
      expect(wrapper.find('[data-testid="evidence-panel"]').exists()).toBe(false);
      const detailsButton = wrapper.findAll('button').find((button) => button.text() === globalT('scan.results.openDetail'));
      expect(detailsButton).toBeDefined();
      await detailsButton!.trigger('click');
      expect(wrapper.get('.text-5xl').text()).toBe('77%');
      expect(wrapper.findAll('button').filter((button) => button.text().includes(globalT('scan.results.export')))).toHaveLength(2);
      expect(wrapper.find('[data-testid="evidence-panel"]').exists()).toBe(false);
      await state.loadHistoryRecord(93);
      await flushPromises();
      expect(scanStore.result?.evidence).toEqual(evidence);
      expect(wrapper.get('.text-6xl').text()).toBe('23%');
      expect(wrapper.get('.text-5xl').text()).toBe('23%');
      expect(wrapper.get('.preview-surface').text()).toContain(oldText);
      expect(scanStore.result?.sentences[0].type).toBe('human');
      expect(wrapper.find('[data-testid="evidence-panel"], [data-testid="evidence-summary"], [data-testid="evidence-professional"]').exists()).toBe(false);
      expect(wrapper.text()).not.toContain(globalT('scan.evidence.presentation.title'));
    } finally {
      wrapper.unmount();
    }
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

    await state.retryLengthPreflight();
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

    state.editorMode = 'edit';
    await state.retryLengthPreflight();
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

  it.each([23, 77])('侧栏摘要导航到精简详情，原始快照随历史回放且主结果 AI=%i 不受提示影响', async (ai) => {
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
    await getScanPageSetupState(wrapper).retryLengthPreflight();
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
    getScanPageSetupState(wrapper).openResultDetail();
    await flushPromises();
    const generalDetails = wrapper.findAllComponents(EvidencePanel).find((panel) => panel.props('detailed'))!;
    expect(generalDetails.props('initialShowAll')).toBe(true);
    expect(generalDetails.findAll('[data-testid="evidence-dimension"]')).toHaveLength(4);
    expect(generalDetails.get('[data-testid="evidence-professional"]').attributes('open')).toBeUndefined();
    getScanPageSetupState(wrapper).closeResultDetail();
    await flushPromises();
    await compact.get('[data-dimension="rhythm"]').trigger('click');
    await flushPromises();
    const panels = wrapper.findAllComponents(EvidencePanel);
    expect(panels).toHaveLength(2);
    for (const panel of panels) {
      expect(panel.props('evidence')).toEqual(evidence);
    }
    const detailed = panels.find((panel) => panel.props('detailed'))!;
    expect(detailed.props('initialShowAll')).toBe(true);
    expect(detailed.get('[data-testid="evidence-show-all"]').attributes('aria-pressed')).toBe('true');
    expect(getScanPageSetupState(wrapper).isResultDetailOpen).toBe(true);
    const detailHeader = wrapper.get('section.h-full > header');
    expect(detailHeader.text()).toContain(`字符数：${submittedText.length}/${scanStore.characterLimit}`);
    expect(detailHeader.text()).not.toContain('已选：');
    expect(wrapper.findAll('section.h-full > div > aside button')).toHaveLength(0);
    expect(detailed.get('[data-dimension="rhythm"]').attributes('aria-pressed')).toBe('true');
    expect(detailed.props('submittedText')).toBe(submittedText);
    expect(detailed.get('[data-summary-metric="sentence_length_median"] [data-testid="observed-marker"]').attributes('style')).toContain('left: 0%');
    expect(detailed.find('[data-testid="reference-ticks"]').exists()).toBe(false);
    const professional = detailed.get('details[data-testid="evidence-professional"]');
    expect(professional.attributes('open')).toBeUndefined();
    expect(professional.findAll('[data-metric]')).toHaveLength(22);
    expect(professional.find('[data-value="coverage"], [data-confidence]').exists()).toBe(false);
    expect(professional.get('[data-testid="reference-group"]').text()).toContain(globalT('scan.evidence.route.values.fallbackLevel.language_length'));
    expect(scanStore.result?.evidence?.quality).toEqual(evidence.quality);
    expect(scanStore.result?.evidence?.route).toEqual(evidence.route);
    expect(professional.find('[data-value="sample-count"]').exists()).toBe(false);
    expect(evidence.signals.find((signal) => signal.metric === 'mattr')!.sampleCount).toBe(10);
    expect(professional.findAll('[data-testid="evidence-notice"]')).toHaveLength(2);
    await detailed.get('[data-testid="evidence-show-recommended"]').trigger('click');
    await flushPromises();
    expect(compact.get('[data-testid="evidence-show-all"]').attributes('aria-pressed')).toBe('false');
    expect(compact.findAll('[data-testid="evidence-summary"]')).toHaveLength(0);
    expect(detailed.findAll('[data-testid="evidence-dimension"]')).toHaveLength(0);
    (professional.element as HTMLDetailsElement).open = true;
    await professional.trigger('toggle');
    expect(detailed.findAll('[data-testid="evidence-dimension"]')).toHaveLength(0);
    expect(detailed.get('[data-testid="evidence-show-all"]').attributes('aria-pressed')).toBe('false');
    (professional.element as HTMLDetailsElement).open = false;
    await professional.trigger('toggle');
    await detailed.get('[data-testid="evidence-show-all"]').trigger('click');
    await flushPromises();
    expect(compact.get('[data-testid="evidence-show-all"]').attributes('aria-pressed')).toBe('true');
    expect(compact.findAll('[data-testid="evidence-summary"]')).toHaveLength(4);
    expect(professional.attributes('open')).toBeUndefined();
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
    expect(wrapper.find('[data-testid="evidence-route"]').exists()).toBe(false);
    const restoredDetails = wrapper.findAllComponents(EvidencePanel).find((panel) => panel.props('detailed'))!;
    expect(restoredDetails.get('[data-testid="evidence-show-all"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.findAllComponents(EvidencePanel).find((panel) => !panel.props('detailed'))!.get('[data-testid="evidence-show-all"]').attributes('aria-pressed')).toBe('false');
    expect(restoredDetails.get('details[data-testid="evidence-professional"]').attributes('open')).toBeUndefined();
    expect(restoredDetails.findAll('[data-metric]')).toHaveLength(22);
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
