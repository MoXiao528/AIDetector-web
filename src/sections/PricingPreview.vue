<template>
  <section id="pricing" class="py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <h2 class="section-title">{{ t('pricingPreview.title') }}</h2>
        <p class="section-subtitle">
          {{ t('pricingPreview.subtitle') }}
        </p>
      </div>
      <div class="mt-16 grid gap-6 lg:grid-cols-3">
        <article
          v-for="plan in plans"
          :key="plan.name"
          class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          :class="plan.popular ? 'ring-2 ring-primary-500' : ''"
        >
          <div v-if="plan.popular" class="absolute right-6 top-6 rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
            {{ t('pricingPreview.badge') }}
          </div>
          <div class="relative flex h-full flex-col justify-between">
            <div>
              <h3 class="text-xl font-semibold text-slate-900">{{ plan.name }}</h3>
              <p class="mt-3 text-sm text-slate-600">{{ plan.description }}</p>
              <p class="mt-6 text-3xl font-bold text-slate-900">
                {{ plan.price }}
                <span class="text-base font-medium text-slate-500">{{ t('pricingPreview.period') }}</span>
              </p>
              <ul class="mt-6 space-y-3 text-sm text-slate-600">
                <li v-for="feature in plan.features" :key="feature" class="flex items-start space-x-2">
                  <svg class="mt-1 h-4 w-4 flex-none text-primary-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              class="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              @click="openPricing"
            >
              {{ t('pricingPreview.cta') }}
            </button>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '../i18n';

const router = useRouter();
const { t } = useI18n();

const openPricing = () => {
  router.push({ name: 'pricing' });
};

const plans = computed(() => [
  {
    name: t('pricingPreview.plans.creator.name'),
    description: t('pricingPreview.plans.creator.description'),
    price: t('pricingPreview.plans.creator.price'),
    popular: false,
    features: t('pricingPreview.plans.creator.features'),
  },
  {
    name: t('pricingPreview.plans.team.name'),
    description: t('pricingPreview.plans.team.description'),
    price: t('pricingPreview.plans.team.price'),
    popular: true,
    features: t('pricingPreview.plans.team.features'),
  },
  {
    name: t('pricingPreview.plans.enterprise.name'),
    description: t('pricingPreview.plans.enterprise.description'),
    price: t('pricingPreview.plans.enterprise.price'),
    popular: false,
    features: t('pricingPreview.plans.enterprise.features'),
  },
]);
</script>
