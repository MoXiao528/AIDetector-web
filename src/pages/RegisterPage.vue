<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#eef3ef_0%,#f8faf7_100%)] text-slate-900">
    <AppHeader mode="auth" />
    <main class="relative isolate px-4 py-12 sm:px-6 lg:px-8">
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary-200/35 blur-3xl"></div>
        <div class="absolute -left-16 top-32 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl"></div>
        <div class="absolute bottom-0 right-0 h-[28rem] w-[28rem] translate-x-1/3 rounded-full bg-emerald-100/35 blur-3xl"></div>
      </div>

      <div class="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section class="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(165,209,193,0.18),transparent_42%),linear-gradient(180deg,#32434a_0%,#273842_100%)] p-8 text-white shadow-xl shadow-slate-300/35">
          <div class="absolute right-0 top-0 h-52 w-52 rounded-full bg-white/8 blur-3xl"></div>
          <div class="relative z-10">
            <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
              <span class="flex h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>{{ registerSideCopy.badge }}</span>
            </div>
            <div class="mt-8">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-semibold text-white shadow-lg shadow-slate-950/20">
                {{ t('common.brandInitial') }}
              </div>
              <p class="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">RepreGuard</p>
              <h1 class="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-white lg:text-5xl">{{ registerSideCopy.title }}</h1>
              <p class="mt-4 max-w-2xl text-base leading-7 text-slate-300">{{ registerSideCopy.subtitle }}</p>
            </div>

            <div class="mt-8 grid gap-4 sm:grid-cols-3">
              <div
                v-for="item in registerMetricItems"
                :key="item.label"
                class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ item.label }}</p>
                <p class="mt-3 font-semibold text-white" :class="registerMetricValueClass(item.value)">{{ item.value }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ item.description }}</p>
              </div>
            </div>

            <div class="mt-8 space-y-3">
              <div
                v-for="item in registerFeatureItems"
                :key="item.title"
                class="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur"
              >
                <div class="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
                  <component :is="item.icon" class="h-5 w-5" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-white">{{ item.title }}</p>
                  <p class="mt-1 text-sm leading-6 text-slate-300">{{ item.description }}</p>
                </div>
              </div>
            </div>

            <div class="mt-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ t('auth.register.notice.title') }}</p>
              <p class="mt-3 text-sm leading-6 text-slate-300">{{ t('auth.register.notice.body') }}</p>
            </div>
          </div>
        </section>

        <section class="rounded-[2rem] border border-slate-200/70 bg-[#fbfcfa]/95 p-8 shadow-xl shadow-slate-200/80 backdrop-blur">
          <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
            <ShieldCheckIcon class="h-4 w-4 text-emerald-500" />
            <span>{{ registerSideCopy.formBadge }}</span>
          </div>
          <h2 class="mt-6 text-3xl font-semibold tracking-tight text-slate-950">{{ t('auth.register.title') }}</h2>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('auth.register.subtitle') }}</p>

          <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
            <div class="space-y-1.5">
              <label for="name" class="block text-sm font-medium text-slate-700">{{ t('auth.register.name') }}</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                :placeholder="t('auth.register.placeholderName')"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p class="text-xs text-slate-500">{{ registerSideCopy.nameHint }}</p>
            </div>

            <div class="space-y-1.5">
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

            <div class="space-y-1.5">
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

            <div class="space-y-1.5">
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
              class="flex w-full items-center justify-center rounded-2xl bg-[#314650] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300/40 transition hover:-translate-y-0.5 hover:bg-[#2b3e47]"
            >
              {{ t('auth.register.submit') }}
            </button>

            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-[#fdfefd] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600"
              @click="goGuestWorkspace"
            >
              <span>{{ registerSideCopy.guestCta }}</span>
              <ArrowRightIcon class="h-4 w-4" />
            </button>
          </form>

          <p class="mt-6 text-center text-xs text-slate-500">
            {{ t('auth.register.haveAccount') }}
            <RouterLink to="/login" class="font-semibold text-primary-600 hover:text-primary-500">{{ t('auth.register.login') }}</RouterLink>
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/vue/24/outline';
import AppHeader from '../sections/AppHeader.vue';
import { extractApiErrorCode } from '../api/client';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirm: '',
});

