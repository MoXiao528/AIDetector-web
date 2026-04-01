<template>
  <div class="space-y-6">
    <AdminFilterBar
      v-model:searchValue="filters.search"
      search-label="记录搜索"
      search-placeholder="按输入文本、邮箱或用户名搜索"
      @search="handleSearch"
      @reset="resetFilters"
    >
      <template #filters>
        <div>
          <label class="admin-kicker">User ID</label>
          <input
            :value="filters.userId"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            placeholder="123"
            class="admin-field admin-no-spin mt-2"
            @input="handleUserIdInput"
          />
        </div>
        <AdminSelect v-model="filters.actorType" label="Actor Type" :options="actorTypeOptions" placeholder="全部类型" />
        <AdminSelect v-model="filters.label" label="Label" :options="labelOptions" placeholder="全部标签" />
        <div>
          <label class="admin-kicker">Function</label>
          <input v-model="filters.functionName" type="text" placeholder="scan" class="admin-field mt-2" />
        </div>
        <AdminDatePicker v-model="filters.dateFrom" label="From" placeholder="开始日期" :max-value="filters.dateTo || ''" />
        <AdminDatePicker v-model="filters.dateTo" label="To" placeholder="结束日期" :min-value="filters.dateFrom || ''" />
      </template>
    </AdminFilterBar>

    <div v-if="errorMessage" class="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
      {{ errorMessage }}
    </div>

    <AdminDataTable
      :columns="columns"
      :rows="items"
      :loading="loading"
      empty-title="没有检测记录"
      empty-description="可以放宽筛选条件后再试。"
      row-clickable
      @rowClick="openDetection"
    >
      <template #cell-userEmail="{ row }">
        <span>{{ row.userEmail || row.userName || 'Guest' }}</span>
      </template>
      <template #cell-label="{ value }">
        <span class="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-100">{{ String(value).toUpperCase() }}</span>
      </template>
      <template #cell-score="{ value }"><span class="font-semibold text-white">{{ formatScore(value) }}</span></template>
      <template #cell-createdAt="{ value }">{{ formatDateTime(value) }}</template>
      <template #actions="{ row }">
        <button type="button" class="admin-secondary-btn" @click="openDetection(row)">查看</button>
        <button type="button" class="admin-danger-btn" @click="requestDelete(row)">删除</button>
      </template>
    </AdminDataTable>

    <AdminPagination :page="page" :total-pages="totalPages" :total="total" :loading="loading" @change="changePage" />

    <div v-if="drawerOpen" class="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm" @click.self="closeDrawer">
      <div class="flex h-full w-full max-w-3xl flex-col border-l border-white/10 bg-slate-900">
        <div class="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <h2 class="text-lg font-semibold text-white">{{ selectedDetection?.label?.toUpperCase() || '检测详情' }}</h2>
            <p class="mt-1 text-sm text-slate-400">{{ selectedDetection?.userEmail || selectedDetection?.userName || 'Guest' }}</p>
          </div>
          <button type="button" class="admin-secondary-btn" @click="closeDrawer">关闭</button>
        </div>

        <div class="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div v-if="drawerError" class="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {{ drawerError }}
          </div>

          <section class="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div class="flex flex-wrap items-center gap-3">
              <span class="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-100">{{ selectedDetection?.label?.toUpperCase() || '-' }}</span>
              <span class="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-semibold text-sky-100">{{ formatScore(selectedDetection?.score) }}</span>
              <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">{{ selectedDetection?.actorType || '-' }}</span>
            </div>
            <div class="mt-4 grid gap-4 md:grid-cols-4">
              <div><p class="admin-kicker">用户</p><p class="mt-1 text-sm text-slate-200">{{ selectedDetection?.userEmail || selectedDetection?.userName || 'Guest' }}</p></div>
              <div><p class="admin-kicker">字符数</p><p class="mt-1 text-sm text-slate-200">{{ formatNumber(selectedDetection?.charsUsed) }}</p></div>
              <div><p class="admin-kicker">功能</p><p class="mt-1 text-sm text-slate-200">{{ formatFunctions(selectedDetection?.functionsUsed) }}</p></div>
              <div><p class="admin-kicker">创建时间</p><p class="mt-1 text-sm text-slate-200">{{ formatDateTime(selectedDetection?.createdAt) }}</p></div>
            </div>
          </section>

          <section class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold text-white">原文</h3>
                <span class="admin-kicker">Input</span>
              </div>
              <p class="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{{ selectedDetection?.inputText || '-' }}</p>
            </div>

            <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold text-white">Meta / Analysis</h3>
                <span class="admin-kicker">JSON</span>
              </div>
              <pre class="mt-4 max-h-[420px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">{{ prettyMeta }}</pre>
            </div>
          </section>

          <div class="flex items-center justify-end gap-3">
            <button type="button" class="admin-secondary-btn" @click="closeDrawer">取消</button>
            <button type="button" class="admin-danger-btn" @click="requestDelete(selectedDetection)">删除记录</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import AdminDataTable from '../../components/admin/AdminDataTable.vue';
