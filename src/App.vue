<template>
  <RouterView />
</template>

<script setup>
import { onMounted } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './store/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const protectedRoutes = new Set(['dashboard', 'multi-upload']);

onMounted(async () => {
  const hasToken = Boolean(window?.localStorage?.getItem('auth_token'));
  const restored = await authStore.restoreSession();
  if (!restored && hasToken && protectedRoutes.has(route.name)) {
    router.replace({ name: 'login', query: { redirect: route.fullPath } });
  }
});
</script>
