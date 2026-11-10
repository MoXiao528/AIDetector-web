<template>
  <section class="relative overflow-hidden bg-[linear-gradient(180deg,#e6effd_0%,#f4f7fb_80%)] text-slate-950">
    <div class="relative mx-auto flex max-w-7xl flex-col px-4 py-10 sm:px-6 lg:px-8 lg:py-12 2xl:max-w-[100rem]">
      <div class="mx-auto max-w-3xl text-center">
        <h1 class="hero-title text-[2rem] font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          <span class="block sm:inline">{{ t('hero.titlePrefix') }}</span>
          <span class="hero-title-highlight block text-primary-700 sm:ml-2 sm:inline">{{ t('hero.titleHighlight') }}</span>
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          {{ t('hero.subtitle') }}
        </p>
      </div>

      <div class="hero-form mt-8 rounded-2xl border border-primary-200/80 bg-white p-4 shadow-[0_6px_24px_rgba(24,34,48,0.06)] sm:p-5 lg:p-6">
        <div class="flex items-center justify-between gap-3">
          <label for="hero-text-input" class="inline-flex items-center text-sm font-semibold text-slate-800">
            <span>{{ t('hero.form.label') }}</span>
          </label>
          <button
            type="button"
            class="liquid-glass inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
            @click="resetInput"
          >
            {{ t('hero.form.reset') }}
          </button>
        </div>

        <textarea
          id="hero-text-input"
          v-model="heroText"
          rows="8"
          class="mt-4 min-h-[240px] w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-base leading-7 text-slate-800 transition-colors placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 sm:min-h-[280px] sm:p-5 lg:min-h-[clamp(320px,38vh,560px)]"
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
            class="liquid-glass inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            @click="triggerUpload"
          >
            <ArrowUpTrayIcon class="mr-2 h-5 w-5" />
            {{ isParsing ? t('hero.uploading') : t('hero.upload') }}
          </button>
          <button
            type="button"
            class="primary-action liquid-glass inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold"
            @click="handleScan"
          >
            <ShieldCheckIcon class="mr-2 h-5 w-5" />
            {{ t('hero.scan') }}
          </button>
        </div>

        <div class="mt-5 border-t border-slate-200 pt-4 text-xs text-slate-600 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-slate-500">{{ t('hero.examples.title') }}</span>
            <button
              v-for="example in scanStore.examples"
              :key="example.key"
              type="button"
              :class="[
                'liquid-glass rounded-full px-3 py-1.5 font-medium',
                scanStore.selectedExampleKey === example.key
                  ? 'liquid-glass-selected'
                  : '',
              ]"
              :aria-pressed="scanStore.selectedExampleKey === example.key"
              @click="applyExample(example.key)"
            >
              {{ example.label }}
            </button>
          </div>
          <div class="mt-3 flex min-w-0 flex-wrap items-center gap-3 break-all tabular-nums sm:mt-0">
            <span>{{ t('hero.examples.wordCount', { current: heroText.length, limit: scanStore.characterLimit }) }}</span>
            <span v-if="scanStore.lastUploadedFileName">{{ t('hero.examples.uploaded', { name: scanStore.lastUploadedFileName }) }}</span>
          </div>
          <p v-if="selectedExample" class="mt-2 w-full leading-5 text-slate-500" aria-live="polite">{{ selectedExample.description }}</p>
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
const selectedExample = computed(() => scanStore.examples.find((example) => example.key === scanStore.selectedExampleKey));
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
    scanStore.selectedExampleKey = key;
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

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .hero-title {
    animation: hero-title-enter 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @supports (background-clip: text) or (-webkit-background-clip: text) {
    .hero-title-highlight {
      background-image: linear-gradient(
        110deg,
        rgb(var(--primary-700)) 40%,
        #4778d2 50%,
        rgb(var(--primary-700)) 60%
      );
      background-size: 300% 100%;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      animation: hero-title-sheen 1800ms ease-in-out 240ms both;
    }
  }
}

@keyframes hero-title-enter {
  from {
    opacity: 0.65;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-title-sheen {
  from {
    background-position: 100% 50%;
  }
  to {
    background-position: 0% 50%;
  }
}

@media (forced-colors: active) {
  .hero-title-highlight {
    color: LinkText;
    background: none;
    animation: none;
  }
}
</style>
