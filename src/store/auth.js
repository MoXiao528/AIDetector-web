import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import router from '../router';
import { fetchMe, login as loginRequest, register as registerRequest, updateProfile as updateProfileRequest } from '../api/modules/auth';

const TOKEN_STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'auth_user';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref('');
  const creditSnapshot = ref({ total: 0, remaining: 0, used: 0 });

  const isAuthenticated = computed(() => Boolean(user.value));
  const credits = computed(() => Number(user.value?.credits) || 0);
  const authToken = computed(() => token.value || getStoredToken());

  const getStoredToken = () => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  };

  const getStoredUser = () => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      console.warn('Failed to parse stored user snapshot', error);
      return null;
    }
  };

  const persistUser = (nextUser) => {
    if (typeof window === 'undefined') return;
    if (nextUser) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
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

  const syncUserCredits = (nextRemaining) => {
    if (!user.value) return;
    const parsedRemaining = Number(nextRemaining);
    if (!Number.isFinite(parsedRemaining)) return;
    user.value = {
      ...user.value,
      credits: parsedRemaining,
    };
  };

  const setCredits = ({ total, remaining } = {}) => {
    const parsedTotal = Number(total);
    const parsedRemaining = Number(remaining);
    const safeTotal = Number.isFinite(parsedTotal) ? parsedTotal : creditSnapshot.value.total;
    const safeRemaining = Number.isFinite(parsedRemaining) ? parsedRemaining : creditSnapshot.value.remaining;
    creditSnapshot.value = {
      total: safeTotal,
      remaining: safeRemaining,
      used: Math.max(0, safeTotal - safeRemaining),
    };
    if (Number.isFinite(parsedRemaining)) {
      syncUserCredits(parsedRemaining);
    }
  };

  const applyMeSnapshot = (payload) => {
    if (!payload || typeof payload !== 'object') {
      user.value = null;
      return;
    }
    const account = payload.user || payload.data || payload;
    const resolvedCredits = payload.currentCredits ?? payload.credits ?? account?.credits;
    const parsedCredits = Number(resolvedCredits);
    user.value = {
      ...account,
      credits: Number.isFinite(parsedCredits) ? parsedCredits : account?.credits ?? 0,
    };
    persistUser(user.value);
    const credits = payload.credits || payload.creditSnapshot || account?.credits;
    if (credits && typeof credits === 'object') {
      setCredits(credits);
    } else if (Number.isFinite(parsedCredits)) {
      setCredits({ total: parsedCredits, remaining: parsedCredits });
    }
  };

  const restoreSession = async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      user.value = null;
      token.value = '';
      return false;
    }
    const cachedUser = getStoredUser();
    if (cachedUser) {
      user.value = cachedUser;
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
    persistUser(null);
    creditSnapshot.value = { total: 0, remaining: 0, used: 0 };
    router.replace({ name: 'login' });
  };

  const updateCredits = (newCredits) => {
    const parsedCredits = Number(newCredits);
    if (!Number.isFinite(parsedCredits)) return;
    if (!user.value) {
      user.value = { credits: parsedCredits };
    } else {
      user.value = {
        ...user.value,
        credits: parsedCredits,
      };
    }
    const safeTotal = Number(creditSnapshot.value.total) || 0;
    const nextTotal = safeTotal > 0 ? safeTotal : parsedCredits;
    creditSnapshot.value = {
      ...creditSnapshot.value,
      total: nextTotal,
      remaining: parsedCredits,
      used: Math.max(0, nextTotal - parsedCredits),
    };
    persistUser(user.value);
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
    persistUser(user.value);
    return response;
  };

  const applySubscription = ({ plan, credits } = {}) => {
    if (!user.value) return;

    user.value = {
      ...user.value,
      plan: plan || user.value.plan || 'personal-free',
    };
    persistUser(user.value);

    if (credits && typeof credits === 'object') {
      setCredits(credits);
    }
  };

  const creditUsage = computed(() => {
    const total = Math.max(0, Number(creditSnapshot.value.total) || 0);
    const remainingRaw = Math.max(0, Number(creditSnapshot.value.remaining) || 0);
    const remaining = total > 0 ? Math.min(total, remainingRaw) : 0;
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
    authToken,
    isAuthenticated,
    credits,
    creditUsage,
    setCredits,
    updateCredits,
    login,
    register,
    logout,
    updateProfile,
    applySubscription,
    restoreSession,
    requireAuthentication,
  };
});