import AdminDatePicker from '../../components/admin/AdminDatePicker.vue';
import AdminFilterBar from '../../components/admin/AdminFilterBar.vue';
import AdminPagination from '../../components/admin/AdminPagination.vue';
import AdminSelect from '../../components/admin/AdminSelect.vue';
import { deleteAdminDetection, fetchAdminDetection, fetchAdminDetections } from '../../api/modules/admin';
import { showToast } from '../../utils/toast';

const actorTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'user', label: 'user' },
  { value: 'guest', label: 'guest' },
];

const labelOptions = [
  { value: '', label: '全部标签' },
  { value: 'ai', label: 'AI' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'human', label: 'Human' },
];

const columns = [
  { key: 'userEmail', label: 'User' },
  { key: 'actorType', label: 'Actor' },
  { key: 'label', label: 'Label' },
  { key: 'score', label: 'Score' },
  { key: 'charsUsed', label: 'Chars' },
  { key: 'createdAt', label: 'Created At' },
];

const loading = ref(false);
const errorMessage = ref('');
const items = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

const filters = reactive({
  search: '',
  userId: '',
  actorType: '',
  label: '',
  functionName: '',
  dateFrom: '',
  dateTo: '',
});

const drawerOpen = ref(false);
const drawerError = ref('');
const selectedDetection = ref(null);

const totalPages = computed(() => Math.max(1, Math.ceil((Number(total.value) || 0) / pageSize.value)));
const prettyMeta = computed(() =>
  JSON.stringify(
    {
      title: selectedDetection.value?.title,
      editorHtml: selectedDetection.value?.editorHtml,
      metaJson: selectedDetection.value?.metaJson,
      analysis: selectedDetection.value?.analysis,
    },
    null,
    2
  )
);

watch(
  () => filters.dateFrom,
  (value) => {
    if (filters.dateTo && value && value > filters.dateTo) {
      filters.dateTo = value;
    }
  }
);

watch(
  () => filters.dateTo,
  (value) => {
    if (filters.dateFrom && value && value < filters.dateFrom) {
      filters.dateFrom = value;
    }
  }
);

function handleUserIdInput(event) {
  filters.userId = String(event.target.value || '').replace(/\D+/g, '');
}

function toDateStartIso(value) {
  if (!value) return '';
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function toDateEndIso(value) {
  if (!value) return '';
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

async function loadDetections() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await fetchAdminDetections({
      page: page.value,
      pageSize: pageSize.value,
      search: filters.search,
      userId: filters.userId ? Number(filters.userId) : '',
      actorType: filters.actorType || '',
      label: filters.label || '',
      function: filters.functionName,
      dateFrom: toDateStartIso(filters.dateFrom),
      dateTo: toDateEndIso(filters.dateTo),
    });
    items.value = response.items;
    total.value = response.total;
    page.value = response.page;
    pageSize.value = response.pageSize;
  } catch (error) {
    errorMessage.value = error?.message || '检测记录加载失败';
    showToast({ title: '检测记录', message: errorMessage.value });
  } finally {
    loading.value = false;
  }
}

async function handleSearch() {
  page.value = 1;
  await loadDetections();
}

async function resetFilters() {
  filters.search = '';
  filters.userId = '';
  filters.actorType = '';
  filters.label = '';
  filters.functionName = '';
  filters.dateFrom = '';
  filters.dateTo = '';
  page.value = 1;
  await loadDetections();
}

async function changePage(nextPage) {
  const safePage = Math.min(Math.max(1, nextPage), totalPages.value);
  if (safePage === page.value) return;
  page.value = safePage;
  await loadDetections();
}

async function openDetection(row) {
  if (!row?.id) return;
  drawerOpen.value = true;
  drawerError.value = '';
  selectedDetection.value = null;

  try {
    selectedDetection.value = await fetchAdminDetection(row.id);
  } catch (error) {
    drawerError.value = error?.message || '检测详情加载失败';
    showToast({ title: '检测详情', message: drawerError.value });
  }
}

function closeDrawer() {
  drawerOpen.value = false;
  drawerError.value = '';
  selectedDetection.value = null;
}

async function requestDelete(row) {
  if (!row?.id) return;
  const confirmed = typeof window === 'undefined' ? true : window.confirm(`删除检测记录 #${row.id}？`);
  if (!confirmed) return;

  try {
    await deleteAdminDetection(row.id);
    if (selectedDetection.value?.id === row.id) {
      closeDrawer();
    }
    await loadDetections();
    showToast({ title: '检测记录', message: '记录已删除' });
  } catch (error) {
    showToast({ title: '检测记录', message: error?.message || '删除失败' });
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN').format(Number(value) || 0);
}

function formatDateTime(value) {
  return value
    ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    : '-';
}

function formatScore(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

function formatFunctions(value) {
  return Array.isArray(value) && value.length ? value.join(', ') : '-';
}

onMounted(loadDetections);
</script>

<style scoped>
.admin-field {
  @apply w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/40;
}

.admin-field::-webkit-outer-spin-button,
.admin-field::-webkit-inner-spin-button,
.admin-no-spin::-webkit-outer-spin-button,
.admin-no-spin::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.admin-kicker {
  @apply block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400;
}

.admin-secondary-btn {
  @apply inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50;
}

.admin-danger-btn {
  @apply inline-flex items-center justify-center rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50;
}
</style>
