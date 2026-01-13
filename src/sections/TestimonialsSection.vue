<template>
  <section class="py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-3xl">
          <h2 class="section-title">{{ t('testimonialsSection.title') }}</h2>
          <p class="section-subtitle">
            {{ t('testimonialsSection.subtitle') }}
          </p>
        </div>
        <div class="flex items-center space-x-2 text-sm text-slate-500">
          <span class="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>{{ t('testimonialsSection.badge') }}</span>
        </div>
      </div>
      <div class="mt-12 columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3">
        <article
          v-for="testimonial in testimonials"
          :key="testimonial.author"
          class="break-inside-avoid rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div>
            <p class="text-sm text-slate-600">“{{ testimonial.quote }}”</p>
          </div>
          <div class="mt-8 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ testimonial.author }}</p>
              <p class="text-xs text-slate-500">{{ testimonial.role }}</p>
            </div>
            <div class="text-right text-xs text-primary-600">
              <p>{{ testimonial.metric }}</p>
              <p class="text-slate-400">{{ testimonial.context }}</p>
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

const testimonials = computed(() => [
  {
    quote: t('testimonialsSection.items.first.quote'),
    author: t('testimonialsSection.items.first.author'),
    role: t('testimonialsSection.items.first.role'),
    metric: t('testimonialsSection.items.first.metric'),
    context: t('testimonialsSection.items.first.context'),
  },
  {
    quote: t('testimonialsSection.items.second.quote'),
    author: t('testimonialsSection.items.second.author'),
    role: t('testimonialsSection.items.second.role'),
    metric: t('testimonialsSection.items.second.metric'),
    context: t('testimonialsSection.items.second.context'),
  },
  {
    quote: t('testimonialsSection.items.third.quote'),
    author: t('testimonialsSection.items.third.author'),
    role: t('testimonialsSection.items.third.role'),
    metric: t('testimonialsSection.items.third.metric'),
    context: t('testimonialsSection.items.third.context'),
  },
]);
</script>
