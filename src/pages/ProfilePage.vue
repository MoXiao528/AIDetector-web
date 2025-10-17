<template>
  <div class="min-h-screen bg-slate-100">
    <AppHeader mode="dashboard" />
    <main class="mx-auto max-w-4xl px-4 py-10">
      <div v-if="!authStore.isAuthenticated" class="rounded-3xl border border-dashed border-primary-200 bg-white/80 p-10 text-center shadow-sm">
        <h1 class="text-lg font-semibold text-slate-900">请登录后管理个人资料</h1>
        <p class="mt-3 text-sm text-slate-500">登录账户即可更新姓名、组织、岗位与行业信息。</p>
        <RouterLink
          to="/login"
          class="mt-6 inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500"
        >
          前往登录
        </RouterLink>
      </div>
      <div v-else class="space-y-10">
        <section>
          <h1 class="text-2xl font-semibold text-slate-900">Profile</h1>
          <p class="mt-2 text-sm text-slate-500">完善个人资料，帮助团队快速了解你的身份与需求。</p>
        </section>
        <form
          class="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50"
          @submit.prevent="handleSubmit"
        >
          <div class="grid gap-6 md:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-semibold text-slate-700" for="first-name">First Name</label>
              <input
                id="first-name"
                v-model="profileForm.firstName"
                type="text"
                class="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-semibold text-slate-700" for="surname">Surname</label>
              <input
                id="surname"
                v-model="profileForm.surname"
                type="text"
                class="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-semibold text-slate-700" for="email">Email</label>
              <input
                id="email"
                :value="email"
                type="email"
                disabled
                class="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-semibold text-slate-700" for="organization">Organization</label>
              <select
                id="organization"
                v-model="profileForm.organization"
                class="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">请选择组织类型</option>
                <option v-for="option in organizationOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-semibold text-slate-700" for="role">Role</label>
              <select
                id="role"
                v-model="profileForm.role"
                class="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">请选择角色</option>
                <option v-for="option in roleOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-semibold text-slate-700" for="industry">Industry</label>
              <select
                id="industry"
                v-model="profileForm.industry"
                class="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">请选择行业</option>
                <option v-for="option in industryOptions" :key="option" :value="option">{{ option }}</option>
              </select>
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
              更新资料
            </button>
            <p v-if="successMessage" class="text-sm text-emerald-600">{{ successMessage }}</p>
            <p v-if="errorMessage" class="text-sm text-rose-500">{{ errorMessage }}</p>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import AppHeader from '../sections/AppHeader.vue';
import { useAuthStore } from '../store/auth';

const authStore = useAuthStore();

const profileForm = reactive({
  firstName: '',
  surname: '',
  organization: '',
  role: '',
  industry: '',
});

const organizationOptions = ['高校教育', '媒体出版', '企业团队', '自由职业者', '政府/机构'];
const roleOptions = ['教师', '学生', '研究人员', '内容创作者', '产品经理'];
const industryOptions = ['教育', '科技', '媒体', '咨询', '市场营销'];

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
    successMessage.value = '个人资料已更新。';
  } catch (error) {
    errorMessage.value = error.message || '更新失败，请稍后再试。';
  } finally {
    isSaving.value = false;
  }
};
</script>
