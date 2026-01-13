<template>
  <footer class="border-t border-slate-800 bg-slate-900 py-14 text-slate-200">
    <div class="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
      <div class="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div class="space-y-4">
          <div class="flex items-center space-x-3">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white font-semibold shadow-sm">{{ t('common.brandInitial') }}</span>
            <span class="text-lg font-semibold tracking-tight text-white">{{ t('common.brand') }}</span>
          </div>
          <p class="text-sm text-slate-300">{{ t('appFooter.description') }}</p>
          <div class="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-slate-400">{{ t('appFooter.subscribe.title') }}</p>
            <div class="flex items-center gap-3">
              <input
                type="email"
                :placeholder="t('appFooter.subscribe.placeholder')"
                class="h-11 w-full flex-1 rounded-full border border-white/10 bg-white/10 px-4 text-sm text-white placeholder:text-slate-400 focus:border-primary-400 focus:outline-none"
              />
              <button type="button" class="h-11 rounded-full bg-primary-600 px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500">
                {{ t('appFooter.subscribe.cta') }}
              </button>
            </div>
          </div>
          <p class="text-xs text-slate-500">{{ t('appFooter.copyright', { year: new Date().getFullYear() }) }}</p>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-white">{{ t('appFooter.columns.product.title') }}</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-300">
            <li v-for="link in productLinks" :key="link.label">
              <a class="transition hover:text-white" :href="link.href">{{ link.label }}</a>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-white">{{ t('appFooter.columns.company.title') }}</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-300">
            <li v-for="link in companyLinks" :key="link.label">
              <a class="transition hover:text-white" :href="link.href">{{ link.label }}</a>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-white">{{ t('appFooter.columns.resources.title') }}</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-300">
            <li v-for="link in resourceLinks" :key="link.label">
              <a class="transition hover:text-white" :href="link.href">{{ link.label }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '../i18n';

const { t } = useI18n();

const productLinks = computed(() => t('appFooter.columns.product.links'));
const companyLinks = computed(() => t('appFooter.columns.company.links'));
const resourceLinks = computed(() => t('appFooter.columns.resources.links'));
</script>
