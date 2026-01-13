<template>
  <section class="py-16">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <p class="text-center text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">{{ t('trustIndicators.title') }}</p>
      <div class="mt-10 grid grid-cols-2 gap-6 text-center text-slate-500 sm:grid-cols-3 lg:grid-cols-6">
        <div
          v-for="logo in logos"
          :key="logo"
          class="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs font-medium uppercase tracking-wide opacity-40 grayscale transition hover:opacity-100 hover:grayscale-0"
        >
          {{ logo }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '../i18n';

const { t } = useI18n();
const logos = computed(() => t('trustIndicators.logos'));
</script>
