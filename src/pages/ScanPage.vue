<template>
  <div class="min-h-screen bg-slate-100">
    <AppHeader mode="dashboard" />
    <div class="flex flex-col lg:flex-row">
      <aside class="hidden w-64 flex-shrink-0 flex-col border-b border-slate-200 bg-white/90 px-4 py-6 shadow-sm lg:flex lg:border-b-0 lg:border-r">
        <nav class="space-y-2">
          <button
            type="button"
            class="nav-item"
            @click="goHome"
          >
            <HomeIcon class="h-5 w-5" />
            <span>Home</span>
          </button>
          <button type="button" class="nav-item nav-item--active">
            <DocumentTextIcon class="h-5 w-5" />
            <span>Document</span>
          </button>
          <div class="relative">
            <button
              ref="newMenuButtonRef"
              type="button"
              class="nav-item"
              @click="toggleNewMenu"
            >
              <PlusIcon class="h-5 w-5" />
              <span>New</span>
            </button>
            <transition name="fade">
              <div
                v-if="newMenuOpen"
                ref="newMenuRef"
                class="absolute left-0 top-full z-10 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
              >
                <button type="button" class="menu-item" @click="startNewScan">新建扫描</button>
                <button type="button" class="menu-item" @click="triggerMultiUpload">批量上传</button>
              </div>
            </transition>
          </div>
        </nav>
        <div class="mt-auto rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
          <p>拖拽 TXT / DOCX / PDF 等文件到编辑区即可自动读取。</p>
        </div>
        <input
          ref="multiFileInput"
          type="file"
          class="hidden"
          multiple
          accept=".txt,.md,.doc,.docx,.pdf,.json,.csv,.yaml,.yml,.tex,.tax"
          @change="onMultiFileChange"
        />
      </aside>

      <main class="flex min-h-[calc(100vh-4rem)] flex-1 flex-col overflow-hidden">
        <div class="border-b border-slate-200 bg-white/70 px-4 py-3 backdrop-blur">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex flex-wrap items-center gap-2">
              <div class="inline-flex items-center overflow-hidden rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-600">
                <button
                  v-for="mode in editorModes"
                  :key="mode.key"
                  type="button"
                  :class="[
                    'rounded-full px-3 py-1 transition',
                    editorMode === mode.key ? 'bg-slate-900 text-white shadow' : 'hover:bg-slate-100',
                    mode.key === 'preview' && !hasResults ? 'pointer-events-none opacity-40' : '',
                  ]"
                  @click="editorMode = mode.key"
                >
                  {{ mode.label }}
                </button>
              </div>
              <button
                type="button"
                class="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-600"
                @click="resetEditor"
              >
                一键重置
              </button>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>{{ characterUsage }}</span>
              <span>已选功能：{{ selectedFunctionSummary }}</span>
              <span v-if="scanStore.lastUploadedFileName" class="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">
                <ArrowUpTrayIcon class="mr-1 h-3 w-3 text-primary-500" />
                {{ scanStore.lastUploadedFileName }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <section class="flex-1 overflow-hidden px-4 py-6">
            <div class="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-6 py-3">
                <div class="flex flex-wrap items-center gap-2">
                  <button type="button" class="toolbar-button" @click="applyCommand('bold')">B</button>
                  <button type="button" class="toolbar-button italic" @click="applyCommand('italic')">I</button>
                  <button type="button" class="toolbar-button underline" @click="applyCommand('underline')">U</button>
                  <button type="button" class="toolbar-button" @click="applyCommand('insertUnorderedList')">• 列表</button>
                  <button type="button" class="toolbar-button" @click="applyCommand('insertOrderedList')">1. 列表</button>
                  <button type="button" class="toolbar-button" @click="applyCommand('justifyLeft')">左对齐</button>
                  <button type="button" class="toolbar-button" @click="applyCommand('justifyCenter')">居中</button>
                  <button type="button" class="toolbar-button" @click="applyCommand('justifyRight')">右对齐</button>
                  <div class="toolbar-select">
                    <label class="sr-only" for="font-size">字体大小</label>
                    <select id="font-size" class="text-xs" @change="onFontSizeChange">
                      <option value="" selected>字体大小</option>
                      <option value="small">12px</option>
                      <option value="base">14px</option>
                      <option value="lg">16px</option>
                      <option value="xl">18px</option>
                      <option value="2xl">24px</option>
                    </select>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" class="toolbar-button" @click="triggerUpload">
                    <ArrowUpTrayIcon class="mr-1 h-4 w-4" />
                    上传文件
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500"
                    @click="handleScan"
                  >
                    <svg
                      v-if="isScanning"
                      class="mr-2 h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    {{ isScanning ? '扫描中...' : '开始扫描' }}
                  </button>
                </div>
              </div>
              <div class="relative flex-1 overflow-hidden">
                <div
                  v-show="editorMode === 'edit'"
                  ref="editorRef"
                  class="editor-surface"
                  contenteditable="true"
                  data-placeholder="拖拽文档或直接粘贴文本，开始智能检测。"
                  @input="onEditorInput"
                  @focus="editorMode = 'edit'"
                  @dragenter.prevent="onDragEnter"
                  @dragover.prevent="onDragOver"
                  @dragleave.prevent="onDragLeave"
                  @drop.prevent="onDrop"
                ></div>
                <div
                  v-show="editorMode === 'preview'"
                  class="preview-surface"
                >
                  <div v-if="hasResults" v-html="highlightedPreviewHtml"></div>
                  <div v-else class="flex h-full items-center justify-center text-sm text-slate-400">
                    生成检测结果后可在此查看颜色标注。
                  </div>
                </div>
                <div
                  v-if="dragActive"
                  class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary-400 bg-primary-50/80 text-primary-600"
                >
                  <ArrowUpTrayIcon class="mb-3 h-10 w-10" />
                  <p class="text-sm font-semibold">释放鼠标上传文档</p>
                  <p class="mt-1 text-xs">支持 TXT / DOCX / PDF / Markdown 等格式</p>
                </div>
              </div>
              <div class="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
                <span>自动保存草稿，刷新页面不会丢失内容。</span>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept=".txt,.md,.doc,.docx,.pdf,.json,.csv,.yaml,.yml,.tex,.tax"
              @change="onFileChange"
            />
          </section>

          <aside
            :class="[
              'relative w-full border-t border-slate-200 bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.08)] transition-all duration-300 ease-in-out lg:w-96 lg:border-t-0 lg:border-l lg:shadow-none',
              isDrawerOpen ? 'lg:translate-x-0' : 'lg:-translate-x-72',
            ]"
          >
            <button
              type="button"
              class="absolute -left-5 top-6 hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-lg transition hover:border-primary-300 hover:text-primary-600 lg:flex"
              @click="isDrawerOpen = !isDrawerOpen"
            >
              <ChevronLeftIcon :class="['h-5 w-5 transition', isDrawerOpen ? 'rotate-180' : '']" />
            </button>
            <div class="h-full overflow-y-auto px-5 py-6">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-sm font-semibold text-slate-900">Scan Menu</h2>
                  <p class="text-xs text-slate-500">选择功能并查看对应结果</p>
                </div>
              </div>

              <div v-if="!hasResults" class="mt-6 space-y-6">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="option in functionOptions"
                    :key="option.key"
                    type="button"
                    :class="[
                      'function-chip',
                      isFunctionSelected(option.key)
                        ? option.activeClass
                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-600',
                    ]"
                    @click="toggleFunction(option.key)"
                  >
                    <component :is="option.icon" class="mr-1.5 h-4 w-4" />
                    {{ option.label }}
                  </button>
                </div>
                <div class="space-y-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                  <p>已选功能：{{ selectedFunctionSummary }}</p>
                  <p>{{ characterUsage }}</p>
                  <p v-if="scanStore.lastUploadedFileName">已导入：{{ scanStore.lastUploadedFileName }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-slate-500">试试这些范例</p>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <button
                      v-for="example in scanStore.examples"
                      :key="example.key"
                      type="button"
                      :class="[
                        'rounded-full border px-3 py-1 text-xs font-medium transition',
                        scanStore.selectedExampleKey === example.key
                          ? 'border-primary-300 bg-primary-50 text-primary-600'
                          : 'border-slate-200 text-slate-500 hover:border-primary-200 hover:text-primary-600',
                      ]"
                      @click="applyExample(example.key)"
                    >
                      {{ example.label }}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  class="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  @click="handleScan"
                >
                  立即扫描
                </button>
                <p class="text-xs text-slate-400">登录后可保存扫描记录、导出报告与管理团队额度。</p>
              </div>

              <div v-else class="mt-6 space-y-6">
                <div class="rounded-2xl bg-slate-900 p-5 text-white shadow-lg">
                  <p class="text-xs uppercase tracking-[0.3em] text-white/70">AI 检测摘要</p>
                  <div class="mt-4 flex items-end justify-between">
                    <div>
                      <p class="text-xl font-semibold">潜在相似句 {{ detectionResults.aiLikelyCount }} 句</p>
                      <p class="mt-1 text-xs text-white/70">含 AI 生成或人机混合特征的句子总数</p>
                    </div>
                  </div>
                  <div class="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div class="rounded-xl bg-amber-500/20 p-3">
                      <p class="text-[10px] uppercase tracking-widest text-amber-200">AI Generated</p>
                      <p class="mt-2 text-lg font-semibold">{{ detectionResults.summary.ai }}%</p>
                    </div>
                    <div class="rounded-xl bg-violet-500/20 p-3">
                      <p class="text-[10px] uppercase tracking-widest text-violet-200">Mixed</p>
                      <p class="mt-2 text-lg font-semibold">{{ detectionResults.summary.mixed }}%</p>
                    </div>
                    <div class="rounded-xl bg-emerald-500/20 p-3">
                      <p class="text-[10px] uppercase tracking-widest text-emerald-200">Human</p>
                      <p class="mt-2 text-lg font-semibold">{{ detectionResults.summary.human }}%</p>
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="tab in availableResultTabs"
                    :key="tab.key"
                    type="button"
                    :class="[
                      'rounded-full border px-3 py-1 text-xs font-semibold transition',
                      activeResultTab === tab.key
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-600',
                    ]"
                    @click="activeResultTab = tab.key"
                  >
                    {{ tab.label }}
                  </button>
                </div>

                <div v-if="activeResultTab === 'scan'" class="space-y-4">
                  <div
                    v-for="sentence in detectionResults.sentences"
                    :key="sentence.id"
                    :class="['rounded-2xl border p-4 text-sm', highlightBorderClass(sentence.type)]"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <p class="flex-1 leading-relaxed" v-html="formatHighlightedSentence(sentence)"></p>
                      <span class="text-xs font-semibold text-slate-500">概率 {{ Math.round(sentence.probability * 100) }}%</span>
                    </div>
                    <p class="mt-2 text-xs text-slate-500">{{ sentence.reason }}</p>
                  </div>
                </div>

                <div v-else-if="activeResultTab === 'translate'" class="space-y-3">
                  <p class="text-xs font-semibold text-slate-500">自动翻译结果</p>
                  <div class="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                    {{ detectionResults.translation }}
                  </div>
                </div>

                <div v-else-if="activeResultTab === 'polish'" class="space-y-4">
                  <p class="text-xs font-semibold text-slate-500">润色建议</p>
                  <div
                    v-for="suggestion in detectionResults.polish"
                    :key="suggestion.id"
                    class="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
                  >
                    <p class="font-semibold text-slate-700">{{ suggestion.suggestion }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ suggestion.reason }}</p>
                    <button
                      type="button"
                      class="mt-3 inline-flex items-center rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-500"
                      @click="applyPolishSuggestion(suggestion)"
                    >
                      一键应用
                    </button>
                  </div>
                  <p class="text-[11px] text-slate-400">应用后请再次扫描以刷新检测结果。</p>
                </div>

                <div v-else-if="activeResultTab === 'citation'" class="space-y-4">
                  <p class="text-xs font-semibold text-slate-500">引用核查</p>
                  <div
                    v-for="item in detectionResults.citations"
                    :key="item.id"
                    class="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
                  >
                    <div class="flex items-start justify-between">
                      <p class="flex-1 text-slate-700">{{ item.excerpt }}</p>
                      <span class="ml-3 rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="citationStatusClass(item.status)">
                        {{ item.status }}
                      </span>
                    </div>
                    <p class="mt-2 text-xs text-slate-500">{{ item.note }}</p>
                  </div>
                  <p class="text-[11px] text-slate-400">引用核查为占位逻辑，后续可接入真实数据库。</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
    <LoginPromptModal :open="showLoginModal" :message="loginMessage" @close="showLoginModal = false" />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowUpTrayIcon,
  ChevronLeftIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  HomeIcon,
  LanguageIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline';
