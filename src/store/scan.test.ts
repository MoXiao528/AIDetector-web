import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import RegisterPage from '../pages/RegisterPage.vue';
import { createI18n, globalT } from '../i18n';
import type { EvidenceResult } from '../api/modules/scan';

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

const exampleApiMocks = vi.hoisted(() => ({
  fetchScanExamples: vi.fn(async () => ({})),
}));

const fileReaderMocks = vi.hoisted(() => ({
  readTextFromFile: vi.fn(),
}));

vi.mock('../api/modules/examples', () => ({
  fetchScanExamples: exampleApiMocks.fetchScanExamples,
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
  summary: { ai, human: 100 - ai },
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

// Synthetic snapshots follow backend EvidenceResult and the frozen METRICS order.
const makeEvidence = (status: EvidenceResult['status'] = 'partial'): EvidenceResult => {
  if (status === 'unsupported' || status === 'failed') {
    return {
      status,
      artifactVersion: null,
      featureSchemaVersion: 1,
      route: null,
      quality: { level: 'unavailable', coverage: 0, reasons: [status === 'failed' ? 'timeout' : 'unsupported_language'] },
      signals: [],
      patterns: null,
    };
  }
  const metrics = {
    lexical: ['mattr', 'token_entropy', 'entropy_per_log_vocab', 'hapax_type_ratio', 'top_token_concentration'],
    phrase_template: ['repeat_ngram_coverage', 'sentence_start_repeat'],
    rhythm: ['sentence_length_median', 'sentence_length_iqr', 'sentence_length_cv', 'sentence_adjacent_change_median',
      'paragraph_length_median', 'paragraph_length_iqr', 'paragraph_length_cv', 'punctuation_per_1k', 'punctuation_entropy'],
    discourse: ['transition_per_1k', 'transition_diversity', 'paragraph_adjacent_jaccard',
      'paragraph_nonadjacent_jaccard_q90', 'intro_conclusion_jaccard', 'section_heading_count'],
  } satisfies Record<EvidenceResult['signals'][number]['dimension'], string[]>;
  const comparableCount = status === 'ready' ? 22 : status === 'partial' ? 19 : 0;
  const signals: EvidenceResult['signals'] = Object.entries(metrics)
    .flatMap(([dimension, names]) => names.map((metric) => ({ dimension, metric })))
    .map(({ dimension, metric }, index) => ({
      dimension: dimension as EvidenceResult['signals'][number]['dimension'],
      metric,
      observed: index === 21 && status !== 'ready' ? null : 0,
      humanPercentile: index < comparableCount ? 0 : null,
      aiPercentile: index < comparableCount ? 0 : null,
      referenceRanges: index < comparableCount ? { human: [1, 2], ai: [index === 1 ? 1 : 0, 2] } : null,
      relation: index < comparableCount ? { human: 'below', ai: index === 1 ? 'below' : 'within' } : null,
      notice: index < comparableCount ? index === 1 ? 'outside_both' : 'reference_mismatch' : null,
      sampleCount: index < comparableCount ? 10 : index === 21 ? null : 0,
      offsets: index === 5 ? [{ start: 2, end: 8 }, { start: 9, end: 15 }] : [],
      reasons: index < comparableCount ? [] : ['reference_metrics_unavailable'],
    }));
  return {
    status,
    artifactVersion: '1'.repeat(64),
    featureSchemaVersion: 1,
    route: {
      language: 'en', domain: 'academic', confidence: { language: 0, domain: 0.8 },
      lengthBucket: 'short', fallbackLevel: 'exact',
    },
    quality: { level: status, coverage: comparableCount / 22, reasons: status === 'ready' ? [] : ['reference_metrics_unavailable'] },
    signals,
    patterns: {
      descriptive_top_tokens: [{ count: 1, offsets: [{ start: 0, end: 1 }] }],
      repeated_phrases: [{ count: 2, offsets: [{ start: 2, end: 8 }, { start: 9, end: 15 }] }],
      sentence_start_templates: [],
    },
  };
};

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
  ...(Object.prototype.hasOwnProperty.call(record, 'evidence') ? { evidence: record.evidence } : {}),
  analysis: {
    summary: record.analysis?.summary || { ai: 0, human: 100 },
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
    window.localStorage.setItem('guest_token', 'guest:sid-a:token');
    authApiMocks.getStoredGuestToken.mockImplementation(
      () => window.localStorage.getItem('guest_token') || ''
    );
    authApiMocks.getGuestSessionId.mockImplementation((token = '') => {
      const [, sid = ''] = String(token).split(':');
      return sid;
    });
    for (const mock of Object.values(historyMocks)) mock.mockReset();
    historyMocks.getHistoryList.mockResolvedValue({ items: [] });
  });

  it.each(['inputText', 'input_text', 'request'])(
    '结果原文取自 %s，搜索与编辑不改变快照，切换历史和重置同步更新',
    async (source) => {
      const scanStore = useScanStore();
      scanStore.activateGuestSession('sid-a');
      const requestText = 'Submitted request text with 😀 examples.';
      const resultText = source === 'request' ? requestText : 'Returned original text with 😀 examples.';
      scanApiMocks.detectText.mockResolvedValueOnce({
        historyId: 601, result: makeAnalysis(), evidence: makeEvidence(),
        ...(source === 'request' ? {} : { [source]: resultText }),
      });

      await scanStore.analyzeText(requestText, { functions: ['scan'], guestToken: 'guest:sid-a:token' });
      const record = scanStore.historyRecords[0];
      expect(scanStore.resultInputText).toBe(resultText);
      expect(record.inputText).toBe(resultText);
      expect(scanStore.result).not.toHaveProperty('resultInputText');
      expect(record.analysis).not.toHaveProperty('resultInputText');

      await scanStore.searchHistoryRecords({ q: 'no-matching-history-item' });
      expect(scanStore.historyRecords).toEqual([]);
      expect(scanStore.currentResultHistoryId).toBe(record.id);
      expect(scanStore.resultInputText).toBe(resultText);
      scanStore.setEditorHtml('<p>Unsubmitted edited text.</p>');
      expect(scanStore.resultInputText).toBe(resultText);

      scanStore.loadHistoryRecord(makeLocalRecord({ inputText: 'Another result original.' }));
      expect(scanStore.resultInputText).toBe('Another result original.');
      scanStore.loadHistoryRecord(record);
      expect(scanStore.resultInputText).toBe(resultText);
      scanStore.commitDraftToStorage();
      for (const storage of [window.localStorage, window.sessionStorage]) {
        expect(JSON.stringify(getStorageEntries(storage))).not.toContain(resultText);
        expect(JSON.stringify(getStorageEntries(storage))).not.toContain('resultInputText');
      }
      scanStore.resetResult();
      expect(scanStore.resultInputText).toBe('');
      expect(scanStore.result).toBeNull();
    }
  );

  it('当前检测失败时与结果一起清空原文快照', async () => {
    const scanStore = useScanStore();
    scanStore.activateGuestSession('sid-a');
    scanStore.loadHistoryRecord(makeLocalRecord({ inputText: 'Previous result original.' }));
    scanApiMocks.detectText.mockRejectedValueOnce(new Error('detection failed'));

    await expect(scanStore.analyzeText('New request', {
      functions: ['scan'], guestToken: 'guest:sid-a:token',
    })).rejects.toThrow('detection failed');

    expect(scanStore.result).toBeNull();
    expect(scanStore.resultInputText).toBe('');
  });

  it.each((['ready', 'partial', 'insufficient', 'unsupported', 'failed'] as const)
    .flatMap((status) => [23, 77].map((ai) => ({ status, ai }))))(
    '$status Evidence 原样穿过游客检测、服务器历史、改名、置顶和重开，主分析 AI=$ai 不变',
    async ({ status, ai }) => {
      const scanStore = useScanStore();
      scanStore.activateGuestSession('sid-a');
      const evidence = makeEvidence(status);
      if (ai === 77) {
        for (const signal of evidence.signals) {
          if (signal.referenceRanges) {
            const { human, ai } = signal.referenceRanges;
            signal.referenceRanges = { human: ai, ai: human };
          }
          if (signal.relation) {
            const { human, ai } = signal.relation;
            signal.relation = { human: ai, ai: human };
          }
        }
      }
      const text = '😀 sample sample';
      const request = { functions: ['scan'], html: `<p>${text}</p>`, guestToken: 'guest:sid-a:token' };
      scanApiMocks.detectText
        .mockResolvedValueOnce({ historyId: 700, inputText: text, result: makeAnalysis(ai) })
        .mockResolvedValueOnce({ historyId: 701, inputText: text, result: makeAnalysis(ai), evidence });

      const baseline = await scanStore.analyzeText(text, request);
      const result = await scanStore.analyzeText(text, request);

      expect(result.evidence).toEqual(evidence);
      expect({ ...result, evidence: undefined }).toEqual({ ...baseline, evidence: undefined });
      const record = scanStore.historyRecords.find((item) => item.id === scanStore.currentResultHistoryId);
      expect(record.evidence).toEqual(evidence);
      expect(record.analysis).not.toHaveProperty('evidence');
      historyMocks.updateHistoryRecord
        .mockResolvedValueOnce(makeBackendRecord({ ...record, title: 'Evidence snapshot' }, record.id))
        .mockResolvedValueOnce(makeBackendRecord({ ...record, title: 'Evidence snapshot', isPinned: true }, record.id));
      await scanStore.renameHistoryRecord(record.id, 'Evidence snapshot');
      await scanStore.togglePinnedHistoryRecord(record.id, true);
      scanStore.resetResult();
      expect(scanStore.result).toBeNull();
      expect(scanStore.loadHistoryRecord(scanStore.historyRecords.find((item) => item.id === record.id))).toBe(true);
      expect(scanStore.result.evidence).toEqual(evidence);
      expect(scanStore.result.summary).toEqual({ ai, human: 100 - ai });
      expect(scanStore.result.sentences[0]).toMatchObject({
        type: ai === 77 ? 'ai' : 'human', score: ai, probability: ai / 100,
      });
      scanStore.commitDraftToStorage();
      await nextTick();
      expectNoHistoryStorage();
      for (const storage of [window.localStorage, window.sessionStorage]) {
        expect(getStorageEntries(storage).map(([, value]) => value).join('\n')).not.toContain('"evidence"');
      }
      setActivePinia(createPinia());
      expect(useScanStore().historyRecords).toEqual([]);
      expect(useScanStore().result).toBeNull();
    }
  );

  it.each([
    { source: 'score/label Human', payload: { score: 0.77, label: 'human', rawScore: 4, threshold: 0 }, score: 77, label: 'human' },
    { source: 'score/label AI', payload: { score: 0.23, label: 'ai' }, score: 23, label: 'ai' },
    { source: 'rawScore/threshold AI', payload: { rawScore: -1, threshold: -2, label: 'ai' }, score: 73, label: 'ai' },
    { source: 'raw_score/threshold Human', payload: { raw_score: 1, threshold: 2, label: 'human' }, score: 27, label: 'human' },
  ])('$source 备用响应有无 Evidence 时保留既有分数和服务端标签', async ({ payload, score, label }) => {
    const scanStore = useScanStore();
    scanStore.activateGuestSession('sid-a');
    const text = 'Fallback response keeps the original model result.';
    const request = { functions: ['scan'], guestToken: 'guest:sid-a:token' };
    const response = { historyId: 504, inputText: text, ...payload };
    const original = JSON.stringify(response);
    const evidence = makeEvidence('failed');
    scanApiMocks.detectText
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce({ ...response, evidence });

    const baseline = await scanStore.analyzeText(text, request);
    const result = await scanStore.analyzeText(text, request);

    expect(result.evidence).toEqual(evidence);
    expect({ ...result, evidence: undefined }).toEqual({ ...baseline, evidence: undefined });
    expect(result.sentences).toHaveLength(1);
    expect(result.sentences[0]).toMatchObject({ type: label, score, probability: score / 100 });
    // The existing fallback summary counts paragraph labels, not the raw model score.
    expect(result.summary).toEqual(label === 'ai' ? { ai: 100, human: 0 } : { ai: 0, human: 100 });
    expect(JSON.stringify(response)).toBe(original);
  });

  it.each([
    { source: 'list', hasEvidence: true }, { source: 'list', hasEvidence: false },
    { source: 'detail', hasEvidence: true }, { source: 'detail', hasEvidence: false },
  ])('登录检测由历史 $source 替换（Evidence=$hasEvidence）时，主分析与快照保持一致', async ({ source, hasEvidence }) => {
    setAuthenticatedSession();
    const scanStore = useScanStore();
    await nextTick();
    const evidence = hasEvidence ? makeEvidence('partial') : undefined;
    const record = makeBackendRecord(makeLocalRecord({
      inputText: 'Historical response original.',
      analysis: makeAnalysis(91), ...(hasEvidence ? { evidence } : {}),
    }), 501);
    scanApiMocks.detectText.mockResolvedValueOnce({
      historyId: 501, inputText: 'sample text', result: makeAnalysis(23), evidence: makeEvidence('ready'),
    });
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: source === 'list' ? [record] : [] });
    if (source === 'detail') historyMocks.getHistoryRecord.mockResolvedValueOnce(record);

    const result = await scanStore.analyzeText('sample text', { functions: ['scan'] });

    expect(result.summary).toEqual({ ai: 91, human: 9 });
    expect(result.evidence).toEqual(evidence);
    expect(scanStore.result).toEqual(result);
    expect(scanStore.resultInputText).toBe(record.input_text);
    expect(scanStore.historyRecords[0].evidence).toEqual(evidence);
    expect(scanStore.historyRecords[0].analysis).not.toHaveProperty('evidence');
    expect(historyMocks.getHistoryRecord).toHaveBeenCalledTimes(source === 'detail' ? 1 : 0);
  });

  it('历史列表和详情读取失败时，不用旧同 ID 快照覆盖当前无 Evidence 的检测响应', async () => {
    setAuthenticatedSession();
    const scanStore = useScanStore();
    await nextTick();
    scanStore.historyRecords = [makeLocalRecord({
      id: 501, analysis: makeAnalysis(91), evidence: makeEvidence(),
    })];
    scanApiMocks.detectText.mockResolvedValueOnce({
      historyId: 501, inputText: 'sample text', result: makeAnalysis(23),
    });
    historyMocks.getHistoryList.mockRejectedValueOnce(new Error('history list unavailable'));
    historyMocks.getHistoryRecord.mockRejectedValueOnce(new Error('history detail unavailable'));

    const result = await scanStore.analyzeText('sample text', { functions: ['scan'] });

    expect(historyMocks.getHistoryRecord).toHaveBeenCalledWith(501, '');
    expect(result.summary).toEqual({ ai: 23, human: 77 });
    expect(result.evidence).toBeUndefined();
    expect(scanStore.result).toEqual(result);
    expect(scanStore.currentResultHistoryId).toBe(501);
  });

  it.each(['missing', 'null', 'result.evidence', 'result.analysis.evidence'])(
    '检测根级 Evidence 为 %s 时清除旧值，不提升嵌套值或 options.evidence',
    async (source) => {
      const scanStore = useScanStore();
      scanStore.activateGuestSession('sid-a');
      const evidence = makeEvidence();
      scanStore.result = { ...makeAnalysis(), evidence };
      const response = {
        historyId: 702,
        inputText: 'sample text',
        result: source === 'result.analysis.evidence'
          ? { analysis: { ...makeAnalysis(), evidence } }
          : { ...makeAnalysis(), ...(source === 'result.evidence' ? { evidence } : {}) },
        ...(source === 'null' ? { evidence: null } : {}),
      };
      scanApiMocks.detectText.mockResolvedValueOnce(response);

      await scanStore.analyzeText('sample text', { functions: ['scan'], guestToken: 'guest:sid-a:token', evidence });

      expect(scanStore.result.evidence).toBeUndefined();
      expect(scanStore.historyRecords[0].evidence).toBeUndefined();
      expect(scanStore.historyRecords[0].analysis).not.toHaveProperty('evidence');
      expect(scanApiMocks.detectText.mock.calls[0][0]).not.toHaveProperty('evidence');
      expect(scanStore.result.summary).toEqual({ ai: 12, human: 88 });
    }
  );

  it.each(['list', 'detail', 'rename', 'pin'])(
    '历史 %s 省略 Evidence 时清除集合旧值，重新选择后当前结果也不残留',
    async (source) => {
      setAuthenticatedSession();
      const scanStore = useScanStore();
      await nextTick();
      const evidence = makeEvidence();
      const original = makeBackendRecord(makeLocalRecord({ evidence }), 502);
      historyMocks.getHistoryList.mockResolvedValueOnce({ items: [original] });
      await scanStore.syncHistoryFromBackend();
      scanStore.loadHistoryRecord(scanStore.historyRecords[0]);
      expect(scanStore.result.evidence).toEqual(evidence);
      const withoutEvidence = makeBackendRecord(makeLocalRecord(), 502);
      if (source === 'list') {
        historyMocks.getHistoryList.mockResolvedValueOnce({ items: [withoutEvidence] });
        await scanStore.syncHistoryFromBackend();
      } else if (source === 'detail') {
        historyMocks.getHistoryRecord.mockResolvedValueOnce(withoutEvidence);
        await scanStore.fetchHistoryRecordDetail(502);
      } else {
        historyMocks.updateHistoryRecord.mockResolvedValueOnce(withoutEvidence);
        if (source === 'rename') await scanStore.renameHistoryRecord(502, 'New title');
        else await scanStore.togglePinnedHistoryRecord(502, true);
      }

      expect(scanStore.historyRecords[0].evidence).toBeUndefined();
      // Existing selection semantics: list/patch updates do not reload the current result.
      expect(scanStore.result.evidence).toEqual(evidence);
      expect(scanStore.loadHistoryRecord(scanStore.historyRecords[0])).toBe(true);
      expect(scanStore.result.evidence).toBeUndefined();
    }
  );

  it.each(['null', 'analysis.evidence', 'result.evidence'])(
    '历史 %s 不作为根级 Evidence 恢复',
    (source) => {
      const scanStore = useScanStore();
      const evidence = makeEvidence();
      scanStore.result = { ...makeAnalysis(), evidence };
      const record = {
        ...makeLocalRecord(),
        ...(source === 'null' ? { evidence: null } : {}),
        ...(source === 'analysis.evidence' ? { analysis: { ...makeAnalysis(), evidence } } : {}),
        ...(source === 'result.evidence' ? { analysis: undefined, result: { ...makeAnalysis(), evidence } } : {}),
      };

      expect(scanStore.loadHistoryRecord(record)).toBe(true);
      expect(scanStore.result.evidence).toBeUndefined();
      expect(scanStore.result.summary).toEqual({ ai: 12, human: 88 });
    }
  );

  it.each([false, true])('旧三分类检测结果只在读取边界折叠为 AI/Human（Evidence=%s）', async (hasEvidence) => {
    const authStore = setAuthenticatedSession();
    authStore.user = { id: 92 };
    const scanStore = useScanStore();
    const evidence = hasEvidence ? makeEvidence() : undefined;
    scanApiMocks.detectText.mockResolvedValueOnce({
      inputText: 'legacy mixed response',
      ...(hasEvidence ? { evidence } : {}),
      result: {
        summary: { ai: 45, mixed: 25, human: 30 },
        sentences: [
          {
            id: 'legacy-mixed',
            text: 'legacy mixed sentence',
            type: 'mixed',
            probability: 0.55,
            score: 55,
          },
          {
            id: 'legacy-ai',
            text: 'legacy ai sentence',
            type: 'ai',
            probability: 0.8,
            score: 80,
          },
        ],
        ai_likely_count: 2,
      },
    });

    const result = await scanStore.analyzeText('legacy mixed response', {
      functions: ['scan'],
      html: '<p>legacy mixed response</p>',
    });

    expect(result?.summary).toEqual({ ai: 45, human: 55 });
    expect(result?.sentences.map((sentence) => sentence.type)).toEqual(['human', 'ai']);
    expect(result?.aiLikelyCount).toBe(1);
    expect(result?.summary).not.toHaveProperty('mixed');
    expect(result?.evidence).toEqual(evidence);
  });

  it('旧示例响应把第三类并入 Human，store 不再暴露第三个分桶', async () => {
    exampleApiMocks.fetchScanExamples.mockResolvedValueOnce({
      heroExamples: [{ key: 'legacy-hero', content: 'hero', ai: 45, mixed: 25, human: 30 }],
      usageExamples: [{ key: 'legacy-usage', content: 'usage', ai: 20, mixed: 15, human: 65 }],
    });
    const scanStore = useScanStore();

    await scanStore.loadExamples('zh-CN');

    expect(scanStore.examples[0]).toMatchObject({ ai: 45, human: 55 });
    expect(scanStore.examples[0]).not.toHaveProperty('mixed');
    expect(scanStore.usageExamples[0]).toMatchObject({ ai: 20, human: 80 });
    expect(scanStore.usageExamples[0]).not.toHaveProperty('mixed');
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

  it.each([false, true])('游客检测后经注册页的控制台返回，保留历史和额度且不重复检测（手机=%s）', async (mobile) => {
    const scanStore = useScanStore();
    const authStore = useAuthStore();
    scanStore.activateGuestSession('sid-a');
    scanStore.setEditorHtml('<p>sample text</p>');
    scanApiMocks.detectText.mockResolvedValueOnce({
      historyId: 454,
      currentCredits: 3822,
      result: makeAnalysis(),
    });
    await scanStore.analyzeText(scanStore.inputText, {
      html: scanStore.editorHtml,
      guestToken: 'guest:sid-a:token',
    });
    const guestQuota = { total: 5000, remaining: 3822, onlyRemaining: false };
    authStore.setCredits(guestQuota);
    const record = scanStore.historyRecords[0];
    const openWindow = vi.spyOn(window, 'open').mockReturnValue(null);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: ['home', 'dashboard', 'login', 'register', 'admin-overview'].map((name) => ({
        name, path: `/${name}`, component: { template: '<div />' },
      })),
    });
    await router.push('/dashboard?panel=document');
    await router.push('/register');
    const wrapper = mount(RegisterPage, {
      global: { plugins: [router, createI18n()], stubs: { BaseListbox: true } },
    });
    try {
      if (mobile) {
        await wrapper.findAll('header button').find((button) => button.text() === globalT('common.openMenu'))!.trigger('click');
      }
      const label = globalT(`header.buttons.${mobile ? 'mobileDashboard' : 'dashboard'}`);
      await wrapper.findAll('header button').find((button) => button.text() === label)!.trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.fullPath).toBe('/dashboard?panel=home');
      expect(openWindow).not.toHaveBeenCalled();
      expect(wrapper.findAll('header button').some((button) => button.text() === globalT('header.buttons.mobileDashboard'))).toBe(false);
      await router.push('/dashboard?panel=document');
      historyMocks.getHistoryList.mockResolvedValueOnce({ items: [makeBackendRecord(record, 454)] });
      await scanStore.syncHistoryFromBackend();
      expect(scanStore.historyRecords).toHaveLength(1);
      expect(scanStore.historyRecords[0]).toMatchObject({ id: 454, inputText: record.inputText });
      expect(scanStore.loadHistoryRecord(record)).toBe(true);
      expect(scanStore.inputText).toBe('sample text');
      expect(scanStore.result?.summary).toEqual({ ai: 12, human: 88 });
      expect(authStore.creditUsage).toMatchObject({ total: 5000, remaining: 3822, used: 1178 });
      expect(scanApiMocks.detectText).toHaveBeenCalledTimes(1);
      expect(historyMocks.getHistoryList).toHaveBeenCalledWith(expect.any(Object), 'guest:sid-a:token');
      expectNoHistoryStorage();

      authStore.token = '__cookie__';
      authStore.user = { id: 1, systemRole: 'SYS_ADMIN' };
      await router.push('/register');
      if (mobile) {
        await wrapper.findAll('header button').find((button) => button.text() === globalT('common.openMenu'))!.trigger('click');
      }
      await wrapper.findAll('header button').find((button) => button.text() === label)!.trigger('click');
      await flushPromises();
      expect(router.currentRoute.value.name).toBe('admin-overview');
      expect(openWindow).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
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
    scanStore.result = { ...makeAnalysis(91), evidence: makeEvidence() };
    scanStore.resultInputText = 'owner-a result original';
    scanStore.currentResultHistoryId = 'owner-a-result';
    scanStore.historyRecords.push(makeLocalRecord({ id: 'owner-a-history', inputText: 'owner-a secret', evidence: makeEvidence() }));
    for (const storage of [window.localStorage, window.sessionStorage]) {
      storage.setItem(HISTORY_STORAGE_KEY, 'legacy-global');
      storage.setItem(`${HISTORY_STORAGE_KEY}:v2:guest-a`, 'legacy-v2');
      storage.setItem('locale', 'zh-CN');
    }

    scanStore.clearScanSessionData();

    expect(scanStore.inputText).toBe('');
    expect(scanStore.editorHtml).toBe('');
    expect(scanStore.result).toBeNull();
    expect(scanStore.resultInputText).toBe('');
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
    scanStore.result = { ...makeAnalysis(82), evidence: makeEvidence() };
    scanStore.resultInputText = 'sid-a result original';
    scanStore.currentResultHistoryId = 'sid-a-result';
    scanStore.historyRecords.push(makeLocalRecord({ id: 'sid-a-history', inputText: 'sid-a secret' }));

    expect(scanStore.activateGuestSession('sid-a')).toBe(false);
    expect(scanStore.inputText).toBe('sid-a secret');
    expect(scanStore.result.evidence).toEqual(makeEvidence());
    expect(scanStore.resultInputText).toBe('sid-a result original');
    expect(scanStore.historyRecords).toHaveLength(1);

    expect(scanStore.activateGuestSession('sid-b')).toBe(true);
    expect(scanStore.inputText).toBe('');
    expect(scanStore.editorHtml).toBe('');
    expect(scanStore.result).toBeNull();
    expect(scanStore.resultInputText).toBe('');
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
    scanStore.resultInputText = 'sid-b result original';
    const sidBRecord = await scanStore.addHistoryRecord({
      id: 992,
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
      evidence: makeEvidence(),
    });

    await expect(pendingAnalysis).resolves.toBeNull();
    expect(scanStore.inputText).toBe('sid-b fresh draft');
    expect(scanStore.result?.summary.ai).toBe(17);
    expect(scanStore.resultInputText).toBe('sid-b result original');
    expect(scanStore.result.evidence).toBeUndefined();
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

  it('同一账号和 payload 的普通失败重试复用 Idempotency-Key', async () => {
    const authStore = setAuthenticatedSession();
    authStore.user = { id: 83 };
    const scanStore = useScanStore();
    const evidence = makeEvidence();
    const request = {
      functions: ['scan'],
      html: '<p>retryable detection text</p>',
    };
    scanApiMocks.detectText
      .mockRejectedValueOnce(Object.assign(new Error('temporary failure'), { status: 500, code: 'SERVER_ERROR' }))
      .mockResolvedValueOnce({
        inputText: 'retryable detection text',
        result: makeAnalysis(23),
        evidence,
      });

    await expect(scanStore.analyzeText('retryable detection text', request)).rejects.toThrow('temporary failure');
    const firstKey = scanApiMocks.detectText.mock.calls[0][2];
    expect(firstKey).toMatch(/^[0-9a-f-]{36}$/i);
    const serializedStorage = [window.localStorage, window.sessionStorage]
      .flatMap((storage) => getStorageEntries(storage).flat())
      .join('\n');
    expect(serializedStorage).not.toContain(firstKey);
    expect(serializedStorage).not.toContain('retryable detection text');

    await expect(scanStore.analyzeText('retryable detection text', request)).resolves.toMatchObject({
      summary: { ai: 23 },
      evidence,
    });
    expect(scanStore.result.evidence).toEqual(evidence);
    expect(scanApiMocks.detectText.mock.calls[1][2]).toBe(firstKey);
  });

  it('失败后开始新扫描，相同 payload 也会生成新 Idempotency-Key', async () => {
    const authStore = setAuthenticatedSession();
    authStore.user = { id: 91 };
    const scanStore = useScanStore();
    const request = {
      functions: ['scan'],
      html: '<p>same text in a new logical scan</p>',
    };
    scanApiMocks.detectText
      .mockRejectedValueOnce(new Error('first logical scan failed'))
      .mockResolvedValueOnce({ inputText: 'same text in a new logical scan', result: makeAnalysis(30) });

    await expect(scanStore.analyzeText('same text in a new logical scan', request)).rejects.toThrow(
      'first logical scan failed'
    );
    const firstKey = scanApiMocks.detectText.mock.calls[0][2];

    scanStore.resetAll();
    await scanStore.analyzeText('same text in a new logical scan', request);

    expect(scanApiMocks.detectText.mock.calls[1][2]).not.toBe(firstKey);
  });

  it('成功完成后相同 payload 的下一次逻辑扫描生成新 Idempotency-Key', async () => {
    const authStore = setAuthenticatedSession();
    authStore.user = { id: 84 };
    const scanStore = useScanStore();
    const request = {
      functions: ['scan'],
      html: '<p>repeatable successful text</p>',
    };
    scanApiMocks.detectText.mockResolvedValue({
      inputText: 'repeatable successful text',
      result: makeAnalysis(24),
    });

    await scanStore.analyzeText('repeatable successful text', request);
    await scanStore.analyzeText('repeatable successful text', request);

    expect(scanApiMocks.detectText.mock.calls[1][2]).not.toBe(scanApiMocks.detectText.mock.calls[0][2]);
  });

  it('失败后 payload 改变会生成新 Idempotency-Key', async () => {
    const authStore = setAuthenticatedSession();
    authStore.user = { id: 85 };
    const scanStore = useScanStore();
    scanApiMocks.detectText
      .mockRejectedValueOnce(new Error('first payload failed'))
      .mockResolvedValueOnce({ inputText: 'second payload text', result: makeAnalysis(25) });

    await expect(
      scanStore.analyzeText('first payload text', {
        functions: ['scan'],
        html: '<p>first payload text</p>',
      })
    ).rejects.toThrow('first payload failed');
    await scanStore.analyzeText('second payload text', {
      functions: ['scan'],
      html: '<p>second payload text</p>',
    });

    expect(scanApiMocks.detectText.mock.calls[1][2]).not.toBe(scanApiMocks.detectText.mock.calls[0][2]);
  });

  it('失败后账号主体改变会生成新 Idempotency-Key', async () => {
    const authStore = setAuthenticatedSession();
    authStore.user = { id: 86 };
    const scanStore = useScanStore();
    const request = {
      functions: ['scan'],
      html: '<p>same payload after actor switch</p>',
    };
    scanApiMocks.detectText
      .mockRejectedValueOnce(new Error('old actor failed'))
      .mockResolvedValueOnce({ inputText: 'same payload after actor switch', result: makeAnalysis(26) });

    await expect(scanStore.analyzeText('same payload after actor switch', request)).rejects.toThrow(
      'old actor failed'
    );
    authStore.user = { id: 87 };
    await scanStore.analyzeText('same payload after actor switch', request);

    expect(scanApiMocks.detectText.mock.calls[1][2]).not.toBe(scanApiMocks.detectText.mock.calls[0][2]);
  });

  it.each(['IDEMPOTENCY_KEY_CONFLICT', 'IDEMPOTENCY_RESULT_GONE'])(
    '%s 会清除旧 attempt，让相同 payload 的下一次扫描生成新 key',
    async (code) => {
      const authStore = setAuthenticatedSession();
      authStore.user = { id: 88 };
      const scanStore = useScanStore();
      const request = {
        functions: ['scan'],
        html: '<p>replace invalid idempotency attempt</p>',
      };
      scanApiMocks.detectText
        .mockRejectedValueOnce(Object.assign(new Error('invalid attempt'), { status: 409, code }))
        .mockResolvedValueOnce({ inputText: 'replace invalid idempotency attempt', result: makeAnalysis(27) });

      await expect(scanStore.analyzeText('replace invalid idempotency attempt', request)).rejects.toThrow(
        'invalid attempt'
      );
      await scanStore.analyzeText('replace invalid idempotency attempt', request);

      expect(scanApiMocks.detectText.mock.calls[1][2]).not.toBe(scanApiMocks.detectText.mock.calls[0][2]);
    }
  );

  it.each([
    ['DETECTION_IN_PROGRESS', '检测任务仍在处理中，请稍后重试。'],
    ['DETECTION_ACTOR_BUSY', '当前账号已有检测任务在处理中，请稍后重试。'],
  ])('%s 保留 key 并通过现有错误链显示明确消息', async (code, message) => {
    const authStore = setAuthenticatedSession();
    authStore.user = { id: 89 };
    const scanStore = useScanStore();
    const request = {
      functions: ['scan'],
      html: '<p>pending idempotent request</p>',
    };
    scanApiMocks.detectText
      .mockRejectedValueOnce(Object.assign(new Error('Request failed'), { status: 409, code }))
      .mockResolvedValueOnce({ inputText: 'pending idempotent request', result: makeAnalysis(28) });

    await expect(scanStore.analyzeText('pending idempotent request', request)).rejects.toThrow(message);
    expect(scanStore.analysisError?.message).toBe(message);
    await scanStore.analyzeText('pending idempotent request', request);

    expect(scanApiMocks.detectText.mock.calls[1][2]).toBe(scanApiMocks.detectText.mock.calls[0][2]);
  });

  it.each([
    [408, 'UNKNOWN_ERROR'],
    [0, 'NETWORK_ERROR'],
  ])('status=%s 的不确定失败重试复用 Idempotency-Key', async (status, code) => {
    const authStore = setAuthenticatedSession();
    authStore.user = { id: 90 };
    const scanStore = useScanStore();
    const request = {
      functions: ['scan'],
      html: '<p>ambiguous request result</p>',
    };
    scanApiMocks.detectText
      .mockRejectedValueOnce(Object.assign(new Error('ambiguous failure'), { status, code }))
      .mockResolvedValueOnce({ inputText: 'ambiguous request result', result: makeAnalysis(29) });

    await expect(scanStore.analyzeText('ambiguous request result', request)).rejects.toThrow('ambiguous failure');
    await scanStore.analyzeText('ambiguous request result', request);

    expect(scanApiMocks.detectText.mock.calls[1][2]).toBe(scanApiMocks.detectText.mock.calls[0][2]);
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
      items: [makeBackendRecord(makeLocalRecord({ inputText: 'stale owner text', evidence: makeEvidence() }), 404)],
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
    }, '');
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

  it('游客搜索、改名、置顶以服务器为准，新 Pinia 恢复真实 ID、正文和 Evidence，不读旧缓存', async () => {
    const scanStore = useScanStore();
    const matched = makeBackendRecord(makeLocalRecord({ title: 'Needle', inputText: 'needle text', evidence: makeEvidence() }), 801);
    const hidden = makeBackendRecord(makeLocalRecord({ title: 'Hidden', inputText: 'ordinary text' }), 802);
    historyMocks.getHistoryList.mockImplementation(async ({ q }) => ({ items: q ? [matched] : [matched, hidden] }));
    historyMocks.updateHistoryRecord.mockImplementation(async (id, changes) => {
      expect(id).toBe(matched.id);
      Object.assign(matched, changes);
      return matched;
    });
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([
      makeLocalRecord({ id: 'attacker', inputText: 'must not be read' }),
    ]));

    await scanStore.searchHistoryRecords({ q: 'needle' });
    expect(scanStore.historyRecords).toHaveLength(1);
    await scanStore.renameHistoryRecord(matched.id, 'Renamed');
    await scanStore.togglePinnedHistoryRecord(matched.id, true);
    setActivePinia(createPinia());
    const refreshedStore = useScanStore();
    expect(refreshedStore.historyRecords).toEqual([]);
    await refreshedStore.syncHistoryFromBackend();
    expect(refreshedStore.historyRecords).toHaveLength(2);
    expect(refreshedStore.historyRecords[0]).toMatchObject({ id: 801, title: 'Renamed', isPinned: true, inputText: 'needle text', evidence: makeEvidence() });
    expect(refreshedStore.historyRecords[1].id).toBe(802);
    expect(refreshedStore.loadHistoryRecord(refreshedStore.historyRecords[0])).toBe(true);
    expect(refreshedStore.result.evidence).toEqual(makeEvidence());
    expect(refreshedStore.inputText).toBe('needle text');
    expect(refreshedStore.historyRecords.some((record) => record.inputText === 'must not be read')).toBe(false);
    expect(historyMocks.updateHistoryRecord).toHaveBeenCalledWith(801, { title: 'Renamed' }, 'guest:sid-a:token');
    expect(historyMocks.updateHistoryRecord).toHaveBeenCalledWith(801, { is_pinned: true }, 'guest:sid-a:token');
    expect(historyMocks.getHistoryList).toHaveBeenLastCalledWith(expect.any(Object), 'guest:sid-a:token');
    expectNoHistoryStorage();
    for (const storage of [window.localStorage, window.sessionStorage]) {
      expect(JSON.stringify(getStorageEntries(storage))).not.toMatch(/needle text|evidence|sample text/);
    }
  });

  it.each(['rename', 'pin'])('游客 %s 更新期间切换搜索后，按当前搜索重查且不插回旧记录', async (operation) => {
    const scanStore = useScanStore();
    const oldRecord = makeBackendRecord(makeLocalRecord({ title: 'Old', inputText: 'old body' }), 841);
    const visibleRecord = makeBackendRecord(makeLocalRecord({ title: 'Current', inputText: 'current body' }), 842);
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [oldRecord] });
    await scanStore.searchHistoryRecords({ q: 'old' });

    const update = createDeferred<ReturnType<typeof makeBackendRecord>>();
    historyMocks.updateHistoryRecord.mockReturnValueOnce(update.promise);
    const saving = operation === 'rename'
      ? scanStore.renameHistoryRecord(oldRecord.id, 'Renamed')
      : scanStore.togglePinnedHistoryRecord(oldRecord.id, true);
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [visibleRecord] });
    await scanStore.searchHistoryRecords({ q: 'current' });
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [visibleRecord] });
    update.resolve({ ...oldRecord, ...(operation === 'rename' ? { title: 'Renamed' } : { is_pinned: true }) });

    expect(await saving).toMatchObject({ id: oldRecord.id });
    expect(scanStore.historyRecords.map((record) => record.id)).toEqual([visibleRecord.id]);
    expect(historyMocks.getHistoryList.mock.calls.map(([params]) => params.q)).toEqual(['old', 'current', 'current']);
  });

  it.each(['rename', 'pin'])('游客 %s 更新后不再匹配原筛选时，从服务端重查列表', async (operation) => {
    const scanStore = useScanStore();
    const record = makeBackendRecord(makeLocalRecord({
      title: 'Needle', inputText: 'ordinary body', isPinned: true,
    }), 843);
    const filter = operation === 'rename' ? { q: 'needle' } : { pinned: true };
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [record] });
    await scanStore.searchHistoryRecords(filter);
    historyMocks.updateHistoryRecord.mockResolvedValueOnce({
      ...record,
      ...(operation === 'rename' ? { title: 'Changed' } : { is_pinned: false }),
    });
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [] });

    if (operation === 'rename') await scanStore.renameHistoryRecord(record.id, 'Changed');
    else await scanStore.togglePinnedHistoryRecord(record.id, false);

    expect(scanStore.historyRecords).toEqual([]);
    expect(historyMocks.getHistoryList.mock.calls).toHaveLength(2);
    expect(historyMocks.getHistoryList.mock.calls[1][0]).toMatchObject(filter);
  });

  it('游客批量删除保留失败项，清空使用服务器结果且不创建历史 Storage', async () => {
    const scanStore = useScanStore();
    const first = makeBackendRecord(makeLocalRecord({ inputText: 'first text' }), 811);
    const second = makeBackendRecord(makeLocalRecord({ inputText: 'second text' }), 812);
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [first, second] });
    await scanStore.syncHistoryFromBackend();
    historyMocks.batchDeleteHistoryRecords.mockResolvedValueOnce({ deleted_count: 1, failed_ids: [812] });
    expect(await scanStore.batchDeleteHistoryRecords([811, 812])).toEqual({ deletedCount: 1, failedIds: [812] });
    expect(historyMocks.batchDeleteHistoryRecords).toHaveBeenCalledWith([811, 812], 'guest:sid-a:token');
    expect(scanStore.historyRecords).toHaveLength(1);
    expect(scanStore.historyRecords[0].id).toBe(812);
    historyMocks.clearAllHistory.mockResolvedValueOnce({ deletedCount: 7 });
    expect(await scanStore.clearAllHistoryRecords()).toEqual({ deletedCount: 7 });
    expect(historyMocks.clearAllHistory).toHaveBeenCalledWith('guest:sid-a:token');
    setActivePinia(createPinia());
    await useScanStore().syncHistoryFromBackend();
    expect(useScanStore().historyRecords).toEqual([]);
    expectNoHistoryStorage();
  });

  it.each(['new-record', 'other-record', 'empty'])('清空请求期间新检测完成后，以服务端最终 %s 列表为准', async (outcome) => {
    const scanStore = useScanStore();
    const oldRecord = makeBackendRecord(makeLocalRecord({ inputText: 'old result' }), 813);
    const newRecord = makeBackendRecord(makeLocalRecord({ inputText: 'new result' }), 814);
    const otherRecord = makeBackendRecord(makeLocalRecord({ inputText: 'other result' }), 817);
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [oldRecord] });
    await scanStore.syncHistoryFromBackend();

    const clear = createDeferred<{ deleted_count: number }>();
    historyMocks.clearAllHistory.mockReturnValueOnce(clear.promise);
    const clearing = scanStore.clearAllHistoryRecords();
    scanApiMocks.detectText.mockResolvedValueOnce({ historyId: newRecord.id, result: makeAnalysis() });
    await scanStore.analyzeText('new result', { guestToken: 'guest:sid-a:token' });
    expect(scanStore.currentResultHistoryId).toBe(newRecord.id);

    const serverRecords = outcome === 'new-record' ? [newRecord] : outcome === 'other-record' ? [otherRecord] : [];
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: serverRecords });
    clear.resolve({ deleted_count: 1 });
    await clearing;

    expect(scanStore.historyRecords.map((record) => record.id)).toEqual(serverRecords.map((record) => record.id));
    expect(scanStore.currentResultHistoryId).toBe(outcome === 'new-record' ? newRecord.id : null);
    expect(scanStore.result?.summary).toEqual({ ai: 12, human: 88 });
  });

  it('清空与新检测并发重查后仍保留当前搜索筛选', async () => {
    const scanStore = useScanStore();
    const oldRecord = makeBackendRecord(makeLocalRecord({ inputText: 'old result' }), 815);
    const newRecord = makeBackendRecord(makeLocalRecord({ inputText: 'new result' }), 816);
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [oldRecord] });
    await scanStore.searchHistoryRecords({ q: 'old' });

    const clear = createDeferred<{ deleted_count: number }>();
    historyMocks.clearAllHistory.mockReturnValueOnce(clear.promise);
    const clearing = scanStore.clearAllHistoryRecords();
    scanApiMocks.detectText.mockResolvedValueOnce({ historyId: newRecord.id, result: makeAnalysis() });
    await scanStore.analyzeText('new result', { guestToken: 'guest:sid-a:token' });

    historyMocks.getHistoryList
      .mockResolvedValueOnce({ items: [newRecord] })
      .mockResolvedValueOnce({ items: [] });
    clear.resolve({ deleted_count: 1 });
    await clearing;

    expect(historyMocks.getHistoryList.mock.calls.map(([params]) => params.q)).toEqual(['old', undefined, 'old']);
    expect(scanStore.historyRecords).toEqual([]);
    expect(scanStore.currentResultHistoryId).toBe(newRecord.id);
  });

  it.each(['success', 'failure'])('游客列表搜索反序返回时只采纳最后查询，旧 %s 不覆盖新状态', async (outcome) => {
    const scanStore = useScanStore();
    const first = createDeferred<{ items: ReturnType<typeof makeBackendRecord>[] }>();
    historyMocks.getHistoryList.mockReturnValueOnce(first.promise);
    const pending = scanStore.searchHistoryRecords({ q: 'first' });
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [makeBackendRecord(makeLocalRecord({ title: 'last' }), 821)] });
    await scanStore.searchHistoryRecords({ q: 'last' });
    if (outcome === 'failure') first.reject(new Error('old query failed'));
    else first.resolve({ items: [makeBackendRecord(makeLocalRecord({ title: 'first' }), 820)] });
    await pending;
    expect(scanStore.historyRecords.map((record) => record.id)).toEqual([821]);
    expect(scanStore.historyLoadFailed).toBe(false);
    expect(scanStore.isHistoryLoading).toBe(false);
  });

  it('旧详情请求在新搜索完成后仍返回详情，但不插入新搜索列表', async () => {
    const scanStore = useScanStore();
    const first = makeBackendRecord(makeLocalRecord({ title: 'First', inputText: 'first text' }), 823);
    const second = makeBackendRecord(makeLocalRecord({ title: 'Second', inputText: 'second text' }), 824);
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [first] });
    await scanStore.searchHistoryRecords({ q: 'first' });

    const detail = createDeferred<ReturnType<typeof makeBackendRecord>>();
    historyMocks.getHistoryRecord.mockReturnValueOnce(detail.promise);
    const pendingDetail = scanStore.fetchHistoryRecordDetail(first.id);
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [second] });
    await scanStore.searchHistoryRecords({ q: 'second' });

    detail.resolve(first);
    expect(await pendingDetail).toMatchObject({ id: first.id, inputText: 'first text' });
    expect(scanStore.historyRecords.map((record) => record.id)).toEqual([second.id]);
  });

  it('首次历史列表加载期间完成检测，会重查并同时显示旧记录与新记录', async () => {
    const scanStore = useScanStore();
    const oldRecord = makeBackendRecord(makeLocalRecord({ inputText: 'old result' }), 826);
    const newRecord = makeBackendRecord(makeLocalRecord({
      inputText: 'new result', createdAt: '2026-09-29T00:00:00.000Z',
    }), 827);
    const stale = createDeferred<{ items: ReturnType<typeof makeBackendRecord>[] }>();
    const fresh = createDeferred<{ items: ReturnType<typeof makeBackendRecord>[] }>();
    historyMocks.getHistoryList.mockReturnValueOnce(stale.promise).mockReturnValueOnce(fresh.promise);

    const pending = scanStore.syncHistoryFromBackend();
    scanApiMocks.detectText.mockResolvedValueOnce({ historyId: 827, result: makeAnalysis() });
    await scanStore.analyzeText('new result', { guestToken: 'guest:sid-a:token' });
    stale.resolve({ items: [oldRecord] });
    await vi.waitFor(() => expect(historyMocks.getHistoryList).toHaveBeenCalledTimes(2));
    expect(scanStore.isHistoryLoading).toBe(true);

    fresh.resolve({ items: [newRecord, oldRecord] });
    await pending;
    expect(scanStore.historyRecords.map((item) => item.id)).toEqual([827, 826]);
    expect(scanStore.isHistoryLoading).toBe(false);
    expect(scanStore.historyLoadFailed).toBe(false);
  });

  it('列表修订后旧请求失败仍按原搜索与置顶条件重查', async () => {
    const scanStore = useScanStore();
    const stale = createDeferred<{ items: ReturnType<typeof makeBackendRecord>[] }>();
    const fresh = createDeferred<{ items: ReturnType<typeof makeBackendRecord>[] }>();
    historyMocks.getHistoryList.mockReturnValueOnce(stale.promise).mockReturnValueOnce(fresh.promise);
    const pending = scanStore.syncHistoryFromBackend({ q: '  needle  ', pinned: true, strict: true });

    scanApiMocks.detectText.mockResolvedValueOnce({ historyId: 828, result: makeAnalysis() });
    await scanStore.analyzeText('new result', { guestToken: 'guest:sid-a:token' });
    stale.reject(new Error('stale request failed'));
    await vi.waitFor(() => expect(historyMocks.getHistoryList).toHaveBeenCalledTimes(2));
    fresh.resolve({ items: [makeBackendRecord(makeLocalRecord({
      title: 'needle', inputText: 'needle result', isPinned: true,
    }), 829)] });

    await pending;
    expect(scanStore.historyRecords.map((item) => item.id)).toEqual([829]);
    expect(scanStore.historyLoadFailed).toBe(false);
    expect(historyMocks.getHistoryList.mock.calls.map(([params]) => params)).toEqual([
      expect.objectContaining({ q: 'needle', pinned: true }),
      expect.objectContaining({ q: 'needle', pinned: true }),
    ]);
  });

  it.each(['delete', 'detect'])('游客 %s 成功后，旧列表响应不能复活删除项或抹掉新检测', async (operation) => {
    const scanStore = useScanStore();
    const record = makeBackendRecord(makeLocalRecord(), 831);
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [record] });
    await scanStore.syncHistoryFromBackend();
    const first = createDeferred<{ items: ReturnType<typeof makeBackendRecord>[] }>();
    historyMocks.getHistoryList.mockReturnValueOnce(first.promise);
    const pending = scanStore.syncHistoryFromBackend();
    if (operation === 'delete') {
      historyMocks.deleteHistoryRecord.mockResolvedValueOnce(undefined);
      expect(await scanStore.deleteHistoryRecord(831)).toBe(true);
      expect(historyMocks.deleteHistoryRecord).toHaveBeenCalledWith(831, 'guest:sid-a:token');
    } else {
      scanApiMocks.detectText.mockResolvedValue({ historyId: 832, result: makeAnalysis(), evidence: makeEvidence() });
      await scanStore.analyzeText('new result', { guestToken: 'guest:sid-a:token' });
      await scanStore.analyzeText('new result', { guestToken: 'guest:sid-a:token' });
    }
    historyMocks.getHistoryList.mockResolvedValueOnce({
      items: operation === 'delete' ? [] : [makeBackendRecord(makeLocalRecord({
        inputText: 'new result', createdAt: '2026-09-29T00:00:00.000Z',
      }), 832), record],
    });
    first.resolve({ items: [record] });
    await pending;
    expect(scanStore.historyRecords.map((item) => item.id)).toEqual(operation === 'delete' ? [] : [832, 831]);
    expect(historyMocks.getHistoryList).toHaveBeenCalledTimes(3);
  });

  it.each(['sid', 'login'])('游客历史读取在 %s 切换后丢弃旧响应，发出的 Bearer 保持原值', async (change) => {
    const scanStore = useScanStore();
    const deferred = createDeferred<{ items: ReturnType<typeof makeBackendRecord>[] }>();
    historyMocks.getHistoryList.mockReturnValueOnce(deferred.promise);
    const pending = scanStore.syncHistoryFromBackend();
    expect(historyMocks.getHistoryList).toHaveBeenLastCalledWith(expect.any(Object), 'guest:sid-a:token');
    if (change === 'sid') {
      window.localStorage.setItem('guest_token', 'guest:sid-b:token');
      scanStore.activateGuestSession('sid-b');
    } else {
      setAuthenticatedSession().user = { id: 123 };
    }
    const freshRecord = makeLocalRecord({ id: 841, inputText: 'new actor text' });
    scanStore.historyRecords = [freshRecord];
    deferred.resolve({ items: [makeBackendRecord(makeLocalRecord({ inputText: 'old secret' }), 842)] });
    await pending;
    expect(scanStore.historyRecords).toEqual([freshRecord]);
  });

  it('缺少或错配游客 token 时不发历史请求，失败保留已有记录并支持重试', async () => {
    const scanStore = useScanStore();
    const record = makeLocalRecord({ id: 851 });
    scanStore.historyRecords = [record];
    window.localStorage.setItem('guest_token', 'guest:sid-b:token');
    await scanStore.syncHistoryFromBackend();
    expect(historyMocks.getHistoryList).not.toHaveBeenCalled();
    expect(scanStore.historyLoadFailed).toBe(true);
    expect(scanStore.historyRecords).toEqual([record]);
    window.localStorage.setItem('guest_token', 'guest:sid-a:refreshed');
    historyMocks.getHistoryList.mockResolvedValueOnce({ items: [makeBackendRecord(record, 851)] });
    await scanStore.syncHistoryFromBackend();
    expect(historyMocks.getHistoryList).toHaveBeenLastCalledWith(expect.any(Object), 'guest:sid-a:refreshed');
    expect(scanStore.historyLoadFailed).toBe(false);
  });
});
