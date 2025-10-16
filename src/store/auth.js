import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

const STORAGE_KEY = 'ai-detector-auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);

  const isAuthenticated = computed(() => Boolean(user.value));

  const restoreSession = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) {
        user.value = parsed;
      }
    } catch (error) {
      console.error('Failed to restore auth session', error);
    }
  };

  const persistSession = () => {
    if (typeof window === 'undefined') return;
    if (user.value) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = ({ email, name }) => {
    const displayName = name || email?.split('@')[0] || '用户';
    user.value = {
      email,
      name: displayName,
      lastLoginAt: new Date().toISOString(),
    };
  };

  const register = ({ email, name }) => {
    login({ email, name });
  };

  const logout = () => {
    user.value = null;
  };

  const requireAuthentication = () => isAuthenticated.value;

  if (typeof window !== 'undefined') {
    restoreSession();
  }

  watch(user, persistSession, { deep: true });

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    requireAuthentication,
  };
});