import AppHeader from '../sections/AppHeader.vue';
import LoginPromptModal from '../components/common/LoginPromptModal.vue';
import { useAuthStore } from '../store/auth';
import { useScanStore } from '../store/scan';

const authStore = useAuthStore();
const scanStore = useScanStore();
const router = useRouter();
const route = useRoute();

const editorRef = ref(null);
const fileInput = ref(null);
const multiFileInput = ref(null);
const newMenuRef = ref(null);
const newMenuButtonRef = ref(null);

const editorMode = ref('edit');
const isDrawerOpen = ref(true);
const isScanning = ref(false);
const dragActive = ref(false);
const detectionResults = ref(null);
const highlightedPreviewHtml = ref('');
const showLoginModal = ref(false);
const loginMessage = ref('登录后即可查看完整检测结果。');
const activeResultTab = ref('scan');
const newMenuOpen = ref(false);

const editorModes = [
  { key: 'edit', label: '编辑模式' },
  { key: 'preview', label: '标色预览' },
];

const functionOptions = [
  { key: 'scan', label: 'AI 检测', icon: ShieldCheckIcon, activeClass: 'border-transparent bg-slate-900 text-white shadow-sm' },
  { key: 'polish', label: '润色', icon: PencilSquareIcon, activeClass: 'border-transparent bg-primary-600 text-white shadow-sm' },
  { key: 'translate', label: '翻译', icon: LanguageIcon, activeClass: 'border-transparent bg-sky-600 text-white shadow-sm' },
  {
    key: 'citation',
    label: '引用核查',
    icon: DocumentMagnifyingGlassIcon,
    activeClass: 'border-transparent bg-emerald-600 text-white shadow-sm',
  },
];

