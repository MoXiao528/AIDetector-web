import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { fetchMe, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/modules/auth';

const TOKEN_STORAGE_KEY = 'auth_token';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const creditSnapshot = ref({ total: 0, remaining: 0 });

  const isAuthenticated = computed(() => Boolean(user.value));

  const getStoredToken = () => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  };

  const persistToken = (token) => {
    if (typeof window === 'undefined') return;
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  };

  const setCredits = ({ total, remaining } = {}) => {
    creditSnapshot.value = {
      total: Number.isFinite(total) ? Number(total) : creditSnapshot.value.total,
      remaining: Number.isFinite(remaining) ? Number(remaining) : creditSnapshot.value.remaining,
    };
  };

  const applyMeSnapshot = (payload) => {
    if (!payload || typeof payload !== 'object') {
      user.value = null;
      return;
    }
    const account = payload.user || payload.data || payload;
    user.value = account;
    const credits = payload.credits || payload.creditSnapshot || account?.credits;
    if (credits && typeof credits === 'object') {
      setCredits(credits);
    }
  };

  const restoreSession = async () => {
    const token = getStoredToken();
    if (!token) {
      user.value = null;
      return false;
    }
    try {
      const snapshot = await fetchMe();
      applyMeSnapshot(snapshot);
      return Boolean(user.value);
    } catch (error) {
      persistToken('');
      user.value = null;
      return false;
    }
  };

  const login = async ({ identifier, password }) => {
    const response = await loginRequest({ identifier, password });
    const token = response?.token || response?.accessToken || response?.data?.token;
    if (token) {
      persistToken(token);
    }
    const snapshot = await fetchMe();
    applyMeSnapshot(snapshot);
    return snapshot;
  };

  const register = async ({ name, email, password }) => {
    const response = await registerRequest({ name, email, password });
    const token = response?.token || response?.accessToken || response?.data?.token;
    if (token) {
      persistToken(token);
    }
    const snapshot = await fetchMe();
    applyMeSnapshot(snapshot);
    return snapshot;
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.warn('Failed to logout from server.', error);
    } finally {
      persistToken('');
      user.value = null;
      creditSnapshot.value = { total: 0, remaining: 0 };
    }
  };

  const updateProfile = (payload) => {
    if (!user.value) {
      throw new Error('请先登录后再更新个人信息。');
    }
    user.value = {
      ...user.value,
      profile: {
        ...(user.value.profile || {}),
        ...payload,
      },
    };
  };

  const applySubscription = ({ plan, credits } = {}) => {
    if (!user.value) return;

    user.value = {
      ...user.value,
      plan: plan || user.value.plan || 'personal-free',
    };

    if (credits && typeof credits === 'object') {
      setCredits(credits);
    }
  };

  const creditUsage = computed(() => {
    const total = Math.max(0, Number(creditSnapshot.value.total) || 0);
    const remaining = Math.max(0, Math.min(total, Number(creditSnapshot.value.remaining) || 0));
    return {
      total,
      remaining,
      used: Math.max(0, total - remaining),
      percentRemaining: total === 0 ? 0 : Math.min(100, Math.round((remaining / total) * 100)),
    };
  });

  const requireAuthentication = () => isAuthenticated.value;

  return {
    user,
    isAuthenticated,
    creditUsage,
    setCredits,
    login,
    register,
    logout,
    updateProfile,
    applySubscription,
    restoreSession,
    requireAuthentication,
  };
});
