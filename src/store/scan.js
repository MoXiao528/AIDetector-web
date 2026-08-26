import { defineStore } from 'pinia';
import { computed, onScopeDispose, ref, watch } from 'vue';
import { globalT } from '../i18n';
import { fetchScanExamples } from '../api/modules/examples';
import { extractApiErrorCode } from '../api/client';
import { detectText } from '../api/modules/scan';
import { combineImportedFileContents, readTextFromFile } from '../utils/fileReaders';
import { clampProbability } from '../utils/detectionStyles';
import {
  buildHighlightedPreviewHtml,
  extractTextFromHtml,
  hasParagraphRange,
  plainTextToHtml,
  sanitizeHtmlForEditor,
} from '../utils/editorContent';
import { getFallbackHeroExamples, getFallbackUsageExamples } from '../utils/usageExamples';
import { GUEST_HISTORY_STORAGE_PREFIX, purgePersistedGuestHistory } from '../utils/guestHistoryStorage';
import { getGuestSessionId, getStoredGuestToken } from '../api/modules/auth';
import { useAuthStore } from './auth';
import {
  getHistoryList,
  getHistoryRecord,
  updateHistoryRecord,
  deleteHistoryRecord as deleteHistoryRecordRequest,
  batchDeleteHistoryRecords as batchDeleteHistoryRecordsRequest,
  clearAllHistory as clearAllHistoryRequest,
} from '../api/modules/history';

const validFunctionKeys = ['scan'];
const RESET_IDEMPOTENCY_CODES = new Set(['IDEMPOTENCY_KEY_CONFLICT', 'IDEMPOTENCY_RESULT_GONE']);
const IDEMPOTENCY_ERROR_MESSAGES = {
  DETECTION_IN_PROGRESS: '检测任务仍在处理中，请稍后重试。',
  DETECTION_ACTOR_BUSY: '当前账号已有检测任务在处理中，请稍后重试。',
};
const CHARACTER_LIMIT = 20000;
const STORAGE_KEY = 'ai-detector-scan-draft';
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

const buildTextTooLongMessage = ({ current = 0, limit = CHARACTER_LIMIT } = {}) =>
  globalT('scan.editor.tooLongToast', { current, limit });

const createTextTooLongError = (current) => {
  const message = buildTextTooLongMessage({ current });
  const error = new Error(message);
  error.status = 422;
  error.code = 'TEXT_TOO_LONG';
  error.details = {
    detail: {
      code: 'TEXT_TOO_LONG',
      message,
      detail: {
        maximum: CHARACTER_LIMIT,
        current,
      },
    },
  };
  return error;
};

const splitParagraphTokens = (text = '') =>
  String(text)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((raw) => ({ raw, text: raw.trim() }));

const normalizeLabelType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['ai', 'fake', 'llm'].includes(normalized)) return 'ai';
  if (['human', 'real'].includes(normalized)) return 'human';
  if (['mixed', 'borderline'].includes(normalized)) return 'human';
  if (['too_short', 'too-short', 'too short', 'undetectable'].includes(normalized)) return 'too_short';
  return '';
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
    human: parseSummaryValue(summary?.human),
  };
  const hasParsed = Object.values(parsed).every((value) => typeof value === 'number' && Number.isFinite(value));
  if (hasParsed) {
    parsed.human += parseSummaryValue(summary?.mixed) ?? 0;
    const total = parsed.ai + parsed.human;
    if (total === 0) {
      return parsed;
    }
    if (total !== 100) {
      parsed.human = Math.max(0, parsed.human - (total - 100));
    }
    return parsed;
  }

  if (sentences.length) {
    const detectableSentences = sentences.filter((sentence) => sentence.type !== 'too_short');
    if (!detectableSentences.length) {
      return { ai: 0, human: 0 };
    }
    const counts = sentences.reduce(
      (acc, sentence) => {
        if (sentence.type !== 'too_short') {
          acc[sentence.type] += 1;
        }
        return acc;
      },
      { ai: 0, human: 0 }
    );
    const total = detectableSentences.length;
    const computed = {
      ai: Math.round((counts.ai / total) * 100),
      human: Math.round((counts.human / total) * 100),
    };
    const diff = computed.ai + computed.human - 100;
    if (diff !== 0) {
      computed.human = Math.max(0, computed.human - diff);
    }
    return computed;
  }

  const safeScore = typeof score === 'number' && Number.isFinite(score) ? Math.max(0, Math.min(score, 100)) : 0;
  return {
    ai: safeScore,
    human: Math.max(0, 100 - safeScore),
  };
};

