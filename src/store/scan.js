import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
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
const DEFAULT_TASK_DURATION = 5200;
const MAX_TASKS = 20;

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

const historyHighlightClasses = {
  ai: 'bg-amber-100 text-amber-900',
  mixed: 'bg-violet-100 text-violet-900',
  human: 'bg-emerald-100 text-emerald-900',
};

const buildSeedHistoryAnalysis = ({ summary, sentences, translation = '', polish = [], citations = [] }) => {
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

  const seedHistoryRecords = [
    {
      id: 'history-1',
      title: '课堂论文检测',
      createdAt: '2024-06-12T09:24:00.000Z',
    functions: ['scan', 'citation'],
    inputText:
      'This classroom essay evaluates the impact of AI writing assistants on student voice, yet several opening paragraphs repeat generic claims without citing classroom data.',
    editorHtml: plainTextToHtml(
      'This classroom essay evaluates the impact of AI writing assistants on student voice, yet several opening paragraphs repeat generic claims without citing classroom data.'
    ),
    analysis: buildSeedHistoryAnalysis({
      summary: { ai: 58, mixed: 27, human: 15 },
      sentences: [
        {
          id: 'history-1-s1',
          text: 'The introduction leans on formulaic statements about technology reshaping learning without concrete classroom anecdotes.',
          type: 'ai',
          probability: 0.82,
          reason: '缺乏个性化细节与案例，语气模板化明显。',
        },
        {
          id: 'history-1-s2',
          text: 'Middle paragraphs reference student interviews but still rely on generic transitions that feel partially machine-generated.',
          type: 'mixed',
          probability: 0.64,
          reason: '部分保留真实经历，但衔接语句与段落结构呈现模型痕迹。',
        },
        {
          id: 'history-1-s3',
          text: 'The closing section summarises findings without pointing to verifiable classroom observations.',
          type: 'ai',
          probability: 0.74,
          reason: '总结部分语义笼统，缺少具体观察与引用支撑。',
        },
      ],
      citations: [
        {
          id: 'history-1-c1',
          excerpt: 'The introduction leans on formulaic statements about technology reshaping learning without concrete classroom anecdotes.',
          status: '缺失引用',
          note: '建议补充课堂观察或引用官方数据支持观点。',
        },
        {
          id: 'history-1-c2',
          excerpt: 'Middle paragraphs reference student interviews but still rely on generic transitions that feel partially machine-generated.',
          status: '待验证',
          note: '请核实访谈记录来源并补充准确引用信息。',
        },
      ],
    }),
  },
    {
      id: 'history-2',
      title: '市场报告润色',
      createdAt: '2024-06-08T13:05:00.000Z',
      functions: ['scan', 'translate', 'polish'],
    inputText:
      'The quarterly market summary outlines user growth with confident but repetitive wording, and several insights were drafted collaboratively by product and AI tools.',
    editorHtml: plainTextToHtml(
      'The quarterly market summary outlines user growth with confident but repetitive wording, and several insights were drafted collaboratively by product and AI tools.'
    ),
      analysis: buildSeedHistoryAnalysis({
        summary: { ai: 42, mixed: 38, human: 20 },
        sentences: [
          {
            id: 'history-2-s1',
            text: 'The quarterly market summary outlines user growth with confident but repetitive wording.',
            type: 'mixed',
            probability: 0.58,
            reason: '语气流畅但句式重复，可视为人机共同参与撰写。',
          },
        {
          id: 'history-2-s2',
          text: 'Several insights were drafted collaboratively by product and AI tools.',
          type: 'ai',
          probability: 0.7,
          reason: '描述笼统且缺少实证数据，模型参与度较高。',
        },
        {
          id: 'history-2-s3',
          text: 'Team feedback highlighted the need for clearer regional metrics and citations.',
          type: 'human',
          probability: 0.22,
          reason: '包含具体团队需求与上下文，贴近人工撰写。',
        },
      ],
      translation: [
        '第 1 句：The quarterly market summary outlines user growth with confident but repetitive wording. → 本季度市场总结以自信却略显重复的语气描述了用户增长。',
        '第 2 句：Several insights were drafted collaboratively by product and AI tools. → 多条洞见由产品团队与 AI 工具协作完成。',
        '第 3 句：Team feedback highlighted the need for clearer regional metrics and citations. → 团队反馈强调需要更清晰的区域指标与引用。',
      ].join('\n'),
      polish: [
        {
          id: 'history-2-p1',
          original: 'The quarterly market summary outlines user growth with confident but repetitive wording.',
          suggestion: 'The quarterly market summary outlines user growth with confident but repetitive wording, lacking concrete cohort comparisons.',
          reason: '补充定量信息与对比，增强说服力。',
        },
          {
            id: 'history-2-p2',
            original: 'Several insights were drafted collaboratively by product and AI tools.',
            suggestion: 'Several insights were drafted collaboratively by product and AI tools, and require explicit sourcing before publication.',
            reason: '说明下一步动作与责任主体，便于执行。',
          },
        ],
      }),
    },
    {
      id: 'history-3',
      title: '多语种翻译记录',
      createdAt: '2024-05-29T16:42:00.000Z',
      functions: ['scan', 'translate', 'citation'],
      inputText:
        'The policy brief summarizes stakeholder interviews in English before appending machine translated Mandarin excerpts that still require attribution.',
      editorHtml: plainTextToHtml(
        'The policy brief summarizes stakeholder interviews in English before appending machine translated Mandarin excerpts that still require attribution.'
      ),
      analysis: buildSeedHistoryAnalysis({
        summary: { ai: 36, mixed: 41, human: 23 },
        sentences: [
          {
            id: 'history-3-s1',
            text: 'The policy brief summarizes stakeholder interviews in English.',
            type: 'human',
            probability: 0.18,
            reason: '句子包含清晰的采访背景与语境，更贴近人工撰写。',
          },
          {
            id: 'history-3-s2',
            text: 'Machine translated Mandarin excerpts still require attribution.',
            type: 'mixed',
            probability: 0.61,
            reason: '翻译语句结构自然但缺少具体出处，疑有人机混合痕迹。',
          },
          {
            id: 'history-3-s3',
            text: 'The appendix lists anonymous survey responses with identical phrasing.',
            type: 'ai',
            probability: 0.68,
            reason: '大量重复短语与模板化描述，呈现 AI 生成特征。',
          },
        ],
        translation:
          '第 2 句：Machine translated Mandarin excerpts still require attribution. → 机器翻译的中文摘录仍需补充来源信息。\n第 3 句：The appendix lists anonymous survey responses with identical phrasing. → 附录列出多条措辞完全一致的匿名调查回复。',
        citations: [
          {
            id: 'history-3-c1',
            excerpt: 'Machine translated Mandarin excerpts still require attribution.',
            status: '缺失引用',
            note: '请补充原始采访或政策文件出处。',
          },
          {
            id: 'history-3-c2',
            excerpt: 'The appendix lists anonymous survey responses with identical phrasing.',
            status: '待验证',
            note: '建议提供原始调研问卷或说明整理方法。',
          },
        ],
      }),
    },
  ];

export const useScanStore = defineStore('scan', () => {
  const inputText = ref('');
  const editorHtml = ref('');
  const selectedExampleKey = ref('');
  const isUploading = ref(false);
  const uploadError = ref('');
  const lastUploadedFileName = ref('');
  const selectedFunctions = ref(['scan']);
  const historyRecords = ref([...seedHistoryRecords]);
  const taskQueue = ref([]);
  const taskTimers = new Map();
  let taskSeed = 0;
  let isRestoring = false;
  let isHydratingHistory = false;

  const findTaskById = (id) => taskQueue.value.find((task) => task.id === id);

  const notifyTaskUpdate = (task, onUpdate) => {
    if (typeof onUpdate === 'function') {
      onUpdate({ ...task });
    }
  };

  const scheduleNextTick = (task, options) => {
    const timer = setTimeout(() => {
      taskTimers.delete(task.id);
      runTaskTick(task, options);
    }, 480);
    taskTimers.set(task.id, timer);
  };

  const finalizeTask = (task, status, options) => {
    task.status = status;
    task.finishedAt = new Date().toISOString();
    task.eta = 0;
    task.progress = status === 'success' ? 100 : task.progress;
    notifyTaskUpdate(task, options.onUpdate);
  };

  const runTaskTick = (task, options) => {
    if (!task || task.status === 'canceled') {
      return;
    }

    task.status = 'running';
    const increment = Math.max(5, Math.round(Math.random() * 18));
    task.progress = Math.min(100, task.progress + increment);
    task.eta = Math.max(0, task.eta - 600);
    notifyTaskUpdate(task, options.onUpdate);

    if (options.shouldFail && !options.failApplied) {
      options.failApplied = true;
      task.error = '任务出现异常，请稍后重试。';
      finalizeTask(task, 'error', options);
      return;
    }

    if (task.progress >= 100) {
      finalizeTask(task, 'success', options);
      return;
    }

    scheduleNextTick(task, options);
  };

  const enqueueMockTask = (options = {}) => {
    const normalizedOptions = {
      label: options.label || '扫描任务',
      duration: options.duration || DEFAULT_TASK_DURATION,
      failureRate: typeof options.failureRate === 'number' ? options.failureRate : 0,
      shouldFail: false,
      onUpdate: options.onUpdate,
    };

    if (normalizedOptions.failureRate > 0) {
      normalizedOptions.shouldFail = Math.random() < normalizedOptions.failureRate;
    }

    const id = `task-${Date.now()}-${taskSeed}`;
    taskSeed += 1;
    const task = {
      id,
      label: normalizedOptions.label,
      status: 'queued',
      progress: 0,
      eta: normalizedOptions.duration,
      error: '',
      createdAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
    };

    taskQueue.value = [task, ...taskQueue.value].slice(0, MAX_TASKS);

    const kickoff = () => {
      if (task.status === 'canceled') return;
      task.startedAt = new Date().toISOString();
      runTaskTick(task, normalizedOptions);
    };

    const timer = setTimeout(() => {
      taskTimers.delete(id);
      kickoff();
    }, 280);
    taskTimers.set(id, timer);

    return id;
  };

  const cancelTask = (id) => {
    const task = findTaskById(id);
    if (!task) return;
    const timer = taskTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      taskTimers.delete(id);
    }
    task.status = 'canceled';
    task.finishedAt = new Date().toISOString();
    task.eta = 0;
    notifyTaskUpdate(task, null);
  };

  const retryTask = (id, overrides = {}) => {
    const task = findTaskById(id);
    if (!task) return null;
    return enqueueMockTask({
      label: task.label,
      duration: overrides.duration || DEFAULT_TASK_DURATION,
      failureRate: overrides.failureRate ?? 0,
      onUpdate: overrides.onUpdate,
    });
  };

  const buildMockResults = (sentences = []) => {
    const sources = ['用户上传', '内部文档库', '外部搜索'];
    const now = Date.now();
    const payload = sentences.length
      ? sentences
      : [
          { text: '占位句子示例，等待真实检测结果。', probability: 0.42 },
          { text: '第二条占位句子，用于演示导出功能。', probability: 0.66 },
        ];

    return payload.map((item, index) => ({
      id: item.id || `mock-result-${index}-${Date.now()}`,
      text: item.text || item.raw || '暂无内容',
      probability: typeof item.probability === 'number' ? item.probability : 0.5,
      source: sources[index % sources.length],
      timestamp: new Date(now - index * 60 * 1000).toISOString(),
    }));
  };

  const downloadMockResults = (results = []) => {
    if (typeof window === 'undefined' || !Array.isArray(results)) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `scan-results-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const characterCount = computed(() => inputText.value.length);

  const setText = (value) => {
    const normalized = value || '';
    inputText.value = normalized;
    editorHtml.value = plainTextToHtml(normalized);
    selectedExampleKey.value = '';
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
      uploadError.value = error.message || '文件解析失败，请稍后重试。';
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

  const persistHistory = () => {
    if (isHydratingHistory || typeof window === 'undefined') return;
    try {
      const payload = historyRecords.value.map((item) => ({
        ...item,
        analysis: item.analysis
          ? {
              ...item.analysis,
              sentences: (item.analysis.sentences || []).map((sentence) => ({ ...sentence })),
              polish: (item.analysis.polish || []).map((entry) => ({ ...entry })),
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
                    type: ['ai', 'mixed', 'human'].includes(sentence.type) ? sentence.type : 'human',
                    probability: typeof sentence.probability === 'number' ? sentence.probability : 0.5,
                    reason: sentence.reason || '',
                  }))
                : [],
              translation: record.analysis.translation || '',
              polish: Array.isArray(record.analysis.polish)
                ? record.analysis.polish.map((entry, entryIndex) => ({
                    id: entry.id || `history-${index}-polish-${entryIndex}`,
                    original: entry.original || '',
                    suggestion: entry.suggestion || '',
                    reason: entry.reason || '',
                  }))
                : [],
              citations: Array.isArray(record.analysis.citations)
                ? record.analysis.citations.map((entry, entryIndex) => ({
                    id: entry.id || `history-${index}-citation-${entryIndex}`,
                    excerpt: entry.excerpt || '',
                    status: entry.status || '待验证',
                    note: entry.note || '',
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
          sentences: (analysis.sentences || []).map((sentence, index) => ({
            id: sentence.id || `history-new-sentence-${index}`,
            text: sentence.text || '',
            raw: sentence.raw || sentence.text || '',
            type: ['ai', 'mixed', 'human'].includes(sentence.type) ? sentence.type : 'human',
            probability: typeof sentence.probability === 'number' ? sentence.probability : 0.5,
            reason: sentence.reason || '',
          })),
          polish: (analysis.polish || []).map((entry, index) => ({
            id: entry.id || `history-new-polish-${index}`,
            original: entry.original || '',
            suggestion: entry.suggestion || '',
            reason: entry.reason || '',
          })),
          citations: (analysis.citations || []).map((entry, index) => ({
            id: entry.id || `history-new-citation-${index}`,
            excerpt: entry.excerpt || '',
            status: entry.status || '待验证',
            note: entry.note || '',
          })),
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
     setEditorHtml,
    applyExample,
    readFile,
    readFiles,
    resetError,
    toggleFunction,
    setFunctions,
    resetFunctions,
    resetText,
    resetAll,
    commitDraftToStorage,
    historyRecords,
    addHistoryRecord,
    taskQueue,
    enqueueMockTask,
    cancelTask,
    retryTask,
    findTaskById,
    buildMockResults,
    downloadMockResults,
  };
});
