<template>
  <div class="min-h-screen bg-slate-50">
    <AppHeader mode="dashboard" />
    <main class="mx-auto max-w-5xl px-4 py-10">
      <section class="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/60">
        <div class="flex flex-col gap-6 lg:flex-row">
          <div class="flex-1 space-y-4">
            <p class="inline-flex items-center rounded-full bg-primary-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">
              {{ t('contactPage.badge') }}
            </p>
            <h1 class="text-2xl font-semibold text-slate-900">{{ t('contactPage.title') }}</h1>
            <p class="text-sm text-slate-500">
              {{ t('contactPage.subtitle') }}
              <a href="mailto:support@veritascribe.dev" class="font-semibold text-primary-600">support@veritascribe.dev</a>
              {{ t('contactPage.subtitleSuffix') }}
            </p>
            <div class="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              <p class="font-semibold text-slate-700">{{ t('contactPage.faq.title') }}</p>
              <ul class="mt-3 space-y-2 text-xs text-slate-500">
                <li v-for="item in faqItems" :key="item">· {{ item }}</li>
              </ul>
              <RouterLink
                to="/qa"
                class="mt-3 inline-flex items-center text-xs font-semibold text-primary-600 hover:text-primary-500"
              >
                {{ t('contactPage.faq.cta') }}
              </RouterLink>
            </div>
          </div>
          <form class="flex-1 space-y-4" @submit.prevent="submitForm">
            <div>
              <label class="text-sm font-semibold text-slate-700" for="contact-name">{{ t('contactPage.form.name') }}</label>
              <input
                id="contact-name"
                v-model="form.name"
                type="text"
                required
                class="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-700" for="contact-email">{{ t('contactPage.form.email') }}</label>
              <input
                id="contact-email"
                v-model="form.email"
                type="email"
                required
                class="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-700" for="contact-topic">{{ t('contactPage.form.topic') }}</label>
              <BaseListbox
                button-id="contact-topic"
                v-model="form.topic"
                :options="topicOptions"
                :aria-label="t('contactPage.form.topic')"
                button-class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-700" for="contact-message">{{ t('contactPage.form.message') }}</label>
              <textarea
                id="contact-message"
                v-model="form.message"
                rows="5"
                required
                class="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
              ></textarea>
            </div>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <svg
                v-if="isSubmitting"
                class="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              {{ t('contactPage.form.submit') }}
            </button>
            <p v-if="feedback" :class="['text-sm', feedback.type === 'success' ? 'text-emerald-600' : 'text-rose-500']">
              {{ feedback.message }}
            </p>
          </form>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useI18n } from '../i18n';
import BaseListbox from '../components/common/BaseListbox.vue';
import AppHeader from '../sections/AppHeader.vue';

const { t } = useI18n();

const form = reactive({
  name: '',
  email: '',
  topic: 'product',
  message: '',
});

const isSubmitting = ref(false);
const feedback = ref(null);

const topicOptions = computed(() => [
  { value: 'product', label: t('contactPage.topics.product') },
  { value: 'support', label: t('contactPage.topics.support') },
  { value: 'partnership', label: t('contactPage.topics.partnership') },
  { value: 'other', label: t('contactPage.topics.other') },
]);

const faqItems = computed(() => t('contactPage.faq.items'));

const submitForm = async () => {
  feedback.value = null;
  isSubmitting.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 600));
    feedback.value = { type: 'success', message: t('contactPage.feedback.success') };
    form.name = '';
    form.email = '';
    form.topic = 'product';
    form.message = '';
  } catch (error) {
    feedback.value = { type: 'error', message: t('contactPage.feedback.error') };
  } finally {
    isSubmitting.value = false;
  }
};
</script>
