<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <AppHeader mode="auth" />
    <main class="relative flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-200/50 blur-3xl"></div>
        <div class="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-emerald-200/40 blur-3xl"></div>
      </div>
      <div class="relative w-full max-w-4xl">
        <div class="grid gap-8 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-slate-200/60 backdrop-blur md:grid-cols-[1.1fr_1fr]">
          <div class="flex flex-col justify-between gap-6">
            <div>
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-xl font-semibold text-white">
                {{ t('common.brandInitial') }}
              </div>
              <h1 class="mt-6 text-3xl font-semibold">{{ t('auth.register.title') }}</h1>
              <p class="mt-2 text-sm text-slate-500">{{ t('auth.register.subtitle') }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-500">
              <p class="font-semibold text-slate-700">{{ t('auth.register.notice.title') }}</p>
              <p class="mt-2">{{ t('auth.register.notice.body') }}</p>
            </div>
          </div>
          <div>
            <form class="space-y-5" @submit.prevent="handleSubmit">
              <div class="space-y-1">
                <label for="name" class="block text-sm font-medium text-slate-700">{{ t('auth.register.name') }}</label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  required
                  :placeholder="t('auth.register.placeholderName')"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div class="space-y-1">
                <label for="email" class="block text-sm font-medium text-slate-700">{{ t('auth.register.email') }}</label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  required
                  :placeholder="t('auth.register.placeholderEmail')"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div class="space-y-1">
                <label for="password" class="block text-sm font-medium text-slate-700">{{ t('auth.register.password') }}</label>
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  required
                  minlength="8"
                  :placeholder="t('auth.register.placeholderPassword')"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div class="space-y-1">
                <label for="confirm" class="block text-sm font-medium text-slate-700">{{ t('auth.register.confirm') }}</label>
                <input
                  id="confirm"
                  v-model="form.confirm"
                  type="password"
                  required
                  :placeholder="t('auth.register.placeholderPassword')"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <p v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600">{{ error }}</p>
              <button
                type="submit"
                class="flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-200/60 transition hover:-translate-y-0.5 hover:bg-primary-500"
              >
                {{ t('auth.register.submit') }}
              </button>
            </form>
            <p class="mt-6 text-center text-xs text-slate-500">
              {{ t('auth.register.haveAccount') }}
              <RouterLink to="/login" class="font-semibold text-primary-600 hover:text-primary-500">{{ t('auth.register.login') }}</RouterLink>
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../sections/AppHeader.vue';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';

const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirm: '',
});

const error = ref('');

const handleSubmit = async () => {
  error.value = '';
  if (!form.name || !form.email || !form.password || !form.confirm) {
    error.value = t('auth.register.errors.missing');
    return;
  }
  if (form.password !== form.confirm) {
    error.value = t('auth.register.errors.failed');
    return;
  }
  try {
    await authStore.register({ name: form.name, email: form.email, password: form.password });
    router.push('/scan');
  } catch (err) {
    const message = err?.message || t('auth.register.errors.failed');
    error.value = message;
    if (err?.code === 'LOGIN_FAILED') {
      router.push('/login');
    }
  }
};
</script>