const fontSizeMap = {
  small: '2',
  base: '3',
  lg: '4',
  xl: '5',
  '2xl': '6',
};

const characterUsage = computed(() => `字数：${scanStore.characterCount}/${scanStore.characterLimit}`);

const selectedFunctionSummary = computed(() => {
  if (!scanStore.selectedFunctions.length) {
    return 'AI 检测';
  }
  const labelMap = functionOptions.reduce((acc, option) => {
    acc[option.key] = option.label;
    return acc;
  }, {});
  return scanStore.selectedFunctions.map((key) => labelMap[key] || key).join('、');
});

const hasResults = computed(() => Boolean(detectionResults.value));

const availableResultTabs = computed(() => {
  const tabs = [{ key: 'scan', label: 'AI 检测' }];
  if (scanStore.selectedFunctions.includes('polish')) {
    tabs.push({ key: 'polish', label: '润色建议' });
  }
  if (scanStore.selectedFunctions.includes('translate')) {
    tabs.push({ key: 'translate', label: '翻译结果' });
  }
  if (scanStore.selectedFunctions.includes('citation')) {
    tabs.push({ key: 'citation', label: '引用核查' });
  }
  return tabs;
});

const highlightBorderClass = (type) => {
  if (type === 'ai') return 'border-amber-200 bg-amber-50';
  if (type === 'mixed') return 'border-violet-200 bg-violet-50';
  return 'border-emerald-200 bg-emerald-50';
};

