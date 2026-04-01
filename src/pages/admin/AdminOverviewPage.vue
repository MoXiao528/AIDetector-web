<template>
  <div class="space-y-6">
    <div v-if="errorMessage" class="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
      {{ errorMessage }}
    </div>

    <section class="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Overview Range</p>
          <h2 class="mt-2 text-2xl font-semibold tracking-tight text-white">概览周期</h2>
          <p class="mt-1 text-sm text-slate-400">{{ periodDescription }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="preset in presetOptions"
            :key="preset.value"
            type="button"
            :class="['admin-preset-btn', activePreset === preset.value ? 'admin-preset-btn--active' : '']"
            :disabled="loading"
            @click="changePreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in metricCards" :key="card.label" class="rounded-3xl border border-white/10 bg-white/5 p-5">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ card.label }}</p>
        <p class="mt-3 text-3xl font-semibold tracking-tight text-white">{{ card.value }}</p>
        <p class="mt-2 text-sm text-slate-400">{{ card.hint }}</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div class="space-y-6">
        <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-white">服务状态</h2>
              <p class="mt-1 text-sm text-slate-400">这里只看管理员接口和状态探针。</p>
            </div>
            <div class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" :class="statusOk ? 'bg-emerald-400/15 text-emerald-200' : 'bg-rose-400/15 text-rose-200'">
              <span class="h-2.5 w-2.5 rounded-full" :class="statusOk ? 'bg-emerald-300' : 'bg-rose-300'"></span>
              {{ statusText }}
            </div>
          </div>
          <button type="button" class="admin-primary-btn mt-4" :disabled="loading" @click="loadData">刷新概览</button>
        </div>

        <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-white">趋势明细</h2>
            <p class="mt-1 text-sm text-slate-400">当前粒度：{{ granularityLabel }}，周期：{{ activePresetLabel }}</p>
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
            <template #cell-newUsers="{ value }"><span class="font-semibold text-white">{{ formatNumber(value) }}</span></template>
            <template #cell-detections="{ value }"><span class="font-semibold text-white">{{ formatNumber(value) }}</span></template>
            <template #cell-charsUsed="{ value }"><span class="font-semibold text-white">{{ formatNumber(value) }}</span></template>
          </AdminDataTable>
        </div>
      </div>

      <div class="space-y-6">
        <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-white">最近用户</h2>
            <span class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Recent</span>
          </div>

          <div class="space-y-3">
            <div v-for="user in overview?.recentUsers || []" :key="user.id" class="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-semibold text-white">{{ user.name }}</p>
                  <p class="text-sm text-slate-400">{{ user.email }}</p>
                </div>
                <span class="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-semibold text-sky-100">{{ user.systemRole }}</span>
              </div>
              <div class="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{{ user.isActive ? '启用' : '停用' }}</span>
                <span>{{ formatDateTime(user.createdAt) }}</span>
              </div>
            </div>
            <p v-if="!(overview?.recentUsers || []).length && !loading" class="py-8 text-center text-sm text-slate-500">暂无最近用户</p>
          </div>
        </div>

        <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-white">最近检测</h2>
            <span class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Recent</span>
          </div>

          <div class="space-y-3">
            <div v-for="item in overview?.recentDetections || []" :key="item.id" class="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-semibold text-white">{{ String(item.label).toUpperCase() }}</p>
                  <p class="text-sm text-slate-400">{{ item.userName || item.userEmail || 'Guest' }}</p>
                </div>
                <span class="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-100">{{ formatScore(item.score) }}</span>
              </div>
              <div class="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{{ formatNumber(item.charsUsed) }} chars</span>
                <span>{{ formatDateTime(item.createdAt) }}</span>
              </div>
            </div>
            <p v-if="!(overview?.recentDetections || []).length && !loading" class="py-8 text-center text-sm text-slate-500">暂无最近检测</p>
          </div>
        </div>
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
      label: '活跃 / 总用户',
      value: `${formatNumber(summary.activeUsers)} / ${formatNumber(summary.totalUsers)}`,
      hint: '活跃用户按当前系统状态统计',
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
.admin-primary-btn {
  @apply inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50;
}

.admin-preset-btn {
  @apply inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50;
}

.admin-preset-btn--active {
  @apply border-transparent bg-amber-400 text-slate-950 hover:bg-amber-300;
}
</style>
