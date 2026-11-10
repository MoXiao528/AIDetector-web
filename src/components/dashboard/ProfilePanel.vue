<template>
  <div class="min-w-0 space-y-6">
    <div v-if="!authStore.isAuthenticated" class="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center sm:p-10">
      <h1 class="text-lg font-semibold text-slate-900">{{ t('profilePanel.guest.title') }}</h1>
      <p class="mt-3 text-sm leading-6 text-slate-600">{{ t('profilePanel.guest.subtitle') }}</p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <RouterLink
          :to="{ name: 'login', query: { redirect: '/dashboard?panel=profile' } }"
          class="primary-action liquid-glass inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          {{ t('profilePanel.guest.cta') }}
        </RouterLink>
        <RouterLink
          :to="{ name: 'register', query: { redirect: '/dashboard?panel=profile' } }"
          class="liquid-glass inline-flex min-h-[46px] items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          {{ t('auth.login.register') }}
        </RouterLink>
      </div>
    </div>
    <div v-else class="space-y-6">
      <section>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('profilePanel.title') }}</h1>
        <p class="mt-2 text-sm leading-6 text-slate-600">{{ t('profilePanel.subtitle') }}</p>
      </section>
      <form class="profile-form space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" :aria-busy="isSaving" @submit.prevent="handleSubmit">
        <div class="grid gap-4 border-b border-slate-200 pb-6 sm:grid-cols-2 sm:gap-x-6">
          <div class="min-w-0 space-y-2">
            <label class="text-sm font-medium text-slate-600" for="account-name">{{ t('profilePanel.fields.accountName') }}</label>
            <input
              id="account-name"
              :value="accountName"
              type="text"
              disabled
              aria-describedby="profile-identity-note"
              class="profile-input"
            />
          </div>
          <div class="min-w-0 space-y-2">
            <label class="text-sm font-medium text-slate-600" for="email">{{ t('profilePanel.fields.email') }}</label>
            <input
              id="email"
              :value="email"
              type="email"
              disabled
              aria-describedby="profile-identity-note"
              class="profile-input"
            />
          </div>
          <p id="profile-identity-note" class="text-xs leading-6 text-slate-500 sm:col-span-2">{{ t('profilePanel.tips.identity') }}</p>
        </div>
        <div class="grid gap-5 sm:grid-cols-2 sm:gap-x-6">
          <div class="min-w-0 space-y-2">
            <label class="text-sm font-medium text-slate-700" for="first-name">{{ t('profilePanel.fields.firstName') }}</label>
            <input
              id="first-name"
              v-model="profileForm.firstName"
              type="text"
              autocomplete="given-name"
              class="profile-input"
            />
          </div>
          <div class="min-w-0 space-y-2">
            <label class="text-sm font-medium text-slate-700" for="surname">{{ t('profilePanel.fields.surname') }}</label>
            <input
              id="surname"
              v-model="profileForm.surname"
              type="text"
              autocomplete="family-name"
              class="profile-input"
            />
          </div>
          <div class="min-w-0 space-y-2">
            <label class="text-sm font-medium text-slate-700" for="organization">{{ t('profilePanel.fields.organization') }}</label>
            <BaseListbox
              button-id="organization"
              v-model="profileForm.organization"
              :options="organizationOptions"
              :placeholder="t('profilePanel.placeholders.organization')"
              :aria-label="t('profilePanel.fields.organization')"
              button-class="profile-select"
              options-class="profile-options"
              display-class="min-w-0 truncate"
            />
          </div>
          <div class="min-w-0 space-y-2">
            <label class="text-sm font-medium text-slate-700" for="role">{{ t('profilePanel.fields.role') }}</label>
            <BaseListbox
              button-id="role"
              v-model="profileForm.role"
              :options="roleOptions"
              :placeholder="t('profilePanel.placeholders.role')"
              :aria-label="t('profilePanel.fields.role')"
              button-class="profile-select"
              options-class="profile-options"
              display-class="min-w-0 truncate"
            />
          </div>
          <div class="min-w-0 space-y-2">
            <label class="text-sm font-medium text-slate-700" for="industry">{{ t('profilePanel.fields.industry') }}</label>
            <BaseListbox
              button-id="industry"
              v-model="profileForm.industry"
              :options="industryOptions"
              :placeholder="t('profilePanel.placeholders.industry')"
              :aria-label="t('profilePanel.fields.industry')"
              button-class="profile-select"
              options-class="profile-options"
              display-class="min-w-0 truncate"
            />
          </div>
        </div>
        <div class="space-y-3 border-t border-slate-200 pt-5">
          <button
            type="submit"
            :disabled="isSaving"
            :aria-busy="isSaving"
            class="profile-save primary-action liquid-glass inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold sm:w-auto"
          >
            <svg
              v-if="isSaving"
              class="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            {{ t('profilePanel.actions.save') }}
          </button>
          <p v-if="successMessage" role="status" class="text-sm leading-6 text-emerald-700">{{ successMessage }}</p>
          <p v-if="errorMessage" role="alert" class="text-sm leading-6 text-rose-700">{{ errorMessage }}</p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useI18n } from '../../i18n';
