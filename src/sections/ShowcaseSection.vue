<template>
  <section id="showcase" class="py-16 sm:py-20">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <h2 class="section-title">{{ t('showcaseSection.title') }}</h2>
        <p class="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          {{ t('showcaseSection.subtitle') }}
        </p>
      </div>
      <div class="mt-8 grid gap-5 sm:mt-10 lg:grid-cols-3">
        <article
          v-for="useCase in useCases"
          :key="useCase.title"
          class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-[border-color,box-shadow] hover:border-primary-200 hover:shadow sm:p-6"
        >
          <div class="flex h-full flex-col">
            <div class="inline-flex self-start items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              {{ useCase.tag }}
            </div>
            <h3 class="mt-4 text-2xl font-semibold text-slate-900">{{ useCase.title }}</h3>
            <p class="mt-2 text-sm leading-6 text-slate-600">{{ useCase.description }}</p>
            <ul class="mt-4 space-y-2 text-xs leading-5 text-slate-500">
              <li v-for="point in useCase.points" :key="point" class="flex items-start space-x-2">
                <svg class="mt-1 h-3.5 w-3.5 flex-none text-primary-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ point }}</span>
              </li>
            </ul>
            <div class="mt-6 text-sm leading-6 text-primary-600">
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
