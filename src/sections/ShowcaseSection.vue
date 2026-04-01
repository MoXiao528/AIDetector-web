<template>
  <section id="showcase" class="py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <h2 class="section-title">{{ t('showcaseSection.title') }}</h2>
        <p class="section-subtitle">
          {{ t('showcaseSection.subtitle') }}
        </p>
      </div>
      <div class="mt-14 grid gap-6 lg:grid-cols-3">
        <article
          v-for="useCase in useCases"
          :key="useCase.title"
          class="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div class="absolute -right-10 top-10 h-32 w-32 rounded-full bg-primary-200/40 blur-2xl transition group-hover:bg-primary-300/50"></div>
          <div class="relative flex h-full flex-col">
            <div class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              {{ useCase.tag }}
            </div>
            <h3 class="mt-6 text-2xl font-semibold text-slate-900">{{ useCase.title }}</h3>
            <p class="mt-4 text-sm text-slate-600">{{ useCase.description }}</p>
            <ul class="mt-6 space-y-2 text-xs text-slate-500">
              <li v-for="point in useCase.points" :key="point" class="flex items-start space-x-2">
                <svg class="mt-1 h-3.5 w-3.5 flex-none text-primary-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ point }}</span>
              </li>
            </ul>
            <div class="mt-8 text-sm text-primary-600">
              <span>{{ t('showcaseSection.metricLabel', { value: useCase.metric }) }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '../i18n';

const { t } = useI18n();

const useCases = computed(() => [
  {
    title: t('showcaseSection.cases.social.title'),
    description: t('showcaseSection.cases.social.description'),
    tag: t('showcaseSection.cases.social.tag'),
    metric: t('showcaseSection.cases.social.metric'),
    points: t('showcaseSection.cases.social.points'),
  },
  {
    title: t('showcaseSection.cases.education.title'),
    description: t('showcaseSection.cases.education.description'),
    tag: t('showcaseSection.cases.education.tag'),
    metric: t('showcaseSection.cases.education.metric'),
    points: t('showcaseSection.cases.education.points'),
  },
  {
    title: t('showcaseSection.cases.newsroom.title'),
    description: t('showcaseSection.cases.newsroom.description'),
    tag: t('showcaseSection.cases.newsroom.tag'),
    metric: t('showcaseSection.cases.newsroom.metric'),
    points: t('showcaseSection.cases.newsroom.points'),
  },
]);
</script>
