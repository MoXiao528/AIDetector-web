<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#eef3ef_0%,#f8faf7_100%)] text-slate-900">
    <AppHeader mode="auth" />
    <main class="relative isolate px-4 py-12 sm:px-6 lg:px-8">
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary-200/35 blur-3xl"></div>
        <div class="absolute -left-16 top-32 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl"></div>
        <div class="absolute bottom-0 right-0 h-[28rem] w-[28rem] translate-x-1/3 rounded-full bg-emerald-100/35 blur-3xl"></div>
      </div>

      <div class="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section class="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(148,190,206,0.16),transparent_42%),linear-gradient(180deg,#31424d_0%,#263844_100%)] p-8 text-white shadow-xl shadow-slate-300/35">
          <div class="absolute right-0 top-0 h-52 w-52 rounded-full bg-white/8 blur-3xl"></div>
          <div class="relative z-10">
            <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
              <span class="flex h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>{{ loginSideCopy.badge }}</span>
            </div>
            <div class="mt-8">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-semibold text-white shadow-lg shadow-slate-950/20">
                {{ t('common.brandInitial') }}
              </div>
              <p class="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">RepreGuard</p>
              <h1 class="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-white lg:text-5xl">{{ loginSideCopy.title }}</h1>
              <p class="mt-4 max-w-2xl text-base leading-7 text-slate-300">{{ loginSideCopy.subtitle }}</p>
            </div>

            <div class="mt-8 grid gap-5 sm:grid-cols-3">
              <div
                v-for="item in loginMetricItems"
                :key="item.label"
                class="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ item.label }}</p>
                <p class="mt-3 text-2xl font-semibold tracking-tight text-white">{{ item.value }}</p>
                <p class="mt-3 text-xs leading-5 text-slate-400">{{ item.description }}</p>
              </div>
            </div>

            <div class="mt-8 space-y-3">
              <div
                v-for="item in loginFeatureItems"
                :key="item.title"
                class="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur"
              >
                <div class="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                  <component :is="item.icon" class="h-5 w-5" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-white">{{ item.title }}</p>
                  <p class="mt-1 text-sm leading-6 text-slate-300">{{ item.description }}</p>
                </div>
              </div>
            </div>

            <div class="mt-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ t('auth.login.notice.title') }}</p>
              <p class="mt-3 text-sm leading-6 text-slate-300">{{ t('auth.login.notice.body') }}</p>
            </div>
          </div>
        </section>

        <section class="rounded-[2rem] border border-slate-200/70 bg-[#fbfcfa]/95 p-8 shadow-xl shadow-slate-200/80 backdrop-blur">
          <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
            <ShieldCheckIcon class="h-4 w-4 text-primary-500" />
            <span>{{ loginSideCopy.formBadge }}</span>
          </div>
          <h2 class="mt-6 text-3xl font-semibold tracking-tight text-slate-950">{{ t('auth.login.title') }}</h2>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('auth.login.subtitle') }}</p>

          <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
            <div class="space-y-1.5">
              <label for="identifier" class="block text-sm font-medium text-slate-700">{{ t('auth.login.identifier') }}</label>
              <input
                id="identifier"
                v-model="form.identifier"
                type="text"
                required
                :placeholder="t('auth.login.placeholder')"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div class="space-y-1.5">
              <label for="password" class="block text-sm font-medium text-slate-700">{{ t('auth.login.password') }}</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                :placeholder="t('auth.login.passwordPlaceholder')"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <p v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600">{{ error }}</p>

            <button
              type="submit"
              class="flex w-full items-center justify-center rounded-2xl bg-[#314650] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300/40 transition hover:-translate-y-0.5 hover:bg-[#2b3e47]"
            >
              {{ t('auth.login.submit') }}
            </button>

            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-[#fdfefd] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600"
              @click="goGuestWorkspace"
            >
              <span>{{ loginSideCopy.guestCta }}</span>
              <ArrowRightIcon class="h-4 w-4" />
            </button>
          </form>

          <p class="mt-6 text-center text-xs text-slate-500">
            {{ t('auth.login.noAccount') }}
            <RouterLink to="/register" class="font-semibold text-primary-600 hover:text-primary-500">{{ t('auth.login.register') }}</RouterLink>
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowRightIcon, ClockIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/vue/24/outline';
import AppHeader from '../sections/AppHeader.vue';
import { extractApiErrorCode } from '../api/client';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();

const form = reactive({
  identifier: '',
  password: '',
});

const error = ref('');

const loginSideCopy = computed(() =>
  locale.value === 'zh-CN'
    ? {
        badge: '受保护的工作台入口',
        title: '登录后继续你的检测、审阅与留痕流程。',
        subtitle: '这一页不该只是个表单。RepreGuard 会把你的扫描历史、每日额度和审阅节奏接回同一个工作台。',
        formBadge: '安全登录',
        guestCta: '先以访客进入工作台',
        metrics: [
          { label: '历史同步', value: '实时', description: '登录后自动拉取历史检测记录' },
          { label: '额度状态', value: '每日刷新', description: '访客与账户额度分层管理' },
          { label: '审阅路径', value: '单页闭环', description: '输入、扫描、导出在同一界面完成' },
        ],
        highlights: [
          { title: '同步你的历史记录', description: '继续上次的扫描，不用重新整理草稿。' },
          { title: '把额度状态说清楚', description: '剩余额度、计划类型和扫描进度都在进工作台前明确展示。' },
          { title: '保留访客试用路径', description: '先试，再决定是否登录，不再一上来就把人挡在门外。' },
        ],
        errors: {
          invalidCredentials: '账号或密码错误，请重新输入。',
          rateLimited: '尝试次数过多，请稍后再试。',
          fallback: '登录失败，请稍后再试。',
        },
      }
    : {
        badge: 'Protected workspace access',
        title: 'Sign in and resume detection, review, and audit work.',
        subtitle: 'This page should do more than collect credentials. RepreGuard brings your history, quota state, and review rhythm back into one workspace.',
        formBadge: 'Secure sign-in',
        guestCta: 'Enter the workspace as a guest',
        metrics: [
          { label: 'History sync', value: 'Live', description: 'Pull recent detections back in as soon as you log in' },
          { label: 'Quota state', value: 'Daily reset', description: 'Guest and account quotas are managed separately' },
          { label: 'Review flow', value: 'Single surface', description: 'Draft, scan, and export from one view' },
        ],
        highlights: [
          { title: 'Resume prior scans', description: 'Pick up where you left off without rebuilding the draft context.' },
          { title: 'See quota state clearly', description: 'Remaining allowance, plan state, and scan progress are visible before you enter.' },
          { title: 'Keep a real guest path', description: 'Let users try the workspace first instead of blocking them with auth immediately.' },
        ],
        errors: {
          invalidCredentials: 'Incorrect account or password. Please try again.',
          rateLimited: 'Too many attempts. Please try again later.',
          fallback: 'Login failed. Please try again later.',
        },
      }
);

const featureIcons = [ShieldCheckIcon, ClockIcon, SparklesIcon];

const loginMetricItems = computed(() => loginSideCopy.value.metrics);
const loginFeatureItems = computed(() =>
  loginSideCopy.value.highlights.map((item, index) => ({
    ...item,
    icon: featureIcons[index % featureIcons.length],
  }))
);

const goGuestWorkspace = () => {
  router.push({ name: 'dashboard', query: { panel: 'document' } });
};

const handleSubmit = async () => {
  error.value = '';
  if (!form.identifier || !form.password) {
    error.value = t('auth.login.errors.missing');
    return;
  }
  try {
    await authStore.login({ identifier: form.identifier, password: form.password });
    const redirectFromQuery = typeof route.query.redirect === 'string' ? route.query.redirect : '';
    const shouldPreferAdminHome =
      authStore.isSysAdmin &&
      (!redirectFromQuery ||
        ['/dashboard', '/scan', '/profile'].some(
          (path) => redirectFromQuery === path || redirectFromQuery.startsWith(`${path}?`)
        ));
    const redirectTo = shouldPreferAdminHome ? '/admin/overview' : redirectFromQuery || '/dashboard';
    router.push(redirectTo);
  } catch (err) {
    const code = extractApiErrorCode(err);
    if (code === 'AUTH_INVALID_CREDENTIALS' || code === 'AUTH_USER_NOT_FOUND' || code === 'AUTH_INVALID_PASSWORD') {
      error.value = loginSideCopy.value.errors.invalidCredentials;
    } else if (code === 'AUTH_RATE_LIMITED') {
      error.value = loginSideCopy.value.errors.rateLimited;
    } else {
      error.value = err?.message || loginSideCopy.value.errors.fallback;
    }
  }
};
</script>
