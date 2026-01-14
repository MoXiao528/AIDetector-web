<template>
  <section class="relative overflow-hidden pb-24 pt-20">
    <div class="absolute inset-0 -z-10">
      <div class="absolute left-1/2 top-0 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-primary-200/40 blur-3xl"></div>
      <div class="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl"></div>
      <div class="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl"></div>
    </div>
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div class="relative">
          <div class="absolute -left-10 top-8 h-64 w-64 rounded-full bg-primary-200/40 blur-3xl opacity-60"></div>
          <div class="relative">
            <div class="inline-flex items-center space-x-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              <span class="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>{{ t('hero.badge') }}</span>
            </div>
            <h1 class="mt-6 text-5xl font-bold leading-tight tracking-tight text-slate-900 sm:text-6xl">
              {{ t('hero.titlePrefix') }}
              <span class="bg-gradient-to-r from-primary-500 via-primary-400 to-sky-400 bg-clip-text text-transparent">{{ t('hero.titleHighlight') }}</span>
            </h1>
            <p class="mt-6 text-lg text-slate-600">
              {{ t('hero.subtitle') }}
            </p>
            <div class="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-primary-200/60 transition hover:-translate-y-0.5 hover:bg-primary-500"
                @click="goToScan('scan')"
              >
                {{ t('hero.primaryCta') }}
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-700"
                @click="goToScan('polish')"
              >
                {{ t('hero.secondaryCta') }}
              </button>
            </div>
            <div class="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <div class="flex -space-x-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white ring-2 ring-white">{{ t('hero.avatars.first') }}</div>
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white ring-2 ring-white">{{ t('hero.avatars.second') }}</div>
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-white ring-2 ring-white">{{ t('hero.avatars.third') }}</div>
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white ring-2 ring-white">+</div>
              </div>
              <span>{{ t('hero.trust') }}</span>
            </div>
            <ul class="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <li v-for="item in highlightItems" :key="item" class="flex items-center space-x-2">
                <svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="relative rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-primary-500/20 backdrop-blur">
          <div class="absolute -top-10 right-8 hidden rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-slate-500 shadow-md sm:flex">
            {{ t('hero.previewBadge') }}
          </div>
          <div class="space-y-6">
            <div>
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
                v-model="textModel"
                rows="10"
                class="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                :placeholder="t('hero.form.placeholder')"
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
                <span>{{ t('hero.examples.wordCount', { current: scanStore.characterCount, limit: scanStore.characterLimit }) }}</span>
                <span>{{ t('hero.examples.selectedFunctions', { value: selectedFunctionSummary }) }}</span>
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
                <span>{{ t('hero.examples.uploaded', { name: scanStore.lastUploadedFileName }) }}</span>
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
                  {{ scanStore.isUploading ? t('hero.uploading') : t('hero.upload') }}
                </button>
              </div>
              <button
                type="button"
                class="inline-flex items-center rounded-full bg-slate-900 px-6 py-2 font-semibold text-white shadow-sm transition hover:bg-slate-800"
                @click="handleScan"
              >
                {{ t('hero.scan') }}
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
import { useI18n } from '../i18n';
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
const { t } = useI18n();

const functionOptions = computed(() => [
  { key: 'scan', label: t('hero.functions.scan'), icon: ShieldCheckIcon },
  { key: 'polish', label: t('hero.functions.polish'), icon: PencilSquareIcon },
  { key: 'translate', label: t('hero.functions.translate'), icon: LanguageIcon },
  { key: 'citation', label: t('hero.functions.citation'), icon: DocumentMagnifyingGlassIcon },
]);

const highlightItems = computed(() => t('hero.highlights'));

const textModel = computed({
  get: () => scanStore.inputText,
  set: (value) => scanStore.setText(value),
});

const selectedFunctionSummary = computed(() => {
  if (!scanStore.selectedFunctions.length) {
    return t('hero.functions.scan');
  }

  const labelMap = functionOptions.value.reduce((acc, option) => {
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
