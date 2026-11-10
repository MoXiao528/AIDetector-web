<template>
  <section id="workflow" class="py-16 sm:py-20">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <h2 class="section-title">{{ t('workflowSection.title') }}</h2>
        <p class="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          {{ t('workflowSection.subtitle') }}
        </p>
      </div>
      <div class="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[1.4fr_1fr]">
        <div class="relative grid gap-4 pl-6">
          <div class="absolute left-6 top-0 h-full w-px border-l-2 border-dashed border-slate-200"></div>
          <article
            v-for="(step, index) in steps"
            :key="step.title"
            class="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-[border-color,box-shadow] hover:border-primary-200 hover:shadow sm:p-6"
          >
            <div class="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-base font-semibold text-primary-700 sm:left-6 sm:top-6">
              {{ index + 1 }}
            </div>
            <div class="ml-12">
              <h3 class="text-xl font-semibold leading-7 text-slate-900">{{ step.title }}</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">{{ step.description }}</p>
              <ul class="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <li
                  v-for="chip in step.chips"
                  :key="chip"
                  class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                >
                  {{ chip }}
                </li>
              </ul>
            </div>
          </article>
        </div>
        <aside class="flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h3 class="text-2xl font-semibold tracking-tight text-slate-900">{{ t('workflowSection.snapshot.title') }}</h3>
          <dl class="mt-6 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <dt class="text-sm font-medium text-slate-500">{{ t('workflowSection.snapshot.metrics.documents') }}</dt>
              <dd class="text-lg font-semibold text-slate-900">{{ t('workflowSection.snapshot.values.documents') }}</dd>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <dt class="text-sm font-medium text-slate-500">{{ t('workflowSection.snapshot.metrics.risk') }}</dt>
              <dd class="text-lg font-semibold text-slate-900">{{ t('workflowSection.snapshot.values.risk') }}</dd>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <dt class="text-sm font-medium text-slate-500">{{ t('workflowSection.snapshot.metrics.polish') }}</dt>
              <dd class="text-lg font-semibold text-slate-900">{{ t('workflowSection.snapshot.values.polish') }}</dd>
            </div>
          </dl>
          <button
            type="button"
            class="liquid-glass primary-action mt-6 inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            @click="openDashboard"
          >
            {{ t('workflowSection.snapshot.cta') }}
          </button>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '../i18n';
import { useScanStore } from '../store/scan';

const router = useRouter();
const scanStore = useScanStore();
const { t } = useI18n();

const steps = computed(() => [
  {
    title: t('workflowSection.steps.import.title'),
    description: t('workflowSection.steps.import.description'),
    chips: t('workflowSection.steps.import.chips'),
  },
  {
    title: t('workflowSection.steps.detect.title'),
    description: t('workflowSection.steps.detect.description'),
    chips: t('workflowSection.steps.detect.chips'),
  },
  {
    title: t('workflowSection.steps.review.title'),
    description: t('workflowSection.steps.review.description'),
    chips: t('workflowSection.steps.review.chips'),
  },
]);

const openDashboard = () => {
  scanStore.commitDraftToStorage();
  const target = router.resolve({ name: 'dashboard' });
  if (typeof window !== 'undefined') {
    window.open(target.href, '_blank', 'noopener');
  }
};
</script>
