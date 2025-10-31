<template>
  <div class="space-y-8">
    <header class="space-y-2">
      <h2 class="text-2xl font-semibold tracking-tight text-slate-900">Statistics / Usage Dashboard</h2>
      <p class="text-sm leading-relaxed text-slate-500">
        Understand how Veritascribe is protecting your institution with rich scan analytics and trend insights.
      </p>
    </header>

    <div class="grid gap-6 xl:grid-cols-2">
      <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">AI Scan Composition</h3>
            <p class="mt-1 text-xs text-slate-500">Distribution of authorship classifications from recent scans.</p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            This Month
            <ChevronDownIcon class="h-3.5 w-3.5" />
          </button>
        </div>
        <div class="mt-8 flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div class="relative h-48 w-48">
            <div class="absolute inset-0 rounded-full border border-slate-100 bg-slate-100/60 shadow-inner" :style="pieStyle"></div>
            <div class="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white text-center shadow">
              <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Scans</p>
              <p class="text-2xl font-semibold text-slate-900">{{ totalComposition }}</p>
              <p class="text-[11px] text-slate-400">documents</p>
            </div>
          </div>
          <ul class="grid gap-4 text-sm text-slate-600">
            <li
              v-for="entry in composition"
              :key="entry.key"
              class="flex items-center justify-between gap-6"
            >
              <div class="flex items-center gap-3">
                <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: entry.color }"></span>
                <span class="font-semibold text-slate-800">{{ entry.label }}</span>
              </div>
              <span class="text-sm font-semibold text-slate-700">{{ entry.value }}</span>
            </li>
          </ul>
        </div>
      </article>

      <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Scan Results</h3>
            <p class="mt-1 text-xs text-slate-500">Each bubble reflects a processed document across the selected period.</p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            This Month
            <ChevronDownIcon class="h-3.5 w-3.5" />
          </button>
        </div>
        <div class="mt-6 space-y-4">
          <div class="relative h-64 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100">
            <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
            <div class="absolute inset-4">
              <div
                v-for="point in scatterPoints"
                :key="point.id"
                class="absolute flex items-center justify-center rounded-full text-[10px] font-semibold text-white shadow-md"
                :class="bubbleClass(point.type)"
                :style="bubbleStyle(point)"
                :title="`${point.label} — ${Math.round(point.probability * 100)}% AI`"
              >
                {{ point.shortLabel }}
              </div>
            </div>
            <div class="absolute left-4 top-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">AI Probability</div>
            <div class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Time Horizon</div>
          </div>
          <div class="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>Human</div>
            <div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-amber-500"></span>AI</div>
            <div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-violet-500"></span>Mixed</div>
          </div>
        </div>
      </article>
    </div>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="card in usageCards"
        :key="card.title"
        class="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{{ card.title }}</p>
        <p class="text-2xl font-semibold text-slate-900">{{ card.value }}</p>
        <p class="text-xs text-slate-500">{{ card.description }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ChevronDownIcon } from '@heroicons/vue/24/outline';

const composition = [
  { key: 'human', label: 'Human', value: 7, color: '#10b981' },
  { key: 'ai', label: 'AI', value: 4, color: '#f59e0b' },
  { key: 'mixed', label: 'Mixed', value: 2, color: '#8b5cf6' },
];

const scatterPoints = [
  { id: 1, label: 'Literature Review', shortLabel: 'LR', probability: 0.28, time: 10, size: 22, type: 'human' },
  { id: 2, label: 'Admissions Essay', shortLabel: 'AE', probability: 0.71, time: 22, size: 28, type: 'mixed' },
  { id: 3, label: 'Grant Proposal', shortLabel: 'GP', probability: 0.85, time: 48, size: 32, type: 'ai' },
  { id: 4, label: 'Faculty Memo', shortLabel: 'FM', probability: 0.18, time: 64, size: 20, type: 'human' },
  { id: 5, label: 'Research Draft', shortLabel: 'RD', probability: 0.62, time: 78, size: 30, type: 'mixed' },
  { id: 6, label: 'Capstone Report', shortLabel: 'CR', probability: 0.47, time: 92, size: 26, type: 'mixed' },
];

const usageCards = [
  { title: 'Words', value: '3,997', description: '3997 / 10,000 credits (words) used this month' },
  { title: 'Scans', value: '18', description: '18 scans made this month' },
  { title: 'Next Reset', value: 'Nov 9', description: 'November 9 credit reset scheduled' },
  { title: 'Reward Credits', value: '0', description: '0 / 0 reward credits (words) remaining' },
];

const totalComposition = computed(() => composition.reduce((sum, item) => sum + item.value, 0));

const pieStyle = computed(() => {
  const total = totalComposition.value || 1;
  let offset = 0;
  const segments = composition.map((item) => {
    const start = (offset / total) * 360;
    const sweep = (item.value / total) * 360;
    offset += item.value;
    return `${item.color} ${start}deg ${start + sweep}deg`;
  });
  return {
    backgroundImage: `conic-gradient(${segments.join(', ')})`,
  };
});

const bubbleClass = (type) => {
  switch (type) {
    case 'human':
      return 'bg-emerald-500/90 backdrop-blur-sm';
    case 'ai':
      return 'bg-amber-500/90 backdrop-blur-sm';
    default:
      return 'bg-violet-500/90 backdrop-blur-sm';
  }
};

const bubbleStyle = (point) => {
  const clampedProbability = Math.min(Math.max(point.probability, 0), 1);
  const left = `${Math.min(Math.max(point.time, 0), 100)}%`;
  const bottom = `${clampedProbability * 100}%`;
  const size = `${point.size}px`;
  return {
    left,
    bottom,
    width: size,
    height: size,
    transform: 'translate(-50%, -50%)',
  };
};
</script>
