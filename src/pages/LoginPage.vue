<template>
  <div class="public-theme auth-page min-h-screen">
    <AppHeader mode="auth" />
    <main class="auth-main px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div class="auth-layout mx-auto grid w-full max-w-[1080px] gap-5 lg:grid-cols-2 lg:gap-8">
        <section class="auth-form-panel" aria-labelledby="auth-title">
          <h1 id="auth-title" class="text-3xl font-semibold tracking-tight text-slate-950">{{ t('auth.login.title') }}</h1>
          <p class="mt-3 text-sm leading-6 text-slate-600">{{ t('auth.login.subtitle') }}</p>
          <form class="mt-7 space-y-5" :aria-busy="isSubmitting" @submit.prevent="handleSubmit">
            <div class="auth-field">
              <label for="identifier">{{ t('auth.login.identifier') }}</label>
              <input id="identifier" v-model="form.identifier" name="username" type="text" autocomplete="username" required :placeholder="t('auth.login.placeholder')" />
            </div>
            <div class="auth-field">
              <label for="password">{{ t('auth.login.password') }}</label>
              <input id="password" v-model="form.password" name="password" type="password" autocomplete="current-password" required :placeholder="t('auth.login.passwordPlaceholder')" />
            </div>
            <p v-if="error" role="alert" class="auth-error">{{ error }}</p>
            <button type="submit" class="primary-action liquid-glass auth-submit flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" :disabled="isSubmitting" :aria-busy="isSubmitting">
              <ArrowPathIcon v-if="isSubmitting" aria-hidden="true" class="h-4 w-4 animate-spin" />
              <span>{{ isSubmitting ? t('auth.login.submitting') : t('auth.login.submit') }}</span>
              <ArrowRightIcon v-if="!isSubmitting" aria-hidden="true" class="h-4 w-4" />
            </button>
            <button type="button" class="liquid-glass flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" @click="goGuestWorkspace">
              <span>{{ loginSideCopy.guestCta }}</span>
              <ArrowRightIcon aria-hidden="true" class="h-4 w-4" />
            </button>
          </form>
          <p class="mt-6 border-t border-slate-200/80 pt-5 text-center text-sm text-slate-600">
            {{ t('auth.login.noAccount') }}
            <RouterLink to="/register" class="ml-1 font-semibold text-primary-600 underline-offset-4 hover:underline">{{ t('auth.login.register') }}</RouterLink>
          </p>
        </section>
        <aside class="auth-overview" aria-labelledby="auth-overview-title">
          <div class="flex items-center gap-3">
            <BrandMark class="h-10 w-10" />
            <span class="text-base font-semibold tracking-tight text-primary-900">RepreGuard</span>
          </div>
          <h2 id="auth-overview-title" class="mt-8 max-w-sm text-3xl font-semibold leading-tight tracking-tight text-primary-950 lg:text-[2.5rem]">{{ loginSideCopy.title }}</h2>
          <p class="mt-4 max-w-md text-sm leading-7 text-slate-700">{{ loginSideCopy.subtitle }}</p>
          <ul class="my-8 space-y-6">
            <li v-for="item in loginFeatureItems" :key="item.title" class="flex items-start gap-3">
              <component :is="item.icon" aria-hidden="true" class="mt-0.5 h-5 w-5 shrink-0 text-primary-700" />
              <div>
                <p class="text-sm font-semibold text-primary-950">{{ item.title }}</p>
                <p class="mt-1 text-sm leading-6 text-slate-700">{{ item.description }}</p>
              </div>
            </li>
          </ul>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowPathIcon, ArrowRightIcon, ClockIcon, DocumentArrowDownIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline';
import AppHeader from '../sections/AppHeader.vue';
import BrandMark from '../components/common/BrandMark.vue';
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
const isSubmitting = ref(false);

const loginSideCopy = computed(() =>
  locale.value === 'zh-CN'
    ? {
        title: '继续你的文本检测',
        subtitle: '回到已保存的检测结果，在原文中继续复核。',
        guestCta: '先体验检测',
        highlights: [
          { title: '查看历史记录', description: '查看账号下已保存的结果，继续阅读原文与高亮。' },
          { title: '查看今日额度', description: '在工作台查看今日剩余额度，开始新的检测。' },
          { title: '导出检测报告', description: '将结果导出为 PDF，便于保存与后续复核。' },
        ],
        errors: {
          invalidCredentials: '账号或密码错误，请重新输入。',
          rateLimited: '尝试次数过多，请稍后再试。',
          fallback: '登录失败，请稍后再试。',
        },
      }
    : {
        title: 'Continue your text review',
        subtitle: 'Return to saved results and pick up your review in the original text.',
        guestCta: 'Try detection first',
        highlights: [
          { title: 'Revisit saved results', description: 'Open your account history to review the original text and highlights.' },
          { title: 'Check today’s quota', description: 'See your remaining daily quota before starting another scan.' },
          { title: 'Export a report', description: 'Save detection results as a PDF for later review.' },
        ],
        errors: {
          invalidCredentials: 'Incorrect account or password. Please try again.',
          rateLimited: 'Too many attempts. Please try again later.',
          fallback: 'Login failed. Please try again later.',
        },
      }
);
const featureIcons = [ClockIcon, ShieldCheckIcon, DocumentArrowDownIcon];
const loginFeatureItems = computed(() =>
  loginSideCopy.value.highlights.map((item, index) => ({
    ...item,
    icon: featureIcons[index],
  }))
);

const goGuestWorkspace = () => {
  router.push({ name: 'dashboard', query: { panel: 'document' } });
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  error.value = '';
  if (!form.identifier || !form.password) {
    error.value = t('auth.login.errors.missing');
    return;
  }
  if (Array.from(form.password).length < 8) {
    error.value = t('auth.login.errors.passwordTooShort');
    return;
  }
  isSubmitting.value = true;
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
      error.value = loginSideCopy.value.errors.fallback;
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>
