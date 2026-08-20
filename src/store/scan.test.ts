import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';

const historyMocks = vi.hoisted(() => ({
  createHistoryRecord: vi.fn(),
  deleteHistoryRecord: vi.fn(),
  batchDeleteHistoryRecords: vi.fn(),
  clearAllHistory: vi.fn(),
  getHistoryList: vi.fn(),
  getHistoryRecord: vi.fn(),
  updateHistoryRecord: vi.fn(),
}));

const authApiMocks = vi.hoisted(() => ({
  getGuestSessionId: vi.fn(),
  getStoredGuestToken: vi.fn(),
}));

const scanApiMocks = vi.hoisted(() => ({
  detectText: vi.fn(),
}));

const fileReaderMocks = vi.hoisted(() => ({
  readTextFromFile: vi.fn(),
}));

vi.mock('../api/modules/examples', () => ({
  fetchScanExamples: vi.fn(async () => ({})),
}));

vi.mock('../api/modules/scan', () => ({
  detectText: scanApiMocks.detectText,
}));

vi.mock('../utils/fileReaders', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/fileReaders')>()),
  readTextFromFile: fileReaderMocks.readTextFromFile,
}));

vi.mock('../api/modules/history', () => ({
  createHistoryRecord: historyMocks.createHistoryRecord,
  deleteHistoryRecord: historyMocks.deleteHistoryRecord,
  batchDeleteHistoryRecords: historyMocks.batchDeleteHistoryRecords,
  clearAllHistory: historyMocks.clearAllHistory,
  getHistoryList: historyMocks.getHistoryList,
  getHistoryRecord: historyMocks.getHistoryRecord,
  updateHistoryRecord: historyMocks.updateHistoryRecord,
}));

vi.mock('../api/modules/auth', () => ({
  clearGuestToken: vi.fn(),
  fetchMe: vi.fn(),
  getGuestSessionId: authApiMocks.getGuestSessionId,
  getStoredGuestToken: authApiMocks.getStoredGuestToken,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
}));

import { useAuthStore } from './auth';
import { useScanStore } from './scan';

const HISTORY_STORAGE_KEY = 'ai-detector-history-records';
const HISTORY_STORAGE_PREFIX = 'ai-detector-history-records';

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const getStorageEntries = (storage: Storage) =>
  Array.from({ length: storage.length }, (_, index) => {
    const key = storage.key(index) || '';
    return [key, storage.getItem(key) || ''] as const;
  });

const expectNoHistoryStorage = () => {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    expect(getStorageEntries(storage).filter(([key]) => key.startsWith(HISTORY_STORAGE_PREFIX))).toEqual([]);
  }
};

const makeAnalysis = (ai = 12) => ({
  summary: { ai, mixed: 0, human: 100 - ai },
  sentences: [
    {
      id: 'paragraph-1',
      text: 'sample text',
      raw: 'sample text',
      startParagraph: 1,
      endParagraph: 1,
      type: ai >= 70 ? 'ai' : 'human',
      probability: ai / 100,
      score: ai,
      reason: '',
      suggestion: '',
    },
  ],
  translation: '',
  polish: '',
  citations: [],
  aiLikelyCount: ai >= 70 ? 1 : 0,
  highlightedHtml: '',
});

const makeLocalRecord = (overrides = {}) => ({
  id: `local-${Math.random().toString(16).slice(2)}`,
  title: 'Scan record',
  exampleKey: '',
  createdAt: '2026-06-16T00:00:00.000Z',
  functions: ['scan'],
  inputText: 'sample text',
  editorHtml: '<p>sample text</p>',
  analysis: makeAnalysis(),
  ...overrides,
});

const makeBackendRecord = (record, id = 100) => ({
  id,
  title: record.title || 'Scan record',
  created_at: record.createdAt || '2026-06-16T00:00:00.000Z',
  functions: record.functions || ['scan'],
  input_text: record.inputText || '',
  editor_html: record.editorHtml || '',
  is_pinned: Boolean(record.isPinned),
  analysis: {
    summary: record.analysis?.summary || { ai: 0, mixed: 0, human: 100 },
    sentences: (record.analysis?.sentences || []).map((sentence) => ({
      ...sentence,
      start_paragraph: sentence.startParagraph ?? sentence.start_paragraph ?? 1,
      end_paragraph: sentence.endParagraph ?? sentence.end_paragraph ?? 1,
      token_count: sentence.tokenCount ?? null,
      visible_chars: sentence.visibleChars ?? null,
      is_truncated: sentence.isTruncated ?? false,
    })),
    translation: record.analysis?.translation || '',
    polish: record.analysis?.polish || '',
    citations: record.analysis?.citations || [],
    ai_likely_count: record.analysis?.aiLikelyCount ?? 0,
    highlighted_html: record.analysis?.highlightedHtml || '',
  },
});