const error = ref('');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerSideCopy = computed(() =>
  locale.value === 'zh-CN'
    ? {
        badge: '创建审计账号',
        title: '把试用体验，变成可追踪、可同步、可留痕的正式工作台。',
        subtitle: '注册后就不只是“能扫一下”。你的额度、历史记录、后续协作入口都会开始成形。',
        formBadge: '创建账号',
        guestCta: '先体验工作台',
        nameHint: '可选，用于展示名称；登录仍使用邮箱。',
        metrics: [
          { label: '试用额度', value: '注册即开', description: '创建账号后立即进入可用状态' },
          { label: '历史保存', value: '自动', description: '后续扫描结果可回看、可同步' },
          { label: '扩展能力', value: '逐步接入', description: '后续可继续接多文件、API 与团队流程' },
        ],
        highlights: [
          { title: '先把基础链路跑通', description: '从文本输入、扫描、结果回看，到后续报告导出，形成完整闭环。' },
          { title: '为后续协作留接口', description: '你现在注册的不是孤立账号，而是后面接团队与合规能力的入口。' },
          { title: '保留访客模式', description: '如果你只是想先看界面和工作流，也能不注册直接进工作台。' },
        ],
        errors: {
          email: '请输入有效的邮箱地址。',
          passwordMismatch: '两次密码不一致。',
          emailExists: '该邮箱已注册，请直接登录。',
          nameExists: '该用户账号已存在，请换一个。',
          rateLimited: '注册尝试过于频繁，请稍后再试。',
        },
      }
    : {
        badge: 'Create an audit account',
        title: 'Turn a quick trial into a tracked, synced, reviewable workspace.',
        subtitle: 'After signup, this stops being a disposable demo. Quotas, saved history, and future collaboration hooks start to matter.',
        formBadge: 'Create account',
        guestCta: 'Try the workspace first',
        nameHint: 'Optional display name. You still sign in with email.',
        metrics: [
          { label: 'Trial quota', value: 'Active instantly', description: 'Your account becomes usable as soon as it is created' },
          { label: 'History', value: 'Auto-saved', description: 'Future scan results can be reopened and synced' },
          { label: 'Extensions', value: 'Ready to grow', description: 'Multi-file, API, and team workflows can layer on later' },
        ],
        highlights: [
          { title: 'Start with a real base workflow', description: 'From draft input to scan review and later export, the whole path is ready to harden.' },
          { title: 'Leave room for collaboration', description: 'You are not creating an isolated account; you are creating the base for team and compliance workflows.' },
          { title: 'Keep the guest path intact', description: 'If you only want to inspect the experience first, you can still enter without registering.' },
        ],
        errors: {
          email: 'Please enter a valid email address.',
          passwordMismatch: 'The passwords do not match.',
          emailExists: 'This email is already registered. Please sign in instead.',
          nameExists: 'This username is already taken. Please choose another one.',
          rateLimited: 'Too many signup attempts. Please try again later.',
        },
      }
);

const featureIcons = [ShieldCheckIcon, ArrowPathIcon, SparklesIcon];

const registerMetricItems = computed(() => registerSideCopy.value.metrics);
const registerFeatureItems = computed(() =>
  registerSideCopy.value.highlights.map((item, index) => ({
    ...item,
    icon: featureIcons[index % featureIcons.length],
  }))
);
const registerMetricValueClass = (value = '') =>
  String(value).length > 12
    ? 'text-lg leading-tight break-words sm:text-xl'
    : 'text-2xl tracking-tight';

const goGuestWorkspace = () => {
  router.push({ name: 'dashboard', query: { panel: 'document' } });
};

const handleSubmit = async () => {
  error.value = '';
  if (!form.email || !form.password || !form.confirm) {
    error.value = t('auth.register.errors.missing');
    return;
  }
  if (!emailPattern.test(form.email)) {
    error.value = registerSideCopy.value.errors.email;
    return;
  }
  if (form.password !== form.confirm) {
    error.value = registerSideCopy.value.errors.passwordMismatch;
    return;
  }
  try {
    const payload = { email: form.email, password: form.password };
    if (form.name?.trim()) {
      payload.name = form.name.trim();
    }
    await authStore.register(payload);
    const redirectTo = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard?panel=document';
    router.push(redirectTo);
  } catch (err) {
    const code = extractApiErrorCode(err);
    if (code === 'AUTH_EMAIL_EXISTS') {
      error.value = registerSideCopy.value.errors.emailExists;
    } else if (code === 'AUTH_NAME_EXISTS') {
      error.value = registerSideCopy.value.errors.nameExists;
    } else if (code === 'AUTH_RATE_LIMITED') {
      error.value = registerSideCopy.value.errors.rateLimited;
    } else {
      error.value = err?.message || t('auth.register.errors.failed');
    }
    if (err?.code === 'LOGIN_FAILED') {
      router.push('/login');
    }
  }
};
</script>