const citationStatusClass = (status) => {
  if (status === '缺失引用') {
    return 'bg-rose-100 text-rose-600';
  }
  if (status === '待验证') {
    return 'bg-amber-100 text-amber-600';
  }
  return 'bg-emerald-100 text-emerald-600';
};

const marketingReasons = {
  ai: '句式重复且缺少真实细节，呈现出明显的模板化生成痕迹。',
  mixed: '部分句子自然，但仍夹杂模型常见的衔接词与泛化表达。',
  human: '语句包含个性化经历与细节，语气自然贴近人类写作。',
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const tokenizeText = (text = '') => {
  const normalized = String(text).replace(/\r\n/g, '\n');
  const regex = /([^\n。！？!?]+[。！？!?]?|\n)/g;
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

const buildHighlightedHtml = (tokens, sentences) => {
  const classMap = {
    ai: 'bg-amber-100 text-amber-900',
    mixed: 'bg-violet-100 text-violet-900',
    human: 'bg-emerald-100 text-emerald-900',
  };
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

const classifyOrder = ['ai', 'mixed', 'human'];

const simulateAnalysis = () => {
  const text = scanStore.inputText.trim();
  const tokens = tokenizeText(text);
  const sentenceTokens = tokens.filter((token) => token.type === 'sentence');

  if (!sentenceTokens.length) {
    return {
      summary: { ai: 0, mixed: 0, human: 100 },
      sentences: [],
      translation: '尚未检测到可分析的句子，请输入文本后重新扫描。',
      polish: [],
      citations: [],
      aiLikelyCount: 0,
      highlightedHtml: '<p class="text-sm text-slate-400">暂无内容，请先输入文本。</p>',
    };
  }

  const counts = { ai: 0, mixed: 0, human: 0 };
  const sentences = sentenceTokens.map((token, index) => {
    const type = classifyOrder[index % classifyOrder.length];
    counts[type] += 1;
    const probability =
      type === 'ai'
        ? Number((0.72 + (index % 3) * 0.06).toFixed(2))
        : type === 'mixed'
        ? Number((0.46 + (index % 3) * 0.08).toFixed(2))
        : Number((0.18 + (index % 3) * 0.05).toFixed(2));
    return {
      id: `sentence-${index}`,
      text: token.text,
      raw: token.raw,
      type,
      probability,
      reason: marketingReasons[type],
    };
  });

  const total = sentences.length;
  const summary = {
    ai: Math.round((counts.ai / total) * 100),
    mixed: Math.round((counts.mixed / total) * 100),
    human: Math.round((counts.human / total) * 100),
  };
  const diff = summary.ai + summary.mixed + summary.human - 100;
  if (diff !== 0) {
    summary.human = Math.max(0, summary.human - diff);
  }

  const translation = sentenceTokens
    .map((token, index) => `第 ${index + 1} 句：${token.text} → ${token.text.replace(/。?$/, '。')}【示例译文】`)
    .join('\n');

  const polish = sentences.slice(0, Math.min(4, sentences.length)).map((item, index) => ({
    id: `polish-${index}`,
    original: item.text,
    suggestion: `${item.text.replace(/。?$/, '')}，加入更具体的事实与数据以增强可信度。`,
    reason:
      item.type === 'human'
        ? '优化语气以保持整体风格一致。'
        : '改写句式并补充细节，以降低模型生成痕迹。',
  }));

  const citations = sentenceTokens.slice(0, Math.min(3, sentenceTokens.length)).map((token, index) => {
    const statusCycle = ['待验证', '缺失引用', '已找到线索'];
    return {
      id: `citation-${index}`,
      excerpt: token.text,
      status: statusCycle[index % statusCycle.length],
      note:
        statusCycle[index % statusCycle.length] === '缺失引用'
          ? '未检测到权威来源，请补充引用。'
          : statusCycle[index % statusCycle.length] === '待验证'
          ? '建议补充出处或核查现有来源准确性。'
          : '已匹配到可能的来源，请确认引用格式。',
    };
  });

  return {
    summary,
    sentences,
    translation,
    polish,
    citations,
    aiLikelyCount: counts.ai + counts.mixed,
    highlightedHtml: buildHighlightedHtml(tokens, sentences),
  };
};

const syncEditorFromStore = () => {
  if (!editorRef.value) return;
  const html = scanStore.editorHtml || '';
  if (editorRef.value.innerHTML !== html) {
    editorRef.value.innerHTML = html;
  }
};

onMounted(() => {
  syncEditorFromStore();
  const features = parseFeatures(route.query.features);
  if (features.length) {
    scanStore.setFunctions(features);
  }
  document.addEventListener('click', onGlobalClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalClick);
});

watch(
  () => scanStore.editorHtml,
  () => {
    syncEditorFromStore();
  }
);

watch(availableResultTabs, (tabs) => {
  if (!tabs.find((tab) => tab.key === activeResultTab.value)) {
    activeResultTab.value = 'scan';
  }
});

watch(
  () => route.query.features,
  (value) => {
    const features = parseFeatures(value);
    if (features.length) {
      scanStore.setFunctions(features);
    }
  }
);

const parseFeatures = (value) => {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => ['scan', 'polish', 'translate', 'citation'].includes(item));
};

const formatHighlightedSentence = (sentence) => {
  const colorMap = {
    ai: 'text-amber-700',
    mixed: 'text-violet-700',
    human: 'text-emerald-700',
  };
  return `<span class="font-semibold ${colorMap[sentence.type] || ''}">${escapeHtml(sentence.text)}</span>`;
};

const applyExample = (key) => {
  scanStore.applyExample(key);
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
  nextTick(() => {
    syncEditorFromStore();
  });
};

const isFunctionSelected = (key) => scanStore.selectedFunctions.includes(key);

const toggleFunction = (key) => {
  scanStore.toggleFunction(key);
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
};

const onEditorInput = (event) => {
  scanStore.setEditorHtml(event.target.innerHTML);
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
};

const applyCommand = (command) => {
  if (!editorRef.value) return;
  editorRef.value.focus();
  document.execCommand(command, false, null);
  scanStore.setEditorHtml(editorRef.value.innerHTML);
  scanStore.commitDraftToStorage();
};

const onFontSizeChange = (event) => {
  const value = event.target.value;
  if (!value) return;
  if (!editorRef.value) return;
  editorRef.value.focus();
  document.execCommand('fontSize', false, fontSizeMap[value]);
  event.target.value = '';
  scanStore.setEditorHtml(editorRef.value.innerHTML);
  scanStore.commitDraftToStorage();
};

const handleScan = async () => {
  if (!scanStore.selectedFunctions.length) {
    scanStore.setFunctions(['scan']);
  }

  if (!authStore.isAuthenticated) {
    loginMessage.value = '请登录后开始扫描并查看检测结果。';
    showLoginModal.value = true;
    return;
  }

  if (!scanStore.inputText.trim()) {
    loginMessage.value = '请先输入文本或上传文件，再开始扫描。';
    showLoginModal.value = true;
    return;
  }

  isScanning.value = true;
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const analysis = simulateAnalysis();
  detectionResults.value = analysis;
  highlightedPreviewHtml.value = analysis.highlightedHtml;
  editorMode.value = 'preview';
  activeResultTab.value = 'scan';
  isDrawerOpen.value = true;
  isScanning.value = false;
  scanStore.commitDraftToStorage();
};

const resetEditor = () => {
  scanStore.resetText();
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
  nextTick(() => {
    syncEditorFromStore();
  });
  scanStore.commitDraftToStorage();
};

const applyPolishSuggestion = (suggestion) => {
  if (!suggestion?.original || !suggestion?.suggestion) return;
  const updated = scanStore.inputText.replace(suggestion.original, suggestion.suggestion);
  scanStore.setText(updated);
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
  nextTick(() => {
    syncEditorFromStore();
  });
  scanStore.commitDraftToStorage();
};

const triggerUpload = () => {
  scanStore.resetError();
  fileInput.value?.click();
};

const onFileChange = async (event) => {
  const [file] = event.target.files || [];
  if (!file) return;
  try {
    await scanStore.readFile(file);
    detectionResults.value = null;
    highlightedPreviewHtml.value = '';
    editorMode.value = 'edit';
    nextTick(() => {
      syncEditorFromStore();
    });
  } catch (error) {
    console.error(error);
  } finally {
    event.target.value = '';
    scanStore.commitDraftToStorage();
  }
};

const triggerMultiUpload = () => {
  newMenuOpen.value = false;
  multiFileInput.value?.click();
};

const onMultiFileChange = async (event) => {
  const files = event.target.files;
  if (!files?.length) return;
  try {
    await scanStore.readFiles(files);
    detectionResults.value = null;
    highlightedPreviewHtml.value = '';
    editorMode.value = 'edit';
    nextTick(() => {
      syncEditorFromStore();
    });
  } catch (error) {
    console.error(error);
  } finally {
    event.target.value = '';
    scanStore.commitDraftToStorage();
  }
};

const onDragEnter = () => {
  dragActive.value = true;
};

const onDragOver = () => {
  dragActive.value = true;
};

const onDragLeave = () => {
  dragActive.value = false;
};

const onDrop = async (event) => {
  dragActive.value = false;
  const files = event.dataTransfer?.files;
  if (!files?.length) return;
  try {
    await scanStore.readFiles(files);
    detectionResults.value = null;
    highlightedPreviewHtml.value = '';
    editorMode.value = 'edit';
    nextTick(() => {
      syncEditorFromStore();
    });
  } catch (error) {
    console.error(error);
  } finally {
    scanStore.commitDraftToStorage();
  }
};

const goHome = () => {
  router.push({ name: 'home' });
};

const startNewScan = () => {
  newMenuOpen.value = false;
  scanStore.resetAll();
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
  activeResultTab.value = 'scan';
  nextTick(() => {
    syncEditorFromStore();
  });
  scanStore.commitDraftToStorage();
};

const toggleNewMenu = () => {
  newMenuOpen.value = !newMenuOpen.value;
};

const onGlobalClick = (event) => {
  if (!newMenuOpen.value) return;
  const target = event.target;
  if (newMenuRef.value?.contains(target) || newMenuButtonRef.value?.contains(target)) return;
  newMenuOpen.value = false;
};

</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.nav-item {
  @apply flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-600;
}
.nav-item--active {
  @apply border-slate-900 bg-slate-900 text-white shadow;
}
.menu-item {
  @apply flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100;
}

.toolbar-button {
  @apply inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-600;
}

.toolbar-select select {
  @apply rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-600 focus:outline-none;
}

.editor-surface {
  @apply h-full overflow-y-auto px-6 py-6 text-sm leading-relaxed text-slate-700 focus:outline-none;
}

.editor-surface:empty::before {
  content: attr(data-placeholder);
  @apply text-slate-400;
}

.preview-surface {
  @apply h-full overflow-y-auto px-6 py-6 text-sm leading-relaxed text-slate-700;
}

.highlight-chip {
  @apply rounded-xl px-1.5 py-0.5;
}

.function-chip {
  @apply inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition;
}
</style>