import { useAuthStore } from '../../store/auth';
import BaseListbox from '../common/BaseListbox.vue';

const authStore = useAuthStore();
const { t } = useI18n();

const profileForm = reactive({
  firstName: '',
  surname: '',
  organization: '',
  role: '',
  industry: '',
});

const organizationOptions = computed(() => [
  { value: 'education', label: t('profilePanel.options.organization.education') },
  { value: 'media', label: t('profilePanel.options.organization.media') },
  { value: 'enterprise', label: t('profilePanel.options.organization.enterprise') },
  { value: 'freelance', label: t('profilePanel.options.organization.freelance') },
  { value: 'government', label: t('profilePanel.options.organization.government') },
]);
const roleOptions = computed(() => [
  { value: 'teacher', label: t('profilePanel.options.role.teacher') },
  { value: 'student', label: t('profilePanel.options.role.student') },
  { value: 'researcher', label: t('profilePanel.options.role.researcher') },
  { value: 'creator', label: t('profilePanel.options.role.creator') },
  { value: 'pm', label: t('profilePanel.options.role.pm') },
]);
const industryOptions = computed(() => [
  { value: 'education', label: t('profilePanel.options.industry.education') },
  { value: 'tech', label: t('profilePanel.options.industry.tech') },
  { value: 'media', label: t('profilePanel.options.industry.media') },
  { value: 'consulting', label: t('profilePanel.options.industry.consulting') },
  { value: 'marketing', label: t('profilePanel.options.industry.marketing') },
]);

const successMessage = ref('');
const errorMessage = ref('');
const isSaving = ref(false);

const accountName = computed(() => authStore.user?.name || '');
const email = computed(() => authStore.user?.email || '');

const syncForm = () => {
  if (!authStore.user?.profile) return;
  profileForm.firstName = authStore.user.profile.firstName || '';
  profileForm.surname = authStore.user.profile.surname || '';
  profileForm.organization = authStore.user.profile.organization || '';
  profileForm.role = authStore.user.profile.role || '';
  profileForm.industry = authStore.user.profile.industry || '';
};

watch(
  () => authStore.user,
  () => {
    if (authStore.isAuthenticated) {
      syncForm();
    }
  },
  { immediate: true }
);

const handleSubmit = async () => {
  if (!authStore.isAuthenticated) return;
  successMessage.value = '';
  errorMessage.value = '';
  isSaving.value = true;
  try {
    await authStore.updateProfile({
      firstName: profileForm.firstName,
      surname: profileForm.surname,
      organization: profileForm.organization,
      role: profileForm.role,
      industry: profileForm.industry,
    });
    successMessage.value = t('profilePanel.feedback.success');
  } catch (error) {
    errorMessage.value = error.message || t('profilePanel.feedback.error');
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.profile-input {
  @apply min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-800 transition-colors hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:text-sm;
}

.profile-input:disabled {
  @apply cursor-not-allowed border-slate-200 bg-slate-50 text-slate-600 opacity-100;
}

.profile-form :deep(.profile-select) {
  @apply min-h-12 rounded-xl border-slate-200 bg-white px-3.5 text-base font-medium text-slate-800 shadow-none hover:border-primary-300 focus-visible:border-primary-500 sm:text-sm;
}

.profile-form :deep(.profile-options) {
  @apply rounded-xl border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10;
}

.profile-form :deep(.profile-options [role='option'][aria-selected='true']),
.profile-form :deep(.profile-options [role='option'][data-headlessui-state~='active']) {
  @apply rounded-lg bg-primary-50 text-primary-700;
}

.profile-save.liquid-glass:disabled {
  cursor: wait;
  color: #fff;
  background: #526ca4;
  box-shadow: none;
}
</style>
