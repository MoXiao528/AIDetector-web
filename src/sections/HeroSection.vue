<template>
  <section class="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 pb-24 pt-20">
    <div class="absolute inset-0 -z-10">
      <div class="absolute left-1/2 top-0 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-primary-200/40 blur-3xl"></div>
      <div class="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl"></div>
      <div class="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl"></div>
    </div>
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div class="inline-flex items-center space-x-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
          <span class="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>参考 RepreGuard 的 AI 文本检测体验</span>
        </div>
        <h1 class="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          快速识别并处理
          <span class="bg-gradient-to-r from-primary-500 via-primary-400 to-sky-400 bg-clip-text text-transparent">AI 生成文本</span>
        </h1>
        <p class="mt-6 text-lg text-slate-600">
          Veritascribe 将检测、润色、翻译与引用核查融合到同一工作台中。粘贴或上传文本，即刻获得 RepreGuard 级别的风险分析和改写建议。
        </p>
        <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-primary-200/60 transition hover:-translate-y-0.5 hover:bg-primary-500"
            @click="goToScan('scan')"
          >
            体验识别工作台
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-700"
            @click="goToScan('polish')"
          >
            查看润色工作流 →
          </button>
        </div>
      </div>
      <div class="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <ul class="grid gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600 shadow-sm shadow-slate-200/60 sm:grid-cols-2">
          <li class="flex items-center space-x-2">
            <svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>段落级 AI 概率热力图</span>
          </li>
          <li class="flex items-center space-x-2">
            <svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>自动保留段落结构与引用</span>
          </li>
          <li class="flex items-center space-x-2">
            <svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>支持 TXT / DOC / PDF 等常见格式</span>
          </li>
          <li class="flex items-center space-x-2">
            <svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>润色与翻译共享同一份上下文</span>
          </li>
        </ul>
        <div class="relative rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-primary-200/40 backdrop-blur">
          <div class="absolute -top-10 right-8 hidden rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-slate-500 shadow-md sm:flex">
            实时扫描预览
          </div>
          <div class="space-y-6">
            <div>
              <label class="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>粘贴或输入文本</span>
                <button
                  type="button"
                  class="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
                  @click="resetInput"
                >
                  一键重置
                </button>
              </label>
              <textarea
                v-model="textModel"
                rows="10"
                class="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                placeholder="粘贴文本或点击下方范例，立即体验 RepreGuard 式的 AI 检测界面。"
              ></textarea>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-for="option in functionOptions"
                  :key="option.key"
                  type="button"
                  :class="[
                    'inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold transition',
                    isFunctionSelected(option.key)
                      ? 'border-transparent bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-600',
                  ]"
                  @click="toggleFunction(option.key)"
                >
                  <component :is="option.icon" class="mr-2 h-4 w-4" />
                  {{ option.label }}
                </button>
              </div>
            </div>
            <div class="space-y-3 text-xs text-slate-500">
              <div class="flex flex-wrap items-center gap-2">
                <span>试试这些范例：</span>
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
                <span>字数：{{ scanStore.characterCount }}/{{ scanStore.characterLimit }}</span>
                <span>已选功能：{{ selectedFunctionSummary }}</span>
              </div>
              <div v-if="scanStore.uploadError" class="flex items-center space-x-2 rounded-2xl bg-rose-50 px-3 py-2 text-rose-600">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M5.22 5.22l13.56 13.56M19 13a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>{{ scanStore.uploadError }}</span>
              </div>
              <div v-if="scanStore.lastUploadedFileName" class="flex items-center space-x-2 text-slate-500">
                <svg class="h-4 w-4 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16.75V5a2 2 0 012-2h6.586a2 2 0 011.414.586l5.414 5.414a2 2 0 01.586 1.414V19a2 2 0 01-2 2H6a2 2 0 01-2-2" />
                </svg>
                <span>已导入：{{ scanStore.lastUploadedFileName }}</span>
              </div>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <input
                  ref="fileInput"
                  type="file"
                  class="hidden"
                  accept=".txt,.md,.doc,.docx,.pdf,.json,.csv,.yaml,.yml,.tex,.tax"
                  @change="onFileChange"
                />
                <button
                  type="button"
                  class="inline-flex items-center rounded-full border border-dashed border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:border-primary-300 hover:text-primary-600"
                  @click="triggerUpload"
                >
                  <ArrowUpTrayIcon class="mr-2 h-4 w-4" />
                  {{ scanStore.isUploading ? '正在读取...' : '上传文件' }}
                </button>
              </div>
              <button
                type="button"
                class="inline-flex items-center rounded-full bg-slate-900 px-6 py-2 font-semibold text-white shadow-sm transition hover:bg-slate-800"
                @click="handleScan"
              >
                扫描
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowUpTrayIcon,
  DocumentMagnifyingGlassIcon,
  LanguageIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline';
import { useScanStore } from '../store/scan';

const router = useRouter();
const scanStore = useScanStore();
const fileInput = ref(null);

const functionOptions = [
  { key: 'scan', label: 'AI 检测', icon: ShieldCheckIcon },
  { key: 'polish', label: '润色', icon: PencilSquareIcon },
  { key: 'translate', label: '翻译', icon: LanguageIcon },
  { key: 'citation', label: '引用核查', icon: DocumentMagnifyingGlassIcon },
];

const textModel = computed({
  get: () => scanStore.inputText,
  set: (value) => scanStore.setText(value),
});

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

onMounted(() => {
  scanStore.resetError();
});

const isFunctionSelected = (key) => scanStore.selectedFunctions.includes(key);

const toggleFunction = (key) => {
  scanStore.toggleFunction(key);
};

const applyExample = (key) => {
  scanStore.applyExample(key);
};

const resetInput = () => {
  scanStore.resetText();
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
  } catch (error) {
    console.error(error);
  } finally {
    event.target.value = '';
  }
};

const openDashboard = () => {
  if (!scanStore.selectedFunctions.length) {
    scanStore.setFunctions(['scan']);
  }
  const features = (scanStore.selectedFunctions.length ? scanStore.selectedFunctions : ['scan']).join(',');
  const target = router.resolve({ name: 'dashboard', query: { features, panel: 'document' } });
  scanStore.commitDraftToStorage();
  if (typeof window !== 'undefined') {
    window.open(target.href, '_blank', 'noopener');
  }
};

const handleScan = () => {
  openDashboard();
};

const goToScan = (focus) => {
  if (['scan', 'polish', 'translate', 'citation'].includes(focus)) {
    scanStore.setFunctions([focus]);
  }
  openDashboard();
};
</script>