const setAuthenticatedSession = () => {
  window.localStorage.setItem('auth_session', '1');
  const authStore = useAuthStore();
  authStore.token = '__cookie__';
  return authStore;
};

describe('scan store guest history boundary', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    authApiMocks.getStoredGuestToken.mockImplementation(
      () => window.localStorage.getItem('guest_token') || ''
    );
    authApiMocks.getGuestSessionId.mockImplementation((token = '') => {
      const [, sid = ''] = String(token).split(':');
      return sid;
    });
    historyMocks.getHistoryList.mockResolvedValue({ items: [] });
  });

  it('未 opt-in 的游客正文、HTML 和完整分析只留当前 Pinia，新实例不从 Web Storage 恢复', async () => {
    const record = makeLocalRecord({
      id: 'memory-only',
      inputText: 'SECRET_INPUT_WEB01',
      editorHtml: '<p>SECRET_HTML_WEB01</p>',
      analysis: {
        ...makeAnalysis(),
        translation: 'SECRET_ANALYSIS_WEB01',
      },
    });
    const scanStore = useScanStore();
    scanStore.historyRecords.push(record);
    await nextTick();

    const serializedStorage = [window.localStorage, window.sessionStorage]
      .flatMap((storage) => getStorageEntries(storage).map(([, value]) => value))
      .join('\n');
    expect(serializedStorage).not.toContain('SECRET_INPUT_WEB01');
    expect(serializedStorage).not.toContain('SECRET_HTML_WEB01');
    expect(serializedStorage).not.toContain('SECRET_ANALYSIS_WEB01');

    setActivePinia(createPinia());
    const refreshedStore = useScanStore();
    expect(refreshedStore.historyRecords).toEqual([]);

    window.sessionStorage.clear();
    setActivePinia(createPinia());
    expect(useScanStore().historyRecords).toEqual([]);
  });

  it('初始化会清除 localStorage/sessionStorage 中全部历史旧版本键，但保留无关键', () => {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      storage.setItem(HISTORY_STORAGE_KEY, 'legacy-global');
      storage.setItem(`${HISTORY_STORAGE_KEY}:v1:guest-a`, 'legacy-v1');
      storage.setItem(`${HISTORY_STORAGE_KEY}-v0`, 'legacy-v0');
      storage.setItem('locale', 'en-US');
    }

    useScanStore();

    expectNoHistoryStorage();
    expect(window.localStorage.getItem('locale')).toBe('en-US');
    expect(window.sessionStorage.getItem('locale')).toBe('en-US');
  });

  it('clearScanSessionData 会清敏感内存及两类 Storage 的全部历史版本键', () => {
    const scanStore = useScanStore();
    scanStore.setEditorHtml('<p>owner-a secret</p>');
    scanStore.result = makeAnalysis(91);
    scanStore.currentResultHistoryId = 'owner-a-result';
    scanStore.historyRecords.push(makeLocalRecord({ id: 'owner-a-history', inputText: 'owner-a secret' }));
    for (const storage of [window.localStorage, window.sessionStorage]) {
      storage.setItem(HISTORY_STORAGE_KEY, 'legacy-global');
      storage.setItem(`${HISTORY_STORAGE_KEY}:v2:guest-a`, 'legacy-v2');
      storage.setItem('locale', 'zh-CN');
    }

    scanStore.clearScanSessionData();

    expect(scanStore.inputText).toBe('');
    expect(scanStore.editorHtml).toBe('');
    expect(scanStore.result).toBeNull();
    expect(scanStore.currentResultHistoryId).toBeNull();
    expect(scanStore.historyRecords).toEqual([]);
    expectNoHistoryStorage();
    expect(window.localStorage.getItem('locale')).toBe('zh-CN');
    expect(window.sessionStorage.getItem('locale')).toBe('zh-CN');
  });

  it('同 SID 的 token refresh 保留 scan 内存，SID A 切到 B 时原子清空', () => {
    const scanStore = useScanStore();
    expect(scanStore.activateGuestSession('sid-a')).toBe(false);
    scanStore.setEditorHtml('<p>sid-a secret</p>');
    scanStore.result = makeAnalysis(82);
    scanStore.currentResultHistoryId = 'sid-a-result';
    scanStore.historyRecords.push(makeLocalRecord({ id: 'sid-a-history', inputText: 'sid-a secret' }));

    expect(scanStore.activateGuestSession('sid-a')).toBe(false);
    expect(scanStore.inputText).toBe('sid-a secret');
    expect(scanStore.result).not.toBeNull();
    expect(scanStore.historyRecords).toHaveLength(1);

    expect(scanStore.activateGuestSession('sid-b')).toBe(true);
    expect(scanStore.inputText).toBe('');
    expect(scanStore.editorHtml).toBe('');
    expect(scanStore.result).toBeNull();
    expect(scanStore.currentResultHistoryId).toBeNull();
    expect(scanStore.historyRecords).toEqual([]);

    scanStore.clearScanSessionData();
    scanStore.setEditorHtml('<p>fresh unowned draft</p>');
    expect(scanStore.activateGuestSession('sid-c')).toBe(false);
    expect(scanStore.inputText).toBe('fresh unowned draft');
  });

  it('初始化当前 SID 并全局处理 guest_token storage 事件，只在主体变化时递增 generation', () => {
    window.localStorage.setItem('guest_token', 'guest:sid-a:initial');
    const scanStore = useScanStore();
    scanStore.setEditorHtml('<p>sid-a secret</p>');
    const initialGeneration = scanStore.sessionGeneration;

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'guest_token',
      oldValue: 'guest:sid-a:initial',
      newValue: 'guest:sid-a:refresh',
      storageArea: window.localStorage,
    }));

    expect(scanStore.sessionGeneration).toBe(initialGeneration);
    expect(scanStore.inputText).toBe('sid-a secret');

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'guest_token',
      oldValue: 'guest:sid-a:refresh',
      newValue: 'guest:sid-b:initial',
      storageArea: window.localStorage,
    }));

    expect(scanStore.sessionGeneration).toBe(initialGeneration + 1);
    expect(scanStore.inputText).toBe('');
  });

  it('旧版本标签页重新写入历史固定键时会立即清除且不动无关键', () => {
    useScanStore();
    window.localStorage.setItem(`${HISTORY_STORAGE_PREFIX}:legacy-tab`, 'legacy secret');
    window.localStorage.setItem('locale', 'zh-CN');

    window.dispatchEvent(new StorageEvent('storage', {
      key: `${HISTORY_STORAGE_PREFIX}:legacy-tab`,
      oldValue: null,
      newValue: 'legacy secret',
      storageArea: window.localStorage,
    }));

    expect(window.localStorage.getItem(`${HISTORY_STORAGE_PREFIX}:legacy-tab`)).toBeNull();
    expect(window.localStorage.getItem('locale')).toBe('zh-CN');
  });

  it('SID 切换后丢弃旧 deferred detect 响应，不回填结果、历史或当前记录 ID', async () => {
    const scanStore = useScanStore();
    scanStore.activateGuestSession('sid-a');
    scanStore.setText('sid-a pending text');
    const pendingDetect = createDeferred<Record<string, unknown>>();
    scanApiMocks.detectText.mockReturnValueOnce(pendingDetect.promise);

    const pendingAnalysis = scanStore.analyzeText('sid-a pending text', {
      functions: ['scan'],
      html: '<p>sid-a pending text</p>',
      guestToken: 'guest:sid-a:token',
    });
    expect(scanApiMocks.detectText.mock.calls[0][1]).toBe('guest:sid-a:token');
    expect(scanStore.activateGuestSession('sid-b')).toBe(true);
    scanStore.setText('sid-b fresh draft');
    scanStore.result = makeAnalysis(17);
    const sidBRecord = await scanStore.addHistoryRecord({
      title: 'SID B',
      text: 'sid-b fresh draft',
      html: '<p>sid-b fresh draft</p>',
      functions: ['scan'],
      analysis: makeAnalysis(17),
    });

    pendingDetect.resolve({
      historyId: 991,
      inputText: 'sid-a pending text',
      result: makeAnalysis(99),
    });

    await expect(pendingAnalysis).resolves.toBeNull();
    expect(scanStore.inputText).toBe('sid-b fresh draft');
    expect(scanStore.result?.summary.ai).toBe(17);
    expect(scanStore.currentResultHistoryId).toBe(sidBRecord.id);
    expect(scanStore.historyRecords).toHaveLength(1);
    expect(scanStore.historyRecords[0].inputText).toBe('sid-b fresh draft');
  });

  it('游客缺少当前 SID 的显式 token 时不发送检测', async () => {
    const scanStore = useScanStore();
    scanStore.activateGuestSession('sid-a');

    await expect(
      scanStore.analyzeText('guest text without credential', {
        functions: ['scan'],
        html: '<p>guest text without credential</p>',
      })
    ).rejects.toMatchObject({ status: 401, code: 'GUEST_TOKEN_REQUIRED' });

    expect(scanApiMocks.detectText).not.toHaveBeenCalled();
  });

  it('游客 detect 未完成时登录态先翻转，即使 clear 尚未执行也丢弃游客响应', async () => {
    const authStore = useAuthStore();
    const scanStore = useScanStore();
    scanStore.activateGuestSession('sid-a');
    const pendingDetect = createDeferred<Record<string, unknown>>();
    scanApiMocks.detectText.mockReturnValueOnce(pendingDetect.promise);

    const pendingAnalysis = scanStore.analyzeText('guest pending text', {
      functions: ['scan'],
      html: '<p>guest pending text</p>',
      guestToken: 'guest:sid-a:token',
    });
    window.localStorage.setItem('auth_session', '1');
    authStore.token = '__cookie__';
    authStore.user = { id: 81 };
    scanStore.setText('authenticated fresh draft');
    scanStore.result = makeAnalysis(18);
    pendingDetect.resolve({
      inputText: 'guest pending text',
      result: makeAnalysis(98),
    });

    await expect(pendingAnalysis).resolves.toBeNull();
    expect(scanStore.inputText).toBe('authenticated fresh draft');
    expect(scanStore.result?.summary.ai).toBe(18);
    expect(scanStore.historyRecords).toEqual([]);
  });

  it('登录 detect 未完成时认证态先退出，即使 clear 尚未执行也不把用户响应写入游客状态', async () => {
    const authStore = setAuthenticatedSession();
    authStore.user = { id: 82 };
    const scanStore = useScanStore();
    const pendingDetect = createDeferred<Record<string, unknown>>();
    scanApiMocks.detectText.mockReturnValueOnce(pendingDetect.promise);

    const pendingAnalysis = scanStore.analyzeText('authenticated pending text', {
      functions: ['scan'],
      html: '<p>authenticated pending text</p>',
    });
    expect(scanApiMocks.detectText.mock.calls[0][1]).toBe('');
    window.localStorage.removeItem('auth_session');
    authStore.token = '';
    authStore.user = null;
    scanStore.setText('guest fresh draft');
    scanStore.result = makeAnalysis(19);
    pendingDetect.resolve({
      historyId: 882,
      inputText: 'authenticated pending text',
      result: makeAnalysis(97),
    });

    await expect(pendingAnalysis).resolves.toBeNull();
    expect(scanStore.inputText).toBe('guest fresh draft');
    expect(scanStore.result?.summary.ai).toBe(19);
    expect(scanStore.historyRecords).toEqual([]);
  });

  it('clear 后丢弃旧 deferred history sync，不覆盖新会话历史', async () => {
    setAuthenticatedSession();
    const scanStore = useScanStore();
    historyMocks.getHistoryList.mockClear();
    const pendingHistory = createDeferred<{ items: ReturnType<typeof makeBackendRecord>[] }>();
    historyMocks.getHistoryList.mockReturnValueOnce(pendingHistory.promise);

    const pendingSync = scanStore.syncHistoryFromBackend({ strict: true });
    scanStore.clearScanSessionData();
    const freshRecord = makeLocalRecord({ id: 'fresh-session', inputText: 'fresh session text' });
    scanStore.historyRecords = [freshRecord];
    pendingHistory.resolve({
      items: [makeBackendRecord(makeLocalRecord({ inputText: 'stale owner text' }), 404)],
    });

    await expect(pendingSync).resolves.toEqual([]);
    expect(scanStore.historyRecords).toEqual([freshRecord]);
  });

  it('SID 切换后丢弃旧 deferred file parse，且旧 finally 不覆盖新会话上传状态', async () => {
    const scanStore = useScanStore();
    scanStore.activateGuestSession('sid-a');
    const pendingFile = createDeferred<{ text: string; html: string }>();
    fileReaderMocks.readTextFromFile.mockReturnValueOnce(pendingFile.promise);

    const pendingRead = scanStore.readFile(new File(['old'], 'sid-a.txt', { type: 'text/plain' }));
    expect(scanStore.isUploading).toBe(true);
    expect(scanStore.activateGuestSession('sid-b')).toBe(true);
    scanStore.setText('sid-b fresh draft');
    pendingFile.resolve({ text: 'sid-a stale file', html: '<p>sid-a stale file</p>' });

    await expect(pendingRead).resolves.toBe(false);
    expect(scanStore.inputText).toBe('sid-b fresh draft');
    expect(scanStore.editorHtml).toContain('sid-b fresh draft');
    expect(scanStore.lastUploadedFileName).toBe('');
    expect(scanStore.uploadError).toBe('');
    expect(scanStore.isUploading).toBe(false);
  });

  it('logged-in history search sends q to the backend and normalizes pinned records', async () => {
    const matched = makeLocalRecord({
      id: 'backend-local',
      title: 'Needle title',
      inputText: 'Needle body',
      isPinned: true,
    });

    setAuthenticatedSession();
    const scanStore = useScanStore();
    historyMocks.getHistoryList.mockClear();
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [makeBackendRecord(matched, 300)] });

    await scanStore.searchHistoryRecords({ q: 'needle' });

    expect(historyMocks.getHistoryList).toHaveBeenCalledWith({
      page: 1,
      per_page: 100,
      sort: 'created_at',
      order: 'desc',
      q: 'needle',
      pinned: null,
    });
    expect(scanStore.historyRecords).toHaveLength(1);
    expect(scanStore.historyRecords[0].isPinned).toBe(true);
  });

  it('strict backend sync 会透传失败，阻止确认流程把未去重的本地记录上传', async () => {
    const syncError = new Error('history sync unavailable');
    setAuthenticatedSession();
    const scanStore = useScanStore();
    historyMocks.getHistoryList.mockRejectedValueOnce(syncError);

    await expect(scanStore.syncHistoryFromBackend({ strict: true })).rejects.toBe(syncError);

    expect(historyMocks.createHistoryRecord).not.toHaveBeenCalled();
  });

  it('guest search/pin 使用当前内存 canonical，不会重新读旧固定键或丢掉隐藏记录', async () => {
    const scanStore = useScanStore();
    scanStore.activateGuestSession?.('sid-a');
    const matched = await scanStore.addHistoryRecord({
      title: 'Needle',
      text: 'needle text',
      html: '<p>needle text</p>',
      functions: ['scan'],
      analysis: makeAnalysis(),
    });
    const hidden = await scanStore.addHistoryRecord({
      title: 'Hidden',
      text: 'ordinary text',
      html: '<p>ordinary text</p>',
      functions: ['scan'],
      analysis: makeAnalysis(),
    });
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([
      makeLocalRecord({ id: 'attacker', inputText: 'must not be read' }),
    ]));

    await scanStore.searchHistoryRecords({ q: 'needle' });
    expect(scanStore.historyRecords).toHaveLength(1);

    await scanStore.togglePinnedHistoryRecord(matched.id, true);
    await scanStore.searchHistoryRecords({ q: '' });

    expect(scanStore.historyRecords).toHaveLength(2);
    expect(scanStore.historyRecords.find((record) => record.id === matched.id)?.isPinned).toBe(true);
    expect(scanStore.historyRecords.find((record) => record.id === hidden.id)).toBeTruthy();
    expect(scanStore.historyRecords.some((record) => record.inputText === 'must not be read')).toBe(false);
  });

  it('guest batch delete 只更新当前内存 canonical，不创建历史 Storage', async () => {
    const scanStore = useScanStore();
    scanStore.activateGuestSession?.('sid-a');
    const first = await scanStore.addHistoryRecord({
      title: 'First',
      text: 'first text',
      html: '<p>first text</p>',
      functions: ['scan'],
      analysis: makeAnalysis(),
    });
    const second = await scanStore.addHistoryRecord({
      title: 'Second',
      text: 'second text',
      html: '<p>second text</p>',
      functions: ['scan'],
      analysis: makeAnalysis(),
    });
    const result = await scanStore.batchDeleteHistoryRecords([first.id]);

    expect(result.deletedCount).toBe(1);
    expect(scanStore.historyRecords).toHaveLength(1);
    expect(scanStore.historyRecords[0].id).toBe(second.id);
    expectNoHistoryStorage();
  });
});
