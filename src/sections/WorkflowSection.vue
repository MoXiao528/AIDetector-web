<template>
  <section id="workflow" class="py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <h2 class="section-title">{{ t('workflowSection.title') }}</h2>
        <p class="section-subtitle">
          {{ t('workflowSection.subtitle') }}
        </p>
      </div>
      <div class="mt-16 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div class="relative grid gap-6 pl-6">
          <div class="absolute left-6 top-0 h-full w-px border-l-2 border-dashed border-slate-200"></div>
          <article
            v-for="(step, index) in steps"
            :key="step.title"
            class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-md"
          >
            <div class="absolute -left-12 top-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-100/80 text-3xl font-bold text-primary-500">
              {{ index + 1 }}
            </div>
            <div class="ml-14">
              <h3 class="text-xl font-semibold text-slate-900">{{ step.title }}</h3>
              <p class="mt-3 text-sm text-slate-600">{{ step.description }}</p>
              <ul class="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
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
        <aside class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">{{ t('workflowSection.snapshot.badge') }}</p>
            <h3 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{{ t('workflowSection.snapshot.title') }}</h3>
            <p class="mt-3 text-sm text-slate-600">{{ t('workflowSection.snapshot.subtitle') }}</p>
          </div>
          <dl class="mt-8 space-y-5">
            <div class="flex items-center justify-between">
              <dt class="text-sm font-medium text-slate-500">{{ t('workflowSection.snapshot.metrics.documents') }}</dt>
              <dd class="text-xl font-semibold text-slate-900">{{ t('workflowSection.snapshot.values.documents') }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-sm font-medium text-slate-500">{{ t('workflowSection.snapshot.metrics.risk') }}</dt>
              <dd class="text-xl font-semibold text-slate-900">{{ t('workflowSection.snapshot.values.risk') }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-sm font-medium text-slate-500">{{ t('workflowSection.snapshot.metrics.polish') }}</dt>
              <dd class="text-xl font-semibold text-slate-900">{{ t('workflowSection.snapshot.values.polish') }}</dd>
            </div>
          </dl>
          <button
            type="button"
            class="mt-10 inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-primary-200/60 transition hover:-translate-y-0.5 hover:bg-primary-500"
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
    title: t('workflowSection.steps.polish.title'),
    description: t('workflowSection.steps.polish.description'),
    chips: t('workflowSection.steps.polish.chips'),
  },
  {
    title: t('workflowSection.steps.translate.title'),
    description: t('workflowSection.steps.translate.description'),
    chips: t('workflowSection.steps.translate.chips'),
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
