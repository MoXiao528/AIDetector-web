import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { globalT } from '../i18n';
import { fetchScanExamples } from '../api/modules/examples';
import { detectText } from '../api/modules/scan';
import { combineImportedFileContents, readTextFromFile } from '../utils/fileReaders';
import { clampProbability } from '../utils/detectionStyles';
import {
  buildHighlightedPreviewHtml,
  extractTextFromHtml,
  hasParagraphRange,
  plainTextToHtml,
} from '../utils/editorContent';
import { getFallbackHeroExamples, getFallbackUsageExamples } from '../utils/usageExamples';
import { useAuthStore } from './auth';
import {
  getHistoryList,
  getHistoryRecord,
  createHistoryRecord,
  updateHistoryRecord,
  deleteHistoryRecord,
  batchDeleteHistoryRecords,
  clearAllHistory,
} from '../api/modules/history';

const validFunctionKeys = ['scan'];
const CHARACTER_LIMIT = 10000;
const STORAGE_KEY = 'ai-detector-scan-draft';
const HISTORY_STORAGE_KEY = 'ai-detector-history-records';
const EXAMPLES_LOCALE_STORAGE_KEY = 'locale';
const DEFAULT_EXAMPLES_LOCALE = 'zh-CN';

const resolveExamplesLocale = (locale = DEFAULT_EXAMPLES_LOCALE) => {
  if (locale === 'zh-CN' || locale === 'en-US') return locale;
  return locale?.startsWith?.('zh') ? 'zh-CN' : 'en-US';
};

const getInitialExamplesLocale = () => {
  if (typeof window === 'undefined') return DEFAULT_EXAMPLES_LOCALE;
  return resolveExamplesLocale(window.localStorage.getItem(EXAMPLES_LOCALE_STORAGE_KEY) || DEFAULT_EXAMPLES_LOCALE);
};

const splitParagraphTokens = (text = '') =>
  String(text)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((raw) => ({ raw, text: raw.trim() }));

const labelToTypeMap = {
  AI: 'ai',
  Human: 'human',
  Mixed: 'mixed',
};

const parseSummaryValue = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeSummary = ({ summary, sentences, score }) => {
  const parsed = {
    ai: parseSummaryValue(summary?.ai),
    mixed: parseSummaryValue(summary?.mixed),
    human: parseSummaryValue(summary?.human),
  };
  const hasParsed = Object.values(parsed).every((value) => typeof value === 'number' && Number.isFinite(value));
  if (hasParsed) {
    const total = parsed.ai + parsed.mixed + parsed.human;
    if (total !== 100) {
      parsed.human = Math.max(0, parsed.human - (total - 100));
    }
    return parsed;
  }

  if (sentences.length) {
    const counts = sentences.reduce(
      (acc, sentence) => {
        acc[sentence.type] += 1;
        return acc;
      },
      { ai: 0, mixed: 0, human: 0 }
    );
    const total = sentences.length;
    const computed = {
      ai: Math.round((counts.ai / total) * 100),
      mixed: Math.round((counts.mixed / total) * 100),
      human: Math.round((counts.human / total) * 100),
    };
    const diff = computed.ai + computed.mixed + computed.human - 100;
    if (diff !== 0) {
      computed.human = Math.max(0, computed.human - diff);
    }
    return computed;
  }

  const safeScore = typeof score === 'number' && Number.isFinite(score) ? Math.max(0, Math.min(score, 100)) : 0;
  return {
    ai: safeScore,
    mixed: 0,
    human: Math.max(0, 100 - safeScore),
  };
};

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null);

const normalizeScorePercent = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value >= 0 && value <= 1) {
    return Math.round(value * 100);
  }
  return Math.max(0, Math.min(Math.round(value), 100));
};

const resolveSentenceType = (sentence, fallbackType = 'human') => {
  if (['ai', 'mixed', 'human'].includes(sentence?.type)) {
    return sentence.type;
  }
  if (sentence?.label && labelToTypeMap[sentence.label]) {
    return labelToTypeMap[sentence.label];
  }
  return fallbackType;
};

