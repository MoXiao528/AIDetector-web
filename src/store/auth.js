import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import router from '../router';
import { fetchMe, login as loginRequest, register as registerRequest, updateProfile as updateProfileRequest } from '../api/modules/auth';

const TOKEN_STORAGE_KEY = 'auth_token';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref('');
  const creditSnapshot = ref({ total: 0, remaining: 0 });

  const isAuthenticated = computed(() => Boolean(user.value));

  const getStoredToken = () => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  };

  const persistToken = (nextToken) => {
    if (typeof window === 'undefined') return;
    if (nextToken) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    token.value = nextToken || '';
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
    const storedToken = getStoredToken();
    if (!storedToken) {
      user.value = null;
      token.value = '';
      return false;
    }
    try {
      token.value = storedToken;
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
    const resolvedToken = response?.accessToken || response?.access_token || response?.token || response?.data?.token;
    if (resolvedToken) {
      persistToken(resolvedToken);
    }
    const snapshot = await fetchMe();
    applyMeSnapshot(snapshot);
    return snapshot;
  };

  const register = async ({ name, email, password }) => {
    const payload = { email, password };
    if (name?.trim()) {
      payload.name = name.trim();
    }
    await registerRequest(payload);
    let loginResponse;
    try {
      loginResponse = await loginRequest({ identifier: email, password });
    } catch (error) {
      const err = new Error('注册成功但登录失败，请重新登录。');
      err.code = 'LOGIN_FAILED';
      throw err;
    }
    const resolvedToken = loginResponse?.accessToken || loginResponse?.access_token || loginResponse?.token || loginResponse?.data?.token;
    if (resolvedToken) {
      persistToken(resolvedToken);
    }
    try {
      const snapshot = await fetchMe();
      applyMeSnapshot(snapshot);
      return snapshot;
    } catch (error) {
      const err = new Error('登录成功但用户信息加载失败，可重试。');
      err.code = 'ME_FAILED';
      throw err;
    }
  };

  const logout = async () => {
    persistToken('');
    user.value = null;
    creditSnapshot.value = { total: 0, remaining: 0 };
    router.replace({ name: 'login' });
  };

  const updateProfile = async (payload) => {
    if (!user.value) {
      throw new Error('请先登录后再更新个人信息。');
    }
    const response = await updateProfileRequest(payload);
    const nextProfile = response?.profile || response?.data?.profile || response?.data || response;
    const resolvedProfile =
      nextProfile && typeof nextProfile === 'object'
        ? nextProfile
        : payload && typeof payload === 'object'
          ? payload
          : {};
    user.value = {
      ...user.value,
      profile: {
        ...(user.value.profile || {}),
        ...resolvedProfile,
      },
    };
    return response;
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
    token,
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
