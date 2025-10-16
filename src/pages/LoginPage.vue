<template>
  <div class="min-h-screen bg-slate-950 text-white">
    <AppHeader />
    <main class="flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <div class="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.65)] backdrop-blur">
        <div class="space-y-2 text-center">
          <h1 class="text-3xl font-semibold">欢迎回来</h1>
          <p class="text-sm text-white/60">登录后即可使用检测、润色、翻译等全部功能。</p>
        </div>
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div class="space-y-1">
            <label for="email" class="block text-sm font-medium text-white/80">邮箱</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="name@company.com"
              class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300/40"
            />
          </div>
          <div class="space-y-1">
            <label for="password" class="block text-sm font-medium text-white/80">密码</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              placeholder="至少 8 位字符"
              class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300/40"
            />
          </div>
          <p v-if="error" class="rounded-2xl bg-rose-500/10 px-4 py-3 text-xs text-rose-200">{{ error }}</p>
          <button
            type="submit"
            class="flex w-full items-center justify-center rounded-2xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-400"
          >
            登录并进入仪表盘
          </button>
        </form>
        <p class="text-center text-xs text-white/50">
          还没有账号？
          <RouterLink to="/register" class="font-semibold text-primary-200 hover:text-primary-100">立即注册</RouterLink>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '../sections/AppHeader.vue';
import { useAuthStore } from '../store/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({
  email: '',
  password: '',
});

const error = ref('');

const handleSubmit = () => {
  error.value = '';
  if (!form.email || !form.password) {
    error.value = '请填写邮箱和密码。';
    return;
  }
  authStore.login({ email: form.email });
  const redirectTo = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
  router.push(redirectTo);
};
</script>