const normalizeExamples = (items = []) =>
  items.map(({ mixed, ...item }) => ({
    ...item,
    ai: parseSummaryValue(item.ai) ?? 0,
    human: (parseSummaryValue(item.human) ?? 0) + (parseSummaryValue(mixed) ?? 0),
  }));

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null);

const normalizeScorePercent = (value) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed >= 0 && parsed <= 1) {
    return Math.round(parsed * 100);
  }
  return Math.max(0, Math.min(Math.round(parsed), 100));
};

const normalizeRawLogitScorePercent = (rawScore, threshold = 0) => {
  const parsedRawScore = typeof rawScore === 'number' ? rawScore : Number(rawScore);
  if (!Number.isFinite(parsedRawScore)) return null;
  const parsedThreshold = typeof threshold === 'number' ? threshold : Number(threshold);
  const rawThreshold = Number.isFinite(parsedThreshold) ? parsedThreshold : 0;
  const probability = 1 / (1 + Math.exp(-(parsedRawScore - rawThreshold)));
  return normalizeScorePercent(probability);
};

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
};

const countSentenceParagraphs = (sentence) => {
  const source = pickFirst(sentence?.raw, sentence?.text, '');
  const count = String(source || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim())
    .length;
  return Math.max(count, 1);
};

const normalizeSentenceParagraphRanges = (sentences = []) => {
  let previousEnd = 0;
  return sentences.map((sentence) => {
    const paragraphCount = countSentenceParagraphs(sentence);
    let start = toPositiveInteger(pickFirst(sentence?.startParagraph, sentence?.start_paragraph));
    let end = toPositiveInteger(pickFirst(sentence?.endParagraph, sentence?.end_paragraph));
    const hasValidRange = start !== null && end !== null && end >= start;
    const overlapsPreviousRange = hasValidRange && start <= previousEnd;

    if (!hasValidRange || overlapsPreviousRange) {
      start = previousEnd + 1;
      end = start + paragraphCount - 1;
    } else if (paragraphCount > 1 && end === start) {
      end = start + paragraphCount - 1;
    }

    previousEnd = Math.max(previousEnd, end);
    return {
      ...sentence,
      startParagraph: start,
      endParagraph: end,
      start_paragraph: start,
      end_paragraph: end,
    };
  });
};

const resolveSentenceType = (sentence, fallbackType = 'human') => {
  return normalizeLabelType(sentence?.type) || normalizeLabelType(sentence?.label) || fallbackType;
};

