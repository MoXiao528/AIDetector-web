<template>
  <header class="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <RouterLink :to="{ name: 'home' }" class="flex items-center space-x-2">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 font-semibold text-white">V</span>
          <span class="text-lg font-semibold tracking-tight text-slate-900">Veritascribe</span>
        </RouterLink>
        <nav class="hidden items-center space-x-8 text-sm font-medium text-slate-600 md:flex">
          <RouterLink :to="{ name: 'home', hash: '#capabilities' }" class="hover:text-slate-900">功能概览</RouterLink>
          <RouterLink :to="{ name: 'home', hash: '#workflow' }" class="hover:text-slate-900">工作流</RouterLink>
          <RouterLink :to="{ name: 'home', hash: '#showcase' }" class="hover:text-slate-900">行业案例</RouterLink>
          <RouterLink :to="{ name: 'home', hash: '#pricing' }" class="hover:text-slate-900">定价</RouterLink>
          <RouterLink :to="{ name: 'dashboard' }" class="hover:text-slate-900">控制台</RouterLink>
        </nav>
        <div class="hidden items-center space-x-3 md:flex">
          <RouterLink to="/login" class="text-sm font-medium text-slate-600 transition hover:text-slate-900">登录</RouterLink>
          <RouterLink
            to="/register"
            class="inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500"
          >
            免费注册
          </RouterLink>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600 md:hidden"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
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
        <div class="mx-auto mt-2 max-w-6xl space-y-1 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg">
          <RouterLink
            v-for="link in mobileLinks"
            :key="link.label"
            :to="link.to"
            class="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-primary-50"
            @click="closeMobileMenu"
          >
            {{ link.label }}
          </RouterLink>
          <div class="flex items-center space-x-3 pt-2">
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
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const isMobileMenuOpen = ref(false);
const route = useRoute();

const mobileLinks = computed(() => [
  { label: '功能概览', to: { name: 'home', hash: '#capabilities' } },
  { label: '工作流', to: { name: 'home', hash: '#workflow' } },
  { label: '行业案例', to: { name: 'home', hash: '#showcase' } },
  { label: '定价', to: { name: 'home', hash: '#pricing' } },
  { label: '控制台', to: { name: 'dashboard' } },
]);

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false;
  }
);
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
