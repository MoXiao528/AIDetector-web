<template>
  <div class="public-theme min-h-screen">
    <AppHeader mode="marketing" />
    <main>
      <HeroSection v-model="localInput" @scan="handleScan" />
      <CapabilitiesSection />
      <WorkflowSection />
      <section class="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-6 rounded-2xl border border-primary-200/80 bg-primary-100/60 p-6 md:flex-row md:items-center md:justify-between md:gap-10 sm:p-8">
          <div class="space-y-2">
            <p class="text-xs font-semibold text-primary-700">{{ t('homePage.examples.badge') }}</p>
            <h3 class="text-xl font-semibold text-slate-900">{{ t('homePage.examples.title') }}</h3>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="primary-action liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold"
              @click="showUsageExamples = true"
            >
              <DocumentTextIcon class="h-4 w-4" aria-hidden="true" />
              {{ t('homePage.examples.cta') }}
            </button>
            <button
              type="button"
              class="liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold"
              @click="$router.push({ name: 'dashboard', query: { panel: 'home' } })"
            >
              {{ t('homePage.examples.tryNow') }}
            </button>
          </div>
        </div>
      </section>
      <ShowcaseSection />
    </main>
    <AppFooter compact />
    <UsageExamplesModal :open="showUsageExamples" :examples="detectionExamples" @close="showUsageExamples = false" @try-own="focusOwnText" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { DocumentTextIcon } from '@heroicons/vue/24/outline';
import { useI18n } from '../i18n';
import AppHeader from '../sections/AppHeader.vue';
import HeroSection from '../sections/HeroSection.vue';
import CapabilitiesSection from '../sections/CapabilitiesSection.vue';
import WorkflowSection from '../sections/WorkflowSection.vue';
import ShowcaseSection from '../sections/ShowcaseSection.vue';
import AppFooter from '../sections/AppFooter.vue';
import UsageExamplesModal from '../components/common/UsageExamplesModal.vue';
import detectionExamples from '../data/detectionExamples.json';
import { useScanStore } from '../store/scan';
import { showToast } from '../utils/toast';

const router = useRouter();
const scanStore = useScanStore();
const showUsageExamples = ref(false);
const localInput = computed({
  get: () => scanStore.inputText || '',
  set: (value) => scanStore.setInputText(value),
});
const { t, locale } = useI18n();
const focusOwnText = () => {
  const input = document.getElementById('hero-text-input');
  input?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  input?.focus({ preventScroll: true });
};

watch(
  () => locale.value,
  (value) => {
    scanStore.loadExamples(value);
  },
  { immediate: true }
);

const handleScan = () => {
  const text = localInput.value;
  if (!text || !text.trim()) {
    showToast({
      title: t('common.brand'),
      message: t('scan.loginPrompt.inputFirst'),
    });
    return;
  }
  scanStore.setInputText(text);
  scanStore.resetResult();
  router.push({ name: 'dashboard', query: { panel: 'document' } });
};
</script>
