<template>
  <div class="min-h-screen bg-slate-100">
    <AppHeader mode="dashboard" dashboard-context="scan" />
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 lg:py-14">
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
          <p class="mt-6 text-lg font-semibold text-slate-700">Drag and Drop or <button type="button" class="text-primary-600 hover:underline" @click="openFilePicker">Choose Files</button></p>
          <p class="mt-2 text-sm text-slate-400">Supported formats: pdf, txt, doc, docx</p>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            multiple
            accept=".pdf,.txt,.doc,.docx,.md,.json,.csv,.yaml,.yml,.tex,.tax"
            @change="onFileChange"
          />
          <ul v-if="fileTasks.length" class="mt-8 w-full max-w-md space-y-2 text-sm text-slate-600">
            <li
              v-for="task in fileTasks"
              :key="task.taskId"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="truncate">{{ task.name }}</span>
                <span :class="['text-xs font-semibold', statusTextClass(task.status)]">{{ statusLabel(task.status) }}</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="progressBarClass(task.status)"
                  :style="{ width: `${task.progress}%` }"
                ></div>
              </div>
              <p v-if="task.error" class="mt-1 text-xs text-rose-600">{{ task.error }}</p>
            </li>
          </ul>
          <p v-if="uploadError" class="mt-4 text-sm text-rose-600">{{ uploadError }}</p>
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
              <p class="text-sm font-semibold text-slate-900">3 File Batch Limit</p>
              <span class="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">FREE</span>
            </div>
          </div>
          <p class="text-sm text-slate-500">Upgrade for 250 files at once</p>
          <button
            type="button"
            class="inline-flex w-max items-center gap-2 rounded-full border border-primary-500 px-4 py-2 text-sm font-semibold text-primary-600 transition hover:bg-primary-50"
            @click="upgradeForMore"
          >
            Upgrade for more
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
              <p class="text-sm font-semibold text-slate-900">Supported languages:</p>
              <p class="text-sm text-slate-500">English, French and Spanish</p>
            </div>
          </div>
          <button
            type="button"
            class="w-max text-sm font-semibold text-primary-600 underline-offset-4 hover:underline"
            @click="requestMoreLanguages"
          >
            Request more languages
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../sections/AppHeader.vue';
import { useScanStore } from '../store/scan';

const router = useRouter();
const scanStore = useScanStore();

const scanModes = [
  { key: 'basic', label: 'Basic scan' },
  { key: 'advanced', label: 'Advanced scan' },
  { key: 'plagiarism', label: 'Plagiarism' },
];

const selectedMode = ref('basic');
const fileInput = ref(null);
const dragActive = ref(false);
const fileTasks = ref([]);
const pendingFiles = ref([]);
const uploadError = ref('');
const hasNavigated = ref(false);

const allSucceeded = computed(
  () => fileTasks.value.length > 0 && fileTasks.value.every((task) => task.status === 'success')
);

const selectMode = (mode) => {
  selectedMode.value = mode;
};

const openFilePicker = () => {
  scanStore.resetError();
  fileInput.value?.click();
};

const handleFiles = async (files) => {
  const list = Array.from(files || []);
  if (!list.length) return;
  uploadError.value = '';
  hasNavigated.value = false;
  pendingFiles.value = list;
  fileTasks.value = list.map((file) => {
    const entry = { name: file.name, taskId: '', progress: 0, status: 'queued', error: '' };
    const taskId = scanStore.enqueueMockTask({
      label: `上传 ${file.name}`,
      duration: 2400 + Math.round(Math.random() * 1600),
      // 演示阶段默认关闭失败概率，若需测试错误流程可改为非 0 数值
      failureRate: 0,
      onUpdate: (task) => updateFileTask(entry.taskId || task.id, task),
    });
    entry.taskId = taskId;
    return entry;
  });
};

const onFileChange = async (event) => {
  const { files } = event.target;
  await handleFiles(files);
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
  await handleFiles(files);
};

const updateFileTask = (taskId, task) => {
  if (!taskId) return;
  const target = fileTasks.value.find((item) => item.taskId === taskId);
  if (!target) return;
  target.progress = Math.round(task.progress ?? 0);
  target.status = task.status;
  target.error = task.error || '';
  if (task.status === 'error') {
    uploadError.value = task.error || '上传失败，请重试。';
  }
};

const statusLabel = (status) => {
  const map = {
    queued: '排队中',
    running: '处理中',
    success: '完成',
    error: '失败',
    canceled: '已取消',
  };
  return map[status] || '处理中';
};

const statusTextClass = (status) => {
  if (status === 'success') return 'text-emerald-600';
  if (status === 'error') return 'text-rose-600';
  if (status === 'canceled') return 'text-slate-400';
  return 'text-slate-500';
};

const progressBarClass = (status) => {
  if (status === 'success') return 'bg-emerald-500';
  if (status === 'error') return 'bg-rose-400';
  return 'bg-primary-500';
};

watch(
  fileTasks,
  async (tasks) => {
    if (!tasks.length || hasNavigated.value) return;
    const hasError = tasks.some((task) => task.status === 'error');
    if (hasError) return;
    if (allSucceeded.value) {
      try {
        await scanStore.readFiles(pendingFiles.value);
        hasNavigated.value = true;
        router.push({ name: 'dashboard', query: { panel: 'document' } });
      } catch (error) {
        uploadError.value = error.message || '文件解析失败，请稍后重试。';
      }
    }
  },
  { deep: true }
);

const upgradeForMore = () => {
  router.push({ name: 'contact' });
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
