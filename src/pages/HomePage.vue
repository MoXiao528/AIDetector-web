<template>
  <div class="min-h-screen bg-slate-50">
    <AppHeader mode="marketing" />
    <main>
      <HeroSection />
      <TrustIndicators />
      <CapabilitiesSection />
      <WorkflowSection />
      <section class="mx-auto mt-12 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between md:gap-10">
          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">{{ t('homePage.examples.badge') }}</p>
            <h3 class="text-xl font-semibold text-slate-900">{{ t('homePage.examples.title') }}</h3>
            <p class="text-sm text-slate-500">{{ t('homePage.examples.subtitle') }}</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-primary-200/50 transition hover:-translate-y-0.5 hover:bg-primary-500"
              @click="showUsageExamples = true"
            >
              <span class="text-lg">★</span>
              {{ t('homePage.examples.cta') }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-700"
              @click="$router.push({ name: 'dashboard', query: { panel: 'home' } })"
            >
              {{ t('homePage.examples.tryNow') }}
            </button>
          </div>
        </div>
      </section>
      <ShowcaseSection />
      <TestimonialsSection />
      <PricingPreview />
      <CallToAction />
    </main>
    <AppFooter />
    <UsageExamplesModal :open="showUsageExamples" :examples="usageExampleItems" @close="showUsageExamples = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from '../i18n';
import AppHeader from '../sections/AppHeader.vue';
import HeroSection from '../sections/HeroSection.vue';
import TrustIndicators from '../sections/TrustIndicators.vue';
import CapabilitiesSection from '../sections/CapabilitiesSection.vue';
import WorkflowSection from '../sections/WorkflowSection.vue';
import ShowcaseSection from '../sections/ShowcaseSection.vue';
import TestimonialsSection from '../sections/TestimonialsSection.vue';
import PricingPreview from '../sections/PricingPreview.vue';
import CallToAction from '../sections/CallToAction.vue';
import AppFooter from '../sections/AppFooter.vue';
import UsageExamplesModal from '../components/common/UsageExamplesModal.vue';
import { usageExamples as usageExampleItems } from '../utils/usageExamples';

const showUsageExamples = ref(false);
const { t } = useI18n();
</script>