const buildFallbackSentences = ({ text = '', score = null, label = '', idPrefix = 'analysis' }) => {
  const normalizedText = String(text || '').trim();
  if (!normalizedText) return [];

  const scorePercent = normalizeScorePercent(score) ?? 0;
  const fallbackType = labelToTypeMap[label] || (scorePercent >= 70 ? 'ai' : scorePercent >= 40 ? 'mixed' : 'human');
  const probability = clampProbability(scorePercent / 100);

  return splitParagraphTokens(normalizedText)
    .filter((token) => token.text)
    .map((token, index) => ({
      id: `${idPrefix}-paragraph-${index}`,
      text: token.text,
      raw: token.text,
      startParagraph: index + 1,
      endParagraph: index + 1,
      type: fallbackType,
      probability,
      score: scorePercent,
      reason: '',
      suggestion: '',
    }));
};

const normalizeAnalysisPayload = (
  rawAnalysis,
  { fallbackText = '', idPrefix = 'analysis', fallbackScore = null, fallbackLabel = '' } = {}
) => {
  const source = rawAnalysis?.analysis || rawAnalysis || {};
  let sentences = Array.isArray(source?.sentences)
    ? source.sentences.map((sentence, index) => {
      const score = normalizeScorePercent(pickFirst(sentence?.score, sentence?.probability, sentence?.ai)) ?? 0;
      const probabilityValue = pickFirst(
        typeof sentence?.probability === 'number' ? sentence.probability : null,
        score / 100
      );
      return {
        id: sentence?.id || `${idPrefix}-paragraph-${index}`,
        text: sentence?.text || '',
        raw: pickFirst(sentence?.raw, sentence?.text, ''),
        startParagraph: pickFirst(sentence?.startParagraph, sentence?.start_paragraph, null),
        endParagraph: pickFirst(sentence?.endParagraph, sentence?.end_paragraph, null),
        type: resolveSentenceType(sentence),
        probability: clampProbability(probabilityValue || 0),
        score,
        reason: pickFirst(sentence?.reason, sentence?.suggestion, ''),
        suggestion: pickFirst(sentence?.suggestion, sentence?.reason, ''),
      };
    })
    : [];

  if (!sentences.length) {
    sentences = buildFallbackSentences({
      text: fallbackText,
      score: pickFirst(source?.score, fallbackScore),
      label: pickFirst(source?.label, fallbackLabel, ''),
      idPrefix,
    });
  }

  const summary = normalizeSummary({
    summary: source?.summary,
    sentences,
    score: pickFirst(source?.score, fallbackScore),
  });
  const paragraphCount = splitParagraphTokens(fallbackText).filter((item) => item.text).length;
  const canRebuildHighlight =
    Boolean(fallbackText) && Boolean(sentences.length) && (sentences.every((item) => hasParagraphRange(item)) || paragraphCount === sentences.length);
  const highlightedHtml = canRebuildHighlight
    ? buildHighlightedPreviewHtml({
      fallbackText,
      sentences,
      fallbackHighlightedHtml: pickFirst(source?.highlightedHtml, source?.highlighted_html),
    })
    : pickFirst(source?.highlightedHtml, source?.highlighted_html) ||
      buildHighlightedPreviewHtml({
        fallbackText,
        sentences,
      });

  return {
    summary,
    sentences,
    translation: pickFirst(source?.translation, ''),
    polish: Array.isArray(source?.polish)
      ? source.polish.map((entry) => entry?.suggestion || entry?.text || '').filter(Boolean).join('\n\n')
      : pickFirst(source?.polish, ''),
    citations: Array.isArray(source?.citations)
      ? source.citations.map((item, index) => ({
        id: item?.id || `${idPrefix}-citation-${index}`,
        text: pickFirst(item?.text, item?.excerpt, ''),
        source: pickFirst(item?.source, item?.note, item?.status, ''),
      }))
      : [],
    aiLikelyCount:
      pickFirst(source?.aiLikelyCount, source?.ai_likely_count) ??
      sentences.filter((item) => item.type === 'ai' || item.type === 'mixed').length,
    highlightedHtml,
  };
};

const normalizeFunctions = (functions) => {
  if (!Array.isArray(functions)) return ['scan'];
  const normalized = functions.filter((item) => validFunctionKeys.includes(item));
  return normalized.length ? normalized : ['scan'];
};

