<template>
  <header class="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur">
    <div class="mx-auto w-full max-w-7xl px-12 sm:px-14">
      <div class="flex h-16 items-center justify-between gap-6">
        <RouterLink :to="{ name: 'home' }" class="flex items-center space-x-3">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 font-semibold text-white">V</span>
          <span class="text-lg font-semibold tracking-tight text-slate-900">Veritascribe</span>
        </RouterLink>
        <nav v-if="showMarketingNav" class="hidden flex-1 items-center justify-center space-x-8 text-sm font-medium text-slate-600 md:flex">
          <RouterLink :to="{ name: 'home', hash: '#capabilities' }" class="hover:text-slate-900">功能概览</RouterLink>
          <RouterLink :to="{ name: 'home', hash: '#workflow' }" class="hover:text-slate-900">工作流</RouterLink>
          <RouterLink :to="{ name: 'home', hash: '#showcase' }" class="hover:text-slate-900">行业案例</RouterLink>
          <RouterLink :to="{ name: 'home', hash: '#pricing' }" class="hover:text-slate-900">定价</RouterLink>
        </nav>
        <div v-if="isMarketing || isAuth" class="hidden flex-1 items-center justify-end md:flex">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            @click="openDashboard"
          >
            Dashboard
          </button>
        </div>
        <div v-else class="hidden flex-1 items-center justify-end md:flex">
          <template v-if="authStore.isAuthenticated">
            <UserProfileArea
              :variant="dashboardProfileVariant"
              :credits-remaining="creditUsage.remaining"
              :credits-total="creditUsage.total"
              @upgrade="openUpgrade"
              @feedback="openFeedback"
            >
              <template #avatar>
                <div class="relative" ref="userMenuContainerRef">
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white shadow-sm"
                    @click="toggleUserMenu"
                  >
                    {{ userInitials }}
                  </button>
                  <transition name="fade">
                    <div
                      v-if="isUserMenuOpen"
                      class="absolute right-0 mt-3 w-72 rounded-3xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-600 shadow-xl backdrop-blur"
                    >
                      <div class="flex items-center gap-3">
                        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-base font-semibold text-white">
                          {{ userInitials }}
                        </div>
                        <div class="flex-1">
                          <p class="truncate text-sm font-semibold text-slate-900">{{ authStore.user?.email }}</p>
                          <p class="mt-0.5 text-xs text-primary-600">Personal Plan · Free</p>
                        </div>
                      </div>
                      <div class="mt-4 space-y-2 text-sm">
                        <button
                          type="button"
                          class="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-600"
                          @click="openAccountDetails"
                        >
                          <span>Account Details</span>
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          class="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-600"
                          @click="openContact"
                        >
                          <span>Contact Us</span>
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18" />
                          </svg>
                        </button>
                      </div>
                      <button
                        type="button"
                        class="mt-4 flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        @click="handleLogout"
                      >
                        退出登录
                      </button>
                    </div>
                  </transition>
                </div>
              </template>
            </UserProfileArea>
          </template>
          <template v-else>
            <div class="flex items-center gap-4">
              <RouterLink to="/login" class="text-sm font-medium text-slate-600 transition hover:text-slate-900">登录</RouterLink>
              <RouterLink
                to="/register"
                class="inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500"
              >
                注册
              </RouterLink>
            </div>
          </template>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600 md:hidden"
          @click="toggleMobileMenu"
        >
          <span class="sr-only">打开菜单</span>
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.75h16.5M3.75 12h16.5m-16.5 6.25h16.5" />
          </svg>
        </button>
      </div>
    </div>
    <transition name="fade">
      <div v-if="isMobileMenuOpen" class="md:hidden">
        <div class="mx-auto mt-2 max-w-7xl space-y-3 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg">
          <template v-if="isMarketing || isAuth">
            <RouterLink
              v-for="link in marketingLinks"
              :key="link.label"
              :to="link.to"
              class="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-primary-50"
              @click="closeMobileMenu"
            >
              {{ link.label }}
            </RouterLink>
            <button
              type="button"
              class="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              @click="openDashboardFromMobile"
            >
              打开 Dashboard
            </button>
          </template>
          <template v-else>
            <div v-if="authStore.isAuthenticated" class="space-y-3">
              <div class="space-y-3 rounded-2xl bg-slate-100 px-4 py-4 text-sm text-slate-600">
                <div class="flex items-center gap-3">
                  <div class="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">
                    {{ userInitials }}
                  </div>
                  <div>
                    <p class="font-semibold text-slate-700">{{ authStore.user?.email }}</p>
                    <p class="text-xs text-primary-600">Personal Plan · Free</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-600"
                  @click="openAccountDetailsFromMobile"
                >
                  <span>Account Details</span>
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-600"
                  @click="openContactFromMobile"
                >
                  <span>Contact Us</span>
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                class="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                @click="logoutFromMobile"
              >
                退出登录
              </button>
            </div>
            <div v-else class="flex items-center space-x-3">
              <RouterLink
                to="/login"
                class="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700"
                @click="closeMobileMenu"
              >
                登录
              </RouterLink>
              <RouterLink
                to="/register"
                class="flex-1 rounded-2xl bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white"
                @click="closeMobileMenu"
              >
                注册
              </RouterLink>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import UserProfileArea from '../components/common/UserProfileArea.vue';

