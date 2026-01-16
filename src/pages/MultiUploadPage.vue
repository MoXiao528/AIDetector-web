<template>
  <div class="min-h-screen bg-slate-50">
    <AppHeader mode="dashboard" dashboard-context="scan" />
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 lg:py-14">
      <section>
        <div class="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm shadow-slate-200/70">
          <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary-600">
            <span class="rounded-full bg-primary-50 px-2 py-1 text-primary-700">{{ t('multiUpload.flow.badge') }}</span>
            <span class="text-slate-400">{{ t('multiUpload.flow.sequence') }}</span>
          </div>
          <div class="grid w-full gap-3 md:grid-cols-4">
            <div
              v-for="step in flowSteps"
              :key="step.key"
              class="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-inner"
            >
              <div class="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">{{ step.order }}</span>
                <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{{ step.label }}</span>
              </div>
              <p class="text-xs leading-relaxed text-slate-600">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </section>
      <section class="flex justify-center">
        <div class="flex flex-wrap items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <button
            v-for="mode in scanModes"
            :key="mode.key"
            type="button"
            :class="[
              'flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-semibold transition',
              selectedMode === mode.key
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white text-slate-600 hover:bg-slate-100',
            ]"
            @click="selectMode(mode.key)"
          >
            <span
              :class="[
                'flex h-5 w-5 items-center justify-center rounded-md border text-[10px] font-semibold transition',
                selectedMode === mode.key ? 'border-transparent bg-slate-900 text-white' : 'border-slate-300 text-slate-400',
              ]"
            >
              ✓
            </span>
            {{ mode.label }}
          </button>
        </div>
      </section>
      <section class="flex justify-center">
        <div class="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">功能选择</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label
              v-for="option in functionOptions"
              :key="option.key"
              class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
            >
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-200"
                :value="option.key"
                :checked="selectedFunctions.includes(option.key)"
                :disabled="option.disabled"
                @change="toggleFunction(option.key)"
              />
              <span>{{ option.label }}</span>
            </label>
          </div>
        </div>
      </section>

      <section class="flex justify-center">
        <div
          :class="[
            'relative flex w-full flex-col items-center rounded-4xl border-2 border-dashed px-8 py-16 text-center shadow-inner transition',
            dragActive ? 'border-primary-400 bg-primary-50/70 text-primary-600' : 'border-slate-200 bg-white/90 text-slate-500',
          ]"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-current text-3xl font-light">
            ＋
          </div>
          <p class="mt-6 text-lg font-semibold text-slate-700">
            {{ t('multiUpload.uploader.titlePrefix') }}
            <button type="button" class="text-primary-600 hover:underline" @click="openFilePicker">{{ t('multiUpload.uploader.cta') }}</button>
          </p>
          <p class="mt-2 text-sm text-slate-400">支持格式：PDF, DOCX, TXT</p>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            multiple
            accept=".pdf,.docx,.txt"
            @change="onFileChange"
          />
          <p v-if="uploadError" class="mt-3 text-sm font-semibold text-red-600">{{ uploadError }}</p>
          <p v-if="warningMessage" class="mt-2 text-sm font-semibold text-amber-600">{{ warningMessage }}</p>
          <p v-if="isUploading" class="mt-3 text-sm font-semibold text-primary-600">文件解析中，请稍候...</p>
          <ul v-if="fileList.length" class="mt-8 w-full max-w-md space-y-2 text-sm text-slate-600">
            <li
              v-for="file in fileList"
              :key="`${file.name}-${file.size}`"
              class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2"
            >
              <div class="min-w-0">
                <p class="truncate font-semibold text-slate-700">{{ file.name }}</p>
                <p class="text-xs text-slate-400">{{ formatFileSize(file.size) }}</p>
              </div>
              <button
                type="button"
                class="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
                @click="removeFile(file)"
              >
                ×
              </button>
            </li>
          </ul>
          <button
            v-if="fileList.length"
            type="button"
            class="mt-6 inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500"
            @click="handleUpload"
          >
            开始解析
          </button>
        </div>
      </section>

      <section class="grid gap-6 rounded-4xl border border-slate-200 bg-white/95 p-8 shadow-sm backdrop-blur md:grid-cols-2">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h10M7 12h10M7 17h6" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ t('multiUpload.limits.title') }}</p>
              <span class="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                {{ t('multiUpload.limits.badge') }}
              </span>
            </div>
          </div>
          <p class="text-sm text-slate-500">{{ t('multiUpload.limits.subtitle') }}</p>
          <button
            type="button"
            class="inline-flex w-max items-center gap-2 rounded-full border border-primary-500 px-4 py-2 text-sm font-semibold text-primary-600 transition hover:bg-primary-50"
            @click="upgradeForMore"
          >
            {{ t('multiUpload.limits.cta') }}
          </button>
        </div>
        <div class="flex flex-col gap-4 border-t border-slate-200 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21c4.97 0 9-4.03 9-9S16.97 3 12 3 3 7.03 3 12s4.03 9 9 9zm0 0a6 6 0 100-12 6 6 0 000 12z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ t('multiUpload.languages.title') }}</p>
              <p class="text-sm text-slate-500">{{ t('multiUpload.languages.subtitle') }}</p>
            </div>
          </div>
          <button
            type="button"
            class="w-max text-sm font-semibold text-primary-600 underline-offset-4 hover:underline"
            @click="requestMoreLanguages"
          >
            {{ t('multiUpload.languages.cta') }}
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '../i18n';
import AppHeader from '../sections/AppHeader.vue';
import { parseFiles } from '../api/modules/scan';
import { useScanStore } from '../store/scan';

