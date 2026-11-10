<template>
  <header
    class="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-md"
    :class="{ 'workbench-header': isGlassHeader, 'workbench-home-header': isDashboard && dashboardContext === 'home', 'account-header': isAccountPanel, 'public-header': isPublicHome, 'auth-header': isAuth }"
  >
    <div class="mx-auto w-full max-w-7xl px-6 sm:px-10">
      <div class="flex h-16 items-center justify-between gap-6">
        <RouterLink :to="{ name: 'home' }" class="flex items-center space-x-3">
          <BrandMark class="h-10 w-10 text-primary-600" />
          <span class="text-lg font-semibold tracking-tight text-slate-900">{{ t('common.brand') }}</span>
        </RouterLink>
        <nav v-if="showMarketingNav" class="hidden flex-1 items-center justify-center" :class="isPublicHome ? 'lg:flex' : 'md:flex'">
          <div
            class="flex items-center rounded-full py-1 text-sm font-medium text-slate-600"
            :class="isPublicHome ? 'liquid-glass gap-1 whitespace-nowrap px-1.5' : 'gap-2 bg-white/70 px-2 shadow-sm ring-1 ring-slate-200/60'"
          >
            <RouterLink
              :to="{ name: 'home', hash: '#capabilities' }"
              class="rounded-full px-3 py-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {{ t('header.nav.capabilities') }}
            </RouterLink>
            <RouterLink
              :to="{ name: 'home', hash: '#workflow' }"
              class="rounded-full px-3 py-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {{ t('header.nav.workflow') }}
            </RouterLink>
            <RouterLink
              :to="{ name: 'home', hash: '#showcase' }"
              class="rounded-full px-3 py-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {{ t('header.nav.showcase') }}
            </RouterLink>
          </div>
        </nav>
        <div class="header-desktop-actions hidden flex-1 items-center justify-end gap-3 md:flex">
          <label class="sr-only" for="locale-select">{{ t('common.language') }}</label>
          <BaseListbox
            button-id="locale-select"
            v-model="selectedLocale"
            :options="languageOptions"
            :aria-label="t('common.language')"
            :button-class="`min-w-[160px] whitespace-nowrap rounded-full text-xs ${isGlassHeader ? 'liquid-glass workbench-language-trigger' : ''}`"
            :options-class="isGlassHeader ? 'liquid-glass workbench-language-menu' : ''"
          />
          <div class="relative flex items-center">
            <div class="group relative">
              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                :class="{ 'liquid-glass': isGlassHeader }"
                :aria-label="t('header.quotaNotice.title')"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 17v-6" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 7h.01" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </button>
              <div
                class="pointer-events-none absolute right-0 z-30 mt-2 w-60 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-lg opacity-0 transition group-hover:opacity-100"
              >
                <p class="font-semibold text-slate-900">{{ t('header.quotaNotice.title') }}</p>
                <p class="mt-2">{{ t('header.quotaNotice.guest') }}</p>
                <p class="mt-1">{{ t('header.quotaNotice.user') }}</p>
              </div>
            </div>
          </div>
          <div v-if="isMarketing || isAuth" class="flex items-center justify-end">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
              :class="{ 'liquid-glass primary-action': isPublicHome || isAuth }"
              @click="openDashboard"
            >
              {{ t('header.buttons.dashboard') }}
            </button>
          </div>
          <div v-else class="flex items-center justify-end gap-3">
            <template v-if="authStore.isAuthenticated">
              <button
                v-if="showAdminEntry"
                type="button"
                class="inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                :class="{ 'liquid-glass liquid-glass-selected': isAccountPanel }"
                @click="openAdminPanel"
              >
                Admin
              </button>
              <UserProfileArea
                :variant="dashboardProfileVariant"
                @upgrade="openUpgrade"
                @feedback="openFeedback"
              >
                <template #avatar>
                  <div class="relative" ref="userMenuContainerRef">
                    <button
                      type="button"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white shadow-sm"
                      :class="{ 'liquid-glass liquid-glass-selected': dashboardContext === 'home' || isAccountPanel }"
                      :aria-label="t('common.accountDetails')"
                      :aria-expanded="isUserMenuOpen"
                      @click="toggleUserMenu"
                    >
                      {{ userInitials }}
                    </button>
                    <transition name="fade">
                      <div
                        v-if="isUserMenuOpen"
                        class="absolute right-0 mt-3 w-72 rounded-3xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-600 shadow-xl backdrop-blur"
                        :class="{ 'liquid-glass': dashboardContext === 'home' || isAccountPanel, 'account-user-menu': isAccountPanel }"
                      >
                        <div class="flex items-center gap-3">
                          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-base font-semibold text-white" :class="{ 'liquid-glass liquid-glass-selected': isAccountPanel }">
                            {{ userInitials }}
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-semibold text-slate-900">{{ isAccountPanel ? (authStore.user?.name || authStore.user?.email) : authStore.user?.email }}</p>
                            <p v-if="!isAccountPanel" class="mt-0.5 text-xs text-slate-500">{{ t('header.user.plan') }}</p>
                            <p v-else-if="authStore.user?.name && authStore.user?.email" class="mt-0.5 break-all text-xs text-slate-500">{{ authStore.user.email }}</p>
                          </div>
                        </div>
                        <div class="mt-4 space-y-2 text-sm">
                          <button
                            type="button"
                            class="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                            :class="{ 'liquid-glass': isAccountPanel }"
                            @click="openAccountDetails"
                          >
                            <span>{{ t('common.accountDetails') }}</span>
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            class="flex w-full cursor-not-allowed items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 opacity-60"
                            :class="{ 'liquid-glass': isAccountPanel }"
                            @click="openContact"
                          >
                            <span>{{ t('common.contactUs') }}</span>
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18" />
                            </svg>
                          </button>
                        </div>
                        <button
                          type="button"
                          class="mt-4 flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                          :class="{ 'liquid-glass': isAccountPanel }"
                          @click="handleLogout"
                        >
                          {{ t('header.buttons.logout') }}
                        </button>
                      </div>
                    </transition>
                  </div>
                </template>
              </UserProfileArea>
            </template>
            <template v-else>
              <div class="flex items-center gap-3">
                <RouterLink
                  to="/login"
                  class="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition"
                  :class="isWorkbench ? 'liquid-glass' : 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'"
                >
                  {{ t('header.buttons.login') }}
                </RouterLink>
                <RouterLink
                  to="/register"
                  class="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition"
                  :class="isWorkbench ? 'liquid-glass liquid-glass-selected' : 'bg-primary-600 text-white shadow-sm hover:bg-primary-700'"
                >
                  {{ t('header.buttons.register') }}
                </RouterLink>
              </div>
            </template>
          </div>
        </div>
        <button
          type="button"
          class="header-mobile-toggle group inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 md:hidden"
          :class="{ 'liquid-glass': isGlassHeader }"
          @click="toggleMobileMenu"
        >
          <span class="sr-only">{{ t('common.openMenu') }}</span>
          <span class="relative h-5 w-5">
            <span
              class="absolute left-0 top-1 h-0.5 w-5 rounded-full bg-current transition duration-200"
              :class="isMobileMenuOpen ? 'translate-y-2 rotate-45' : ''"
            ></span>
            <span
              class="absolute left-0 top-2.5 h-0.5 w-5 rounded-full bg-current transition duration-200"
              :class="isMobileMenuOpen ? 'opacity-0' : 'opacity-100'"
            ></span>
            <span
              class="absolute left-0 top-4 h-0.5 w-5 rounded-full bg-current transition duration-200"
              :class="isMobileMenuOpen ? '-translate-y-2 -rotate-45' : ''"
            ></span>
          </span>
        </button>
      </div>
    </div>
    <transition name="fade">
      <div v-if="isMobileMenuOpen" class="header-mobile-panel md:hidden">
        <div
          class="mx-auto mt-2 max-w-7xl space-y-3 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-md"
          :class="{ 'liquid-glass': isPublicHome || isAuth || dashboardContext === 'home' || isAccountPanel }"
        >
          <div class="flex items-center justify-end">
            <label class="sr-only" for="locale-select-mobile">{{ t('common.language') }}</label>
            <BaseListbox
              button-id="locale-select-mobile"
              v-model="selectedLocale"
              :options="languageOptions"
              :aria-label="t('common.language')"
              :button-class="isGlassHeader ? 'w-full liquid-glass workbench-language-trigger' : 'w-full'"
              :options-class="isGlassHeader ? 'liquid-glass workbench-language-menu' : ''"
            />
          </div>
          <nav v-if="isDashboard" class="grid grid-cols-4 gap-2" :aria-label="t('header.buttons.mobileDashboard')">
            <RouterLink
              v-for="link in dashboardLinks"
              :key="link.panel"
              :to="{ name: 'dashboard', query: { panel: link.panel } }"
              class="liquid-glass flex items-center justify-center rounded-full px-2 py-2.5 text-center text-sm font-semibold"
              :class="{ 'liquid-glass-selected': (route.query.panel || 'home') === link.panel }"
              :aria-current="(route.query.panel || 'home') === link.panel ? 'page' : undefined"
              @click="closeMobileMenu"
            >
              {{ link.label }}
            </RouterLink>
          </nav>
          <template v-if="isMarketing">
            <RouterLink
              v-for="link in marketingLinks"
              :key="link.label"
              :to="link.to"
              class="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              @click="closeMobileMenu"
            >
              {{ link.label }}
            </RouterLink>
            <button
              type="button"
              class="w-full rounded-2xl px-4 py-3 text-sm font-semibold"
              :class="isPublicHome ? 'liquid-glass primary-action' : 'bg-primary-600 text-white shadow-sm transition hover:bg-primary-700'"
              @click="openDashboardFromMobile"
            >
              {{ t('header.buttons.mobileDashboard') }}
            </button>
          </template>
          <template v-else-if="isAuth">
            <button
              type="button"
              class="liquid-glass primary-action w-full rounded-2xl px-4 py-3 text-sm font-semibold"
              @click="openDashboardFromMobile"
            >
              {{ t('header.buttons.mobileDashboard') }}
            </button>
          </template>
          <template v-else>
            <div v-if="authStore.isAuthenticated" class="space-y-3">
              <button
                v-if="showAdminEntry"
                type="button"
                class="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                :class="{ 'liquid-glass liquid-glass-selected': isAccountPanel }"
                @click="openAdminPanelFromMobile"
              >
                Admin
              </button>
              <div class="space-y-3 rounded-2xl bg-slate-100 px-4 py-4 text-sm text-slate-600" :class="{ 'account-mobile-summary': isAccountPanel }">
                <div class="flex items-center gap-3">
                  <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white" :class="{ 'liquid-glass liquid-glass-selected': isAccountPanel }">
                    {{ userInitials }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-slate-700" :class="{ 'break-all': isAccountPanel }">{{ isAccountPanel ? (authStore.user?.name || authStore.user?.email) : authStore.user?.email }}</p>
                    <p v-if="!isAccountPanel" class="text-xs text-slate-500">{{ t('header.user.plan') }}</p>
                    <p v-else-if="authStore.user?.name && authStore.user?.email" class="mt-0.5 break-all text-xs text-slate-500">{{ authStore.user.email }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  :class="{ 'liquid-glass': isAccountPanel }"
                  @click="openAccountDetailsFromMobile"
                >
                  <span>{{ t('common.accountDetails') }}</span>
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="flex w-full cursor-not-allowed items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 opacity-60"
                  :class="{ 'liquid-glass': isAccountPanel }"
                  @click="openContactFromMobile"
                >
                  <span>{{ t('common.contactUs') }}</span>
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                class="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                :class="{ 'liquid-glass': isAccountPanel }"
                @click="logoutFromMobile"
              >
                {{ t('header.buttons.logout') }}
              </button>
            </div>
            <div v-else class="flex items-center space-x-3">
              <RouterLink
                to="/login"
                class="flex-1 rounded-2xl px-4 py-3 text-center text-sm font-semibold transition"
                :class="isWorkbench ? 'liquid-glass' : 'border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'"
                @click="closeMobileMenu"
              >
                {{ t('header.buttons.login') }}
              </RouterLink>
              <RouterLink
                to="/register"
                class="flex-1 rounded-2xl px-4 py-3 text-center text-sm font-semibold transition"
                :class="isWorkbench ? 'liquid-glass liquid-glass-selected' : 'bg-primary-600 text-white shadow-sm hover:bg-primary-700'"
                @click="closeMobileMenu"
              >
                {{ t('header.buttons.register') }}
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
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import UserProfileArea from '../components/common/UserProfileArea.vue';
import BrandMark from '../components/common/BrandMark.vue';
import BaseListbox from '../components/common/BaseListbox.vue';
import { showComingSoon } from '../utils/toast';

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
const { t, locale, setLocale } = useI18n();

const isMobileMenuOpen = ref(false);
const isUserMenuOpen = ref(false);
const userMenuContainerRef = ref(null);

const isMarketing = computed(() => props.mode === 'marketing');
const isPublicHome = computed(() => isMarketing.value && route.name === 'home');
const isDashboard = computed(() => props.mode === 'dashboard');
const isAccountPanel = computed(() => isDashboard.value && ['profile', 'qa'].includes(props.dashboardContext));
const isWorkbench = computed(() => isDashboard.value && ['home', 'scan', 'profile', 'qa'].includes(props.dashboardContext));
const isAuth = computed(() => props.mode === 'auth');
const isGlassHeader = computed(() => isWorkbench.value || isPublicHome.value || isAuth.value);
const isAdminRoute = computed(() => String(route.name || '').startsWith('admin-'));

const showMarketingNav = computed(() => isMarketing.value);
const showAdminEntry = computed(() => authStore.isAuthenticated && authStore.isSysAdmin && !isAdminRoute.value);
const dashboardProfileVariant = computed(() => {
  if (!isDashboard.value) return 'standard';
  return props.dashboardContext === 'scan' ? 'scan' : isAccountPanel.value ? 'account' : 'standard';
});

const marketingLinks = computed(() => [
  { label: t('header.nav.capabilities'), to: { name: 'home', hash: '#capabilities' } },
  { label: t('header.nav.workflow'), to: { name: 'home', hash: '#workflow' } },
  { label: t('header.nav.showcase'), to: { name: 'home', hash: '#showcase' } },
]);

const dashboardLinks = computed(() => [
  { panel: 'home', label: t('scan.nav.home') },
  { panel: 'document', label: t('scan.nav.document') },
  { panel: 'profile', label: t('scan.nav.settings') },
  { panel: 'qa', label: t('scan.nav.qa') },
]);

const languageOptions = computed(() => [
  { value: 'en-US', label: t('languages.en') },
  { value: 'zh-CN', label: t('languages.zh') },
]);

const selectedLocale = computed({
  get: () => locale.value,
  set: (value) => setLocale(value),
});

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
  showComingSoon(t('header.nav.pricing'));
  isUserMenuOpen.value = false;
};

const openFeedback = () => {
  showComingSoon(t('common.contactUs'));
  isUserMenuOpen.value = false;
};

const openDashboard = () => {
  const target = authStore.isSysAdmin
    ? { name: 'admin-overview' }
    : { name: 'dashboard', query: { panel: 'home' } };
  router.push(target);
};

const openDashboardFromMobile = () => {
  openDashboard();
  closeMobileMenu();
};

const openAdminPanel = () => {
  router.push({ name: 'admin-overview' });
  isUserMenuOpen.value = false;
};

const openAdminPanelFromMobile = () => {
  openAdminPanel();
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
  showComingSoon(t('common.contactUs'));
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
.workbench-header {
  border-color: rgb(205 216 231 / 0.65);
  background-color: rgb(248 250 253 / 0.76);
  box-shadow: 0 1px 0 rgb(255 255 255 / 0.8);
}

.workbench-header :deep(.workbench-language-trigger) {
  border-radius: 9999px;
}

.workbench-header :deep(.workbench-language-menu) {
  right: 0;
  left: auto;
  min-width: 160px;
  border-radius: 18px;
  background: rgb(247 250 255 / 0.96);
}

.workbench-header :deep(.workbench-language-menu.fade-enter-active),
.workbench-header :deep(.workbench-language-menu.fade-leave-active) {
  transition: opacity 180ms ease, transform 180ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.workbench-header :deep(.workbench-language-menu.fade-leave-active) {
  transition-duration: 140ms;
}

.workbench-header :deep(.workbench-language-menu.fade-enter-from),
.workbench-header :deep(.workbench-language-menu.fade-leave-to) {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-transparency: reduce) {
  .workbench-header :deep(.workbench-language-menu) {
    background: #f7faff;
  }
}

@media (prefers-reduced-motion: reduce) {
  .workbench-header :deep(.workbench-language-menu.fade-enter-active),
  .workbench-header :deep(.workbench-language-menu.fade-leave-active) {
    transition: none;
  }

  .workbench-header :deep(.workbench-language-menu.fade-enter-from),
  .workbench-header :deep(.workbench-language-menu.fade-leave-to) {
    transform: none;
  }
}

.workbench-header :deep(.workbench-language-menu [role='option'][aria-selected='true']),
.workbench-header :deep(.workbench-language-menu [role='option'][data-headlessui-state~='active']) {
  color: #2456c7;
  background: rgb(36 86 199 / 0.1);
}

.workbench-header :deep(.workbench-language-menu [role='option'][aria-selected='true'] svg) {
  color: #2456c7;
}

.public-header .header-desktop-actions {
  flex: 0 0 auto;
}

.public-header .header-desktop-actions .primary-action,
.auth-header .header-desktop-actions .primary-action {
  min-height: 38px;
  white-space: nowrap;
}

.public-header :deep(.workbench-language-trigger),
.auth-header :deep(.workbench-language-trigger) {
  min-width: 128px;
}

.account-header .account-user-menu {
  max-width: calc(100vw - 2rem);
  border-radius: 16px;
  background: rgb(247 250 255 / 0.97);
  box-shadow: 0 8px 24px rgb(30 50 85 / 0.1);
}

.account-header .account-user-menu button {
  border-radius: 12px;
}

.account-header .account-mobile-summary {
  border: 1px solid #e2e8f0;
  background: #fff;
}

@media (min-width: 768px) and (max-width: 1023px) {
  .workbench-home-header .header-desktop-actions,
  .account-header .header-desktop-actions,
  .public-header .header-desktop-actions {
    display: none;
  }

  .workbench-home-header .header-mobile-toggle,
  .account-header .header-mobile-toggle,
  .public-header .header-mobile-toggle {
    display: inline-flex;
  }

  .workbench-home-header .header-mobile-panel,
  .account-header .header-mobile-panel,
  .public-header .header-mobile-panel {
    display: block;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
