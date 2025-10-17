<template>
  <div class="min-h-screen bg-slate-50">
    <AppHeader />
    <main class="bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24 pt-16">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-12 lg:flex-row">
          <section class="flex-1">
            <div class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-primary-100/30 backdrop-blur">
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
                <button
                  type="button"
                  class="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
                  @click="resetInput"
                >
                  一键重置
                </button>
              </div>
              <div class="mt-6 space-y-4">
                <label class="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>粘贴或输入文本</span>
                  <span class="text-xs font-medium text-slate-400">{{ characterUsage }}</span>
                </label>
                <textarea
                  v-model="textModel"
                  rows="12"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  placeholder="粘贴需要检测的文本，我们会在扫描界面保留段落结构并生成 AI 风险分析。"
                ></textarea>
              </div>
              <div class="mt-6 space-y-3">
                <div class="flex flex-wrap items-center gap-2 text-xs">
                  <span class="text-slate-500">试试这些范例：</span>
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
                <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{{ characterUsage }}</span>
                  <span>已选功能：{{ selectedFunctionSummary }}</span>
                  <span v-if="scanStore.lastUploadedFileName" class="flex items-center space-x-2">
                    <svg class="h-4 w-4 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16.75V5a2 2 0 012-2h6.586a2 2 0 011.414.586l5.414 5.414a2 2 0 01.586 1.414V19a2 2 0 01-2 2H6a2 2 0 01-2-2" />
                    </svg>
                    <span>已导入：{{ scanStore.lastUploadedFileName }}</span>
                  </span>
                </div>
                <p v-if="scanStore.uploadError" class="flex items-center space-x-2 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M5.22 5.22l13.56 13.56M19 13a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>{{ scanStore.uploadError }}</span>
                </p>
              </div>
              <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <input ref="fileInput" type="file" class="hidden" accept=".txt,.md,.doc,.docx,.pdf,.json,.csv,.yaml,.yml,.tex,.tax" @change="onFileChange" />
                  <button
                    type="button"
                    class="inline-flex items-center rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary-300 hover:text-primary-600"
                    @click="triggerUpload"
                  >
                    <ArrowUpTrayIcon class="mr-2 h-4 w-4" />
                    {{ scanStore.isUploading ? '正在读取...' : '上传文件' }}
                  </button>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
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
                  扫描
                </button>
              </div>
            </div>
          </section>
          <aside class="w-full max-w-sm space-y-6">
            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 class="text-sm font-semibold text-slate-900">扫描状态</h3>
              <p class="mt-2 text-xs text-slate-500">登录后即可查看完整检测报告与段落级风险详情。</p>
              <div class="mt-5 space-y-4">
                <div class="rounded-2xl bg-slate-50 p-4">
                  <div class="flex items-center justify-between text-xs text-slate-500">
                    <span>整体 AI 概率</span>
                    <span>{{ aiRiskLabel }}</span>
                  </div>
                  <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div class="h-full rounded-full bg-primary-500" :style="{ width: `${aiRisk * 100}%` }"></div>
                  </div>
                  <p class="mt-2 text-xs text-slate-500">根据示例文本估算的基准概率，实际结果将在扫描后更新。</p>
                </div>
                <div class="rounded-2xl bg-slate-50 p-4">
                  <h4 class="text-xs font-semibold text-slate-600">扫描结果概览</h4>
                  <ul class="mt-2 space-y-2 text-xs text-slate-500">
                    <li v-for="item in scanHighlights" :key="item" class="flex items-start space-x-2">
                      <svg class="mt-1 h-3 w-3 text-primary-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{{ item }}</span>
                    </li>
                  </ul>
                </div>
                <div class="rounded-3xl border border-dashed border-primary-200 bg-primary-50 p-4 text-xs text-primary-700">
                  <p>完成注册后可保存扫描历史、导出检测报告，并开启团队额度共享。</p>
                </div>
              </div>
            </div>
            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 class="text-sm font-semibold text-slate-900">使用技巧</h3>
              <ul class="mt-4 space-y-3 text-xs text-slate-500">
                <li>在识别页面中可切换至润色与翻译模式，保留同一份文本上下文。</li>
                <li>上传 PDF 或 Word 文件时，我们会自动识别段落并清理格式。</li>
                <li>点击“扫描”时将同步检测并提示登录以继续。</li>
              </ul>
            </div>
          </aside>
        </div>

        <section v-if="scanCompleted" class="mt-12 rounded-3xl border border-primary-200 bg-white p-6 shadow-xl">
          <div class="flex items-start justify-between gap-6">
            <div>
              <h3 class="text-lg font-semibold text-slate-900">预览结果</h3>
              <p class="mt-2 text-sm text-slate-600">以下为模拟的检测摘要。登录后可查看完整报告并导出。</p>
            </div>
            <span class="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">示例</span>
          </div>
          <div class="mt-4 grid gap-4 md:grid-cols-3">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs text-slate-500">高风险段落</p>
              <p class="mt-2 text-2xl font-semibold text-slate-900">{{ simulatedResult.riskyParagraphs }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs text-slate-500">建议人工复核</p>
              <p class="mt-2 text-2xl font-semibold text-slate-900">{{ simulatedResult.reviewTips }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs text-slate-500">润色建议</p>
              <p class="mt-2 text-2xl font-semibold text-slate-900">{{ simulatedResult.polishSuggestions }}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
    <AppFooter />
    <LoginPromptModal :open="showLoginModal" :message="loginMessage" @close="showLoginModal = false" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  ArrowUpTrayIcon,
  DocumentMagnifyingGlassIcon,
  LanguageIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline';
import AppHeader from '../sections/AppHeader.vue';
import AppFooter from '../sections/AppFooter.vue';
import LoginPromptModal from '../components/common/LoginPromptModal.vue';
import { useAuthStore } from '../store/auth';
import { useScanStore } from '../store/scan';

const authStore = useAuthStore();
const scanStore = useScanStore();
const route = useRoute();

const fileInput = ref(null);
const showLoginModal = ref(false);
const loginMessage = ref('登录后即可查看扫描结果并生成完整报告。');
const isScanning = ref(false);
const scanCompleted = ref(false);

const simulatedResult = ref({
  riskyParagraphs: 3,
  reviewTips: 5,
  polishSuggestions: 8,
});

const characterUsage = computed(() => `字数：${scanStore.characterCount}/${scanStore.characterLimit}`);

const scanHighlights = [
  '重点标记高风险段落并提供人工复核建议',
  '显示句子级 AI 概率与热力图',
  '可导出 PDF 报告与引用清单',
];

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

const aiRisk = computed(() => {
  const words = scanStore.characterCount;
  const base = Math.min(0.85, 0.35 + words / 2500);
  return Number(base.toFixed(2));
});

const aiRiskLabel = computed(() => {
  if (aiRisk.value < 0.35) return '低';
  if (aiRisk.value < 0.6) return '中等';
  return '偏高';
});

const parseFeatures = (value) => {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => ['scan', 'polish', 'translate', 'citation'].includes(item));
};

onMounted(() => {
  const featuresFromQuery = parseFeatures(route.query.features);
  if (featuresFromQuery.length) {
    scanStore.setFunctions(featuresFromQuery);
    return;
  }

  const modeFromQuery = route.query.mode;
  if (typeof modeFromQuery === 'string' && ['scan', 'polish', 'translate', 'citation'].includes(modeFromQuery)) {
    scanStore.setFunctions([modeFromQuery]);
  }
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

const isFunctionSelected = (key) => scanStore.selectedFunctions.includes(key);

const toggleFunction = (key) => {
  scanStore.toggleFunction(key);
  scanCompleted.value = false;
};

const applyExample = (key) => {
  scanStore.applyExample(key);
  scanCompleted.value = false;
};

const resetInput = () => {
  scanStore.resetText();
  scanCompleted.value = false;
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
    scanCompleted.value = false;
  } catch (error) {
    console.error(error);
  } finally {
    event.target.value = '';
  }
};

const handleScan = async () => {
  if (!scanStore.selectedFunctions.length) {
    scanStore.setFunctions(['scan']);
  }

  if (!authStore.isAuthenticated) {
    loginMessage.value = '登录后即可开始扫描并查看完整结果。';
    showLoginModal.value = true;
    return;
  }

  isScanning.value = true;
  scanCompleted.value = false;
  await new Promise((resolve) => setTimeout(resolve, 1200));
  isScanning.value = false;
  scanCompleted.value = true;
};
</script>
