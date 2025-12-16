<template>
  <div
    v-if="variant === 'scan'"
    class="flex items-center gap-5 text-sm text-slate-600"
  >
    <button
      type="button"
      class="group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold text-primary-600 transition hover:bg-primary-50"
      @click="$emit('upgrade')"
    >
      <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-primary-500 shadow-sm">
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 4l2.09 4.23 4.67.68-3.38 3.29.8 4.64L12 14.77l-4.18 2.2.8-4.64-3.38-3.29 4.67-.68L12 4z" />
        </svg>
      </span>
      <span>Upgrade to Premium</span>
    </button>
    <span class="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
      FREE
    </span>
    <div class="flex items-center gap-3 text-xs">
      <div class="text-[13px] font-medium text-slate-700">
        {{ formattedRemaining }} / {{ formattedTotal }} credits left
      </div>
      <div class="relative h-10 w-10">
        <svg viewBox="0 0 36 36" class="h-full w-full">
          <path
            class="text-slate-200"
            stroke="currentColor"
            stroke-width="3.5"
            fill="none"
            stroke-linecap="round"
            d="M18 3a15 15 0 110 30 15 15 0 010-30z"
          />
          <path
            class="text-primary-500"
            stroke="currentColor"
            stroke-width="3.5"
            fill="none"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeOffset"
            d="M18 3a15 15 0 110 30 15 15 0 010-30z"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-slate-600">
          {{ percentRemaining }}%
        </div>
      </div>
    </div>
    <slot name="avatar" />
  </div>
  <div
    v-else
    class="flex flex-wrap items-center justify-end gap-3 text-sm text-slate-600 md:flex-nowrap"
  >
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="hidden items-center justify-center rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 sm:inline-flex"
        @click="$emit('feedback')"
      >
        Feedback
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-primary-500"
        @click="$emit('upgrade')"
      >
        <span aria-hidden="true">⚡</span>
        <span>Upgrade</span>
      </button>
    </div>
    <div class="flex items-center gap-4">
      <div class="hidden min-w-[200px] flex-1 md:block">
        <div class="flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>{{ compactRemaining }} credits</span>
          <span>of {{ compactTotal }} remaining</span>
        </div>
        <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div class="h-full rounded-full bg-primary-500" :style="{ width: percentRemaining + '%' }"></div>
        </div>
      </div>
      <slot name="avatar" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'standard',
  },
  creditsRemaining: {
    type: Number,
    default: 0,
  },
  creditsTotal: {
    type: Number,
    default: 0,
  },
});

defineEmits(['upgrade', 'feedback']);

const numberFormatter = new Intl.NumberFormat('en-US');
const compactFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

const boundedTotal = computed(() => (Number.isFinite(props.creditsTotal) && props.creditsTotal > 0 ? props.creditsTotal : 0));
const boundedRemaining = computed(() => {
  if (!Number.isFinite(props.creditsRemaining)) return 0;
  return Math.min(Math.max(props.creditsRemaining, 0), boundedTotal.value || props.creditsRemaining);
});

const percentRemaining = computed(() => {
  if (!boundedTotal.value) return 0;
  return Math.min(100, Math.max(0, Math.round((boundedRemaining.value / boundedTotal.value) * 100)));
});

const circumference = 2 * Math.PI * 15;
const strokeOffset = computed(() => circumference * ((100 - percentRemaining.value) / 100));

const formattedRemaining = computed(() => numberFormatter.format(Math.round(boundedRemaining.value)));
const formattedTotal = computed(() => numberFormatter.format(Math.round(boundedTotal.value)));
const compactRemaining = computed(() => compactFormatter.format(Math.round(boundedRemaining.value)));
const compactTotal = computed(() => compactFormatter.format(Math.round(boundedTotal.value)));
</script>

<style scoped>
svg {
  transform: rotate(-90deg);
}
</style>
