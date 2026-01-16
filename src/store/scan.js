import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { globalT } from '../i18n';
import { detectText } from '../api/modules/scan';
import { readTextFromFile } from '../utils/fileReaders';

const examples = [
  {
    key: 'chatgpt',
    label: 'ChatGPT',
    content:
      'Artificial intelligence systems have rapidly accelerated the pace of information creation, challenging educators to distinguish authentic student work from generated text.',
  },
  {
    key: 'human',
    label: 'Human',
    content:
      'When I interviewed each student, I paid attention to their pauses, their personal anecdotes, and the way they connected class discussions to their own experiences.',
  },
  {
    key: 'hybrid',
    label: 'AI + Human',
    content:
      'The initial outline was produced by an AI assistant, but I rewrote each paragraph to weave in citations from recent journals and to adjust the tone to match our faculty guidelines.',
  },
  {
    key: 'polished',
    label: 'Polished by AI',
    content:
      'After running the report, the assistant suggested consolidating redundant sentences and elevating the academic voice; the revised excerpt now reads with greater clarity and cohesion.',
  },
];

const validFunctionKeys = ['scan', 'polish', 'translate', 'citation'];
const CHARACTER_LIMIT = 10000;
const STORAGE_KEY = 'ai-detector-scan-draft';
const HISTORY_STORAGE_KEY = 'ai-detector-history-records';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const plainTextToHtml = (value = '') => {
  if (!value) return '';
  const normalized = String(value).replace(/\r\n/g, '\n');
  return normalized
    .split('\n')
    .map((line) => {
      if (!line) {
        return '<p><br></p>';
      }
      return `<p>${escapeHtml(line)
        .replace(/  /g, ' &nbsp;')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')}</p>`;
    })
    .join('');
};

const extractTextFromHtml = (html = '') => {
  if (!html) return '';
  if (typeof window === 'undefined') {
    return String(html).replace(/<[^>]+>/g, '');
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
  return doc.body.textContent || '';
};

const tokenizeText = (text = '') => {
  const normalized = String(text).replace(/\r\n/g, '\n');
  const regex = /([^\n。.!?;！？]+[。.!?;！？]?|\n)/g;
  const tokens = [];
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const raw = match[0];
    if (raw === '\n') {
      tokens.push({ type: 'break', raw });
      continue;
    }
    const trimmed = raw.trim();
    if (!trimmed) continue;
    tokens.push({ type: 'sentence', raw, text: trimmed });
  }
  return tokens;
};

const buildHighlightedHtml = (text, sentences) => {
  const classMap = {
    ai: 'bg-amber-100 text-amber-900',
    mixed: 'bg-violet-100 text-violet-900',
    human: 'bg-emerald-100 text-emerald-900',
  };
  const tokens = tokenizeText(text);
  if (!tokens.length) {
    return plainTextToHtml(text);
  }
  let sentenceIndex = 0;
  return tokens
    .map((token) => {
      if (token.type === 'break') {
        return '<br />';
      }
      const sentence = sentences[sentenceIndex];
      sentenceIndex += 1;
      if (!sentence) {
        return `<span class="highlight-chip">${escapeHtml(token.raw)}</span>`;
      }
      const classes = classMap[sentence.type] || 'bg-slate-100 text-slate-700';
      return `<span class="highlight-chip ${classes}" data-sentence-id="${sentence.id}">${escapeHtml(token.raw)}</span>`;
    })
    .join('');
};

const historyHighlightClasses = {
  ai: 'bg-amber-100 text-amber-900',
  mixed: 'bg-violet-100 text-violet-900',
  human: 'bg-emerald-100 text-emerald-900',
};

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

