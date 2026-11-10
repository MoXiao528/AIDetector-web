<template>
  <section id="capabilities" class="relative py-16 sm:py-20">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-primary-600">{{ t('capabilitiesSection.badge') }}</span>
        <h2 class="section-title mt-4">
          {{ t('capabilitiesSection.title') }}
        </h2>
        <p class="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          {{ t('capabilitiesSection.subtitle') }}
        </p>
      </div>
      <div class="mt-8 grid gap-5 sm:mt-10 lg:grid-cols-3">
        <article
          v-for="capability in capabilities"
          :key="capability.title"
          class="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-[border-color,box-shadow] hover:border-primary-200 hover:shadow sm:p-6"
        >
          <div class="flex items-center justify-between gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
            >
              <component :is="capability.icon" class="h-5 w-5" />
            </div>
            <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">{{ capability.tag }}</span>
          </div>
          <h3 class="mt-4 text-xl font-semibold text-slate-900">{{ capability.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-slate-600">{{ capability.description }}</p>
          <ul class="mt-4 space-y-2 text-xs leading-5 text-slate-500">
            <li v-for="item in capability.points" :key="item" class="flex items-start space-x-2">
              <svg class="mt-1 h-3.5 w-3.5 flex-none text-primary-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ item }}</span>
            </li>
          </ul>
          <RouterLink
            :to="{ name: 'dashboard', query: { panel: 'document' } }"
            class="mt-6 inline-flex items-center text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
          >
            {{ t('capabilitiesSection.cta') }}
            <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </RouterLink>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { ArrowUpTrayIcon, DocumentMagnifyingGlassIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline';
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
    title: t('capabilitiesSection.cards.importAndScan.title'),
    description: t('capabilitiesSection.cards.importAndScan.description'),
    tag: t('capabilitiesSection.cards.importAndScan.tag'),
    icon: ArrowUpTrayIcon,
    points: t('capabilitiesSection.cards.importAndScan.points'),
  },
  {
    title: t('capabilitiesSection.cards.reviewAndExport.title'),
    description: t('capabilitiesSection.cards.reviewAndExport.description'),
    tag: t('capabilitiesSection.cards.reviewAndExport.tag'),
    icon: DocumentMagnifyingGlassIcon,
    points: t('capabilitiesSection.cards.reviewAndExport.points'),
  },
]);
</script>
