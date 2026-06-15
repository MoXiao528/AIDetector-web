<template>
  <section class="relative overflow-hidden bg-[linear-gradient(180deg,#faf9f7_0%,#fcfbf9_58%,#ffffff_100%)] text-slate-950 before:absolute before:inset-0 before:bg-[linear-gradient(rgba(17,24,39,0.024)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,0.024)_1px,transparent_1px)] before:bg-[size:56px_56px] before:opacity-60">
    <div class="relative mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-5xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div class="mx-auto max-w-3xl text-center">
        <h1 class="text-[2rem] font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          <span class="block sm:inline">{{ t('hero.titlePrefix') }}</span>
          <span class="block text-primary-700 sm:ml-2 sm:inline">{{ t('hero.titleHighlight') }}</span>
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
          {{ t('hero.subtitle') }}
        </p>
      </div>

      <div class="mt-8 rounded-[1.25rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_24px_80px_-55px_rgba(15,23,42,0.55),0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-white/80 backdrop-blur sm:p-5 lg:p-6">
        <div class="flex items-center justify-between gap-3">
          <label class="inline-flex items-center text-sm font-semibold text-slate-800">
            <span class="mr-2 h-2 w-2 rounded-full bg-primary-500 shadow-[0_0_0_4px_rgba(91,107,98,0.12)]"></span>
            <span>{{ t('hero.form.label') }}</span>
          </label>
          <button
            type="button"
            class="inline-flex items-center rounded-lg border border-slate-200/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-700"
            @click="resetInput"
          >
            {{ t('hero.form.reset') }}
          </button>
        </div>

        <textarea
          v-model="heroText"
          rows="10"
          class="mt-4 min-h-[34vh] w-full resize-y rounded-2xl border border-slate-200/90 bg-[#f8f8f7] p-5 text-base leading-8 text-slate-800 shadow-[inset_0_1px_2px_rgba(17,24,39,0.035)] transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 sm:min-h-[36vh] lg:min-h-[40vh]"
          :placeholder="t('hero.form.placeholder')"
          @input="syncDraftFromHero"
          @dragover.prevent
          @drop.prevent="handleDrop"
        ></textarea>

        <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept=".pdf,.docx,.txt"
            @change="onFileChange"
          />
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/40 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            @click="triggerUpload"
          >
            <ArrowUpTrayIcon class="mr-2 h-5 w-5" />
            {{ isParsing ? t('hero.uploading') : t('hero.upload') }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl bg-primary-600 px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-16px_rgba(17,24,39,0.7)] transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100"
            @click="handleScan"
          >
            <ShieldCheckIcon class="mr-2 h-5 w-5" />
            {{ t('hero.scan') }}
          </button>
        </div>

        <div class="mt-4 rounded-2xl border border-slate-100 bg-slate-50/75 px-3 py-3 text-xs text-slate-500 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-slate-500">{{ t('hero.examples.title') }}</span>
            <button
              v-for="example in scanStore.examples"
              :key="example.key"
              type="button"
              :class="[
                'rounded-lg border px-2.5 py-1 font-medium transition',
                scanStore.selectedExampleKey === example.key
                  ? 'border-primary-200 bg-primary-50 text-primary-700'
                  : 'border-slate-200/80 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800',
              ]"
              @click="applyExample(example.key)"
            >
              {{ example.label }}
            </button>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-3 tabular-nums sm:mt-0">
            <span>{{ t('hero.examples.wordCount', { current: heroText.length, limit: scanStore.characterLimit }) }}</span>
            <span v-if="scanStore.lastUploadedFileName">{{ t('hero.examples.uploaded', { name: scanStore.lastUploadedFileName }) }}</span>
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
              {{ t('scan.nav.multiUpload') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from '../i18n';
import {
  ArrowUpTrayIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline';
import { useScanStore } from '../store/scan';
import { showComingSoon } from '../utils/toast';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'scan']);

const scanStore = useScanStore();
const fileInput = ref(null);
const { t } = useI18n();
const isParsing = ref(false);
const warningMessage = ref('');
let warningTimer;
let lastComingSoonAt = 0;

const heroText = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

onMounted(() => {
  scanStore.resetError();
  scanStore.setFunctions(['scan']);
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

const handleScan = () => {
  scanStore.setFunctions(['scan']);
  emit('scan');
};
</script>
