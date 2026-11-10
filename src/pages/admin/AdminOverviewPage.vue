<template>
  <div class="min-w-0 space-y-6">
    <div v-if="errorMessage" role="alert" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      {{ errorMessage }}
    </div>

    <section class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
      <div>
        <h2 class="text-base font-semibold text-slate-900">统计周期</h2>
        <p class="mt-1 text-sm leading-6 text-slate-600">{{ periodDescription }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2" aria-label="统计周期">
        <button
          v-for="preset in presetOptions"
          :key="preset.value"
          type="button"
          :class="['liquid-glass admin-preset-btn', activePreset === preset.value ? 'liquid-glass-selected' : '']"
          :aria-pressed="activePreset === preset.value"
          :disabled="loading"
          @click="changePreset(preset.value)"
        >
          {{ preset.label }}
        </button>
      </div>
    </section>

    <section class="grid grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-4" :aria-busy="loading">
      <article v-for="(card, index) in metricCards" :key="card.label" class="overview-metric" :class="{ 'overview-metric--primary': index === 1 }">
        <p class="text-sm font-medium text-slate-600">{{ card.label }}</p>
        <p class="mt-3 break-words text-2xl font-semibold tracking-tight text-primary-900 tabular-nums sm:text-3xl">{{ loading || errorMessage ? '—' : card.value }}</p>
        <p class="mt-2 text-xs leading-5 text-slate-600">{{ loading ? '正在加载…' : errorMessage ? '暂不可用' : card.hint }}</p>
      </article>
    </section>

    <section class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <section class="min-w-0">
        <div class="mb-4">
          <h2 class="text-base font-semibold text-slate-900">趋势明细</h2>
          <p class="mt-1 text-sm text-slate-600">{{ activePresetLabel }} · {{ granularityLabel }}</p>
        </div>
        <AdminDataTable
          :columns="trendColumns"
          :rows="overview?.series || []"
          :loading="loading"
          empty-title="暂无趋势数据"
          empty-description="当前周期内没有可展示的统计结果。"
          row-key="bucketStart"
        >
          <template #cell-bucketLabel="{ value }">{{ value || '-' }}</template>
          <template #cell-newUsers="{ value }"><span class="font-medium text-slate-900 tabular-nums">{{ formatNumber(value) }}</span></template>
          <template #cell-detections="{ value }"><span class="font-medium text-primary-700 tabular-nums">{{ formatNumber(value) }}</span></template>
          <template #cell-charsUsed="{ value }"><span class="font-medium text-slate-900 tabular-nums">{{ formatNumber(value) }}</span></template>
        </AdminDataTable>
      </section>

      <div class="min-w-0 space-y-5">
        <section class="overview-panel">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-slate-900">管理接口状态</h2>
            <div role="status" class="inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-semibold" :class="loading ? 'bg-slate-100 text-slate-600' : statusOk ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'">
              <span aria-hidden="true" class="h-2 w-2 shrink-0 rounded-full" :class="loading ? 'bg-slate-400' : statusOk ? 'bg-emerald-600' : 'bg-rose-600'"></span>
              <span class="break-words">{{ loading ? '检查中…' : statusText }}</span>
            </div>
          </div>
          <p class="mt-2 text-xs leading-6 text-slate-600">反映管理接口连通情况，不代表检测模型就绪。</p>
          <button type="button" class="liquid-glass mt-3 inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading" @click="loadData">
            {{ loading ? '正在刷新…' : '刷新概览' }}
          </button>
        </section>

        <section class="overview-panel">
          <h2 class="text-base font-semibold text-slate-900">最近用户</h2>
          <p v-if="loading" class="py-6 text-sm text-slate-500" role="status">正在加载用户…</p>
          <ul v-else class="mt-2 divide-y divide-slate-100">
            <li v-for="user in overview?.recentUsers || []" :key="user.id" class="py-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="break-words text-sm font-semibold text-slate-900">{{ user.name }}</p>
                  <p class="mt-1 break-all text-sm text-slate-600">{{ user.email }}</p>
                </div>
                <span class="shrink-0 rounded-md bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-700">{{ user.systemRole }}</span>
              </div>
              <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>{{ user.isActive ? '启用' : '停用' }}</span>
                <span class="tabular-nums">{{ formatDateTime(user.createdAt) }}</span>
              </div>
            </li>
            <li v-if="!(overview?.recentUsers || []).length" class="py-6 text-center text-sm text-slate-500">暂无最近用户</li>
          </ul>
        </section>

        <section class="overview-panel">
          <h2 class="text-base font-semibold text-slate-900">最近检测</h2>
          <p v-if="loading" class="py-6 text-sm text-slate-500" role="status">正在加载检测记录…</p>
          <ul v-else class="mt-2 divide-y divide-slate-100">
            <li v-for="item in overview?.recentDetections || []" :key="item.id" class="py-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-900">{{ String(item.label).toUpperCase() }}</p>
                  <p class="mt-1 break-all text-sm text-slate-600">{{ item.userName || item.userEmail || '游客' }}</p>
                </div>
                <span class="shrink-0 rounded-md bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700 tabular-nums">{{ formatScore(item.score) }}</span>
              </div>
              <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>{{ formatNumber(item.charsUsed) }} 字符</span>
                <span class="tabular-nums">{{ formatDateTime(item.createdAt) }}</span>
              </div>
            </li>
            <li v-if="!(overview?.recentDetections || []).length" class="py-6 text-center text-sm text-slate-500">暂无最近检测</li>
          </ul>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AdminDataTable from '../../components/admin/AdminDataTable.vue';
import { fetchAdminOverview, fetchAdminStatus } from '../../api/modules/admin';
import { showToast } from '../../utils/toast';

const presetOptions = [
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季度' },
  { value: 'year', label: '今年' },
];

const loading = ref(false);
const errorMessage = ref('');
const statusText = ref('Checking');
const statusOk = ref(true);
const overview = ref(null);
const activePreset = ref('week');

const trendColumns = computed(() => [
  { key: 'bucketLabel', label: granularityColumnLabel.value },
  { key: 'newUsers', label: '新增用户' },
  { key: 'detections', label: '检测次数' },
  { key: 'charsUsed', label: '字符消耗' },
]);

const activePresetLabel = computed(() => presetOptions.find((item) => item.value === activePreset.value)?.label || '本周');
const granularityLabel = computed(() => {
  const value = overview.value?.period?.granularity;
  if (value === 'hour') return '按小时';
  if (value === 'day') return '按天';
  if (value === 'week') return '按周';
  if (value === 'month') return '按月';
  return '按天';
});

const granularityColumnLabel = computed(() => {
  const value = overview.value?.period?.granularity;
  if (value === 'hour') return '小时';
  if (value === 'week') return '周';
  if (value === 'month') return '月份';
  return '日期';
});

const periodDescription = computed(() => {
  const period = overview.value?.period;
  if (!period?.startAt || !period?.endAt) {
    return `${activePresetLabel.value}，自动粒度展示`;
  }
  return `${activePresetLabel.value} · ${formatDateTime(period.startAt)} - ${formatDateTime(period.endAt)}`;
});

const metricCards = computed(() => {
  const summary = overview.value?.summary || {};
  return [
    {
      label: `${activePresetLabel.value}新增用户`,
      value: formatNumber(summary.newUsers),
      hint: `总用户 ${formatNumber(summary.totalUsers)}`,
    },
    {
      label: `${activePresetLabel.value}检测次数`,
      value: formatNumber(summary.detections),
      hint: `当前粒度 ${granularityLabel.value}`,
    },
    {
      label: `${activePresetLabel.value}字符消耗`,
      value: formatNumber(summary.charsUsed),
      hint: '统计周期内累计字符消耗',
    },
    {
      label: '启用 / 总用户',
      value: `${formatNumber(summary.activeUsers)} / ${formatNumber(summary.totalUsers)}`,
      hint: '当前处于启用状态的账号',
    },
  ];
});

async function loadData() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [status, nextOverview] = await Promise.all([fetchAdminStatus(), fetchAdminOverview({ preset: activePreset.value })]);
    overview.value = nextOverview;
    statusText.value = status.message || 'ok';
    statusOk.value = true;
  } catch (error) {
    statusOk.value = false;
    statusText.value = 'unavailable';
    errorMessage.value = error?.message || '管理员概览加载失败';
    showToast({ title: '管理员概览', message: errorMessage.value });
  } finally {
    loading.value = false;
  }
}

async function changePreset(nextPreset) {
  if (nextPreset === activePreset.value) return;
  activePreset.value = nextPreset;
  await loadData();
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

onMounted(loadData);
</script>

<style scoped>
.overview-panel {
  @apply min-w-0 rounded-2xl border border-slate-200 bg-white p-5;
}

.overview-metric {
  @apply min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5;
}

.overview-metric--primary {
  border-color: #bcd0f2;
  background: linear-gradient(145deg, #dce9fc, #c4d8f6);
}

.admin-preset-btn {
  @apply inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60;
}
</style>