const props = defineProps({
  mode: {
    type: String,
    default: 'marketing',
  },
  dashboardContext: {
    type: String,
    default: 'standard',
  },
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isMobileMenuOpen = ref(false);
const isUserMenuOpen = ref(false);
const userMenuContainerRef = ref(null);

const isMarketing = computed(() => props.mode === 'marketing');
const isDashboard = computed(() => props.mode === 'dashboard');
const isAuth = computed(() => props.mode === 'auth');

const showMarketingNav = computed(() => isMarketing.value || isAuth.value);
const creditUsage = computed(() => {
  const usage = authStore.creditUsage || { total: 0, remaining: 0, percentRemaining: 0 };
  return {
    total: usage.total ?? 0,
    remaining: usage.remaining ?? 0,
    percentRemaining: usage.percentRemaining ?? 0,
  };
});
const dashboardProfileVariant = computed(() => {
  if (!isDashboard.value) return 'standard';
  return props.dashboardContext === 'scan' ? 'scan' : 'standard';
});

const marketingLinks = computed(() => [
  { label: '功能概览', to: { name: 'home', hash: '#capabilities' } },
  { label: '工作流', to: { name: 'home', hash: '#workflow' } },
  { label: '行业案例', to: { name: 'home', hash: '#showcase' } },
  { label: '定价', to: { name: 'home', hash: '#pricing' } },
]);

const userInitials = computed(() => {
  const profile = authStore.user?.profile;
  if (profile?.firstName || profile?.surname) {
    return `${profile.firstName?.charAt(0) || ''}${profile.surname?.charAt(0) || ''}`.toUpperCase() || 'U';
  }
  if (!authStore.user?.name) {
    return (authStore.user?.email || 'U').charAt(0).toUpperCase();
  }
  return authStore.user.name.charAt(0).toUpperCase();
});

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  if (!isMobileMenuOpen.value) {
    isUserMenuOpen.value = false;
  }
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
};

const handleLogout = () => {
  authStore.logout();
  isUserMenuOpen.value = false;
};

const openUpgrade = () => {
  const targetQuery = { ...(route.query || {}), panel: 'pricing' };
  if (route.name === 'dashboard') {
    router.push({ name: 'dashboard', query: targetQuery });
    isUserMenuOpen.value = false;
    return;
  }
  const target = router.resolve({ name: 'dashboard', query: { panel: 'pricing' } });
  if (typeof window !== 'undefined') {
    window.open(target.href, '_blank', 'noopener');
    return;
  }
  router.push({ name: 'dashboard', query: { panel: 'pricing' } });
};

const openFeedback = () => {
  router.push({ name: 'dashboard', query: { panel: 'home', feedback: 'true' } });
};

const openDashboard = () => {
  const target = router.resolve({ name: 'dashboard', query: { panel: 'home' } });
  const url = target.href;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener');
  }
};

const openDashboardFromMobile = () => {
  openDashboard();
  closeMobileMenu();
};

const openAccountDetails = () => {
  const query = { ...(route.query || {}) };
  query.panel = 'profile';
  router.push({ name: 'dashboard', query });
  isUserMenuOpen.value = false;
};

const openAccountDetailsFromMobile = () => {
  openAccountDetails();
  closeMobileMenu();
};

const openContact = () => {
  router.push({ name: 'contact' });
  isUserMenuOpen.value = false;
};

const openContactFromMobile = () => {
  openContact();
  closeMobileMenu();
};

const logoutFromMobile = () => {
  handleLogout();
  closeMobileMenu();
};

const handleGlobalClick = (event) => {
  if (!isUserMenuOpen.value) return;
  if (userMenuContainerRef.value?.contains(event.target)) return;
  isUserMenuOpen.value = false;
};

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false;
    isUserMenuOpen.value = false;
  }
);

watch(
  () => props.mode,
  () => {
    isMobileMenuOpen.value = false;
    isUserMenuOpen.value = false;
  }
);

watch(
  () => props.dashboardContext,
  () => {
    isMobileMenuOpen.value = false;
    isUserMenuOpen.value = false;
  }
);

if (isDashboard.value) {
  watch(
    () => authStore.isAuthenticated,
    () => {
      isUserMenuOpen.value = false;
    }
  );
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleGlobalClick);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
