import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const historyMocks = vi.hoisted(() => ({
  createHistoryRecord: vi.fn(),
  deleteHistoryRecord: vi.fn(),
  batchDeleteHistoryRecords: vi.fn(),
  clearAllHistory: vi.fn(),
  getHistoryList: vi.fn(),
  getHistoryRecord: vi.fn(),
  updateHistoryRecord: vi.fn(),
}));

vi.mock('../api/modules/examples', () => ({
  fetchScanExamples: vi.fn(async () => ({})),
}));

vi.mock('../api/modules/scan', () => ({
  detectText: vi.fn(),
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
  getStoredGuestToken: vi.fn(() => ''),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
}));

import { useAuthStore } from './auth';
import { useScanStore } from './scan';

const HISTORY_STORAGE_KEY = 'ai-detector-history-records';

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

describe('scan store local history migration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    window.localStorage.clear();
    historyMocks.getHistoryList.mockResolvedValue({ items: [] });
  });

  it('imports only local guest records missing from the claimed backend history', async () => {
    const duplicate = makeLocalRecord({ id: 'local-duplicate', inputText: 'same text', editorHtml: '<p>same text</p>' });
    const unique = makeLocalRecord({ id: 'local-unique', inputText: 'new text', editorHtml: '<p>new text</p>' });
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([duplicate, unique]));
    historyMocks.createHistoryRecord.mockResolvedValue(makeBackendRecord(unique, 200));

    setAuthenticatedSession();
    const scanStore = useScanStore();
    const result = await scanStore.migrateLocalStorageToBackend({
      existingRecords: [makeBackendRecord(duplicate, 100)],
    });

    expect(historyMocks.createHistoryRecord).toHaveBeenCalledTimes(1);
    expect(historyMocks.createHistoryRecord.mock.calls[0][0].input_text).toBe('new text');
    expect(result.skipped).toHaveLength(1);
    expect(result.migrated).toHaveLength(1);
    expect(result.failed).toHaveLength(0);
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });

  it('keeps failed local records for the next automatic import retry', async () => {
    const first = makeLocalRecord({ id: 'local-first', inputText: 'first text', editorHtml: '<p>first text</p>' });
    const second = makeLocalRecord({ id: 'local-second', inputText: 'second text', editorHtml: '<p>second text</p>' });
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([first, second]));
    historyMocks.createHistoryRecord
      .mockResolvedValueOnce(makeBackendRecord(first, 201))
      .mockRejectedValueOnce(new Error('temporary backend failure'));

    setAuthenticatedSession();
    const scanStore = useScanStore();
    const result = await scanStore.migrateLocalStorageToBackend({ existingRecords: [] });

    expect(historyMocks.createHistoryRecord).toHaveBeenCalledTimes(2);
    expect(result.migrated).toHaveLength(1);
    expect(result.failed).toHaveLength(1);

    const remainingLocalRecords = JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    expect(remainingLocalRecords).toHaveLength(1);
    expect(remainingLocalRecords[0].inputText).toBe('second text');
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

  it('guest search does not overwrite unmatched local history when pinning a visible result', async () => {
    const matched = makeLocalRecord({
      id: 'local-match',
      title: 'Needle',
      inputText: 'needle text',
      createdAt: '2026-06-16T00:02:00.000Z',
    });
    const hidden = makeLocalRecord({
      id: 'local-hidden',
      title: 'Hidden',
      inputText: 'ordinary text',
      createdAt: '2026-06-16T00:01:00.000Z',
    });
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([matched, hidden]));

    const scanStore = useScanStore();
    await scanStore.searchHistoryRecords({ q: 'needle' });
    expect(scanStore.historyRecords).toHaveLength(1);

    await scanStore.togglePinnedHistoryRecord('local-match', true);

    const persistedRecords = JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    expect(persistedRecords).toHaveLength(2);
    expect(persistedRecords.find((record) => record.id === 'local-match')?.isPinned).toBe(true);
    expect(persistedRecords.find((record) => record.id === 'local-hidden')).toBeTruthy();
  });

  it('guest batch delete updates full local history without keeping stale selected records', async () => {
    const first = makeLocalRecord({ id: 'local-first', inputText: 'first text' });
    const second = makeLocalRecord({ id: 'local-second', inputText: 'second text' });
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([first, second]));

    const scanStore = useScanStore();
    const result = await scanStore.batchDeleteHistoryRecords(['local-first']);

    expect(result.deletedCount).toBe(1);
    const persistedRecords = JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    expect(persistedRecords).toHaveLength(1);
    expect(persistedRecords[0].id).toBe('local-second');
  });
});