const buildSeedHistoryAnalysis = ({ summary, sentences, translation = '', polish = '', citations = [] }) => {
  const normalizedSentences = sentences.map((item, index) => ({
    id: item.id || `seed-sentence-${index}`,
    text: item.text,
    raw: item.raw || item.text,
    type: item.type,
    probability: item.probability ?? 0.5,
    reason: item.reason,
  }));
  const aiLikelyCount = normalizedSentences.filter((item) => item.type === 'ai' || item.type === 'mixed').length;
  const highlightedHtml = normalizedSentences
    .map((item) => `<span class="inline-block rounded-lg px-1 ${historyHighlightClasses[item.type] || ''}">${escapeHtml(item.text)}</span>`)
    .join(' ');
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
  const inputText = ref('');
  const editorHtml = ref('');
  const selectedExampleKey = ref('');
  const isUploading = ref(false);
  const uploadError = ref('');
  const lastUploadedFileName = ref('');
  const selectedFunctions = ref(['scan']);
  const historyRecords = ref([...seedHistoryRecords]);
  const result = ref(null);
  const analysisError = ref({ type: '', message: '' });
  let isRestoring = false;
  let isHydratingHistory = false;

  const characterCount = computed(() => inputText.value.length);

  const setText = (value) => {
    const normalized = value || '';
    inputText.value = normalized;
    editorHtml.value = plainTextToHtml(normalized);
    selectedExampleKey.value = '';
  };

  const setInputText = (value) => {
    setText(value);
  };

  const setEditorHtml = (value = '') => {
    editorHtml.value = value || '';
    inputText.value = extractTextFromHtml(editorHtml.value);
    selectedExampleKey.value = '';
  };

  const applyExample = (key) => {
    const matched = examples.find((item) => item.key === key);
    if (!matched) return;
    inputText.value = matched.content;
    editorHtml.value = plainTextToHtml(matched.content);
    selectedExampleKey.value = matched.key;
    lastUploadedFileName.value = '';
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
      const combined = contents.join('\n\n');
      setText(combined);
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
    analysisError.value = null;
  };

  const resetAnalysisError = () => {
    analysisError.value = { type: '', message: '' };
  };

  const persistHistory = () => {
    if (isHydratingHistory || typeof window === 'undefined') return;
    try {
      const payload = historyRecords.value.map((item) => ({
        ...item,
        analysis: item.analysis
          ? {
              ...item.analysis,
              sentences: (item.analysis.sentences || []).map((sentence) => ({ ...sentence })),
              polish: item.analysis.polish || '',
              citations: (item.analysis.citations || []).map((entry) => ({ ...entry })),
            }
          : null,
      }));
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to persist history records', error);
    }
  };

  const hydrateHistory = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      isHydratingHistory = true;
      historyRecords.value = parsed.map((record, index) => ({
        id: record.id || `history-${index}-${Date.now()}`,
        title: record.title || `扫描记录 ${index + 1}`,
        createdAt: record.createdAt || new Date().toISOString(),
        functions: Array.isArray(record.functions)
          ? record.functions.filter((item) => validFunctionKeys.includes(item))
          : ['scan'],
        inputText: record.inputText || '',
        editorHtml: typeof record.editorHtml === 'string' ? record.editorHtml : plainTextToHtml(record.inputText || ''),
        analysis: record.analysis
          ? {
              summary: record.analysis.summary || { ai: 0, mixed: 0, human: 0 },
              sentences: Array.isArray(record.analysis.sentences)
                ? record.analysis.sentences.map((sentence, sentenceIndex) => ({
                    id: sentence.id || `history-${index}-sentence-${sentenceIndex}`,
                    text: sentence.text || '',
                    raw: sentence.raw || sentence.text || '',
                    type: ['ai', 'mixed', 'human'].includes(sentence.type)
                      ? sentence.type
                      : labelToTypeMap[sentence.label] || 'human',
                    probability:
                      typeof sentence.probability === 'number'
                        ? sentence.probability
                        : Number(sentence.score || 0) / 100,
                    score: typeof sentence.score === 'number' ? sentence.score : Number(sentence.score || 0),
                    reason: sentence.reason || sentence.suggestion || '',
                    suggestion: sentence.suggestion || sentence.reason || '',
                  }))
                : [],
              translation: record.analysis.translation || '',
              polish: Array.isArray(record.analysis.polish)
                ? record.analysis.polish.map((entry) => entry?.suggestion).filter(Boolean).join('\n\n')
                : record.analysis.polish || '',
              citations: Array.isArray(record.analysis.citations)
                ? record.analysis.citations.map((entry, entryIndex) => ({
                    id: entry.id || `history-${index}-citation-${entryIndex}`,
                    text: entry.text || entry.excerpt || '',
                    source: entry.source || entry.note || entry.status || '',
                  }))
                : [],
              aiLikelyCount:
                typeof record.analysis.aiLikelyCount === 'number'
                  ? record.analysis.aiLikelyCount
                  : (Array.isArray(record.analysis.sentences)
                      ? record.analysis.sentences.filter((item) => item.type === 'ai' || item.type === 'mixed').length
                      : 0),
              highlightedHtml: record.analysis.highlightedHtml || '',
            }
          : null,
      }));
    } catch (error) {
      console.error('Failed to hydrate history records', error);
    } finally {
      isHydratingHistory = false;
    }
  };

  const addHistoryRecord = ({ title, text, html, functions = [], analysis }) => {
    const normalizedFunctions = Array.from(
      new Set(functions.filter((item) => typeof item === 'string' && validFunctionKeys.includes(item)))
    );
    const recordAnalysis = analysis
      ? {
          ...analysis,
          summary: analysis.summary || { ai: 0, mixed: 0, human: 0 },
          sentences: (analysis.sentences || []).map((sentence, index) => ({
            id: sentence.id || `history-new-sentence-${index}`,
            text: sentence.text || '',
            raw: sentence.raw || sentence.text || '',
            type: ['ai', 'mixed', 'human'].includes(sentence.type)
              ? sentence.type
              : labelToTypeMap[sentence.label] || 'human',
            probability: typeof sentence.probability === 'number' ? sentence.probability : Number(sentence.score || 0) / 100,
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

    const record = {
      id: `history-${Date.now()}`,
      title:
        title && title.trim()
          ? title.trim()
          : `扫描记录 · ${new Date().toLocaleString('zh-CN', { hour12: false })}`,
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
    const analysis = response?.result;
    const inputTextValue = response?.input_text || originalText || '';
    const normalizedSentences = (analysis?.sentences || []).map((sentence, index) => {
      const type = labelToTypeMap[sentence.label] || 'human';
      const score = typeof sentence.score === 'number' ? sentence.score : Number(sentence.score || 0);
      return {
        id: sentence.id || `sentence-${response?.id || Date.now()}-${index}`,
        text: sentence.text || '',
        raw: sentence.text || '',
        type,
        probability: score / 100,
        score,
        reason: sentence.suggestion || '',
        suggestion: sentence.suggestion || '',
      };
    });
    const summary = normalizeSummary({
      summary: analysis?.summary,
      sentences: normalizedSentences,
      score: analysis?.score,
    });
    const highlightedHtml = buildHighlightedHtml(inputTextValue, normalizedSentences);
    return {
      summary,
      sentences: normalizedSentences,
      translation: analysis?.translation || '',
      polish: analysis?.polish || '',
      citations: Array.isArray(analysis?.citations)
        ? analysis.citations.map((item, index) => ({
            id: `citation-${response?.id || Date.now()}-${index}`,
            text: item.text || '',
            source: item.source || '',
          }))
        : [],
      aiLikelyCount: normalizedSentences.filter((item) => item.type === 'ai' || item.type === 'mixed').length,
      highlightedHtml,
    };
  };

  const analyzeText = async (text, options = {}) => {
    resetAnalysisError();
    const functions = Array.from(
      new Set(
        (options.functions || selectedFunctions.value || [])
          .filter((item) => typeof item === 'string' && validFunctionKeys.includes(item))
      )
    );
    try {
      const response = await detectText({ text, functions: functions.length ? functions : ['scan'] });
      const analysis = mapAnalysisResult(response, text);
      result.value = analysis;
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
        inputText: inputText.value,
        editorHtml: editorHtml.value,
        selectedFunctions: selectedFunctions.value,
        lastUploadedFileName: lastUploadedFileName.value,
        selectedExampleKey: selectedExampleKey.value,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to persist scan draft', error);
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
      if (typeof payload.editorHtml === 'string' && payload.editorHtml) {
        setEditorHtml(payload.editorHtml);
      } else if (typeof payload.inputText === 'string') {
        setText(payload.inputText);
      }
      if (Array.isArray(payload.selectedFunctions)) {
        setFunctions(payload.selectedFunctions);
      }
      if (typeof payload.lastUploadedFileName === 'string') {
        lastUploadedFileName.value = payload.lastUploadedFileName;
      }
      if (typeof payload.selectedExampleKey === 'string') {
        selectedExampleKey.value = payload.selectedExampleKey;
      }
    } catch (error) {
      console.error('Failed to hydrate scan draft', error);
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
  }

  watch([inputText, editorHtml, selectedFunctions, lastUploadedFileName, selectedExampleKey], persistState, {
    deep: true,
  });

  watch(historyRecords, persistHistory, { deep: true });

  return {
    examples,
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
    setInputText,
     setEditorHtml,
    applyExample,
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
    analysisError,
    analyzeText,
    historyRecords,
    addHistoryRecord,
  };
});
