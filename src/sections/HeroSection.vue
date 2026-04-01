<template>
  <section class="relative overflow-hidden bg-[linear-gradient(180deg,#edf2ee_0%,#f7faf7_58%,#fcfdfb_100%)] pb-24 pt-20 text-slate-900">
    <div class="absolute inset-0 -z-10">
      <div class="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/80 to-transparent"></div>
      <div class="absolute left-1/2 top-0 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-sky-200/35 blur-3xl"></div>
      <div class="absolute -left-20 top-24 h-80 w-80 rounded-full bg-primary-200/40 blur-3xl"></div>
      <div class="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,184,175,0.18),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.18),rgba(247,250,247,0.76))]"></div>
    </div>
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
        <div class="relative">
          <div class="inline-flex items-center space-x-2 rounded-full border border-slate-200/80 bg-white/75 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm shadow-slate-200/60 backdrop-blur">
            <span class="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>{{ t('hero.badge') }}</span>
          </div>
          <h1 class="mt-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">
            {{ t('hero.titlePrefix') }}
            <span class="bg-gradient-to-r from-sky-700 via-slate-900 to-emerald-700 bg-clip-text text-transparent">{{ t('hero.titleHighlight') }}</span>
          </h1>
          <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {{ t('hero.subtitle') }}
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full bg-[#314650] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300/40 transition hover:-translate-y-0.5 hover:bg-[#2b3e47]"
              @click="goToScan('scan')"
            >
              {{ t('hero.primaryCta') }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white"
              @click="triggerUpload"
            >
              {{ t('hero.upload') }}
            </button>
          </div>
          <div class="mt-8 grid gap-4 sm:grid-cols-3">
            <div
              v-for="item in heroStatItems"
              :key="item.label"
              class="rounded-3xl border border-slate-200/80 bg-white/78 p-4 shadow-sm shadow-slate-200/70 backdrop-blur"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ item.label }}</p>
              <p class="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{{ item.value }}</p>
              <p class="mt-1 text-xs text-slate-400">{{ item.description }}</p>
            </div>
          </div>
          <div class="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div class="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-5 shadow-sm shadow-slate-200/70 backdrop-blur">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ heroAuditCopy.panelTitle }}</p>
                <span class="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">{{ heroPreviewState.badge }}</span>
              </div>
              <div class="mt-5 space-y-3">
                <div
                  v-for="item in heroSignalItems"
                  :key="item.label"
                  class="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-[#eef2ef] px-4 py-3"
                >
                  <div>
                    <p class="text-sm font-semibold text-slate-900">{{ item.label }}</p>
                    <p class="mt-1 text-xs text-slate-400">{{ item.description }}</p>
                  </div>
                  <span class="text-sm font-semibold text-sky-700">{{ item.value }}</span>
                </div>
              </div>
            </div>
            <ul class="grid gap-3 text-sm text-slate-700">
              <li v-for="item in highlightItems" :key="item" class="flex items-start space-x-3 rounded-2xl border border-slate-200/80 bg-white/78 px-4 py-3 shadow-sm shadow-slate-200/60">
                <svg class="mt-0.5 h-4 w-4 flex-none text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="relative rounded-[2rem] border border-slate-200/70 bg-[#fbfcfa]/95 p-6 text-slate-900 shadow-xl shadow-slate-200/80 backdrop-blur">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">{{ t('hero.previewBadge') }}</p>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{{ heroAuditCopy.previewTitle }}</h2>
              <p class="mt-1 text-sm text-slate-500">{{ heroPreviewState.previewSubtitle }}</p>
            </div>
            <div class="rounded-2xl bg-[#314650] px-4 py-3 text-right text-white shadow-lg shadow-slate-300/40">
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{{ heroPreviewState.scoreLabel }}</p>
              <p class="mt-2 text-3xl font-semibold tracking-tight">
                {{ heroPreviewState.scoreDisplay }}<span v-if="heroPreviewState.scoreSuffix">{{ heroPreviewState.scoreSuffix }}</span>
              </p>
            </div>
          </div>

          <div class="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50/90 p-4">
            <div v-if="heroPreviewState.hasQuantitativeSnapshot" class="grid gap-3">
              <div v-for="bar in heroRiskBars" :key="bar.label" class="space-y-1.5">
                <div class="flex items-center justify-between text-xs font-semibold">
                  <span class="text-slate-600">{{ bar.label }}</span>
                  <span class="text-slate-900">{{ bar.value }}%</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div :class="['h-full rounded-full transition-all duration-500', bar.className]" :style="{ width: `${bar.value}%` }"></div>
                </div>
              </div>
            </div>
            <div
              v-else
              class="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm text-slate-500"
            >
              {{ heroPreviewState.snapshotHint }}
            </div>
          </div>

          <div class="mt-6">
            <label class="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>{{ t('hero.form.label') }}</span>
              <button
                type="button"
                class="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
                @click="resetInput"
              >
                {{ t('hero.form.reset') }}
              </button>
            </label>
            <textarea
              v-model="heroText"
              rows="9"
              class="mt-3 w-full rounded-[1.6rem] border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700 shadow-inner shadow-slate-200/60 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              :placeholder="t('hero.form.placeholder')"
              @input="syncDraftFromHero"
              @dragover.prevent
              @drop.prevent="handleDrop"
            ></textarea>
          </div>

          <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="option in functionOptions"
                :key="option.key"
                type="button"
                :class="[
                  'inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold transition',
                  option.key !== 'scan' ? 'cursor-not-allowed opacity-50' : '',
                  isFunctionSelected(option.key)
                    ? 'border-transparent bg-[#314650] text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-600',
                ]"
                @click="toggleFunction(option.key)"
              >
                <component :is="option.icon" class="mr-2 h-4 w-4" />
                {{ option.label }}
              </button>
            </div>
            <p class="text-xs font-medium text-slate-500">{{ heroPreviewState.readiness }}</p>
          </div>

          <div class="mt-5 space-y-3 text-xs text-slate-500">
            <div class="flex flex-wrap items-center gap-2">
              <span>{{ t('hero.examples.title') }}</span>
              <button
                v-for="example in scanStore.examples"
                :key="example.key"
                type="button"
                :class="[
                  'rounded-full border px-3 py-1 font-medium transition',
                  scanStore.selectedExampleKey === example.key
                    ? 'border-primary-300 bg-primary-50 text-primary-600'
                    : 'border-slate-200 text-slate-500 hover:border-primary-200 hover:text-primary-600',
                ]"
                @click="applyExample(example.key)"
              >
                {{ example.label }}
              </button>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <span>{{ t('hero.examples.wordCount', { current: heroText.length, limit: scanStore.characterLimit }) }}</span>
              <span>{{ t('hero.examples.selectedFunctions', { value: selectedFunctionSummary }) }}</span>
            </div>
            <div v-if="scanStore.uploadError" class="flex items-center space-x-2 rounded-2xl bg-rose-50 px-3 py-2 text-rose-600">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M5.22 5.22l13.56 13.56M19 13a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{{ scanStore.uploadError }}</span>
            </div>
            <div v-if="warningMessage" class="flex items-center space-x-2 rounded-2xl bg-amber-50 px-3 py-2 text-amber-700">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M12 3l9 16H3L12 3z" />
              </svg>
              <span>{{ warningMessage }}</span>
              <button
                type="button"
                class="text-xs font-semibold text-amber-700 underline underline-offset-2"
                @click="goToMultiUpload"
              >
                {{ heroAuditCopy.multiUploadCta }}
              </button>
            </div>
            <div v-if="scanStore.lastUploadedFileName" class="flex items-center space-x-2 text-slate-500">
              <svg class="h-4 w-4 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16.75V5a2 2 0 012-2h6.586a2 2 0 011.414.586l5.414 5.414a2 2 0 01.586 1.414V19a2 2 0 01-2 2H6a2 2 0 01-2-2" />
              </svg>
              <span>{{ t('hero.examples.uploaded', { name: scanStore.lastUploadedFileName }) }}</span>
            </div>
          </div>

          <div class="mt-5 rounded-[1.6rem] bg-[#314650] p-4 text-white shadow-lg shadow-slate-300/35">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ heroAuditCopy.queueTitle }}</p>
                <p class="mt-1 text-sm text-slate-300">{{ heroPreviewState.queueSubtitle }}</p>
              </div>
              <span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold text-sky-100">{{ heroPreviewState.badge }}</span>
            </div>
            <div class="mt-4 space-y-3">
              <div
                v-for="snippet in heroPreviewSnippets"
                :key="`${snippet.label}-${snippet.text}`"
                class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{{ snippet.label }}</p>
                  <span :class="['rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]', snippet.badgeClass]">{{ snippet.badge }}</span>
                </div>
                <p class="mt-2 text-sm leading-6 text-slate-100">{{ snippet.text }}</p>
              </div>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept=".pdf,.docx,.txt"
                @change="onFileChange"
              />
              <button
                type="button"
                class="inline-flex items-center rounded-full border border-dashed border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:border-primary-300 hover:text-primary-600"
                @click="triggerUpload"
              >
                <ArrowUpTrayIcon class="mr-2 h-4 w-4" />
                {{ isParsing ? t('hero.uploading') : t('hero.upload') }}
              </button>
            </div>
            <button
              type="button"
              class="inline-flex items-center rounded-full bg-[#314650] px-6 py-2 font-semibold text-white shadow-sm transition hover:bg-[#2b3e47]"
              @click="handleScan"
            >
              {{ t('hero.scan') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '../i18n';
import {
  ArrowUpTrayIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline';
import { useScanStore } from '../store/scan';
import { showComingSoon } from '../utils/toast';
import { buildHeroLandingPreview } from '../utils/heroPreview';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'scan']);

const router = useRouter();
const scanStore = useScanStore();
const fileInput = ref(null);
const { t, locale } = useI18n();
const isParsing = ref(false);
const warningMessage = ref('');
let warningTimer;
let lastComingSoonAt = 0;

const functionOptions = computed(() => [{ key: 'scan', label: t('hero.functions.scan'), icon: ShieldCheckIcon }]);

const highlightItems = computed(() => t('hero.highlights'));

const heroAuditCopy = computed(() =>
  locale.value === 'zh-CN'
    ? {
        panelTitle: '审计信号面板',
        previewTitle: '即时风险快照',
        previewSubtitle: '输入一段文本，首屏直接给你一个可读的风险判断。',
        scoreLabel: '风险预估',
        scorePendingLabel: '正式判断',
        queueTitle: '即时判读',
        queueSubtitle: '这里优先展示最值得人工复核的片段。',
        multiUploadCta: '前往多文件上传',
        highRisk: '优先复核',
        review: '建议复核',
        stable: '低风险',
        empty: '等待输入',
        pending: '待扫描',
        previewOnly: '草稿预览',
        ready: '草稿已就绪',
        typing: '继续补充内容可获得更稳定的判断',
        scanRequired: '点击扫描获取正式判断',
        previewSubtitleEmpty: '输入一段文本后再生成预览。',
        previewSubtitleDraft: '当前仅展示草稿预览，正式判断需点击扫描。',
        previewSubtitleExample: '当前展示范例预设快照，不代表实时检测结果。',
        queueSubtitleEmpty: '输入文本后，这里会显示预览片段。',
        queueSubtitleDraft: '这里只展示片段预览，正式风险判断需点击扫描。',
        queueSubtitleExample: '这里展示范例中的代表性片段与预设标签。',
        queueEmptyLabel: '等待文本',
        queuePreviewLabel: '片段预览',
        queueExampleLabel: '示例片段',
        snapshotHint: '点击开始扫描后，正式风险分布会出现在这里。',
        metrics: [
          { label: '检测响应', value: '< 30s', description: '单篇草稿的首轮检测反馈' },
          { label: '支持格式', value: 'TXT / DOCX / PDF', description: '从落地页就能直接导入' },
          { label: '审阅模式', value: '句级标色', description: '直接定位高风险语句' },
        ],
        signals: {
          structure: '结构密度',
          structureDense: '偏密集',
          structureBalanced: '平衡',
          structureDescription: '根据句长和句段数量估算首轮复杂度',
          rhythm: '语言节奏',
          rhythmRepeated: '重复偏高',
          rhythmStable: '较稳定',
          rhythmDescription: '检测句式长度和重复分布',
          awaitingDescription: '输入文本后再生成状态快照',
          previewOnly: '预览中',
          notScored: '未正式判断',
          previewDescription: '当前仅展示预览，不代表正式检测结果',
          exampleSnapshot: '示例快照',
          exampleDescription: '当前展示的是范例预设快照',
          action: '处理建议',
          actionRewrite: '优先改写',
          actionReview: '人工复核',
          actionClear: '可直接送检',
          actionDescription: '优先告诉你下一步该做什么',
          actionPending: '点击扫描',
          actionPendingDescription: '进入工作台后开始正式检测',
          ai: 'AI 痕迹',
          mixed: '改写痕迹',
          human: '人工细节',
          emptyLine: '输入文本后，这里会显示优先复核的句段。',
          badges: {
            high: '高风险',
            medium: '复核',
            low: '稳定',
          },
        },
      }
    : {
        panelTitle: 'Audit signal panel',
        previewTitle: 'Instant risk snapshot',
        previewSubtitle: 'Drop in a draft and get a readable first-pass risk call immediately.',
        scoreLabel: 'Risk estimate',
        scorePendingLabel: 'Formal result',
        queueTitle: 'Review queue',
        queueSubtitle: 'This surfaces the lines most worth a manual check first.',
        multiUploadCta: 'Open multi-file upload',
        highRisk: 'Review first',
        review: 'Needs review',
        stable: 'Low risk',
        empty: 'Awaiting input',
        pending: 'Pending scan',
        previewOnly: 'Preview only',
        ready: 'Draft ready',
        typing: 'Add a bit more text for a steadier read',
        scanRequired: 'Run scan for a formal result',
        previewSubtitleEmpty: 'Add a passage to generate a preview.',
        previewSubtitleDraft: 'This is a neutral draft preview. Run a scan for the formal judgement.',
        previewSubtitleExample: 'This shows a preset example snapshot, not a live detection result.',
        queueSubtitleEmpty: 'Preview snippets will appear here after you add text.',
        queueSubtitleDraft: 'These are draft snippets only. Formal risk labels appear after a scan.',
        queueSubtitleExample: 'These lines come from the selected sample and use preset labels.',
        queueEmptyLabel: 'Awaiting text',
        queuePreviewLabel: 'Preview snippet',
        queueExampleLabel: 'Sample snippet',
        snapshotHint: 'Run a scan and the formal distribution will appear here.',
        metrics: [
          { label: 'Response', value: '< 30s', description: 'First-pass feedback for a single draft' },
          { label: 'Formats', value: 'TXT / DOCX / PDF', description: 'Upload directly from the landing page' },
          { label: 'Review mode', value: 'Sentence highlights', description: 'Jump straight to risky lines' },
        ],
        signals: {
          structure: 'Structure density',
          structureDense: 'Dense',
          structureBalanced: 'Balanced',
          structureDescription: 'Estimated from sentence length and segment count',
          rhythm: 'Language rhythm',
          rhythmRepeated: 'Repetitive',
          rhythmStable: 'Stable',
          rhythmDescription: 'Checks pacing and repeated phrasing patterns',
          awaitingDescription: 'Add text to generate a preview state',
          previewOnly: 'Preview only',
          notScored: 'Not formally scored',
          previewDescription: 'This preview is neutral and not a formal detection result',
          exampleSnapshot: 'Sample snapshot',
          exampleDescription: 'This state comes from the selected example preset',
          action: 'Recommended action',
          actionRewrite: 'Rewrite first',
          actionReview: 'Manual review',
          actionClear: 'Ready to scan',
          actionDescription: 'Tells you the next best move immediately',
          actionPending: 'Run scan',
          actionPendingDescription: 'Open the workspace and start the formal scan',
          ai: 'AI signal',
          mixed: 'Mixed signal',
          human: 'Human detail',
          emptyLine: 'Add text and the highest-priority snippets will appear here.',
          badges: {
            high: 'High',
            medium: 'Review',
            low: 'Stable',
          },
        },
      }
);

const heroStatItems = computed(() => heroAuditCopy.value.metrics);

const heroText = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const selectedFunctionSummary = computed(() => {
  if (!scanStore.selectedFunctions.length) {
    return t('hero.functions.scan');
  }

  const labelMap = functionOptions.value.reduce((acc, option) => {
    acc[option.key] = option.label;
    return acc;
  }, {});

  return scanStore.selectedFunctions.map((key) => labelMap[key] || key).join(' / ');
});

const heroPreviewState = computed(() => {
  return buildHeroLandingPreview({
    text: heroText.value,
    selectedExampleKey: scanStore.selectedExampleKey,
    examples: scanStore.examples,
    locale: locale.value,
    copy: heroAuditCopy.value,
  });
});

const heroSignalItems = computed(() => heroPreviewState.value.signalItems);

const heroRiskBars = computed(() => heroPreviewState.value.riskBars);

const heroPreviewSnippets = computed(() => heroPreviewState.value.snippets);

onMounted(() => {
  scanStore.resetError();
});

const showWarning = (message) => {
  warningMessage.value = message;
  if (warningTimer) {
    clearTimeout(warningTimer);
  }
  warningTimer = setTimeout(() => {
    warningMessage.value = '';
  }, 4000);
};

const isFunctionSelected = (key) => scanStore.selectedFunctions.includes(key);

const toggleFunction = (key) => {
  if (key !== 'scan') {
    triggerComingSoon(functionOptions.value.find((item) => item.key === key)?.label || '');
    return;
  }
  scanStore.setFunctions(['scan']);
};

const applyExample = (key) => {
  const content = scanStore.applyExample(key);
  if (content) {
    heroText.value = content;
  }
};

const resetInput = () => {
  heroText.value = '';
  scanStore.resetText();
};

const syncDraftFromHero = () => {
  scanStore.setInputText(heroText.value);
};

const triggerUpload = () => {
  scanStore.resetError();
  fileInput.value?.click();
};

const isDocFile = (fileName = '') => fileName.toLowerCase().endsWith('.doc');

const handleSingleFileUpload = async (file) => {
  if (!file) return;
  if (isDocFile(file.name)) {
    showWarning('不支持 .doc 格式，请先转换为 .docx。');
    return;
  }
  scanStore.resetError();
  warningMessage.value = '';
  isParsing.value = true;
  try {
    await scanStore.readFile(file);
    heroText.value = scanStore.inputText || '';
  } finally {
    isParsing.value = false;
  }
};

const triggerComingSoon = (label) => {
  const now = Date.now();
  if (now - lastComingSoonAt < 1200) return;
  lastComingSoonAt = now;
  showComingSoon(label);
};

const onFileChange = async (event) => {
  const files = Array.from(event.target.files || []).filter(Boolean);
  if (!files.length) return;
  if (files.length > 1) {
    showWarning('首页当前仅支持单文件快速检测，批量上传暂未开放。');
    event.target.value = '';
    return;
  }
  await handleSingleFileUpload(files[0]);
  event.target.value = '';
};

const handleDrop = async (event) => {
  const files = Array.from(event.dataTransfer?.files || []).filter(Boolean);
  if (!files.length) return;
  if (files.length > 1) {
    showWarning('首页当前仅支持单文件快速检测，批量上传暂未开放。');
    return;
  }
  await handleSingleFileUpload(files[0]);
};

const goToMultiUpload = () => {
  triggerComingSoon(t('scan.nav.multiUpload'));
};

const openDashboard = () => {
  if (!scanStore.selectedFunctions.length) {
    scanStore.setFunctions(['scan']);
  }
  const features = 'scan';
  scanStore.commitDraftToStorage();
  router.push({ name: 'dashboard', query: { features, panel: 'document' } });
};

const handleScan = () => {
  emit('scan');
};

const goToScan = (focus) => {
  if (focus !== 'scan') {
    triggerComingSoon(functionOptions.value.find((item) => item.key === focus)?.label || '');
    return;
  }
  scanStore.setFunctions(['scan']);
  openDashboard();
};
</script>


