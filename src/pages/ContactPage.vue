<template>
  <div class="min-h-screen bg-slate-50">
    <AppHeader mode="dashboard" />
    <main class="mx-auto max-w-5xl px-4 py-10">
      <section class="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/60">
        <div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-4">
            <p class="inline-flex items-center rounded-full bg-primary-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">
              {{ t('contactPage.badge') }}
            </p>
            <h1 class="text-2xl font-semibold text-slate-900">{{ t('contactPage.title') }}</h1>
            <p class="max-w-2xl text-sm leading-7 text-slate-500">{{ t('contactPage.subtitle') }}</p>

            <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{{ t('contactPage.emailLabel') }}</p>
              <a
                :href="`mailto:${supportEmail}`"
                class="mt-3 inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {{ t('contactPage.emailCta') }}
              </a>
              <p class="mt-4 break-all text-sm font-semibold text-primary-600">{{ supportEmail }}</p>
              <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('contactPage.emailHint') }}</p>
            </div>
          </div>

          <div class="rounded-3xl bg-slate-50 p-6 text-sm text-slate-600">
            <p class="font-semibold text-slate-700">{{ t('contactPage.faq.title') }}</p>
            <ul class="mt-4 space-y-3 text-sm leading-6 text-slate-500">
              <li
                v-for="item in faqItems"
                :key="item"
                class="rounded-2xl border border-white bg-white px-4 py-3"
              >
                {{ item }}
              </li>
            </ul>

            <div class="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4">
              <p class="font-medium text-slate-700">{{ t('contactPage.reply.title') }}</p>
              <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('contactPage.reply.body') }}</p>
            </div>

            <div class="mt-6 rounded-2xl bg-white px-4 py-4 text-sm text-slate-600">
              <p class="font-medium text-slate-700">{{ t('contactPage.scope.title') }}</p>
              <p class="mt-2 leading-6 text-slate-500">{{ t('contactPage.scope.body') }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '../i18n';
import AppHeader from '../sections/AppHeader.vue';

const { t } = useI18n();
const supportEmail = 'help@repreguard.dev';
const faqItems = computed(() => t('contactPage.faq.items'));
</script>
