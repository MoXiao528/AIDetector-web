import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import router from '../router';
import {
  clearGuestToken,
  fetchMe,
  getStoredGuestToken,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  updateProfile as updateProfileRequest,
} from '../api/modules/auth';
import { claimGuestHistory } from '../api/modules/history';

const AUTH_SESSION_STORAGE_KEY = 'auth_session';
const USER_STORAGE_KEY = 'auth_user';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref('');
  const creditSnapshot = ref({ total: 0, remaining: 0, used: 0 });
  const hasRestoredSession = ref(false);
  let restoreSessionPromise = null;

  const hasStoredUserSession = () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) === '1';
  };

  const clearLegacyUserToken = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('auth_token');
  };

  const authToken = computed(() => token.value || (hasStoredUserSession() ? '__cookie__' : ''));
  const isAuthenticated = computed(() => Boolean(authToken.value));
  const credits = computed(() => Number(user.value?.credits) || 0);
  const currentUser = computed(() => user.value || (authToken.value ? getStoredUser() : null));
  const currentSystemRole = computed(() => {
    const rawRole = currentUser.value?.systemRole ?? currentUser.value?.role ?? '';
    return typeof rawRole === 'string' ? rawRole.toUpperCase() : '';
  });
  const hasResolvedUser = computed(() => Boolean(currentUser.value));
  const isSysAdmin = computed(() => currentSystemRole.value === 'SYS_ADMIN');

  const getStoredUser = () => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
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

  const persistUserSession = (active) => {
    if (typeof window === 'undefined') return;
    if (active) {
      window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  };

  const resetCreditSnapshot = () => {
    creditSnapshot.value = { total: 0, remaining: 0, used: 0 };
  };

  const clearSessionState = () => {
    clearLegacyUserToken();
    persistUserSession(false);
    token.value = '';
    user.value = null;
    persistUser(null);
    resetCreditSnapshot();
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

  const setCredits = ({ total, remaining, onlyTotal = false, onlyRemaining = false } = {}) => {
    const parsedTotal = Number(total);
    const parsedRemaining = Number(remaining);

    let safeTotal = creditSnapshot.value.total;
    let safeRemaining = creditSnapshot.value.remaining;

    if (!onlyRemaining && Number.isFinite(parsedTotal)) {
      safeTotal = parsedTotal;
    }

    if (!onlyTotal && Number.isFinite(parsedRemaining)) {
      safeRemaining = parsedRemaining;
    }

    if (safeTotal === 0 && safeRemaining > 0) {
      safeTotal = safeRemaining;
    }

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
    const creditsPayload = payload.credits || payload.creditSnapshot || account?.credits;
    if (creditsPayload && typeof creditsPayload === 'object') {
      setCredits(creditsPayload);
    } else if (Number.isFinite(parsedCredits)) {
      setCredits({ total: parsedCredits, onlyTotal: true });
    }
  };

  const restoreSession = async () => {
    if (restoreSessionPromise) {
      return restoreSessionPromise;
    }

    if (hasRestoredSession.value) {
      return Boolean(currentUser.value);
    }

    const hasSession = hasStoredUserSession();
    clearLegacyUserToken();
    if (!hasSession) {
      clearSessionState();
      hasRestoredSession.value = true;
      return false;
    }

    restoreSessionPromise = (async () => {
      const cachedUser = getStoredUser();
      if (cachedUser) {
        user.value = cachedUser;
      }

      try {
        token.value = '__cookie__';
        const snapshot = await fetchMe();
        applyMeSnapshot(snapshot);
        persistUserSession(true);
        return Boolean(user.value);
      } catch (error) {
        clearSessionState();
        return false;
      } finally {
        hasRestoredSession.value = true;
        restoreSessionPromise = null;
      }
    })();

    return restoreSessionPromise;
  };

  const syncHistoryAfterAuthentication = async (guestToken) => {
    if (typeof window === 'undefined') return;

    const { useScanStore } = await import('./scan');
    const scanStore = useScanStore();

    try {
      if (guestToken) {
        await claimGuestHistory(guestToken);
        clearGuestToken();
      }
      await scanStore.syncHistoryFromBackend();
    } catch {
      // Preserve the reset state when guest-history claim fails.
      scanStore.clearHistoryRecords({ preserveLocalCache: true });
    }
  };

  const login = async ({ identifier, password }) => {
    const guestToken = getStoredGuestToken();
    await loginRequest({ identifier, password });
    clearLegacyUserToken();
    persistUserSession(true);
    token.value = '__cookie__';
    const snapshot = await fetchMe();
    applyMeSnapshot(snapshot);
    await syncHistoryAfterAuthentication(guestToken);
    return snapshot;
  };

  const register = async ({ name, email, password }) => {
    const guestToken = getStoredGuestToken();
    const payload = { email, password };
    if (name?.trim()) {
      payload.name = name.trim();
    }
    await registerRequest(payload);
    try {
      await loginRequest({ identifier: email, password });
    } catch (error) {
      const err = new Error('Registration succeeded but sign-in failed. Please sign in again.');
      err.code = 'LOGIN_FAILED';
      throw err;
    }
    clearLegacyUserToken();
    persistUserSession(true);
    token.value = '__cookie__';
    try {
      const snapshot = await fetchMe();
      applyMeSnapshot(snapshot);
      await syncHistoryAfterAuthentication(guestToken);
      return snapshot;
    } catch (error) {
      const err = new Error('Sign-in succeeded but profile loading failed. Please retry.');
      err.code = 'ME_FAILED';
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Local logout can proceed even if the cookie clear request fails.
    } finally {
      clearLegacyUserToken();
      persistUserSession(false);
      token.value = '';
      user.value = null;
      persistUser(null);
      creditSnapshot.value = { total: 0, remaining: 0, used: 0 };
      clearGuestToken();
    }

    if (typeof window !== 'undefined') {
      try {
        const { useScanStore } = await import('./scan');
        useScanStore().clearHistoryRecords();
      } catch {
        // Ignore local history cleanup failures during logout.
      }
    }

    router.replace({ name: 'login' });
  };

  const updateCredits = (newCredits) => {
    if (!authToken.value) return;
    const parsedCredits = Number(newCredits);
    if (!Number.isFinite(parsedCredits)) return;
    if (!user.value) return;
    user.value = {
      ...user.value,
      credits: parsedCredits,
    };
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
      throw new Error('Please sign in before updating your profile.');
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

  const applySubscription = ({ plan, credits: nextCredits } = {}) => {
    if (!user.value) return;

    user.value = {
      ...user.value,
      plan: plan || user.value.plan || 'personal-free',
    };
    persistUser(user.value);

    if (nextCredits && typeof nextCredits === 'object') {
      setCredits(nextCredits);
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
    hasRestoredSession,
    hasResolvedUser,
    isSysAdmin,
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