const normalizeHistoryRecordPayload = (record) => {
  if (!record) return null;
  const inputTextValue = pickFirst(record.inputText, record.input_text, '');
  const recordId = pickFirst(record.id, record.historyId, record.history_id);

  return {
    id: recordId,
    title: pickFirst(record.title, ''),
    exampleKey: pickFirst(record.exampleKey, record.example_key, ''),
    createdAt: pickFirst(record.createdAt, record.created_at, new Date().toISOString()),
    functions: normalizeFunctions(pickFirst(record.functions, record.functions_used)),
    inputText: inputTextValue,
    editorHtml: pickFirst(record.editorHtml, record.editor_html, plainTextToHtml(inputTextValue)),
    analysis: normalizeAnalysisPayload(pickFirst(record.analysis, record.result), {
      fallbackText: inputTextValue,
      idPrefix: `history-${recordId || 'record'}`,
      fallbackScore: pickFirst(record.score, record.raw_score),
      fallbackLabel: pickFirst(record.label, ''),
    }),
  };
};

const buildSeedHistoryAnalysis = ({ summary, sentences, translation = '', polish = '', citations = [] }) => {
  const normalizedSentences = sentences.map((item, index) => ({
    id: item.id || `seed-paragraph-${index}`,
    text: item.text,
    raw: item.raw || item.text,
    startParagraph: pickFirst(item.startParagraph, item.start_paragraph, index + 1),
    endParagraph: pickFirst(item.endParagraph, item.end_paragraph, index + 1),
    type: item.type,
    probability: clampProbability(item.probability ?? 0.5),
    reason: item.reason,
  }));
  const aiLikelyCount = normalizedSentences.filter((item) => item.type === 'ai' || item.type === 'mixed').length;
  const highlightedHtml = buildHighlightedPreviewHtml({
    fallbackText: normalizedSentences.map((item) => item.raw || item.text || '').join('\n'),
    sentences: normalizedSentences,
  });
  return {
    summary,
    sentences: normalizedSentences,
    translation,
    polish,
    citations,
    aiLikelyCount,
    highlightedHtml,
  };
};

const seedHistoryRecords = [];

