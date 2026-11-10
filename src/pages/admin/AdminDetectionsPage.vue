<template>
  <div class="space-y-5">
    <AdminFilterBar
      v-model:searchValue="filters.search"
      search-label="记录搜索"
      search-placeholder="按输入文本、邮箱或用户名搜索"
      @search="handleSearch"
      @reset="resetFilters"
    >
      <template #filters>
        <div class="min-w-0">
          <label for="detection-user-filter" class="admin-kicker">用户 ID</label>
          <input
            id="detection-user-filter"
            :value="filters.userId"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            placeholder="123"
            class="admin-field admin-no-spin mt-2"
            @input="handleUserIdInput"
          />
        </div>
        <AdminSelect v-model="filters.actorType" label="用户类型" :options="actorTypeOptions" placeholder="全部类型" />
        <AdminSelect v-model="filters.label" label="检测标签" :options="labelOptions" placeholder="全部标签" />
        <div class="min-w-0">
          <label for="detection-function-filter" class="admin-kicker">功能</label>
          <input id="detection-function-filter" v-model="filters.functionName" type="text" placeholder="scan" class="admin-field mt-2" />
        </div>
        <AdminDatePicker v-model="filters.dateFrom" label="开始日期" placeholder="开始日期" :max-value="filters.dateTo || ''" />
        <AdminDatePicker v-model="filters.dateTo" label="结束日期" placeholder="结束日期" :min-value="filters.dateFrom || ''" />
      </template>
    </AdminFilterBar>

    <div v-if="errorMessage" role="alert" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
        <span>{{ row.userEmail || row.userName || '游客' }}</span>
      </template>
      <template #cell-label="{ value }">
        <span class="rounded-md px-2.5 py-1 text-xs font-semibold" :class="value === 'ai' ? 'bg-blue-50 text-blue-700' : value === 'human' ? 'bg-cyan-50 text-cyan-800' : 'bg-slate-100 text-slate-700'">{{ String(value).toUpperCase() }}</span>
      </template>
      <template #cell-score="{ value }"><span class="font-semibold tabular-nums text-slate-900">{{ formatScore(value) }}</span></template>
      <template #cell-createdAt="{ value }">{{ formatDateTime(value) }}</template>
      <template #actions="{ row }">
        <button type="button" class="admin-secondary-btn liquid-glass" @click="openDetection(row)">查看</button>
        <button type="button" class="admin-danger-btn" @click="requestDelete(row)">删除</button>
      </template>
    </AdminDataTable>

    <AdminPagination :page="page" :total-pages="totalPages" :total="total" :loading="loading" @change="changePage" />

    <div v-if="drawerOpen" class="fixed inset-0 z-50 !mt-0 flex justify-end bg-slate-900/35 backdrop-blur-sm" @click.self="closeDrawer">
      <div class="flex h-full min-h-0 w-full max-w-3xl flex-col border-l border-slate-200 bg-white shadow-xl [overflow-wrap:anywhere]">
        <div class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div class="min-w-0">
            <h2 class="text-lg font-semibold text-slate-900">{{ selectedDetection?.label?.toUpperCase() || '检测详情' }}</h2>
            <p class="mt-1 break-all text-sm text-slate-600">{{ selectedDetection?.userEmail || selectedDetection?.userName || '游客' }}</p>
          </div>
          <button type="button" class="admin-secondary-btn liquid-glass shrink-0" @click="closeDrawer">关闭</button>
        </div>

        <div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <div v-if="drawerError" role="alert" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {{ drawerError }}
          </div>

          <section class="border-b border-slate-200 pb-6">
            <div class="flex flex-wrap items-center gap-3">
              <span class="rounded-md px-2.5 py-1 text-xs font-semibold" :class="selectedDetection?.label === 'ai' ? 'bg-blue-50 text-blue-700' : selectedDetection?.label === 'human' ? 'bg-cyan-50 text-cyan-800' : 'bg-slate-100 text-slate-700'">{{ selectedDetection?.label?.toUpperCase() || '-' }}</span>
              <span class="text-sm text-slate-600">AI 概率 <strong class="text-lg font-semibold tabular-nums text-slate-900">{{ formatScore(selectedDetection?.score) }}</strong></span>
              <span class="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{{ selectedDetection?.actorType || '-' }}</span>
            </div>
            <div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div class="min-w-0"><p class="admin-kicker">用户</p><p class="mt-1 break-all text-sm text-slate-700">{{ selectedDetection?.userEmail || selectedDetection?.userName || '游客' }}</p></div>
              <div class="min-w-0"><p class="admin-kicker">字符数</p><p class="mt-1 text-sm tabular-nums text-slate-700">{{ formatNumber(selectedDetection?.charsUsed) }}</p></div>
              <div class="min-w-0"><p class="admin-kicker">功能</p><p class="mt-1 text-sm text-slate-700">{{ formatFunctions(selectedDetection?.functionsUsed) }}</p></div>
              <div class="min-w-0"><p class="admin-kicker">创建时间</p><p class="mt-1 text-sm text-slate-700">{{ formatDateTime(selectedDetection?.createdAt) }}</p></div>
            </div>
          </section>

          <section class="space-y-6">
            <div class="min-w-0 border-b border-slate-200 pb-6">
              <h3 class="text-base font-semibold text-slate-900">原文</h3>
              <p class="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{{ selectedDetection?.inputText || '-' }}</p>
            </div>

            <div class="min-w-0">
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-base font-semibold text-slate-900">分析数据与元信息</h3>
                <span class="text-xs font-medium text-slate-500">JSON</span>
              </div>
              <pre class="mt-4 max-h-[420px] max-w-full overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">{{ prettyMeta }}</pre>
            </div>
          </section>

          <div class="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" class="admin-secondary-btn liquid-glass" @click="closeDrawer">取消</button>
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
  { value: 'human', label: 'Human' },
];

const columns = [
  { key: 'userEmail', label: '用户' },
  { key: 'actorType', label: '用户类型' },
  { key: 'label', label: '检测标签' },
  { key: 'score', label: 'AI 概率' },
  { key: 'charsUsed', label: '字符数' },
  { key: 'createdAt', label: '创建时间' },
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
  @apply min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100;
}

.admin-field::-webkit-outer-spin-button,
.admin-field::-webkit-inner-spin-button,
.admin-no-spin::-webkit-outer-spin-button,
.admin-no-spin::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.admin-kicker {
  @apply block text-sm font-medium text-slate-600;
}

.admin-secondary-btn {
  @apply inline-flex min-h-10 items-center justify-center rounded-full px-3.5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50;
}

.admin-danger-btn {
  @apply inline-flex min-h-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50;
}
</style>
