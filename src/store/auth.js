import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

const STORAGE_KEY = 'ai-detector-auth';
const USERS_STORAGE_KEY = 'ai-detector-users';
const PROFILE_OVERRIDES_KEY = 'ai-detector-profile-overrides';
const CREDIT_STORAGE_KEY = 'ai-detector-credits';

const staticUsers = [
  {
    id: 'static-test',
    username: 'test',
    email: 'test@veritascribe.dev',
    password: 'a123456',
    name: '测试用户',
    plan: 'personal-free',
    profile: {
      firstName: 'Test',
      surname: 'User',
      organization: 'Veritascribe Labs',
      role: '内容创作者',
      industry: '教育与研究',
    },
  },
];

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const storedUsers = ref([]);
  const profileOverrides = ref({});
  const creditSnapshot = ref({ total: 10000, remaining: 6003 });

  const isAuthenticated = computed(() => Boolean(user.value));
  const allUsers = computed(() => [...staticUsers, ...storedUsers.value]);

  const getAccountIdentifier = (record) => {
    if (!record) return '';
    const email = record.email ? record.email.toLowerCase() : '';
    if (email) return email;
    const username = record.username ? record.username.toLowerCase() : '';
    if (username) return username;
    return record.id || '';
  };

  const buildProfile = (account) => {
    const baseProfile = {
      firstName: account?.profile?.firstName || account?.name || '',
      surname: account?.profile?.surname || '',
      organization: account?.profile?.organization || '',
      role: account?.profile?.role || '',
      industry: account?.profile?.industry || '',
    };
    const identifier = getAccountIdentifier(account);
    if (!identifier) {
      return baseProfile;
    }
    const override = profileOverrides.value[identifier];
    if (!override) {
      return baseProfile;
    }
    return {
      ...baseProfile,
      ...override,
    };
  };

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

  const restoreUsers = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        storedUsers.value = parsed.filter((item) => item && typeof item === 'object');
      }
    } catch (error) {
      console.error('Failed to restore stored users', error);
    }
  };

  const persistUsers = () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(storedUsers.value));
    } catch (error) {
      console.error('Failed to persist stored users', error);
    }
  };

  const restoreProfileOverrides = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(PROFILE_OVERRIDES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        profileOverrides.value = parsed;
      }
    } catch (error) {
      console.error('Failed to restore profile overrides', error);
    }
  };

  const persistProfileOverrides = () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(profileOverrides.value));
    } catch (error) {
      console.error('Failed to persist profile overrides', error);
    }
  };

  const restoreCredits = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(CREDIT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const { total, remaining } = parsed;
        creditSnapshot.value = {
          total: Number.isFinite(total) ? Number(total) : 10000,
          remaining: Number.isFinite(remaining) ? Number(remaining) : 6003,
        };
      }
    } catch (error) {
      console.error('Failed to restore credits', error);
    }
  };

  const persistCredits = () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(CREDIT_STORAGE_KEY, JSON.stringify(creditSnapshot.value));
    } catch (error) {
      console.error('Failed to persist credits', error);
    }
  };

  const setCredits = ({ total, remaining }) => {
    creditSnapshot.value = {
      total: Number.isFinite(total) ? Number(total) : creditSnapshot.value.total,
      remaining: Number.isFinite(remaining) ? Number(remaining) : creditSnapshot.value.remaining,
    };
  };

  const adjustCredits = (delta) => {
    if (!Number.isFinite(delta)) return;
    const nextRemaining = Math.max(0, Math.min(creditSnapshot.value.total, creditSnapshot.value.remaining + delta));
    creditSnapshot.value = { ...creditSnapshot.value, remaining: nextRemaining };
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

  const findUserByIdentifier = (identifier) => {
    if (typeof identifier !== 'string') return null;
    const normalized = identifier.trim().toLowerCase();
    if (!normalized) return null;
    return allUsers.value.find((record) => {
      const username = record.username ? record.username.toLowerCase() : '';
      const email = record.email ? record.email.toLowerCase() : '';
      return (username && username === normalized) || (email && email === normalized);
    });
  };

  const login = ({ identifier, password }) => {
    const account = findUserByIdentifier(identifier);
    if (!account) {
      throw new Error('账号不存在，请注册后再试。');
    }

    if (account.password && account.password !== password) {
      throw new Error('密码不正确，请重试。');
    }

    const displayName = account.name || account.username || account.email?.split('@')[0] || '用户';
    const profile = buildProfile(account);
    const plan = account.plan || 'personal-free';
    user.value = {
      email: account.email || `${account.username}@veritascribe.local`,
      name: displayName,
      username: account.username || '',
      lastLoginAt: new Date().toISOString(),
      plan,
      profile,
    };
  };

  const register = ({ email, name, password }) => {
    if (!email || !password) {
      throw new Error('请填写邮箱和密码。');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('请输入有效的邮箱。');
    }

    if (findUserByIdentifier(normalizedEmail)) {
      throw new Error('该邮箱已注册，请直接登录。');
    }

    const username = normalizedEmail.split('@')[0] || normalizedEmail;
    const record = {
      id: `user-${Date.now()}`,
      email: normalizedEmail,
      username,
      password,
      name: name?.trim() || username,
      plan: 'personal-free',
      profile: {
        firstName: name?.trim() || username,
        surname: '',
        organization: '',
        role: '',
        industry: '',
      },
    };

    storedUsers.value = [...storedUsers.value, record];
    persistUsers();
    login({ identifier: normalizedEmail, password });
  };

  const logout = () => {
    user.value = null;
  };

  const updateProfile = (payload) => {
    if (!user.value) {
      throw new Error('请先登录后再更新个人信息。');
    }

    const identifier = getAccountIdentifier(user.value);
    const currentProfile = user.value.profile || {};
    const updatedProfile = {
      ...currentProfile,
      ...payload,
    };
    user.value = {
      ...user.value,
      profile: updatedProfile,
      name:
        updatedProfile.firstName || updatedProfile.surname
          ? `${updatedProfile.firstName || ''}${updatedProfile.surname || ''}`.trim() || user.value.name
          : user.value.name,
    };

    if (identifier) {
      profileOverrides.value = {
        ...profileOverrides.value,
        [identifier]: updatedProfile,
      };
    }

    const index = storedUsers.value.findIndex((record) => getAccountIdentifier(record) === identifier);
    if (index >= 0) {
      const record = {
        ...storedUsers.value[index],
        profile: {
          ...(storedUsers.value[index].profile || {}),
          ...updatedProfile,
        },
        name:
          updatedProfile.firstName || updatedProfile.surname
            ? `${updatedProfile.firstName || ''}${updatedProfile.surname || ''}`.trim() || storedUsers.value[index].name
            : storedUsers.value[index].name,
      };
      const next = [...storedUsers.value];
      next.splice(index, 1, record);
      storedUsers.value = next;
    }
  };

  const requireAuthentication = () => isAuthenticated.value;

  if (typeof window !== 'undefined') {
    restoreSession();
    restoreUsers();
    restoreProfileOverrides();
    restoreCredits();
  }

  watch(user, persistSession, { deep: true });
  watch(storedUsers, persistUsers, { deep: true });
  watch(profileOverrides, persistProfileOverrides, { deep: true });
  watch(creditSnapshot, persistCredits, { deep: true });

  return {
    user,
    isAuthenticated,
    creditUsage,
    setCredits,
    adjustCredits,
    login,
    register,
    logout,
    updateProfile,
    requireAuthentication,
  };
});
