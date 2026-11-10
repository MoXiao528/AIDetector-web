<template>
  <div class="public-theme auth-page min-h-screen">
    <AppHeader mode="auth" />
    <main class="auth-main px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div class="auth-layout mx-auto grid w-full max-w-[1080px] gap-5 lg:grid-cols-2 lg:gap-8">
        <section class="auth-form-panel" aria-labelledby="auth-title">
          <h1 id="auth-title" class="text-3xl font-semibold tracking-tight text-slate-950">{{ t('auth.register.title') }}</h1>
          <p class="mt-3 text-sm leading-6 text-slate-600">{{ t('auth.register.subtitle') }}</p>
          <form class="mt-7 space-y-5" :aria-busy="isSubmitting" @submit.prevent="handleSubmit">
            <div class="auth-field">
              <label for="name">{{ t('auth.register.name') }}</label>
              <input id="name" v-model="form.name" name="name" type="text" autocomplete="username" aria-describedby="name-hint" :placeholder="t('auth.register.placeholderName')" />
              <p id="name-hint" class="text-xs leading-5 text-slate-500">{{ registerSideCopy.nameHint }}</p>
            </div>
            <div class="auth-field">
              <label for="email">{{ t('auth.register.email') }}</label>
              <input id="email" v-model="form.email" name="email" type="email" autocomplete="email" required :placeholder="t('auth.register.placeholderEmail')" />
            </div>
            <div class="auth-field">
              <label for="password">{{ t('auth.register.password') }}</label>
              <input id="password" v-model="form.password" name="password" type="password" autocomplete="new-password" required minlength="8" :placeholder="t('auth.register.placeholderPassword')" />
            </div>
            <div class="auth-field">
              <label for="confirm">{{ t('auth.register.confirm') }}</label>
              <input id="confirm" v-model="form.confirm" name="confirm" type="password" autocomplete="new-password" required :placeholder="t('auth.register.placeholderConfirm')" />
            </div>
            <p v-if="error" role="alert" class="auth-error">{{ error }}</p>
            <button type="submit" class="primary-action liquid-glass auth-submit flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" :disabled="isSubmitting || registrationComplete" :aria-busy="isSubmitting">
              <ArrowPathIcon v-if="isSubmitting" aria-hidden="true" class="h-4 w-4 animate-spin" />
              <span>{{ isSubmitting ? t('auth.register.submitting') : t('auth.register.submit') }}</span>
              <ArrowRightIcon v-if="!isSubmitting" aria-hidden="true" class="h-4 w-4" />
            </button>
            <button type="button" class="liquid-glass flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" @click="goGuestWorkspace">
              <span>{{ registerSideCopy.guestCta }}</span>
              <ArrowRightIcon aria-hidden="true" class="h-4 w-4" />
            </button>
          </form>
          <p class="mt-6 border-t border-slate-200/80 pt-5 text-center text-sm text-slate-600">
            {{ t('auth.register.haveAccount') }}
            <RouterLink to="/login" class="ml-1 font-semibold text-primary-600 underline-offset-4 hover:underline">{{ t('auth.register.login') }}</RouterLink>
          </p>
        </section>
        <aside class="auth-overview" aria-labelledby="auth-overview-title">
          <div class="flex items-center gap-3">
            <BrandMark class="h-10 w-10" />
            <span class="text-base font-semibold tracking-tight text-primary-900">RepreGuard</span>
          </div>
          <h2 id="auth-overview-title" class="mt-8 max-w-sm text-3xl font-semibold leading-tight tracking-tight text-primary-950 lg:text-[2.5rem]">{{ registerSideCopy.title }}</h2>
          <p class="mt-4 max-w-md text-sm leading-7 text-slate-700">{{ registerSideCopy.subtitle }}</p>
          <ul class="my-8 space-y-6">
            <li v-for="item in registerFeatureItems" :key="item.title" class="flex items-start gap-3">
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
import { ArrowPathIcon, ArrowRightIcon, ArrowUpTrayIcon, ClockIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline';
import AppHeader from '../sections/AppHeader.vue';
import BrandMark from '../components/common/BrandMark.vue';
import { extractApiErrorCode } from '../api/client';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { showToast } from '../utils/toast';

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
const isSubmitting = ref(false);
const registrationComplete = ref(false);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerSideCopy = computed(() =>
  locale.value === 'zh-CN'
    ? {
        title: '从第一份文本开始',
        subtitle: '创建账号，保存检测记录，随时回来复核结果。',
        guestCta: '先体验检测',
        nameHint: '不填写也可注册；登录时可使用邮箱。',
        highlights: [
          { title: '保存检测记录', description: '在账号历史中查看结果，继续复核原文与高亮。' },
          { title: '导出 PDF 报告', description: '保存检测结果，方便后续查阅。' },
          { title: '导入游客记录', description: '登录或注册后，可选择将游客检测记录导入账号。' },
        ],
        errors: {
          email: '请输入有效的邮箱地址。',
          passwordMismatch: '两次密码不一致。',
          emailExists: '该邮箱已注册，请直接登录。',
          nameExists: '该用户名已被使用，请换一个。',
          rateLimited: '注册尝试过于频繁，请稍后再试。',
        },
      }
    : {
        title: 'Start with your first text',
        subtitle: 'Create an account, save your scans, and return to review the results.',
        guestCta: 'Try detection first',
        nameHint: 'You can leave this blank and sign in with your email.',
        highlights: [
          { title: 'Save detection records', description: 'Reopen results from your account history to review the original text and highlights.' },
          { title: 'Export PDF reports', description: 'Save detection results for later review.' },
          { title: 'Import guest records', description: 'After signing in or registering, you can choose to import guest scans into your account.' },
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
const featureIcons = [ClockIcon, DocumentArrowDownIcon, ArrowUpTrayIcon];
const registerFeatureItems = computed(() =>
  registerSideCopy.value.highlights.map((item, index) => ({
    ...item,
    icon: featureIcons[index],
  }))
);

const goGuestWorkspace = () => {
  router.push({ name: 'dashboard', query: { panel: 'document' } });
};

const handleSubmit = async () => {
  if (isSubmitting.value || registrationComplete.value) return;
  error.value = '';
  if (!form.email || !form.password || !form.confirm) {
    error.value = t('auth.register.errors.missing');
    return;
  }
  if (!emailPattern.test(form.email)) {
    error.value = registerSideCopy.value.errors.email;
    return;
  }
  if (Array.from(form.password).length < 8) {
    error.value = t('auth.register.errors.passwordTooShort');
    return;
  }
  if (form.password !== form.confirm) {
    error.value = registerSideCopy.value.errors.passwordMismatch;
    return;
  }
  isSubmitting.value = true;
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
    if (code === 'LOGIN_FAILED') {
      registrationComplete.value = true;
      showToast({ message: t('auth.register.feedback.createdSignIn'), duration: 6000 });
      router.push('/login');
    } else if (code === 'ME_FAILED') {
      registrationComplete.value = true;
      error.value = t('auth.register.feedback.profileFailed');
    } else if (code === 'AUTH_EMAIL_EXISTS') {
      error.value = registerSideCopy.value.errors.emailExists;
    } else if (code === 'AUTH_NAME_EXISTS') {
      error.value = registerSideCopy.value.errors.nameExists;
    } else if (code === 'AUTH_RATE_LIMITED') {
      error.value = registerSideCopy.value.errors.rateLimited;
    } else {
      error.value = t('auth.register.errors.failed');
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>
