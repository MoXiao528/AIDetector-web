import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import router from '../router';
import { globalT } from '../i18n';
import { showToast } from '../utils/toast';
import {
  clearGuestToken,
  discardGuestSession,
  ensureGuestToken,
  fetchMe,
  getStoredGuestToken,
  login as loginRequest,
  logout as logoutRequest,
  previewGuestSession,
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
  let authenticationPromise = null;

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

  const showGuestMigrationError = (messageKey) => {
    showToast({
      title: globalT('auth.guestMigration.errorTitle'),
      message: globalT(`auth.guestMigration.${messageKey}`),
    });
  };

  const prepareGuestMigration = async () => {
    if (typeof window === 'undefined') return null;

    const { useScanStore } = await import('./scan');
    const scanStore = useScanStore();
    const localCount = scanStore.getPersistedLocalHistoryCount();
    const storedGuestToken = getStoredGuestToken();

    if (storedGuestToken) {
      let guestToken = '';
      try {
        guestToken = await ensureGuestToken();
        if (!guestToken) throw new Error('Guest session token is unavailable');
      } catch {
        clearGuestToken();
        return { available: false, guestToken: '', remoteCount: 0, localCount, scanStore };
      }

      try {
        const preview = await previewGuestSession(guestToken);
        if (!preview.active) {
          clearGuestToken();
          return { available: true, guestToken: '', remoteCount: 0, localCount, scanStore };
        }
        return {
          available: true,
          guestToken,
          remoteCount: preview.historyCount,
          localCount,
          scanStore,
        };
      } catch {
        return { available: false, guestToken, remoteCount: 0, localCount, scanStore };
      }
    }

    try {
      const preview = await previewGuestSession();
      if (!preview.active) {
        return { available: true, guestToken: '', remoteCount: 0, localCount, scanStore };
      }
      try {
        const guestToken = await ensureGuestToken();
        if (!guestToken) throw new Error('Guest session token is unavailable');
        return {
          available: true,
          guestToken,
          remoteCount: preview.historyCount,
          localCount,
          scanStore,
        };
      } catch {
        return { available: false, guestToken: '', remoteCount: preview.historyCount, localCount, scanStore };
      }
    } catch {
      return { available: false, guestToken: '', remoteCount: 0, localCount, scanStore };
    }
  };

  const migrateConfirmedLocalHistory = async (scanStore) => {
    let existingRecords;
    try {
      existingRecords = await scanStore.syncHistoryFromBackend({ strict: true });
    } catch {
      scanStore.clearHistoryRecords({ preserveLocalCache: true });
      showGuestMigrationError('syncFailed');
      return;
    }

    const migration = await scanStore.migrateLocalStorageToBackend({ existingRecords });
    await scanStore.syncHistoryFromBackend();
    if (migration?.failed?.length) {
      showGuestMigrationError('partialFailed');
    }
  };

  const settleGuestMigration = async (migration) => {
    if (!migration) return;
    const { available, guestToken, remoteCount, localCount, scanStore } = migration;
    if (!available) {
      scanStore.clearHistoryRecords({ preserveLocalCache: true });
      showGuestMigrationError('previewFailed');
      return;
    }

    if (remoteCount === 0 && localCount === 0) {
      try {
        await discardGuestSession(guestToken);
        clearGuestToken();
        scanStore.clearHistoryRecords();
      } catch {
        scanStore.clearHistoryRecords({ preserveLocalCache: true });
        showGuestMigrationError('discardFailed');
      }
      return;
    }

    const account = user.value?.email || user.value?.name || String(user.value?.id || '');
    let confirmed;
    try {
      confirmed = window.confirm(
        globalT('auth.guestMigration.prompt', {
          account,
          remoteCount,
          localCount,
        })
      );
    } catch {
      scanStore.clearHistoryRecords({ preserveLocalCache: true });
      showGuestMigrationError('previewFailed');
      return;
    }

    if (!confirmed) {
      try {
        await discardGuestSession(guestToken);
      } catch {
        scanStore.clearHistoryRecords({ preserveLocalCache: true });
        showGuestMigrationError('discardFailed');
        return;
      }
      clearGuestToken();
      scanStore.clearHistoryRecords();
      return;
    }

    if (guestToken) {
      try {
        await claimGuestHistory(guestToken);
      } catch {
        scanStore.clearHistoryRecords({ preserveLocalCache: true });
        showGuestMigrationError('claimFailed');
        return;
      }
      try {
        await discardGuestSession();
      } catch {
        showGuestMigrationError('cleanupFailed');
      }
    } else {
      try {
        await discardGuestSession();
      } catch {
        scanStore.clearHistoryRecords({ preserveLocalCache: true });
        showGuestMigrationError('discardFailed');
        return;
      }
    }

    clearGuestToken();
    await migrateConfirmedLocalHistory(scanStore);
  };

  const settleGuestMigrationSafely = async (migration) => {
    try {
      await settleGuestMigration(migration);
    } catch {
      migration?.scanStore?.clearHistoryRecords({ preserveLocalCache: true });
      showGuestMigrationError('syncFailed');
    }
  };

  const runAuthentication = (operation) => {
    if (authenticationPromise) return authenticationPromise;
    authenticationPromise = Promise.resolve()
      .then(operation)
      .finally(() => {
        authenticationPromise = null;
      });
    return authenticationPromise;
  };

  const login = ({ identifier, password }) =>
    runAuthentication(async () => {
      const guestMigration = await prepareGuestMigration();
      await loginRequest({ identifier, password });
      clearLegacyUserToken();
      persistUserSession(true);
      token.value = '__cookie__';
      const snapshot = await fetchMe();
      applyMeSnapshot(snapshot);
      await settleGuestMigrationSafely(guestMigration);
      return snapshot;
    });

  const register = ({ name, email, password }) =>
    runAuthentication(async () => {
      const guestMigration = await prepareGuestMigration();
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
      let snapshot;
      try {
        snapshot = await fetchMe();
        applyMeSnapshot(snapshot);
      } catch (error) {
        const err = new Error('Sign-in succeeded but profile loading failed. Please retry.');
        err.code = 'ME_FAILED';
        throw err;
      }
      await settleGuestMigrationSafely(guestMigration);
      return snapshot;
    });

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
