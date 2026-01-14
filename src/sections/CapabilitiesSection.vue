<template>
  <section id="capabilities" class="relative py-24">
    <div class="absolute inset-x-0 -top-20 -z-10 h-40 bg-gradient-to-b from-primary-100/60 to-transparent"></div>
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-600">{{ t('capabilitiesSection.badge') }}</span>
        <h2 class="section-title mt-6">
          {{ t('capabilitiesSection.title') }}
        </h2>
        <p class="section-subtitle">
          {{ t('capabilitiesSection.subtitle') }}
        </p>
      </div>
      <div class="mt-16 grid gap-6 lg:grid-cols-3">
        <article
          v-for="(capability, index) in capabilities"
          :key="capability.title"
          class="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div class="flex items-center justify-between">
            <div
              :class="[
                'flex h-12 w-12 items-center justify-center rounded-2xl',
                index === 0 ? 'bg-primary-100 text-primary-600' : index === 1 ? 'bg-sky-100 text-sky-600' : 'bg-emerald-100 text-emerald-600',
              ]"
            >
              <component :is="capability.icon" class="h-6 w-6" />
            </div>
            <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">{{ capability.tag }}</span>
          </div>
          <h3 class="mt-6 text-xl font-semibold text-slate-900">{{ capability.title }}</h3>
          <p class="mt-3 text-sm text-slate-600">{{ capability.description }}</p>
          <ul class="mt-6 space-y-2 text-xs text-slate-500">
            <li v-for="item in capability.points" :key="item" class="flex items-start space-x-2">
              <svg class="mt-1 h-3.5 w-3.5 flex-none text-primary-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ item }}</span>
            </li>
          </ul>
          <a
            href="#trial"
            class="mt-8 inline-flex items-center text-sm font-semibold text-primary-600 transition hover:text-primary-500"
          >
            {{ t('capabilitiesSection.cta') }}
            <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { AcademicCapIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/vue/24/outline';
import { useI18n } from '../i18n';

const { t } = useI18n();

const capabilities = computed(() => [
  {
    title: t('capabilitiesSection.cards.deepDetection.title'),
    description: t('capabilitiesSection.cards.deepDetection.description'),
    tag: t('capabilitiesSection.cards.deepDetection.tag'),
    icon: ShieldCheckIcon,
    points: t('capabilitiesSection.cards.deepDetection.points'),
  },
  {
    title: t('capabilitiesSection.cards.polish.title'),
    description: t('capabilitiesSection.cards.polish.description'),
    tag: t('capabilitiesSection.cards.polish.tag'),
    icon: SparklesIcon,
    points: t('capabilitiesSection.cards.polish.points'),
  },
  {
    title: t('capabilitiesSection.cards.translate.title'),
    description: t('capabilitiesSection.cards.translate.description'),
    tag: t('capabilitiesSection.cards.translate.tag'),
    icon: AcademicCapIcon,
    points: t('capabilitiesSection.cards.translate.points'),
  },
]);
</script>
