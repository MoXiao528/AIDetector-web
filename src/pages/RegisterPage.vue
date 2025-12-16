<template>
  <div class="min-h-screen bg-slate-950 text-white">
    <AppHeader mode="auth" />
    <main class="flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <div class="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.65)] backdrop-blur">
        <div class="space-y-2 text-center">
          <h1 class="text-3xl font-semibold">{{ t('auth.register.title') }}</h1>
          <p class="text-sm text-white/60">{{ t('auth.register.subtitle') }}</p>
        </div>
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div class="space-y-1">
            <label for="name" class="block text-sm font-medium text-white/80">{{ t('auth.register.name') }}</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              :placeholder="t('auth.register.placeholderName')"
              class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300/40"
            />
          </div>
          <div class="space-y-1">
            <label for="email" class="block text-sm font-medium text-white/80">{{ t('auth.register.email') }}</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              :placeholder="t('auth.register.placeholderEmail')"
              class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300/40"
            />
          </div>
          <div class="space-y-1">
            <label for="password" class="block text-sm font-medium text-white/80">{{ t('auth.register.password') }}</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              minlength="8"
              :placeholder="t('auth.register.placeholderPassword')"
              class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300/40"
            />
          </div>
          <div class="space-y-1">
            <label for="confirm" class="block text-sm font-medium text-white/80">{{ t('auth.register.confirm') }}</label>
            <input
              id="confirm"
              v-model="form.confirm"
              type="password"
              required
              :placeholder="t('auth.register.placeholderPassword')"
              class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300/40"
            />
          </div>
          <p v-if="error" class="rounded-2xl bg-rose-500/10 px-4 py-3 text-xs text-rose-200">{{ error }}</p>
          <button
            type="submit"
            class="flex w-full items-center justify-center rounded-2xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-400"
          >
            {{ t('auth.register.submit') }}
          </button>
        </form>
        <p class="text-center text-xs text-white/50">
          {{ t('auth.register.haveAccount') }}
          <RouterLink to="/login" class="font-semibold text-primary-200 hover:text-primary-100">{{ t('auth.register.login') }}</RouterLink>
        </p>
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

const handleSubmit = () => {
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
    authStore.register({ name: form.name, email: form.email, password: form.password });
    router.push('/dashboard');
  } catch (err) {
    error.value = err?.message || t('auth.register.errors.failed');
  }
};
</script>