export const useScanStore = defineStore('scan', () => {
  const authStore = useAuthStore();
  const examplesLocale = ref(getInitialExamplesLocale());
  const examples = ref(getFallbackHeroExamples(examplesLocale.value));
  const usageExamples = ref(getFallbackUsageExamples(examplesLocale.value));
  const hasLoadedExamples = ref(false);
  const isLoadingExamples = ref(false);
  const inputText = ref('');
  const editorHtml = ref('');
  const selectedExampleKey = ref('');
  const isUploading = ref(false);
  const uploadError = ref('');
  const lastUploadedFileName = ref('');
  const selectedFunctions = ref(['scan']);
  const historyRecords = ref([...seedHistoryRecords]);
  const result = ref(null);
  const currentResultHistoryId = ref(null);
  const analysisError = ref({ type: '', message: '' });
  let isRestoring = false;
  let isHydratingHistory = false;
  let skipNextHistoryPersist = false;

  const characterCount = computed(() => inputText.value.length);

  const isGenericHistoryTitle = (value = '') => {
    const rawValue = String(value || '').trim();
    const normalized = rawValue.toLowerCase();
    if (!normalized) return true;
    return (
      normalized === String(globalT('scan.history.recordFallback') || '').trim().toLowerCase() ||
      /^scan record(?:\s*[·-]\s*.*)?$/i.test(rawValue) ||
      /^扫描记录(?:\s*[·-]\s*.*)?$/u.test(rawValue)
    );
  };

  const resolveExampleHistoryTitle = (key) => {
    if (!key) return '';
    const matchedHeroExample = examples.value.find((item) => item.key === key);
    if (matchedHeroExample) {
      return matchedHeroExample.label || '';
    }
    const matchedUsageExample = usageExamples.value.find((item) => item.key === key);
    return matchedUsageExample?.title || '';
  };

  const buildHistoryRecordTitle = ({ title = '', exampleKey = '' } = {}) => {
    const trimmedTitle = String(title || '').trim();
    if (trimmedTitle && !isGenericHistoryTitle(trimmedTitle)) {
      return trimmedTitle;
    }

    return resolveExampleHistoryTitle(exampleKey).trim();
  };

  const resolveHistoryRecordTitle = (record, fallbackTitle = '') => {
    const normalizedTitle = buildHistoryRecordTitle({
      title: record?.title,
      exampleKey: pickFirst(record?.exampleKey, record?.example_key, ''),
    });
    if (normalizedTitle) {
      return normalizedTitle;
    }

    return String(globalT('scan.history.recordFallback') || fallbackTitle || '').trim();
  };

  const setText = (value) => {
    const normalized = value || '';
    inputText.value = normalized;
    editorHtml.value = plainTextToHtml(normalized);
    selectedExampleKey.value = '';
  };

  const setImportedContent = ({ text = '', html = '' } = {}) => {
    inputText.value = text || '';
    editorHtml.value = html || plainTextToHtml(text || '');
    selectedExampleKey.value = '';
  };

  const setInputText = (value) => {
    setText(value);
  };

  const clearSelectedExample = () => {
    selectedExampleKey.value = '';
  };

  const setEditorHtml = (value = '') => {
    editorHtml.value = value || '';
    inputText.value = extractTextFromHtml(editorHtml.value);
    selectedExampleKey.value = '';
  };

  const applyExample = (key) => {
    const matched = examples.value.find((item) => item.key === key);
    if (!matched) return '';
    inputText.value = matched.content;
    editorHtml.value = plainTextToHtml(matched.content);
    selectedExampleKey.value = matched.key;
    lastUploadedFileName.value = '';
    return matched.content;
  };

  const loadExamples = async (locale = DEFAULT_EXAMPLES_LOCALE) => {
    const nextLocale = resolveExamplesLocale(locale);
    if ((hasLoadedExamples.value || isLoadingExamples.value) && examplesLocale.value === nextLocale) {
      return;
    }

    examplesLocale.value = nextLocale;
    examples.value = getFallbackHeroExamples(nextLocale);
    usageExamples.value = getFallbackUsageExamples(nextLocale);
    isLoadingExamples.value = true;

    try {
      const response = await fetchScanExamples(nextLocale);
      if (Array.isArray(response?.heroExamples) && response.heroExamples.length) {
        examples.value = response.heroExamples;
      }
      if (Array.isArray(response?.usageExamples) && response.usageExamples.length) {
        usageExamples.value = response.usageExamples;
      }
    } catch {
      // Fallback examples are already prepared locally.
    } finally {
      hasLoadedExamples.value = true;
      isLoadingExamples.value = false;
    }
  };

  const readFile = async (file) => {
    if (!file) return;
    await readFiles([file]);
  };

  const readFiles = async (files) => {
    const fileList = Array.from(files || []).filter(Boolean);
    if (!fileList.length) return;
    isUploading.value = true;
    uploadError.value = '';
    try {
      const contents = [];
      for (const current of fileList) {
        // eslint-disable-next-line no-await-in-loop
        const content = await readTextFromFile(current);
        contents.push(content);
      }
      const combined = combineImportedFileContents(contents);
      setImportedContent(combined);
      lastUploadedFileName.value =
        fileList.length === 1 ? fileList[0].name : `${fileList[0].name} 等 ${fileList.length} 个文件`;
    } catch (error) {
      uploadError.value = error.message || globalT('errors.fileParseError');
      throw error;
    } finally {
      isUploading.value = false;
    }
  };

  const resetError = () => {
    uploadError.value = '';
  };

  const toggleFunction = (key) => {
    if (!validFunctionKeys.includes(key)) return;
    const current = new Set(selectedFunctions.value);
    if (current.has(key)) {
      current.delete(key);
    } else {
      current.add(key);
    }

    if (current.size === 0) {
      current.add('scan');
    }

    selectedFunctions.value = Array.from(current);
  };

  const setFunctions = (functions = []) => {
    const next = Array.from(
      new Set(functions.filter((item) => typeof item === 'string' && validFunctionKeys.includes(item)))
    );
    selectedFunctions.value = next.length ? next : ['scan'];
  };

  const resetFunctions = () => {
    selectedFunctions.value = ['scan'];
  };

  const resetText = () => {
    inputText.value = '';
    editorHtml.value = '';
    selectedExampleKey.value = '';
    lastUploadedFileName.value = '';
    resetError();
  };

  const resetAll = () => {
    resetText();
    resetFunctions();
  };

  const resetResult = () => {
    result.value = null;
    currentResultHistoryId.value = null;
    analysisError.value = null;
  };

  const resetAnalysisError = () => {
    analysisError.value = { type: '', message: '' };
  };

  const clearPersistedLocalHistory = () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Local cache may already be unavailable.
    }
  };

  const isDisplayableHistoryRecord = (record) => {
    const text = typeof record?.inputText === 'string' ? record.inputText : record?.input_text;
    return Boolean(text && text.trim());
  };

  const persistHistory = () => {
    if (typeof window === 'undefined') return;
    if (skipNextHistoryPersist) {
      skipNextHistoryPersist = false;
      return;
    }
    clearPersistedLocalHistory();
  };

  const hydrateHistory = () => {
    if (typeof window === 'undefined') return;

    // 已登录用户只从后端同步历史；游客历史不再落本地持久化
    if (authStore.isAuthenticated) {
      syncHistoryFromBackend();
      return;
    }

    clearPersistedLocalHistory();
    historyRecords.value = [];
  };

  const syncHistoryFromBackend = async () => {
    if (!authStore.isAuthenticated) {
      return [];
    }

    try {
      const response = await getHistoryList({ page: 1, per_page: 100, sort: 'created_at', order: 'desc' });
      const items = response?.items || response?.Items || [];
      const backendRecords = items
        .map((item) => {
          const normalized = normalizeHistoryRecordPayload(item);
          if (!normalized) return null;
          return {
            ...normalized,
            title: buildHistoryRecordTitle({
              title: normalized.title,
              exampleKey: normalized.exampleKey,
            }),
          };
        })
        .filter((item) => isDisplayableHistoryRecord(item));

      isHydratingHistory = true;
      historyRecords.value = backendRecords;
      clearPersistedLocalHistory();
      return backendRecords;
    } catch {
      return [];
    } finally {
      isHydratingHistory = false;
    }
  };

  const fetchHistoryRecordDetail = async (id) => {
    if (!id || !authStore.isAuthenticated) return;
    try {
      const record = await getHistoryRecord(id);
      if (!record) return;
      const normalized = normalizeHistoryRecordPayload(record);
      const fullRecord = normalized
        ? {
          ...normalized,
          title: buildHistoryRecordTitle({
            title: normalized.title,
            exampleKey: normalized.exampleKey,
          }),
        }
        : null;
      if (!fullRecord) return null;

      const index = historyRecords.value.findIndex((item) => String(item.id) === String(fullRecord.id));
      if (index === -1) {
        historyRecords.value = [fullRecord, ...historyRecords.value];
      } else {
        historyRecords.value[index] = fullRecord;
        historyRecords.value = [...historyRecords.value];
      }
      return fullRecord;
    } catch {
      return null;
    }
  };

  const migrateLocalStorageToBackend = async () => {
    clearPersistedLocalHistory();
  };

  const clearHistoryRecords = ({ preserveLocalCache = false } = {}) => {
    if (preserveLocalCache) {
      skipNextHistoryPersist = true;
    }
    historyRecords.value = [];
    if (!preserveLocalCache) {
      clearPersistedLocalHistory();
    }
  };

  // 工具函数：将前端 analysis 对象转换为后端所需的 snake_case 格式
  const mapAnalysisToBackend = (analysis) => {
    if (!analysis) return null;
    return {
      summary: analysis.summary || { ai: 0, mixed: 0, human: 0 },
      sentences: (analysis.sentences || []).map(s => ({
        id: s.id,
        text: s.text,
        raw: s.raw,
        start_paragraph: pickFirst(s.startParagraph, s.start_paragraph, null),
        end_paragraph: pickFirst(s.endParagraph, s.end_paragraph, null),
        type: s.type,
        probability: s.probability,
        score: s.score,
        reason: s.reason,
        suggestion: s.suggestion
      })),
      translation: analysis.translation || '',
      polish: Array.isArray(analysis.polish) ? analysis.polish.join('\n\n') : (analysis.polish || ''),
      citations: (analysis.citations || []).map(c => ({
        id: c.id,
        text: c.text,
        source: c.source
      })),
      ai_likely_count: analysis.aiLikelyCount ?? analysis.ai_likely_count ?? 0,
      highlighted_html: analysis.highlightedHtml ?? analysis.highlighted_html ?? '',
    };
  };

  const addHistoryRecord = async ({ title, text, html, functions = [], analysis }) => {
    if (!text || !text.trim()) {
      return null;
    }

    const normalizedFunctions = Array.from(
      new Set(functions.filter((item) => typeof item === 'string' && validFunctionKeys.includes(item)))
    );
    // 本地状态使用的 camelCase 对象
    const recordAnalysis = analysis
      ? {
        ...analysis,
        summary: analysis.summary || { ai: 0, mixed: 0, human: 0 },
        sentences: (analysis.sentences || []).map((sentence, index) => ({
          id: sentence.id || `history-new-paragraph-${index}`,
          text: sentence.text || '',
          raw: sentence.raw || sentence.text || '',
          startParagraph: pickFirst(sentence.startParagraph, sentence.start_paragraph, index + 1),
          endParagraph: pickFirst(sentence.endParagraph, sentence.end_paragraph, index + 1),
          type: ['ai', 'mixed', 'human'].includes(sentence.type)
            ? sentence.type
            : labelToTypeMap[sentence.label] || 'human',
          probability: clampProbability(
            typeof sentence.probability === 'number' ? sentence.probability : Number(sentence.score || 0) / 100
          ),
          score: typeof sentence.score === 'number' ? sentence.score : Number(sentence.score || 0),
          reason: sentence.reason || sentence.suggestion || '',
          suggestion: sentence.suggestion || sentence.reason || '',
        })),
        translation: analysis.translation || '',
        polish: Array.isArray(analysis.polish)
          ? analysis.polish.map((entry) => entry?.suggestion).filter(Boolean).join('\n\n')
          : analysis.polish || '',
        citations: Array.isArray(analysis.citations)
          ? analysis.citations.map((entry, index) => ({
            id: entry.id || `history-new-citation-${index}`,
            text: entry.text || entry.excerpt || '',
            source: entry.source || entry.note || entry.status || '',
          }))
          : [],
        aiLikelyCount:
          typeof analysis.aiLikelyCount === 'number'
            ? analysis.aiLikelyCount
            : (analysis.sentences || []).filter((item) => item.type === 'ai' || item.type === 'mixed').length,
        highlightedHtml: analysis.highlightedHtml || '',
      }
      : null;

    const recordTitle =
      buildHistoryRecordTitle({
        title: title && title.trim() ? title.trim() : '',
        exampleKey: selectedExampleKey.value,
      });

    // 发送给后端的 snake_case 对象
    const recordData = {
      title: recordTitle,
      functions: normalizedFunctions.length ? normalizedFunctions : ['scan'],
      input_text: text || '',
      editor_html: html || plainTextToHtml(text || ''),
      analysis: mapAnalysisToBackend(recordAnalysis),
    };

    // 如果用户已登录，尝试保存到后端
    if (authStore.isAuthenticated) {
      try {
        const savedRecord = await createHistoryRecord(recordData);
        const localRecord = normalizeHistoryRecordPayload(savedRecord);
        if (localRecord) {
          historyRecords.value = [localRecord, ...historyRecords.value].slice(0, 100);
        }
        return savedRecord;
      } catch {
        // 后端保存失败时，仅保留当前会话内存态，不再落本地持久化
      }
    }

    // 游客模式或后端保存失败时，仅保留当前会话内存态
    const record = {
      id: `history-${Date.now()}`,
      title: recordTitle,
      exampleKey: selectedExampleKey.value,
      createdAt: new Date().toISOString(),
      functions: normalizedFunctions.length ? normalizedFunctions : ['scan'],
      inputText: text || '',
      editorHtml: html || plainTextToHtml(text || ''),
      analysis: recordAnalysis,
    };

    historyRecords.value = [record, ...historyRecords.value].slice(0, 30);
    persistHistory();
  };

  const mapAnalysisResult = (response, originalText) => {
    const inputTextValue = pickFirst(response?.inputText, response?.input_text, originalText, '');
    return normalizeAnalysisPayload(response?.result, {
      fallbackText: inputTextValue,
      idPrefix: `result-${pickFirst(response?.historyId, response?.history_id, response?.detectionId, response?.detection_id, response?.id, Date.now())}`,
      fallbackScore: response?.score,
      fallbackLabel: response?.label,
    });
  };

  const analyzeText = async (text, options = {}) => {
    resetAnalysisError();
    const functions = Array.from(
      new Set(
        (options.functions || selectedFunctions.value || [])
          .filter((item) => typeof item === 'string' && validFunctionKeys.includes(item))
      )
    );
    const editorHtmlValue = options.html || plainTextToHtml(text);
    try {
      const response = await detectText({
        text,
        functions: functions.length ? functions : ['scan'],
        editorHtml: editorHtmlValue,
      });
      if (typeof response?.currentCredits === 'number' && Number.isFinite(response.currentCredits)) {
        authStore.updateCredits(response.currentCredits);
      }
      const analysis = mapAnalysisResult(response, text);
      result.value = analysis;

      const historyId = pickFirst(
        response?.historyId,
        response?.history_id,
        response?.detectionId,
        response?.detection_id,
        response?.id
      );
      currentResultHistoryId.value = historyId ? Number(historyId) || null : null;

      if (authStore.isAuthenticated && historyId) {
        const desiredTitle = buildHistoryRecordTitle({
          exampleKey: selectedExampleKey.value,
        });
        if (desiredTitle) {
          try {
            await updateHistoryRecord(historyId, { title: desiredTitle });
          } catch {
            // Title sync is best-effort only.
          }
        }

        await syncHistoryFromBackend();

        let historyRecord = historyRecords.value.find((item) => String(item.id) === String(historyId));
        if (!historyRecord) {
          historyRecord = await fetchHistoryRecordDetail(historyId);
        }

        if (historyRecord && historyRecord.analysis) {
          result.value = historyRecord.analysis;
          return historyRecord.analysis;
        }
      } else if (!authStore.isAuthenticated) {
        // 游客用户：仅保留当前会话内存态
        await addHistoryRecord({
          title: '', // 使用默认标题
          text: text,
          html: editorHtmlValue,
          functions: functions.length ? functions : ['scan'],
          analysis: analysis,
        });
      }

      return analysis;
    } catch (error) {
      if (error?.status === 402) {
        analysisError.value = { type: 'credits_insufficient', message: error?.message || '' };
      } else if (error?.status === 429) {
        analysisError.value = { type: 'rate_limit', message: error?.message || '' };
      } else {
        analysisError.value = { type: '', message: error?.message || '' };
      }
      result.value = null;
      throw error;
    }
  };

  const persistState = () => {
    if (isRestoring || typeof window === 'undefined') return;
    try {
      const payload = {
        selectedFunctions: selectedFunctions.value,
        selectedExampleKey: selectedExampleKey.value,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore draft persistence failures.
    }
  };

  const hydrateFromStorage = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (!payload || typeof payload !== 'object') return;
      isRestoring = true;

      // 不恢复输入文本、编辑器内容和上传文件名，避免刷新后留下误导性的旧状态
      lastUploadedFileName.value = '';

      if (Array.isArray(payload.selectedFunctions)) {
        setFunctions(payload.selectedFunctions);
      }
      if (typeof payload.selectedExampleKey === 'string') {
        selectedExampleKey.value = payload.selectedExampleKey;
      }
      persistState();
    } catch {
      // Ignore malformed draft cache and continue with defaults.
    } finally {
      isRestoring = false;
    }
  };

  const commitDraftToStorage = () => {
    persistState();
  };

  if (typeof window !== 'undefined') {
    hydrateFromStorage();
    hydrateHistory();
    loadExamples(examplesLocale.value);
  }

  watch([selectedFunctions, selectedExampleKey], persistState, {
    deep: true,
  });

  watch(historyRecords, persistHistory, { deep: true });

  return {
    examples,
    usageExamples,
    examplesLocale,
    hasLoadedExamples,
    isLoadingExamples,
    inputText,
    editorHtml,
    selectedExampleKey,
    isUploading,
    uploadError,
    lastUploadedFileName,
    selectedFunctions,
    characterCount,
    characterLimit: CHARACTER_LIMIT,
    setText,
    setImportedContent,
    setInputText,
    setEditorHtml,
    clearSelectedExample,
    applyExample,
    loadExamples,
    readFile,
    readFiles,
    resetError,
    resetAnalysisError,
    toggleFunction,
    setFunctions,
    resetFunctions,
    resetText,
    resetAll,
    resetResult,
    commitDraftToStorage,
      result,
    currentResultHistoryId,
    analysisError,
    analyzeText,
    historyRecords,
    addHistoryRecord,
    clearHistoryRecords,
    syncHistoryFromBackend,
    fetchHistoryRecordDetail,
    migrateLocalStorageToBackend,
    resolveHistoryRecordTitle,
  };
});
