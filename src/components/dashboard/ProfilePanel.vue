<template>
  <div class="space-y-10">
    <div v-if="!authStore.isAuthenticated" class="rounded-3xl border border-dashed border-primary-200 bg-white/90 p-10 text-center shadow-sm shadow-slate-200/60">
      <h1 class="text-lg font-semibold text-slate-900">{{ t('profilePanel.guest.title') }}</h1>
      <p class="mt-3 text-sm text-slate-500">{{ t('profilePanel.guest.subtitle') }}</p>
      <RouterLink
        to="/login"
        class="mt-6 inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500"
      >
        {{ t('profilePanel.guest.cta') }}
      </RouterLink>
    </div>
    <div v-else class="space-y-10">
      <section>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('profilePanel.title') }}</h1>
        <p class="mt-2 text-sm text-slate-500">{{ t('profilePanel.subtitle') }}</p>
      </section>
      <form class="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60" @submit.prevent="handleSubmit">
        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700" for="first-name">{{ t('profilePanel.fields.firstName') }}</label>
            <input
              id="first-name"
              v-model="profileForm.firstName"
              type="text"
              class="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700" for="surname">{{ t('profilePanel.fields.surname') }}</label>
            <input
              id="surname"
              v-model="profileForm.surname"
              type="text"
              class="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700" for="email">{{ t('profilePanel.fields.email') }}</label>
            <input
              id="email"
              :value="email"
              type="email"
              disabled
              class="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700" for="organization">{{ t('profilePanel.fields.organization') }}</label>
            <BaseListbox
              button-id="organization"
              v-model="profileForm.organization"
              :options="organizationOptions"
              :placeholder="t('profilePanel.placeholders.organization')"
              :aria-label="t('profilePanel.fields.organization')"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700" for="role">{{ t('profilePanel.fields.role') }}</label>
            <BaseListbox
              button-id="role"
              v-model="profileForm.role"
              :options="roleOptions"
              :placeholder="t('profilePanel.placeholders.role')"
              :aria-label="t('profilePanel.fields.role')"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700" for="industry">{{ t('profilePanel.fields.industry') }}</label>
            <BaseListbox
              button-id="industry"
              v-model="profileForm.industry"
              :options="industryOptions"
              :placeholder="t('profilePanel.placeholders.industry')"
              :aria-label="t('profilePanel.fields.industry')"
            />
          </div>
        </div>
        <div class="space-y-3">
          <button
            type="submit"
            :disabled="isSaving"
            class="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <svg
              v-if="isSaving"
              class="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            {{ t('profilePanel.actions.save') }}
          </button>
          <p v-if="successMessage" class="text-sm text-emerald-600">{{ successMessage }}</p>
          <p v-if="errorMessage" class="text-sm text-rose-500">{{ errorMessage }}</p>
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
    authStore.updateProfile({
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