const buildFallbackSentences = ({ text = '', score = null, label = '', idPrefix = 'analysis' }) => {
  const normalizedText = String(text || '').trim();
  if (!normalizedText) return [];

  const scorePercent = normalizeScorePercent(score) ?? 0;
  const fallbackType = normalizeLabelType(label) || (scorePercent >= 70 ? 'ai' : 'human');
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
        tokenCount: pickFirst(sentence?.tokenCount, sentence?.token_count, null),
        visibleChars: pickFirst(sentence?.visibleChars, sentence?.visible_chars, null),
        isTruncated: Boolean(pickFirst(sentence?.isTruncated, sentence?.is_truncated, false)),
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

  sentences = normalizeSentenceParagraphRanges(sentences);

  const summary = normalizeSummary({
    summary: source?.summary,
    sentences,
    score: pickFirst(source?.score, fallbackScore),
  });
  const paragraphCount = splitParagraphTokens(fallbackText).filter((item) => item.text).length;
  const canRebuildHighlight =
    Boolean(fallbackText) && Boolean(sentences.length) && (sentences.every((item) => hasParagraphRange(item)) || paragraphCount === sentences.length);
  const fallbackHighlightedHtml = pickFirst(source?.highlightedHtml, source?.highlighted_html);
  const highlightedHtml = canRebuildHighlight
    ? buildHighlightedPreviewHtml({
      fallbackText,
      sentences,
      fallbackHighlightedHtml,
    })
    : fallbackHighlightedHtml
      ? sanitizeHtmlForEditor(fallbackHighlightedHtml, fallbackText)
      : buildHighlightedPreviewHtml({
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
    aiLikelyCount: sentences.filter((item) => item.type === 'ai').length,
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
    editorHtml: sanitizeHtmlForEditor(pickFirst(record.editorHtml, record.editor_html, plainTextToHtml(inputTextValue)), inputTextValue),
    isPinned: Boolean(pickFirst(record.isPinned, record.is_pinned, false)),
    analysis: normalizeAnalysisPayload(pickFirst(record.analysis, record.result), {
      fallbackText: inputTextValue,
      idPrefix: `history-${recordId || 'record'}`,
      fallbackScore: pickFirst(record.score, record.raw_score),
      fallbackLabel: pickFirst(record.label, ''),
    }),
  };
};

const seedHistoryRecords = [];

const getHistoryTimestamp = (record) => {
  const timestamp = Date.parse(record?.createdAt || record?.created_at || '');
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortHistoryRecords = (records = []) =>
  [...records].sort((left, right) => {
    const pinnedDiff = Number(Boolean(right?.isPinned ?? right?.is_pinned)) - Number(Boolean(left?.isPinned ?? left?.is_pinned));
    if (pinnedDiff !== 0) return pinnedDiff;
    return getHistoryTimestamp(right) - getHistoryTimestamp(left);
  });

const matchesHistorySearch = (record, query = '') => {
  const keyword = String(query || '').trim().toLowerCase();
  if (!keyword) return true;
  const haystack = [
    record?.title,
    record?.inputText,
    record?.input_text,
    record?.analysis?.summary ? JSON.stringify(record.analysis.summary) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(keyword);
};

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
  let guestHistoryRecords = [...seedHistoryRecords];
  let guestHistoryRecordSequence = 0;
  const result = ref(null);
  const currentResultHistoryId = ref(null);
  const analysisError = ref({ type: '', message: '' });
  const sessionGeneration = ref(0);
  let isRestoring = false;
  let activeGuestSid = authStore.isAuthenticated ? '' : getGuestSessionId(getStoredGuestToken());
  let detectionAttempt = null;

  const getAuthenticatedActorUserId = () =>
    String(authStore.user?.id ?? authStore.user?.userId ?? authStore.user?.user_id ?? '').trim();

  const captureScanSessionContext = () => {
    const authenticated = Boolean(authStore.isAuthenticated);
    return {
      generation: sessionGeneration.value,
      authenticated,
      userId: authenticated ? getAuthenticatedActorUserId() : '',
    };
  };

  const isScanSessionContextCurrent = (context) => {
    const currentContext = captureScanSessionContext();
    return (
      context.generation === currentContext.generation &&
      context.authenticated === currentContext.authenticated &&
      context.userId === currentContext.userId
    );
  };

  const getDetectionIdempotencyKey = (actorGeneration, payloadFingerprint) => {
    if (
      !detectionAttempt ||
      detectionAttempt.actorGeneration !== actorGeneration ||
      detectionAttempt.payloadFingerprint !== payloadFingerprint
    ) {
      detectionAttempt = {
        actorGeneration,
        payloadFingerprint,
        key: crypto.randomUUID(),
      };
    }
    return detectionAttempt.key;
  };

  const clearDetectionAttempt = (idempotencyKey = '') => {
    if (!idempotencyKey || detectionAttempt?.key === idempotencyKey) {
      detectionAttempt = null;
    }
  };

  const characterCount = computed(() => inputText.value.length);
  const isOverCharacterLimit = computed(() => characterCount.value > CHARACTER_LIMIT);

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

  const syncUploadErrorForCurrentText = () => {
    if (inputText.value.length > CHARACTER_LIMIT) {
      uploadError.value = buildTextTooLongMessage({ current: inputText.value.length });
      return;
    }
    uploadError.value = '';
  };

  const setText = (value) => {
    const normalized = value || '';
    inputText.value = normalized;
    editorHtml.value = plainTextToHtml(normalized);
    selectedExampleKey.value = '';
    syncUploadErrorForCurrentText();
  };

  const setImportedContent = ({ text = '', html = '' } = {}) => {
    inputText.value = text || '';
    editorHtml.value = sanitizeHtmlForEditor(html || plainTextToHtml(text || ''), text || '');
    selectedExampleKey.value = '';
    syncUploadErrorForCurrentText();
  };

  const setInputText = (value) => {
    setText(value);
  };

  const clearSelectedExample = () => {
    selectedExampleKey.value = '';
  };

  const setEditorHtml = (value = '') => {
    editorHtml.value = sanitizeHtmlForEditor(value || '');
    inputText.value = extractTextFromHtml(editorHtml.value);
    selectedExampleKey.value = '';
    syncUploadErrorForCurrentText();
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
    examples.value = normalizeExamples(getFallbackHeroExamples(nextLocale));
    usageExamples.value = normalizeExamples(getFallbackUsageExamples(nextLocale));
    isLoadingExamples.value = true;

    try {
      const response = await fetchScanExamples(nextLocale);
      if (Array.isArray(response?.heroExamples) && response.heroExamples.length) {
        examples.value = normalizeExamples(response.heroExamples);
      }
      if (Array.isArray(response?.usageExamples) && response.usageExamples.length) {
        usageExamples.value = normalizeExamples(response.usageExamples);
      }
    } catch {
      // Fallback examples are already prepared locally.
    } finally {
      hasLoadedExamples.value = true;
      isLoadingExamples.value = false;
    }
  };

  const readFile = async (file) => {
    if (!file) return false;
    const sessionContext = captureScanSessionContext();
    const imported = await readFiles([file]);
    return isScanSessionContextCurrent(sessionContext) ? imported : false;
  };

  const readFiles = async (files) => {
    const fileList = Array.from(files || []).filter(Boolean);
    if (!fileList.length) return false;
    const sessionContext = captureScanSessionContext();
    isUploading.value = true;
    uploadError.value = '';
    try {
      const contents = [];
      for (const current of fileList) {
        // eslint-disable-next-line no-await-in-loop
        const content = await readTextFromFile(current);
        if (!isScanSessionContextCurrent(sessionContext)) return false;
        contents.push(content);
      }
      if (!isScanSessionContextCurrent(sessionContext)) return false;
      const combined = combineImportedFileContents(contents);
      setImportedContent(combined);
      lastUploadedFileName.value =
        fileList.length === 1 ? fileList[0].name : `${fileList[0].name} 等 ${fileList.length} 个文件`;
      return true;
    } catch (error) {
      if (!isScanSessionContextCurrent(sessionContext)) return false;
      uploadError.value = error.message || globalT('errors.fileParseError');
      throw error;
    } finally {
      if (isScanSessionContextCurrent(sessionContext)) {
        isUploading.value = false;
      }
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
    clearDetectionAttempt();
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

  const clearScanSessionData = () => {
    sessionGeneration.value += 1;
    clearDetectionAttempt();
    guestHistoryRecords = [];
    historyRecords.value = [];
    activeGuestSid = '';
    isUploading.value = false;
    resetText();
    resetResult();
    purgePersistedGuestHistory();
  };

  const activateGuestSession = (guestSid = '') => {
    const nextGuestSid = String(guestSid || '').trim();
    if (activeGuestSid && activeGuestSid !== nextGuestSid) {
      clearScanSessionData();
      activeGuestSid = nextGuestSid;
      return true;
    }
    activeGuestSid = nextGuestSid;
    return false;
  };

  const isDisplayableHistoryRecord = (record) => {
    const text = typeof record?.inputText === 'string' ? record.inputText : record?.input_text;
    return Boolean(text && text.trim());
  };

  const hydrateHistory = () => {
    if (typeof window === 'undefined') return;
    purgePersistedGuestHistory();
    if (authStore.isAuthenticated) {
      syncHistoryFromBackend();
      return;
    }
    historyRecords.value = [...guestHistoryRecords];
  };

  const syncHistoryFromBackend = async ({ q = '', pinned = null, strict = false } = {}) => {
    const sessionContext = captureScanSessionContext();
    if (!authStore.isAuthenticated) {
      purgePersistedGuestHistory();
      const localRecords = guestHistoryRecords
        .filter((record) => matchesHistorySearch(record, q))
        .filter((record) => (typeof pinned === 'boolean' ? Boolean(record.isPinned) === pinned : true));
      historyRecords.value = sortHistoryRecords(localRecords);
      return historyRecords.value;
    }

    try {
      const response = await getHistoryList({
        page: 1,
        per_page: 100,
        sort: 'created_at',
        order: 'desc',
        q: String(q || '').trim() || undefined,
        pinned,
      });
      if (!isScanSessionContextCurrent(sessionContext)) return [];
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

      historyRecords.value = sortHistoryRecords(backendRecords);
      return historyRecords.value;
    } catch (error) {
      if (!isScanSessionContextCurrent(sessionContext)) return [];
      if (strict) throw error;
      return [];
    }
  };

  const fetchHistoryRecordDetail = async (id) => {
    if (!id || !authStore.isAuthenticated) return null;
    const sessionContext = captureScanSessionContext();
    try {
      const record = await getHistoryRecord(id);
      if (!isScanSessionContextCurrent(sessionContext)) return null;
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
        historyRecords.value = sortHistoryRecords([fullRecord, ...historyRecords.value]);
      } else {
        historyRecords.value[index] = fullRecord;
        historyRecords.value = sortHistoryRecords(historyRecords.value);
      }
      return fullRecord;
    } catch {
      if (!isScanSessionContextCurrent(sessionContext)) return null;
      return null;
    }
  };

  const upsertHistoryRecord = (record) => {
    const normalized = normalizeHistoryRecordPayload(record);
    if (!normalized || !isDisplayableHistoryRecord(normalized)) return null;

    const index = historyRecords.value.findIndex((item) => String(item.id) === String(normalized.id));
    if (index === -1) {
      historyRecords.value = sortHistoryRecords([normalized, ...historyRecords.value]);
    } else {
      historyRecords.value[index] = {
        ...historyRecords.value[index],
        ...normalized,
      };
      historyRecords.value = sortHistoryRecords(historyRecords.value);
    }
    return normalized;
  };

  const updateLocalHistoryRecord = (id, updater) => {
    const sourceRecords = authStore.isAuthenticated ? [...historyRecords.value] : [...guestHistoryRecords];
    const sourceIndex = sourceRecords.findIndex((item) => String(item.id) === String(id));
    if (sourceIndex === -1) return null;
    const current = sourceRecords[sourceIndex];
    const next = normalizeHistoryRecordPayload({
      ...current,
      ...(typeof updater === 'function' ? updater(current) : updater),
    });
    if (!next || !isDisplayableHistoryRecord(next)) return null;

    sourceRecords[sourceIndex] = next;
    const sortedSource = sortHistoryRecords(sourceRecords);
    if (!authStore.isAuthenticated) {
      guestHistoryRecords = sortedSource;
    }

    const index = historyRecords.value.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return null;
    historyRecords.value[index] = next;
    historyRecords.value = sortHistoryRecords(historyRecords.value);
    return next;
  };

  const renameHistoryRecord = async (id, title) => {
    const nextTitle = String(title || '').trim();
    if (!id || !nextTitle) return null;
    const sessionContext = captureScanSessionContext();

    if (authStore.isAuthenticated) {
      let savedRecord;
      try {
        savedRecord = await updateHistoryRecord(id, { title: nextTitle });
      } catch (error) {
        if (!isScanSessionContextCurrent(sessionContext)) return null;
        throw error;
      }
      if (!isScanSessionContextCurrent(sessionContext)) return null;
      return upsertHistoryRecord(savedRecord);
    }

    return updateLocalHistoryRecord(id, { title: nextTitle });
  };

  const togglePinnedHistoryRecord = async (id, nextPinned = null) => {
    if (!id) return null;
    const sessionContext = captureScanSessionContext();
    const current = historyRecords.value.find((item) => String(item.id) === String(id));
    const resolvedPinned = typeof nextPinned === 'boolean' ? nextPinned : !current?.isPinned;

    if (authStore.isAuthenticated) {
      let savedRecord;
      try {
        savedRecord = await updateHistoryRecord(id, { is_pinned: resolvedPinned });
      } catch (error) {
        if (!isScanSessionContextCurrent(sessionContext)) return null;
        throw error;
      }
      if (!isScanSessionContextCurrent(sessionContext)) return null;
      return upsertHistoryRecord(savedRecord);
    }

    return updateLocalHistoryRecord(id, { isPinned: resolvedPinned });
  };

  const removeHistoryIdsFromState = (ids = []) => {
    const idSet = new Set(ids.map((item) => String(item)));
    if (!idSet.size) return 0;
    if (!authStore.isAuthenticated) {
      guestHistoryRecords = guestHistoryRecords.filter((item) => !idSet.has(String(item.id)));
    }
    const beforeCount = historyRecords.value.length;
    historyRecords.value = historyRecords.value.filter((item) => !idSet.has(String(item.id)));
    if (idSet.has(String(currentResultHistoryId.value))) {
      currentResultHistoryId.value = null;
    }
    return beforeCount - historyRecords.value.length;
  };

  const deleteHistoryRecord = async (id) => {
    if (!id) return false;
    const sessionContext = captureScanSessionContext();
    if (authStore.isAuthenticated) {
      try {
        await deleteHistoryRecordRequest(id);
      } catch (error) {
        if (!isScanSessionContextCurrent(sessionContext)) return false;
        throw error;
      }
      if (!isScanSessionContextCurrent(sessionContext)) return false;
    }
    removeHistoryIdsFromState([id]);
    return true;
  };

  const batchDeleteHistoryRecords = async (ids = []) => {
    const normalizedIds = ids.filter((id) => id !== null && id !== undefined && id !== '');
    if (!normalizedIds.length) {
      return { deletedCount: 0, failedIds: [] };
    }
    const sessionContext = captureScanSessionContext();

    if (authStore.isAuthenticated) {
      let response;
      try {
        response = await batchDeleteHistoryRecordsRequest(normalizedIds);
      } catch (error) {
        if (!isScanSessionContextCurrent(sessionContext)) {
          return { deletedCount: 0, failedIds: [] };
        }
        throw error;
      }
      if (!isScanSessionContextCurrent(sessionContext)) {
        return { deletedCount: 0, failedIds: [] };
      }
      const failedIds = response?.failed_ids || response?.failedIds || [];
      const failedSet = new Set(failedIds.map((item) => String(item)));
      const deletedIds = normalizedIds.filter((id) => !failedSet.has(String(id)));
      const deletedCount = removeHistoryIdsFromState(deletedIds);
      return {
        deletedCount: response?.deleted_count ?? response?.deletedCount ?? deletedCount,
        failedIds,
      };
    }

    const deletedCount = removeHistoryIdsFromState(normalizedIds);
    return { deletedCount, failedIds: [] };
  };

  const clearAllHistoryRecords = async () => {
    const sessionContext = captureScanSessionContext();
    if (authStore.isAuthenticated) {
      try {
        await clearAllHistoryRequest();
      } catch (error) {
        if (!isScanSessionContextCurrent(sessionContext)) return { deletedCount: 0 };
        throw error;
      }
      if (!isScanSessionContextCurrent(sessionContext)) return { deletedCount: 0 };
    }
    const deletedCount = historyRecords.value.length;
    clearHistoryRecords();
    return { deletedCount };
  };

  const searchHistoryRecords = async ({ q = '', pinned = null } = {}) => {
    return syncHistoryFromBackend({ q, pinned });
  };

  const loadHistoryRecord = (record) => {
    if (!record) return false;
    const normalized = normalizeHistoryRecordPayload(record);
    if (!normalized || !isDisplayableHistoryRecord(normalized)) return false;

    inputText.value = normalized.inputText || '';
    editorHtml.value = sanitizeHtmlForEditor(
      normalized.editorHtml || plainTextToHtml(normalized.inputText || ''),
      normalized.inputText || ''
    );
    setFunctions(normalized.functions);
    result.value = normalized.analysis || null;
    currentResultHistoryId.value = normalized.id || null;
    selectedExampleKey.value = normalized.exampleKey || '';
    lastUploadedFileName.value = '';
    analysisError.value = null;
    syncUploadErrorForCurrentText();
    return true;
  };

  const clearHistoryRecords = () => {
    guestHistoryRecords = [];
    historyRecords.value = [];
    currentResultHistoryId.value = null;
    purgePersistedGuestHistory();
  };

  const addHistoryRecord = async ({ title, text, html, functions = [], analysis }) => {
    if (!text || !text.trim()) {
      return null;
    }

    const normalizedFunctions = Array.from(
      new Set(functions.filter((item) => typeof item === 'string' && validFunctionKeys.includes(item)))
    );
    const recordAnalysis = analysis
      ? {
        ...analysis,
        ...normalizeAnalysisPayload(analysis, {
          fallbackText: text,
          idPrefix: 'history-new',
        }),
      }
      : null;

    const recordTitle =
      buildHistoryRecordTitle({
        title: title && title.trim() ? title.trim() : '',
        exampleKey: selectedExampleKey.value,
      });

    // 成功的游客检测已经由后端持久化；这里只保留当前页面的展示镜像。
    const record = {
      id: `history-${Date.now()}-${++guestHistoryRecordSequence}`,
      title: recordTitle,
      exampleKey: selectedExampleKey.value,
      createdAt: new Date().toISOString(),
      functions: normalizedFunctions.length ? normalizedFunctions : ['scan'],
      inputText: text || '',
      editorHtml: sanitizeHtmlForEditor(html || plainTextToHtml(text || ''), text || ''),
      isPinned: false,
      analysis: recordAnalysis,
    };

    guestHistoryRecords = sortHistoryRecords([record, ...guestHistoryRecords]).slice(0, 30);
    historyRecords.value = [...guestHistoryRecords];
    currentResultHistoryId.value = record.id;
    return record;
  };

  const mapAnalysisResult = (response, originalText) => {
    const inputTextValue = pickFirst(response?.inputText, response?.input_text, originalText, '');
    const analysis = normalizeAnalysisPayload(response?.result, {
      fallbackText: inputTextValue,
      idPrefix: `result-${pickFirst(response?.historyId, response?.history_id, response?.detectionId, response?.detection_id, response?.id, Date.now())}`,
      fallbackScore: pickFirst(
        response?.score,
        normalizeRawLogitScorePercent(pickFirst(response?.rawScore, response?.raw_score), pickFirst(response?.threshold, 0))
      ),
      fallbackLabel: normalizeLabelType(response?.label) || response?.label,
    });
    const modelName = pickFirst(response?.modelName, response?.model_name, response?.result?.modelName, response?.result?.model_name);
    if (modelName) {
      analysis.modelName = modelName;
      analysis.model_name = modelName;
    }
    return analysis;
  };

  const analyzeText = async (text, options = {}) => {
    const sessionContext = captureScanSessionContext();
    const guestToken = String(options.guestToken || '').trim();
    let idempotencyKey = '';
    resetAnalysisError();
    const functions = Array.from(
      new Set(
        (options.functions || selectedFunctions.value || [])
          .filter((item) => typeof item === 'string' && validFunctionKeys.includes(item))
      )
    );
    const editorHtmlValue = options.html || plainTextToHtml(text);
    try {
      if (text.length > CHARACTER_LIMIT) {
        throw createTextTooLongError(text.length);
      }
      if (
        !sessionContext.authenticated &&
        (!guestToken || !activeGuestSid || getGuestSessionId(guestToken) !== activeGuestSid)
      ) {
        throw Object.assign(new Error('Guest session token is required'), {
          status: 401,
          code: 'GUEST_TOKEN_REQUIRED',
        });
      }

      const requestPayload = {
        text,
        functions: functions.length ? functions : ['scan'],
        editorHtml: editorHtmlValue,
      };
      const actorGeneration = `${sessionContext.generation}:${
        sessionContext.authenticated ? `user:${sessionContext.userId}` : `guest:${activeGuestSid}`
      }`;
      idempotencyKey = getDetectionIdempotencyKey(actorGeneration, JSON.stringify(requestPayload));
      const response = await detectText(
        requestPayload,
        sessionContext.authenticated ? '' : guestToken,
        idempotencyKey
      );
      if (!isScanSessionContextCurrent(sessionContext)) return null;
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
            if (!isScanSessionContextCurrent(sessionContext)) return null;
            // Title sync is best-effort only.
          }
          if (!isScanSessionContextCurrent(sessionContext)) return null;
        }

        await syncHistoryFromBackend();
        if (!isScanSessionContextCurrent(sessionContext)) return null;

        let historyRecord = historyRecords.value.find((item) => String(item.id) === String(historyId));
        if (!historyRecord) {
          historyRecord = await fetchHistoryRecordDetail(historyId);
          if (!isScanSessionContextCurrent(sessionContext)) return null;
        }

        if (historyRecord && historyRecord.analysis) {
          result.value = historyRecord.analysis;
          clearDetectionAttempt(idempotencyKey);
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
        if (!isScanSessionContextCurrent(sessionContext)) return null;
      }

      clearDetectionAttempt(idempotencyKey);
      return analysis;
    } catch (error) {
      if (!isScanSessionContextCurrent(sessionContext)) return null;
      const errorCode = extractApiErrorCode(error);
      if (RESET_IDEMPOTENCY_CODES.has(errorCode)) {
        clearDetectionAttempt(idempotencyKey);
      }
      if (IDEMPOTENCY_ERROR_MESSAGES[errorCode]) {
        error.message = IDEMPOTENCY_ERROR_MESSAGES[errorCode];
      }
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

  const onGuestTokenStorage = (event) => {
    if (event.storageArea !== window.localStorage) return;
    if (typeof event.key === 'string' && event.key.startsWith(GUEST_HISTORY_STORAGE_PREFIX)) {
      purgePersistedGuestHistory();
      return;
    }
    if (authStore.isAuthenticated || (event.key !== 'guest_token' && event.key !== null)) return;
    activateGuestSession(event.key === null ? '' : getGuestSessionId(event.newValue || ''));
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onGuestTokenStorage);
    onScopeDispose(() => window.removeEventListener('storage', onGuestTokenStorage));
    hydrateFromStorage();
    hydrateHistory();
    loadExamples(examplesLocale.value);
  }

  watch([selectedFunctions, selectedExampleKey], persistState, {
    deep: true,
  });

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
    isOverCharacterLimit,
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
    sessionGeneration,
    analyzeText,
    historyRecords,
    addHistoryRecord,
    loadHistoryRecord,
    clearHistoryRecords,
    clearScanSessionData,
    activateGuestSession,
    syncHistoryFromBackend,
    fetchHistoryRecordDetail,
    renameHistoryRecord,
    togglePinnedHistoryRecord,
    deleteHistoryRecord,
    batchDeleteHistoryRecords,
    clearAllHistoryRecords,
    searchHistoryRecords,
    resolveHistoryRecordTitle,
  };
});
