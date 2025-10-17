import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

const STORAGE_KEY = 'ai-detector-auth';
const USERS_STORAGE_KEY = 'ai-detector-users';

const staticUsers = [
  {
    id: 'static-test',
    username: 'test',
    email: 'test@veritascribe.dev',
    password: 'a123456',
    name: '测试用户',
  },
];

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const storedUsers = ref([]);

  const isAuthenticated = computed(() => Boolean(user.value));
  const allUsers = computed(() => [...staticUsers, ...storedUsers.value]);

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
    user.value = {
      email: account.email || `${account.username}@veritascribe.local`,
      name: displayName,
      username: account.username || '',
      lastLoginAt: new Date().toISOString(),
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
    };

    storedUsers.value = [...storedUsers.value, record];
    persistUsers();
    login({ identifier: normalizedEmail, password });
  };

  const logout = () => {
    user.value = null;
  };

  const requireAuthentication = () => isAuthenticated.value;

  if (typeof window !== 'undefined') {
    restoreSession();
    restoreUsers();
  }

  watch(user, persistSession, { deep: true });
  watch(storedUsers, persistUsers, { deep: true });

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    requireAuthentication,
  };
});