const router = useRouter();
const scanStore = useScanStore();
const BATCH_LIMIT = 3;
const { t } = useI18n();

const scanModes = computed(() => [
  { key: 'basic', label: t('multiUpload.modes.basic') },
  { key: 'advanced', label: t('multiUpload.modes.advanced') },
  { key: 'plagiarism', label: t('multiUpload.modes.plagiarism') },
]);

const functionOptions = computed(() => [
  { key: 'scan', label: 'AI Content Detection', disabled: true },
  { key: 'polish', label: 'Smart Polishing' },
  { key: 'citation', label: 'Citation Generator' },
  { key: 'translate', label: 'Language Translation' },
]);

const flowSteps = computed(() => [
  { key: 'upload', order: 1, label: t('multiUpload.flow.steps.upload.label'), description: t('multiUpload.flow.steps.upload.description') },
  { key: 'queue', order: 2, label: t('multiUpload.flow.steps.queue.label'), description: t('multiUpload.flow.steps.queue.description') },
  { key: 'complete', order: 3, label: t('multiUpload.flow.steps.complete.label'), description: t('multiUpload.flow.steps.complete.description') },
  { key: 'download', order: 4, label: t('multiUpload.flow.steps.download.label'), description: t('multiUpload.flow.steps.download.description') },
]);

const selectedMode = ref('basic');
const fileInput = ref(null);
const dragActive = ref(false);
const isUploading = ref(false);
const fileList = ref([]);
const selectedFunctions = ref(
  Array.from(new Set(['scan', ...(scanStore.selectedFunctions.length ? scanStore.selectedFunctions : [])]))
);
const warningMessage = ref('');
let warningTimer;
const uploadError = computed(() => scanStore.uploadError);

const selectMode = (mode) => {
  selectedMode.value = mode;
};

const openFilePicker = () => {
  scanStore.resetError();
  fileInput.value?.click();
};

const showWarning = (message) => {
  warningMessage.value = message;
  if (warningTimer) {
    clearTimeout(warningTimer);
  }
  warningTimer = setTimeout(() => {
    warningMessage.value = '';
  }, 4000);
};

const isDocFile = (fileName = '') => fileName.toLowerCase().endsWith('.doc');

const formatFileSize = (size) => {
  if (!size && size !== 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const removeFile = (target) => {
  fileList.value = fileList.value.filter((file) => !(file.name === target.name && file.size === target.size));
};

const toggleFunction = (key) => {
  if (key === 'scan') return;
  const next = new Set(selectedFunctions.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  next.add('scan');
  selectedFunctions.value = Array.from(next);
};

const handleFiles = (files) => {
  const list = Array.from(files || []).filter(Boolean);
  if (!list.length) return;
  scanStore.resetError();
  warningMessage.value = '';
  const nextList = [...fileList.value];
  const rejected = list.filter((file) => isDocFile(file.name));
  if (rejected.length) {
    showWarning('不支持 .doc 格式，请转换为 .docx');
  }
  const accepted = list.filter((file) => !isDocFile(file.name));
  accepted.forEach((file) => {
    if (!nextList.find((item) => item.name === file.name && item.size === file.size)) {
      nextList.push(file);
    }
  });
  if (nextList.length > BATCH_LIMIT) {
    scanStore.uploadError = t('multiUpload.errors.limit', { limit: BATCH_LIMIT });
    return;
  }
  fileList.value = nextList;
};

const handleUpload = async () => {
  if (!fileList.value.length) return;
  scanStore.resetError();
  warningMessage.value = '';
  scanStore.setFunctions(selectedFunctions.value);
  try {
    const formData = new FormData();
    fileList.value.forEach((file) => formData.append('files', file));
    isUploading.value = true;
    const response = await parseFiles(formData);
    const results = Array.isArray(response?.results) ? response.results : [];
    const successes = results.filter((item) => item?.content && !item?.error);
    const failures = results.filter((item) => item?.error);
    if (!successes.length) {
      scanStore.uploadError = t('multiUpload.errors.parse');
      return;
    }
    if (failures.length) {
      const failureDetails = failures
        .map((item) => `${item.fileName || '文件'} 解析失败: ${item.error}`)
        .join('；');
      showWarning(failureDetails);
    }
    const mergedText = successes
      .map((item) => item?.content)
      .filter((content) => content && String(content).trim())
      .join('\n\n');
    scanStore.setInputText(mergedText);
    router.push({ name: 'dashboard', query: { panel: 'document' } });
  } catch (error) {
    scanStore.uploadError = scanStore.uploadError || t('multiUpload.errors.parse');
  } finally {
    isUploading.value = false;
  }
};

const onFileChange = async (event) => {
  const { files } = event.target;
  handleFiles(files);
  event.target.value = '';
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
  handleFiles(files);
};

const upgradeForMore = () => {
  router.push({ name: 'pricing' });
};

const requestMoreLanguages = () => {
  router.push({ name: 'contact' });
};
</script>

<style scoped>
.rounded-4xl {
  border-radius: 2rem;
}
</style>
