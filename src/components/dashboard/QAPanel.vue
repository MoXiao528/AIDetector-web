<template>
  <section class="rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-lg shadow-slate-200/60 backdrop-blur">
    <div class="flex flex-col gap-8">
      <header class="space-y-3">
        <p class="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
          {{ t('qaPanel.badge') }}
        </p>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('qaPanel.title') }}</h1>
        <p class="text-sm text-slate-500">
          {{ t('qaPanel.subtitle') }}
        </p>
        <div class="relative">
          <input
            v-model="search"
            type="search"
            :placeholder="t('qaPanel.searchPlaceholder')"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 pl-10 text-sm text-slate-700 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 7.5a7.5 7.5 0 010 9.15z" />
          </svg>
        </div>
      </header>
      <div class="grid gap-4">
        <article
          v-for="item in filteredFaqs"
          :key="item.id"
          class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <h2 class="text-base font-semibold text-slate-900">{{ item.question }}</h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ item.answer }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span v-for="tag in item.tags" :key="tag" class="rounded-full bg-slate-200/60 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              #{{ tag }}
            </span>
          </div>
        </article>
      </div>
      <footer class="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-sm text-slate-100 shadow-lg">
        <p class="font-semibold">{{ t('qaPanel.footer.title') }}</p>
        <p class="mt-2 text-slate-200">
          {{ t('qaPanel.footer.prefix') }}
          <a href="mailto:help@veritascribe.dev" class="text-primary-200 underline decoration-dotted">help@veritascribe.dev</a>
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
