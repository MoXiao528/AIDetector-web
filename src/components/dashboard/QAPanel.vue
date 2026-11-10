<template>
  <section class="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
    <div class="flex min-w-0 flex-col gap-6">
      <header class="space-y-3">
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('qaPanel.title') }}</h1>
        <p class="max-w-2xl text-sm leading-6 text-slate-600">
          {{ t('qaPanel.subtitle') }}
        </p>
        <div class="relative">
          <input
            v-model="search"
            type="search"
            :aria-label="t('qaPanel.searchPlaceholder')"
            :placeholder="t('qaPanel.searchPlaceholder')"
            class="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-base text-slate-800 transition-colors placeholder:text-slate-500 hover:border-primary-300 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 sm:text-sm"
          />
          <svg aria-hidden="true" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 7.5a7.5 7.5 0 010 9.15z" />
          </svg>
        </div>
      </header>
      <div class="divide-y divide-slate-200 border-t border-slate-200">
        <div v-if="!filteredFaqs.length" role="status" class="py-8 text-center">
          <h2 class="text-sm font-semibold text-slate-800">{{ t('qaPanel.emptyTitle') }}</h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">{{ t('qaPanel.emptyDescription') }}</p>
        </div>
        <article
          v-for="item in filteredFaqs"
          :key="item.id"
          class="py-5 [overflow-wrap:anywhere]"
        >
          <h2 class="text-base font-semibold leading-7 text-slate-900">{{ item.question }}</h2>
          <p class="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{{ item.answer }}</p>
        </article>
      </div>
      <footer class="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-4 text-sm">
        <p class="font-semibold text-primary-900">{{ t('qaPanel.footer.title') }}</p>
        <p class="mt-1 break-words leading-6 text-slate-600">
          {{ t('qaPanel.footer.prefix') }}
          <a href="mailto:mc55036@um.edu.mo" class="break-all font-medium text-primary-700 underline underline-offset-4 hover:text-primary-800">mc55036@um.edu.mo</a>
          {{ t('qaPanel.footer.suffix') }}
        </p>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from '../../i18n';

const search = ref('');
const { t } = useI18n();

const faqs = computed(() => t('qaPanel.faqs'));

const filteredFaqs = computed(() => {
  if (!search.value.trim()) return faqs.value;
  const term = search.value.trim().toLowerCase();
  return faqs.value.filter((item) => {
    const haystack = `${item.question} ${item.answer} ${item.tags.join(' ')}`.toLowerCase();
    return haystack.includes(term);
  });
});
</script>
