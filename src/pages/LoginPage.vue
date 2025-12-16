<template>
  <div class="min-h-screen bg-slate-950 text-white">
    <AppHeader mode="auth" />
    <main class="flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <div class="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.65)] backdrop-blur">
        <div class="space-y-2 text-center">
          <h1 class="text-3xl font-semibold">{{ t('auth.login.title') }}</h1>
          <p class="text-sm text-white/60">{{ t('auth.login.subtitle') }}</p>
        </div>
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div class="space-y-1">
            <label for="identifier" class="block text-sm font-medium text-white/80">{{ t('auth.login.identifier') }}</label>
            <input
              id="identifier"
              v-model="form.identifier"
              type="text"
              required
              :placeholder="t('auth.login.placeholder')"
              class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300/40"
            />
          </div>
          <div class="space-y-1">
            <label for="password" class="block text-sm font-medium text-white/80">{{ t('auth.login.password') }}</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              :placeholder="t('auth.login.passwordPlaceholder')"
              class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300/40"
            />
          </div>
          <p v-if="error" class="rounded-2xl bg-rose-500/10 px-4 py-3 text-xs text-rose-200">{{ error }}</p>
          <button
            type="submit"
            class="flex w-full items-center justify-center rounded-2xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-400"
          >
            {{ t('auth.login.submit') }}
          </button>
        </form>
        <p class="text-center text-xs text-white/50">
          {{ t('auth.login.noAccount') }}
          <RouterLink to="/register" class="font-semibold text-primary-200 hover:text-primary-100">{{ t('auth.login.register') }}</RouterLink>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '../sections/AppHeader.vue';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const form = reactive({
  identifier: '',
  password: '',
});

const error = ref('');

const handleSubmit = () => {
  error.value = '';
  if (!form.identifier || !form.password) {
    error.value = t('auth.login.errors.missing');
    return;
  }
  try {
    authStore.login({ identifier: form.identifier, password: form.password });
    const redirectTo =
      typeof route.query.redirect === 'string' && route.query.redirect ? route.query.redirect : '/dashboard';
    router.push(redirectTo);
  } catch (err) {
    error.value = err?.message || t('auth.login.errors.failed');
  }
};
</script>
