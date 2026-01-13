<template>
  <div class="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm shadow-slate-200/60 backdrop-blur">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span class="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-primary-600 text-white shadow">→</span>
        <span>新手交互引导</span>
      </div>
      <p class="text-xs text-slate-500">按照步骤体验上传、扫描、查看报告与导出动作。</p>
      <div class="ml-auto flex gap-2 text-xs">
        <button type="button" class="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-100" @click="$emit('skip')">稍后再说</button>
        <button
          type="button"
          class="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white shadow-sm hover:bg-slate-800"
          @click="$emit('complete')"
        >
          我已熟悉
        </button>
      </div>
    </div>
    <div class="mt-4 grid gap-3 md:grid-cols-4">
      <div
        v-for="step in steps"
        :key="step.key"
        :class="[
          'flex flex-col gap-2 rounded-2xl border px-3 py-3 text-sm transition',
          step.status === 'done'
            ? 'border-emerald-200 bg-emerald-50'
            : step.status === 'current'
              ? 'border-primary-200 bg-primary-50'
              : 'border-slate-200 bg-white',
        ]"
      >
        <div class="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span class="rounded-full bg-white/70 px-2 py-0.5 shadow-inner">{{ step.label }}</span>
          <span
            :class="[
              'rounded-full px-2 py-0.5 text-[11px] font-semibold',
              step.status === 'done'
                ? 'bg-emerald-100 text-emerald-700'
                : step.status === 'current'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-slate-100 text-slate-400',
            ]"
          >
            {{ statusText(step.status) }}
          </span>
        </div>
        <p class="text-xs leading-relaxed text-slate-600">{{ step.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { steps } = defineProps({
  steps: {
    type: Array,
    default: () => [],
  },
});

const statusText = (status) => {
  if (status === 'done') return '已完成';
  if (status === 'current') return '进行中';
  return '待开始';
};
</script>
