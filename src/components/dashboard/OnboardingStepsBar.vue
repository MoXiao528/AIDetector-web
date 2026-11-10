<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <ArrowRightIcon class="h-5 w-5 text-primary-600" aria-hidden="true" />
        <span>{{ t('onboarding.title') }}</span>
      </div>
      <p class="text-xs text-slate-500">{{ t('onboarding.subtitle') }}</p>
      <div class="ml-auto flex gap-2 text-xs">
        <button type="button" class="liquid-glass min-h-9 rounded-full px-3 py-1" @click="$emit('skip')">
          {{ t('onboarding.skip') }}
        </button>
        <button
          type="button"
          class="liquid-glass liquid-glass-selected min-h-9 rounded-full px-3 py-1 font-semibold"
          @click="$emit('complete')"
        >
          {{ t('onboarding.complete') }}
        </button>
      </div>
    </div>
    <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="step in steps"
        :key="step.key"
        :class="[
          'flex flex-col gap-2 rounded-lg border px-3 py-3 text-sm transition',
          step.status === 'done'
            ? 'border-slate-200 bg-slate-50'
            : step.status === 'current'
              ? 'border-primary-200 bg-primary-50'
              : 'border-slate-200 bg-white',
        ]"
      >
        <div class="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>{{ step.label }}</span>
          <span
            :class="[
              'rounded-full px-2 py-0.5 text-[11px] font-semibold',
              step.status === 'done'
                ? 'bg-slate-100 text-slate-600'
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
import { ArrowRightIcon } from '@heroicons/vue/24/outline';
import { useI18n } from '../../i18n';

const { steps } = defineProps({
  steps: {
    type: Array,
    default: () => [],
  },
});

const { t } = useI18n();

const statusText = (status) => {
  if (status === 'done') return t('onboarding.status.done');
  if (status === 'current') return t('onboarding.status.current');
  return t('onboarding.status.pending');
};
</script>
